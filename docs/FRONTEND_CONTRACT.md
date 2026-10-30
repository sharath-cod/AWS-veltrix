# Frontend ↔ backend contract

Every screen in the Android app talks to this backend. This document lists, screen by
screen, the call the app makes and the fields it reads, so a change on either side can be
checked against it. `npm run contract` replays all of it and fails if a field disappears.

Run it with no AWS account, no API key and no open port:

```bash
cd backend
npm install
npm run contract     # 131 checks
npm run hurdles      # 89 checks for the three hurdle hints
npm run call         # 66 checks for the AI call, including the 108 redirects
npm run smoke        # 51 endpoint checks
```

## Screen by screen

| Screen (Compose) | Call | Fields the screen reads |
|---|---|---|
| Settings → Check backend | `GET /api/health` | `storeMode`, `database`, `features.*`, `speech.chain`, `content.knowledge` |
| Assistant / Ask | `POST /api/query` (sends `language: "auto"`, `requireConfirmation: true`) | `data.answer`, `data.answerLanguage`, `data.grounded`, `data.trustedSources[].name`, `data.verifyBeforeActing`, `data.staleNotice`, `data.freshness`, `data.fact{asOf,volatile,verifyUrl,verifyAt}`, `data.recheck{changedSinceDownload,message}`, `data.answerNumbers`, `data.answerSpeech[]`, `data.youSaid` |
| Ask → read-back card | `POST /api/query/confirm` | `data.confirmed`, `data.cancelled`, `data.retry`, `data.confirmedNumbers[]`, `data.message` |
| (new) spoken yes/no | `POST /api/numbers/confirm` | `data.confirmed` (true / false / null), `data.matched` |
| (new) read-back preview | `POST /api/numbers/readback` | `data.numbers[]`, `data.dates[]`, `data.requiresConfirmation`, `data.confirmationPrompt{en,hi,kn}`, `data.dominantLanguage` |
| (new) what changed | `GET /api/knowledge/changes?downloadedAt=&have=` | `data.changedCount`, `data.changes[].{id,title,asOf,changedFields,verifyUrl,summary{en,hi,kn}}` |
| Health | `POST /api/query` with `category=health` | same as Ask |
| Schemes list | `GET /api/schemes?q=` | `count`, `data[].id`, `name{en,hi,kn}`, `description`, `eligibility`, `apply` |
| Schemes → eligibility | `POST /api/schemes/check` | `data.summary`, `data.documents[]`, `data.results[].{name,status}` |
| Scholarships | `GET /api/scholarships?q=&open=true` | `count`, `data[].{id,name,description}` |
| Scholarships → save / unsave | `POST /api/scholarships/saved`, `DELETE /api/scholarships/saved/{id}` | `data.saved`, `data.removed` |
| Scholarships → saved list | `GET /api/scholarships/saved` | `data[].id` |
| Reminders | `GET/POST/PUT/DELETE /api/reminders` | `data[].{id,title,remindAt,completed}` |
| Scam checker | `POST /api/scam-check` | `data.riskLevel`, `data.reasons[].text`, `data.advice` |
| SMS centre | `POST /api/sms/preview`, `POST /api/sms/send`, `GET /api/sms` | `data.allowed`, `data.statusLabel`, `data.simulated`, `data.toMasked`, history rows |
| Home → call logo | `POST /api/calls` | `data.id`, `data.status`, `data.language`, `data.greeting.text`, `data.greeting.language`, `data.pickupDelayMs`, `data.supportedLanguages`, `data.contentLanguages` |
| Call → one turn | `POST /api/calls/{id}/turns?transcript=…` (or raw `audio/mp4`) | `data.transcript`, `data.answer`, `data.language`, `data.kind`, `data.urgency`, `data.redirect.numbers[]{number,label}`, `data.endCall`, `data.answerSpeech`, `data.grounded` |
| Call → read back | `GET /api/calls/{id}` | `data.status`, `data.turns[]` |
| Call → hang up | `DELETE /api/calls/{id}` | `data.status`, `data.durationSeconds`, `data.farewell` |
| Virtual call (old screen) → start | `POST /api/voice-sessions` | `data.id`, `data.canTranscribe`, `data.speech` |
| Virtual call → turn | `POST /api/voice-sessions/{id}/turns?language=xx&confirm=true` (raw `audio/mp4`) | `data.transcript`, `data.answer`, `data.audio` (base64 mp3), `data.grounded`, `data.requiresConfirmation`, `data.confirmationToken` |
| Virtual call → confirm | same turn with `&confirmationToken=…&transcript=haan` | `data.confirmed`, `data.confirmedNumbers[]`, `data.cancelled`, `data.retryConfirmation` |
| Virtual call → end | `DELETE /api/voice-sessions/{id}` | `data.status` |
| Offline outbox (SyncWorker) | `POST /api/sync` | `data.acceptedCount`, `data.rejectedCount`, `data.accepted[]` |
| Offline pack | `GET /api/knowledge/manifest`, `GET /api/knowledge/pack`, `GET /api/knowledge` | `packVersion`, `contentAsOf`, `freshness.status`, `freshness.message{en,hi,kn}`, `schemes[]`, `knowledge[]` |
| Read-back of numbers | `POST /api/numbers/readback` | `data.count`, `data.numbers[]`, `data.confirmationPrompt{en,hi,kn}` |
| (new) phase list | `GET /api/categories` | `data[].{id,label{en,hi,kn},entries}` |

