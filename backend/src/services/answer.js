/**
 * One place that turns a question into a grounded answer, shared by the text
 * endpoint (/api/query) and the voice endpoint (/api/voice-sessions/:id/turns).
 */
const { rank, pick, FALLBACK } = require('./retrieval');
const { composeAnswer } = require('./bedrock');

const LANGS = ['en', 'hi', 'kn'];

async function answerFromKnowledge({ store, config, speech }, { question, language = 'en', category = 'general' }) {
  const lang = LANGS.includes(language) ? language : 'en';
  const all = await store.knowledge.all();
  const pool = category && category !== 'general' ? all.filter((d) => d.category === category) : all;
  const hits = rank(pool.length ? pool : all, question, 'knowledge', { limit: 3 });

  if (!hits.length) {
    return {
      answer: FALLBACK[lang] || FALLBACK.en,
      grounded: false,
      language: lang,
      category,
      trustedSources: [],
      confidence: 0,
      provider: 'knowledge-base',
      notice: 'No matching entry in the knowledge base. Nothing was invented.',
    };
  }

  const best = hits[0].doc;
  const extractive = pick(best.answer, lang) || pick(best.answer, 'en');
  let answer = extractive;
  let provider = 'knowledge-base';

  if (config && config.bedrockModelId) {
    const context = hits
      .map((hit, i) => `[${i + 1}] ${pick(hit.doc.question, lang)}\n${pick(hit.doc.answer, lang)}`)
      .join('\n\n');
    const composed = await composeAnswer({
      question: String(question).trim(),
      context,
      language: lang,
      config,
      credentials: speech ? speech.credentials : null,
    });
    if (composed) {
      answer = composed.text;
      provider = composed.provider;
    }
  }

  return {
    answer,
    answerExtractive: extractive,
    grounded: true,
    language: lang,
    category,
    matchedKey: best.id,
    relatedKeys: hits.slice(1).map((h) => h.doc.id),
    trustedSources: (best.sources || []).map((s) => ({ name: s.name })),
    confidence: Math.min(1, Number((hits[0].score / 6).toFixed(2))),
    provider,
    verified: Boolean(best.verified),
    notice: best.verified
      ? undefined
      : 'This answer comes from seed content marked unverified. Confirm details on the official portal.',
  };
}

module.exports = { answerFromKnowledge, LANGS };
