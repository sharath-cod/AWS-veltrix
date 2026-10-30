# Architecture

```
ONLINE   Android UI -> ViewModel -> Repository -> Retrofit -> Express (Render / AWS) -> MongoDB Atlas
OFFLINE  Android UI -> ViewModel -> Repository -> Room (local data)
SYNC     Room pending_sync -> WorkManager (SyncWorker, network-constrained) -> POST /api/sync -> Atlas
VOICE    Android MediaRecorder (mp4) -> POST /api/voice-sessions/:id/turns
         -> speech to text (Sarvam | Whisper-compatible | Amazon Transcribe, first configured wins)
         -> number/date read-back gate -> knowledge retrieval -> Amazon Polly -> base64 mp3 -> MediaPlayer
PACK     GET /api/knowledge/manifest + /changes -> KnowledgePack (Room + cached change list)
         -> "N answers re-checked since your copy" banner, shown online and offline
```

Rule that shapes everything: **a screen must never go blank because the backend is unreachable.**
Repositories read local state first and treat the network as an enhancement.

## Android (`com.ruralassistant.app`)

| Layer | Contents |
|---|---|
| `data/local` | Room (entities, DAOs, `AppDatabase`), DataStore preferences |
| `data/remote` | Retrofit `RuralApiService` (health, sync), `FeatureApi` (all feature endpoints), `ApiClient`, DTOs |
| `data/repository` | Repository implementations |
| `domain` | Models and repository interfaces |
| `ui` | Compose theme, components, navigation, screens, ViewModels |
| `worker` | `SyncWorker`, `SyncScheduler` |
| `data` (root) | `KnowledgePack` — tracks pack version, download date and the cached "what changed" list |
| `utils` | `ConnectivityMonitor`, `LocaleHelper`, `DeviceId`, `NumberReadBack` (offline number/date understanding and read-back) |

- DI is manual (`AppContainer`); no Hilt, no KSP-generated graph beyond Room.
- `minSdk 26`, `targetSdk 35`, JDK 17, Compose Material 3.
- The backend URL is a `BuildConfig` field read from `local.properties` (`API_BASE_URL=`) or
  `-PAPI_BASE_URL=`; default `http://10.0.2.2:5000/` (emulator to host).
- Navigation: bottom tabs Home, Ask, Schemes, Reminders, Settings. Health, Scholarships, Scam
  Checker, SMS Centre and Virtual Call open from Home tiles. System Back goes tab → Home → exit.
- Identity is anonymous: `DeviceId` generates a UUID once and sends it as `X-Device-Id`.
  No accounts, no phone numbers, no PII.

## Backend (`backend/`)

```
server.js                 boot: config -> DB -> store -> speech -> express
src/app.js                middleware order: CORS, raw audio, JSON, request log, routes
src/config/               env loading and validation, mongoose connection
src/routes/               one router per resource, mounted under /api
src/controllers/          request validation and response shaping
src/services/             retrieval, answer composition, freshness, numbers, confirmations, scam rules,
                          sms rules, speech facade, stt (Sarvam / HTTP), aws-speech, sigv4, http
src/store/                mongo store + in-memory store behind one interface
src/data/                 seed-en.json, seed-i18n.js, knowledge-extra-1/2.js, facts.js (asOf/verify data),
                          seed-data.js (assembles and localises), seed-db.js
scripts/                  seed, smoke-test, contract-test, hurdle-test, touch-entry
```

Two design decisions worth knowing:

1. **Store abstraction.** `src/store/index.js` returns the Mongo store when `MONGODB_URI` is set and
   an in-memory store seeded from `src/data/seed-data.js` otherwise. Same interface, so controllers
   never branch on the database. This is what makes `npm install && npm run dev` a complete demo.
2. **No SDKs for AWS.** `src/services/aws-sigv4.js` signs requests with `node:crypto` and
   `src/services/http.js` talks HTTP with `node:https`. Polly, Transcribe, S3 and Bedrock are called
   directly, which keeps the deployment package small and works on any Node 18+ host.

