# Deployment guide

This guide takes the merged repository from "unzipped folder" to "APK on a phone talking to a live
backend". Follow it in order. Every command is copy-paste ready; anything you must replace is in
`CAPITALS`.

```
        ┌─────────────────────────┐        HTTPS        ┌──────────────────────┐
        │  Android app (APK)      │ ──────────────────► │  Node.js API         │
        │  Kotlin + Compose       │ ◄────────────────── │  Render / AWS        │
        │  Room, WorkManager      │      JSON           │  Express 4           │
        └─────────────────────────┘                     └──────────┬───────────┘
                     │                                             │
                     │ offline: Room + outbox                      │ Mongoose
                     ▼                                             ▼
              replay later via POST /api/sync            MongoDB Atlas  (or in-memory)
                                                           │
                                            optional:  Sarvam / Whisper / Transcribe (STT),
                                                           Polly (TTS), S3 (audio), Bedrock (answers)
```

**What you need**

| Item | Needed for | Notes |
|---|---|---|
| Node.js 18+ and npm | backend | `node -v` |
| MongoDB Atlas account (free M0) | persistent data | Optional: without it the backend runs an in-memory demo store |
| Android Studio (Ladybug or newer), JDK 17, SDK 35 | building the APK | Emulator with API 26+ |
| Render account **or** AWS account | hosting the API | Either is enough; Render is faster |
| One speech-to-text key (Sarvam, a Whisper-compatible endpoint, or AWS keys + S3 bucket) | voice call screen only | Everything else works without it. Spoken replies additionally need AWS Polly |

**Time:** about 45 minutes end to end, 20 if you skip speech.

---

## Step 1 — Check the code on your machine

```bash
cd gramsahayak/backend
cp .env.example .env          # leave MONGODB_URI empty for now
npm install
npm run verify
```

`verify` runs three suites in sequence and each must end with `0 failed`: **51** endpoint checks
(`smoke`), **131** screen-contract checks that replay every call the Android app makes in all three
languages (`contract`), and **89** checks for the stale-knowledge, mixed-language and read-back
behaviour (`hurdles`). They boot the API in-process against the in-memory store, so they need no
database, no AWS account, no API key and no open port. You can also run them one at a time
(`npm run smoke`, `npm run contract`, `npm run hurdles`).

Start it for real:

```bash
npm run dev
# [server] listening on port 5000 (development)
# [server] store: memory · speech: off
```

```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/query -H 'Content-Type: application/json' \
  -d '{"question":"fever for two days","language":"en"}'
```

If `npm run verify` fails, stop and fix that first — the rest of the guide assumes a working API.

---

## Step 2 — Create the MongoDB Atlas database

1. Sign in at <https://cloud.mongodb.com> and create a **free M0** cluster (region: Mumbai / `ap-south-1`).
2. **Database Access → Add New Database User**: username `gramsahayak`, click *Autogenerate Secure
   Password*, copy it, role *Read and write to any database*.
3. **Network Access → Add IP Address**. For a demo, `0.0.0.0/0` (allow from anywhere) is the
   pragmatic choice; for anything real, allow only your hosting provider's egress ranges.
4. **Cluster → Connect → Drivers** and copy the string:

```
mongodb+srv://gramsahayak:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Add a database name so it becomes `.../gramsahayak?retryWrites=true&w=majority`.

Put it in `backend/.env`:

```ini
MONGODB_URI=mongodb+srv://gramsahayak:PASSWORD@cluster0.xxxxx.mongodb.net/gramsahayak?retryWrites=true&w=majority
```

If the password contains `@`, `:`, `/` or `#`, URL-encode it (`@` → `%40`).

### Load the demo content

```bash
cd backend
npm run seed            # upserts 10 schemes, 6 scholarships, 56 knowledge entries (with asOf / verify data)
npm run seed -- --force # wipe and reload, if you edited the seed data
npm run dev
```

`npm start` also seeds automatically when the collections are empty, so a fresh cloud deploy
self-populates on first boot.

Verify:

```bash
curl http://localhost:5000/api/health
# "database": "connected", "storeMode": "mongo"
curl http://localhost:5000/api/schemes | head -c 300
```

