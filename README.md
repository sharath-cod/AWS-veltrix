# GramSahayak — "Coming soon" patch

Turns the placeholder screens in your already-deployed project into the working, backend-connected
ones. Nothing else about your setup changes: same MongoDB, same Render service, same Android Studio
project.

You get two things:

- `android/app/…` — 20 files (5 new, 15 replaced) to copy into your existing Android project.
- `backend/` — the full API implementation, needed because the new screens call endpoints your
  currently deployed backend does not have.

---

## Step 0 — Know which backend you are running

Open this in a browser:

```
https://YOUR-SERVICE.onrender.com/api/schemes
```

- `{"success":false,"error":{"code":"NOT_IMPLEMENTED"}}` → you are on the old skeleton backend.
  **Do Step 1**, or every new screen will show an error.
- `{"success":true,"data":[…]}` → you already have the new backend. Skip to Step 2.

---

## Step 1 — Deploy the updated backend (5 minutes)

1. In your local repo, replace the `backend/` folder with the `backend/` folder from this pack.
2. Confirm `backend/.env` has at least:

```ini
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/gramsahayak?retryWrites=true&w=majority
```

   On Render you normally set these in **Dashboard → Environment** instead of a file. Add
   `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` only if you want the
   voice screen to return audio.
3. Commit and push. Render redeploys automatically (`npm ci` then `npm start`).
4. The API seeds itself on first boot when the collections are empty. To load it manually from your
   machine:

```bash
cd backend
npm install
npm run seed          # reads MONGODB_URI from backend/.env
```

5. Check:

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Expect `"storeMode":"mongo"`, `"database":"connected"`, and `features` all `true`.
Then confirm real data:

```bash
curl https://YOUR-SERVICE.onrender.com/api/schemes | head -c 200
```

If `storeMode` is `memory`, `MONGODB_URI` is missing on Render and your data will reset on every
restart — fix that before demoing.

---

## Step 2 — Back up your Android project

```bash
cd android/RuralAssistant
git add -A && git commit -m "before coming-soon patch"
```

(Or copy the whole `RuralAssistant` folder somewhere safe. This is the rollback point.)

---

## Step 3 — Copy the files

Copy the contents of this pack's `android/app` folder into your project's `app` folder, replacing
what is already there.

- **Windows:** select the `app` folder inside `android\` here → Ctrl+C → paste into
  `…\RuralAssistant\` → *Replace the files in the destination*.
- **macOS/Linux:**

```bash
cp -R patch/android/app/. /path/to/RuralAssistant/app/
```

The folder layout already matches yours, so paths land in the right place. Files copied:

| Status | File |
|---|---|
| new | `data/remote/api/FeatureApi.kt` |
| new | `ui/screens/features/FeatureScreens.kt` |
| new | `ui/screens/call/VirtualCallScreen.kt` |
| new | `ui/screens/sms/SmsScreen.kt` |
| new | `utils/DeviceId.kt` |
| replaced | `AndroidManifest.xml` (adds `RECORD_AUDIO`) |
| replaced | `data/remote/api/RuralApiService.kt` |
| replaced | `ui/navigation/AppNavHost.kt` |
| replaced | `ui/navigation/Screen.kt` |
| replaced | `ui/screens/assistant/AssistantScreen.kt` |
| replaced | `ui/screens/health/HealthScreen.kt` |
| replaced | `ui/screens/home/HomeScreen.kt` |
| replaced | `ui/screens/reminders/RemindersScreen.kt` |
| replaced | `ui/screens/scam/ScamCheckerScreen.kt` |
| replaced | `ui/screens/schemes/SchemesScreen.kt` |
| replaced | `ui/screens/scholarships/ScholarshipsScreen.kt` |
| replaced | `worker/SyncWorker.kt` |
| replaced | `res/values/strings.xml`, `values-hi/strings.xml`, `values-kn/strings.xml` |

**Do not copy** `build.gradle.kts`, `gradle/libs.versions.toml` or the Gradle wrapper — this pack
deliberately does not include them. Every dependency the new screens use (Retrofit + Gson converter,
OkHttp, Compose BOM 2024.10.01, material-icons-extended, activity-compose, lifecycle-compose) is
already in your project, so no Gradle change is needed.

Optional: delete `app/src/main/java/com/ruralassistant/app/ui/components/PlaceholderScreen.kt` — it is
no longer referenced. Leaving it also compiles fine.

---

## Step 4 — Point the app at your Render URL

`android/RuralAssistant/local.properties` (create it from `local.properties.example` if missing):

```properties
sdk.dir=C\:\\Users\\YOU\\AppData\\Local\\Android\\Sdk
API_BASE_URL=https://YOUR-SERVICE.onrender.com/
```

- HTTPS, and **keep the trailing slash**.
- Do not put a localhost URL here if you are testing against the deployed backend.
- If you test the backend on your laptop instead: emulator → `http://10.0.2.2:5000/`; USB phone →
  `http://localhost:5000/` plus `adb reverse tcp:5000 tcp:5000`.

