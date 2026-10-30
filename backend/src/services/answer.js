/**
 * One place that turns a question into a grounded answer, shared by the text
 * endpoint (/api/query), the voice endpoint (/api/voice-sessions/:id/turns)
 * and anything else that needs an answer.
 *
 * Rules that matter for a rural user:
 *  - never invent: if nothing matches, say so in the user's language;
 *  - never answer from the wrong shelf: if the Health screen asks a schemes
 *    question, fall back to the whole knowledge base instead of refusing;
 *  - answer in the language the question was asked in, even when the phone's
 *    menu is in another one (hurdle 2: people mix languages);
 *  - say how fresh the fact is and where to verify it (hurdle 1);
 *  - return the amounts and dates separately, spoken digit by digit, so the
 *    client can read them back before anything is acted on (hurdle 3).
 */
const { search, pick, FALLBACK, detectCategory, detectConcepts } = require('./retrieval');
const { composeAnswer } = require('./bedrock');
const { buildManifest, compare, recheckFor, MESSAGES } = require('./freshness');
const {
  readBack, extractNumbers, detectLanguages, dominantLanguage, speechScript,
} = require('./numbers');

const LANGS = ['en', 'hi', 'kn'];

/** Resolve "auto" (and anything unknown) to a real language. */
function resolveLanguage(requested, question) {
  if (LANGS.includes(requested)) return requested;
  return dominantLanguage(question);
}

/** Freshness + number read-back + fact dates that ride along with every answer. */
async function withSafety(store, result, { question, lang, packVersion, packDownloadedAt, entry }) {
  const manifest = await buildManifest(store);
  const freshness = compare(manifest, { packVersion, downloadedAt: packDownloadedAt });
  const youSaid = readBack(question, lang);
  const answerNumbers = extractNumbers(result.answer || '').filter((n) => n.kind !== 'identifier');
  const answerDates = require('./numbers').extractDates(result.answer || '');
  const hasMoney = answerNumbers.some((n) => n.kind === 'amount')
    || /(?:rs\.?|₹|रुपये|रुपए|ರೂಪಾಯಿ|rupees)/i.test(result.answer || '');
  const volatile = Boolean(entry && entry.volatile);
  const recheck = entry
    ? recheckFor(
      { ...entry, matchedQuestion: result.matchedQuestion },
      freshness,
      { downloadedAt: packDownloadedAt },
    )
    : undefined;

  return {
    ...result,
    languagesDetected: detectLanguages(question),
    answerLanguage: lang,
    freshness,
    // Amounts, dates and volatile scheme facts are what change after download.
    verifyBeforeActing: Boolean(freshness.stale || hasMoney || volatile || answerDates.some((d) => d.ambiguous)),
    staleNotice: freshness.stale ? MESSAGES.outdated : (hasMoney ? MESSAGES.unknown : undefined),
    youSaid: youSaid.count || youSaid.dates.length ? youSaid : undefined,
    answerNumbers: answerNumbers.length ? answerNumbers : undefined,
    answerDates: answerDates.length ? answerDates : undefined,
    // Spoken form of the answer, so any client can read amounts one by one.
    answerSpeech: speechScript(result.answer || '', lang),
    fact: entry
      ? {
        asOf: entry.asOf || null,
        volatile,
        volatileFacts: entry.volatileFacts || [],
        verifyUrl: entry.verifyUrl || null,
        verifyAt: entry.verifyAt || null,
      }
      : undefined,
    recheck,
  };
}

/**
 * Pick the documents to search.
 * 1. If the screen sent a category, search that shelf first.
 * 2. If that shelf gives nothing useful, search everything — a user who opens
 *    the Health screen and asks about a scholarship should still get an answer.
 */
