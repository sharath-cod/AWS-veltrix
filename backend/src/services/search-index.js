/**
 * Inverted index for the knowledge base, schemes and scholarships.
 *
 * Why this exists: the first version of retrieval.js tokenised every field of
 * every document on every question. With 56 entries that was ~24 ms per answer
 * on a laptop, and it grows linearly with the content — every entry added made
 * every question slower. This module tokenises each document exactly once,
 * builds a token -> documents map, and answers a question by touching only the
 * documents that share a word with it.
 *
 * It also keeps the scoring rules the app already relied on, so answers and
 * confidence values do not change:
 *
 *   - a hit on the question/name field is worth 3, tags 2, body text 1, and
 *     the best field wins;
 *   - a prefix hit ("ಬುಖಾರಿನ" for "ಬುಖಾರ್") is worth 2 when four or more
 *     characters match, otherwise 1, and only counts when the word did not
 *     match exactly;
 *   - the user's own words are scored separately from the guessed synonyms,
 *     and always win (see retrieval.js).
 *
 * The index is attached to the document array itself (a WeakMap key), so it is
 * built once per corpus snapshot and garbage collected with it. Nothing to
 * invalidate by hand.
 */

const { tokenize, flatten } = require('./text');

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

/** How many prefix expansions one query token may pull in. */
const MAX_PREFIX_MATCHES = 60;

class SearchIndex {
  constructor(docs, kind) {
    this.docs = docs;
    this.kind = kind;
    const fields = FIELDS[kind] || FIELDS.knowledge;
    const headlineWeight = fields[0] ? fields[0][1] : 3;

    /** token -> [{ d, w }] across every field, best weight per document. */
    this.postings = new Map();
    /** token -> [docIndex] but only for the headline field (question/name). */
    this.headline = new Map();
    /** Sorted vocabulary, used for prefix lookups. */
    this.vocab = [];

    const weightByDocToken = [];
    for (let d = 0; d < docs.length; d += 1) {
      const doc = docs[d];
      const weights = new Map();
      for (const [field, weight] of fields) {
        const tokens = tokenize(flatten(doc[field]));
        for (const token of tokens) {
          if (!weights.has(token) || weights.get(token) < weight) weights.set(token, weight);
          if (weight === headlineWeight) {
            let list = this.headline.get(token);
            if (!list) {
              list = [];
              this.headline.set(token, list);
            }
            if (list[list.length - 1] !== d) list.push(d);
          }
        }
      }
      weightByDocToken.push(weights);
      for (const [token, weight] of weights) {
        let list = this.postings.get(token);
        if (!list) {
          list = [];
          this.postings.set(token, list);
        }
        list.push({ d, w: weight });
      }
    }

    this.weights = weightByDocToken;
    this.headlineTokens = weightByDocToken.map((weights) => {
      const set = new Set();
      for (const token of weights.keys()) {
        if (this.headline.has(token)) set.add(token);
      }
      return set;
    });
    this.headlineWeight = headlineWeight;
    this.vocab = [...this.postings.keys()].sort();
    this.stats = {
      docs: docs.length,
      tokens: this.vocab.length,
      postings: [...this.postings.values()].reduce((sum, list) => sum + list.length, 0),
    };
  }

