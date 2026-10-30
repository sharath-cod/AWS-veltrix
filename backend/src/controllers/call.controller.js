const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const call = require('../services/call');

/**
 * POST /api/calls  { language, uiLanguage }
 * The AI picks up: returns the session id, the greeting in the caller's
 * language, and how long the phone should "ring" before speaking it.
 */
exports.start = async (req, res) => {
  const { language = 'auto', uiLanguage } = req.body || {};
  const data = await call.startCall(req.app.locals, {
    deviceId: req.deviceId,
    language,
    uiLanguage,
  });
  ok(res, data, {}, 201);
};

/**
 * POST /api/calls/:id/turns?language=&transcript=
 * Body: raw audio (audio/mp4) or ?transcript= when the phone already has text.
 * Answers in the caller's language, and redirects medical questions it is not
 * sure about to 108 / 104.
 */
exports.turn = async (req, res) => {
  const { store, speech, config } = req.app.locals;
  const { id } = req.params;

  const session = await store.sessions.get(id);
  if (!session) throw new AppError('Call not found', 404, 'NOT_FOUND');
  if (session.status === 'ended') throw new AppError('This call has ended', 409, 'CALL_ENDED');

  const audio = Buffer.isBuffer(req.body) ? req.body : null;
  let transcript = String(
    (req.query && req.query.transcript) || (req.body && req.body.transcript) || '',
  ).trim().slice(0, 600);
  let sttLanguage = null;
  let sttProvider = transcript ? 'client-transcript' : speech.provider;

  if (!transcript) {
    if (!audio || audio.length === 0) {
      throw new AppError('Send the recorded audio as the raw request body (audio/mp4), or a ?transcript= of what was said', 400, 'AUDIO_REQUIRED');
    }
    if (audio.length > config.maxAudioBytes) {
      throw new AppError('Recording is too large. Keep each turn under 30 seconds.', 413, 'AUDIO_TOO_LARGE');
    }
    const contentType = (req.get('content-type') || 'audio/mp4').split(';')[0].trim();
    try {
      // "unknown" lets the provider auto-detect, which is what a caller who
      // switches language mid-call needs.
      const hint = session.language && session.language !== 'auto' ? session.language : 'auto';
      const result = await speech.transcribe({ audio, contentType, language: hint });
      transcript = result.text || '';
      sttLanguage = result.language || null;
      sttProvider = result.provider;
    } catch (err) {
      console.warn('[call] transcription failed:', err.message);
      const lang = session.uiLanguage || 'en';
      return ok(res, {
        sessionId: id,
        status: session.status,
        transcript: '',
        answer: require('../data/languages').text(lang, 'askAgain'),
        kind: 'stt-unavailable',
        grounded: false,
        speechStatus: speech.status,
        sendTranscriptHint: true,
        notice: `Speech to text unavailable: ${err.message}`,
      });
    }
    if (!transcript) {
      const lang = session.uiLanguage || 'en';
      return ok(res, {
        sessionId: id,
        status: session.status,
        transcript: '',
        answer: require('../data/languages').text(lang, 'askAgain'),
        kind: 'no-speech',
        grounded: false,
        sendTranscriptHint: true,
      });
    }
  }

  const result = await call.callTurn(req.app.locals, {
    sessionId: id,
    audio,
    transcript,
    sttLanguage,
    confirm: req.query.confirm === 'true',
  });

  if (result.error === 'not-found') throw new AppError('Call not found', 404, 'NOT_FOUND');
  if (result.error === 'ended') throw new AppError('This call has ended', 409, 'CALL_ENDED');

  ok(res, { ...result, provider: { speechToText: sttProvider, textToSpeech: result.provider.textToSpeech } });
};

/** GET /api/calls/:id — the transcript so far. */
exports.get = async (req, res) => {
  const data = await call.getCall(req.app.locals, req.params.id);
  if (data.error === 'not-found') throw new AppError('Call not found', 404, 'NOT_FOUND');
  ok(res, data);
};

/** DELETE /api/calls/:id */
exports.end = async (req, res) => {
  const data = await call.endCall(req.app.locals, req.params.id);
  if (data.error === 'not-found') throw new AppError('Call not found', 404, 'NOT_FOUND');
  ok(res, data);
};
