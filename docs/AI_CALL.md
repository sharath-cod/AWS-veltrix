# The AI call

One tap on the call logo and the assistant picks up. It greets the caller in their own
language, listens, and answers whatever they ask — a scheme, a symptom, a certificate, a
fraud call, a farm problem — turn after turn, until they hang up.

```
Android Home ──tap call logo──► POST /api/calls
                                  └─ greeting in the caller's language + pickupDelay
                                POST /api/calls/{id}/turns   (words or audio)
                                  ├─ small talk        → conversation.js
                                  ├─ red-flag medical  → 108 (or 14416)
                                  ├─ dose question     → refused, 104
                                  ├─ unsure medical    → 104 / 108
                                  └─ everything else   → knowledge base, with sources
                                DELETE /api/calls/{id}
```

## What the caller experiences

1. **Ring, then pickup.** The screen shows *Calling GramSahayak…*, waits the
   `pickupDelayMs` the server sends (1.2 s), then speaks the greeting and starts listening.
   No "start call" button, no menu.
2. **Talk naturally.** Each turn is recognised on the phone (`SpeechRecognizer`) and sent as
   text — one small request, works on a slow connection. If the device has no recogniser,
   the recording is uploaded and transcribed on the server instead.
3. **It answers in the language asked.** Speak Kannada and the answer is Kannada; switch to
   Tamil mid-call and the call follows, showing *Answering in தமிழ்*. The text-to-speech
   voice switches with it.
4. **Urgent things are escalated, not chatted about.** Chest pain, breathlessness, heavy
   bleeding, fits, a snake bite, poisoning, a stroke, a serious burn, an accident, or
   thoughts of self-harm produce an emergency card with a **tappable 108** (and 14416 for a
   mental-health crisis) and the safest first thing to do.
5. **It says "I am not sure" when it is not sure.** A medical question with no verified
   answer, or any question about how much medicine to take, points at 104 / 108.
6. **Hang up** ends the call on the server too, and reports its length.

## The two rules that make it safe

**Rule 1 — red flags never get a chat answer** (`services/triage.js`)

| What the caller says | What happens |
|---|---|
| "my father has chest pain and is sweating" | `kind: emergency`, `urgency: urgent`, 108, "sit the person up…" |
| "he is bleeding a lot" | 108, "press hard on the wound…" |
| "my child has fits and is unconscious" | 108, "lay them on their side…" |
| "a snake bit my leg" | 108, "do not cut or suck the wound…" |
| "i am thinking about suicide" | `kind: mental-health-crisis`, 14416 + 108 |
| "how many tablets should i take" | `kind: dose-refusal`, 104 — a dose is never stated |
| "my knee is swollen and i cannot walk" | `kind: medical-uncertain`, 104 / 108 |

**Rule 2 — a medical answer needs three things.** A verified entry, a strong match, **and**
the question and the entry being about the same thing. That last one is what stops
"my knee is swollen" being answered with the blood-pressure entry because both contain the
word "cannot". If any of the three is missing, the call redirects.

## Languages

| Tier | Languages | What works |
|---|---|---|
| Full content | English, Hindi, Kannada | greeting, conversation, **and** complete knowledge-base answers |
| Call flow | Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Urdu | greeting, small talk, "I did not hear you", the 108/104 redirects, goodbye |
| With `SARVAM_API_KEY` | all of the above | the question is translated to English, answered, and the answer translated back |

With no translation key, a caller in a call-flow-only language still gets the safety
messages in their own language, and a sentence in their language saying the full
explanation is in English — it never pretends to have answered in a language it cannot.

The language of a turn is decided in this order: the speech provider's detected language,
then the script of the words, then the phone's UI language. So a caller who speaks Kannada
on a Hindi phone is answered in Kannada, while someone who says something the recogniser
writes in Latin letters is answered in the language their phone is set to.

Speech-to-text covers the same eleven languages when a Sarvam key is configured, and
`language_code=unknown` lets the provider auto-detect, which is how a mid-call language
switch is caught.

## API

```http
POST /api/calls                        { "language": "auto", "uiLanguage": "hi" }
→ 201 { id, status: "connected", language, greeting: { text, language },
        pickupDelayMs, supportedLanguages[], contentLanguages[], canTranscribe }

POST /api/calls/{id}/turns?transcript=<words>     (or raw audio/mp4 body)
→ { transcript, answer, language, kind, urgency, grounded,
    redirect: { primary: "108", numbers: [{number,label}] } | null,
    triage: { kind, reason, flags }, trustedSources[], fact, recheck, freshness,
    heardNumbers[], answerSpeech[], endCall }

GET    /api/calls/{id}    → the transcript so far
DELETE /api/calls/{id}    → { status: "ended", durationSeconds, farewell }
```

`kind` is one of `conversation`, `knowledge`, `medical-answer`, `emergency`,
`mental-health-crisis`, `dose-refusal`, `medical-uncertain`, `not-found`.

## Where the code lives

```
backend/src/data/languages.js         11 call languages + every call-flow sentence
backend/src/services/call.js          the turn pipeline
backend/src/services/triage.js        red flags, first aid, dose refusal, uncertainty rule
backend/src/services/conversation.js  small talk and call control
backend/src/services/translate.js     optional Sarvam translate for other languages
backend/src/controllers/call.controller.js, routes/calls.routes.js
backend/scripts/call-test.js          66 checks, including every redirect
android/…/ui/screens/call/CallScreen.kt   ringing, greeting, turns, emergency card
android/…/ui/screens/home/HomeScreen.kt   the call logo
```

## Honest limits

- The knowledge base is English, Hindi and Kannada. Other languages depend on a translate
  key for full answers; without it they get the safety messages and an English answer.
- Red-flag detection uses keyword phrases in English, Hindi, Kannada and romanised spellings.
  An unusual phrasing in another language is caught only after translation, so with no
  translate key it falls back to "I am not sure — call 104", which is the safe direction.
- The assistant does not diagnose and does not prescribe. That is deliberate.
- First-aid text exists in English, Hindi and Kannada; other languages get the generic
  "call 108, stay with the person, nothing by mouth" sentence.
