// Hurdle 3, pillar 2: rural users do not stick to one language per sentence.
//
// "PM kisan योजना के लिए कौन documents लगते हैं?" is one sentence in three scripts.
// The old code picked ONE language per request and matched keywords in that language,
// so a mixed sentence lost two thirds of its meaning.
//
// What this module does instead:
//   1. segment()      - splits the sentence into script runs (latin / devanagari / kannada)
//   2. profile()      - measures how mixed it really is, and picks the dominant script
//   3. canonicalize() - maps romanised Hindi/Kannada/English variants onto ONE concept
//                       (kisaan, kisan, किसान, ರೈತ -> concept "farmer")
//   4. replyPolicy()  - answers in the dominant language but keeps the person's own words
//                       for names, so nothing is silently renamed
//   5. speechSegments() - splits the reply so each script is read by the right voice
//
// Rule-based on purpose: this has to work with no network and no model.

const { normalize } = require('../utils/text');

// ---------------------------------------------------------------- scripts
const SCRIPTS = [
  { name: 'devanagari', lang: 'hi', re: /[\u0900-\u097F]/ },
  { name: 'kannada', lang: 'kn', re: /[\u0C80-\u0CFF]/ },
  { name: 'latin', lang: 'en', re: /[A-Za-z]/ },
];
const DIGIT_RE = /[0-9\u0966-\u096F\u0CE6-\u0CEF]/;
const LANG_OF = { devanagari: 'hi', kannada: 'kn', latin: 'en' };

function scriptOf(ch) {
  if (DIGIT_RE.test(ch)) return 'digit';
  for (const s of SCRIPTS) if (s.re.test(ch)) return s.name;
  return 'other';
}

/**
 * Split text into runs of one script each, keeping order and whitespace.
 * Returns [{ text, script, language }] where language is en|hi|kn|null.
 */
function segment(text) {
  const chars = [...String(text || '')];
  const out = [];
  let buf = '';
  let cur = null;
  const flush = () => {
    if (!buf) return;
    out.push({ text: buf, script: cur, language: cur === 'digit' ? null : LANG_OF[cur] || null });
    buf = '';
  };
  for (const ch of chars) {
    const s = scriptOf(ch);
    // digits and punctuation never start a new segment on their own: they ride along
    const key = s === 'digit' || s === 'other' ? cur : s;
    if (key !== cur && buf) flush();
    if (key !== cur) cur = key;
    buf += ch;
  }
  flush();
  return out;
}

const lettersOf = (text) => [...String(text || '')].filter((c) => /\p{L}/u.test(c));

/**
 * How mixed is this sentence?
 * Returns { en, hi, kn } as share of letters (0..1), plus dominant + mixed flag.
 * A sentence counts as mixed when the dominant script holds less than 85% of letters
 * AND at least 15% comes from another script.
 */
function profile(text) {
  const letters = lettersOf(text);
  const counts = { en: 0, hi: 0, kn: 0 };
  for (const ch of letters) {
    const s = scriptOf(ch);
    const lang = LANG_OF[s];
    if (lang) counts[lang] += 1;
  }
  const total = letters.length || 1;
  const share = { en: counts.en / total, hi: counts.hi / total, kn: counts.kn / total };
  const dominant = Object.keys(share).sort((a, b) => share[b] - share[a])[0];
  const top = share[dominant];
  const others = Object.keys(share).filter((l) => l !== dominant && share[l] > 0);
  return {
    counts,
    share,
    dominant,
    confidence: Math.round(top * 100) / 100,
    mixed: top < 0.85 && others.some((l) => share[l] >= 0.15),
    scripts: [...new Set(segment(text).map((s) => s.script).filter((s) => s && s !== 'digit' && s !== 'other'))],
  };
}

