/**
 * Language-agnostic keyword retrieval over the seeded knowledge base, schemes
 * and scholarships. Deliberately dependency free: it runs fast on a free tier
 * instance and needs no external AI service. If BEDROCK_MODEL_ID is configured
 * the answer is additionally rewritten by Amazon Bedrock (see services/bedrock).
 */

const STOPWORDS = new Set([
  // english
  'the', 'a', 'an', 'is', 'are', 'am', 'do', 'does', 'did', 'i', 'me', 'my', 'we', 'you', 'your',
  'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'will',
  'for', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'if', 'it', 'this', 'that', 'there', 'be',
  'get', 'got', 'have', 'has', 'about', 'with', 'from', 'need', 'want', 'any', 'please',
  // hindi (romanised and devanagari)
  'kya', 'kaise', 'kaisa', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'me', 'mein', 'aur', 'ya',
  'kar', 'karna', 'kare', 'kaun', 'kab', 'kahan', 'liye', 'chahiye', 'milta', 'mil', 'mera', 'meri',
  'क्या', 'कैसे', 'है', 'हैं', 'का', 'की', 'के', 'को', 'में', 'और', 'या', 'कर', 'करना', 'करें',
  'कौन', 'कब', 'कहां', 'लिए', 'चाहिए', 'मिलता', 'मेरा', 'मेरी',
  // kannada
  'enu', 'hege', 'yake', 'yavudu', 'ide', 'illa', 'nanna', 'nanage', 'beku', 'sigutte',
  'ಏನು', 'ಹೇಗೆ', 'ಯಾಕೆ', 'ಇದೆ', 'ಇಲ್ಲ', 'ನನ್ನ', 'ನನಗೆ', 'ಬೇಕು', 'ಸಿಗುತ್ತದೆ',
]);

/** Lowercase, strip punctuation, split on whitespace. Works for Latin and Indic scripts. */
function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
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

const FIELDS = {
  knowledge: ['question', 'answer', 'tags'],
  scheme: ['name', 'description', 'eligibility', 'tags'],
  scholarship: ['name', 'description', 'eligibility', 'provider', 'tags'],
};

/**
 * Score a document against the query tokens.
 * Exact token matches on tags/name/question count double; partial prefix
 * matches (useful for Hindi/Kannada inflections) count once.
 */
function scoreDocument(doc, queryTokens, kind) {
  if (!queryTokens.length) return 0;
  const fields = FIELDS[kind] || FIELDS.knowledge;
  const primary = tokenize(flatten(fields.slice(0, 2).map((f) => doc[f])));
  const secondary = tokenize(flatten(fields.slice(2).map((f) => doc[f])));
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary);

  let score = 0;
  for (const token of queryTokens) {
    if (primarySet.has(token)) score += 2;
    else if (secondarySet.has(token)) score += 1;
    else if (primary.some((t) => t.startsWith(token) || token.startsWith(t))) score += 1;
  }
  return score;
}

/** Rank a list of documents. Returns [] when nothing scores above the threshold. */
function rank(docs, query, kind, { limit = 5, minScore = 2 } = {}) {
  const queryTokens = [...new Set(tokenize(query))];
  if (!queryTokens.length) return [];
  return docs
    .map((doc) => ({ doc, score: scoreDocument(doc, queryTokens, kind) }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Free-text filter used by the schemes and scholarships list endpoints. */
function filterDocs(docs, query, kind) {
  if (!query || !String(query).trim()) return docs;
  const hits = rank(docs, query, kind, { limit: docs.length, minScore: 1 });
  return hits.map((hit) => hit.doc);
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
  const hits = rank(pool.length ? pool : knowledgeDocs, question, 'knowledge', { limit: 3 });
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
    confidence: Math.min(1, hits[0].score / 6),
  };
}

module.exports = {
  tokenize,
  rank,
  filterDocs,
  answerQuestion,
  pick,
  FALLBACK,
};