Device identity is the `X-Device-Id` header, sent by every call that stores something
(reminders, saved scholarships, SMS history, sync, voice sessions).

## What the contract test proves

1. **Every screen call works** in the exact shape the Kotlin sends it — headers, bodies,
   raw audio, query parameters.
2. **The assistant answers in all three languages.** 21 questions covering all ten phases
   are asked in English, Hindi and Kannada (63 answers). Each must be grounded, come from
   the expected entry, and come back in the requested script — Devanagari for `hi`,
   Kannada for `kn`.
3. **Romanised questions work** (`bukhar hai kya karu`, `jwara ide enu madbeku`,
   `saanp ne kaata`), because that is how people actually type.
4. **The wrong shelf does not dead-end.** A scholarship question asked on the Health
   screen (`category=health`) is answered from the whole knowledge base.
5. **Speech to text runs end to end.** A stand-in OpenAI-compatible provider is started
   inside the test; recorded audio goes in, the transcript comes back on the screen, and
   that transcript is answered. The Sarvam request shape (`api-subscription-key` header,
   multipart `file`, `model`, `language_code=kn-IN`) is checked the same way.
6. **A turn follows the language the app asks for** (`?language=kn` on an `en` session
   answers in Kannada).
7. **A transcript-only turn** (`?transcript=...`) still gets an answer, which is the
   fallback when no speech provider is configured.
8. **Nothing is invented**: an unrelated question returns `grounded: false`.
9. **Numbers are read back** with a confirmation prompt in all three languages.
10. **Freshness works**: a stale pack is reported as `stale` with a trilingual message.

## Hurdle behaviour (see `HURDLE_STALE_KNOWLEDGE_AND_READBACK.md`)

- `npm run hurdles` proves the change feed (`/api/knowledge/changes`), per-fact `asOf` and
  `verifyUrl`, `language: "auto"`, fraction words (`dedh`, `paune do`, `sava`), Devanagari and
  Kannada digits, ambiguous dates, spoken yes/no in three languages, and the server-side
  read-back gate — including that a token cannot be reused, that "no" cancels, and that the
  voice path holds the answer until the user confirms.
- Without `requireConfirmation` every response is byte-for-byte the old shape, so an older APK
  keeps working.

## The call

`npm run call` proves the call flow: the greeting comes back in the caller's language
(including Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi and Urdu), small
talk is answered as conversation, a greeting followed by a question is still answered from
the knowledge base, an amount in the question is read back, audio turns are transcribed,
and — the safety rule — chest pain, bleeding, fits, a snake bite or thoughts of self-harm
come back as `kind: "emergency"` / `"mental-health-crisis"` with `redirect.numbers`
containing 108 (and 14416), in the language asked, with safe first aid. A dose question
(`kind: "dose-refusal"`) and a medical question with no verified answer
(`kind: "medical-uncertain"`) point at 104 instead of guessing.

## Response envelope

Every response is one of:

```json
{ "success": true, "data": {}, "count": 1, "meta": {} }
{ "success": false, "error": { "message": "…", "code": "INVALID_QUESTION" } }
```

Lists use `data` (array) plus `count` and `meta`. Single objects use `data`. The Android
code reads `data`, so a field added inside `data` is always backward compatible.
