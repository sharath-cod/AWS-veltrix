# Offline-First Multilingual AI Assistant for Rural Citizens

A native Android application that gives rural citizens access to health information, government schemes, scholarships, reminders and scam/fraud checks in **English, Kannada and Hindi** and keeps working when there is **no internet at all**.

Data is stored locally first, and automatically synchronized with the cloud whenever a connection becomes available.

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Multilingual | English, Kannada and Hindi, switchable at runtime |
| 2 | AI Assistant | Conversational help, with an offline fallback over bundled data |
| 3 | Health Information | Basic health guidance and awareness content |
| 4 | Government Schemes | Browse central and state schemes |
| 5 | Eligibility Checker | Check which schemes a citizen qualifies for |
| 6 | Scholarships | Discover scholarships and their requirements |
| 7 | Reminders | Local reminders for deadlines, appointments and applications |
| 8 | Scam / Fraud Checker | Check suspicious messages, calls and offers |
| 9 | Offline Mode | Core features work with zero connectivity |
| 10 | Automatic Sync | Pending local changes sync in the background |

---

## Tech Stack

### Android
- Kotlin
- Jetpack Compose + Material 3
- MVVM architecture
- Room Database
- WorkManager
- Retrofit + OkHttp
- Kotlin Coroutines + Flow
- DataStore

### Backend
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- REST API
- Hosted on Render

---

## Architecture

The app is **offline-first**: the UI reads from the local database, and the network is only used to keep that database in sync.

```
ONLINE
Android -> Retrofit -> Render -> Node/Express -> MongoDB Atlas

OFFLINE
Android -> Repository -> Room Database

SYNC
Room (pending data) -> WorkManager -> Render API -> MongoDB Atlas
```

### Offline-first principles
1. The UI observes Room through `Flow`; it never reads directly from the network.
2. Writes go to Room first and are marked as pending, then pushed by WorkManager.
3. Schemes, health info, scholarships, eligibility rules and scam-check data ship as bundled seed data, so the app is useful on first launch without internet.
4. All UI text lives in Android string resources for English, Kannada and Hindi.
5. When the AI API is unreachable, the assistant falls back to local search over bundled content.

---

## Project Structure

```
.
├── android/            # Android app (Kotlin, Jetpack Compose)
│   └── app/src/main/
│       ├── data/       # Room, DAOs, Retrofit, repositories, DataStore
│       ├── domain/     # Models and use cases
│       ├── ui/         # Compose screens, ViewModels, theme
│       └── worker/     # WorkManager sync workers
├── backend/            # Node.js + Express API
│   ├── models/         # Mongoose schemas
│   ├── routes/         # REST routes
│   └── server.js
└── docs/               # API contract and notes
```

> Adjust folder names to match the actual repository layout.

---

## Getting Started

### Prerequisites
- Android Studio (latest stable)
- JDK 17
- Node.js 18+ and npm
- A MongoDB Atlas cluster

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
```

Run locally:

```bash
npm start
```

Deploy to Render by connecting this repository, setting the root directory to `backend`, the build command to `npm install`, the start command to `npm start`, and adding the environment variables above.

### Android setup

1. Open the `android` folder in Android Studio.
2. Set the backend base URL (local or Render) in the app's build config.
3. Sync Gradle, then run on an emulator or device.

```bash
./gradlew assembleDebug
./gradlew test
```

---

## Testing Offline Mode

1. Install and open the app once.
2. Enable **airplane mode**.
3. Force-close and relaunch the app. It should open normally.
4. Browse schemes, health info and scholarships, run the eligibility and scam checkers, and create a reminder.
5. Disable airplane mode and confirm pending data syncs to the backend.

---

## Collaboration Guidelines

- GitHub is the source of truth.
- Do not modify files belonging primarily to another contributor's area without coordinating through GitHub (issue or pull request first).
- Do not rewrite working code unnecessarily.
- Build and test after every major change.
- Keep the REST API contract in `docs/` up to date; both Android and backend depend on it.

---

## Roadmap

- [ ] Room schema and seed data
- [ ] Multilingual string resources (EN / KN / HI)
- [ ] Repository layer with offline-first reads
- [ ] WorkManager sync with retry and conflict handling
- [ ] Backend REST API and MongoDB models
- [ ] AI assistant with offline fallback
- [ ] Eligibility and scam-check engines
- [ ] Reminders and notifications

---

## Author

**Sharath Achari**
B.E. Artificial Intelligence and Data Science, DBIT Bengaluru (VTU)
GitHub: `<your-github-username>`

---

## License

Add a license (for example MIT) before publishing.
