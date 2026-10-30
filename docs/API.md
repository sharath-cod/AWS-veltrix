# API reference

Base URL: `http://localhost:5000` locally, `https://<your-service>` in the cloud.

Envelope: success is `{ "success": true, "data": ... }`, failure is
`{ "success": false, "error": { "message": "...", "code": "..." } }`.
List endpoints add `count`.

Personal endpoints (`/reminders`, `/scholarships/saved`, `/sms`, `/voice-sessions`, `/sync`) require
the header `X-Device-Id: <uuid>`. The Android app generates one per install. `/api/query` accepts the
header too; it is needed only to bind a read-back token to a device.

## Health

```bash
curl localhost:5000/api/health
```

```json
{
  "success": true,
  "message": "GramSahayak backend is running",
  "database": "connected",
  "storeMode": "mongo",
  "speech": { "provider": "sarvam", "speechToText": "configured:sarvam", "textToSpeech": "aws-polly",
              "chain": ["sarvam"], "region": "ap-south-1", "notes": [] },
  "languages": ["en", "hi", "kn"],
  "content": { "knowledge": 83, "schemes": 14, "scholarships": 8 },
  "features": { "query": true, "schemes": true, "scholarships": true, "reminders": true,
                "scamCheck": true, "smsSimulation": true, "voice": true,
                "speechToText": true, "textToSpeech": true },
  "hurdles": {
    "staleKnowledge": { "supported": true, "changesFeed": "/api/knowledge/changes", "perFactAsOf": true,
                        "verifyLinks": true, "volatileEntries": 48 },
    "mixedLanguage": { "supported": true, "autoLanguage": true, "languages": ["en","hi","kn"],
                       "fractionWords": true, "ambiguousDates": true },
    "numberReadback": { "supported": true, "serverGate": true, "spokenConfirmation": true,
                        "pendingConfirmations": 0 }
  },
  "uptimeSeconds": 132
}
```

With no speech provider configured, `speech.provider` is `"off"`, `speech.chain` is `[]` and the
`speech.notes` array explains what to set. With no `MONGODB_URI`, `storeMode` is `"memory"` and
`database` reads `"in-memory (demo)"`.

## Knowledge base

```bash
curl "localhost:5000/api/knowledge?category=health&q=fever&limit=20"   # limit default 50, max 200
curl localhost:5000/api/knowledge/kb-health-fever
curl localhost:5000/api/categories
```

`GET /api/categories` returns the ten phases the assistant can answer (`health`, `schemes`,
`scholarships`, `scam`, `agriculture`, `education`, `documents`, `emergency`, `finance`, `general`) with a
trilingual `label` and an `entries` count, plus `total` (83).

### Offline pack and "what changed"

```bash
# tiny call the phone makes whenever it is online: is my copy stale?
curl "localhost:5000/api/knowledge/manifest?have=<packVersion>&downloadedAt=2026-10-01T08:00:00Z"

# everything the phone needs in one download, stamped with packVersion
curl localhost:5000/api/knowledge/pack

# which answers were re-checked after this phone's download
curl "localhost:5000/api/knowledge/changes?downloadedAt=2026-10-01&have=<packVersion>&limit=40"
```

`manifest` returns `packVersion` (a content fingerprint), `contentAsOf`, entry counts,
`volatileEntries`, `maxAgeDays` (env `PACK_MAX_AGE_DAYS`, default 14) and a `freshness` block:
`status`, `stale`, `behind`, `tooOld`, `ageDays`, `refreshRecommended` and a trilingual `message`.
`changes` returns `changedCount`, `returned`, and `changes[]`, each with `id`, `type`, `category`,
`title{en,hi,kn}`, `asOf`, `changedFields[]` (e.g. `amount`, `deadline`, `eligibility`), `verifyUrl`,
`verifyAt` and a trilingual `summary`. An unknown or missing `have` falls back to "everything that can
move" rather than claiming nothing changed.

## Ask (assistant)

