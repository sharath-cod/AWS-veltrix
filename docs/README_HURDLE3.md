# Hurdle 3 — Stale Knowledge and Read-Back

Drop-in code for the GramSahayak backend. Three mechanisms, one gate, no new dependencies.

```
src/services/freshness.service.js   stale knowledge: shelf lives, disclosure, pack deltas, "what changed"
src/services/lang.service.js        code-mixed input: script runs, romanised lexicon, reply language, per-script TTS
src/services/numbers.service.js     number parsing, confusion candidates, sanity checks, read-back sentences
src/services/gate.service.js        the read-back gate + the decorator that wires freshness into an answer
src/controllers/hurdle3.controller.js
src/routes/hurdle3.routes.js
tests/hurdle3.test.js               40 tests, no database, no network, no AI
```

Everything is rule-based and pure. No model, no network call, nothing that needs a DB. The same
logic runs on the server, inside the Android app, and in `hurdle3_demo.html`.

---

## 1. Install

```bash
# copy the six files into the backend, keeping the folders
cp src/services/{freshness,lang,numbers,gate}.service.js   <your-backend>/src/services/
cp src/controllers/hurdle3.controller.js                   <your-backend>/src/controllers/
cp src/routes/hurdle3.routes.js                            <your-backend>/src/routes/
cp tests/hurdle3.test.js                                   <your-backend>/tests/

# register the routes: one line in src/routes/index.js
router.use('/', require('./hurdle3.routes'));
```

`package.json`:

```json
"test:hurdle3": "node --test tests/hurdle3.test.js"
```

Nothing else in the existing code has to change for the endpoints to work.

---

## 2. Wire it into the assistant (3 small patches)

### 2a. `src/services/assistant.service.js` — read-back before, freshness after

At the top:

```js
const gate = require('./gate.service');
```

In `respond()`, **before** step 1 (safety), add the gate. Emergencies must still win, so the
emergency check stays first:

```js
async function respond({ question, language = 'en', category, profile: savedProfile, deviceId }) {
  const text = String(question || '').trim();

  // 1. Safety first: emergencies never wait for routing, data or AI
  const emergency = detectEmergency(text);

  // 1b. HURDLE 3 — no money and no date reaches a verdict before it has been read back
  let gateCtx = null;
  if (!emergency) {
    const pre = gate.preflight({
      question: text, language, profile: savedProfile || {}, deviceId, fromSpeech: false,
    });
    if (!pre.proceed) return { ...pre.confirmation, awaitingConfirmation: true };
    gateCtx = pre.ctx; // the language decision and the parsed numbers, reused below
  }

  let corpus = null; // moved up out of the else branch so the end of the function can see it
  let result;
  let finalCategory;
  // ... the rest of the existing function is unchanged ...
```

and replace the final `return result;` with:

```js
  // HURDLE 3 — freshness on the facts the answer actually used, plus "here is what I understood"
  const all = corpus ? corpus.knowledge.concat(corpus.schemes, corpus.scholarships) : [];
  const wanted = new Set([result.matchedSlug, ...(result.matches || []).map((m) => m.slug)].filter(Boolean));
  return gate.decorate(result, gateCtx, all.filter((r) => wanted.has(r.slug)));
```

If you would rather not touch `respond()` at all, wrap it instead:

```js
const original = assistant.respond;
assistant.respond = async (args) => {
  const pre = gate.preflight({ ...args, fromSpeech: false });
  if (!pre.proceed) return { ...pre.confirmation, awaitingConfirmation: true };
  return gate.decorate(await original(args), pre.ctx, []);
};
```

### 2b. `src/services/speech.service.js` — vocabulary hint for the recogniser

In `transcribe()`, after the other form fields:

```js
form.append('prompt', require('./lang.service').sttPrompt(language)); // Whisper-compatible APIs bias on this
```

This is the cheapest fix for "PM Kisan" → "PM Keesan" and "50 hajar" → "15 hajar".

### 2c. Speech in, speech out — always confirm money

In `speechToSpeech()`, pass `fromSpeech: true` through the assistant call (or call
`gate.preflight({ ..., fromSpeech: true })` first). A spoken age then gets read back too, because
"तीस" and "तेरह" are one syllable apart.

---

## 3. Android changes

### 3a. Store the provenance, not just the content

```kotlin
// KnowledgeEntity / SchemeEntity
val asOf: Long,          // when the fact was last checked against the official source
val validUntil: Long?,   // deadline or sunset date, null when the fact does not expire by itself
val contentHash: String, // 16-char hash of the record, for delta pulls
val verifiedAt: Long?,
```

Room migration: `ALTER TABLE schemes ADD COLUMN asOf INTEGER NOT NULL DEFAULT 0` (and the rest),
then backfill `asOf` from the old `updatedAt` so nothing looks fresher than it is.

### 3b. Delta sync instead of a full pack

The existing `SyncWorker` already has the shape for this. Replace the full download with:

