/**
 * Language-agnostic keyword retrieval over the seeded knowledge base, schemes
 * and scholarships. Deliberately dependency free: it runs fast on a free tier
 * instance and needs no external AI service. If BEDROCK_MODEL_ID is configured
 * the answer is additionally rewritten by Amazon Bedrock (see services/bedrock).
 *
 * Rural users mix languages: they may type Kannada words in Latin letters
 * ("jwara"), Hindi in Devanagari, or English inside a Hindi sentence. The
 * CONCEPTS table below maps those surface forms onto one idea so a question
 * finds the right entry whichever script or spelling it arrives in.
 */

const STOPWORDS = new Set([
  // english
  'the', 'a', 'an', 'is', 'are', 'am', 'do', 'does', 'did', 'i', 'me', 'my', 'we', 'you', 'your',
  'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'will',
  'for', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'if', 'it', 'this', 'that', 'there', 'be',
  'get', 'got', 'have', 'has', 'about', 'with', 'from', 'need', 'want', 'any', 'please',
  'tell', 'know', 'also', 'than', 'then', 'some', 'much', 'many', 'more', 'very', 'not',
  'cannot', 'cant', 'feel', 'feeling', 'since', 'yesterday', 'today', 'badly', 'really',
  // hindi (romanised and devanagari)
  'kya', 'kaise', 'kaisa', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'me', 'mein', 'aur', 'ya',
  'kar', 'karna', 'kare', 'kaun', 'kab', 'kahan', 'liye', 'chahiye', 'milta', 'mil', 'mera', 'meri',
  'kuch', 'koi', 'bhi', 'hoga', 'hota', 'hoti', 'raha', 'rahi', 'gaya', 'gayi', 'tha', 'thi',
  'क्या', 'कैसे', 'है', 'हैं', 'का', 'की', 'के', 'को', 'में', 'और', 'या', 'कर', 'करना', 'करें',
  'कौन', 'कब', 'कहां', 'लिए', 'चाहिए', 'मिलता', 'मेरा', 'मेरी', 'कुछ', 'कोई', 'भी', 'होगा', 'होता',
  // possessives and pronouns: present in almost every question, so they say
  // nothing about what is being asked
  'मेरे', 'मुझे', 'मुझको', 'हमारे', 'हमें', 'आपके', 'आपको', 'तेरे', 'उसके', 'उनके',
  'mere', 'mujhe', 'hamare', 'hamen', 'aapke', 'uske',
  // auxiliary verbs: grammar, not topic
  'हो', 'रहा', 'रही', 'रहे', 'गया', 'गई', 'गए', 'था', 'थी', 'थे', 'हुआ', 'हुई', 'हुए', 'करने', 'वाला', 'वाली',
  'hona', 'hua', 'hui', 'rahe', 'wala', 'wali',
  // kannada
  'enu', 'hege', 'yake', 'yavudu', 'ide', 'illa', 'nanna', 'nanage', 'beku', 'sigutte',
  'yaaru', 'yelli', 'aagide', 'aagu', 'maadi', 'madabeku', 'nimage', 'nimma',
  'ಏನು', 'ಹೇಗೆ', 'ಯಾಕೆ', 'ಇದೆ', 'ಇಲ್ಲ', 'ನನ್ನ', 'ನನಗೆ', 'ಬೇಕು', 'ಸಿಗುತ್ತದೆ',
  'ಯಾರು', 'ಎಲ್ಲಿ', 'ಆಗಿದೆ', 'ಮಾಡಿ', 'ಮಾಡಬೇಕು', 'ನಿಮಗೆ', 'ನಿಮ್ಮ',
]);

/**
 * One idea, many ways of saying it. Every list holds the English word,
 * romanised Hindi/Kannada spellings and the Devanagari and Kannada forms, so a
 * question in any of the three languages (or a mix) lands on the same concept.
 */
