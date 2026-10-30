# Merge report: AWS_Hackathon_updated vs gramsahayak-final

Two packs of the same project were compared file by file. This report lists what each one had, what
was different, and what the consolidated repository does about it.

| | AWS_Hackathon_updated | gramsahayak-final |
|---|---|---|
| Files compared (excluding `node_modules`) | 150 | 162 |
| Byte-identical in both | 120 | 120 |
| Present in both but different | 23 | 23 |
| Only in this pack | 7 | 19 |

## Summary

The two packs are not versions of each other in one direction. They are complementary:

- **gramsahayak-final is the newer code.** About 6,200 lines were added to the backend and the Android
  app: a 56-entry knowledge base (was 12), a stale-knowledge change feed, a mixed-language number parser,
  a server-enforced read-back gate, multi-provider speech to text, the phone-side `KnowledgePack` and
  `NumberReadBack`, and two new test suites (131 and 89 checks).
- **AWS_Hackathon_updated holds the operational content that gramsahayak-final lacks:** the Render and
  App Runner deployment files, the deployment, API and Android guides, and current versions of the README
  and ARCHITECTURE document. gramsahayak-final's own README and ARCHITECTURE were the old "Coming soon"
  patch text and the original skeleton description (they still said most routes returned HTTP 501).

No code in AWS_Hackathon_updated is missing from gramsahayak-final. For every changed code file, the lines
that exist only in AWS_Hackathon_updated are rewrites that gramsahayak-final supersedes (for example the
single-provider voice controller became a provider chain; the plain `/api/query` handler gained
`auto` language and the read-back gate). The capabilities were checked, not assumed: the voice turn
endpoint, on-device speech recognition, the "speech not ready" fallbacks in three languages, and the
`answerFromKnowledge` entry point all still exist in the newer files.

## Added from AWS_Hackathon_updated (missing in gramsahayak-final)

