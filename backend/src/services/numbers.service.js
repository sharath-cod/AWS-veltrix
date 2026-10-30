// Hurdle 3, pillar 3: a misheard number can cost someone money.
//
// Speech recognition on Indian languages confuses numbers in ways that change the
// ANSWER, not just the wording:
//   "terah hajar" (13,000)  <-> "tees hajar" (30,000)
//   "pandrah" (15)          <-> "pachas" (50)
//   "50,000"                <-> "15,000"      (one digit dropped or added)
//   "1 lakh 20 hajar"       <-> "1 lakh"      (a scale word lost)
// and "income 1,20,000" heard as "12,000" flips eligibility on almost every scheme.
//
// So a number is never trusted straight from the microphone. It is:
//   1. parsed       - digits (ASCII / Devanagari / Kannada), words, lakh/crore, mixed forms
//   2. classified   - money / age / date / percent / count, because money is the dangerous one
//   3. sanity-checked against the saved profile (a 10x jump is almost always the microphone)
//   4. read back    - spoken back in words, with the one most likely alternative offered
//   5. confirmed    - and only the CONFIRMED value is ever saved or used in a verdict
//
// Rule-based, offline, no model.

const { normalize } = require('../utils/text');

// ---------------------------------------------------------------- digits
const DEV = '०१२३४५६७८९';
const KAN = '೦೧೨೩೪೫೬೭೮೯';
const toAsciiDigits = (s) =>
  String(s == null ? '' : s)
    .replace(/[०-९]/g, (d) => String(DEV.indexOf(d)))
    .replace(/[೦-೯]/g, (d) => String(KAN.indexOf(d)));

// ---------------------------------------------------------------- number words
// Only the words people actually say out loud, and deliberately including the
// sound-alike pairs that speech recognition mixes up.
const UNITS = {
  en: { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 },
  hi: { ek: 1, ik: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4, panch: 5, paanch: 5, chhe: 6, che: 6, chah: 6,
    saat: 7, sat: 7, aath: 8, ath: 8, nau: 9, no: 9, das: 10, dus: 10, gyarah: 11, barah: 12, terah: 13, tera: 13,
    chaudah: 14, pandrah: 15, pandra: 15, solah: 16, satrah: 17, atharah: 18, unnis: 19,
    bees: 20, bis: 20, pachees: 25, tees: 30, tis: 30, paintis: 35, chalees: 40, chalis: 40,
    pachas: 50, pachaas: 50, saath: 60, sath: 60, sattar: 70, assi: 80, asi: 80, nabbe: 90, nabbe: 90,
    sau: 100, so: 100 },
  kn: { ondu: 1, eradu: 2, mooru: 3, muru: 3, nalku: 4, nalaku: 4, aidu: 5, aidu: 5, aaru: 6, aru: 6,
    elu: 7, entu: 8, ombattu: 9, hattu: 10, hannondu: 11, hanneradu: 12, hadimooru: 13, hadinalku: 14,
    hadinaidu: 15, hadinaru: 16, hadinelu: 17, hadinentu: 18, hattombattu: 19,
    ippattu: 20, muvvattu: 30, nalavattu: 40, aivattu: 50, aivathu: 50, aravattu: 60, eppattu: 70,
    embattu: 80, tombattu: 90, nooru: 100, nuru: 100 },
};

