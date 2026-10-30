/**
 * Store factory. MongoDB when MONGODB_URI is set, otherwise an in-memory store
 * seeded with the demo dataset so the API works with zero infrastructure.
 */
const { createMemoryStore } = require('./memory');
const { createMongoStore } = require('./mongo');

function createStore(config) {
  if (config.mongoUri) return createMongoStore();
  return createMemoryStore();
}

module.exports = { createStore };