---

## Step 3 — Deploy the backend

### Option A — Render (fastest, free tier, HTTPS included)

The repository already contains `render.yaml`.

1. Push the folder to GitHub (see the note at the end of this step).
2. Render → **New → Blueprint** → pick the repo. Render reads `render.yaml`, creates the
   `gramsahayak-api` web service with `rootDir: backend`, and asks for the secret env vars.
3. Fill in:
   - `MONGODB_URI` — the Atlas string from Step 2
   - `CORS_ORIGIN` — leave empty (native app sends no `Origin`); set it only if you add a web client
   - `SARVAM_API_KEY` (or the other speech settings) only if you want voice (Step 5)
4. Deploy. First build takes ~3 minutes. Health check path is `/api/health`.
5. Note the URL, e.g. `https://gramsahayak-api.onrender.com`.

Free instances sleep after 15 minutes idle. **Open `/api/health` in a browser 2 minutes before your
demo** so the first request is not a 30-second cold start. The paid Starter plan removes this.

### Option B — AWS App Runner (managed container, HTTPS included)

```bash
cd backend
export AWS_REGION=ap-south-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 1. image registry
aws ecr create-repository --repository-name gramsahayak-api --region $AWS_REGION

# 2. build and push (the Dockerfile is in backend/)
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t gramsahayak-api .
docker tag gramsahayak-api:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/gramsahayak-api:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/gramsahayak-api:latest

# 3. service
aws apprunner create-service \
  --service-name gramsahayak-api \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/gramsahayak-api:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "5000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "AWS_REGION": "ap-south-1",
          "SPEECH_PROVIDER": "auto"
        }
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {"AccessRoleArn": "arn:aws:iam::'$ACCOUNT_ID':role/AppRunnerECRAccessRole"}
  } \
  --instance-configuration '{"Cpu": "0.25 vCPU", "Memory": "0.5 GB"}' \
  --health-check-configuration '{"Protocol":"HTTP","Path":"/api/health","Interval":10,"Timeout":5,"HealthyThreshold":1,"UnhealthyThreshold":5}' \
  --region $AWS_REGION
```

Then add `MONGODB_URI` (and AWS speech variables) under **App Runner → your service → Configuration →
Environment variables** and redeploy. App Runner gives you `https://xxxxx.ap-south-1.awsapprunner.com`.

If you use an instance role instead of access keys, attach the policy from Step 5 to the App Runner
instance role and skip `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

### Option C — AWS EC2 (cheapest if you already run one)

```bash
# on an Ubuntu 22.04 t3.micro with security group allowing 80/443 (and 5000 for a quick test)
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable --now docker

git clone YOUR_REPO_URL gramsahayak && cd gramsahayak/backend
sudo docker build -t gramsahayak-api .
sudo docker run -d --name gramsahayak-api --restart unless-stopped \
  -p 5000:5000 --env-file /home/ubuntu/gramsahayak.env gramsahayak-api
```

`gramsahayak.env` holds the same keys as `.env`. Put Nginx in front for TLS:

```nginx
server {
    listen 80;
    server_name api.example.com;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 12m;   # voice turns
    }
}
```

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

`client_max_body_size` matters: without it, voice uploads fail with 413.

### Pushing the code to GitHub

```bash
cd gramsahayak
git init && git add . && git commit -m "GramSahayak: merged architecture + implemented app + full backend"
git branch -M main
git remote add origin https://github.com/YOUR_USER/gramsahayak.git
git push -u origin main
```

`.gitignore` already excludes `.env`, `node_modules/`, `local.properties`, `build/` and `*.apk`.
**Never commit `.env` or your keystore.**

---

## Step 4 — Point the Android app at the live backend

1. Open Android Studio → **Open** → select `android/RuralAssistant` (the folder with
   `settings.gradle.kts`). Wait for Gradle sync; install SDK 35 and use JDK 17 if prompted.
2. Copy the template:

```bash
cd android/RuralAssistant
cp local.properties.example local.properties
```

3. Set the backend URL in `local.properties`:

```properties
sdk.dir=/path/to/Android/sdk        # Android Studio writes this for you
API_BASE_URL=https://gramsahayak-api.onrender.com/
```

Pick the right URL for your test target:

| Target | `API_BASE_URL` |
|---|---|
| Emulator, backend on the same laptop | `http://10.0.2.2:5000/` (default) |
| Phone over USB, backend on the laptop | `http://localhost:5000/` + `adb reverse tcp:5000 tcp:5000` |
| Phone over Wi-Fi, backend on the laptop | `http://192.168.1.20:5000/` (your LAN IP) + see below |
| Deployed backend | `https://your-service/` |

