/**
 * Store factory. MongoDB when MONGODB_URI is set, otherwise an in-memory store
 * seeded with the demo dataset so the API works with zero infrastructure.
 *
 * Either way the content collections are wrapped in a short-lived read-through
 * cache (see ./catalog), so a question does not re-read or re-copy the whole
 * knowledge base every time. Writes (reminders, saved scholarships, SMS logs,
 * voice sessions) are never cached and go straight to the store.
 */
const { createMemoryStore } = require('./memory');
const { createMongoStore } = require('./mongo');
const { createCatalogCache } = require('./catalog');

function createStore(config) {
  const store = config.mongoUri ? createMongoStore() : createMemoryStore();
  return createCatalogCache(store, {
    ttlMs: Number(process.env.CATALOG_CACHE_TTL_MS) || undefined,
  });
}

module.exports = { createStore };
