const { loadConfig } = require('./src/config/env');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const createApp = require('./src/app');

async function main() {
  const config = loadConfig();
  config.warnings.forEach((w) => console.warn(`[config] warning: ${w}`));

  if (config.errors.length) {
    config.errors.forEach((e) => console.error(`[config] error: ${e}`));
    process.exit(1);
  }

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log(`[server] listening on port ${config.port} (${config.isProduction ? 'production' : 'development'})`);
  });

  // Start serving first; the DB connects in the background so /api/health reports real status.
  if (config.mongoUri) {
    connectDatabase(config.mongoUri);
  } else {
    console.warn('[db] skipped: no MONGODB_URI (health will report "disconnected")');
  }

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => console.error('[process] unhandledRejection:', reason));

main();
