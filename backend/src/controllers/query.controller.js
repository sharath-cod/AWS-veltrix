const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');
const { answerFromKnowledge, LANGS } = require('../services/answer');
const { readBack, parseYesNo, dominantLanguage } = require('../services/numbers');
const confirmations = require('../services/confirmations');

/**
 * POST /api/query  { question, language, category, requireConfirmation? }
 *
 * Retrieval-augmented answer over the knowledge base, optionally rewritten by
 * Amazon Bedrock. Returns trusted sources, a grounded flag, the date the fact
 * was last checked and where to verify it.
 *
 * language: "auto" answers in the language the question was asked in, which is
 * what a user who mixes languages expects.
 *
 * requireConfirmation: true turns on the read-back gate. When the question
 * contains an amount, an ID or an ambiguous date, the answer is held and a
 * confirmation token is returned instead — the answer is only released once the
 * user confirms what the server understood.
 */
function validateQuestion(raw) {
  const question = String(raw || '').trim();
  if (question.length < 2) {
    throw new AppError('question must be at least 2 characters', 400, 'INVALID_QUESTION');
  }
  if (question.length > 600) {
    throw new AppError('question must be shorter than 600 characters', 400, 'QUESTION_TOO_LONG');
  }
  return question;
}

async function buildAnswer(req, { question, language, category, packVersion, packDownloadedAt }) {
  return answerFromKnowledge(req.app.locals, {
    question,
    language,
    category,
    packVersion,
    packDownloadedAt,
  });
}

exports.ask = async (req, res) => {
  const body = req.body || {};
  const { language = 'en', category = 'general', packVersion, packDownloadedAt } = body;
  const question = validateQuestion(body.question);
  const deviceId = req.get('x-device-id') || null;

  // A token from an earlier read-back: release the held answer.
  if (body.confirmationToken) {
    const { payload, error } = confirmations.take(body.confirmationToken, deviceId);
    if (error) {
      const messages = {
        unknown: 'This confirmation is not recognised. Please ask the question again.',
        expired: 'The confirmation expired. Please ask the question again.',
        used: 'This confirmation was already used. Please ask the question again.',
        'device-mismatch': 'This confirmation belongs to another device.',
      };
      throw new AppError(messages[error] || 'Invalid confirmation', 409, `CONFIRMATION_${error.toUpperCase().replace('-', '_')}`);
    }
    const result = await buildAnswer(req, payload);
    return ok(res, {
      ...result,
      confirmed: true,
      confirmedNumbers: payload.items || [],
      confirmedDates: payload.dates || [],
    });
  }

  // Read-back gate: hold the answer until the user confirms the numbers.
  if (body.requireConfirmation) {
    const heard = readBack(question, LANGS.includes(language) ? language : dominantLanguage(question));
    if (heard.requiresConfirmation) {
      const issued = confirmations.issue({
        deviceId,
        question,
        language,
        category,
        packVersion,
        packDownloadedAt,
        items: heard.numbers,
        dates: heard.dates,
        speechScript: heard.speechScript,
      });
      return ok(res, {
        requiresConfirmation: true,
        language: heard.language,
        question,
        confirmation: {
          ...issued,
          numbers: heard.numbers,
          dates: heard.dates,
          unparsedMoney: heard.unparsedMoney,
          prompt: heard.confirmationPrompt,
          speechScript: heard.speechScript,
          // What the user should do next, in their own words.
          hint: {
            en: 'Check the amount or date above. Answer yes to continue, or correct the question.',
            hi: 'ऊपर दी गई राशि या तारीख देखें। आगे बढ़ने के लिए हाँ कहें, या प्रश्न सुधारें।',
            kn: 'ಮೇಲಿನ ಮೊತ್ತ ಅಥವಾ ದಿನಾಂಕ ನೋಡಿ. ಮುಂದುವರಿಯಲು ಹೌದು ಎನ್ನಿ, ಅಥವಾ ಪ್ರಶ್ನೆ ಸರಿಪಡಿಸಿ.',
          },
        },
      });
    }
  }

  const result = await buildAnswer(req, { question, language, category, packVersion, packDownloadedAt });
  ok(res, result);
};

/**
 * POST /api/query/confirm  { token, confirmed?, utterance? }
 *
 * Releases a held answer. `utterance` lets the user answer by voice ("haan",
 * "sari", "illa", "no"), which is how most of these users will respond.
 */
exports.confirm = async (req, res) => {
  const body = req.body || {};
  const deviceId = req.get('x-device-id') || null;
  if (!body.token) throw new AppError('token is required', 400, 'TOKEN_REQUIRED');

  let confirmed = typeof body.confirmed === 'boolean' ? body.confirmed : null;
  let heard = null;
  if (body.utterance) {
    heard = parseYesNo(body.utterance);
    if (heard.confirmed !== null) confirmed = heard.confirmed;
  }

  if (confirmed === null) {
    return ok(res, {
      confirmed: null,
      understood: false,
      retry: true,
      heard,
      prompt: {
        en: 'Please say yes or no.',
        hi: 'कृपया हाँ या ना कहें।',
        kn: 'ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎನ್ನಿ.',
      },
    });
  }

  if (confirmed === false) {
    confirmations.drop(body.token);
    return ok(res, {
      confirmed: false,
      cancelled: true,
      heard,
      message: {
        en: 'Cancelled. Please say the question again, slowly, with the amount.',
        hi: 'रद्द कर दिया। कृपया राशि के साथ प्रश्न फिर से धीरे बोलें।',
        kn: 'ರದ್ದು ಮಾಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಮೊತ್ತದೊಂದಿಗೆ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ನಿಧಾನವಾಗಿ ಹೇಳಿ.',
      },
    });
  }

  const { payload, error } = confirmations.take(body.token, deviceId);
  if (error) {
    const messages = {
      unknown: 'This confirmation is not recognised. Please ask the question again.',
      expired: 'The confirmation expired. Please ask the question again.',
      used: 'This confirmation was already used. Please ask the question again.',
      'device-mismatch': 'This confirmation belongs to another device.',
    };
    throw new AppError(messages[error] || 'Invalid confirmation', 409, `CONFIRMATION_${error.toUpperCase().replace('-', '_')}`);
  }

  const result = await buildAnswer(req, payload);
  ok(res, {
    ...result,
    confirmed: true,
    heard,
    confirmedNumbers: payload.items || [],
    confirmedDates: payload.dates || [],
  });
};
