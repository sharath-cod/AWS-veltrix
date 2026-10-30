/**
 * Mixed-language number, date and confirmation understanding.
 *
 * Hurdle 2 (rural users do not stick to one language per sentence) and
 * hurdle 3 (a misheard number can cost money) both land here.
 *
 * One sentence can be "paanch thousand rupaye", "ಐದು hazaar", "२ lakh 50
 * thousand", "dedh lakh", "1/11/2026". Every number and date is:
 *   1. parsed from any mix of English / Hindi / Kannada words and digits
 *      (Latin, Devanagari and Kannada numerals), including fraction words
 *      such as dedh (1.5) and dhai (2.5);
 *   2. read back in the user's language, grouped Indian style AND digit by
 *      digit, so "pandrah" (15) can never quietly become "pachas" (50);
 *   3. flagged when the word is easily confused with another number, when a
 *      date could be read two ways (01/11 vs 11/01), or when money words
 *      appear with no amount that could be understood;
 *   4. turned into a speech script so any client can speak it correctly;
 *   5. answered with a yes / no parser in all three languages, so the user can
 *      confirm by voice instead of tapping.
 *
 * The same logic is mirrored in the Android app (utils/NumberReadBack.kt) so
 * read-back also works with no network.
 */

const DIGIT_MAPS = [
  '०१२३४५६७८९', // Devanagari
  '೦೧೨೩೪೫೬೭೮೯', // Kannada
];

function normalizeDigits(text) {
  return String(text || '').replace(/[०-९೦-೯]/g, (ch) => {
    for (const map of DIGIT_MAPS) {
      const i = map.indexOf(ch);
      if (i >= 0) return String(i);
    }
    return ch;
  });
}

// ---- lexicon -------------------------------------------------------------
const SMALL = {};
const add = (words, value) => words.split(' ').forEach((w) => { if (w) SMALL[w] = value; });

// English
'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'
  .split(' ').forEach((w, i) => { SMALL[w] = i; });
add('twenty', 20); add('thirty', 30); add('forty', 40); add('fifty', 50);
add('sixty', 60); add('seventy', 70); add('eighty', 80); add('ninety', 90);

// Hindi, romanised 1-99
const HI = ('ek do teen char paanch chhah saat aath nau das gyarah barah terah chaudah pandrah solah satrah atharah unnis bees ' +
  'ikkis baais teis chaubis pachchis chhabbis sattais atthais unatis tees iktis battis tentis chauntis paintis chhattis saintis adtis untalis chalis ' +
  'iktalis bayalis taintalis chauvalis paitalis chhiyalis saintalis adtalis unchas pachas ikyavan bavan trepan chauvan pachpan chhappan sattavan atthavan unsath saath ' +
  'iksath basath tirsath chausath painsath chiyasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar pachattar chhihattar satattar athattar unyasi assi ' +
  'ikyasi bayasi tirasi chaurasi pachasi chhiyasi satasi athasi nawasi nabbe ikyanve banve tiranve chauranve pachanve chhiyanve sattanve atthanve ninyanve').split(' ');
