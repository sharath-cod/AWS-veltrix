/**
 * npm run seed
 * Loads the trilingual demo dataset into MongoDB Atlas.
 * With no MONGODB_URI the in-memory store is already seeded, so this exits 0.
 */
require('dotenv').config();
const { loadConfig } = require('../src/config/env');
const { connectDatabase, disconnectDatabase, getDatabaseStatus } = require('../src/config/database');
const { seedDatabase } = require('../src/data/seed-db');

async function main() {
  const config = loadConfig();
  if (!config.mongoUri) {
    console.log('[seed] MONGODB_URI is not set. The in-memory store is seeded automatically at boot.');
    console.log('[seed] Nothing to do.');
    return;
  }

  const connected = await connectDatabase(config.mongoUri);
  if (!connected || getDatabaseStatus() !== 'connected') {
    console.error('[seed] Could not connect to MongoDB. Check MONGODB_URI, the Atlas IP allowlist and the password.');
    process.exitCode = 1;
    return;
  }

  const force = process.argv.includes('--force');
  const result = await seedDatabase({ force });
  console.log('[seed] done:', JSON.stringify(result));
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  await disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