// ---------------------------------------------------------------- romanised lexicon
// One concept, many spellings. Covers English, romanised Hindi, romanised Kannada,
// Devanagari and Kannada. ASR output drifts ("kisaan", "yojna", "sabsidi"), so the
// fuzzy pass below also catches one-letter drift.
const CONCEPTS = {
  farmer: ['farmer', 'kisan', 'kisaan', 'kissan', 'krishak', 'किसान', 'रैयत', 'ರೈತ', 'ಕೃಷಿಕ', 'ryot', 'raita'],
  farmLabourer: ['farm labourer', 'farm worker', 'khetihar mazdoor', 'खेतिहर मजदूर', 'ಕೃಷಿ ಕಾರ್ಮಿಕ', 'coolie', 'kuli', 'कूली'],
  land: ['land', 'jameen', 'jamin', 'zameen', 'bhumi', 'acre', 'acres', 'जमीन', 'खेत', 'भूमि', 'ಜಮೀನು', 'ಭೂಮಿ'],
  scheme: ['scheme', 'schemes', 'yojana', 'yojna', 'yojanaye', 'yojanagalu', 'plan', 'योजना', 'योजनाएं', 'ಯೋಜನೆ', 'ಯೋಜನೆಗಳು'],
  subsidy: ['subsidy', 'subsidi', 'sabsidi', 'subsidee', 'sabsady', 'anudan', 'सब्सिडी', 'अनुदान', 'ಸಬ್ಸಿಡಿ', 'ಸಹಾಯಧನ'],
  pension: ['pension', 'penshan', 'pensan', 'vriddhavastha', 'पेंशन', 'पेन्शन', 'ಪಿಂಚಣಿ'],
  ration: ['ration', 'ration card', 'rashan', 'राशन', 'राशन कार्ड', 'ಪಡಿತರ', 'ಪಡಿತರ ಚೀಟಿ'],
  scholarship: ['scholarship', 'scholarships', 'vidyarthi vetana', 'wazifa', 'vajifa', 'schoarship', 'छात्रवृत्ति', 'वजीफा', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'ವಿದ್ಯಾರ್ಥಿ ವೇತನ'],
  amount: ['amount', 'money', 'paisa', 'paise', 'rupee', 'rupees', 'rupaye', 'rokda', 'paisalu', 'hana', 'रुपये', 'पैसा', 'रकम', 'ಹಣ', 'ರೂಪಾಯಿ', 'ಮೊತ್ತ'],
  income: ['income', 'aay', 'aamdani', 'kamai', 'kamaai', 'sal', 'salary', 'wages', 'aadaya', 'sampadane', 'आय', 'आमदनी', 'कमाई', 'आदाय', 'ಆದಾಯ', 'ಸಂಪಾದನೆ'],
  age: ['age', 'umar', 'vayasu', 'vayas', 'vayassu', 'years old', 'उम्र', 'आयु', 'वय', 'ವಯಸ್ಸು', 'ವಯಸ್ಸ'],
  documents: ['document', 'documents', 'kagaz', 'kagaj', 'dastavej', 'papers', 'daftar', 'dastavejagalu', 'ದಾಖಲೆ', 'ದಾಖಲೆಗಳು', 'दस्तावेज', 'कागज'],
  eligibility: ['eligible', 'eligibility', 'haq', 'adhikar', 'yogya', 'yogyate', 'पात्रता', 'पात्र', 'ಹಕ್ಕು', 'ಅರ್ಹತೆ', 'ಅರ್ಹ'],
  apply: ['apply', 'application', 'aavedan', 'avedan', 'arji', 'apply madu', 'अर्ज', 'आवेदन', 'ಅರ್ಜಿ', 'ಅರ್ಜಿ ಹಾಕು'],
  deadline: ['last date', 'deadline', 'aakhri tarikh', 'tarikh', 'kade dinank', 'अंतिम तिथि', 'आखिरी तारीख', 'ಕೊನೆಯ ದಿನಾಂಕ'],
  hospital: ['hospital', 'aspatal', 'davakhana', 'aastrapatre', 'आस्पताल', 'अस्पताल', 'ಆಸ್ಪತ್ರೆ', 'ವೈದ್ಯಕೀಯ'],
  doctor: ['doctor', 'daktar', 'vaidya', 'doctaru', 'डॉक्टर', 'ವೈದ್ಯ', 'ಡಾಕ್ಟರ್'],
  medicine: ['medicine', 'dawa', 'davai', 'aushadh', 'goli', 'tablet', 'oshasu', 'matre', 'दवा', 'दवाई', 'गोली', 'ಔಷಧ', 'ಮಾತ್ರೆ'],
  fever: ['fever', 'bukhar', 'jwara', 'jvara', 'बुखार', 'ज्वर', 'ಜ್ವರ'],
  helpline: ['helpline', 'toll free', 'madad', 'sahaya', 'सहायता', 'ಹೆಲ್ಪ್‌ಲೈನ್', 'ಸಹಾಯವಾಣಿ'],
  otp: ['otp', 'pin', 'password', 'खाता संख्या', 'ಒಟಿಪಿ'],
};

