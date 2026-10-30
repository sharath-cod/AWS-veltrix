# GramSahayak — Rural AI Assistant

Offline-first, trilingual (Kannada, Hindi, English) assistant for rural citizens: health guidance,
government schemes, scholarships, reminders, scam protection, an SMS demo centre and a voice call.
One repository, two apps:

```
android/RuralAssistant/   Kotlin + Jetpack Compose app (MVVM, Room, Retrofit, WorkManager, DataStore)
backend/                  Node.js + Express API (MongoDB Atlas, or a zero-setup in-memory store)
docs/                     Architecture, API reference, deployment, Android guide, contract, hurdle write-up
render.yaml               One-click hosting blueprint for Render
apprunner.yaml            Optional AWS App Runner config (container build)
```

This is the consolidated repository. It combines the deployment-ready pack (`AWS_Hackathon_updated`:
hosting files, deployment/API/Android guides) with the newest implementation (`gramsahayak-final`:
83-entry knowledge base, stale-knowledge feed, number read-back, multi-provider speech to text).
`docs/MERGE_REPORT.md` lists every difference found and how it was resolved.

## What works end to end

| Screen | Backend | Notes |
|---|---|---|
| Ask / Health | `POST /api/query` | Retrieval over 83 trilingual entries in 10 phases, trusted sources, `grounded` flag, `language: "auto"`, optional Bedrock rewrite |
| Ask → read-back card | `POST /api/query/confirm` | Amounts, IDs and ambiguous dates are read back before the answer is released |
| Schemes | `GET /api/schemes`, `POST /api/schemes/check` | Search, details, indicative eligibility first pass |
| Scholarships | `GET /api/scholarships`, `/saved` | Save and unsave per device |
| Reminders | `GET/POST/PUT/DELETE /api/reminders` | Idempotent on `clientId`, so offline retries do not duplicate |
| Scam checker | `POST /api/scam-check` | 10 explainable rules, en/hi/kn reasons and advice |
| SMS Centre | `/api/sms/*` | Simulation only — nothing is ever delivered to a handset |
| Virtual call | `/api/voice-sessions` | Speech to text via Sarvam, any Whisper-compatible endpoint, or Amazon Transcribe; Polly for spoken replies |
| Offline pack | `GET /api/knowledge/manifest`, `/pack`, `/changes` | The phone can tell *which* answers changed since its copy was downloaded |
| Sync | `POST /api/sync` | `SyncWorker` drains the Room outbox when the network returns |
| Settings | `GET /api/health` | Reports store mode, speech providers, content counts and the three hurdle capabilities |

Seed content: **14 schemes, 8 scholarships and 83 knowledge entries**, each written in English, Hindi
and Kannada. Every record is marked `verified: false` on purpose — confirm with the official portal
before quoting an amount or a deadline.

### What the October 2026 enhancement changed

**More information.** 27 new knowledge entries and 4 new schemes (e-Shram, PM Vishwakarma, Jal Jeevan
Mission, PM Surya Ghar) plus 2 scholarships (NMMSS, post-matric for students with disabilities), all
written in English, Hindi and Kannada: 83 entries in total across the ten phases. The new entries cover
what rural users asked for and the pack did not answer — dog bites and rabies, safe delivery, child
nutrition, first aid, teleconsultation, tap water, solar, disability entitlements, birth and death
certificates, voter ID, name mismatches across documents, livestock, natural farming, weather advisory,
UPI safety, post office savings, skill training, open schooling, storms and lightning, RTI, free legal
aid, grievance escalation and the Gram Sabha. Each one carries the same freshness metadata as before,
and none of them states an amount or a fee as fact: those are the numbers that change, so the entry
tells the reader where to confirm.

**A faster agent.** Retrieval now runs on an inverted index built once per content version instead of
re-tokenising every entry per question, and the answer path caches the content snapshot, the pack
version and repeat questions. On the development machine that is **3.4 ms per unseen question against
23.6 ms before, with 48% more content**, and about 450 answers/second. `npm run bench` reproduces it.