4. **Cleartext HTTP only works for `10.0.2.2` and `localhost`** — see
   `app/src/main/res/xml/network_security_config.xml`. For a LAN IP demo, add one line:

```xml
<domain includeSubdomains="false">192.168.1.20</domain>
```

Also allow port 5000 through your firewall (Windows Defender Firewall → Inbound rules). Never ship a
release build that talks plain HTTP.

5. Run ▶ on the emulator. First launch asks for a language; then **Settings → Check backend** should
   show *Connected* and the database name.

---

## Step 5 — Optional: enable the voice call screen (speech)

Everything else works without this. Do it if you want the Virtual Call demo live. The Ask screen
already does voice input and output on the phone itself, with no server speech at all.

The voice screen needs **speech to text**. Set up **one** of the three providers below; with
`STT_PROVIDER=auto` (the default) the backend tries Sarvam, then the HTTP endpoint, then AWS, and uses the
first that is configured. If one fails on a turn it falls through to the next.

| Option | You need | Best for |
|---|---|---|
| A. Sarvam AI | `SARVAM_API_KEY` | Fastest set-up, built for Indian languages, no storage bucket |
| B. OpenAI-compatible endpoint | `STT_HTTP_URL`, `STT_HTTP_API_KEY` | Whisper, Groq Whisper or a self-hosted server |
| C. Amazon Transcribe | AWS keys + `AWS_S3_BUCKET` | Staying entirely on AWS |

Spoken **replies** use Amazon Polly and need AWS credentials whichever speech-to-text option you pick.
Without them a voice turn returns the text answer, which the app displays.

### Option A — Sarvam AI (simplest)

```ini
SARVAM_API_KEY=your-key-from-the-sarvam-dashboard
# optional: SARVAM_STT_MODEL=saarika:v2.5
```

### Option B — Whisper-compatible endpoint

```ini
STT_HTTP_URL=https://api.openai.com/v1/audio/transcriptions
STT_HTTP_API_KEY=sk-...
STT_HTTP_MODEL=whisper-1
```

### Option C — Amazon Transcribe and Polly

**1. Create an S3 bucket for staging short clips**

```bash
aws s3 mb s3://gramsahayak-voice-CAPITAL  --region ap-south-1
aws s3api put-bucket-lifecycle-configuration --bucket gramsahayak-voice-CAPITAL \
  --lifecycle-configuration '{"Rules":[{"ID":"expire-clips","Filter":{"Prefix":"voice-turns/"},
  "Status":"Enabled","Expiration":{"Days":1}}]}'
```