// Devanagari and Kannada numerals written as words
const SCRIPT_UNITS = {
  hi: { 'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6, 'सात': 7,
    'आठ': 8, 'नौ': 9, 'दस': 10, 'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15,
    'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20, 'पच्चीस': 25, 'तीस': 30, 'पैंतीस': 35,
    'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90, 'सौ': 100 },
  kn: { 'ಸೊನ್ನೆ': 0, 'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಆರು': 6, 'ಏಳು': 7,
    'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10, 'ಹನ್ನೊಂದು': 11, 'ಹನ್ನೆರಡು': 12, 'ಹದಿಮೂರು': 13, 'ಹದಿನಾಲ್ಕು': 14,
    'ಹದಿನೈದು': 15, 'ಹದಿನಾರು': 16, 'ಹದಿನೇಳು': 17, 'ಹದಿನೆಂಟು': 18, 'ಹತ್ತೊಂಬತ್ತು': 19, 'ಇಪ್ಪತ್ತು': 20,
    'ಮೂವತ್ತು': 30, 'ನಲವತ್ತು': 40, 'ಐವತ್ತು': 50, 'ಅರವತ್ತು': 60, 'ಎಪ್ಪತ್ತು': 70, 'ಎಂಬತ್ತು': 80,
    'ತೊಂಬತ್ತು': 90, 'ನೂರು': 100 },
};

// lakh/crore are said the same way in all three languages, which is why they survive
// code-mixing, and why losing one changes the answer by 100x.
const SCALES = {
  hundred: 100, sau: 100, so: 100, nooru: 100, nuru: 100, 'सौ': 100, 'ನೂರು': 100, 'शत': 100,
  thousand: 1000, hajar: 1000, hazar: 1000, hazaar: 1000, hajaar: 1000, saavira: 1000, savira: 1000,
  'हज़ार': 1000, 'हजार': 1000, 'ಸಾವಿರ': 1000, k: 1000,
  lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000, laksha: 100000, laksh: 100000, 'लाख': 100000, 'ಲಕ್ಷ': 100000,
  crore: 10000000, crores: 10000000, koti: 10000000, 'करोड़': 10000000, 'ಕೋಟಿ': 10000000,
};

const NUM_WORDS = new Map();
for (const table of [UNITS.en, UNITS.hi, UNITS.kn, SCRIPT_UNITS.hi, SCRIPT_UNITS.kn]) {
  for (const [w, v] of Object.entries(table)) NUM_WORDS.set(normalize(w), { type: 'num', value: v });
}
for (const [w, v] of Object.entries(SCALES)) NUM_WORDS.set(normalize(w), { type: 'scale', value: v });

// ---------------------------------------------------------------- context words
const MONEY_CTX = /rupee|rupees|rs\.?|₹|rupaye|rupay|paisa|paise|rokda|rupayi|amount|income|aay|aamdani|kamai|salary|wages|pension|penshan|subsidy|sabsidi|benefit|loan|instalment|kist|रुपये|रुपए|पैसा|रकम|आय|आमदनी|कमाई|पेंशन|सब्सिडी|ರೂಪಾಯಿ|ಹಣ|ಮೊತ್ತ|ಆದಾಯ|ಸಂಪಾದನೆ|ಪಿಂಚಣಿ|ಸಬ್ಸಿಡಿ|ಸಹಾಯಧನ/;
const AGE_CTX = /age|umar|vayasu|vayas|vayassu|years? old|saal ka|sal ki|वर्ष की उम्र|उम्र|आयु|ವಯಸ್ಸು|ವರ್ಷದ/;
const PCT_CTX = /%|percent|per cent|प्रतिशत|ಪ್ರತಿಶತ/;
const DATE_CTX = /date|tarikh|tithi|dinank|deadline|last date|दिनांक|तारीख|तिथि|ದಿನಾಂಕ|ತಾರೀಖು/;
const COUNT_CTX = /acre|acres|एकड़|ಎಕರೆ|member|members|people|person|children|child|kids|लोग|सदस्य|ಜನ|ಸದಸ್ಯ|महीने|महीना|तिंगळु|ತಿಂಗಳು|month|months/;
const YEAR_CTX = /year|years|annual|per year|yearly|saal|वर्ष|साल|ವರ್ಷ|ವರ್ಷಕ್ಕೆ/;

// ---------------------------------------------------------------- parsing
const TOKEN_RE = /[0-9०-९೦-೯]+(?:[.,][0-9०-९೦-೯]+)*|[\p{L}\p{M}]+|₹|%|[^\s\p{L}\p{M}\p{N}]/gu;

function tokenizeWithSpans(text) {
  const s = toAsciiDigits(String(text || ''));
  const out = [];
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(s)) !== null) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

const isNumericToken = (t) => /^[0-9]+(?:[.,][0-9]+)*$/.test(t);
const toNumber = (t) => Number(String(t).replace(/,/g, ''));

function evalRun(items) {
  // items: [{type:'num'|'scale', value}]
  let total = 0;
  let current = 0;
  let sawScale = false;
  for (const it of items) {
    if (it.type === 'scale') {
      sawScale = true;
      current = (current === 0 ? 1 : current) * it.value;
      total += current;
      current = 0;
    } else {
      current += it.value;
    }
  }
  return { value: total + current, sawScale };
}

