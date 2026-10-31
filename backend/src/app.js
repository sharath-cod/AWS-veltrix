const express = require('express');
const buildCors = require('./middleware/cors');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

/**
 * @param {object} config      loaded configuration
 * @param {object} deps        { store, speech }
 */
function createApp(config, deps = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.locals.config = config;
  app.locals.store = deps.store;
  app.locals.speech = deps.speech;

  app.use(buildCors(config));

  // Voice turns arrive as raw audio, so the raw parser must be registered
  // before the JSON parser. JSON bodies under this path still fall through.
  app.use(
    ['/api/voice-sessions', '/api/calls', '/api/transcribe'],
    express.raw({
      type: ['audio/*', 'application/octet-stream'],
      limit: config.maxAudioBytes || 8 * 1024 * 1024,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Lightweight request log: enough to debug a demo, no PII, no extra deps.
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      if (req.originalUrl === '/api/health') return;
      console.log(
        `[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`,
      );
    });
    next();
  });

  app.get('/', (req, res) =>
    res.json({
      success: true,
      message: 'GramSahayak API',
      docs: '/api/health',
      version: require('../package.json').version,
    }),
  );

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