**A database that tells the truth.** The MongoDB schemas did not declare `asOf`, `volatile`,
`volatileFacts`, `verifyUrl` or `verifyAt`, so Mongoose silently dropped them and the stale-knowledge
feature only worked on the in-memory store. They are declared now, `updatedAt` is no longer overwritten
with the row-write time, and the indexes the list and change-feed queries actually use are in place.
Seeding on boot compares the stored counts with the seed and upserts when they differ, so a database
created before a content update no longer keeps serving the old knowledge base.

### The three hurdles (stale knowledge, mixed language, misheard numbers)

1. **Stale knowledge.** Every entry carries `asOf`, `volatileFacts`, `verifyUrl` and `verifyAt`;
   `/api/knowledge/changes` returns what was re-checked after the phone's download.
2. **Mixed language.** `language: "auto"` replies in the language of the question; the number parser
   understands `dedh lakh`, `paune do hazaar`, Devanagari/Kannada digits and romanised words.
3. **Misheard numbers.** With `requireConfirmation: true` the server holds the answer, returns a
   single-use token and the read-back prompt in all three languages, and releases it on a spoken
   *haan / haudu / yes*.

Details: [docs/HURDLE_STALE_KNOWLEDGE_AND_READBACK.md](docs/HURDLE_STALE_KNOWLEDGE_AND_READBACK.md).

## Quick start (5 minutes, no cloud account needed)

```bash
cd backend
cp .env.example .env      # leave MONGODB_URI empty for the in-memory demo store
npm install
npm run verify            # 53 smoke + 161 screen-contract + 89 hurdle checks
npm run bench             # answer latency and index/cache diagnostics
npm run dev               # http://localhost:5000/api/health
```

Then open `android/RuralAssistant` in Android Studio (JDK 17, SDK 35), copy
`local.properties.example` to `local.properties` and run on an emulator. The default
`API_BASE_URL=http://10.0.2.2:5000/` points at your laptop; set it to your Render URL for a
deployed backend (HTTPS, with the trailing slash).

Full instructions, including MongoDB Atlas, Render, AWS and signing a release APK:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Documentation

| File | What it covers |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local run, Atlas, Render / App Runner / EC2, speech providers, APK build, verification list, troubleshooting |
| [docs/API.md](docs/API.md) | Every endpoint with request and response examples, error codes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, offline-first rules, data model, answer pipeline, hurdle mechanisms |
| [docs/ANDROID_GUIDE.md](docs/ANDROID_GUIDE.md) | Opening and running the app, screens → endpoints, voice, offline behaviour |
| [docs/FRONTEND_CONTRACT.md](docs/FRONTEND_CONTRACT.md) | Screen-by-screen contract and what `npm run contract` proves |
| [docs/HURDLE_STALE_KNOWLEDGE_AND_READBACK.md](docs/HURDLE_STALE_KNOWLEDGE_AND_READBACK.md) | The three hurdles, hint by hint |
| [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) | What the `gramsahayak-final` iteration added, plus a five-minute demo script |
| [docs/MERGE_REPORT.md](docs/MERGE_REPORT.md) | The comparison of the two source packs and every decision made |
| `docs/archive/` | Earlier PDF guides, kept for reference (they describe the older "Coming soon" patch flow) |

## Honest limitations

- Answers come from a seeded knowledge base, not a live government database. `asOf` dates describe
  when the content was reviewed; nothing is invented when no entry matches — the API says so.
- Retrieval is keyword based, so two entries in one phase can both be reasonable answers. Set
  `BEDROCK_MODEL_ID` to have a model rephrase the retrieved text.
- Speech to text needs one provider key (Sarvam, a Whisper-compatible endpoint, or AWS keys plus an S3
  bucket). Spoken replies need Amazon Polly. Without them the voice screen returns the text answer
  and a clear notice, and the Ask screen keeps working with on-device speech.
- SMS is a simulation. There is no gateway and no delivery.
- The Android app has not been compiled in the environment that assembled this repository (no
  Android SDK there). Open it in Android Studio and let Gradle sync before demo day.
- The backend test suites were executed against a minimal stand-in for Express because the assembling
  environment had no network. Run `npm install && npm run verify` once on your machine to confirm
  against the real packages.
- The demo is safe to show, not yet hardened for strangers: add `helmet` and rate limiting before
  public traffic (see the end of `docs/DEPLOYMENT.md`).
