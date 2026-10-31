# Android app guide

Package `com.ruralassistant.app`. Kotlin, Jetpack Compose, Material 3, MVVM, Room, Retrofit,
WorkManager, DataStore. `minSdk 26`, `targetSdk 35`, JDK 17.

## Open and run

1. Android Studio → **Open** → select `android/RuralAssistant` (the folder containing
   `settings.gradle.kts`). Do not open the repository root.
2. Let Gradle sync. Accept the SDK 35 install if prompted. Use the embedded JDK 17.
3. `cp local.properties.example local.properties` and set `API_BASE_URL` (see below).
4. Run ▶ on an emulator (API 26+) or a connected phone.

| Test target | `API_BASE_URL` | Extra step |
|---|---|---|
| Emulator, backend on the same machine | `http://10.0.2.2:5000/` (default) | none |
| Phone over USB | `http://localhost:5000/` | `adb reverse tcp:5000 tcp:5000`, repeat after replugging |
| Phone over Wi-Fi | `http://192.168.1.20:5000/` | add that IP to `res/xml/network_security_config.xml`, allow the port in your firewall |
| Deployed backend | `https://your-service/` | none |

`API_BASE_URL` can also be passed per build: `./gradlew assembleDebug -PAPI_BASE_URL=https://your-service/`.

Cleartext HTTP is allowed only for `10.0.2.2` and `localhost` — that is a deliberate guard. Any other
host must use HTTPS or be added to the network security config.

## Screens and what they call

| Screen | File | Endpoint |
|---|---|---|
| Home (8 tiles) | `ui/screens/home/HomeScreen.kt` | — |
| Ask | `ui/screens/features/FeatureScreens.kt` → `AssistantFeatureScreen` | `POST /api/query` (sends `language: "auto"` and `requireConfirmation: true`), `POST /api/query/confirm`; the freshness banner calls `GET /api/knowledge/manifest`, `/changes` and `/pack` |
| Health | same screen, `category=health` | `POST /api/query` |
| Schemes | `SchemesFeatureScreen` | `GET /api/schemes`, `POST /api/schemes/check`; offline it falls back to the downloaded pack in Room |
| Scholarships | `ScholarshipsFeatureScreen` | `GET /api/scholarships`, `GET/POST /api/scholarships/saved`, `DELETE /api/scholarships/saved/{id}` |
| Reminders | `RemindersScreen` | `GET/POST/PUT/DELETE /api/reminders`, Room mirror, `pending_sync` when offline |
| Scam checker | `ScamFeatureScreen` | `POST /api/scam-check` |
| SMS Centre | `SmsFeatureScreen` | `GET /api/sms`, `POST /api/sms/send` |
| Virtual call | `ui/screens/call/VirtualCallScreen.kt` | `POST /api/voice-sessions`, `POST /api/voice-sessions/{id}/turns` (with `confirm=true` and, after a read-back, `confirmationToken`), `DELETE /api/voice-sessions/{id}` |
| Settings | `ui/screens/settings/SettingsScreen.kt` | `GET /api/health` |

Feature calls live in `data/remote/api/FeatureApi.kt`; health and sync use `RuralApiService.kt`.
`DeviceId` (`utils/DeviceId.kt`) supplies the `X-Device-Id` header: a UUID generated once per install.
`data/KnowledgePack.kt` tracks the downloaded pack; `utils/NumberReadBack.kt` understands numbers and dates on the phone.

## Voice and speech

- **Ask screen**: uses Android's own `SpeechRecognizer` for input and `TextToSpeech` for output. Works
  with no backend speech service, but needs the language pack installed on the phone
  (Settings → System → Languages → Text-to-speech output → install Kannada/Hindi). "Read answer aloud"
  speaks amounts digit by digit, using the `answerSpeech` segments from the server.
- **Virtual call screen**: records MP4/AAC clips with `MediaRecorder` and posts them to the backend, which
  transcribes them with the first configured provider (Sarvam, a Whisper-compatible endpoint, or Amazon
  Transcribe) and speaks the reply with Amazon Polly when AWS credentials exist. Without a speech provider
  the backend returns the text answer and a notice; the screen shows that notice in the status line instead
  of failing silently. When the question contains an amount or an ambiguous date, the call reads it back,
  waits for *haan / haudu / yes* and only then answers.

