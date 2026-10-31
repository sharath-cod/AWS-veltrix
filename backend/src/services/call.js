/**
 * The call: the AI picks up, listens, and answers — in the caller's language,
 * briefly enough to be spoken, with a safety net for medical questions.
 *
 * A turn runs through this order, and the first rule that matches wins:
 *
 *   1. small talk / call control   "hello", "thank you", "bye"     (conversation.js)
 *   2. "tell me more"              continues the previous answer
 *   3. red-flag medical            chest pain, bleeding, fits …    -> call 108 (triage.js)
 *   4. dose question               "how many tablets"              -> never answered, 104
 *   5. medical, not covered        medical intent + weak match      -> 104 / 108
 *   6. knowledge base answer       summarised for speech, with sources
 *   7. nothing found               says so, offers what it can do
 *
 * Two things make the answers "apt" rather than just correct:
 *
 *   - a long knowledge-base paragraph is trimmed to the two or three sentences
 *     that answer the question, and the rest is offered as "tell me more";
 *   - a short follow-up ("aur kitna", "uske liye kya chahiye", "एष्टु") is
 *     resolved against the previous question, so a conversation works.
 */
const { answerFromKnowledge } = require('./answer');
const { createTranslator } = require('./translate');
const { assess, cautionFor } = require('./triage');
const conversation = require('./conversation');
const { readBack, speechScript, detectLanguages, dominantLanguage } = require('./numbers');
const { detectConcepts } = require('./retrieval');
const {
  text, isCallLang, isContentLang, detectScript, fromProviderCode, nameOf,
  CALL_LANGS, CONTENT_LANGS,
} = require('../data/languages');

const translatorFor = new WeakMap();
function translator(ctx) {
  if (!translatorFor.has(ctx)) translatorFor.set(ctx, createTranslator(ctx.config));
  return translatorFor.get(ctx);
}

/** Which language to greet in when the caller has not spoken yet. */
function startLanguage(language, uiLanguage) {
  if (isCallLang(language)) return language;
  if (isCallLang(uiLanguage)) return uiLanguage;
  return 'en';
}

/**
 * Work out the language of this turn.
 * The session language wins unless it is "auto", in which case the transcript,
 * the speech provider's guess, then the phone's UI language decide.
 */
function turnLanguage({ session, transcript, sttLanguage, uiLanguage }) {
  if (session.language && session.language !== 'auto' && isCallLang(session.language)) {
    // A caller can switch language mid-call by speaking another script, and the
    // call must follow them — including into a language with no content pack.
    const scripted = detectScript(transcript);
    if (scripted && scripted !== session.language) return scripted;
    return session.language;
  }
  const fromStt = fromProviderCode(sttLanguage);
  if (fromStt) return fromStt;
  const scripted = detectScript(transcript);
  if (scripted) return scripted;
  if (uiLanguage && isCallLang(uiLanguage)) return uiLanguage;
  return dominantLanguage(transcript) || 'en';
}

// ---------------------------------------------------------------- follow-ups
/**
 * Words that only make sense against the previous question: "aur kitna",
 * "uske liye kya chahiye", "kab tak", "ಎಷ್ಟು", "इसमें".
 */
const FOLLOW_UP = /^(aur|or|usme|uska|uske|iska|iske|iske liye|uske liye|kitna|kitni|kitne|kab|kaise|kyun|kahan|aage|more|continue|batao|bata|हाँ|और|उसमें|उसका|इसका|कितना|कितनी|कब|कैसे|आगे|ಬೇರೆ|ಇನ್ನೂ|ಅದರ|ಎಷ್ಟು|ಹೇಗೆ|ಯಾವಾಗ|ಮತ್ತೆ)\b/i;

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

/** Is this a short follow-up that needs the previous question to make sense? */
function isFollowUp(transcript) {
  const t = String(transcript || '').trim();
  if (!t) return false;
  return wordCount(t) <= 4 || FOLLOW_UP.test(t);
}

/** The last thing the caller actually asked, from the stored turns. */
function lastUserTurn(session) {
  const turns = (session.turns || []).filter((t) => t.transcript);
  return turns.length ? turns[turns.length - 1] : null;
}

// -------------------------------------------------------- spoken answers
/** Split a paragraph into sentences, keeping Indic sentence marks. */
function splitSentences(input) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?।॥])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Trim an answer to what can be listened to. Keeps whole sentences, up to about
 * `maxWords`, and reports whether anything was left for "tell me more".
 */
