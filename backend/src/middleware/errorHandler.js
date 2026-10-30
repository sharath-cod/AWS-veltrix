const { isProduction } = require('../config/env');

const DB_NETWORK_ERRORS = [
  'MongooseServerSelectionError',
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongooseError',
];

function normalize(err) {
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body contains invalid JSON' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }
  if (err.name === 'ValidationError') {
    return { status: 400, code: 'VALIDATION_ERROR', message: err.message };
  }
  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_ID', message: `Invalid value for ${err.path}` };
  }
  if (err.code === 11000) {
    return { status: 409, code: 'DUPLICATE_KEY', message: 'Duplicate value for a unique field' };
  }
  if (DB_NETWORK_ERRORS.includes(err.name)) {
    return { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable' };
  }
  if (err.isOperational) {
    return { status: err.statusCode, code: err.code, message: err.message };
  }
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: isProduction ? 'Something went wrong' : err.message,
  };
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const { status, code, message } = normalize(err);
  if (status >= 500) console.error('[error]', err);

  const body = { success: false, error: { message, code } };
  if (!isProduction && status >= 500) body.error.stack = err.stack;
  res.status(status).json(body);
};
