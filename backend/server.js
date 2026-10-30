const { loadConfig } = require('./src/config/env');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const { createStore } = require('./src/store');
const { createSpeechService } = require('./src/services/speech');
const { ensureSeeded } = require('./src/data/seed-db');
const createApp = require('./src/app');

async function main() {
  const config = loadConfig();
  config.warnings.forEach((w) => console.warn(`[config] warning: ${w}`));

  if (config.errors.length) {
    config.errors.forEach((e) => console.error(`[config] error: ${e}`));
    process.exit(1);
  }

  // Connect first when a database is configured: mongoose runs with
  // bufferCommands=false, so queries must not race the connection.
  if (config.mongoUri) {
    await connectDatabase(config.mongoUri);
  } else {
    console.warn('[db] no MONGODB_URI: using the in-memory demo store (data resets on restart)');
  }

  const store = createStore(config);
  const speech = createSpeechService(config);

  if (config.mongoUri) {
    // Build the indexes the list and change-feed queries rely on. Harmless to
    // repeat: MongoDB skips indexes that already exist.
    try {
      const { Models } = require('./src/store/mongo');
      await Promise.all(Object.values(Models).map((model) => model.createIndexes()));
      console.log('[db] indexes ensured');
    } catch (err) {
      console.warn(`[db] index creation skipped: ${err.message}`);
    }
    await ensureSeeded(store);
  }

  // Build the search index before the first request, so no user pays the
  // one-off indexing cost while waiting for an answer.
  try {
    const { warmIndex } = require('./src/services/retrieval');
    const started = process.hrtime.bigint();
    await warmIndex(store);
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(`[search] index ready in ${ms.toFixed(1)} ms`);
  } catch (err) {
    console.warn(`[search] index warm-up skipped: ${err.message}`);
  }

  const app = createApp(config, { store, speech });
  const server = app.listen(config.port, () => {
    console.log(
      `[server] listening on port ${config.port} (${config.isProduction ? 'production' : 'development'})`,
    );
    console.log(`[server] store: ${store.mode} · speech: ${speech.status.provider}`);
    console.log(`[server] health: http://localhost:${config.port}/api/health`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await store.close();
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