const CONCEPTS = {
  fever: ['fever', 'bukhar', 'bukhaar', 'बुखार', 'ಜ್ವರ', 'jwara', 'jvara', 'temperature', 'malaria', 'dengue'],
  stomach: ['diarrhoea', 'diarrhea', 'loose motion', 'dast', 'दस्त', 'ಭೇದಿ', 'vomiting', 'ulti', 'उल्टी', 'ವಾಂತಿ', 'ors', 'dehydration'],
  pregnancy: ['pregnancy', 'pregnant', 'garbhvati', 'गर्भवती', 'गर्भावस्था', 'ಗರ್ಭಿಣಿ', 'ಗರ್ಭಾವಸ್ಥೆ', 'delivery', 'prasav', 'प्रसव', 'ಹೆರಿಗೆ', 'anc', 'checkup'],
  tb: ['tb', 'tuberculosis', 'kshay', 'तपेदिक', 'क्षय रोग', 'ಕ್ಷಯ ರೋಗ', 'cough', 'khansi', 'खांसी', 'ಕೆಮ್ಮು'],
  bp: ['bp', 'blood pressure', 'raktachap', 'रक्तचाप', 'ಬಿಪಿ', 'ರಕ್ತದೊತ್ತಡ', 'hypertension', 'sugar', 'diabetes', 'madhumeh', 'मधुमेह', 'ಶುಗರ್', 'ಮಧುಮೇಹ'],
  anaemia: ['anaemia', 'anemia', 'khoon ki kami', 'खून की कमी', 'एनीमिया', 'ರಕ್ತಹೀನತೆ', 'iron', 'आयरन', 'ಐರನ್', 'haemoglobin', 'हीमोग्लोबिन'],
  vaccine: ['vaccine', 'vaccination', 'tika', 'टीका', 'टीकाकरण', 'ಲಸಿಕೆ', 'ಚುಚ್ಚುಮದ್ದೆ', 'immunisation', 'polio', 'measles', 'खसरा', 'ದಡಾರ'],
  snake: ['snake', 'saap', 'saanp', 'सांप', 'सर्प', 'ಹಾವು', 'bite', 'kaata', 'डंक', 'ಕಡಿತ', 'poison', 'जहर', 'ವಿಷ'],
  heat: ['heat', 'garmi', 'गर्मी', 'लू', 'ಬಿಸಿಲು', 'ಬೇಸಿಗೆ', 'sunstroke', 'loo', 'hot'],
  mental: ['mental', 'tension', 'tanaav', 'तनाव', 'ಮಾನಸಿಕ', 'ಒತ್ತಡ', 'depression', 'udaasi', 'उदासी', 'ಖಿನ್ನತೆ', 'sleep', 'neend', 'नींद', 'ನಿದ್ರೆ', 'stress'],
  scheme: ['scheme', 'yojana', 'योजना', 'ಯೋಜನೆ', 'sarkari', 'सरकारी', 'ಸರ್ಕಾರಿ', 'benefit', 'labh', 'लाभ', 'ಲಾಭ', 'apply', 'aavedan', 'आवेदन', 'ಅರ್ಜಿ'],
  scholarship: ['scholarship', 'chhatravritti', 'छात्रवृत्ति', 'स्कॉलरशिप', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'nsp', 'fees', 'शुल्क', 'ಶುಲ್ಕ'],
  student: ['student', 'chhatra', 'छात्र', 'छात्रा', 'ವಿದ್ಯಾರ್ಥಿ', 'ವಿದ್ಯಾರ್ಥಿನಿ', 'school', 'स्कूल', 'ಶಾಲೆ', 'college', 'कॉलेज', 'ಕಾಲೇಜು', 'study', 'padhai', 'पढ़ाई', 'ಓದು'],
  farmer: ['farmer', 'kisan', 'किसान', 'रೈತ', 'ರೈತ', 'खेती', 'krishi', 'कृषि', 'ಕೃಷಿ', 'crop', 'fasal', 'फसल', 'ಬೆಳೆ', 'land', 'zameen', 'ज़मीन', 'ಭೂಮಿ'],
  insurance: ['insurance', 'bima', 'बीमा', 'ವಿಮೆ', 'cover', 'claim', 'दावा', 'ಕ್ಲೇಮ್', 'policy', 'पॉलिसी'],
  bank: ['bank', 'बैंक', 'ಬ್ಯಾಂಕ್', 'account', 'khata', 'khatha', 'खाता', 'ಖಾತೆ', 'passbook', 'पासबुक', 'atm', 'balance', 'बैलेंस'],
  loan: ['loan', 'karz', 'कर्ज', 'ऋण', 'ಸಾಲ', 'ಸಾಲು', 'credit', 'interest', 'byaj', 'ब्याज', 'ಬಡ್ಡಿ', 'mudra', 'मुद्रा', 'ಮುದ್ರಾ'],
  pension: ['pension', 'penshan', 'पेंशन', 'ಪಿಂಚಣಿ', 'old age', 'वृद्धावस्था', 'ವೃದ್ಧಾಪ್ಯ', 'widow', 'vidhwa', 'विधवा', 'ವಿಧವೆ', 'disability', 'viklang', 'विकलांग', 'ಅಂಗವಿಕಲ'],
  ration: ['ration', 'राशन', 'ರೇಷನ್', 'अಕ್ಕಿ ಕಾರ್ಡ್', 'pds', 'food', 'khana', 'खाना', 'ಆಹಾರ', 'anna', 'अनाज', 'ಧಾನ್ಯ'],
  aadhaar: ['aadhaar', 'aadhar', 'आधार', 'ಆಧಾರ್', 'uid', 'biometric'],
  certificate: ['certificate', 'praman patra', 'प्रमाण पत्र', 'ಪ್ರಮಾಣಪತ್ರ', 'caste', 'jati', 'जाति', 'ಜಾತಿ', 'income certificate', 'आय प्रमाण', 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ'],
  landrecord: ['rtc', 'pahani', 'पहानी', 'ಪಹಣಿ', 'khatauni', 'खतौनी', 'mutation', 'नामांतरण', 'ನಾಮಾಂತರ', 'survey', 'सर्वे', 'ಸರ್ವೆ'],
  job: ['job', 'naukri', 'नौकरी', 'काम', 'ಮನರೇಗಾ', 'mgnrega', 'मनरेगा', 'kelsa', 'ಕೆಲಸ', 'employment', 'रोजगार', 'ಉದ್ಯೋಗ', 'wage', 'mazdoori', 'मजदूरी', 'ಕೂಲಿ'],
  ambulance: ['ambulance', 'एम्बुलेंस', 'ಆಂಬ್ಯುಲೆನ್ಸ್', '108', '112', 'emergency', 'आपातकाल', 'ತುರ್ತು', 'hospital', 'अस्पताल', 'ಆಸ್ಪತ್ರೆ'],
  doctor: ['doctor', 'daktar', 'डॉक्टर', 'ವೈದ್ಯ', 'asha', 'आशा', 'ಆಶಾ', 'health worker', 'phc', 'आरोग्य ಮಂದಿರ'],
  fraud: ['fraud', 'dhokha', 'धोखा', 'धोखाधड़ी', 'ಮೋಸ', 'ವಂಚನೆ', 'scam', 'otp', 'ओटीपी', 'ಒಟಿಪಿ', 'pin', 'पिन', 'ಪಿನ್', 'kyc', 'केवाईसी', 'ಕೆವೈಸಿ', 'cheat', 'thagi', 'ठगी'],
  police: ['police', 'पुलिस', 'ಪೊಲೀಸ್', 'complaint', 'shikayat', 'शिकायत', 'ದೂರು', 'fir', 'एफआईआर', 'ಎಫ್‌ಐಆರ್', 'crime', 'अपराध', 'ಅಪರಾಧ'],
  gas: ['gas', 'lpg', 'गैस', 'ग्यास', 'ಗ್ಯಾಸ್', 'cylinder', 'सिलेंडर', 'ಸಿಲಿಂಡರ್', 'ujjwala', 'उज्ज्वला', 'ಉಜ್ವಾಲಾ'],
  house: ['house', 'ghar', 'घर', 'मकान', 'ಮನೆ', 'ವಸತಿ', 'awas', 'आवास', 'housing', 'pmay'],
  water: ['water', 'paani', 'पानी', 'ನೀರು', 'flood', 'badh', 'बाढ़', 'ಪ್ರವಾಹ', 'rain', 'barish', 'बारिश', 'ಮಳೆ'],
  fire: ['fire', 'aag', 'आग', 'ಬೆಂಕಿ', 'burn', 'jalna', 'जलना', 'ಸುಟ್ಟ', 'cylinder blast'],
  women: ['women', 'mahila', 'महिला', 'ಮಹಿಳೆ', 'girl', 'ladki', 'बेटी', 'लड़की', 'ಹುಡುಗಿ', 'ಮಗಳು', '181', '1098', 'safety', 'सुरक्षा', 'ಸುರಕ್ಷತೆ'],
  child: ['child', 'bachcha', 'बच्चा', 'ಬಾಲಕ', 'ಮಗು', 'baby', 'शिशु', 'ಶಿಶು', 'anganwadi', 'आंगनवाड़ी', 'ಅಂಗನವಾಡಿ'],
  money: ['money', 'paisa', 'पैसा', 'ಹಣ', 'rupees', 'rupaye', 'रुपये', 'ರೂಪಾಯಿ', 'subsidy', 'subsidy', 'dbt', 'डीबीटी'],
  panchayat: ['panchayat', 'पंचायत', 'ಪಂಚಾಯತ್', 'gram', 'ग्राम', 'ಗ್ರಾಮ', 'village', 'gaon', 'गांव', 'ಹಳ್ಳಿ', 'officer', 'adhikari', 'अधिकारी', 'ಅಧಿಕಾರಿ'],
};

/** token -> concept name, built once from CONCEPTS. */
const TOKEN_CONCEPT = new Map();
for (const [concept, forms] of Object.entries(CONCEPTS)) {
  for (const form of forms) {
    for (const token of String(form).toLowerCase().split(/[\s.]+/)) {
      const clean = token.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
      if (clean.length >= 2 && !TOKEN_CONCEPT.has(clean)) TOKEN_CONCEPT.set(clean, concept);
    }
  }
}

/** All surface tokens of a concept, used to widen the query. */
const CONCEPT_TOKENS = new Map();
for (const [concept, forms] of Object.entries(CONCEPTS)) {
  const tokens = new Set();
  for (const form of forms) {
    for (const token of String(form).toLowerCase().split(/[\s.]+/)) {
      const clean = token.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
      if (clean.length >= 2) tokens.add(clean);
    }
  }
  CONCEPT_TOKENS.set(concept, [...tokens]);
}

/** Category hints used when the client sends category=general (the Ask screen). */
const CATEGORY_CONCEPTS = {
  health: ['fever', 'stomach', 'pregnancy', 'tb', 'bp', 'anaemia', 'vaccine', 'snake', 'heat', 'mental', 'doctor'],
  schemes: ['scheme', 'gas', 'house', 'job', 'pension', 'ration', 'money'],
  scholarships: ['scholarship', 'student', 'certificate'],
  scam: ['fraud', 'police'],
  agriculture: ['farmer', 'insurance', 'landrecord'],
  education: ['student', 'scholarship', 'child'],
  documents: ['aadhaar', 'certificate', 'ration', 'landrecord'],
  emergency: ['ambulance', 'fire', 'water', 'women', 'police'],
  finance: ['bank', 'loan', 'insurance', 'pension', 'money'],
  general: ['panchayat', 'money', 'certificate'],
};

/** Lowercase, strip punctuation, split on whitespace. Works for Latin and Indic scripts. */
function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Widen a token list with the other ways of saying the same thing. */
function expandTokens(tokens) {
  const out = new Set(tokens);
  for (const token of tokens) {
    const concept = TOKEN_CONCEPT.get(token);
    if (!concept) continue;
    for (const sibling of CONCEPT_TOKENS.get(concept) || []) out.add(sibling);
  }
  return [...out];
}

/** Concepts mentioned by a piece of text. */
function detectConcepts(text) {
  const found = new Set();
  for (const token of tokenize(text)) {
    const concept = TOKEN_CONCEPT.get(token);
    if (concept) found.add(concept);
  }
  return [...found];
}

/**
 * Guess which knowledge category a free-text question belongs to.
 * Returns null when nothing is clear enough to act on.
 */
function detectCategory(text) {
  const concepts = detectConcepts(text);
  if (!concepts.length) return null;
  const scores = {};
  for (const [category, categoryConcepts] of Object.entries(CATEGORY_CONCEPTS)) {
    if (category === 'general') continue;
    const hits = concepts.filter((c) => categoryConcepts.includes(c)).length;
    if (hits) scores[category] = hits;
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  // Only act when one category is clearly ahead, otherwise stay general.
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

/** Every searchable string in a localised document, across all languages. */
function flatten(value, acc = []) {
  if (value == null) return acc;
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => flatten(v, acc));
    return acc;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((v) => flatten(v, acc));
  }
  return acc;
}

/**
 * Searchable fields per document kind, with a weight each.
 * The question or name carries the most weight: a user asking about Aadhaar
 * should land on the Aadhaar entry, not on a ration-card entry that happens to
 * mention Aadhaar somewhere in its answer.
 */
const FIELDS = {
  knowledge: [['question', 3], ['tags', 2], ['answer', 1], ['id', 2]],
  scheme: [['name', 3], ['description', 2], ['eligibility', 2], ['id', 2], ['tags', 1]],
  scholarship: [['name', 3], ['description', 2], ['eligibility', 2], ['id', 2], ['provider', 1], ['tags', 1]],
};

/**
 * Raw points for one set of tokens against a document.
 * Exact matches on the primary fields (question/name) count double; tags and
 * other fields count once; partial prefix matches (useful for Hindi and
 * Kannada inflections such as "ಬುಖಾರ್" / "ಬುಖಾರಿನ") count once.
 */
function matchScore(doc, queryTokens, kind) {
  if (!queryTokens.length) return 0;
  const fields = FIELDS[kind] || FIELDS.knowledge;
  const tiers = fields.map(([field, weight]) => ({
    weight,
    tokens: tokenize(flatten(doc[field])),
  }));
  const headline = tiers[0] ? tiers[0].tokens : [];
  const headlineWeight = tiers[0] ? tiers[0].weight : 3;

  let score = 0;
  for (const token of queryTokens) {
    let best = 0;
    for (const tier of tiers) {
      if (tier.tokens.includes(token)) best = Math.max(best, tier.weight);
    }
    // Prefix matching catches inflections ("ಪ್ರವಾಹದಲ್ಲಿ" for "ಪ್ರವಾಹ",
    // "ಬುಖಾರಿನ" for "ಬುಖಾರ್"). A long shared start is nearly the same word, so
    // it scores one below a full match; a short overlap scores one.
    if (!best && token.length >= 3) {
      let shared = 0;
      for (const t of headline) {
        if (t.length < 3) continue;
        if (t === token) continue;
        if (t.startsWith(token)) shared = Math.max(shared, token.length);
        else if (token.startsWith(t)) shared = Math.max(shared, t.length);
      }
      if (shared) best = shared >= 4 ? Math.max(1, (headlineWeight || 3) - 1) : 1;
    }
    score += best;
  }
  return score;
}

/**
 * Score a document against the question as typed (weight 2) and against the
 * widened synonym tokens (weight 1). Words the user actually typed always beat
 * a word we guessed for them, which keeps a Kannada question about a child's
 * fever on the fever entry instead of a school entry that mentions "child".
 */
function scoreDocument(doc, baseTokens, extraTokens, kind) {
  const base = matchScore(doc, baseTokens, kind);
  // The user's own words decide. Synonyms only step in for a document that the
  // user's words did not match at all, so a guessed word can never outrank a
  // word the person actually typed.
  if (base > 0 || !extraTokens || !extraTokens.length) return base * 2;
  return matchScore(doc, extraTokens, kind);
}

/**
 * Rank a list of documents. Returns [] when nothing scores above the threshold.
 * Pass expand:false to score the raw tokens only.
 */
function rank(docs, query, kind, { limit = 5, minScore = 4, expand = true } = {}) {
  const base = [...new Set(tokenize(query))];
  if (!base.length) return [];
  let extra = [];
  if (expand) {
    const baseSet = new Set(base);
    extra = expandTokens(base).filter((t) => !baseSet.has(t));
  }
  return docs
    .map((doc) => ({ doc, score: scoreDocument(doc, base, extra, kind) }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Two-pass search: a confident pass first, then a looser one so a partly
 * understood question still gets the closest entry instead of nothing.
 * `weak: true` tells the caller the match was only approximate.
 */
function search(docs, query, kind, { limit = 3 } = {}) {
  // 1. The user's own words, matched exactly (or by prefix). Best case.
  const exact = rank(docs, query, kind, { limit, minScore: 4, expand: false });
  if (exact.length) return { hits: exact, weak: false };

  // 2. The user's own words, but only a partial match.
  const partial = rank(docs, query, kind, { limit, minScore: 2, expand: false });
  if (partial.length) return { hits: partial, weak: true };

  // 3. Nothing in their words alone: bring in the synonyms, so "bukhar" or
  //    "jwara" still reaches the fever entry. Always marked approximate.
  const synonym = rank(docs, query, kind, { limit, minScore: 4 });
  if (synonym.length) return { hits: synonym, weak: true };

  const lastResort = rank(docs, query, kind, { limit, minScore: 2 });
  if (lastResort.length) return { hits: lastResort, weak: true };
  return { hits: [], weak: false };
}

/** Free-text filter used by the schemes and scholarships list endpoints. */
function filterDocs(docs, query, kind) {
  if (!query || !String(query).trim()) return docs;
  const exact = rank(docs, query, kind, { limit: docs.length, minScore: 2, expand: false });
  if (exact.length) return exact.map((hit) => hit.doc);
  return rank(docs, query, kind, { limit: docs.length, minScore: 2 }).map((hit) => hit.doc);
}

const FALLBACK = {
  en: 'I do not have verified information about this yet. Please contact your Gram Panchayat, the nearest health worker, or call the national helpline 112 for urgent help.',
  hi: 'इस विषय पर मेरे पास अभी सत्यापित जानकारी नहीं है। कृपया अपनी ग्राम पंचायत, नज़दीकी स्वास्थ्य कार्यकर्ता से संपर्क करें, या तुरंत सहायता के लिए 112 पर कॉल करें।',
  kn: 'ಈ ವಿಷಯದ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ಇನ್ನೂ ದೃಢೀಕರಿಸಿದ ಮಾಹಿತಿ ಇಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್, ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ, ಅಥವಾ ತುರ್ತು ಸಹಾಯಕ್ಕೆ 112 ಗೆ ಕರೆ ಮಾಡಿ.',
};

const pick = (field, language) =>
  (field && (field[language] || field.en)) || '';

/**
 * Answer a question from the knowledge base.
 * @returns {{answer: string, grounded: boolean, matchedKey: string|null,
 *            trustedSources: Array<{name: string}>, confidence: number}}
 */
function answerQuestion(knowledgeDocs, { question, language = 'en', category = 'general' }) {
  const pool = category && category !== 'general'
    ? knowledgeDocs.filter((d) => d.category === category)
    : knowledgeDocs;
  const { hits } = search(pool.length ? pool : knowledgeDocs, question, 'knowledge', { limit: 3 });
  if (!hits.length) {
    return {
      answer: FALLBACK[language] || FALLBACK.en,
      grounded: false,
      matchedKey: null,
      trustedSources: [],
      confidence: 0,
    };
  }
  const best = hits[0].doc;
  const related = hits.slice(1).map((h) => h.doc.id);
  return {
    answer: pick(best.answer, language) || pick(best.answer, 'en'),
    grounded: true,
    matchedKey: best.id,
    relatedKeys: related,
    trustedSources: (best.sources || []).map((s) => ({ name: s.name })),
    confidence: Math.min(1, hits[0].score / 12),
  };
}

module.exports = {
  tokenize,
  expandTokens,
  detectConcepts,
  detectCategory,
  rank,
  search,
  filterDocs,
  answerQuestion,
  pick,
  FALLBACK,
  CATEGORY_CONCEPTS,
};
