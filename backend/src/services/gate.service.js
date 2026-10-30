// Hurdle 3: the read-back gate.
//
// This is the seam that makes the other two pillars safe, and it is the one place the
// assistant's behaviour changes. Everything else stays as it is.
//
// preflight() runs BEFORE the assistant answers:
//   - decides the reply language from a code-mixed question
//   - finds the numbers, sanity-checks them against the saved profile
//   - if a money / date / spoken-age number is involved, it does NOT answer yet:
//     it returns a read-back card and waits for a yes
//
// decorate() runs AFTER the assistant answers:
//   - attaches freshness to the answer, caps confidence, withholds expired amounts
//   - attaches the "here is what I understood" read-back so the person can see the
//     interpretation, not just the conclusion
//
// The gate is deliberately stateless apart from the pending confirmations, so it works
// the same on the server, in the Android app, and in the offline demo.

const lang = require('./lang.service');
const numbers = require('./numbers.service');
const freshness = require('./freshness.service');

// ---------------------------------------------------------------- pending confirmations
const pending = new Map();
const TTL_MS = 10 * 60 * 1000;
const MAX_PENDING = 5000;

const FIELD_FOR_KIND = { money: 'annualIncome', age: 'age', date: 'deadline', percent: 'percent', count: 'count' };

function sweep(now = Date.now()) {
  for (const [id, p] of pending) if (p.expiresAt < now) pending.delete(id);
  if (pending.size > MAX_PENDING) {
    const oldest = [...pending.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) pending.delete(oldest[0]);
  }
}

