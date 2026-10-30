/**
 * Seed the MongoDB collections from src/data/seed-data.js.
 * Idempotent: existing documents with the same id are upserted, so running it
 * twice does not duplicate content.
 */
const { buildSeed } = require('./seed-data');
const { Models } = require('../store/mongo');

async function seedDatabase({ force = false, log = console.log } = {}) {
  const seed = buildSeed();

  if (force) {
    await Promise.all([
      Models.schemes.deleteMany({}),
      Models.scholarships.deleteMany({}),
      Models.knowledge.deleteMany({}),
    ]);
    log('[seed] cleared schemes, scholarships and knowledge');
  }

  const existing = await Models.schemes.countDocuments();
  if (existing > 0 && !force) {
    return { skipped: true, existing };
  }

  const ops = [
    ...seed.schemes.map((doc) => ({
      updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
    })),
  ];
  const opsS = [
    ...seed.scholarships.map((doc) => ({
      updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
    })),
  ];
  const opsK = [
    ...seed.knowledge.map((doc) => ({
      updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
    })),
  ];

  if (ops.length) await Models.schemes.bulkWrite(ops);
  if (opsS.length) await Models.scholarships.bulkWrite(opsS);
  if (opsK.length) await Models.knowledge.bulkWrite(opsK);

  log(
    `[seed] upserted ${seed.schemes.length} schemes, ${seed.scholarships.length} scholarships, ${seed.knowledge.length} knowledge entries`,
  );
  return {
    skipped: false,
    inserted: {
      schemes: seed.schemes.length,
      scholarships: seed.scholarships.length,
      knowledge: seed.knowledge.length,
    },
  };
}

/** Called on boot: only seeds when the database looks empty. */
async function ensureSeeded(store, log = console.log) {
  if (!store || store.mode !== 'mongo') return { skipped: true, reason: 'in-memory store is pre-seeded' };
  try {
    const schemes = await store.schemes.all();
    if (schemes.length > 0) return { skipped: true, existing: schemes.length };
    return await seedDatabase({ log });
  } catch (err) {
    log(`[seed] skipped: ${err.message}`);
    return { skipped: true, error: err.message };
  }
}

module.exports = { seedDatabase, ensureSeeded };
