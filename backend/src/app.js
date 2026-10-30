const express = require('express');
const buildCors = require('./middleware/cors');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(buildCors(config));
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (req, res) =>
    res.json({ success: true, message: 'Rural Assistant API', health: '/api/health' })
  );
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