## Mixed language, read-back and stale knowledge

- `NumberReadBack.kt` is the phone-side twin of the backend's `services/numbers.js`. It understands
  mixed-language amounts (`paanch thousand rupaye`, `ಐದು hazaar`, `dedh lakh`, `paune do hazaar`),
  Devanagari and Kannada digits, identifiers and ambiguous dates such as `01/11/2026`, and it reads them
  back in the user's language before the question leaves the phone. It works with no network.
- On the Ask screen the server holds the answer when `requireConfirmation` finds a risky number; the card
  shows what was understood and offers **Yes, correct**, **No, I will fix it**, **Say yes** (voice) and **Hear again**.
- `KnowledgePack.kt` remembers the pack version, when it was last checked and which answers were
  re-checked since the phone's copy. The banner at the top of Ask names the count, expands into the list with
  **Verify on the official page**, and keeps working offline from the cached list. Every answer and scheme
  also shows "checked on … — verify at …".

## Offline behaviour

- Room holds the local tables (`schemes`, `scholarships`, `knowledge`, `reminders`, `pending_sync`).
- `KnowledgePack.refresh()` runs when the Ask screen opens and the phone is online: it reads the manifest,
  fetches the change list, and downloads the whole pack into Room when the server's `packVersion` differs.
- **Schemes** falls back to the downloaded pack when the network call fails, and says "Offline: showing N
  saved schemes".
- **Ask** still needs the network for its answers (the downloaded knowledge is stored but not yet searched
  on the phone). Offline it still reads amounts back locally, and the freshness banner and change list still
  appear.
- `SyncWorker` (network-constrained, every 15 minutes, plus **Settings → Sync now**) drains
  `pending_sync` to `POST /api/sync` and deletes the rows the server accepted. On a network error it
  returns `Result.retry()`, so nothing is lost.
- Scholarships are not cached locally yet. Writing outbox rows for offline creates is the next step if you
  extend this.

## Build the APK

```bash
./gradlew assembleDebug      # app/build/outputs/apk/debug/app-debug.apk
```

Signed release: **Build → Generate Signed Bundle / APK → APK → release**, or

```bash
keytool -genkeypair -v -keystore gramsahayak-release.jks -alias gramsahayak \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep the keystore and passwords backed up and out of Git. Full details, including phone installation
and Play Store notes, are in `docs/DEPLOYMENT.md`.

## Known limitations

- The app was assembled without an Android SDK in the generation environment, so it has not been
  compiled here (the Kotlin was checked statically: every `R.string` it uses exists, and the new classes
  `KnowledgePack` and `NumberReadBack` are referenced consistently). Gradle sync in Android Studio is the first real compile; expect at most minor
  dependency-resolution prompts (SDK 35, JDK 17).
- The eligibility check collects no personal profile, so it reports "needs profile" for most schemes.
  The backend accepts `age`, `gender`, `annualIncome`, `landHoldingHa`, `housing`, `rural`,
  `girlChildUnder10` and `wantsBusiness` if you add a profile form.
- SMS is simulated end to end. Do not connect a real gateway without consent capture and rate limits.
- Reminders are added and edited through a pop-up: a title, a type (health, medicine, appointment,
  scheme, scholarship, other), a date and a time picked from the calendar and clock dials, an optional
  repeat rule and a note. The ISO 8601 string the API needs is built by the app — the user never types
  a date. Tapping an existing reminder opens the same pop-up to change it, and the card's tick marks
  it done.
- The reminder list is stored in Room and mirrored to the server, so it opens instantly and still works
  with no network. A reminder created offline goes into the `pending_sync` outbox and is sent by
  `SyncWorker` when the connection returns; it shows "waiting to sync" until then.
- Reminder *notifications* are not scheduled on the device yet: a reminder lives in the list and in
  sync, but the phone does not ring an alarm for it.
