const AppError = require('../utils/AppError');

// validate(schema) where schema = z.object({ body?, query?, params? }); result on req.validated.
const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return next(new AppError(msg, 400, 'validation_error'));
  }
  req.validated = parsed.data;
  next();
};
module.exports = { validate };