function spokenSlice(fullAnswer, { maxWords = 55, startAt = 0 } = {}) {
  const sentences = splitSentences(fullAnswer);
  if (!sentences.length) return { text: '', used: 0, more: false };
  const from = Math.min(startAt, sentences.length);
  const picked = [];
  let words = 0;
  for (let i = from; i < sentences.length; i += 1) {
    const w = wordCount(sentences[i]);
    if (picked.length && words + w > maxWords) break;
    picked.push(sentences[i]);
    words += w;
  }
  const used = from + picked.length;
  return {
    text: picked.join(' '),
    used,
    more: used < sentences.length,
  };
}

/** Does the question and the matched entry talk about the same thing? */
function conceptOverlap(question, entry) {
  if (!entry) return false;
  const asked = new Set(detectConcepts(question));
  if (!asked.size) return false;
  const entryConcepts = new Set(detectConcepts([
    ...Object.values(entry.question || {}),
    ...(entry.tags || []),
  ].join(' ')));
  return [...asked].some((c) => entryConcepts.has(c));
}

/** POST /api/calls — the AI picks up. */
async function startCall(ctx, { deviceId, language, uiLanguage }) {
  const { store, speech } = ctx;
  const lang = startLanguage(language, uiLanguage);
  const greeting = text(lang, 'greeting');
  const session = await store.sessions.create(deviceId, {
    kind: 'call',
    status: 'connected',
    language: isCallLang(language) ? language : 'auto',
    uiLanguage: uiLanguage || lang,
    startedAt: new Date().toISOString(),
    turns: [],
  });

  return {
    id: session.id,
    status: 'connected',
    language: lang,
    languageName: nameOf(lang),
    greeting: { text: greeting, language: lang },
    answerSpeech: speechScript(greeting, lang),
    pickupDelayMs: 1200,
    canTranscribe: speech.canTranscribe(),
    speech: speech.status,
    supportedLanguages: CALL_LANGS,
    contentLanguages: CONTENT_LANGS,
  };
}

/** Build the answer for one turn. */
async function composeTurn(ctx, { lang, transcript, session, previous }) {
  const { store } = ctx;
  const translate = translator(ctx);

  // Non-content languages are reasoned about in English.
  let working = transcript;
  if (!isContentLang(lang)) {
    const english = await translate.toEnglish(transcript, lang);
    if (english) working = english;
  }
  // A short follow-up only makes sense together with the previous question.
  const contextual = previous && previous.transcript && isFollowUp(transcript)
    ? `${previous.transcript} ${working}`
    : working;
  const answerLang = isContentLang(lang) ? lang : 'en';

  // 1. small talk / call control
  const smallTalk = conversation.match(working, lang);
  if (smallTalk) {
    return {
      kind: 'conversation',
      intent: smallTalk.intent,
      answer: smallTalk.reply,
      answerLanguage: lang,
      endCall: smallTalk.end,
      grounded: false,
      spokenFull: smallTalk.reply,
      more: false,
    };
  }

  // 2-6. knowledge base first, so triage knows how confident the answer is
  const kb = await answerFromKnowledge(ctx, {
    question: contextual,
    language: answerLang,
    category: 'general',
  });

  const entry = kb.matchedKey
    ? (await store.knowledge.all()).find((d) => d.id === kb.matchedKey)
    : null;
  const overlap = conceptOverlap(contextual, entry);
  // An approximate match is not an answer. In a call, saying "I am not sure" is
  // far better than confidently reading out the closest unrelated entry.
  const confident = kb.grounded === true && kb.matchQuality !== 'approximate' && overlap;

  const triage = assess(contextual, {
    language: lang,
    grounded: confident,
    confidence: kb.confidence,
    matchQuality: kb.matchQuality,
    category: kb.category,
    conceptOverlap: overlap,
  });

  const base = {
    answerLanguage: lang,
    category: kb.category,
    matchedKey: kb.matchedKey,
    trustedSources: confident ? kb.trustedSources : [],
    fact: kb.fact,
    recheck: kb.recheck,
    freshness: kb.freshness,
    suggestions: kb.suggestions,
    languagesDetected: detectLanguages(transcript),
    triage: { kind: triage.kind, urgency: triage.urgency, reason: triage.reason, flags: triage.flags || [] },
    contextualQuestion: contextual !== working ? contextual : undefined,
  };

  // Red flag: safety message only, whatever the knowledge base found.
  if (triage.kind === 'emergency' || triage.kind === 'mental-health-crisis') {
    const parts = [triage.spoken];
    if (triage.firstAid) parts.push(triage.firstAid);
    const answer = parts.join(' ');
    return {
      ...base,
      kind: triage.kind,
      urgency: 'urgent',
      grounded: false,
      answer,
      spokenFull: answer,
      more: false,
      redirect: triage.redirect,
      trustThisAnswer: false,
      notice: 'Emergency guidance — call 108 now.',
    };
  }

  // Dose question or medical question we cannot answer confidently.
  if (triage.kind === 'dose-refusal' || triage.kind === 'medical-uncertain') {
    return {
      ...base,
      kind: triage.kind,
      urgency: triage.urgency,
      grounded: false,
      answer: triage.spoken,
      spokenFull: triage.spoken,
      more: false,
      redirect: triage.redirect,
      trustThisAnswer: false,
      notice: triage.kind === 'dose-refusal'
        ? 'Refused to advise a dose. A doctor or 104 must decide.'
        : 'Medical question without a verified answer. Directed to 104 / 108.',
    };
  }

  // A confident, non-emergency answer: trim it for speech.
  if (confident) {
    const caution = triage.medical ? cautionFor(lang) : '';
    const slice = spokenSlice(kb.answer, { maxWords: 55 });
    const spoken = caution ? `${slice.text} ${caution}` : slice.text;
    return {
      ...base,
      kind: triage.medical ? 'medical-answer' : 'knowledge',
      urgency: 'normal',
      grounded: true,
      answer: spoken,
      spokenFull: kb.answer,
      more: slice.more,
      spokenSentences: slice.used,
      redirect: null,
      trustThisAnswer: true,
      notice: kb.notice,
    };
  }

  // Nothing in the knowledge base: say so and offer what it can do. For a
  // caller whose language has no content pack, this stays in English so the
  // caller can translate or fall back honestly (see callTurn).
  const noInfo = isContentLang(lang) ? text(lang, 'noInfo') : text('en', 'noInfo');
  const suggestions = (kb.suggestions || []).slice(0, 2);
  const answer = suggestions.length ? `${noInfo} ${suggestions.join(' ')}` : noInfo;
  return {
    ...base,
    kind: 'not-found',
    urgency: 'normal',
    grounded: false,
    answer,
    spokenFull: answer,
    more: false,
    redirect: null,
    trustThisAnswer: false,
    notice: 'No verified answer. Offered the topics it can answer.',
  };
}

