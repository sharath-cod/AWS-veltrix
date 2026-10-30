# GramSahayak — final pack

The app, the backend and the three hurdle mechanisms in one folder. The backend ships three
suites: **51 endpoint checks, 131 screen-contract checks, 89 hurdle checks** (`npm run verify`).

> This file is the release note from the `gramsahayak-final` iteration, kept as written. In the
> consolidated repository these files live under `docs/`; see `../README.md` for the current layout
> and `MERGE_REPORT.md` for how the two source packs were combined.

```
android/        the Compose app (unchanged dependencies, no Gradle edits needed)
backend/        the Express API (Node 18+, four packages, no AWS SDK)
docs/           architecture, API, deployment, Android guide, frontend contract, hurdle write-up
```

---

## What this adds to the previous version

The previous backend made every screen work: speech to text, and answers across ten phases in
English, Hindi and Kannada. This version adds the **stale knowledge and read-back** hurdle
properly — on the server, on the phone, and offline.

### Hint 1 — "The information on the phone was correct on the day it was downloaded"

- Every entry now carries **`asOf`** (the date that fact was last checked), **`volatileFacts`**
  (amount / deadline / eligibility / fees / contact), **`verifyUrl`** (official page) and
  **`verifyAt`** (who to ask when there is no page). 48 of 56 entries are marked volatile; the
  other 8 are stable, so the app stops nagging about a snake-bite answer that cannot go stale.
- **`GET /api/knowledge/changes?downloadedAt=…&have=…`** answers *what* changed, not just
  *that* something changed: the entries re-checked after this phone's download, with the facts
  that moved and a trilingual summary. An unknown old version falls back to "everything that
  can move" instead of claiming nothing changed.
- **`POST /api/query`** returns `fact` and `recheck` per answer, including
  `changedSinceDownload` when the entry was re-checked after this phone's copy was made.
- On the phone: the banner names the count of changed answers and expands into the list with
  **Verify on the official page**; every answer and scheme shows *"This rule was checked on
  … — Verify at …"*.
- `npm run touch -- <entry-id>` marks one entry as re-checked today, so you can **show** the
  change feed live in a demo.

### Hint 2 — "Rural users don't stick to one language per sentence"

- **`language: "auto"`**: the answer comes back in the language the question was asked in, and
  the screen says *"Answered in ಕನ್ನಡ"* and switches the voice. Detection handles script and
  romanised words, and ignores number words that exist in both languages.
- The number parser now understands **fractions** — `dedh lakh` (1,50,000), `paune do hazaar`
  (1,750, because paune takes a quarter *off*), `sadhe do hazaar` (2,500), `sava sau` (125),
  `ಡೆಢ़`/`ಎರಡೂವರೆ ಲಕ್ಷ` — and **Devanagari/Kannada digits inside English phrases**
  (`२ lakh 50 thousand`). Before, these were dropped silently.
- **Money words with no readable amount** (`kitne rupaye milenge`) are caught and the user is
  asked to repeat, instead of the app quietly ignoring the question's amount.

### Hint 3 — "A misheard number can cost someone money"

- **The read-back gate is now enforced by the server.** `POST /api/query` with
  `requireConfirmation: true` withholds the answer when the question contains an amount, an ID
  or an ambiguous date, and returns a **single-use, device-bound, 10-minute token** plus the
  prompt in all three languages. `POST /api/query/confirm` releases it.
- **Voice confirmation**: `haan`, `ji haan`, `सही है`, `haudu`, `ಹೌದು`, `sari`, `yes` … and
  `nahi`, `गलत है`, `illa`, `ಇಲ್ಲ`, `no`. An unclear answer is *not* treated as yes.
- **Dates are read back too**: `01/11/2026` is ambiguous, so both readings are spelled out in
  the user's language — a deadline read the wrong way round is as costly as a wrong amount.
- **Phone numbers and IDs** are read back digit by digit.
- **Answers are read back as well**: `answerSpeech` splits prose from numbers so "Read answer
  aloud" speaks ₹6,000 as *six, zero, zero, zero*.
- **Voice calls** do the same: the turn holds the answer, speaks the read-back prompt (Polly
  when configured, otherwise the phone's own TTS), and answers only after the user says yes.
- Old APKs are unaffected: without `requireConfirmation` the API behaves exactly as before.

---

## Run it

```bash
cd backend
cp .env.example .env          # MONGODB_URI, plus ONE speech key if you want voice
npm install
npm run verify                # 51 + 131 + 89 checks, no AWS, no API key, no database
npm run seed                  # push the dataset (and the new fact dates) into MongoDB
npm run dev                   # http://localhost:5000
```

The app needs no change beyond this folder: `local.properties` still points at your service,
and the only new API calls are additive.

## Five-minute demo script

1. **Stale knowledge.** `npm run touch -- kb-scheme-pm-kisan`, restart. Open Ask: the banner
   reads *"1 answer re-checked since your copy"*; expand it → *"PM-KISAN — re-checked on
   <today>. The amount, last date, who can apply may have changed"* with **Verify on the
   official page**. Ask about PM-KISAN: the answer shows *"This rule was checked on <today> —
   Verify at the PM-KISAN portal"*.
2. **Mixed language.** Ask `bukhar hai kya karu` with the app in English — the answer comes
   back in Hindi, labelled *"Answered in हिन्दी"*.
3. **Read-back.** Ask `pm kisan 6000 rupaye kab aayega`. The answer is **held**; the card shows
   *"I understood: ₹6,000 (6 हज़ार रुपये. छह, शून्य, शून्य, शून्य). Is this correct?"*, spoken
   aloud. Tap **Yes, correct** (or tap **Say yes** and say *haan*) → the answer appears with
   the amount confirmed.
4. **Ambiguous date.** Ask `scholarship ki last date 01/11/2026 hai kya`. It is read back both
   ways: *1 November 2026 or 11 January 2026*.
5. **Voice.** Virtual call → record `paanch hazaar rupaye ka loan chahiye` → the call reads the
   amount back and waits; say `haudu` / `haan` → the answer follows.
6. **Offline.** Turn off data: the banner still shows the copy's age and the change list, and
   the Ask screen still reads numbers back locally before sending.

## Honest limits

- The number lexicon covers what people actually say, not every dialect word; anything it
  cannot read is reported rather than guessed.
- `asOf` dates are seed data describing when the content was reviewed — they are not live
  government data. Every volatile answer says to confirm on the official portal, and content
  stays `verified: false`.
- Spoken replies still need Amazon Polly; speech-to-text works with Sarvam or any Whisper
  endpoint.
- Retrieval is keyword based, so two entries in the same phase can both be reasonable answers
  (an OTP-fraud question is answered by the OTP or the KYC entry). Set `BEDROCK_MODEL_ID` to
  have a model rewrite the answer on top of the retrieved text.
- The Android side could not be compiled in this environment (no Android SDK); the Kotlin
  changes are limited to four files and follow the existing patterns, and the API contract
  they depend on is covered by the 131 contract checks.