HI.forEach((w, i) => { SMALL[w] = i + 1; });
add('panch', 5); add('chhe', 6); add('che', 6); add('chah', 6); add('shunya', 0); add('sifar', 0);
add('paanchsau', 500);
// Hindi, Devanagari 0-10 and tens
'शून्य एक दो तीन चार पांच पाँच छह छः सात आठ नौ दस'.split(' ').forEach((w) => {
  const v = { 'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10 }[w];
  SMALL[w] = v;
});
add('बीस', 20); add('तीस', 30); add('चालीस', 40); add('पचास', 50); add('साठ', 60); add('सत्तर', 70); add('अस्सी', 80); add('नब्बे', 90);

// Kannada, romanised
const KN = { ondu: 1, eradu: 2, mooru: 3, nalku: 4, naalku: 4, aidu: 5, aaru: 6, elu: 7, entu: 8, ombattu: 9, hattu: 10,
  hannondu: 11, hanneradu: 12, hadimooru: 13, hadinaalku: 14, hadinaidu: 15, hadinaaru: 16, hadinelu: 17, hadinentu: 18, hontombattu: 19,
  ippattu: 20, muvattu: 30, naalvattu: 40, naluvattu: 40, aivattu: 50, aravattu: 60, eppattu: 70, embattu: 80, tombattu: 90, sonne: 0 };
Object.assign(SMALL, KN);
// Kannada script
Object.assign(SMALL, { 'ಸೊನ್ನೆ': 0, 'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಆರು': 6, 'ಏಳು': 7, 'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10,
  'ಇಪ್ಪತ್ತು': 20, 'ಮೂವತ್ತು': 30, 'ನಲವತ್ತು': 40, 'ಐವತ್ತು': 50, 'ಅರವತ್ತು': 60, 'ಎಪ್ಪತ್ತು': 70, 'ಎಂಬತ್ತು': 80, 'ತೊಂಬತ್ತು': 90 });

const MULT = {};
const addM = (words, v) => words.split(' ').forEach((w) => { MULT[w] = v; });
addM('hundred sau सौ nooru ನೂರು', 100);
addM('thousand hazaar hazar hajar हजार हज़ार saavira savira ಸಾವಿರ', 1000);
addM('lakh lac lakhs laksha लाख ಲಕ್ಷ', 100000);
addM('crore karod koti कोटि करोड़ करोड ಕೋಟಿ', 10000000);

/**
 * Fraction words. "dedh lakh" (1.5 lakh) and "dhai hazaar" (2500) are everyday
 * rural speech and were silently dropped before, which is exactly the kind of
 * miss that costs money. A fraction multiplies the number that follows it.
 */
const FRACTION = {};
/**
 * Fractions either add to the number that follows (dedh do = 1.5, sadhe do =
 * 2.5) or take a quarter off it (paune do = 1.75). Getting this wrong is a
 * thousand-rupee mistake, so both directions are modelled.
 */
const addF = (words, add, sub = 0) => words.split(' ').forEach((w) => { if (w) FRACTION[w] = { add, sub }; });
addF('adha aadha ardha half आधा अर्ध ಅರ್ಧ', 0.5);
addF('paune पौने ಒಂದೂಕಾಲು', 0, 0.25);
addF('dedh dedha देढ़ डेढ़ ಒಂದೂವರೆ', 1.5);
addF('sava sawa सवा ಒಂದೂಕಾಲು', 1.25);
addF('dhai ढाई ಎರಡೂವರೆ', 2.5);
addF('sarhe sadhe साढ़े ಎರಡೂಕಾಲು', 0.5);

const FILLER = new Set(['and', 'aur', 'mattu', 'और', 'ಮತ್ತು', 'point']);
const CURRENCY = new Set(['rs', 'rs.', 'inr', '₹', 'rupee', 'rupees', 'rupaye', 'rupaiya', 'rupay', 'rupayi', 'ruppees', 'रुपये', 'रुपए', 'रु', 'रूपये', 'ರೂಪಾಯಿ', 'ರೂ', 'ರುಪಾಯಿ']);

// Words that sound alike and are classic mis-hearings; each group is a risk set.
const CONFUSABLE = [
  ['saat', 'saath', 'sattar'],
  ['pandrah', 'pachas', 'pachchis'],
  ['teen', 'tees', 'teis'],
  ['nau', 'nabbe'],
  ['aath', 'assi'],
  ['bees', 'tees'],
  ['chalis', 'chaalis', 'char'],
  ['aidu', 'aivattu'],
  ['aaru', 'aravattu'],
  ['elu', 'eppattu'],
  ['entu', 'embattu'],
  ['ombattu', 'tombattu'],
  ['ippattu', 'muvattu'],
  ['do', 'dhai'],
  ['ek', 'dedh'],
];
const CONF_INDEX = {};
CONFUSABLE.forEach((group) => group.forEach((w) => { (CONF_INDEX[w] = CONF_INDEX[w] || []).push(group); }));

// ---- spoken forms ---------------------------------------------------------
const DIGIT_NAMES = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  hi: ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ'],
  kn: ['ಸೊನ್ನೆ', 'ಒಂದು', 'ಎರಡು', 'ಮೂರು', 'ನಾಲ್ಕು', 'ಐದು', 'ಆರು', 'ಏಳು', 'ಎಂಟು', 'ಒಂಬತ್ತು'],
};
const UNITS = {
  en: { crore: 'crore', lakh: 'lakh', thousand: 'thousand', hundred: 'hundred', rupees: 'rupees', point: 'point' },
  hi: { crore: 'करोड़', lakh: 'लाख', thousand: 'हज़ार', hundred: 'सौ', rupees: 'रुपये', point: 'दशमलव' },
  kn: { crore: 'ಕೋಟಿ', lakh: 'ಲಕ್ಷ', thousand: 'ಸಾವಿರ', hundred: 'ನೂರು', rupees: 'ರೂಪಾಯಿ', point: 'ದಶಮಾಂಶ' },
};

