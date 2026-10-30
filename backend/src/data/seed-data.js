/**
 * Builds the seed dataset used by both the MongoDB seed script and the
 * in-memory fallback store. Every localisable field is an object of the form
 * { en, hi, kn } so the Android client can pick the user's language and fall
 * back to English. This is the single source of truth for demo content.
 */
const en = require('./seed-en.json');
const i18n = require('./seed-i18n');

const LANGS = ['en', 'hi', 'kn'];
const FIELDS = {
  scheme: ['name', 'description', 'eligibility', 'apply'],
  scholarship: ['name', 'description', 'eligibility', 'apply'],
  knowledge: ['question', 'answer'],
};

function localise(kind, item) {
  const out = {};
  for (const field of FIELDS[kind]) {
    const value = {};
    for (const lang of LANGS) {
      const translated = i18n[lang] && i18n[lang][item.key] && i18n[lang][item.key][field];
      value[lang] = translated || item[field];
    }
    out[field] = value;
  }
  return out;
}

function buildSchemes() {
  return en.schemes.map((item) => ({
    id: item.key,
    key: item.key,
    type: 'scheme',
    category: item.category,
    tags: item.tags,
    ...localise('scheme', item),
    source: { name: item.source, verified: false },
    verified: false,
  }));
}

function buildScholarships() {
  return en.scholarships.map((item) => ({
    id: item.key,
    key: item.key,
    type: 'scholarship',
    provider: item.provider,
    open: item.open,
    deadline: item.deadline,
    amount: item.amount,
    tags: item.tags,
    ...localise('scholarship', item),
    source: { name: item.source, verified: false },
    verified: false,
  }));
}

function buildKnowledge() {
  return en.knowledge.map((item) => ({
    id: item.key,
    key: item.key,
    category: item.category,
    tags: item.tags,
    ...localise('knowledge', item),
    sources: item.sources.map((name) => ({ name })),
    verified: false,
  }));
}

function buildSeed() {
  return {
    schemes: buildSchemes(),
    scholarships: buildScholarships(),
    knowledge: buildKnowledge(),
  };
}

module.exports = { buildSeed, LANGS };
