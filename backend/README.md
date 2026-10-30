# GramSahayak backend

Express 4 API for the GramSahayak Android app. Node 18+.

```bash
cp .env.example .env    # MONGODB_URI optional: empty means the in-memory demo store
npm install
npm run smoke           # 51 endpoint checks
npm run contract        # 131 checks that replay every screen in the app
npm run hurdles         # 89 checks for the stale-knowledge / mixed-language / read-back hurdle
npm run dev             # http://localhost:5000
```

| Script | What it does |
|---|---|
| `npm start` | production boot (`node server.js`) |
| `npm run dev` | boot with `--watch` |
| `npm run seed` | upsert the trilingual dataset into MongoDB (`--force` to wipe first) |
| `npm run smoke` | in-process test of every endpoint against the in-memory store |
| `npm run contract` | replays every Android screen call, all three languages, plus a stand-in speech provider |
| `npm run hurdles` | the three hurdle hints: change feed, mixed-language parsing, read-back gate |
| `npm run verify` | smoke + contract + hurdles |
| `npm run touch -- <id>` | demo helper: mark one entry as re-checked so it appears in the change feed |

## What answers questions

The assistant is retrieval over a seeded knowledge base of **83 entries in 10
phases**, every entry written in English, Hindi and Kannada:

| Phase | Entries | Examples |
|---|---|---|
| health | 10 | fever, diarrhoea, pregnancy, TB, BP/sugar, anaemia, immunisation, snake bite, heat stroke, mental health |
| schemes | 8 | PM-KISAN, Ayushman, pension, MGNREGA, Ujjwala, housing, farmer & ration queries |
| scholarships | 8 | NSP, pre-matric, post-matric, girls, minority, rejected applications |
| scam | 6 | OTP/KYC/UPI fraud, loan apps, fake officers, where to report |
| agriculture | 5 | crop insurance, soil health card, Kisan credit card, mandi, pests |
| documents | 4 | Aadhaar, caste certificate, income certificate, ration card |
| emergency | 4 | ambulance, floods, fire and burns, women and child safety |
| finance | 4 | Jan Dhan account, DBT status, SHG/Mudra loans, PMJJBY/PMSBY |
| education | 3 | RTE free seats, school facilities, re-admission after dropping out |
| general | 4 | Gram Panchayat, land records, helplines, documents |

Retrieval understands mixed input: a question can be in English, Hindi in
Devanagari, Kannada script, or romanised ("bukhar hai kya karu", "jwara ide enu
madbeku") and still reach the right entry, because `services/retrieval.js` maps
those surface forms onto shared concepts. A question asked on the wrong screen
(for example a scholarship question inside the Health screen) falls back to the
whole knowledge base instead of refusing.

## Stale knowledge and read-back

Three hints, three mechanisms (details in `../docs/HURDLE_STALE_KNOWLEDGE_AND_READBACK.md`):

1. **The info was correct on the day it was downloaded.** Every entry carries `asOf`,
   `volatileFacts`, `verifyUrl` and `verifyAt`. `GET /api/knowledge/changes?downloadedAt=`
   returns exactly what was re-checked since that date, with a trilingual summary, so the app
   says *which* answer changed and where to verify it — not just "your copy is old".
2. **Rural users mix languages.** `language: "auto"` answers in the language of the question.
   The number parser understands fractions (`dedh lakh`, `paune do hazaar`), Devanagari and
   Kannada digits, and currency words in any script.
3. **A misheard number costs money.** The read-back gate is on the server:
   `POST /api/query` with `requireConfirmation: true` holds the answer and returns a token;
   `POST /api/query/confirm` releases it after `confirmed: true` or a spoken `haan` / `haudu` /
   `illa`. Ambiguous dates (`01/11/2026`) are read back both ways. Voice turns do the same.

## Speech to text

`services/speech.js` picks the first configured provider:

1. **Sarvam AI** (`SARVAM_API_KEY`) — Indian languages, one HTTPS call.
2. **Any OpenAI-compatible endpoint** (`STT_HTTP_URL`, `STT_HTTP_API_KEY`) — Whisper, Groq, self-hosted.
3. **Amazon Transcribe** (AWS keys + `AWS_S3_BUCKET`).

Spoken replies use Amazon Polly when AWS credentials exist; otherwise the voice
turn returns the text answer, which the Android screen already handles. If no
provider is configured, the turn says so in the user's language and also accepts
`?transcript=<what the phone heard>`, so the conversation still gets an answer.

`GET /api/health` reports `features.speechToText`, the provider chain and the
content counts, so the app's Settings screen can tell the user what will work.

## Layout

```
server.js            boot sequence: config -> DB -> store -> speech -> express
src/app.js           middleware: CORS, raw audio, JSON, request log, routes, 404, errors
src/config/          env parsing/validation, mongoose connection + status
src/routes/          one router per resource under /api
src/controllers/     validation and response shaping
src/services/        retrieval, answer, freshness, numbers, confirmations, scam, sms, speech, stt, sigv4, http
src/store/           mongo store and in-memory store behind one interface
src/data/            seed-en.json, seed-i18n.js, knowledge-extra-1/2.js, facts.js, seed-data.js, seed-db.js
scripts/             seed.js, smoke-test.js, contract-test.js, hurdle-test.js, touch-entry.js
```

Design notes:

- **Store abstraction.** `MONGODB_URI` set → Mongoose store; empty → in-memory store seeded at boot.
  Controllers never branch on the database.
- **No AWS SDK, no HTTP dependency.** `services/aws-sigv4.js` signs requests with `node:crypto`,
  `services/http.js` uses `node:https`, `services/stt.js` builds multipart by hand.
- **Never fabricate.** If retrieval finds no entry, the API returns `grounded: false` and a fixed
  "no verified information" message per language, plus suggestions of questions it can answer.
- **Simulation is explicit.** SMS responses carry `simulated: true` and a `statusLabel`; numbers are
  stored masked.

See `../docs/FRONTEND_CONTRACT.md` for the screen-by-screen endpoint mapping
(and how `npm run contract` verifies it) and `../docs/ARCHITECTURE.md` for the
overall design.
