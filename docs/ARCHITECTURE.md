# Architecture

```
ONLINE   Android UI -> ViewModel -> Repository -> Retrofit -> Render (Express) -> MongoDB Atlas
OFFLINE  Android UI -> ViewModel -> Repository -> Room (local data / local processing)
SYNC     Room pending_sync -> WorkManager (SyncWorker, network-constrained) -> POST /api/sync -> MongoDB Atlas
```

Rule: basic features must never depend on the backend. Repositories read Room first.

## Android (package com.ruralassistant.app)
| Layer | Contents |
|---|---|
| data/local | Room (entities, DAOs, AppDatabase), DataStore preferences |
| data/remote | Retrofit `RuralApiService`, `ApiClient`, DTOs |
| data/repository | Repository implementations |
| domain | Models and repository interfaces |
| ui | Compose theme, components, navigation, screens, ViewModels |
| worker | `SyncWorker`, `SyncScheduler` |
| utils | `ConnectivityMonitor` (Flow), `LocaleHelper` |

DI is manual (`AppContainer`), no Hilt.

## Navigation
Bottom tabs: Home, Ask, Schemes, Reminders, Settings. Health, Scholarships and Scam Checker open from Home tiles. First launch shows Language Selection. System Back returns to Home, then exits.

## Backend routes
`GET /api/health` implemented. `/api/knowledge`, `/api/query`, `/api/schemes`, `/api/scholarships`, `/api/reminders`, `/api/scam-check`, `/api/sync` return HTTP 501 until implemented.

## Next phases
2. Models + seed data (trilingual) 3. Offline knowledge in Room + Assistant search 4. Health, Schemes, Scholarships screens 5. Reminders with notifications 6. Scam checker 7. Sync (`/api/sync` + SyncWorker) 8. Voice input/output