/** "Tell me more": continue the previous answer from where the call stopped. */
async function continueAnswer(ctx, { session, lang }) {
  const full = session.lastFullAnswer;
  if (!full) {
    return {
      kind: 'conversation',
      answerLanguage: lang,
      answer: text(lang, 'noInfo'),
      spokenFull: text(lang, 'noInfo'),
      more: false,
      grounded: false,
    };
  }
  const startAt = session.spokenSentences || 0;
  const slice = spokenSlice(full, { maxWords: 60, startAt });
  if (!slice.text) {
    const done = text(lang, 'noMore');
    return {
      kind: 'conversation',
      answerLanguage: lang,
      answer: done,
      spokenFull: done,
      more: false,
      grounded: true,
      spokenSentences: startAt,
    };
  }
  return {
    kind: 'more',
    answerLanguage: lang,
    answer: slice.text,
    spokenFull: full,
    more: slice.more,
    spokenSentences: slice.used,
    grounded: true,
  };
}

/** POST /api/calls/:id/turns */
async function callTurn(ctx, { sessionId, audio, contentType, transcript, sttLanguage }) {
  const { store, speech } = ctx;
  const session = await store.sessions.get(sessionId);
  if (!session) return { error: 'not-found' };
  if (session.status === 'ended') return { error: 'ended' };

  const lang = turnLanguage({
    session,
    transcript: transcript || '',
    sttLanguage,
    uiLanguage: session.uiLanguage,
  });

  const heard = readBack(transcript || '', lang);
  const previous = lastUserTurn(session);

  // "tell me more" continues the last answer instead of starting a new search.
  const wantsMore = conversation.isMoreRequest(transcript || '');
  let composed = wantsMore
    ? await continueAnswer(ctx, { session, lang })
    : await composeTurn(ctx, { lang, transcript: transcript || '', session, previous });

  // A short follow-up that lands on the same entry ("aur kitna" after a PM-KISAN
  // question) is better answered by carrying on where the call stopped than by
  // repeating the first two sentences.
  const sameEntryFollowUp = !wantsMore
    && Boolean(composed.matchedKey)
    && composed.matchedKey === session.lastMatchedKey
    && isFollowUp(transcript || '')
    && Boolean(session.lastFullAnswer);
  if (sameEntryFollowUp) {
    const cont = await continueAnswer(ctx, { session, lang });
    if ((cont.spokenSentences || 0) > (session.spokenSentences || 0)) {
      composed = {
        ...composed,
        answer: cont.answer,
        spokenFull: cont.spokenFull,
        more: cont.more,
        spokenSentences: cont.spokenSentences,
        continued: true,
      };
    }
  }

  // Amounts and dates are read back inline: a call is not a form, so we do not
  // block, but we say the number out loud and ask for a check.
  let answer = composed.answer;
  if (heard.requiresConfirmation && (heard.count || heard.dates.length)) {
    const prompt = heard.confirmationPrompt[composed.answerLanguage] || heard.confirmationPrompt.en;
    if (prompt) answer = `${answer} ${prompt}`;
  }

  // Localise for a caller whose language has no content pack. Answers that are
  // already written in the caller's language must not be labelled as English.
  const alreadyLocalised = ['conversation', 'emergency', 'mental-health-crisis', 'dose-refusal', 'medical-uncertain'].includes(composed.kind);
  let languageNote;
  if (!isContentLang(composed.answerLanguage) && !alreadyLocalised) {
    const translate = translator(ctx);
    const translated = await translate.fromEnglish(composed.answer, composed.answerLanguage);
    if (translated) {
      answer = translated;
    } else {
      languageNote = text(composed.answerLanguage, 'languageNote');
      answer = `${languageNote} ${answer}`;
    }
  }

  let audioBase64 = null;
  let ttsProvider = 'unavailable';
  try {
    const out = await speech.synthesize({ text: answer, language: composed.answerLanguage });
    if (out && out.audio) {
      audioBase64 = out.audio.toString('base64');
      ttsProvider = out.provider;
    }
  } catch (err) {
    console.warn('[call] synthesis failed:', err.message);
  }

  const turn = {
    transcript,
    answer,
    kind: composed.kind,
    language: composed.answerLanguage,
    createdAt: new Date().toISOString(),
  };
  const patch = {
    turns: [...(session.turns || []), turn],
    // Remembered so "tell me more" can continue where the call stopped.
    lastFullAnswer: composed.spokenFull || answer,
    spokenSentences: composed.spokenSentences || 0,
    lastQuestion: transcript,
    lastMatchedKey: composed.matchedKey || session.lastMatchedKey,
  };
  if (composed.endCall) {
    patch.status = 'ended';
    patch.endedAt = new Date().toISOString();
  }
  await store.sessions.update(sessionId, patch);

  return {
    sessionId,
    status: patch.status || session.status,
    language: composed.answerLanguage,
    languageName: nameOf(composed.answerLanguage),
    transcript,
    answer,
    answerFull: composed.spokenFull || answer,
    kind: composed.kind,
    intent: composed.intent,
    urgency: composed.urgency || 'normal',
    grounded: composed.grounded,
    redirect: composed.redirect || null,
    triage: composed.triage,
    moreAvailable: Boolean(composed.more),
    trustedSources: composed.trustedSources || [],
    fact: composed.fact,
    recheck: composed.recheck,
    freshness: composed.freshness,
    suggestions: composed.suggestions,
    category: composed.category,
    matchedKey: composed.matchedKey,
    contextualQuestion: composed.contextualQuestion,
    continued: Boolean(composed.continued),
    languagesDetected: composed.languagesDetected,
    heardNumbers: heard.numbers.length ? heard.numbers : undefined,
    heardDates: heard.dates.length ? heard.dates : undefined,
    readBackPrompt: heard.requiresConfirmation ? heard.confirmationPrompt : undefined,
    answerSpeech: speechScript(answer, composed.answerLanguage),
    languageNote,
    notice: composed.notice,
    audio: audioBase64,
    audioMimeType: audioBase64 ? 'audio/mpeg' : null,
    provider: { speechToText: sttLanguage || 'client-transcript', textToSpeech: ttsProvider },
    endCall: Boolean(composed.endCall),
  };
}

/** DELETE /api/calls/:id */
async function endCall(ctx, sessionId) {
  const { store } = ctx;
  const session = await store.sessions.get(sessionId);
  if (!session) return { error: 'not-found' };
  const endedAt = new Date().toISOString();
  const durationSeconds = session.startedAt
    ? Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(session.startedAt)) / 1000))
    : 0;
  await store.sessions.update(sessionId, { status: 'ended', endedAt });
  return {
    id: sessionId,
    status: 'ended',
    durationSeconds,
    turns: (session.turns || []).length,
    farewell: text(session.uiLanguage || 'en', 'callEnded'),
  };
}

/** GET /api/calls/:id — read a call back (useful for a demo or a complaint log). */
async function getCall(ctx, sessionId) {
  const { store } = ctx;
  const session = await store.sessions.get(sessionId);
  if (!session || session.kind !== 'call') return { error: 'not-found' };
  return {
    id: session.id,
    status: session.status,
    language: session.language,
    startedAt: session.startedAt,
    endedAt: session.endedAt || null,
    turns: session.turns || [],
  };
}

module.exports = {
  startCall, callTurn, endCall, getCall, startLanguage, turnLanguage,
  spokenSlice, splitSentences, isFollowUp, conceptOverlap,
};
