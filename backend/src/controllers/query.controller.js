const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { answerFromKnowledge } = require('../services/answer');

/**
 * POST /api/query  { question, language, category }
 * Retrieval-augmented answer over the knowledge base, optionally rewritten by
 * Amazon Bedrock. Returns trusted sources and a grounded flag.
 */
exports.ask = async (req, res) => {
  const { question, language = 'en', category = 'general' } = req.body || {};

  if (!question || String(question).trim().length < 2) {
    throw new AppError('question must be at least 2 characters', 400, 'INVALID_QUESTION');
  }
  if (String(question).length > 600) {
    throw new AppError('question must be shorter than 600 characters', 400, 'QUESTION_TOO_LONG');
  }

  const result = await answerFromKnowledge(req.app.locals, {
    question: String(question).trim(),
    language,
    category,
  });

  ok(res, result);
};