**2. Create an IAM user for the backend** with exactly these permissions (replace the bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["polly:SynthesizeSpeech"],
      "Resource": "*" },
    { "Effect": "Allow",
      "Action": ["transcribe:StartTranscriptionJob", "transcribe:GetTranscriptionJob"],
      "Resource": "*" },
    { "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::gramsahayak-voice-CAPITAL/voice-turns/*" },
    { "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*" }
  ]
}
```

Drop the Bedrock statement if you are not using it. If you use Sarvam or a Whisper-compatible endpoint for speech to text, the IAM user only needs
`polly:SynthesizeSpeech` (for spoken replies), and no S3 bucket is required.

**3. Set the variables** on your host (Render dashboard, App Runner env, or `.env`):

```ini
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=gramsahayak-voice-CAPITAL
SPEECH_PROVIDER=aws        # forces AWS only; use auto to let Sarvam / HTTP be tried first
SPEECH_TIMEOUT_MS=25000
```

### Check it (any option)

```bash
curl https://YOUR-SERVICE/api/health | python -m json.tool
# "speech": { "provider": "sarvam", "speechToText": "configured:sarvam", "textToSpeech": "aws-polly", "chain": ["sarvam"] }
# "features": { "speechToText": true, "textToSpeech": true, "voice": true, ... }
```

`speech.chain` lists the providers that will be tried, in order; an empty chain means no speech to text
is configured and `speech.notes` says what to set.

**Language support:** Polly voice *Kajal* (neural) covers `en-IN`, `hi-IN` and `kn-IN`. Transcribe
batch supports `en-IN`, `hi-IN` and `kn-IN`; if a language is unsupported in your region the job
returns `FAILED` and the API replies with the explanatory text instead of audio.

**Optional Bedrock answer rewriting** — enable model access in the Bedrock console, then:

```ini
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_REGION=ap-south-1
```

Answers become smoother phrasing of the same retrieved facts; if the call fails the extractive answer
is used, so this can never break the demo.

**Prefer no external speech service at all?** Leave every speech setting empty (or set
`STT_PROVIDER=off` / `SPEECH_PROVIDER=off`). Voice turns return the text answer plus a clear notice, and the
Ask screen still gives full voice input/output using Android's own speech engine.

---

## Step 6 — Build the APK

Debug build for testing:

```bash
cd android/RuralAssistant
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug
# -> app/build/outputs/apk/debug/app-debug.apk
```

Or in Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

Install on a phone:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Signed release build (for judges' phones, not Play Store distribution):

```bash
keytool -genkeypair -v -keystore gramsahayak-release.jks -alias gramsahayak \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Build → Generate Signed Bundle / APK → APK**, pick the keystore, choose `release`, finish.
Output: `app/build/outputs/apk/release/app-release.apk`.

- Back up `gramsahayak-release.jks` and its passwords. Every future update must use the same key.
- Keep the keystore **out of Git** (`.gitignore` covers `*.jks` and `*.keystore`).
- A release APK pointed at `https://` needs no extra configuration. If you build a release APK against
  a plain-HTTP LAN backend, add that IP to `network_security_config.xml` or it will silently fail.

---

## Step 7 — Verify before you present

Backend:

```bash
curl https://YOUR-SERVICE/api/health
curl https://YOUR-SERVICE/api/schemes | head -c 200
curl -X POST https://YOUR-SERVICE/api/query -H 'Content-Type: application/json' \
  -d '{"question":"which schemes help small farmers","language":"kn"}'
```

In the app, in this order:

1. Language selection → Kannada, then Home shows the connection chip as online.
2. **Settings → Check backend** → connected.
3. **Ask** → "ಜ್ವರ ಇದ್ದರೆ ಏನು ಮಾಡಬೇಕು?" → answer plus trusted sources. Tap *Read answer aloud*.
4. **Health** → an English health question → answer.
5. **Schemes** → search "farmer" → open a scheme → *Check general eligibility* → summary and documents.
6. **Scholarships** → save one, then check it appears under saved.
7. **Reminders** → add "Take BP tablet" with `2026-11-01T09:00:00+05:30` → complete it → delete it.
8. **Scam checker** → paste an OTP/KYC message → HIGH RISK with reasons.
9. **SMS Centre** → valid number, tick consent → "Simulated — recorded only".
10. **Virtual call** (if a speech provider is on) → Start call → Record → Stop and send → transcript, answer, audio.
11. Turn on airplane mode, then **Settings → Sync now**: queued operations are replayed when the
    network returns.
12. **Read-back.** Ask `pm kisan 6000 rupaye kab aayega`: the answer is held and the card reads
    "I understood: ₹6,000 … Is this correct?" Tap **Yes, correct** (or say *haan*) and the answer appears.
13. **Mixed language.** With the app in English, ask `bukhar hai kya karu`: the answer comes back in Hindi,
    labelled "Answered in हिन्दी".
14. **Stale knowledge.** On the server run `npm run touch -- kb-scheme-pm-kisan` and restart; the Ask screen
    banner now says one answer was re-checked since the phone's copy, with a link to the official page.