/** Indian digit grouping: 1234567 -> 12,34,567 */
function groupIndian(n) {
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** 250000 -> "2 lakh 50 thousand" in the user's language. */
function spokenValue(n, lang, withRupees) {
  const u = UNITS[lang] || UNITS.en;
  const whole = Math.trunc(n);
  let rest = whole;
  const parts = [];
  const take = (size, word) => {
    if (rest >= size) { parts.push(`${Math.floor(rest / size)} ${word}`); rest %= size; }
  };
  take(10000000, u.crore); take(100000, u.lakh); take(1000, u.thousand); take(100, u.hundred);
  if (rest > 0 || parts.length === 0) parts.push(String(rest));
  let out = parts.join(' ');
  const frac = Math.round((n - whole) * 100) / 100;
  if (frac > 0) out += ` ${u.point} ${String(frac).replace('0.', '')}`;
  return out + (withRupees ? ` ${u.rupees}` : '');
}

function digitByDigit(digits, lang) {
  const names = DIGIT_NAMES[lang] || DIGIT_NAMES.en;
  return String(digits).split('').map((d) => names[Number(d)] ?? d).join(', ');
}

// ---- parsing --------------------------------------------------------------
function tokenize(text) {
  const t = normalizeDigits(text).replace(/₹/g, ' ₹ ');
  const out = [];
  const re = /[\p{L}\p{M}]+\.?|\d[\d,]*(?:\.\d+)?|₹/gu;
  let m;
  while ((m = re.exec(t)) !== null) out.push({ text: m[0], index: m.index });
  return out;
}

function classify(raw) {
  const w = raw.toLowerCase().replace(/\.$/, '');
  if (/^\d/.test(w)) return { type: 'digits', value: Number(w.replace(/,/g, '')), digits: w.replace(/[,]/g, '') };
  if (w in MULT) return { type: 'mult', value: MULT[w], word: w };
  if (w in FRACTION) return { type: 'fraction', add: FRACTION[w].add, sub: FRACTION[w].sub, word: w };
  if (w in SMALL) return { type: 'small', value: SMALL[w], word: w };
  if (FILLER.has(w)) return { type: 'filler' };
  if (CURRENCY.has(w) || CURRENCY.has(raw)) return { type: 'currency' };
  return { type: 'other' };
}

const NUMERIC = new Set(['small', 'digits', 'mult', 'fraction']);

function evalRun(run) {
  let total = 0;
  let current = 0;
  let touched = false;
  // Fractions wait for the number they qualify: "paune do" (1.75) and
  // "sadhe do" (2.5) both need the next word before they mean anything.
  let pendingAdd = 0;
  let pendingSub = 0;
  const hasPending = () => pendingAdd !== 0 || pendingSub !== 0;
  const clearPending = () => { pendingAdd = 0; pendingSub = 0; };

  for (const tok of run) {
    if (tok.type === 'fraction') {
      pendingAdd += tok.add || 0;
      pendingSub += tok.sub || 0;
      touched = true;
      continue;
    }
    if (tok.type === 'small' || tok.type === 'digits') {
      let v = tok.value;
      if (hasPending()) { v = pendingAdd + tok.value - pendingSub; clearPending(); }
      current += v;
      touched = true;
    } else if (tok.type === 'mult') {
      const size = tok.value;
      if (hasPending()) {
        const fractionValue = pendingAdd - pendingSub;
        total += fractionValue * size;
        clearPending();
      } else if (size === 100) {
        current = (current || 1) * 100;
      } else {
        total += (current || 1) * size;
        current = 0;
      }
      touched = true;
    }
  }
  if (hasPending()) current += pendingAdd - pendingSub;
  return touched ? total + current : null;
}

function confusionsFor(run) {
  const seen = new Map();
  for (const tok of run) {
    if (tok.type !== 'small' && tok.type !== 'fraction') continue;
    (CONF_INDEX[tok.word] || []).forEach((group) => {
      const alts = group.filter((w) => w !== tok.word && (w in SMALL || w in FRACTION));
      if (alts.length) {
        seen.set(tok.word, alts.map((w) => ({
          word: w,
          value: w in SMALL ? SMALL[w] : FRACTION[w].add - FRACTION[w].sub,
        })));
      }
    });
  }
  return [...seen.entries()].map(([heard, couldBe]) => ({
    heard,
    heardValue: heard in SMALL ? SMALL[heard] : FRACTION[heard].add - FRACTION[heard].sub,
    couldBe,
  }));
}

/**
 * Extract every number in a free-form, mixed-language utterance.
 * Returns [{ raw, value, kind, display, digits?, spoken:{en,hi,kn}, readBack:{en,hi,kn}, confusions }]
 */
function extractNumbers(text) {
  const tokens = tokenize(text);
  const cls = tokens.map((t) => ({ ...t, ...classify(t.text) }));
  const found = [];
  let i = 0;
  while (i < cls.length) {
    if (!NUMERIC.has(cls[i].type)) { i += 1; continue; }
    const start = i;
    const run = [];
    while (i < cls.length) {
      const c = cls[i];
      if (NUMERIC.has(c.type)) { run.push(c); i += 1; }
      else if (c.type === 'filler' && i + 1 < cls.length && NUMERIC.has(cls[i + 1].type) && run.length) { i += 1; }
      else break;
    }
    const before = cls[start - 1];
    const after = cls[i];
    const currency = Boolean((before && before.type === 'currency') || (after && after.type === 'currency'));
    const raw = text.slice(cls[start].index, cls[i - 1].index + cls[i - 1].text.length);

    const allSingle = run.length >= 3 && run.every((t) => (t.type === 'small' || t.type === 'digits') && t.value >= 0 && t.value <= 9 && (t.type === 'small' || t.digits.length === 1));
    const longDigits = run.length === 1 && run[0].type === 'digits' && /^\d{9,}$/.test(run[0].digits);
    const confusions = confusionsFor(run);

    if (allSingle || longDigits) {
      const digits = longDigits ? run[0].digits : run.map((t) => t.value).join('');
      found.push(buildItem({ raw, kind: 'identifier', digits, confusions }));
      continue;
    }
    const value = evalRun(run);
    if (value === null) continue;
    found.push(buildItem({ raw, kind: currency ? 'amount' : 'number', value, confusions }));
  }
  return found;
}

function buildItem({ raw, kind, value, digits, confusions }) {
  const spoken = {};
  const readBack = {};
  for (const lang of ['en', 'hi', 'kn']) {
    if (kind === 'identifier') {
      spoken[lang] = digitByDigit(digits, lang);
      readBack[lang] = spoken[lang];
    } else {
      spoken[lang] = spokenValue(value, lang, kind === 'amount');
      readBack[lang] = `${spoken[lang]}. ${digitByDigit(String(Math.trunc(value)), lang)}`;
    }
  }
  const displayDigits = kind === 'identifier' ? digits : String(Math.trunc(value));
  return {
    raw,
    kind,
    value: kind === 'identifier' ? undefined : value,
    digits: displayDigits,
    display: kind === 'identifier'
      ? digits.replace(/(\d{4})(?=\d)/g, '$1 ')
      : (() => {
        // Keep the fraction ("0.5 kilo"), but group the whole part Indian style.
        const whole = Math.trunc(value);
        const frac = Math.round((value - whole) * 100) / 100;
        const text = frac > 0 ? `${groupIndian(whole)}${String(frac).replace(/^0/, '')}` : groupIndian(whole);
        return kind === 'amount' ? `₹${text}` : text;
      })(),
    spoken,
    readBack,
    confusions,
    // Any amount, and any word that could be a different number, must be
    // confirmed before it is acted on.
    risky: confusions.length > 0 || kind === 'amount' || kind === 'identifier',
  };
}

// ---- dates ---------------------------------------------------------------
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
  kn: ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'],
};
const MONTH_WORDS = (() => {
  const map = {};
  const en = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  en.forEach((m, i) => { map[m] = i + 1; });
  ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    .forEach((m, i) => { map[m] = i + 1; });
  return map;
})();