---

## Step 5 — Build and run

1. Android Studio → **File → Sync Project with Gradle Files**.
2. **Build → Clean Project**, then **Build → Rebuild Project**. A clean build is worth it here: the
   old APK will keep showing "Coming soon" otherwise.
3. Run ▶ on the emulator or phone. Uninstall the previous app first if the home screen still looks
   old: `adb uninstall com.ruralassistant.app`.
4. Open **Settings → Check backend** → should read *Connected* with the database state.

---

## What each screen does now

Home shows 8 tiles (Assistant, Health, Schemes, Scholarships, Reminders, Scam Checker, SMS Centre,
Virtual Call); the bottom tabs are unchanged.

| Screen | Was | Now |
|---|---|---|
| Assistant | Coming soon | Type or speak a question, answer in your language with trusted sources, "Read answer aloud" |
| Health | Coming soon | Same assistant with `category=health` |
| Schemes | Coming soon | Search 10 schemes, open details (who can apply, how to apply), "Check general eligibility" with a document checklist |
| Scholarships | Coming soon | Search 6 scholarships, save/unsave per device |
| Reminders | Coming soon | Add, complete and delete reminders (date in ISO 8601, e.g. `2026-11-01T09:00:00+05:30`) |
| Scam Checker | Coming soon | Paste a message → HIGH/MEDIUM/LOW risk with reasons and what to do |
| SMS Centre | (not in app) | Demo send + history; clearly labelled simulation, number stored masked |
| Virtual Call | (not in app) | Start call, record, send, hear the reply — needs AWS speech configured, otherwise returns the text answer with a notice |

Settings also gains a working **Sync now**: queued offline operations are posted to `/api/sync`.

---

## Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| "Unable to connect to backend" | wrong `API_BASE_URL` | must be `https://…onrender.com/` with the trailing slash; re-sync Gradle after editing `local.properties` |
| First request hangs ~30 s | Render free tier cold start | open `/api/health` in a browser first |
| Still "Coming soon" | old APK or stale build | Clean + Rebuild, uninstall the old app, reinstall |
| "HTTP 501" or `NOT_IMPLEMENTED` | old backend still deployed | do Step 1 |
| Schemes/Scholarships empty | collections not seeded | `npm run seed`, or restart the service (auto-seeds when empty) |
| Answers say "no verified information" | question did not match the knowledge base | expected behaviour — it refuses to invent; try a health/scheme/scam question |
| Voice screen returns text only | no AWS credentials/bucket | fine for the demo; the Ask screen does on-device voice |
| Reminders say "invalid date" | date not ISO 8601 | use `2026-11-01T09:00:00+05:30` |
| Gradle error about missing symbol | a file was not copied | re-copy all 20 files, then Sync |

## Rollback

```bash
cd android/RuralAssistant
git checkout -- .        # or: git reset --hard <commit from Step 2>
```

Nothing in this pack changes your database schema, your Render service definition, or your Gradle
files, so rolling back the app is always safe.
