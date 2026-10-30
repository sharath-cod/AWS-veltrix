const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { assess } = require('../services/scam');

/**
 * POST /api/scam-check  { text, language }
 * Rule based, explainable risk score for a pasted message. No data is stored.
 */
exports.check = async (req, res) => {
  const { text, language = 'en' } = req.body || {};
  if (!text || String(text).trim().length < 3) {
    throw new AppError('text must be at least 3 characters', 400, 'INVALID_TEXT');
  }
  if (String(text).length > 4000) {
    throw new AppError('text must be shorter than 4000 characters', 400, 'TEXT_TOO_LONG');
  }
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : 'en';
  ok(res, { ...assess(String(text), lang), language: lang });
};
