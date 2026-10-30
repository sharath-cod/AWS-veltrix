require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

function loadConfig() {
  const port = Number(process.env.PORT) || 5000;
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const errors = [];
  const warnings = [];

  if (!mongoUri) {
    (isProduction ? errors : warnings).push('MONGODB_URI is not set');
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  if (isProduction && corsOrigins.length === 0) {
    warnings.push('CORS_ORIGIN is empty: browser origins will be rejected (native apps are unaffected)');
  }

  return { isProduction, port, mongoUri, corsOrigins, errors, warnings };
}

module.exports = { loadConfig, isProduction };
