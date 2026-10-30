# Hurdle: Stale Knowledge and Read-Back

Offline knowledge goes out of date: a scheme's rules may have changed since the pack was
downloaded. Rural users mix languages, and mistakes with numbers can be costly.

Three hints, three mechanisms. Everything below works offline except the server calls, and
each piece has an automated check (`npm run hurdles`, 89 assertions).

---

## Hint 1 — "The information on the phone was correct on the day it was downloaded"

The point is not that the copy is old, it is *which fact* moved and *where* to confirm it.
So a copy is never just "stale": it names the entries that changed and the date each was
checked.

**Every entry carries its own fact metadata** (`backend/src/data/facts.js`)

```json
{
  "id": "kb-scheme-pm-kisan",
  "asOf": "2026-09-28",
  "volatile": true,
  "volatileFacts": ["amount", "deadline", "eligibility"],
  "verifyUrl": "https://pmkisan.gov.in",
  "verifyAt": "the PM-KISAN portal or the Gram Panchayat"
}
```

`volatileFacts` is data, not a guess: money, deadlines and eligibility move; how to treat a
snake bite does not (`kb-health-snake-bite` is marked stable and the app stops nagging about
it). `asOf` is a fixed date, not boot time, so a restart never makes every phone think
everything changed.

**A change feed, not just a version number**

- `GET /api/knowledge/changes?downloadedAt=<ISO>&have=<packVersion>` → every entry re-checked
  after that date, with `changedFields`, `asOf`, `verifyUrl` and a trilingual summary:
  *"PM-KISAN Samman Nidhi — re-checked on 2026-09-28. The amount, last date, who can apply
  may have changed, so confirm before you act."*
- With an unknown old version and no download date it falls back to `basis: "volatile-only"`
  and lists everything that can move, rather than pretending nothing changed.

**On the phone** (`data/KnowledgePack.kt`)

- Remembers the pack version, when it was confirmed, the newest `contentAsOf`, and the change
  list — all in local prefs, so the warning appears with no network.
- The banner now says *"3 answers have been re-checked since your copy was made. Open them
  before you act"* and expands into the list, each with a **Verify on the official page**
  button.
- `Checked on 2026-09-28` under the banner, and every answer/scheme detail shows *"This rule
  was checked on … — Verify at …"* plus the official link.

**Per answer, not just per pack**

`POST /api/query` returns `fact` (`asOf`, `volatile`, `volatileFacts`, `verifyUrl`,
`verifyAt`) and `recheck` with a trilingual message. When the entry was re-checked *after*
this phone's download, `recheck.changedSinceDownload` is true and the message says so.

**Demo it in ten seconds**

```bash
npm run touch -- kb-scheme-pm-kisan      # mark one entry as re-checked today
# restart, then on the phone: the banner shows 1 changed answer and names PM-KISAN
```
With `MONGODB_URI` set it updates the document; without it, it prints the exact line to change
in `src/data/facts.js`.

---

## Hint 2 — "Rural users don't stick to one language per sentence"

**The server answers in the language the question was asked in.** The Ask screen now sends
`language: "auto"`; the server detects the dominant language of the question and answers in
it, returning `answerLanguage`. A user whose menu is in English but who asks
`विद्यार्थीवृत्ति के लिए क्या चाहिए` gets a Hindi answer, and the screen shows *"Answered in
हिन्दी"* and switches the text-to-speech voice to match.

Detection works on script **and** romanised words: `bukhar hai kya karu` is Hindi,
`jwara ide enu madbeku` is Kannada, `how do I open a bank account` stays English. Number
words are ignored for this decision (`do` is Hindi "two" and English "do"), so an English
sentence is not mistaken for Hindi.

**The read-back understands what people actually say** (`services/numbers.js`, mirrored in
`utils/NumberReadBack.kt`)

| Said | Understood |
|---|---|
| `dedh lakh rupaye` / `डेढ़ लाख` / `ಎರಡೂವರೆ ಲಕ್ಷ` | 1,50,000 / 1,50,000 / 2,50,000 |
| `paune do hazaar` | 1,750 (paune takes a quarter *off*) |
| `sadhe do hazaar` | 2,500 (sadhe adds a half) |
| `sava sau` | 125 |
| `ek lakh pachas hazaar` | 1,50,000 |
| `२ lakh 50 thousand` | 2,50,000 (Devanagari digits inside an English phrase) |
| `paanch hazaar rupaye` | ₹5,000 (amount, because a currency word is attached) |

Fraction words were previously dropped silently — exactly the kind of miss that costs money.
Money words with **no** understandable amount (`kitne rupaye milenge`) are now caught and the
user is asked to repeat the amount instead of the app quietly ignoring it.

