/**
 * The call itself: the AI picks up, listens, and answers — in the caller's
 * language, with a safety net for medical questions.
 *
 * A turn runs through this order, and the first rule that matches wins:
 *
 *   1. small talk / call control   "hello", "thank you", "bye"     (conversation.js)
 *   2. red-flag medical            chest pain, bleeding, fits …    -> call 108 (triage.js)
 *   3. dose question               "how many tablets"              -> never answered, 104
 *   4. medical, not covered        medical intent + weak match      -> 104 / 108
 *   5. knowledge base answer       everything else, with sources
 *   6. nothing found               says so, offers what it can do
 *
 * Language: the call answers in the language the caller used. English, Hindi and
 * Kannada have the full knowledge base; the other call languages get the
 * call-flow and, when a Sarvam key is configured, a translated answer.
 */
const { answerFromKnowledge } = require('./answer');
const { createTranslator } = require('./translate');
const { assess, cautionFor } = require('./triage');
const conversation = require('./conversation');
const { readBack, speechScript, detectLanguages, dominantLanguage } = require('./numbers');
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
    endsAt: null,
  };
}

/** Build the answer for one turn. */
async function composeTurn(ctx, { lang, transcript, sttLanguage }) {
  const { store } = ctx;
  const translate = translator(ctx);

  // Non-content languages are reasoned about in English.
  let working = transcript;
  let translatedIn = false;
  if (!isContentLang(lang)) {
    const english = await translate.toEnglish(transcript, lang);
    if (english) {
      working = english;
      translatedIn = true;
    }
  }
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
      notice: undefined,
    };
  }

  // 2-5. knowledge base first, so triage knows how confident the answer is
  const kb = await answerFromKnowledge(ctx, {
    question: working,
    language: answerLang,
    category: 'general',
    packVersion: undefined,
    packDownloadedAt: undefined,
  });

  // An approximate match is not an answer. In a call, saying "I am not sure" is
  // far better than confidently reading out the closest unrelated entry.
  const confident = kb.grounded === true && kb.matchQuality !== 'approximate';

  const triage = assess(working, {
    language: lang,
    grounded: confident,
    confidence: kb.confidence,
    matchQuality: kb.matchQuality,
    category: kb.category,
    conceptOverlap: kb.conceptOverlap !== false,
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
  };

  // Red flag: safety message only, whatever the knowledge base found.
  if (triage.kind === 'emergency' || triage.kind === 'mental-health-crisis') {
    const parts = [triage.spoken];
    if (triage.firstAid) parts.push(triage.firstAid);
    return {
      ...base,
      kind: triage.kind,
      urgency: 'urgent',
      grounded: false,
      answer: parts.join(' '),
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
      redirect: triage.redirect,
      trustThisAnswer: false,
      notice: triage.kind === 'dose-refusal'
        ? 'Refused to advise a dose. A doctor or 104 must decide.'
        : 'Medical question without a verified answer. Directed to 104 / 108.',
    };
  }

  // A confident, non-emergency answer.
  if (confident) {
    const caution = triage.medical ? cautionFor(lang) : '';
    const answer = caution ? `${kb.answer} ${caution}` : kb.answer;
    return {
      ...base,
      kind: triage.medical ? 'medical-answer' : 'knowledge',
      urgency: 'normal',
      grounded: true,
      answer,
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
  return {
    ...base,
    kind: 'not-found',
    urgency: 'normal',
    grounded: false,
    answer: suggestions.length ? `${noInfo} ${suggestions.join(' ')}` : noInfo,
    redirect: null,
    trustThisAnswer: false,
    notice: 'No verified answer. Offered the topics it can answer.',
  };
}

/** POST /api/calls/:id/turns */
async function callTurn(ctx, { sessionId, audio, contentType, transcript, sttLanguage, confirm }) {
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
  const composed = await composeTurn(ctx, { lang, transcript: transcript || '', sttLanguage });

  // Amounts and dates are read back inline: a call is not a form, so we do not
  // block, but we say the number out loud and ask for a check.
  let answer = composed.answer;
  if (heard.requiresConfirmation && (heard.count || heard.dates.length)) {
    const prompt = heard.confirmationPrompt[composed.answerLanguage] || heard.confirmationPrompt.en;
    if (prompt) answer = `${answer} ${prompt}`;
  }

  // Localise for a caller whose language has no content pack. Answers that are
  // already written in the caller's language (small talk, the 108 redirect, the
  // "I am not sure" message) must not be labelled as English.
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
  const turns = [...(session.turns || []), turn];
  const patch = { turns };
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
    kind: composed.kind,
    intent: composed.intent,
    urgency: composed.urgency || 'normal',
    grounded: composed.grounded,
    redirect: composed.redirect || null,
    triage: composed.triage,
    trustedSources: composed.trustedSources || [],
    fact: composed.fact,
    recheck: composed.recheck,
    freshness: composed.freshness,
    suggestions: composed.suggestions,
    category: composed.category,
    matchedKey: composed.matchedKey,
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

module.exports = { startCall, callTurn, endCall, getCall, startLanguage, turnLanguage };
