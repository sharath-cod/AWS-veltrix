# GramSahayak backend

Express 4 API for the GramSahayak Android app. Node 18+.

```bash
cp .env.example .env    # MONGODB_URI optional: empty means the in-memory demo store
npm install
npm run smoke           # 51 endpoint checks, no external services needed
npm run dev             # http://localhost:5000
```

| Script | What it does |
|---|---|
| `npm start` | production boot (`node server.js`) |
| `npm run dev` | boot with `--watch` |
| `npm run seed` | upsert the trilingual demo dataset into MongoDB (`--force` to wipe first) |
| `npm run smoke` | in-process test of every endpoint against the in-memory store |

Layout:

```
server.js            boot sequence: config -> DB -> store -> speech -> express
src/app.js           middleware: CORS, raw audio, JSON, request log, routes, 404, errors
src/config/          env parsing/validation, mongoose connection + status
src/routes/          one router per resource under /api
src/controllers/     validation and response shaping
src/services/        retrieval, answer composition, scam rules, sms rules, speech, sigv4, http
src/store/           mongo store and in-memory store behind one interface
src/data/            seed-en.json, seed-i18n.js (hi/kn), seed-data.js, seed-db.js
scripts/             seed.js, smoke-test.js
```

Design notes:

- **Store abstraction.** `MONGODB_URI` set → Mongoose store; empty → in-memory store seeded at boot.
  Controllers never branch on the database.
- **No AWS SDK.** `services/aws-sigv4.js` signs requests with `node:crypto`, `services/http.js` uses
  `node:https`. Polly, Transcribe, S3 and Bedrock are called directly, keeping the image small.
- **Never fabricate.** If retrieval finds no entry, the API returns `grounded: false` and a fixed
  "no verified information" message per language.
- **Simulation is explicit.** SMS responses carry `simulated: true` and a `statusLabel`; numbers are
  stored masked.

See `../docs/API.md` for every endpoint and `../docs/DEPLOYMENT.md` for hosting.
