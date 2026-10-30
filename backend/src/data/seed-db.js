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

  // The upserts above are idempotent, so this is safe to run on every boot:
  // existing rows are updated in place and new entries are added. Nothing is
  // ever deleted here unless force was passed.
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

/**
 * Called on boot.
 *
 * It used to seed only when the schemes collection was empty, which meant a
 * database created before a content update never received the new entries —
 * the deployment looked healthy while answering from an old knowledge base.
 * Now the stored counts are compared with the seed and, when they differ, the
 * idempotent upsert runs. Existing rows are updated in place, nothing is
 * duplicated, and no data is deleted.
 */
async function ensureSeeded(store, log = console.log) {
  if (!store || store.mode !== 'mongo') return { skipped: true, reason: 'in-memory store is pre-seeded' };
  if (String(process.env.SEED_ON_BOOT).toLowerCase() === 'false') {
    return { skipped: true, reason: 'SEED_ON_BOOT=false' };
  }
  try {
    const seed = buildSeed();
    const [schemes, scholarships, knowledge] = await Promise.all([
      store.schemes.all(), store.knowledge.all(), store.scholarships.all(),
    ]);
    const upToDate = schemes.length === seed.schemes.length
      && knowledge.length === seed.knowledge.length
      && scholarships.length === seed.scholarships.length;
    if (upToDate) {
      return { skipped: true, reason: 'content already matches the seed' };
    }
    log(
      `[seed] content drift: stored ${schemes.length}/${knowledge.length}/${scholarships.length} `
      + `schemes/knowledge/scholarships vs seed ${seed.schemes.length}/${seed.knowledge.length}/${seed.scholarships.length}`,
    );
    const result = await seedDatabase({ log });
    if (store.invalidate) store.invalidate();
    return result;
  } catch (err) {
    log(`[seed] skipped: ${err.message}`);
    return { skipped: true, error: err.message };
  }
}

module.exports = { seedDatabase, ensureSeeded };