function choosePool(all, { category, question }) {
  const asked = category && category !== 'general' ? String(category) : null;
  if (asked) {
    const shelf = all.filter((d) => d.category === asked);
    if (shelf.length) {
      const onShelf = search(shelf, question, 'knowledge', { limit: 3 });
      // A confident match inside the section the user opened: use it.
      if (onShelf.hits.length && !onShelf.weak) {
        return { pool: shelf, attempt: onShelf, categoryUsed: asked, categoryFallback: false };
      }
      // Otherwise see whether the question clearly belongs to another phase.
      const anywhere = search(all, question, 'knowledge', { limit: 3 });
      if (anywhere.hits.length && !anywhere.weak) {
        const winner = all.find((d) => d.id === anywhere.hits[0].doc.id);
        return {
          pool: all,
          attempt: anywhere,
          categoryUsed: winner ? winner.category : (detectCategory(question) || asked),
          categoryFallback: Boolean(winner && winner.category !== asked),
        };
      }
      if (onShelf.hits.length) {
        return { pool: shelf, attempt: onShelf, categoryUsed: asked, categoryFallback: false };
      }
    }
  }
  const everything = search(all, question, 'knowledge', { limit: 3 });
  return {
    pool: all,
    attempt: everything,
    categoryUsed: detectCategory(question) || asked || 'general',
    categoryFallback: Boolean(asked),
  };
}

/** The questions a user could ask next, in their own language. */
function suggestionsFrom(all, { exclude, lang, limit = 3 }) {
  return all
    .filter((doc) => doc.id !== exclude)
    .slice(0, limit)
    .map((doc) => pick(doc.question, lang))
    .filter(Boolean);
}

async function answerFromKnowledge(ctx, input) {
  const lang = resolveLanguage(input.language, input.question);
  const { result, entry } = await baseAnswer(ctx, { ...input, language: lang });
  return withSafety(ctx.store, result, {
    question: input.question,
    lang,
    packVersion: input.packVersion,
    packDownloadedAt: input.packDownloadedAt,
    entry,
  });
}

async function baseAnswer({ store, config, speech }, { question, language = 'en', category = 'general' }) {
  const lang = LANGS.includes(language) ? language : 'en';
  const all = await store.knowledge.all();
  const { attempt, categoryUsed, categoryFallback } = choosePool(all, { category, question });
  const hits = attempt.hits;

  if (!hits.length) {
    const concepts = detectConcepts(question);
    return {
      entry: null,
      result: {
        answer: FALLBACK[lang] || FALLBACK.en,
        grounded: false,
        language: lang,
        category: categoryUsed,
        matchedConcepts: concepts.length ? concepts : undefined,
        trustedSources: [],
        confidence: 0,
        provider: 'knowledge-base',
        suggestions: suggestionsFrom(all, { exclude: null, lang, limit: 3 }),
        notice: 'No matching entry in the knowledge base. Nothing was invented.',
      },
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

  const notices = [];
  if (!best.verified) {
    notices.push('This answer comes from seed content marked unverified. Confirm details on the official portal.');
  }
  if (attempt.weak) {
    notices.push('This is the closest match in the knowledge base, not an exact one. Please check the details.');
  }
  if (categoryFallback) {
    notices.push(`Nothing matched in the "${category}" section, so the whole knowledge base was searched.`);
  }

  // Does the question talk about the same thing as the entry it matched? For a
  // medical question this decides between answering and redirecting to 108/104,
  // so a spurious keyword match cannot become medical advice.
  const asked = new Set(detectConcepts(question));
  const entryConcepts = new Set(detectConcepts([
    ...Object.values(best.question || {}),
    ...(best.tags || []),
  ].join(' ')));
  const conceptOverlap = [...asked].some((c) => entryConcepts.has(c));

  return {
    entry: best,
    result: {
      conceptOverlap,
      answer,
      answerExtractive: extractive,
      grounded: true,
      language: lang,
      category: categoryUsed,
      matchedKey: best.id,
      matchedQuestion: pick(best.question, lang),
      relatedKeys: hits.slice(1).map((h) => h.doc.id),
      trustedSources: (best.sources || []).map((s) => ({ name: s.name })),
      confidence: Math.min(1, Number((hits[0].score / 12).toFixed(2))),
      provider,
      verified: Boolean(best.verified),
      matchQuality: attempt.weak ? 'approximate' : 'exact',
      suggestions: suggestionsFrom(all, { exclude: best.id, lang, limit: 3 }),
      notice: notices.length ? notices.join(' ') : undefined,
    },
  };
}

module.exports = { answerFromKnowledge, LANGS, resolveLanguage };
