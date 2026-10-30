const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { answerFromKnowledge, LANGS } = require('../services/answer');

const VOICE_NOT_READY = {
  en: 'Voice transcription is not enabled on this server, so your recording was not converted to text. Please use the Ask screen, which uses your phone\'s own speech recognition, or ask the operator to configure the speech provider.',
  hi: 'इस सर्वर पर आवाज़ से पाठ बनाना चालू नहीं है, इसलिए आपकी रिकॉर्डिंग का पाठ नहीं बना। कृपया Ask स्क्रीन का उपयोग करें, जो आपके फोन की अपनी आवाज़ पहचान का उपयोग करती है।',
  kn: 'ಈ ಸರ್ವರ್‌ನಲ್ಲಿ ಧ್ವನಿಯಿಂದ ಪಠ್ಯ ರೂಪಾಂತರ ಸಕ್ರಿಯವಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ರೆಕಾರ್ಡಿಂಗ್ ಪಠ್ಯವಾಗಿ ಬದಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು Ask ಸ್ಕ್ರೀನ್ ಬಳಸಿ, ಅದು ನಿಮ್ಮ ಫೋನ್‌ನ ಸ್ವಂತ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬಳಸುತ್ತದೆ.',
};

/** POST /api/voice-sessions  { language } */
exports.start = async (req, res) => {
  const { speech } = req.app.locals;
  const language = LANGS.includes((req.body || {}).language) ? req.body.language : 'en';
  const session = await req.app.locals.store.sessions.create(req.deviceId, { language, status: 'active' });
  ok(
    res,
    {
      id: session.id,
      status: session.status,
      language: session.language,
      createdAt: session.createdAt,
      speech: speech.status,
    },
    {},
    201,
  );
};

/**
 * POST /api/voice-sessions/:id/turns
 * Body: raw audio (audio/mp4 from the Android MediaRecorder).
 * Returns the transcript, the answer, and base64 MP3 audio when Polly is enabled.
 */
exports.turn = async (req, res) => {
  const { store, speech } = req.app.locals;
  const { id } = req.params;

  const session = await store.sessions.get(id);
  if (!session) throw new AppError('Voice session not found', 404, 'NOT_FOUND');
  if (session.status !== 'active') throw new AppError('This voice session has ended', 409, 'SESSION_ENDED');

  const audio = Buffer.isBuffer(req.body) ? req.body : null;
  if (!audio || audio.length === 0) {
    throw new AppError('Send the recorded audio as the raw request body (audio/mp4)', 400, 'AUDIO_REQUIRED');
  }
  if (audio.length > req.app.locals.config.maxAudioBytes) {
    throw new AppError('Recording is too large. Keep each turn under 30 seconds.', 413, 'AUDIO_TOO_LARGE');
  }

  const contentType = (req.get('content-type') || 'audio/mp4').split(';')[0].trim();
  const language = session.language || 'en';

  let transcript = '';
  let sttProvider = speech.provider;
  try {
    const result = await speech.transcribe({ audio, contentType, language });
    transcript = result.text || '';
    sttProvider = result.provider;
  } catch (err) {
    console.warn('[voice] transcription failed:', err.message);
    const fallbackAnswer = VOICE_NOT_READY[language] || VOICE_NOT_READY.en;
    const turn = { transcript: '', answer: fallbackAnswer, provider: 'unavailable', createdAt: new Date().toISOString() };
    await store.sessions.update(id, { turns: [...(session.turns || []), turn] });
    return ok(res, {
      sessionId: id,
      transcript: '',
      answer: fallbackAnswer,
      audio: null,
      provider: { speechToText: 'unavailable', textToSpeech: speech.status.textToSpeech },
      notice: `Speech to text unavailable: ${err.message}`,
    });
  }

  if (!transcript) {
    const fallbackAnswer = VOICE_NOT_READY[language] || VOICE_NOT_READY.en;
    const turn = { transcript: '', answer: fallbackAnswer, provider: sttProvider, createdAt: new Date().toISOString() };
    await store.sessions.update(id, { turns: [...(session.turns || []), turn] });
    return ok(res, {
      sessionId: id,
      transcript: '',
      answer: fallbackAnswer,
      audio: null,
      provider: { speechToText: sttProvider, textToSpeech: speech.status.textToSpeech },
      notice: 'No speech detected in the recording.',
    });
  }

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
  await store.sessions.update(id, { turns: [...(session.turns || []), turn] });

  ok(res, {
    sessionId: id,
    transcript,
    answer: answer.answer,
    grounded: answer.grounded,
    trustedSources: answer.trustedSources,
    audio: audioBase64,
    audioMimeType: audioBase64 ? 'audio/mpeg' : null,
    provider: { speechToText: sttProvider, textToSpeech: ttsProvider },
    notice: audioBase64
      ? undefined
      : 'Spoken audio is unavailable on this server, so only the text answer is returned.',
  });
};

/** DELETE /api/voice-sessions/:id */
exports.end = async (req, res) => {
  const { store } = req.app.locals;
  const session = await store.sessions.get(req.params.id);
  if (!session) throw new AppError('Voice session not found', 404, 'NOT_FOUND');
  await store.sessions.update(req.params.id, { status: 'ended', endedAt: new Date().toISOString() });
  ok(res, { id: req.params.id, status: 'ended', turns: (session.turns || []).length });
};
