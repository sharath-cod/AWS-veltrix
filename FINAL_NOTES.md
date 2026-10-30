# GramSahayak — final pack (with the AI call)

The app, the backend, the three hurdle mechanisms and the new call simulation, in one
folder. Everything here was run and checked: **51 endpoint + 131 screen-contract + 89
hurdle + 66 call checks — 337 in total, all green.**

```
android/        the Compose app
backend/        the Express API (Node 18+, four packages, no AWS SDK)
docs/           AI_CALL.md, FRONTEND_CONTRACT.md, ARCHITECTURE.md
HURDLE_STALE_KNOWLEDGE_AND_READBACK.md   the stale-knowledge / read-back hurdle
FINAL_NOTES.md, README.md, FILES.txt
```

---

## What is new in this version

### A call logo, and the assistant picks up

Home now has a big call banner above the tiles. One tap dials the assistant — no "start
call" button, no menu:

- the screen shows *Calling GramSahayak…*, waits the 1.2 s pickup the server sends, then
  **speaks a greeting and starts listening**;
- every turn is recognised on the phone and sent as text (one small request — it works on a
  slow rural connection); if the device has no recogniser, the recording is uploaded and
  transcribed on the server;
- the answer is spoken, then the assistant listens again, like a call;
- the screen shows the conversation as bubbles, a mute button, a big red hang-up, and
  *"Answering in தமிழ்"* when the caller is being answered in another language.

### It answers any question, in any language it can

| Tier | Languages | What works |
|---|---|---|
| Full content | English, Hindi, Kannada | greeting, conversation, **and** complete knowledge-base answers |
| Call flow | + Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Urdu | greeting, small talk, "I did not hear you", the 108/104 redirects, goodbye |
| With `SARVAM_API_KEY` | all eleven | the question is translated to English, answered, and the answer translated back |

Without a translate key a Tamil or Bengali caller still hears the safety messages in their
own language, plus a sentence saying the full explanation is in English — it never pretends
to have answered in a language it cannot. Speech-to-text covers the same eleven languages
when a Sarvam key is set, and can auto-detect, so a mid-call language switch is caught.

Small talk is handled too, so the call is a conversation and not a search box: "hello",
"who are you", "what can you do", "thank you", "bye" all get an answer — and
"hello, what is pm kisan" is still treated as the question it is.

### Unsure medical questions go to 108 — and never guess

| The caller says | What happens |
|---|---|
| "my father has chest pain and is sweating" | **108**, urgent, "sit the person up, keep them calm…" |
| "he is bleeding a lot" | **108**, "press hard on the wound…" |
| "my child has fits and is unconscious" | **108**, "lay them on their side, nothing in the mouth…" |
| "a snake bit my leg" | **108**, "do not cut or suck the wound…" |
| "i am thinking about suicide" | **14416** (Tele-MANAS) + **108** |
| "how many tablets should i take" | refused — **104**; a dose is never stated |
| "my knee is swollen and i cannot walk" | **104 / 108** — "I am not sure, please do not act on it" |
| "ನನ್ನ ಮಗುವಿಗೆ ಜ್ವರ ಇದೆ" (fever, covered) | answered from the health entry, **in Kannada**, with "call 108 if it gets worse" |

The emergency answer is shown as a red card with a **tappable 108** (and 14416) button, so
the caller can dial straight from the call. A medical answer needs three things — a verified
entry, a strong match, and the question and the entry being about the same thing — otherwise
it redirects instead of answering.

---

## Run it

```bash
cd backend
cp .env.example .env          # MONGODB_URI, plus ONE speech key if you want voice
npm install
npm run verify                # 51 + 131 + 89 + 66 checks, no AWS, no API key, no database
npm run seed                  # push the dataset into MongoDB
npm run dev                   # http://localhost:5000
```

The Android app needs no dependency or Gradle change: `local.properties` still points at your
service, and every new API call is additive.

## Two-minute demo script

1. **Home → call logo.** The screen dials; the assistant picks up and greets in the phone's
   language, then listens.
2. Say **"पीएम किसान के पैसे कब आते हैं"** → the answer comes back in Hindi with sources and
   the date the fact was checked.
3. Say **"मेरे पिता को छाती में दर्द हो रहा है"** → the call stops answering like a
   chatbot: **108**, urgent, with first aid, and a tappable **Call 108** card.
4. Say **"बुखार के लिए कितनी गोली लेनी चाहिए"** → it refuses to give a dose and points at 104.
5. Switch language mid-call: say something in Kannada or Tamil → the header shows
   *Answering in ಕನ್ನಡ / தமிழ்* and the answer follows.
6. Say **"bye"** → the call ends and the summary appears.

## Honest limits

- The knowledge base is English, Hindi and Kannada. Other languages depend on a translate
  key for full answers; without one they get the safety messages and an English answer.
- Red-flag detection matches keyword phrases in English, Hindi, Kannada and romanised
  spellings. Unusual phrasing in another language is caught only after translation, so with
  no key it falls back to "I am not sure — call 104", which is the safe direction.
- The assistant does not diagnose or prescribe. That is deliberate, not missing work.
- The Android side could not be compiled here (no Android SDK, and the sandbox blocks the
  JVM's memory mapping). The Kotlin changes are limited to five files — `CallScreen.kt` (new),
  `HomeScreen.kt`, `AppNavHost.kt`, `FeatureApi.kt` and the three `strings.xml` files — and
  the API contract they rely on is covered by the 66 call checks and 131 screen checks.