  /** Documents whose headline contains a token starting with, or inside, `token`. */
  prefixMatches(token) {
    const out = [];
    if (token.length < 3) return out;

    // 1. Vocabulary words that begin with the query word: "ಬುಖಾರಿನ" -> "ಬುಖಾರ್".
    let lo = 0;
    let hi = this.vocab.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.vocab[mid] < token) lo = mid + 1;
      else hi = mid;
    }
    for (let i = lo; i < this.vocab.length && out.length < MAX_PREFIX_MATCHES; i += 1) {
      const word = this.vocab[i];
      if (!word.startsWith(token)) break;
      if (word !== token) out.push([word, token.length]);
    }

    // 2. Vocabulary words that are a prefix of the query word: "ಪ್ರವಾಹದಲ್ಲಿ" -> "ಪ್ರವಾಹ".
    for (let len = Math.min(token.length - 1, 12); len >= 3; len -= 1) {
      const stem = token.slice(0, len);
      if (this.postings.has(stem)) out.push([stem, len]);
      if (out.length >= MAX_PREFIX_MATCHES) break;
    }
    return out;
  }

  /**
   * How specific a document is for these query words, used only to break ties.
   *
   * Scores alone often tie — "जन्म प्रमाण पत्र" and "जाति प्रमाण पत्र" both match
   * प्रमाण and पत्र — and breaking that tie by document order is arbitrary. This
   * weights the words by how rare they are in the corpus, so a document whose
   * question contains "जन्म" (one entry) beats one that only shares the common
   * words "प्रमाण पत्र" (four entries).
   */
  specificity(docIndex, tokens) {
    const headline = this.headlineTokens[docIndex];
    if (!headline) return 0;
    let total = 0;
    for (const token of tokens) {
      if (!headline.has(token)) continue;
      // Headline frequency, not corpus frequency: the question is how many
      // *entries ask about* this word, not how often it is mentioned in passing
      // somewhere in an answer.
      const df = (this.headline.get(token) || []).length;
      if (df > 0) total += Math.log(1 + this.docs.length / df);
    }
    return total;
  }

  /**
   * Score one token list against every document that could match.
   * @returns {Array<{doc: object, score: number, index: number}>} unsorted
   */
  scoreTokens(tokens) {
    if (!tokens || !tokens.length) return [];
    const scores = new Float64Array(this.docs.length);
    const touched = [];

    for (const token of tokens) {
      const exact = this.postings.get(token);
      // Documents where this token matched exactly, in any field. Prefix
      // matching is only a fallback for the others, exactly as before.
      const exactDocs = exact ? new Set() : null;
      if (exact) {
        for (const { d, w } of exact) {
          exactDocs.add(d);
          if (scores[d] === 0) touched.push(d);
          scores[d] += w;
        }
      }
      if (token.length < 3) continue;

      const matched = this.prefixMatches(token);
      if (!matched.length) continue;
      const shared = new Map();
      for (const [word, len] of matched) {
        const docs = this.headline.get(word);
        if (!docs) continue;
        for (const d of docs) {
          if (exactDocs && exactDocs.has(d)) continue;
          const prev = shared.get(d) || 0;
          if (len > prev) shared.set(d, len);
        }
      }
      for (const [d, len] of shared) {
        if (scores[d] === 0) touched.push(d);
        scores[d] += len >= 4 ? Math.max(1, this.headlineWeight - 1) : 1;
      }
    }

    const out = [];
    for (const d of touched) {
      if (scores[d] > 0) out.push({ doc: this.docs[d], score: scores[d], index: d });
    }
    return out;
  }
}

/**
 * Index lifetime.
 *
 * The index is keyed by a cheap signature of the content rather than by the
 * array object. That matters because the catalogue cache hands back a *new*
 * array every time it refreshes (every minute by default), and keying on the
 * array would throw away a perfectly good index and pay the build cost again on
 * the next question — forever. With a signature, a refresh that finds the same
 * content reuses the index, and only a real content change rebuilds it.
 *
 * The signature itself is memoised per array, so it is computed once per
 * snapshot and never per query.
 */
const SIGNATURE = new WeakMap();
const INDEXES = new Map();
const MAX_INDEXES = 8;
const BUILD_STATS = { builds: 0, reuses: 0, lastMs: 0 };

function signatureOf(docs) {
  const cached = SIGNATURE.get(docs);
  if (cached) return cached;
  let sig = String(docs.length);
  for (const doc of docs) {
    sig += `|${doc.contentHash || doc.updatedAt || doc.id}`;
  }
  SIGNATURE.set(docs, sig);
  return sig;
}

function getIndex(docs, kind) {
  const key = `${kind}|${signatureOf(docs)}`;
  const existing = INDEXES.get(key);
  if (existing) {
    BUILD_STATS.reuses += 1;
    // Refresh recency so the LRU drop below removes the coldest corpus.
    INDEXES.delete(key);
    INDEXES.set(key, existing);
    return existing;
  }
  const started = process.hrtime.bigint();
  const index = new SearchIndex(docs, kind);
  BUILD_STATS.builds += 1;
  BUILD_STATS.lastMs = Number(process.hrtime.bigint() - started) / 1e6;
  INDEXES.set(key, index);
  if (INDEXES.size > MAX_INDEXES) {
    const oldest = INDEXES.keys().next();
    if (!oldest.done) INDEXES.delete(oldest.value);
  }
  return index;
}

module.exports = { getIndex, SearchIndex, FIELDS, BUILD_STATS };