`docs/RELEASE_NOTES.md` has the same checks as a five-minute demo script.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| App shows "Unable to connect to backend" | wrong `API_BASE_URL` | Emulator needs `10.0.2.2`, not `localhost`. Re-sync Gradle after editing `local.properties` |
| `CLEARTEXT communication not permitted` | HTTP to a host not in the network security config | Add the host to `network_security_config.xml`, or use HTTPS |
| `adb reverse` works, phone still fails | reverse tunnel dropped after replug | Re-run `adb reverse tcp:5000 tcp:5000` |
| `/api/health` says `"database": "disconnected"` | Atlas IP allowlist, wrong password, or SRV blocked | Add your host's egress IP (or `0.0.0.0/0`), re-check the URI, URL-encode special characters |
| `503 DATABASE_UNAVAILABLE` | Mongo connection dropped | The API stays up by design; restore Atlas access and retry |
| Schemes list is empty | collections not seeded | `npm run seed`, or restart (auto-seeds when empty) |
| First request takes 30s | Render free tier cold start | Warm `/api/health` before demo day, or upgrade |
| Voice turn returns text with "speech to text unavailable" | no speech-to-text provider configured (`speech.chain` is empty in `/api/health`) | Set `SARVAM_API_KEY`, or `STT_HTTP_URL`, or AWS keys + `AWS_S3_BUCKET` (Step 5), or use the Ask screen |
| Voice turn: `Transcribe ... FAILED` | unsupported language/format in that region | Test with `en-IN`, switch to Sarvam, or leave speech off for the demo |
| Voice screen answers but never speaks | no AWS credentials, so no Polly | Expected: the text answer is shown. Add AWS keys and the Polly policy to get audio |
| Every answer says "may be out of date" | the phone's pack is older than `PACK_MAX_AGE_DAYS` (default 14) | Refresh the pack in the app, or raise `PACK_MAX_AGE_DAYS` on the server |
| `Polly failed (403)` | IAM policy missing `polly:SynthesizeSpeech` | Fix the policy, restart the service |
| 413 on voice upload | reverse proxy body limit | Nginx `client_max_body_size 12m`, or lower `MAX_AUDIO_BYTES` |
| Gradle sync fails | SDK 35 missing / wrong JDK | Install SDK Platform 35, set Gradle JDK to 17 |
| Build error about `BuildConfig.API_BASE_URL` | `buildConfig` feature off or bad property | Keep `buildFeatures { buildConfig = true }`; check `local.properties` has no quotes |

Logs to read: backend `[api]`, `[db]`, `[seed]`, `[voice]` lines; Android Logcat tags `RuralApp`,
`SyncWorker`, and `okhttp.OkHttpClient` (debug builds log each request).

---

## Cost and limits

| Service | Free allowance | Note |
|---|---|---|
| MongoDB Atlas M0 | 512 MB | far more than this dataset needs |
| Render free web service | 750 h/month, sleeps when idle | fine for a demo, warm it first |
| AWS App Runner | pay per vCPU-hour (~cents for a demo) | no free tier, but no cold-start sleeping |
| AWS EC2 t3.micro | free tier eligible (12 months) | add `t3.small` if builds are slow |
| Sarvam / Whisper-compatible | per provider pricing | billed by audio minute; a voice turn is a few seconds |
| Polly | 5M chars/month (standard), 1M (neural) for 12 months | each answer is ~400 characters |
| Transcribe | 60 min/month free for 12 months | each voice turn is a few seconds |
| S3 | 5 GB | clips are deleted right after transcription and expire in a day |

## Before public traffic

The demo is safe to show, not yet hardened for strangers. In order: add `helmet` and rate limiting
(`express-rate-limit`) on `/api/query`, `/api/scam-check` and `/api/sms/*`; require authentication
before any real SMS gateway is connected; add a MongoDB index review; keep `CORS_ORIGIN` restrictive;
store secrets in AWS Secrets Manager or the platform's secret store, never in the repo; and pin the
Atlas IP allowlist to your host instead of `0.0.0.0/0`.
