const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { answerFromKnowledge, LANGS } = require('../services/answer');
const { readBack, parseYesNo, dominantLanguage } = require('../services/numbers');
const confirmations = require('../services/confirmations');

const VOICE_NOT_READY = {
  en: 'Voice transcription is not enabled on this server, so your recording was not converted to text. You can still ask by typing on the Ask screen, or send the words your phone recognised as "transcript" with the recording. Ask the operator to configure SARVAM_API_KEY, STT_HTTP_URL or AWS speech.',
  hi: 'इस सर्वर पर आवाज़ से पाठ बनाना चालू नहीं है, इसलिए आपकी रिकॉर्डिंग का पाठ नहीं बना। आप Ask स्क्रीन पर टाइप करके पूछ सकते हैं, या रिकॉर्डिंग के साथ अपने फोन द्वारा पहचाने गए शब्द "transcript" के रूप में भेज सकते हैं। संचालक से SARVAM_API_KEY, STT_HTTP_URL या AWS speech सेट करने को कहें।',
  kn: 'ಈ ಸರ್ವರ್‌ನಲ್ಲಿ ಧ್ವನಿಯಿಂದ ಪಠ್ಯ ರೂಪಾಂತರ ಸಕ್ರಿಯವಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ರೆಕಾರ್ಡಿಂಗ್ ಪಠ್ಯವಾಗಿ ಬದಲಾಗಿಲ್ಲ. ನೀವು Ask ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಕೇಳಬಹುದು, ಅಥವಾ ರೆಕಾರ್ಡಿಂಗ್ ಜೊತೆಗೆ ನಿಮ್ಮ ಫೋನ್ ಗುರುತಿಸಿದ ಪದಗಳನ್ನು "transcript" ಆಗಿ ಕಳುಹಿಸಬಹುದು. ನಿರ್ವಾಹಕರಿಗೆ SARVAM_API_KEY, STT_HTTP_URL ಅಥವಾ AWS speech ಸೆಟ್ ಮಾಡಲು ಹೇಳಿ.',
};

const CANCELLED = {
  en: 'Cancelled. Please say the question again, slowly, with the amount.',
  hi: 'रद्द कर दिया। कृपया राशि के साथ प्रश्न फिर से धीरे बोलें।',
  kn: 'ರದ್ದು ಮಾಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮೊತ್ತದೊಂದಿಗೆ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ನಿಧಾನವಾಗಿ ಹೇಳಿ.',
};

const ASK_AGAIN = {
  en: 'Please say yes or no.',
  hi: 'कृपया हाँ या ना कहें।',
  kn: 'ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.',
};

function pickLanguage(req, session) {
  const fromQuery = (req.query && req.query.language) || (req.body && req.body.language);
  if (fromQuery === 'auto') return 'auto';
  if (LANGS.includes(fromQuery)) return fromQuery;
  if (session && LANGS.includes(session.language)) return session.language;
  return 'en';
}