```bash
curl -X POST localhost:5000/api/query \
  -H 'Content-Type: application/json' \
  -d '{"question":"What should I do if I have fever for two days?","language":"kn","category":"health"}'
```

```json
{
  "success": true,
  "data": {
    "answer": "ಎರಡು ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚು ಜ್ವರ ಇದ್ದರೆ ...",
    "grounded": true,
    "language": "kn",
    "answerLanguage": "kn",
    "matchedKey": "kb-health-fever",
    "trustedSources": [{ "name": "National Health Mission health helpline 104" }],
    "confidence": 0.83,
    "provider": "knowledge-base",
    "verified": false,
    "fact": { "asOf": "2026-08-20", "volatile": false, "volatileFacts": [],
              "verifyUrl": null, "verifyAt": "the nearest Health and Wellness Centre, your ASHA worker or helpline 104" },
    "freshness": { "status": "unknown", "stale": false, "contentAsOf": "2026-09-28T00:00:00.000Z" },
    "recheck": null,
    "answerNumbers": [],
    "answerSpeech": [{ "type": "text", "text": "..." }],
    "verifyBeforeActing": false
  }
}
```

Request fields: `question` (2–600 characters), `language` (`en` | `hi` | `kn` | `auto`), `category`
(`general`, or any phase from `/api/categories`), and optionally `packVersion` / `packDownloadedAt`
(so the answer can say whether this entry changed since the phone's copy) and `requireConfirmation`.

- `language: "auto"` answers in the language the question was asked in (script and romanised words) and
  reports it as `answerLanguage`.
- `answerSpeech[]` splits the answer into prose and numbers, so "read aloud" speaks ₹6,000 as
  *six, zero, zero, zero* rather than one run-on figure.
- `recheck.changedSinceDownload` is `true` when the matched entry was re-checked after the phone's copy.
- No matching entry returns `grounded: false`, a fixed "no verified information" reply and `suggestions`.
  A question asked under the wrong `category` falls back to the whole knowledge base.

### Read-back gate (misheard numbers)

```bash
curl -X POST localhost:5000/api/query -H 'X-Device-Id: dev-0001' -H 'Content-Type: application/json' \
  -d '{"question":"pm kisan 6000 rupaye kab aayega","language":"auto","requireConfirmation":true}'
```

When the question contains an amount, an ID or an ambiguous date, the answer is **held**:

```json
{ "success": true,
  "data": { "requiresConfirmation": true, "language": "hi", "question": "pm kisan 6000 rupaye kab aayega",
            "confirmation": { "token": "47aba5f3...", "expiresInSeconds": 600,
              "numbers": [{ "display": "₹6,000", "kind": "amount", "value": 6000,
                            "readBack": { "en": "6 thousand rupees. six, zero, zero, zero", "hi": "...", "kn": "..." } }],
              "dates": [], "prompt": { "en": "I understood: ₹6,000 (...). Is this correct? Say yes or no.", "hi": "...", "kn": "..." },
              "speechScript": [ ... ] } } }
```

Release it with the user's answer, typed, tapped or spoken:

```bash
curl -X POST localhost:5000/api/query/confirm -H 'X-Device-Id: dev-0001' -H 'Content-Type: application/json' \
  -d '{"token":"47aba5f3...","utterance":"haan"}'      # or {"token": "...", "confirmed": true}
```

Accepted yes/no words include `haan`, `ji haan`, `सही है`, `haudu`, `ಹೌದು`, `sari`, `yes`, and `nahi`, `गलत है`,
`illa`, `ಇಲ್ಲ`, `no`. An unclear reply returns `confirmed: null, retry: true` and is **not** treated as yes.
`no` returns `cancelled: true` and drops the token. A yes returns the normal answer plus `confirmed: true`,
`confirmedNumbers[]` and `confirmedDates[]`. Tokens are single use, bound to `X-Device-Id`, and expire after
10 minutes (`409 CONFIRMATION_USED | CONFIRMATION_EXPIRED | CONFIRMATION_UNKNOWN | CONFIRMATION_DEVICE_MISMATCH`).
Dates such as `01/11/2026` are read back both ways (1 November or 11 January). Without
`requireConfirmation`, the response is exactly the old shape, so older app versions keep working.

## Numbers

Stateless helpers the app also runs offline (`NumberReadBack.kt`):

```bash
curl -X POST localhost:5000/api/numbers/readback -H 'Content-Type: application/json' \
  -d '{"text":"dedh lakh rupaye ka loan","language":"auto"}'      # -> numbers[], dates[], confirmationPrompt{en,hi,kn}
curl -X POST localhost:5000/api/numbers/confirm  -H 'Content-Type: application/json' \
  -d '{"utterance":"haudu"}'                                      # -> { confirmed: true | false | null, matched }
curl -X POST localhost:5000/api/numbers/speech   -H 'Content-Type: application/json' \
  -d '{"text":"You get Rs 6000 in 3 instalments","language":"en"}' # -> segments[] of prose and numbers
```

The parser understands fractions (`dedh lakh` = 1,50,000; `paune do hazaar` = 1,750; `sadhe do hazaar` =
2,500; `sava sau` = 125), Devanagari and Kannada digits inside English phrases, and money words with no
readable amount (`unparsedMoney: true`, so the user is asked to repeat).

## Schemes

```bash
curl "localhost:5000/api/schemes?q=farmer"
curl localhost:5000/api/schemes/pm-kisan
curl -X POST localhost:5000/api/schemes/check \
  -H 'Content-Type: application/json' \
  -d '{"language":"en","age":72,"landHoldingHa":1.2,"gender":"female"}'
```

`POST /api/schemes/check` returns `summary`, `documents[]` and `results[]` where each result has
`id`, `name`, `status` (`likely` | `unlikely` | `needs_profile`) and `reason`. It is an indicative
first pass, not an official decision.

## Scholarships

```bash
curl "localhost:5000/api/scholarships?q=science"
curl -X POST localhost:5000/api/scholarships/saved -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' -d '{"scholarship":"inspire-she"}'
curl localhost:5000/api/scholarships/saved -H 'X-Device-Id: dev-1'
curl -X DELETE localhost:5000/api/scholarships/saved/inspire-she -H 'X-Device-Id: dev-1'
```

## Reminders

```bash
curl -X POST localhost:5000/api/reminders -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Take BP tablet","type":"medicine","remindAt":"2026-11-01T09:00:00+05:30","repeat":"daily","clientId":"c-1"}'

curl localhost:5000/api/reminders -H 'X-Device-Id: dev-1'
curl -X PUT localhost:5000/api/reminders/<id> -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' -d '{"completed":true}'
curl -X DELETE localhost:5000/api/reminders/<id> -H 'X-Device-Id: dev-1'
```

`type`: `health | scheme | scholarship | medicine | appointment | other`.
`repeat`: `none | daily | weekly | monthly | yearly`. `remindAt` must be ISO 8601.
Posting the same `clientId` twice returns the existing reminder with `deduplicated: true`.

## Scam check

```bash
curl -X POST localhost:5000/api/scam-check \
  -H 'Content-Type: application/json' \
  -d '{"text":"URGENT: your KYC is blocked, share the OTP and click http://bit.ly/xyz","language":"en"}'
```

```json
{
  "success": true,
  "data": {
    "riskLevel": "high",
    "score": 100,
    "reasons": [{ "id": "otp_request", "text": "It asks for an OTP ..." }],
    "advice": "Do not reply, do not click any link and do not send money ...",
    "signals": 5,
    "checkedAt": "2026-10-30T09:12:00.000Z"
  }
}
```

Rules cover OTP/PIN requests, KYC blocking threats, prizes, advance fees, shortened links, urgency,
impersonation, UPI collect requests and remote access apps. Reasons and advice are localised in
`en`, `hi`, `kn`. Nothing is stored.

## SMS (simulation only)

```bash
curl -X POST localhost:5000/api/sms/preview -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' -d '{"to":"9876543210","message":"Your application is ready"}'

curl -X POST localhost:5000/api/sms/send -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' \
  -d '{"to":"9876543210","message":"Your application is ready","language":"en","consent":true}'

curl localhost:5000/api/sms -H 'X-Device-Id: dev-1'
```

`consent: true` is mandatory. The response carries `statusLabel: "Simulated — recorded only, not
delivered (demo mode)"`. Numbers are stored masked.

## Voice sessions

```bash
# 1. start
curl -X POST localhost:5000/api/voice-sessions -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' -d '{"language":"kn"}'

# 2. send a recorded clip as the raw body
curl -X POST "localhost:5000/api/voice-sessions/<id>/turns" \
  -H 'X-Device-Id: dev-1' -H 'Content-Type: audio/mp4' \
  --data-binary @turn.m4a

# 3. end
curl -X DELETE localhost:5000/api/voice-sessions/<id> -H 'X-Device-Id: dev-1'
```

Query parameters on a turn: `language` (`en` | `hi` | `kn` | `auto`; overrides the session language),
`transcript=<text>` (what the phone heard — used when no speech-to-text provider is configured, or instead
of audio), `confirm=true` (turn on the read-back gate) and `confirmationToken=<token>` (release a held
turn together with `transcript=haan`).

Turn response: `{ transcript, answer, grounded, trustedSources, audio (base64 mp3 or null),
provider: { speechToText, textToSpeech }, notice }`. When the gate holds a turn, the response has
`requiresConfirmation: true`, `confirmationToken` and `confirmation{numbers, dates, prompt}`, and, when
Amazon Polly is configured, the spoken prompt is returned as `audio`. After a yes the response has `confirmed: true` and
`confirmedNumbers[]`; after a no, `cancelled: true`; after an unclear reply, `retryConfirmation: true`.

Speech to text uses the first configured provider (Sarvam AI, an OpenAI-compatible Whisper endpoint,
then Amazon Transcribe; see `STT_PROVIDER`). Spoken replies need Amazon Polly. With nothing configured
the turn still returns 200 with the explanatory answer text and `audio: null`, so the UI degrades
visibly instead of erroring.

## Sync

```bash
curl -X POST localhost:5000/api/sync -H 'X-Device-Id: dev-1' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[
        {"id":"1","entityType":"reminder","operation":"create","payload":{"title":"Collect pension","remindAt":"2026-11-05T10:00:00+05:30","clientId":"c-9"}},
        {"id":"2","entityType":"scholarship_saved","operation":"create","payload":{"scholarshipId":"inspire-she"}}
      ]}'
```

Returns `accepted[]` (`{ id, applied, id }`) and `rejected[]` (`{ id, reason }`).
`GET /api/sync` returns counts for the device.

## Error codes

| HTTP | code | Meaning |
|---|---|---|
| 400 | `DEVICE_ID_REQUIRED`, `DEVICE_ID_INVALID` | Missing or malformed `X-Device-Id` |
| 400 | `INVALID_QUESTION`, `QUESTION_TOO_LONG`, `INVALID_TITLE`, `INVALID_REMIND_AT`, `INVALID_TEXT`, `INVALID_UTTERANCE`, `TOKEN_REQUIRED`, `INVALID_JSON`, `AUDIO_REQUIRED` | Bad input |
| 400 | `CONSENT_REQUIRED`, `INVALID_SMS` | SMS simulation guards |
| 404 | `NOT_FOUND` | Unknown id or route |
| 409 | `SESSION_ENDED` | Voice turn after ending the call |
| 409 | `CONFIRMATION_UNKNOWN`, `CONFIRMATION_EXPIRED`, `CONFIRMATION_USED`, `CONFIRMATION_DEVICE_MISMATCH` | Read-back token problems |
| 413 | `AUDIO_TOO_LARGE`, `BATCH_TOO_LARGE`, `PAYLOAD_TOO_LARGE` | Size limits |
| 503 | `DATABASE_UNAVAILABLE` | MongoDB unreachable |
| 500 | `INTERNAL_ERROR` | Unexpected failure (details hidden in production) |
