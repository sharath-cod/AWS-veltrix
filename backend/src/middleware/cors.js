const cors = require('cors');

// Native Android (Retrofit) requests have no Origin header, so they always pass.
// Browser origins must be listed in CORS_ORIGIN (open in development if empty).
function buildCors({ corsOrigins, isProduction }) {
  return cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      if (!isProduction && corsOrigins.length === 0) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}

module.exports = buildCors;