### Data model

| Collection | Key fields |
|---|---|
| `knowledge` | `id`, `category`, `tags`, `question{en,hi,kn}`, `answer{en,hi,kn}`, `sources[]`, `verified`, plus freshness fields `asOf`, `volatile`, `volatileFacts[]`, `verifyUrl`, `verifyAt`, `contentHash`, `updatedAt` |
| `schemes` | `id`, `category`, `tags`, `name/description/eligibility/apply` each `{en,hi,kn}`, `source`, `verified`, and the same freshness fields |
| `scholarships` | `id`, `provider`, `open`, `deadline`, `amount`, `name/description/eligibility/apply`, `verified`, and the same freshness fields |
| `savedscholarships` | `deviceId`, `scholarshipId` (unique pair) |
| `reminders` | `deviceId`, `title`, `type`, `remindAt`, `repeat`, `completed`, `clientId` |
| `smslogs` | `deviceId`, `toMasked`, `message`, `status`, `simulated: true` |
| `voicesessions` | `deviceId`, `language`, `status`, `turns[]` |

Every localisable field is `{ en, hi, kn }`; the client picks the user's language and falls back to
English, so a missing translation degrades instead of breaking.

### Answering a question

1. `services/numbers.js` reads the question first: amounts (including `dedh lakh`, `paune do hazaar`,
   Devanagari / Kannada digits), identifiers and ambiguous dates. Money words with no readable amount are
   reported instead of silently dropped.
2. With `language: "auto"`, `services/answer.js` detects the language of the question (script and
   romanised words) and answers in it.
3. `services/text.js` tokenises the question (Latin and Indic scripts, stopwords for en/hi/kn) and maps
   surface forms onto shared concepts (so `bukhar`, `बुखार`, `ಜ್ವರ` reach the same entry).
   `services/search-index.js` scores the question against a prebuilt inverted index and
   `services/retrieval.js` keeps the hits above a threshold. A question asked on the wrong screen falls
   back to the whole knowledge base instead of refusing.
4. No hit → a fixed "I do not have verified information" reply per language, `grounded: false`, with
   suggestions of what can be answered. The system never fabricates an answer.
5. A hit → the stored answer in the requested language, plus `trustedSources`, `confidence`, and the
   freshness block: `fact{asOf, volatile, verifyUrl, verifyAt}` and `recheck{changedSinceDownload}`.
6. If `BEDROCK_MODEL_ID` is set, Amazon Bedrock Converse rewrites the retrieved facts in simple language.
   If it fails or is not configured, the extractive answer is returned unchanged.

### Why an answer is fast (the retrieval index and the caches)

The first version of retrieval tokenised every field of every document on every question, and read the
whole knowledge base out of the store up to three times per request (retrieval, then the pack version,
then the freshness block). That worked at 56 entries and got worse with every entry added. The answer
path is now built around four small caches, none of which change what the user is told:

| Piece | File | What it saves |
|---|---|---|
| Inverted index | `services/search-index.js` | Each document is tokenised once. A question touches only the documents that share a word with it, instead of all of them. |
| Content snapshot | `store/catalog.js` | One read of knowledge / schemes / scholarships per TTL (`CATALOG_CACHE_TTL_MS`, 60 s) instead of a full read plus a deep copy per request. Writes are never cached. |
| Pack version | `services/freshness.js` | The SHA-1 over the whole corpus is computed once per content snapshot. Only `serverTime` is regenerated per call. |
| Repeat questions | `services/answer.js` | The base answer is memoised for `ANSWER_CACHE_TTL_MS` (5 min), keyed by content version, language, category and the question. The freshness block and the number read-back are still computed per request, because they depend on the device. |

Three rules keep the index honest as content grows:

- **The index is keyed by content, not by the array.** The snapshot is replaced every minute, so keying
  on the array would rebuild the index forever; keying on a signature of the entries means only a real
  content change rebuilds it.