let seq = 0;
const nextId = () => `cf_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

/**
 * Store a question that is waiting on a "yes". Returns the card to show.
 * The pending entry keeps everything needed to continue the SAME question after the
 * answer, so the person never has to repeat themselves.
 */
function createConfirmation({ deviceId = 'anon', language = 'en', question = '', profile = {}, cards = [], extra = {} } = {}) {
  sweep();
  const id = nextId();
  const record = {
    id,
    deviceId,
    language,
    question,
    profile,
    cards,
    extra,
    createdAt: Date.now(),
    expiresAt: Date.now() + TTL_MS,
  };
  pending.set(id, record);
  return publicCard(record);
}

function publicCard(record) {
  return {
    id: record.id,
    required: true,
    language: record.language,
    question: record.question,
    // one card per number; the UI shows them one at a time, biggest risk first
    cards: record.cards,
    text: record.cards.map((c) => c.text).join(' '),
    expiresInSeconds: Math.round((record.expiresAt - Date.now()) / 1000),
  };
}

/**
 * Answer a read-back card.
 * action: 'confirm' (all as heard) | 'correct' (use the corrected values) | 'cancel'
 * corrected: { annualIncome: 120000 } - only the values the person actually confirmed.
 */
function resolveConfirmation(id, { action = 'confirm', corrected = {} } = {}) {
  sweep();
  const record = pending.get(id);
  if (!record) return { ok: false, code: 'expired', message: 'This question has expired. Please ask again.' };
  pending.delete(id);

  if (action === 'cancel') return { ok: true, cancelled: true, question: record.question, language: record.language };

  const confirmed = {};
  for (const card of record.cards) {
    const field = card.field || FIELD_FOR_KIND[card.kind] || card.kind;
    const given = corrected[field] !== undefined ? corrected[field] : card.value;
    const value = card.kind === 'date' ? given : Number(given);
    if (card.kind !== 'date' && !Number.isFinite(value)) {
      return { ok: false, code: 'invalid', message: 'That number was not understood. Please say it again.', field };
    }
    confirmed[field] = value;
  }
  return {
    ok: true,
    cancelled: false,
    question: record.question,
    language: record.language,
    confirmed,
    // pass this straight back into decorate(): {...ctx, confirmed}
    ctxPatch: { confirmed },
    // only confirmed values are merged, and they are merged as CONFIRMED, so the app
    // can show them differently from a value it merely guessed
    profile: numbers.applyConfirmed(record.profile, confirmed),
    extra: record.extra,
  };
}

// ---------------------------------------------------------------- preflight
/**
 * What a number means for the profile. Only money and age are used by the rule engine.
 * A "count" (acres, members) is read back only when it is clearly land, because land
 * ownership changes eligibility too.
 */
function cardFor(entry, { language, profile, alternatives }) {
  const flags = numbers.plausibility(entry, profile);
  const rb = numbers.readBack(entry, { language, alternatives, flags });
  const field = entry.kind === 'money' ? 'annualIncome' : entry.kind === 'age' ? 'age' : FIELD_FOR_KIND[entry.kind];
  return { ...rb, field, raw: entry.raw };
}

/**
 * Run before answering.
 * Returns { proceed: true, ctx } or { proceed: false, confirmation }.
 */
function preflight({ question = '', language = 'en', appLanguage = null, profile = {}, deviceId = 'anon', fromSpeech = false, corpus = null } = {}) {
  const policy = lang.replyPolicy(question, appLanguage || language);
  const replyLanguage = policy.language;

  const parsed = numbers.parseNumbers(question);
  const interesting = parsed.filter((n) => numbers.needsConfirmation(n, { fromSpeech }));

  const ctx = {
    question,
    language: replyLanguage,
    askedLanguage: language,
    appLanguage: appLanguage || language,
    policy,
    numbers: parsed,
    confirmed: {},
    fromSpeech,
  };

  if (!interesting.length) return { proceed: true, ctx };

  const cards = interesting.map((entry) =>
    cardFor(entry, { language: replyLanguage, profile, alternatives: numbers.confusionCandidates(entry) })
  );
  // biggest risk first: money before age, and a tenfold flag above everything
  cards.sort((a, b) => {
    const w = (c) => (c.flags.some((f) => f.code === 'tenfold-change') ? 0 : c.kind === 'money' ? 1 : 2);
    return w(a) - w(b);
  });

  return {
    proceed: false,
    confirmation: createConfirmation({ deviceId, language: replyLanguage, question, profile, cards, extra: { policy } }),
    ctx: { ...ctx, cards },
  };
}

// ---------------------------------------------------------------- decorate
/**
 * The "here is what I understood" block. Shown above the answer, and read aloud when
 * the question came from speech. It makes the interpretation visible instead of
 * leaving the person to infer it from the answer.
 */
function understanding(ctx, result = {}) {
  if (!ctx) return null;
  const matched = (result.matches && result.matches[0]) || null;
  const lines = [];
  const L = ctx.language;
  const said = {
    en: (n) => `You said: ${n}`,
    hi: (n) => `आपने कहा: ${n}`,
    kn: (n) => `ನೀವು ಹೇಳಿದ್ದು: ${n}`,
  };
  const asking = {
    en: (n) => `You are asking about: ${n}`,
    hi: (n) => `आप पूछ रहे हैं: ${n}`,
    kn: (n) => `ನೀವು ಕೇಳುತ್ತಿರುವುದು: ${n}`,
  };
  const mixedNote = {
    en: (langs) => `I understood your mixed words (${langs.join(', ')}). I am answering in ${L === 'hi' ? 'Hindi' : L === 'kn' ? 'Kannada' : 'English'}.`,
    hi: (langs) => `मैंने आपके मिले-जुले शब्द समझे (${langs.join(', ')}). जवाब हिंदी में दे रहा हूँ।`,
    kn: (langs) => `ನಿಮ್ಮ ಮಿಶ್ರ ಭಾಷೆಯ ಮಾತುಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ (${langs.join(', ')}). ಉತ್ತರ ಕನ್ನಡದಲ್ಲಿ ಕೊಡುತ್ತಿದ್ದೇನೆ.`,
  };
  const NAME = { en: 'English', hi: 'Hindi', kn: 'Kannada' };

  if (matched && matched.name) lines.push((asking[L] || asking.en)(matched.name));
  // After a read-back, what the person CONFIRMED is what we understood - not what the
  // microphone first produced.
  const confirmed = ctx.confirmed || {};
  if (Object.keys(confirmed).length) {
    const shown = [];
    if (Number.isFinite(confirmed.annualIncome)) shown.push(`₹${numbers.groupIndian(confirmed.annualIncome)}`);
    if (Number.isFinite(confirmed.age)) shown.push(String(confirmed.age));
    if (shown.length) lines.push(shown.join(', '));
  } else {
    const nums = (ctx.numbers || []).filter((n) => n.kind === 'money' || n.kind === 'age');
    if (nums.length) lines.push(nums.map((n) => numbers.formatValue(n, L)).join(', '));
  }
  if (ctx.policy && ctx.policy.mixed) {
    const scripts = (ctx.policy.scripts || []).map((s) => NAME[s === 'latin' ? 'en' : s === 'devanagari' ? 'hi' : 'kn']);
    if (scripts.length > 1) lines.push((mixedNote[L] || mixedNote.en)(scripts));
  }
  if (!lines.length) return null;
  return {
    language: L,
    mixed: Boolean(ctx.policy && ctx.policy.mixed),
    lines,
    text: lines.join(' · '),
    speechSegments: lang.speechSegments(lines.join('. '), L),
  };
}

/**
 * Run after the assistant answers.
 * `records` are the documents the answer used (knowledge / scheme / scholarship),
 * so freshness can be judged on the actual facts, not on the pack as a whole.
 */
function decorate(result, ctx = {}, records = [], { now = new Date() } = {}) {
  const language = (ctx && ctx.language) || result.language || 'en';
  // the person's own confirmed numbers must survive a stale-record scrub
  const keep = [ctx && ctx.confirmed ? ctx.confirmed.annualIncome : null, ctx && ctx.confirmed ? ctx.confirmed.age : null].filter(Number.isFinite);
  let out = freshness.applyToAnswer(result, records, { now, language, keepAmounts: keep });
  const u = understanding(ctx, result);
  if (u) out.understanding = u;
  out.language = language;
  if (ctx && ctx.policy) {
    out.languagePolicy = {
      mixed: ctx.policy.mixed,
      dominant: ctx.policy.dominant,
      confidence: ctx.policy.confidence,
      scripts: ctx.policy.scripts,
      preservedNames: ctx.policy.preserve.map((p) => p.said),
    };
  }
  // every answer is safe to speak: the app sends each piece to the right voice
  if (typeof out.answer === 'string') out.speechSegments = lang.speechSegments(out.answer, language);
  return out;
}

module.exports = {
  preflight, decorate, understanding, createConfirmation, resolveConfirmation,
  pending, FIELD_FOR_KIND, TTL_MS,
};
