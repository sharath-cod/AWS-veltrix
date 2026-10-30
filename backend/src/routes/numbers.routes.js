const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { readBack, parseYesNo, speechScript, dominantLanguage } = require('../services/numbers');

/**
 * POST /api/numbers/readback { text, language }
 * Parses numbers and dates from mixed-language text and returns what to read
 * back to the user for confirmation (digit by digit, with confusable-word and
 * ambiguous-date warnings), plus a speech script.
 */
router.post('/readback', asyncHandler(async (req, res) => {
  const { text, language } = req.body || {};
  if (!text || !String(text).trim()) throw new AppError('text is required', 400, 'INVALID_TEXT');
  const value = String(text).slice(0, 600);
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : dominantLanguage(value);
  ok(res, readBack(value, lang));
}));

/**
 * POST /api/numbers/confirm { utterance }
 * Understands a spoken yes / no in English, Hindi or Kannada (romanised or in
 * script), so a user can confirm an amount by voice.
 */
router.post('/confirm', asyncHandler(async (req, res) => {
  const { utterance } = req.body || {};
  if (!utterance || !String(utterance).trim()) throw new AppError('utterance is required', 400, 'INVALID_UTTERANCE');
  ok(res, parseYesNo(String(utterance).slice(0, 120)));
}));

/**
 * POST /api/numbers/speech { text, language }
 * The answer split into prose and numbers, so "read aloud" never reads an
 * amount as one run-on figure.
 */
router.post('/speech', asyncHandler(async (req, res) => {
  const { text, language } = req.body || {};
  if (!text || !String(text).trim()) throw new AppError('text is required', 400, 'INVALID_TEXT');
  const value = String(text).slice(0, 2000);
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : dominantLanguage(value);
  ok(res, { language: lang, segments: speechScript(value, lang) });
}));

module.exports = router;
