/**
 * Language-agnostic keyword retrieval over the seeded knowledge base, schemes
 * and scholarships. Deliberately dependency free: it runs fast on a free tier
 * instance and needs no external AI service. If BEDROCK_MODEL_ID is configured
 * the answer is additionally rewritten by Amazon Bedrock (see services/bedrock).
 *
 * Rural users mix languages: they may type Kannada words in Latin letters
 * ("jwara"), Hindi in Devanagari, or English inside a Hindi sentence. The
 * CONCEPTS table in services/text.js maps those surface forms onto one idea so
 * a question finds the right entry whichever script or spelling it arrives in.
 *
 * This module decides *how* a question is matched. The tokenising, the concept
 * table and the scoring live in services/text.js and services/search-index.js,
 * which builds a token -> documents index once per corpus instead of
 * re-tokenising every document on every question.
 */
const {
  tokenize, expandTokens, detectConcepts, detectCategory, CATEGORY_CONCEPTS, pick,
} = require('./text');
const { getIndex, BUILD_STATS } = require('./search-index');

const FALLBACK = {
  en: 'I do not have verified information about this yet. Please contact your Gram Panchayat, the nearest health worker, or call the national helpline 112 for urgent help.',
  hi: 'इस विषय पर मेरे पास अभी सत्यापित जानकारी नहीं है। कृपया अपनी ग्राम पंचायत, नज़दीकी स्वास्थ्य कार्यकर्ता से संपर्क करें, या तुरंत सहायता के लिए 112 पर कॉल करें।',
  kn: 'ಈ ವಿಷಯದ ಬಗ್ಗೆ ನನ್ನ ಬಳಿ ಇನ್ನೂ ದೃಢೀಕರಿಸಿದ ಮಾಹಿತಿ ಇಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್, ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ, ಅಥವಾ ತುರ್ತು ಸಹಾಯಕ್ಕೆ 112 ಗೆ ಕರೆ ಮಾಡಿ.',
};

/** index -> score for one token list, from the inverted index. */
function scoredMap(index, tokens) {
  const scores = new Map();
  if (!tokens.length) return scores;
  for (const hit of index.scoreTokens(tokens)) scores.set(hit.index, hit.score);
  return scores;
}

/**
 * Score a document set against the question as typed (weight 2) and against the
 * widened synonym tokens (weight 1). Words the user actually typed always beat
 * a word we guessed for them, which keeps a Kannada question about a child's
 * fever on the fever entry instead of a school entry that mentions "child".
 */
function combine(baseScores, extraScores) {
  const indices = new Set([...baseScores.keys(), ...extraScores.keys()]);
  const out = [];
  for (const index of indices) {
    const base = baseScores.get(index) || 0;
    // The user's own words decide. Synonyms only step in for a document that
    // the user's words did not match at all, so a guessed word can never
    // outrank a word the person actually typed.
    const score = base > 0 ? base * 2 : (extraScores.get(index) || 0);
    if (score > 0) out.push({ index, score });
  }
  return out;
}

/**
 * Order hits: score first, then how specific the match is, then document order.
 * The middle rule only decides genuine ties, so no existing score or threshold
 * changes — it just stops the tie being settled by which entry happens to sit
 * earlier in the file.
 */
function orderHits(hits, index, tokens, preferCategory) {
  return hits
    .map((hit) => ({
      ...hit,
      rarity: index.specificity(hit.index, tokens),
      inCategory: preferCategory && index.docs[hit.index].category === preferCategory ? 1 : 0,
    }))
    .sort((a, b) => (b.score - a.score)
      || (b.inCategory - a.inCategory)
      || (b.rarity - a.rarity)
      || (a.index - b.index));
}

/**
 * Rank a list of documents. Returns [] when nothing scores above the threshold.
 * Pass expand:false to score the raw tokens only.
 */
function rank(docs, query, kind, {
  limit = 5, minScore = 4, expand = true, preferCategory = null,
} = {}) {
  const base = [...new Set(tokenize(query))];
  if (!base.length || !docs || !docs.length) return [];

  const index = getIndex(docs, kind);
  const baseScores = scoredMap(index, base);

  let extraScores = new Map();
  if (expand) {
    const baseSet = new Set(base);
    const extra = expandTokens(base).filter((t) => !baseSet.has(t));
    extraScores = scoredMap(index, extra);
  }

  return orderHits(
    combine(baseScores, extraScores).filter((hit) => hit.score >= minScore),
    index,
    base,
    preferCategory,
  )
    .slice(0, limit)
    .map((hit) => ({ doc: docs[hit.index], score: hit.score }));
}

/**
 * Two-pass search: a confident pass first, then a looser one so a partly
 * understood question still gets the closest entry instead of nothing.
 * `weak: true` tells the caller the match was only approximate.
 */
function search(docs, query, kind, { limit = 3, preferCategory = null } = {}) {
  // 1. The user's own words, matched exactly (or by prefix). Best case.
  const exact = rank(docs, query, kind, {
    limit, minScore: 4, expand: false, preferCategory,
  });
  if (exact.length) return { hits: exact, weak: false };

  // 2. The user's own words, but only a partial match.
  const partial = rank(docs, query, kind, {
    limit, minScore: 2, expand: false, preferCategory,
  });
  if (partial.length) return { hits: partial, weak: true };

  // 3. Nothing in their words alone: bring in the synonyms, so "bukhar" or
  //    "jwara" still reaches the fever entry. Always marked approximate.
  const synonym = rank(docs, query, kind, { limit, minScore: 4, preferCategory });
  if (synonym.length) return { hits: synonym, weak: true };

  const lastResort = rank(docs, query, kind, { limit, minScore: 2, preferCategory });
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

/** Diagnostics for /api/health and scripts/bench.js. */
function indexStats() {
  return { builds: BUILD_STATS.builds, lastBuildMs: Number(BUILD_STATS.lastMs.toFixed(2)) };
}

/**
 * Build every index up front. Called once at boot so the first user does not
 * pay the indexing cost, and again by the catalog cache when it refreshes.
 */
async function warmIndex(store) {
  const [knowledge, schemes, scholarships] = await Promise.all([
    store.knowledge.all(), store.schemes.all(), store.scholarships.all(),
  ]);
  getIndex(knowledge, 'knowledge');
  getIndex(schemes, 'scheme');
  getIndex(scholarships, 'scholarship');
  return indexStats();
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
  indexStats,
  warmIndex,
};