function truthy(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

/** Synthesise a short spoken prompt when Polly is available. */
async function speakPrompt(speech, text, language) {
  try {
    const out = await speech.synthesize({ text, language });
    if (out && out.audio) {
      return { audio: out.audio.toString('base64'), audioMimeType: 'audio/mpeg', provider: out.provider };
    }
  } catch (err) {
    console.warn('[voice] prompt synthesis failed:', err.message);
  }
  return { audio: null, audioMimeType: null, provider: 'unavailable' };
}

/** POST /api/voice-sessions  { language } */
exports.start = async (req, res) => {
  const { speech } = req.app.locals;
  const requested = (req.body || {}).language;
  const language = requested === 'auto' ? 'auto' : (LANGS.includes(requested) ? requested : 'en');
  const session = await req.app.locals.store.sessions.create(req.deviceId, { language, status: 'active' });
  ok(
    res,
    {
      id: session.id,
      status: session.status,
      language: session.language,
      createdAt: session.createdAt,
      speech: speech.status,
      // The app can tell the user up front whether speech will work.
      canTranscribe: speech.canTranscribe(),
    },
    {},
    201,
  );
};

/**
 * POST /api/voice-sessions/:id/turns?language=kn&confirm=true
 * Body: raw audio (audio/mp4 from the Android MediaRecorder).
 * Optional: ?transcript=<words the phone already recognised> or JSON body
 * { transcript } — used when no speech-to-text provider is configured, so the
 * conversation still gets an answer instead of dying.
 *
 * With confirm=true a turn that contains an amount, an ID or an ambiguous date
 * does NOT answer: it reads the number back, returns a confirmation token, and
 * speaks the prompt. The next turn ("haan" / "illa") with that token releases
 * the answer — the voice version of hurdle 3.
 */
exports.turn = async (req, res) => {
  const { store, speech } = req.app.locals;
  const { id } = req.params;

  const session = await store.sessions.get(id);
  if (!session) throw new AppError('Voice session not found', 404, 'NOT_FOUND');
  if (session.status !== 'active') throw new AppError('This voice session has ended', 409, 'SESSION_ENDED');

  const audio = Buffer.isBuffer(req.body) ? req.body : null;
  const requestedLanguage = pickLanguage(req, session);

  const clientTranscript = String(
    (req.query && req.query.transcript) || (req.body && req.body.transcript) || '',
  ).trim().slice(0, 600);
  const confirmationToken = (req.query && req.query.confirmationToken) || (req.body && req.body.confirmationToken) || null;

  if (!clientTranscript && (!audio || audio.length === 0) && !confirmationToken) {
    throw new AppError(
      'Send the recorded audio as the raw request body (audio/mp4), or a ?transcript= of what was said',
      400,
      'AUDIO_REQUIRED',
    );
  }
  if (audio && audio.length > req.app.locals.config.maxAudioBytes) {
    throw new AppError('Recording is too large. Keep each turn under 30 seconds.', 413, 'AUDIO_TOO_LARGE');
  }

  const contentType = (req.get('content-type') || 'audio/mp4').split(';')[0].trim();

  // ---- 1. did the user just answer our read-back question? -----------------
  if (confirmationToken) {
    const heard = parseYesNo(clientTranscript);
    if (heard.confirmed === false) {
      confirmations.drop(confirmationToken);
      const language = LANGS.includes(requestedLanguage) ? requestedLanguage : (session.language === 'auto' ? 'en' : session.language);
      const spoken = await speakPrompt(speech, CANCELLED[language] || CANCELLED.en, language);
      return ok(res, {
        sessionId: id,
        language,
        transcript: clientTranscript,
        answer: CANCELLED[language] || CANCELLED.en,
        cancelled: true,
        heard,
        ...spoken,
        provider: { speechToText: 'client-transcript', textToSpeech: spoken.provider },
      });
    }
    if (heard.confirmed === null) {
      const language = LANGS.includes(requestedLanguage) ? requestedLanguage : 'en';
      const spoken = await speakPrompt(speech, ASK_AGAIN[language] || ASK_AGAIN.en, language);
      return ok(res, {
        sessionId: id,
        language,
        transcript: clientTranscript,
        answer: ASK_AGAIN[language] || ASK_AGAIN.en,
        retryConfirmation: true,
        heard,
        confirmationToken,
        ...spoken,
        provider: { speechToText: 'client-transcript', textToSpeech: spoken.provider },
      });
    }
    const { payload, error } = confirmations.take(confirmationToken, req.deviceId);
    if (error) {
      throw new AppError(
        error === 'expired' ? 'The confirmation expired. Please ask again.' : 'This confirmation is not valid any more.',
        409,
        `CONFIRMATION_${error.toUpperCase().replace('-', '_')}`,
      );
    }
    return answerTurn(req, res, {
      session,
      sessionId: id,
      language: payload.language && LANGS.includes(payload.language) ? payload.language : (session.language === 'auto' ? 'en' : session.language),
      transcript: payload.question,
      heard,
      confirmed: true,
      confirmedNumbers: payload.items || [],
      confirmedDates: payload.dates || [],
      sttProvider: 'client-transcript',
    });
  }

  // ---- 2. transcribe -------------------------------------------------------
  let transcript = clientTranscript;
  let sttProvider = clientTranscript ? 'client-transcript' : speech.provider;

  if (!transcript) {
    try {
      const result = await speech.transcribe({ audio, contentType, language: requestedLanguage === 'auto' ? 'en' : requestedLanguage });
      transcript = result.text || '';
      sttProvider = result.provider;
    } catch (err) {
      console.warn('[voice] transcription failed:', err.message);
      const language = LANGS.includes(requestedLanguage) ? requestedLanguage : 'en';
      const fallbackAnswer = VOICE_NOT_READY[language] || VOICE_NOT_READY.en;
      const turn = { transcript: '', answer: fallbackAnswer, provider: 'unavailable', createdAt: new Date().toISOString() };
      await store.sessions.update(id, { turns: [...(session.turns || []), turn] });
      return ok(res, {
        sessionId: id,
        language,
        transcript: '',
        answer: fallbackAnswer,
        audio: null,
        grounded: false,
        provider: { speechToText: 'unavailable', textToSpeech: speech.status.textToSpeech },
        speechStatus: speech.status,
        sendTranscriptHint: true,
        notice: `Speech to text unavailable: ${err.message}`,
      });
    }
  }

  if (!transcript) {
    const language = LANGS.includes(requestedLanguage) ? requestedLanguage : 'en';
    const fallbackAnswer = VOICE_NOT_READY[language] || VOICE_NOT_READY.en;
    const turn = { transcript: '', answer: fallbackAnswer, provider: sttProvider, createdAt: new Date().toISOString() };
    await store.sessions.update(id, { turns: [...(session.turns || []), turn] });
    return ok(res, {
      sessionId: id,
      language,
      transcript: '',
      answer: fallbackAnswer,
      audio: null,
      grounded: false,
      provider: { speechToText: sttProvider, textToSpeech: speech.status.textToSpeech },
      speechStatus: speech.status,
      sendTranscriptHint: true,
      notice: 'No speech detected in the recording.',
    });
  }

  const language = requestedLanguage === 'auto' ? dominantLanguage(transcript) : requestedLanguage;

  // ---- 3. read-back gate ---------------------------------------------------
  const wantsConfirmation = truthy(req.query.confirm) || truthy((req.body || {}).requireConfirmation);
  if (wantsConfirmation) {
    const heard = readBack(transcript, language);
    if (heard.requiresConfirmation) {
      const issued = confirmations.issue({
        deviceId: req.deviceId,
        question: transcript,
        language,
        category: 'general',
        items: heard.numbers,
        dates: heard.dates,
        speechScript: heard.speechScript,
      });
      const promptText = heard.confirmationPrompt[language] || heard.confirmationPrompt.en;
      const spoken = await speakPrompt(speech, promptText, language);
      const turn = { transcript, answer: promptText, provider: `${sttProvider}/readback`, createdAt: new Date().toISOString() };
      await store.sessions.update(id, { turns: [...(session.turns || []), turn] });
      return ok(res, {
        sessionId: id,
        language,
        transcript,
        requiresConfirmation: true,
        confirmationToken: issued.token,
        confirmation: {
          ...issued,
          numbers: heard.numbers,
          dates: heard.dates,
          unparsedMoney: heard.unparsedMoney,
          prompt: heard.confirmationPrompt,
          speechScript: heard.speechScript,
        },
        answer: promptText,
        grounded: false,
        ...spoken,
        provider: { speechToText: sttProvider, textToSpeech: spoken.provider },
        notice: 'Read-back required before answering: confirm the amount or date.',
      });
    }
  }

  return answerTurn(req, res, { session, sessionId: id, language, transcript, sttProvider });
};

/** Shared answer step for both the plain and the confirmed path. */
async function answerTurn(req, res, { sessionId, language, transcript, heard, confirmed, confirmedNumbers, confirmedDates, sttProvider }) {
  const { store, speech } = req.app.locals;

  const answer = await answerFromKnowledge(req.app.locals, { question: transcript, language });

  let audioBase64 = null;
  let ttsProvider = 'unavailable';
  try {
    const speechOut = await speech.synthesize({ text: answer.answer, language });
    if (speechOut.audio) {
      audioBase64 = speechOut.audio.toString('base64');
      ttsProvider = speechOut.provider;
    }
  } catch (err) {
    console.warn('[voice] synthesis failed:', err.message);
  }

  const turn = {
    transcript,
    answer: answer.answer,
    provider: `${sttProvider}/${ttsProvider}`,
    createdAt: new Date().toISOString(),
  };
  await store.sessions.update(sessionId, { turns: [...(await sessionTurns(store, sessionId)), turn] });

  ok(res, {
    sessionId,
    language,
    transcript,
    answer: answer.answer,
    grounded: answer.grounded,
    category: answer.category,
    matchedKey: answer.matchedKey,
    trustedSources: answer.trustedSources,
    confidence: answer.confidence,
    // Read-back, fact dates and freshness travel with the voice answer too,
    // because a misheard amount on a call is exactly how money gets lost.
    confirmed: confirmed === undefined ? undefined : confirmed,
    heard,
    confirmedNumbers,
    confirmedDates,
    youSaid: answer.youSaid,
    answerNumbers: answer.answerNumbers,
    answerDates: answer.answerDates,
    answerSpeech: answer.answerSpeech,
    verifyBeforeActing: answer.verifyBeforeActing,
    staleNotice: answer.staleNotice,
    freshness: answer.freshness,
    fact: answer.fact,
    recheck: answer.recheck,
    suggestions: answer.suggestions,
    audio: audioBase64,
    audioMimeType: audioBase64 ? 'audio/mpeg' : null,
    provider: { speechToText: sttProvider, textToSpeech: ttsProvider },
    notice: audioBase64
      ? undefined
      : 'Spoken audio is unavailable on this server, so only the text answer is returned.',
  });
}

async function sessionTurns(store, sessionId) {
  const session = await store.sessions.get(sessionId);
  return (session && session.turns) || [];
}

/** DELETE /api/voice-sessions/:id */
exports.end = async (req, res) => {
  const { store } = req.app.locals;
  const session = await store.sessions.get(req.params.id);
  if (!session) throw new AppError('Voice session not found', 404, 'NOT_FOUND');
  await store.sessions.update(req.params.id, { status: 'ended', endedAt: new Date().toISOString() });
  ok(res, { id: req.params.id, status: 'ended', turns: (session.turns || []).length });
};