/**
 * Dates matter as much as amounts: a scholarship deadline read the wrong way
 * round (01/11 vs 11/01) makes someone miss the last date. Every date is read
 * back, and a numeric date that could be day-first or month-first is reported
 * as ambiguous with both readings spelled out.
 */
function extractDates(text) {
  const t = normalizeDigits(text);
  const out = [];
  const push = (raw, index, y, m, d, ambiguous) => {
    if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return;
    const readings = ambiguous
      ? [{ day: d, month: m, year: y }, { day: m, month: d, year: y }]
      : [{ day: d, month: m, year: y }];
    const readBack = {};
    for (const lang of ['en', 'hi', 'kn']) {
      readBack[lang] = readings.map((r) => `${r.day} ${MONTHS[lang][r.month - 1]} ${r.year}`).join(lang === 'en' ? ' or ' : ' या ');
    }
    out.push({
      raw,
      index,
      year: y,
      month: m,
      day: d,
      ambiguous,
      readings: readings.map((r) => `${r.year}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`),
      display: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
      readBack,
      risky: ambiguous,
    });
  };

  // ISO: 2026-11-01
  let re = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g;
  let m;
  while ((m = re.exec(t)) !== null) push(m[0], m.index, Number(m[1]), Number(m[2]), Number(m[3]), false);

  // day/month/year with separators: 01/11/2026, 1-11-26
  re = /(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?!\d)/g;
  while ((m = re.exec(t)) !== null) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    // Ambiguous unless one side is clearly a day (>12).
    const ambiguous = a <= 12 && b <= 12;
    push(m[0], m.index, y, b, a, ambiguous);
  }

  // 1 Nov 2026 / 1st November 2026
  re = /(?<!\d)(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/g;
  while ((m = re.exec(t)) !== null) {
    const mon = MONTH_WORDS[m[2].toLowerCase()];
    if (mon) push(m[0], m.index, Number(m[3]), mon, Number(m[1]), false);
  }

  // November 1, 2026
  re = /([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/g;
  while ((m = re.exec(t)) !== null) {
    const mon = MONTH_WORDS[m[1].toLowerCase()];
    if (mon) push(m[0], m.index, Number(m[3]), mon, Number(m[2]), false);
  }

  // Keep the longest non-overlapping matches only (an ISO date also matches
  // the day/month/year pattern).
  out.sort((a, b) => a.index - b.index || b.raw.length - a.raw.length);
  const kept = [];
  for (const item of out) {
    const clash = kept.find((k) => item.index < k.index + k.raw.length && k.index < item.index + item.raw.length);
    if (!clash) kept.push(item);
  }
  return kept.map(({ index, ...rest }) => rest);
}

// ---- yes / no ------------------------------------------------------------
const YES_WORDS = new Set([
  'yes', 'yeah', 'yep', 'ok', 'okay', 'correct', 'right', 'true', 'sure', 'confirm', 'confirmed',
  'haan', 'han', 'ha', 'haa', 'ji', 'ji haan', 'sahi', 'sahihai', 'theek', 'thik', 'teek', 'bilkul', 'sahi hai',
  'हाँ', 'हां', 'जी', 'सही', 'सही है', 'ठीक', 'ठीक है', 'बिल्कुल',
  'haudu', 'houdu', 'howdu', 'sari', 'sarii', 'agide', 'sariyagide', 'ಹೌದು', 'ಸರಿ', 'ಸರಿಯಾಗಿದೆ',
]);
const NO_WORDS = new Set([
  'no', 'nope', 'nah', 'wrong', 'incorrect', 'false', 'cancel', 'stop', 'change',
  'nahi', 'nahin', 'galat', 'galat hai', 'nako', 'नहीं', 'नहि', 'गलत', 'गलत है', 'रद्द',
  'illa', 'alla', 'tappu', 'tapup', 'ಇಲ್ಲ', 'ತಪ್ಪು', 'ಬೇಡ',
]);

/** Understand a spoken confirmation ("haan", "sari", "illa", "no"). */
function parseYesNo(utterance) {
  const text = String(utterance || '').toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return { confirmed: null, matched: null, understood: false };
  const words = text.split(' ');
  // Two-word phrases first ("ji haan", "sahi hai", "galat hai")
  for (let i = 0; i < words.length - 1; i += 1) {
    const pair = `${words[i]} ${words[i + 1]}`;
    if (NO_WORDS.has(pair)) return { confirmed: false, matched: pair, understood: true };
    if (YES_WORDS.has(pair)) return { confirmed: true, matched: pair, understood: true };
  }
  for (const w of words) {
    if (NO_WORDS.has(w)) return { confirmed: false, matched: w, understood: true };
    if (YES_WORDS.has(w)) return { confirmed: true, matched: w, understood: true };
  }
  // Script-based check for the single-word cases the tokeniser keeps whole.
  if (/हाँ|हां|सही/.test(text)) return { confirmed: true, matched: 'हाँ', understood: true };
  if (/नहीं|गलत/.test(text)) return { confirmed: false, matched: 'नहीं', understood: true };
  if (/ಹೌದು|ಸರಿ/.test(text)) return { confirmed: true, matched: 'ಹೌದು', understood: true };
  if (/ಇಲ್ಲ|ತಪ್ಪು/.test(text)) return { confirmed: false, matched: 'ಇಲ್ಲ', understood: true };
  return { confirmed: null, matched: null, understood: false };
}

// ---- speech script -------------------------------------------------------
/**
 * Split a sentence into what should be spoken as prose and what should be
 * spoken number by number. Used by "read answer aloud" so an amount is never
 * read as a single run-on figure.
 */
function speechScript(text, language = 'en') {
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : 'en';
  const src = String(text || '');
  const marks = [];
  extractNumbers(src).forEach((n) => marks.push({ raw: n.raw, item: { type: n.kind, display: n.display, readBack: n.readBack[lang] } }));
  extractDates(src).forEach((d) => marks.push({ raw: d.raw, item: { type: 'date', display: d.display, readBack: d.readBack[lang] } }));

  // Longest-first so "12,34,567" is not split by its own digits.
  marks.sort((a, b) => b.raw.length - a.raw.length);
  let segments = [{ type: 'text', text: src }];
  for (const mark of marks) {
    const next = [];
    for (const seg of segments) {
      if (seg.type !== 'text') { next.push(seg); continue; }
      const parts = seg.text.split(mark.raw);
      parts.forEach((part, i) => {
        if (part) next.push({ type: 'text', text: part });
        if (i < parts.length - 1) next.push(mark.item);
      });
    }
    segments = next;
  }
  return segments.filter((s) => (s.type === 'text' ? s.text.trim().length > 0 : true));
}

const PROMPTS = {
  en: { head: 'I understood:', ask: 'Is this correct? Say yes or no.', risk: 'Careful: this word can sound like another number.', date: 'Careful: this date can be read two ways.', nothing: 'I heard money words but could not understand the amount. Please say the amount again.' },
  hi: { head: 'मैंने समझा:', ask: 'क्या यह सही है? हाँ या ना कहें।', risk: 'ध्यान दें: यह शब्द किसी दूसरी संख्या जैसा सुनाई दे सकता है।', date: 'ध्यान दें: यह तारीख दो तरह से पढ़ी जा सकती है।', nothing: 'पैसे का शब्द सुनाई दिया पर राशि समझ नहीं आई। कृपया राशि फिर से बोलें।' },
  kn: { head: 'ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡದ್ದು:', ask: 'ಇದು ಸರಿಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.', risk: 'ಎಚ್ಚರ: ಈ ಪದ ಬೇರೆ ಸಂಖ್ಯೆಯಂತೆ ಕೇಳಿಸಬಹುದು.', date: 'ಎಚ್ಚರ: ಈ ದಿನಾಂಕವನ್ನು ಎರಡು ರೀತಿಯಲ್ಲಿ ಓದಬಹುದು.', nothing: 'ಹಣದ ಪದ ಕೇಳಿಸಿತು ಆದರೆ ಮೊತ್ತ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊತ್ತವನ್ನು ಮತ್ತೆ ಹೇಳಿ.' },
};

/** Which of the supported languages appear in a text (by script + known romanised words). */
function detectLanguages(text) {
  const t = String(text || '');
  const langs = new Set();
  if (/[\u0900-\u097F]/.test(t)) langs.add('hi');
  if (/[\u0C80-\u0CFF]/.test(t)) langs.add('kn');
  if (/[A-Za-z]/.test(t)) langs.add('en');
  return [...langs];
}

/** The language a mixed sentence is mostly in, used to answer in the right one. */
function dominantLanguage(text) {
  const t = String(text || '');
  const devanagari = (t.match(/[\u0900-\u097F]/g) || []).length;
  const kannada = (t.match(/[\u0C80-\u0CFF]/g) || []).length;
  const latin = (t.match(/[A-Za-z]/g) || []).length;
  if (kannada > devanagari && kannada > latin) return 'kn';
  if (devanagari > latin) return 'hi';
  if (kannada > latin) return 'kn';
  // Latin script only. Number words are ambiguous ("do" is Hindi 2 and English
  // "do"), so only distinctive grammar words decide, and English is the
  // default when nothing distinctive appears.
  const words = t.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const HI_MARKERS = ['kya', 'kaise', 'kaisa', 'hai', 'hain', 'chahiye', 'karna', 'karo', 'kare',
    'kitna', 'kitne', 'kaun', 'kab', 'kahan', 'milta', 'milega', 'paisa', 'yojana', 'nahi', 'nahin',
    'mujhe', 'mera', 'meri', 'batao', 'sakta', 'sakti', 'hoga', 'kijiye', 'chhatravritti', 'bukhar',
    'dawa', 'ilaaj', 'ghar', 'zameen', 'kheti', 'kisan', 'sarkari'];
  const KN_MARKERS = ['beku', 'hege', 'enu', 'illa', 'haudu', 'sari', 'yake', 'nanna', 'nanage',
    'sigutte', 'madbeku', 'ide', 'yelli', 'yaaru', 'kelsa', 'jwara', 'yojane', 'duddu', 'mane',
    'roga', 'aushadha', 'bhoomi', 'raita', 'sarkari', 'vidyarthi'];
  const EN_MARKERS = ['how', 'what', 'when', 'where', 'which', 'why', 'is', 'are', 'am', 'was',
    'can', 'could', 'should', 'would', 'need', 'want', 'please', 'my', 'the', 'of', 'to', 'for',
    'with', 'from', 'do', 'does', 'open', 'get', 'apply', 'give', 'money', 'help', 'tell', 'about',
    'much', 'many', 'and', 'not', 'i', 'you', 'we', 'they', 'it', 'have', 'has'];
  let hi = 0;
  let kn = 0;
  let en = 0;
  for (const w of words) {
    if (HI_MARKERS.includes(w)) hi += 2;
    if (KN_MARKERS.includes(w)) kn += 2;
    if (EN_MARKERS.includes(w)) en += 1;
  }
  if (kn > hi && kn >= en) return 'kn';
  if (hi > en && hi > kn) return 'hi';
  return 'en';
}

/** Full read-back payload for a piece of text. */
function readBack(text, language = 'en') {
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : 'en';
  const numbers = extractNumbers(text);
  const dates = extractDates(text);
  const prompts = {};
  const moneyWords = /(?:rs\.?|₹|रुपये|रुपए|ರೂಪಾಯಿ|rupees|rupaye|rupaiya)/i.test(String(text || ''));
  for (const l of ['en', 'hi', 'kn']) {
    const p = PROMPTS[l];
    const bits = [
      ...numbers.map((n) => `${n.display} (${n.readBack[l]})`),
      ...dates.map((d) => `${d.display} (${d.readBack[l]})`),
    ];
    const warn = [
      numbers.some((n) => n.confusions.length) ? p.risk : '',
      dates.some((d) => d.ambiguous) ? p.date : '',
    ].filter(Boolean).join(' ');
    prompts[l] = bits.length
      ? `${p.head} ${bits.join('; ')}. ${warn ? `${warn} ` : ''}${p.ask}`
      : (moneyWords ? p.nothing : '');
  }

  return {
    language: lang,
    count: numbers.length,
    numbers,
    dates,
    // Money words but no amount understood: never guess, ask again.
    unparsedMoney: moneyWords && numbers.length === 0,
    requiresConfirmation: numbers.some((n) => n.risky) || dates.some((d) => d.risky) || (moneyWords && numbers.length === 0),
    confirmationPrompt: prompts,
    languagesDetected: detectLanguages(text),
    dominantLanguage: dominantLanguage(text),
    speechScript: speechScript(text, lang),
  };
}

module.exports = {
  extractNumbers,
  extractDates,
  readBack,
  parseYesNo,
  speechScript,
  detectLanguages,
  dominantLanguage,
  normalizeDigits,
  groupIndian,
  spokenValue,
  digitByDigit,
};