const KIND_ORDER = [
  ['money', MONEY_CTX], ['date', DATE_CTX], ['age', AGE_CTX], ['percent', PCT_CTX], ['count', COUNT_CTX],
];

function classify(tokens, index, runLength) {
  // look at the words just before the number (strongest signal) then just after
  const before = tokens.slice(Math.max(0, index - 5), index).map((t) => t.text).join(' ');
  const after = tokens.slice(index + runLength, index + runLength + 4).map((t) => t.text).join(' ');
  for (const [kind, re] of KIND_ORDER) if (re.test(before)) return kind;
  if (YEAR_CTX.test(after) && MONEY_CTX.test(before)) return 'money';
  for (const [kind, re] of KIND_ORDER) if (re.test(after)) return kind;
  if (YEAR_CTX.test(after)) return 'count';
  return 'count';
}

/**
 * Find every number in a sentence.
 * Returns [{ raw, value, kind, start, end, sawScale, unit }].
 * `kind` is the thing that decides how carefully we treat it: money and dates are
 * read back always; ages are read back when they come from speech.
 */
function parseNumbers(text, { context = '' } = {}) {
  const tokens = tokenizeWithSpans(text);
  const ctxTokens = context ? tokenizeWithSpans(`${context} `) : [];
  const results = [];
  let i = 0;
  while (i < tokens.length) {
    const tk = tokens[i];
    const word = NUM_WORDS.get(normalize(tk.text));
    const numeric = isNumericToken(tk.text);
    if (!numeric && !word) { i += 1; continue; }

    const run = [];
    let j = i;
    let sawScale = false;
    while (j < tokens.length) {
      const t = tokens[j];
      const w = NUM_WORDS.get(normalize(t.text));
      if (isNumericToken(t.text)) {
        run.push({ type: 'num', value: toNumber(t.text) });
      } else if (w) {
        run.push(w);
        if (w.type === 'scale') sawScale = true;
      } else if (/^(and|aur|matra|only|ka|ke|ki)$/i.test(t.text) && run.length) {
        // "ek lakh aur bees hajar" - keep the run going
      } else {
        break;
      }
      j += 1;
    }

    const { value } = evalRun(run);
    if (Number.isFinite(value)) {
      const endToken = tokens[j - 1];
      const kind = classify(tokens, i, j - i);
      results.push({
        raw: String(text).slice(tk.start, endToken.end),
        value,
        kind,
        sawScale,
        start: tk.start,
        end: endToken.end,
      });
    }
    i = Math.max(j, i + 1);
  }
  // A bare number inside a money sentence ("income 120000") inherits the sentence's money context
  const sentenceMoney = MONEY_CTX.test(String(text || '')) || MONEY_CTX.test(context);
  if (sentenceMoney) for (const r of results) if (r.kind === 'count' && r.value >= 1000) r.kind = 'money';
  if (ctxTokens.length) { /* context only widens money detection above */ }
  return results;
}