| File | What it is | Treatment |
|---|---|---|
| `render.yaml` | Render blueprint (`rootDir: backend`, health check, env vars) | Added; env vars extended with `STT_PROVIDER`, `SARVAM_API_KEY`, `STT_HTTP_URL`, `STT_HTTP_API_KEY`, `PACK_MAX_AGE_DAYS` |
| `apprunner.yaml` | Optional AWS App Runner container config | Added unchanged |
| `docs/DEPLOYMENT.md` | Step-by-step deployment: Atlas, Render / App Runner / EC2, APK signing, troubleshooting | Added, then updated for the newer backend (see below) |
| `docs/API.md` | Endpoint reference with examples and error codes | Added, then extended with every new endpoint |
| `docs/ANDROID_GUIDE.md` | Opening the project, test targets, screens → endpoints, offline behaviour | Added, then updated for the new Android classes |
| `docs/ARCHITECTURE.md` | Current architecture, data model, answering pipeline, privacy | Used instead of gramsahayak-final's stale one, then extended |
| `.gitignore` | Also ignores `*.jks`, `*.keystore`, `keystore.properties`, `*.log`, `app/build/` | Used (superset of gramsahayak-final's); `.kotlin/` added |
| `docs/GramSahayak_Deployment_Guide.pdf`, `docs/GramSahayak_Update_Guide.pdf` | Two earlier PDF guides | Moved to `docs/archive/`: they describe the older "Coming soon" patch flow and 12-entry content, and are superseded by the Markdown guides in `docs/` |

## Kept from gramsahayak-final (new, missing in AWS_Hackathon_updated)

| File | What it adds |
|---|---|
| `backend/src/services/numbers.js` | Mixed-language numbers, fractions, non-Latin digits, ambiguous dates, yes/no parsing |
| `backend/src/services/freshness.js` | Pack fingerprint, per-entry freshness, "what changed since your download" |
| `backend/src/services/confirmations.js` | Single-use, device-bound, 10-minute read-back tokens |
| `backend/src/services/stt.js` | Sarvam and OpenAI-compatible speech-to-text clients |
| `backend/src/data/facts.js`, `knowledge-extra-1.js`, `knowledge-extra-2.js` | `asOf` / verify data and 44 additional trilingual entries |
| `backend/src/routes/numbers.routes.js`, `categories.routes.js` | `/api/numbers/*`, `/api/categories` |
| `backend/scripts/contract-test.js`, `hurdle-test.js`, `touch-entry.js` | The 131-check and 89-check suites and the demo helper |
| `android/.../data/KnowledgePack.kt`, `utils/NumberReadBack.kt` | Phone-side freshness tracking and offline number read-back |
| `docs/FRONTEND_CONTRACT.md`, `HURDLE_STALE_KNOWLEDGE_AND_READBACK.md` | Contract table and the hurdle write-up |
| `docs/RELEASE_NOTES.md` (was `FINAL_NOTES.md`) | What that iteration added, plus a demo script |

## Files present in both but different (23)

| File | Verdict |
|---|---|
| `backend/src/controllers/voice.controller.js` (+232 / −30) | gramsahayak-final: provider chain, `?transcript=` fallback, read-back gate on voice |
| `backend/src/controllers/query.controller.js` (+159 / −10) | gramsahayak-final: `auto` language, `requireConfirmation`, `POST /confirm` |
| `backend/src/services/retrieval.js` (+240 / −25), `answer.js` (+176 / −28) | gramsahayak-final: concept mapping across scripts and romanised words, freshness fields in answers |
| `backend/src/services/speech.js` (+81 / −27), `config/env.js` (+27), `.env.example` (+30 / −4) | gramsahayak-final: STT provider chain and its configuration |
| `backend/src/controllers/health.controller.js` (+59 / −4), `knowledge.controller.js` (+84) | gramsahayak-final: content counts, hurdle capabilities, manifest / pack / changes |
| `backend/src/data/seed-data.js` (+112 / −32) | gramsahayak-final: assembles 56 entries, adds facts and content hashes |
| `backend/src/routes/*` (health, index, knowledge, query) | gramsahayak-final: new routes mounted |
| `backend/package.json` | gramsahayak-final: `contract`, `verify`, `hurdles`, `touch` scripts |
| `backend/README.md` | gramsahayak-final (current) |
| Android `FeatureScreens.kt` (+390 / −49), `VirtualCallScreen.kt` (+150 / −36), `FeatureApi.kt` (+39), `SchemeDao.kt` (+3) | gramsahayak-final: read-back card, freshness banner, offline schemes fallback, new API calls |
| `README.md` | Neither. gramsahayak-final's was the old patch note and AWS_Hackathon_updated's predates the new features, so a new root README was written |
| `docs/ARCHITECTURE.md` | AWS_Hackathon_updated's version, extended with the new mechanisms |
| `.gitignore` | AWS_Hackathon_updated (superset) |

## Left out on purpose

| File | Why |
|---|---|
| `backend/src/controllers/placeholder.controller.js` | gramsahayak-final still carried it. It returned HTTP 501 for unimplemented features and nothing references it any more |
| `FILES.txt` | A manifest of the 20-file Android patch; meaningless in a full repository |
| `android/.../.kotlin/` | Empty compiler-session folder; now git-ignored |

## Kept as it was, and why

`android/RuralAssistant/local.properties` is the one machine-specific file in the folder. It holds your
Android SDK path and your Render URL (`API_BASE_URL`). It is git-ignored, and it is kept so the app keeps
pointing at your deployed backend. Delete it, or replace it from `local.properties.example`, if you move to
another computer.

## Documentation updated for the merged code

| Document | What changed |
|---|---|
| `docs/API.md` | Health payload (content, hurdles, speech chain); `/api/categories`; knowledge `manifest` / `pack` / `changes`; `language: "auto"`; read-back gate and `/api/query/confirm`; `/api/numbers/*`; voice turn parameters and confirmation; new error codes |
| `docs/DEPLOYMENT.md` | `npm run verify` (51 + 131 + 89); 56 seeded entries; speech Step 5 split into Sarvam, Whisper-compatible and AWS options; checks for read-back, mixed language and stale knowledge; new troubleshooting rows |
| `docs/ARCHITECTURE.md` | Speech provider chain, freshness and read-back mechanisms, new services and data fields, new Android classes |
| `docs/ANDROID_GUIDE.md` | Read-back card, freshness banner, offline schemes fallback, what is and is not cached |

## Verification performed

| Check | Result |
|---|---|
| Syntax of every backend `.js` file (`node --check`) | Pass |
| `npm run smoke` (51 endpoint checks) | 51 passed, 0 failed |
| `npm run contract` (131 screen-contract checks) | 131 passed, 0 failed |
| `npm run hurdles` (89 checks) | 89 passed, 0 failed |
| 32 extra checks written for this merge: every example in `docs/API.md` for the new endpoints | 32 passed, 0 failed |
| Seed data integrity: 56 / 10 / 6 entries, all with en + hi + kn text, no duplicate ids, every volatile entry has a verify pointer | Pass |
| Android: every `R.string` reference exists in `values/`, `values-hi/` and `values-kn/` (the eight `diag_*` strings are intentionally `translatable="false"`) | Pass |
| Android: new classes referenced consistently; `RECORD_AUDIO` permission present | Pass |
| `render.yaml` and `apprunner.yaml` parse as valid YAML | Pass |

**Two caveats.** The test environment had no network, so `npm install` could not run. The three suites were
executed against a small stand-in for `express`, `cors`, `dotenv` and `mongoose` (kept outside the
deliverable). They exercise all of the project's own logic, but you should run `npm install && npm run verify`
once on your machine to confirm against the real packages. And the Android app could not be compiled because
there is no Android SDK there: open it in Android Studio and let Gradle sync, which is the first real compile.