```
POST /api/pack/delta   { "known": { "<slug>": "<contentHash>" }, "previous": { "<slug>": <old record> } }
→ { changed: [...], removed: [...], whatChanged: { headline, lines, moneyChanged } }
```

`whatChanged` is the card to show: *"ಪಿಎಂ ಕಿಸಾನ್ — ವಾರ್ಷಿಕ ಮೊತ್ತ: ₹6,000 → ₹7,000"*. Store it, show
it once, and let the person dismiss it.

### 3c. A read-back screen

`POST /api/readback` takes the transcript and returns `cards[]` — one per dangerous number, each with
`display`, `spoken`, `text`, `note`, `alternatives[]` and the two button labels. Show one card at a
time, biggest risk first, and **do not call `/api/query` until `/api/confirm` returns `ok`**. The
confirmed value is what goes into the profile; the raw recogniser value is never stored.

### 3d. Per-script TTS

Every response now carries `speechSegments: [{ text, language, locale }]`. Queue one
`TextToSpeech.speak()` per segment with `setLanguage(Locale.forLanguageTag(segment.locale))`. One
voice for a mixed sentence will mangle either the English scheme name or the Kannada grammar.

---

## 4. New endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/pack/manifest` | the receipt for what the phone downloaded: `{ packId, generatedAt, items: [{ slug, hash, asOf, validUntil }] }` |
| POST | `/api/pack/delta` | `{ known, previous?, language }` → `{ changed, removed, whatChanged }` |
| POST | `/api/pack/diff` | `{ before, after, language }` → the field-level diff, for tests and tooling |
| POST | `/api/readback` | `{ text, language, profile, fromSpeech }` → read-back cards, nothing stored |
| POST | `/api/confirm` | `{ id, action: confirm\|correct\|cancel, corrected }` → the confirmed profile patch |
| GET | `/api/freshness/policy` | the shelf lives and confidence caps, so the phone mirrors the server |
| GET | `/api/language/probe?text=…` | what the server makes of a mixed sentence (demo + debugging) |

---

## 5. What the answer looks like now

```json
{
  "answer": "…ಪಿಎಂ ಕಿಸಾನ್‌ನಲ್ಲಿ …₹6,000 …",
  "language": "kn",
  "confidence": { "level": "medium", "score": 0.6, "cappedByFreshness": "stale" },
  "freshness": {
    "state": "stale",
    "asOf": "2026-09-13T00:00:00.000Z",
    "ageDays": 47,
    "disclose": true,
    "message": "…47 ದಿನಗಳ ಹಿಂದೆ…",
    "restrict": [],
    "refreshSuggested": true
  },
  "understanding": {
    "text": "ನೀವು ಕೇಳುತ್ತಿರುವುದು: ಪಿಎಂ ಕಿಸಾನ್ · ₹1,20,000",
    "mixed": true
  },
  "languagePolicy": { "mixed": true, "dominant": "en", "scripts": ["latin", "kannada"] },
  "speechSegments": [ { "text": "…", "language": "kn", "locale": "kn-IN" } ]
}
```

Existing fields are untouched, so nothing that already consumes `/api/query` breaks.

---

## 6. Test

```bash
npm run test:hurdle3     # 40 checks
```

What the tests pin down, in case a judge asks:

- a 5-day-old pack is fresh and says nothing; 15 days is stale and says so; 45 days is expired and the
  rupee figure is removed from the answer, not left to be believed
- health advice outlives a rupee amount, on purpose
- a manifest hash changes when the amount changes, and `deltaFor` reports exactly one changed record
- `diffRecords` catches a moved amount *inside prose* and a moved income limit inside the rule object
- `kisaan`, `kisan`, `किसान`, `ರೈತ`, `yojna`, `sabsidi`, `ಪಿಎಂ ಕಿಸಾನ್` all resolve to one concept
- `1 lakh 20 hajar`, `१ लाख २० हज़ार`, `೫೦೦೦`, `1.2 lakh`, `do hazar panch sau` all parse to the right value
- a 10× jump against the saved profile is flagged, never absorbed
- a money question is stopped for read-back; a fever question is not
- a confirmation cannot be replayed

---

## 7. Honest limitations

- The Hindi and Kannada number *words* in the read-back are rendered as "1 लाख 20 हज़ार" (digits plus
  the scale word), which is how people actually say it and which cannot be inflected wrongly. Native
  review is still worth 20 minutes before the demo.
- The romanised lexicon covers ~22 concepts and 8 scheme names. It is a demonstration of the
  mechanism, not a full Hinglish dictionary. Adding a name is one line in `NAMES`.
- Freshness policy numbers (21 / 30 / 90 / 7 days) are judgement calls. They are in one object at the
  top of `freshness.service.js` and are meant to be argued about.
- Pending confirmations are in memory, so they do not survive a restart. That is fine for a
  confirmation that lives ten minutes; it would need Redis for real traffic.
