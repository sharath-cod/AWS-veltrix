/**
 * npm run touch -- <entry-id> [--asOf=YYYY-MM-DD] [--revert]
 *
 * Demo helper for the stale-knowledge hurdle: mark one knowledge entry (or
 * scheme) as re-checked today, so a phone that downloaded its pack earlier sees
 * it appear in GET /api/knowledge/changes with the facts that moved.
 *
 * With MONGODB_URI set it updates the document in MongoDB. Without it, it prints
 * exactly which field to change in the seed file, because the in-memory store is
 * rebuilt from the seed on every boot.
 */
require('dotenv').config();
const { loadConfig } = require('../src/config/env');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
}

async function main() {
  const id = process.argv[2];
  if (!id || id.startsWith('--')) {
    console.error('usage: npm run touch -- <entry-id> [--asOf=YYYY-MM-DD]');
    console.error('example: npm run touch -- kb-scheme-pm-kisan');
    process.exitCode = 1;
    return;
  }
  const asOf = arg('asOf', new Date().toISOString().slice(0, 10));
  const config = loadConfig();

  if (!config.mongoUri) {
    console.log('[touch] MONGODB_URI is not set: the in-memory store is rebuilt from src/data on boot.');
    console.log(`[touch] To demo a change, set this entry's date in src/data/facts.js (ASOF_OVERRIDE):`);
    console.log(`        '${id}': '${asOf}',`);
    console.log('[touch] then restart the server. The phone will see it in /api/knowledge/changes.');
    return;
  }

  const connected = await connectDatabase(config.mongoUri);
  if (!connected) {
    console.error('[touch] could not connect to MongoDB. Check MONGODB_URI.');
    process.exitCode = 1;
    return;
  }
  const mongoose = require('mongoose');
  const stamp = `${asOf}T00:00:00.000Z`;
  let updated = 0;
  for (const collection of ['knowledge', 'schemes']) {
    const res = await mongoose.connection.collection(collection)
      .updateOne({ id }, { $set: { asOf, updatedAt: stamp } });
    updated += res.modifiedCount || 0;
  }
  if (updated) {
    console.log(`[touch] ${id} now reads as checked on ${asOf}.`);
    console.log('[touch] A phone that downloaded before that date will see it under /api/knowledge/changes.');
  } else {
    console.log(`[touch] no document with id "${id}" was found.`);
  }
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[touch] failed:', err.message);
  await disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
