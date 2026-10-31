const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');

/**
 * POST /api/transcribe?language=hi   (raw audio body, audio/mp4)
 *
 * Speech to text on its own, with no session and no answer. The app uses this
 * for a recording made while it was offline: the clip is kept on the phone and
 * uploaded here the moment the network is back, so a spoken Hindi or Kannada
 * question is not lost just because the phone had no signal at the time.
 */
router.post('/', asyncHandler(async (req, res) => {
  const { speech, config } = req.app.locals;
  const audio = Buffer.isBuffer(req.body) ? req.body : null;
  if (!audio || audio.length === 0) {
    throw new AppError('Send the recorded audio as the raw request body (audio/mp4)', 400, 'AUDIO_REQUIRED');
  }
  if (audio.length > config.maxAudioBytes) {
    throw new AppError('Recording is too large. Keep it under 30 seconds.', 413, 'AUDIO_TOO_LARGE');
  }
  const language = (req.query.language || 'auto').trim();
  const contentType = (req.get('content-type') || 'audio/mp4').split(';')[0].trim();

  if (!speech.canTranscribe()) {
    return ok(res, {
      transcript: '',
      provider: 'unavailable',
      speechStatus: speech.status,
      notice: 'Speech to text is not configured on this server. Set SARVAM_API_KEY, STT_HTTP_URL or AWS speech.',
    });
  }

  try {
    const result = await speech.transcribe({ audio, contentType, language });
    return ok(res, {
      transcript: result.text || '',
      language: result.language || (language === 'auto' ? null : language),
      provider: result.provider,
    });
  } catch (err) {
    return ok(res, {
      transcript: '',
      provider: 'unavailable',
      notice: `Speech to text failed: ${err.message}`,
    });
  }
}));

module.exports = router;
