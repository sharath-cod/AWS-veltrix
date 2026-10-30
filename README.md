# Rural AI Assistant

Offline-first, multilingual (Kannada, Hindi, English) assistant for rural citizens: health help, government schemes, scholarships, reminders and scam protection. Native Android app + Node.js backend.

```
android/RuralAssistant/   Kotlin, Jetpack Compose, Material 3, MVVM, Room, Retrofit, WorkManager, DataStore
backend/                  Node.js, Express, MongoDB Atlas (Mongoose) -> deploy on Render
docs/                     Architecture notes
```

## Run the backend
```bash
cd backend
cp .env.example .env      # set MONGODB_URI (MongoDB Atlas)
npm install
npm run dev
curl localhost:5000/api/health
```

## Run the Android app
1. Open `android/RuralAssistant` in Android Studio (Ladybug or newer, JDK 17) and let Gradle sync.
2. Copy `local.properties.example` values into `local.properties` and set `API_BASE_URL`:
   - Emulator: `http://10.0.2.2:5000/` (default)
   - Physical phone over USB: `http://localhost:5000/` and run `adb reverse tcp:5000 tcp:5000`
   - Render: `https://YOUR-SERVICE.onrender.com/`
3. Run on a device/emulator (portrait). Settings > "Check backend" tests the connection.

## Phase status
Phase 1 (foundation) done. Business features (assistant, health, schemes, scholarships, reminders, scam checker, sync) are placeholders. See `docs/ARCHITECTURE.md`.