// ---------------------------------------------------------------- formatting
function groupIndian(n) {
  const s = String(Math.round(Number(n)));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

const SCALE_WORD = {
  en: { crore: 'crore', lakh: 'lakh', thousand: 'thousand', hundred: 'hundred' },
  hi: { crore: 'करोड़', lakh: 'लाख', thousand: 'हज़ार', hundred: 'सौ' },
  kn: { crore: 'ಕೋಟಿ', lakh: 'ಲಕ್ಷ', thousand: 'ಸಾವಿರ', hundred: 'ನೂರು' },
};

/**
 * Say a number the way the person would: "1 ಲಕ್ಷ 20 ಸಾವಿರ", not "one hundred and twenty thousand".
 * Digits carry the value; only the scale is spoken, which is both natural in all three
 * languages and impossible to get wrong by inflection.
 */
function sayNumber(value, language = 'en') {
  const lang = SCALE_WORD[language] ? language : 'en';
  const w = SCALE_WORD[lang];
  let n = Math.round(Number(value) || 0);
  if (n === 0) return '0';
  if (n < 1000) return String(n);
  const parts = [];
  for (const [unit, size] of [['crore', 10000000], ['lakh', 100000], ['thousand', 1000]]) {
    if (n >= size) {
      const q = Math.floor(n / size);
      parts.push(`${q} ${w[unit]}`);
      n -= q * size;
    }
  }
  if (n > 0) parts.push(String(n));
  return parts.join(' ');
}

const CURRENCY = { en: 'rupees', hi: 'रुपये', kn: 'ರೂಪಾಯಿ' };

function formatValue(entry, language = 'en') {
  if (entry.kind === 'money') return `₹${groupIndian(entry.value)}`;
  if (entry.kind === 'percent') return `${entry.value}%`;
  if (entry.kind === 'age') return `${entry.value}`;
  return groupIndian(entry.value);
}

// ---------------------------------------------------------------- confusion
// The alternatives the recogniser plausibly produced. Kept to at most two, because
// a wall of choices is worse than no choice.
const SOUND_ALIKE = {
  2: [10], 10: [2], 3: [30], 30: [3], 12: [20], 20: [12], 13: [30], 14: [40], 40: [14],
  15: [50], 50: [15], 16: [60], 60: [16], 17: [70], 70: [17], 18: [80], 80: [18], 19: [90], 90: [19],
  25: [50], 35: [50], 45: [54], 54: [45], 100: [1000], 500: [5000], 5000: [50000],
  // "dedh lakh" (1.5) against "do lakh" (2) is one sound apart, and it decides eligibility
  150000: [250000], 250000: [150000], 120000: [150000],
};

function confusionCandidates(entry) {
  const v = entry.value;
  const range = RANGES[entry.kind] || [0, Infinity];
  const out = [];
  const push = (value, reason, rank) => {
    if (!Number.isFinite(value) || value <= 0 || value === v) return;
    if (value < range[0] || value > range[1]) return;
    if (out.some((o) => o.value === value)) return;
    out.push({ value, reason, rank });
  };
  // a known sound-alike pair comes first: it is the mistake people actually make
  for (const alt of SOUND_ALIKE[v] || []) push(alt, 'sounds-alike', 1);
  // the pair that flips scheme eligibility
  if (v === 100000) push(50000, 'common-confusion', 0);
  if (v === 50000) push(100000, 'common-confusion', 0);
  // a dropped or an added zero. Which one is likelier depends on the size of the number:
  // below ten thousand people drop a zero, above it they add one.
  if (v >= 100) push(v * 10, 'zero-dropped', v >= 10000 ? 3.5 : 2);
  if (v >= 1000) push(v / 10, 'zero-added', v >= 10000 ? 2 : 3.5);
  // a lost scale word only matters if what is left is still a believable amount
  if (entry.sawScale && v >= 100000 && v / 100 >= 10000) push(v / 100, 'scale-lost', 2.5);
  return out.sort((a, b) => a.rank - b.rank).slice(0, 2).map(({ value, reason }) => ({ value, reason }));
}

// ---------------------------------------------------------------- sanity
const RANGES = {
  money: [100, 2000000], // 20 lakh: above this a "yearly income" is a parsing error, not a person
  age: [1, 110],
  percent: [0, 100],
  count: [1, 100000],
};

/**
 * Does this number make sense next to what we already know about the person?
 * A 10x jump in income is the microphone, not the person, and it silently flips
 * eligibility, so it must be asked about, never absorbed.
 */
function plausibility(entry, profile = {}) {
  const flags = [];
  const range = RANGES[entry.kind];
  if (range && (entry.value < range[0] || entry.value > range[1])) flags.push({ code: 'out-of-range', kind: entry.kind });

  const saved = entry.kind === 'money' ? profile.annualIncome : entry.kind === 'age' ? profile.age : null;
  if (Number.isFinite(saved) && saved > 0) {
    const ratio = entry.value / saved;
    if (ratio >= 8 || ratio <= 1 / 8) flags.push({ code: 'tenfold-change', from: saved, to: entry.value });
  }
  return flags;
}

const needsConfirmation = (entry, { fromSpeech = false } = {}) => {
  if (entry.kind === 'money' || entry.kind === 'date') return true; // always: money is irreversible
  if (entry.kind === 'age' && fromSpeech) return true;
  return false;
};

// ---------------------------------------------------------------- read back
const T = {
  heard: {
    en: (v, words) => `I heard ${v}${words ? ` — ${words}` : ''}.`,
    hi: (v, words) => `मैंने ${v}${words ? ` यानी ${words}` : ''} सुना।`,
    kn: (v, words) => `ನಾನು ${v}${words ? ` ಅಂದರೆ ${words}` : ''} ಕೇಳಿದೆ.`,
  },
  right: { en: 'Is that right?', hi: 'सही है?', kn: 'ಸರಿಯೇ?' },
  alt: {
    en: (v) => `Or was it ${v}?`,
    hi: (v) => `या ${v} था?`,
    kn: (v) => `ಅಥವಾ ${v} ಆಗಿತ್ತಾ?`,
  },
  confirm: { en: 'Yes, correct', hi: 'हाँ, सही है', kn: 'ಹೌದು, ಸರಿ' },
  change: { en: 'No, let me change it', hi: 'नहीं, बदलना है', kn: 'ಇಲ್ಲ, ಬದಲಿಸಬೇಕು' },
  whyMoney: {
    en: 'I ask because a wrong amount can change whether you get the benefit.',
    hi: 'पूछ रहा हूँ क्योंकि गलत रकम से फ़ायदा मिलना या न मिलना बदल सकता है।',
    kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ ಏಕೆಂದರೆ ತಪ್ಪು ಮೊತ್ತ ಸೌಲಭ್ಯ ಸಿಗುವುದನ್ನು ಬದಲಿಸಬಹುದು.',
  },
  whyTenfold: {
    en: (from) => `Earlier you told me ${from}. That is a big difference, so let us check.`,
    hi: (from) => `पहले आपने ${from} बताया था। बहुत फ़र्क है, इसलिए जाँच लें।`,
    kn: (from) => `ಮೊದಲು ನೀವು ${from} ಹೇಳಿದ್ದೀರಿ. ತುಂಬಾ ವ್ಯತ್ಯಾಸ ಇದೆ, ಪರಿಶೀಲಿಸೋಣ.`,
  },
};

function withUnit(entry, language) {
  if (entry.kind === 'money') return `${sayNumber(entry.value, language)} ${CURRENCY[language] || CURRENCY.en}`;
  if (entry.kind === 'age') return `${sayNumber(entry.value, language)}`;
  return '';
}

/**
 * The read-back card: what we heard, how it is written, how it is spoken,
 * the one alternative worth offering, and the two buttons.
 */
function readBack(entry, { language = 'en', alternatives = [], flags = [] } = {}) {
  const lang = T.heard[language] ? language : 'en';
  const value = formatValue(entry, lang);
  const words = withUnit(entry, lang);
  const lines = [T.heard[lang](value, words), T.right[lang]];
  if (alternatives.length) lines.push(T.alt[lang](formatValue({ ...entry, value: alternatives[0].value }, lang)));
  const tenfold = flags.find((f) => f.code === 'tenfold-change');
  const note = tenfold ? T.whyTenfold[lang](`₹${groupIndian(tenfold.from)}`) : entry.kind === 'money' ? T.whyMoney[lang] : null;

  return {
    kind: entry.kind,
    value: entry.value,
    display: value,
    spoken: words,
    text: lines.join(' '),
    note,
    language: lang,
    alternatives: alternatives.map((a) => ({ value: a.value, display: formatValue({ ...entry, value: a.value }, lang), reason: a.reason })),
    buttons: { confirm: T.confirm[lang], change: T.change[lang] },
    flags,
  };
}

/** Merge confirmed values into the profile. Only confirmed values ever reach here. */
function applyConfirmed(profile = {}, confirmed = {}) {
  const out = { ...profile };
  for (const [k, v] of Object.entries(confirmed)) {
    if (v === undefined || v === null) continue;
    if (k === 'annualIncome' || k === 'age') out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

module.exports = {
  toAsciiDigits, parseNumbers, sayNumber, groupIndian, formatValue,
  confusionCandidates, plausibility, needsConfirmation, readBack, applyConfirmed,
  NUM_WORDS, SCALES, RANGES,
};