- **Ties are broken by meaning, not by file order.** When two entries score the same, the one in the
  category the question looks like it belongs to wins, then the one whose *question* contains the rarer
  word. Without this, adding an entry could silently steal questions from an existing one.
- **The index is built at boot**, so the first user does not pay for it.

`npm run bench` prints the numbers on your machine. On the development machine used for this pack, with
83 entries and 14 schemes: **3.4 ms per unseen question** (down from 23.6 ms at 56 entries), 2-4 ms for a
repeat question, ~450 answers/second, and 80-110 ms of one-off indexing at boot.

### Stale knowledge and read-back (the three hurdles)

| Hurdle | Mechanism | Where |
|---|---|---|
| The phone's copy was correct on the day it was downloaded | Every entry carries `asOf`, `volatileFacts`, `verifyUrl`, `verifyAt`. `packVersion` is a content fingerprint. `/api/knowledge/changes` answers *what* changed since a download date. Timestamps are deterministic seed data, so a restart does not make every phone think everything changed | `services/freshness.js`, `data/facts.js`, `KnowledgePack.kt` |
| Rural users mix languages inside a sentence | `language: "auto"`, a number parser that understands fraction words and non-Latin digits, and detection that ignores number words shared by two languages | `services/answer.js`, `services/numbers.js`, `NumberReadBack.kt` |
| A misheard number can cost money | With `requireConfirmation: true`, the server withholds the answer and issues a single-use, device-bound, 10-minute token with the read-back prompt in en/hi/kn; `POST /api/query/confirm` (or the voice turn) releases it after a spoken or tapped yes. An unclear reply is never treated as yes. Old clients that do not send the flag see the previous behaviour unchanged | `services/confirmations.js`, `controllers/query.controller.js`, `controllers/voice.controller.js` |

### Speech

- Speech to text is tried in this order under `STT_PROVIDER=auto`, and the first configured provider wins;
  an explicit value forces one provider. If one fails, the next is tried.
  1. **Sarvam AI** (`SARVAM_API_KEY`): Indian languages, one HTTPS call, no storage bucket.
  2. **OpenAI-compatible `/audio/transcriptions`** (`STT_HTTP_URL`, `STT_HTTP_API_KEY`): Whisper, Groq or
     a self-hosted server. `services/stt.js` builds the multipart body by hand, so no extra dependency.
  3. **Amazon Transcribe**: the clip is uploaded to S3, `StartTranscriptionJob` runs with
     `MediaFormat=mp4` and the language code, `GetTranscriptionJob` is polled until `COMPLETED`
     (default 25 s cap), the transcript is fetched, and the S3 object is deleted.
- Text to speech: Polly `SynthesizeSpeech`, voice Kajal (neural) for `en-IN`, `hi-IN`, `kn-IN`. It needs
  AWS credentials; without them a voice turn returns the text answer, which the app displays.
- If no speech-to-text provider is configured, the turn says so in the user's language and still accepts
  `?transcript=<what the phone heard>`, so the conversation gets an answer.
- Anything unavailable returns a text answer plus a `notice` explaining why, never a silent failure.
  `/api/health` lists `speech.chain` so Settings can tell the user what will work.

### Sync

`POST /api/sync` takes up to 200 operations of the form
`{ id, entityType, entityId, operation, payload, createdAt }`, applies `reminder` and
`scholarship_saved` operations idempotently (reminder `clientId` dedupe), and returns
`accepted[]` / `rejected[]`. `SyncWorker` deletes the accepted rows from Room and returns
`Result.retry()` on network failure.

## Security and privacy

- No user accounts, no personal data, no location. A random device UUID is the only identifier.
- Scam checks are stateless: the pasted message is analysed and discarded.
- SMS numbers are stored masked (`+91 ******3210`) and never sent anywhere.
- Secrets live only in the backend `.env`; the Android app ships no API keys.
- Pending read-back confirmations are held in memory only, bound to the device id, single use and expire after 10 minutes.
- CORS is locked to `CORS_ORIGIN` in production; native clients send no `Origin` header.
- `helmet`-style hardening is out of scope for the demo; add it before public traffic.
