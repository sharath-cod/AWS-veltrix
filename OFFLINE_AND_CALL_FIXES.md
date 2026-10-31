# Offline voice, and answers that fit a phone call

Two problems reported from testing:

1. Hindi and Kannada questions spoken into the app were not converted to text **offline**.
2. The call simulation worked, but its answers were not apt.

---

## 1. Offline voice

### Why it failed

The app used one online recogniser (`SpeechRecognizer.createSpeechRecognizer`) with
`EXTRA_LANGUAGE=hi-IN` / `kn-IN`. With no network that recogniser has nothing to talk to, so
it returned an error code — and the app printed `"Speech recognition error (7). You can type
instead."` Nothing was transcribed and the recording was thrown away.

Two facts decide what is possible:

- Android **can** recognise Hindi and Kannada offline, but only through the **on-device**
  recogniser (`createOnDeviceSpeechRecognizer`, Android 12+) **and** only if the language pack
  for that language has been downloaded on the phone.
- If neither the pack nor the network is there, no app can transcribe that audio on the
  device. Pretending otherwise would be dishonest, so the app now does the next best thing.

### What the app does now

| Situation | Behaviour |
|---|---|
| Online | The normal recogniser, in the chosen language. Unchanged. |
| Offline, language pack installed | The **on-device** recogniser, which works with no network. |
| Offline, language pack missing | The user is told, in their language, that the Hindi/Kannada voice pack is not installed, with a **Voice settings** button that opens the phone's voice-input settings to download it. |
| Offline, still cannot recognise | **"Save recording for later"** keeps the clip; the moment the phone is online it is uploaded to the new `POST /api/transcribe`, turned into text, and dropped into the question box. |
| Any phone | A "type your question" box is always there. |

The recording queue (`utils/VoiceNoteQueue.kt`) keeps up to 20 clips in app storage with the
language alongside each one, survives a restart, and shows *"N saved recording(s) waiting to
be converted to text"* so the user knows nothing was lost.

### Offline answers, so the text is actually useful

Transcribing offline is only half the job — the app used to need the server to *answer* too.
The knowledge pack is already downloaded into Room for offline use, so it is now read:
`data/LocalAnswer.kt` matches the question against the saved entries in the user's language
(with the same concept idea as the server: `bukhar`, `बुखार`, `ಜ್ವರ` are one thing), and the
Ask screen uses it whenever the phone is offline or the server cannot be reached. The answer
card says *"Answered from the information saved on this phone"*.

The medical rule holds offline as well (`utils/SafetyGuard.kt`): chest pain, bleeding, fits, a
snake bite, poisoning, an accident or thoughts of self-harm get **108** (14416 for a mental
health crisis) even with no signal; a dose question is refused and points at **104**; a
medical question the pack does not cover says "I am not sure" instead of guessing.

---

## 2. Answers that fit a call

### Why they were poor

The call read out the whole knowledge-base paragraph. For PM-KISAN that is five sentences of
eligibility, documents and portal steps — technically right, useless on a phone. And a short
follow-up ("aur kitna", "uske liye kya chahiye") was treated as a brand-new question with two
words in it, so it usually fell back to "I do not have verified information".

### What changed

- **Answers are trimmed for speech.** The call returns the first two or three sentences
  (about 55 words), and `moreAvailable: true` when there is more. A **"Tell me more"** button
  (or saying "aur batao" / "tell me more") continues from where it stopped. `answerFull` still
  carries the whole text for reading.
- **Follow-ups resolve against the previous question.** "aur kitna" is understood as
  "PM-KISAN… aur kitna", and when it lands on the same entry the call **continues** the
  answer instead of repeating its first sentences.
- **Medical answers stay short and safe**: the summary plus "call 108 if it gets worse",
  never a diagnosis.
- **A weak match is not read out.** If the best match is only approximate, or the question and
  the entry are not about the same thing, the call says "I am not sure — 104 / 108" rather
  than confidently reciting an unrelated entry.
- **Offline, the call still works**: it switches to the pack on the phone (same safety rule)
  and says so ("Offline · saved answers"), instead of failing to connect.

Example, from the test suite:

```
> पीएम किसान के पैसे कब आते हैं
  पीएम-किसान छोटे और सीमांत किसान परिवारों को सालाना लगभग छह हज़ार रुपये की आय सहायता
  तीन किस्तों में देती है, जो सीधे बैंक खाते में आती है। आपका नाम ज़मीन के कागज़ों में होना
  चाहिए और बैंक खाता आधार से जुड़ा होना चाहिए।            [Tell me more]
> aur kitna
  आधार, ज़मीन के कागज़ और बैंक पासबुक लेकर नज़दीकी सीएससी केंद्र या पीएम-किसान पोर्टल पर
  पंजीकरण करें, या ग्राम लेखपाल से पूछें। …
```

---

## What you need to do

**Backend** — replace `backend/` and redeploy. It adds:

```
POST /api/calls            the call (pick up, turns, end)
POST /api/transcribe       transcribe a clip recorded while offline
GET  /api/calls/:id        read a call back
```

Check: `curl .../api/health` should show `"call": true` and `"transcribe": true`, and
`curl -X POST .../api/transcribe` with an audio body should return `{"transcript": "..."}`
(needs `SARVAM_API_KEY` or `STT_HTTP_URL` — the same key your voice already uses).

**App** — the changed files are listed in `FILES.txt`; rebuild and uninstall the old APK.

## Tests

```bash
cd backend
npm run verify     # 53 smoke + 161 contract + 89 hurdle + 55 call = 358 checks
```

New in `npm run call`: the spoken answer is shorter than the entry, "tell me more" continues,
a follow-up continues instead of repeating, `/api/transcribe` turns a clip into text, and the
108 / 104 redirects still fire in the language asked.

## Honest limits

- Offline Hindi/Kannada speech needs the on-device language pack. Without it, the app saves
  the recording and transcribes it when the network returns — it cannot invent the words.
- `LocalAnswer` is a small on-device matcher over the downloaded pack, not the full server
  retrieval: it covers the pack's questions and concepts, and it deliberately says "I am not
  sure" rather than guessing.
- The Android code is not compiled in this environment (no SDK); the Kotlin changes are in
  ten files and follow the existing patterns, and the API they call is covered by the 358
  server-side checks.

---

## 3. Hindi / Kannada voice failing while English works (online)

**Cause:** `SpeechInput.create()` used the phone's *on-device* recogniser whenever the phone had one,
even with internet. That recogniser only has the language packs installed on the phone (often just
English), so Hindi/Kannada returned `ERROR_LANGUAGE_NOT_SUPPORTED/UNAVAILABLE` and the app showed
"voice recognition not available on this phone".

**Fix:**
- `SpeechInput.create(context, online)`: online -> Google's cloud recogniser (all Indian languages, no
  download); offline -> on-device recogniser (needs the language pack).
- A fresh recogniser is created for each question/turn, so going online/offline is picked up.
- If an online attempt still reports a language problem, the Ask screen opens Google's voice-typing
  dialog as a last resort and puts the result in the question box.
- `AndroidManifest.xml`: added `<queries>` so Android 11+ lets the app see the speech services.