// Scheme and scholarship names people actually say, in every script we serve.
const NAMES = {
  'pm-kisan': ['pm kisan', 'pmkisan', 'p m kisan', 'kisan samman', 'kisan samman nidhi', 'पीएम किसान', 'किसान सम्मान निधि', 'ಪಿಎಂ ಕಿಸಾನ್', 'ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ'],
  'ayushman-bharat': ['ayushman', 'ayushman bharat', 'pmjay', 'ayushman card', 'आयुष्मान', 'आयुष्मान भारत', 'ಆಯುಷ್ಮಾನ್', 'ಆಯುಷ್ಮಾನ್ ಭಾರತ'],
  'gruha-lakshmi': ['gruha lakshmi', 'gruhalakshmi', 'griha lakshmi', 'गृह लक्ष्मी', 'ಗೃಹ ಲಕ್ಷ್ಮಿ'],
  'widow-pension': ['widow pension', 'vidhwa pension', 'vidhava pension', 'विधवा पेंशन', 'ವಿಧವಾ ಪಿಂಚಣಿ'],
  'old-age-pension': ['old age pension', 'vriddha pension', 'sandhyavandana', 'वृद्धावस्था पेंशन', 'ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ'],
  'pmay-g': ['awas yojana', 'pmay', 'awas', 'housing scheme', 'घर योजना', 'ಆವಾಸ್ ಯೋಜನೆ'],
  'ssp-karnataka': ['ssp', 'state scholarship', 'rajya vidyarthi vetana', 'राज्य छात्रवृत्ति', 'ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿ ವೇತನ'],
  'nsp': ['nsp', 'national scholarship portal', 'national scholarship', 'राष्ट्रीय छात्रवृत्ति', 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿ ವೇತನ'],
};

const norm = (s) => normalize(s).replace(/\s+/g, ' ').trim();

// variant -> concept, built once
const INDEX = new Map();
for (const [concept, variants] of Object.entries(CONCEPTS)) {
  for (const v of variants) INDEX.set(norm(v), { concept, kind: 'concept' });
}
for (const [slug, variants] of Object.entries(NAMES)) {
  for (const v of variants) INDEX.set(norm(v), { concept: slug, kind: 'name' });
}

// every variant, longest first, for multi-word phrase matching
const PHRASES = [...INDEX.keys()].sort((a, b) => b.length - a.length);

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const isLatin = (s) => /^[A-Za-z]+$/.test(s);

/**
 * Map one token (or phrase) onto a concept.
 * Exact first; then a small fuzzy pass, but only for latin words of 5+ letters,
 * and only if the drift is a single letter. Devanagari/Kannada are matched exactly:
 * fuzzy matching on Indic scripts produces far more false hits than it fixes.
 */
function conceptOf(token) {
  const t = norm(token);
  if (!t) return null;
  const exact = INDEX.get(t);
  if (exact) return exact;
  if (!isLatin(t) || t.length < 5) return null;
  let best = null;
  let bestDist = 2;
  for (const [variant, hit] of INDEX) {
    if (!isLatin(variant)) continue;
    if (Math.abs(variant.length - t.length) > 1) continue;
    const d = editDistance(t, variant, 1);
    if (d < bestDist) { best = hit; bestDist = d; }
  }
  return best;
}

/**
 * Replace known phrases with a canonical concept token, so search and intent
 * matching see one form regardless of the language the person used.
 * Returns { canonical, tokens, concepts } - canonical keeps unknown words as they are.
 */
function canonicalize(text) {
  let work = ` ${norm(text)} `;
  const concepts = [];
  for (const phrase of PHRASES) {
    if (!phrase) continue;
    const re = new RegExp(`(^|[^\\p{L}\\p{M}])(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}\\p{M}]|$)`, 'gu');
    if (!re.test(work)) continue;
    const hit = INDEX.get(phrase);
    work = work.replace(re, (m, pre) => `${pre} __${hit.concept}__`);
    concepts.push(hit.concept);
  }
  const tokens = work.match(/[\p{L}\p{M}\p{N}]+/gu) || [];
  const expanded = tokens.flatMap((tok) => {
    const m = /^__(.+)__$/.exec(tok);
    if (m) {
      // keep the concept, and also keep the scale words inside a name ("pm kisan" -> pm, kisan)
      return [m[1], ...m[1].split('-')];
    }
    const c = conceptOf(tok);
    return c ? [c.concept, tok] : [tok];
  });
  return { canonical: work.trim(), tokens, concepts: [...new Set(concepts)], expanded };
}

// ---------------------------------------------------------------- romanised hint
// Latin letters do not tell you the language: "meri income 1 lakh hai" is Hindi typed in
// English letters, and answering it in English is exactly the failure this hurdle is about.
// These function words are the cheapest reliable signal, and they are what people type.
const ROMAN_MARKERS = {
  hi: ['hai', 'hain', 'ho', 'kya', 'kyaa', 'kaise', 'kaisay', 'kitna', 'kitni', 'mera', 'meri', 'mere', 'mujhe', 'muje',
    'nahi', 'nahin', 'chahiye', 'chahiya', 'milega', 'milegi', 'sakta', 'sakti', 'sakte', 'karna', 'karo', 'kare',
    'hum', 'aap', 'tum', 'bhai', 'didi', 'yaar', 'accha', 'acha', 'batao', 'bataiye', 'banega', 'lagega', 'lagega',
    'milta', 'sarkari', 'paisa', 'kitne', 'kaun', 'kahan', 'kab', 'hoga', 'hogi', 'jaldi', 'abhi', 'phir', 'lekin',
    'hamko', 'hamein', 'kaunsi', 'kaunsa', 'chalta', 'lagta', 'milta', 'milega', 'dijiye', 'bataye', 'samajh', 'nahi'],
  kn: ['ide', 'illa', 'illa', 'eshtu', 'esth', 'hege', 'heg', 'madu', 'madbeku', 'nanu', 'nanna', 'ninna', 'nimage',
    'sigutte', 'sigutthe', 'beku', 'bekku', 'yaake', 'yake', 'elli', 'yaaru', 'yaru', 'mattu', 'andre', 'kodi',
    'tumba', 'thumba', 'swalpa', 'sari', 'heli', 'helu', 'gotilla', 'aagutta', 'aagutthe', 'nodona', 'bekagide',
    'nanage', 'nang', 'nimma', 'avaru', 'adara', 'adannu', 'enu', 'yaav', 'yaava', 'yavudu', 'sikkutte', 'sikatte',
    'maadoke', 'madoke', 'hege', 'yaavaga', 'illi', 'allige', 'bekiddare', 'kalsi', 'tilisi'],
};

// Words that are only ever Hindi/Kannada. One of these is already proof.
const STRONG = {
  hi: ['hai', 'hain', 'kya', 'kaise', 'kitna', 'kitni', 'mera', 'meri', 'mujhe', 'muje', 'nahi', 'nahin',
    'chahiye', 'milega', 'milegi', 'batao', 'bataiye', 'hoga', 'hogi', 'kaunsi', 'hamko', 'hamein', 'karo', 'karna'],
  kn: ['nanage', 'nang', 'ide', 'illa', 'eshtu', 'hege', 'madbeku', 'sigutte', 'sikkutte', 'beku', 'yaake',
    'yake', 'elli', 'yaaru', 'mattu', 'andre', 'kodi', 'tumba', 'thumba', 'nanu', 'nanna', 'nimma', 'gotilla', 'helu', 'heli'],
};

function romanisedHint(text) {
  const toks = (normalize(text).match(/[a-z]+/g) || []);
  if (!toks.length) return null;
  const score = (list, strong) => toks.reduce((n, t) => n + (strong.includes(t) ? 2 : list.includes(t) ? 1 : 0), 0);
  const hi = score(ROMAN_MARKERS.hi, STRONG.hi);
  const kn = score(ROMAN_MARKERS.kn, STRONG.kn);
  const best = Math.max(hi, kn);
  if (best < 2) return null;
  return hi === kn ? null : hi > kn ? 'hi' : 'kn';
}

// ---------------------------------------------------------------- reply policy
const DEFAULT_LANGUAGE = 'en';

/**
 * Which language should the answer be in?
 * - Nothing mixed: the person's own language.
 * - Mixed: the dominant script wins, unless it is a weak majority, in which case the
 *   app's chosen language wins (that is the one they picked in Settings).
 * The names the person used are handed back so the answer can repeat them verbatim.
 */
function replyPolicy(text, appLanguage = DEFAULT_LANGUAGE) {
  const p = profile(text);
  let language = p.dominant;

  // A rural user writing Hindi or Kannada borrows English nouns (documents, income, scheme).
  // So when an Indic script is present at all meaningfully, that is the language being spoken.
  const indic = ['hi', 'kn'].filter((l) => p.share[l] >= 0.2).sort((a, b) => p.share[b] - p.share[a]);
  if (indic.length) language = indic[0];

  // Latin letters, Indian words: "meri income 1 lakh hai" is Hindi, not English.
  const hint = romanisedHint(text);
  if (!indic.length && hint) language = hint;

  if (p.mixed && p.confidence < 0.5 && !indic.length && !hint) language = appLanguage || DEFAULT_LANGUAGE;
  if (!p.counts[language] && appLanguage && !hint) language = appLanguage;

  const preserved = [];
  const lowered = norm(text);
  for (const [slug, variants] of Object.entries(NAMES)) {
    for (const v of variants) {
      if (lowered.includes(norm(v))) { preserved.push({ slug, said: v }); break; }
    }
  }
  return {
    language,
    appLanguage: appLanguage || DEFAULT_LANGUAGE,
    mixed: p.mixed,
    dominant: p.dominant,
    confidence: p.confidence,
    share: p.share,
    scripts: p.scripts,
    romanised: Boolean(hint),
    preserve: preserved,
    // honest note the UI can show when the answer is in a different language than one
    // of the scripts the person typed in
    switched: p.mixed && language !== p.dominant ? true : false,
  };
}

// ---------------------------------------------------------------- speech
const VOICE_OF = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

/**
 * Split a reply into per-script pieces so each one is read by the right TTS voice.
 * A single kn-IN voice reading "PM Kisan" mangles it; a single en-IN voice reading
 * "ಯೋಜನೆ" gives up silently. The Android app loops over these and speaks each with
 * its own Locale (TextToSpeech.setLanguage per utterance, queued).
 */
function speechSegments(text, fallbackLanguage = DEFAULT_LANGUAGE) {
  const runs = segment(text);
  const merged = [];
  for (const r of runs) {
    if (r.script === 'digit' || r.script === 'other') {
      const prev = merged[merged.length - 1];
      if (prev) prev.text += r.text;
      else merged.push({ text: r.text, language: fallbackLanguage });
      continue;
    }
    const prev = merged[merged.length - 1];
    const lang = r.language || fallbackLanguage;
    if (prev && prev.language === lang) prev.text += r.text;
    else merged.push({ text: r.text, language: lang });
  }
  // A three-letter run ("CSC", "PM") does not deserve its own voice: a voice change
  // mid-sentence is worse than a slight accent on one acronym.
  const grouped = [];
  for (const m of merged) {
    const letters = (m.text.match(/\p{L}/gu) || []).length;
    if (letters < 4 && grouped.length) { grouped[grouped.length - 1].text += m.text; continue; }
    if (letters < 4) { grouped.push({ ...m, pending: true }); continue; }
    grouped.push({ ...m });
  }
  if (grouped.length > 1 && grouped[0].pending) { grouped[1].text = grouped[0].text + grouped[1].text; grouped.shift(); }
  return grouped
    .map((m) => ({ text: m.text.replace(/\s+/g, ' ').trim(), language: m.language, locale: VOICE_OF[m.language] }))
    .filter((m) => m.text);
}

/**
 * Vocabulary hint for the speech recogniser (Whisper-style APIs accept a `prompt`).
 * Feeding the names and the local words for numbers measurably reduces both the
 * "PM Kisan heard as PM Keesan" and the "50,000 heard as 15,000" class of error.
 */
const scriptOfLang = (s, language) => {
  const first = [...String(s || '')][0] || '';
  return scriptOf(first) === (language === 'hi' ? 'devanagari' : language === 'kn' ? 'kannada' : 'latin');
};

function sttPrompt(language = 'en') {
  // Give the recogniser the names in the script the person is about to speak,
  // plus the English form, because that is how people name schemes out loud.
  const names = Object.values(NAMES)
    .flatMap((v) => [v[0], v.find((x) => scriptOfLang(x, language)) || v[0]])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 12);
  const numbers = {
    en: 'five thousand, fifty thousand, one lakh, one lakh twenty thousand, two lakh fifty thousand',
    hi: 'पाँच हज़ार, पचास हज़ार, एक लाख, डेढ़ लाख, दो लाख पचास हज़ार',
    kn: 'ಐದು ಸಾವಿರ, ಐವತ್ತು ಸಾವಿರ, ಒಂದು ಲಕ್ಷ, ಒಂದು ಲಕ್ಷ ಇಪ್ಪತ್ತು ಸಾವಿರ, ಎರಡು ಲಕ್ಷ ಐವತ್ತು ಸಾವಿರ',
  };
  const scale = {
    en: 'yojana, subsidy, pension, ration card, documents, eligible, income, last date',
    hi: 'योजना, सब्सिडी, पेंशन, राशन कार्ड, दस्तावेज, पात्र, आय, अंतिम तिथि',
    kn: 'ಯೋಜನೆ, ಸಬ್ಸಿಡಿ, ಪಿಂಚಣಿ, ಪಡಿತರ ಚೀಟಿ, ದಾಖಲೆ, ಅರ್ಹ, ಆದಾಯ, ಕೊನೆಯ ದಿನಾಂಕ',
  };
  return [...names, numbers[language] || numbers.en, scale[language] || scale.en].join(', ');
}

module.exports = {
  SCRIPTS, CONCEPTS, NAMES, VOICE_OF,
  segment, profile, canonicalize, conceptOf, replyPolicy, speechSegments, sttPrompt, scriptOf,
  romanisedHint, ROMAN_MARKERS, STRONG, editDistance,
};