---

## Hint 3 — "A misheard number can cost someone money"

**Read-back is now enforced by the server, not only by the phone.** The old gate lived in the
app, so a client bug, an older APK or the voice path could skip it.

```
POST /api/query { question, requireConfirmation: true }
  → { requiresConfirmation: true,
      confirmation: { token, expiresInSeconds, numbers, dates,
                      prompt: { en, hi, kn }, speechScript } }     // no answer yet
POST /api/query/confirm { token, confirmed: true }                 // or { utterance: "haan" }
  → { confirmed: true, confirmedNumbers, answer, fact, recheck, … }
```

- Tokens are single-use, bound to the device, and expire in ten minutes; a second use returns
  `409 CONFIRMATION_USED`, an expired one `CONFIRMATION_EXPIRED`.
- **Voice confirmation**: `POST /api/numbers/confirm { utterance }` understands `haan`,
  `ji haan`, `सही है`, `haudu`, `ಹೌದು`, `sari`, `yes` … and `nahi`, `गलत है`, `illa`, `ಇಲ್ಲ`,
  `no` … An unclear answer (`maybe later`) is not treated as yes — the question stays open.
- **Dates too**: `01/11/2026` is ambiguous, so it is read back both ways (*1 November 2026 or
  11 January 2026*) in the user's language, because a deadline read the wrong way round makes
  someone miss it.
- **IDs**: a 10-digit phone number is read back digit by digit (`nine, eight, seven…`).
- **The answer is read back too**: `answerSpeech` splits the answer into prose and numbers so
  "Read answer aloud" speaks ₹6,000 as *six, zero, zero, zero* in the user's language.
- **Voice calls**: `POST /api/voice-sessions/{id}/turns?confirm=true` holds the answer, speaks
  the read-back prompt (Polly when configured, otherwise the app's own TTS), returns a token,
  and answers only after the user says `haan` / `illa` on the next turn.

Backward compatible: without `requireConfirmation` the endpoint behaves exactly as before, so
an older APK in the field keeps working.

---

## What the app shows

| Situation | Screen |
|---|---|
| Copy is old | Banner: *"This information is N days old… confirm at the Gram Panchayat"* |
| Some answers changed | Banner: *"3 answers re-checked since your copy"* → expandable list with Verify links |
| Answer from a moving fact | *"This rule was checked on 2026-09-28 — Verify at the PM-KISAN portal"* + **Open the official page** |
| Answer re-checked after download | ⚠ *"This answer was re-checked on 2026-09-28, after your copy was made — the amount may be different"* |
| Question has an amount/date | Read-back card: what was understood, digit by digit, with **Yes, correct** / **No, I will fix it** / **Say yes** / **Hear again** |
| User says no | *"Cancelled. Please say the question again, slowly, with the amount."* |
| Question asked in another language | Answer in that language + *"Answered in ಕನ್ನಡ"* |

---

## Files

```
backend/src/data/facts.js                 per-entry asOf / volatileFacts / verifyUrl / verifyAt
backend/src/services/freshness.js         manifest, compare, changesSince, recheckFor
backend/src/services/numbers.js           fractions, dates, yes/no, speech script, dominant language
backend/src/services/confirmations.js     single-use, device-bound, 10-minute tokens
backend/src/services/answer.js            auto language, fact + recheck + answerSpeech per answer
backend/src/controllers/query.controller.js   the read-back gate and /api/query/confirm
backend/src/controllers/voice.controller.js   the same gate for voice turns
backend/src/routes/numbers.routes.js      /readback, /confirm (spoken yes/no), /speech
backend/src/routes/knowledge.routes.js    /changes
backend/scripts/hurdle-test.js            89 checks covering all three hints
backend/scripts/touch-entry.js            demo: mark an entry as re-checked
android/…/utils/NumberReadBack.kt         offline twin: fractions, dates, yes/no, speech script
android/…/data/KnowledgePack.kt           contentAsOf, change list, "checked on" label
android/…/ui/screens/features/FeatureScreens.kt  banner + changes, auto language, gate, verify links
android/…/ui/screens/call/VirtualCallScreen.kt   voice read-back and spoken yes/no
```

## Test

```bash
cd backend
npm run hurdles    # 89 checks: change feed, mixed language, read-back gate, dates, yes/no
npm run verify     # smoke (53) + contract (161) + hurdles (89)
```

Not done, deliberately: the number lexicon covers the numbers and dates people actually say,
not every dialect word; anything the parser cannot read is reported rather than guessed, and
the user always sees and hears what was understood.
