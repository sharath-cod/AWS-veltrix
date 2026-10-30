/**
 * Builds the seed dataset used by both the MongoDB seed script and the
 * in-memory fallback store. Every localisable field is an object of the form
 * { en, hi, kn } so the Android client can pick the user's language and fall
 * back to English. This is the single source of truth for demo content.
 */
const crypto = require('crypto');
const en = require('./seed-en.json');
const { factsFor } = require('./facts');
const i18n = require('./seed-i18n');
// Extra knowledge entries, already localised in en/hi/kn. They cover every
// phase the app has a screen for: health, schemes, scholarships, scam,
// agriculture, education, documents, emergency, money and general help.
const knowledgeExtra = [
  ...require('./knowledge-extra-1'),
  ...require('./knowledge-extra-2'),
  ...require('./knowledge-extra-3'),
];
// Schemes and scholarships added after the first seed file. They are already
// in the { en, hi, kn } shape, so they skip the seed-en/seed-i18n join.
const catalogExtra = require('./catalog-extra');

/**
 * Hindi, Kannada and romanised keywords for the original English-tagged
 * entries. Without these, a Hindi question like "बच्चे को बुखार है" matched the
 * word "बच्चे" on several entries and the symptom word carried no weight.
 */
const TAGS_EXTRA = {
  'kb-health-fever': ['बुखार', 'बुख़ार', 'ज्वर', 'मलेरिया', 'डेंगू', 'ज್ವರ', 'ಮಲೇರಿಯಾ', 'ಡೆಂಗ್ಯೂ', 'bukhar', 'jwara'],
  'kb-health-diarrhoea': ['दस्त', 'पेचिश', 'उल्टी', 'ओआरएस', 'ಭೇದಿ', 'ವಾಂತಿ', 'dast', 'ulti', 'loose motion'],
  'kb-health-pregnancy': ['गर्भवती', 'गर्भावस्था', 'प्रसव', 'ಜನನ', 'ಗರ್ಭಿಣಿ', 'ಹೆರಿಗೆ', 'garbhvati', 'prasav'],
  'kb-health-tb': ['टीबी', 'तपेदिक', 'क्षय रोग', 'खांसी', 'ಕ್ಷಯ ರೋಗ', 'ಕೆಮ್ಮು', 'khansi', 'kammi'],
  'kb-scheme-farmer': ['किसान', 'खेती', 'फसल', 'रೈತ', 'ಕೃಷಿ', 'ಬೆಳೆ', 'kisan', 'krishi'],
  'kb-scheme-ration': ['राशन', 'राशन कार्ड', 'ಅಕ್ಕಿ ಕಾರ್ಡ್', 'ರೇಷನ್', 'ration card', 'pds'],
  'kb-scholarship-documents': ['छात्रवृत्ति', 'कागज़', 'ದಾಖಲೆ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'chhatravritti'],
  'kb-scholarship-status': ['छात्रवृत्ति', 'स्थिति', 'ಸ್ಥಿತಿ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'chhatravritti'],
  'kb-scam-otp': ['ओटीपी', 'धोखा', 'ठगी', 'ಒಟಿಪಿ', 'ಮೋಸ', 'ವಂಚನೆ', 'otp fraud', 'thagi'],
  'kb-scam-lottery': ['लॉटरी', 'लाटरी', 'इनाम', 'ಲಾಟರಿ', 'ಬಹುಮಾನ', 'lottery'],
  'kb-general-helplines': ['हेल्पलाइन', 'मदद', 'ಸಹಾಯವಾಣಿ', 'ಸಹಾಯ', 'helpline'],
  'kb-general-documents': ['दस्तावेज़', 'कागज़', 'प्रमाण पत्र', 'ದಾಖಲೆ', 'ಪ್ರಮಾಣಪತ್ರ'],
};

const LANGS = ['en', 'hi', 'kn'];

/** Short fingerprint of the localised content, so a change is detectable. */
function contentHash(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 10);
}
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
  const fromExtra = catalogExtra.schemes.map((item) => buildCatalogItem(item, 'scheme'));
  return [...en.schemes.map((item) => {
    const facts = factsFor(item.key, 'schemes');
    const fields = localise('scheme', item);
    return {
      id: item.key,
      key: item.key,
      type: 'scheme',
      category: item.category,
      tags: item.tags,
      ...fields,
      ...facts,
      contentHash: contentHash(fields),
      // Deterministic, so the change feed does not shift on every restart.
      updatedAt: `${facts.asOf}T00:00:00.000Z`,
      source: { name: item.source, verified: false },
      verified: false,
    };
  }), ...fromExtra];
}

/**
 * A scheme or scholarship that already carries all three languages.
 * Kept separate from the seed-en + seed-i18n join above so that new content
 * does not need an entry in three different files.
 */
function buildCatalogItem(item, kind) {
  const facts = factsFor(item.key, kind === 'scheme' ? 'schemes' : 'scholarships');
  const fields = {};
  for (const field of FIELDS[kind]) fields[field] = { ...item[field] };
  return {
    id: item.key,
    key: item.key,
    type: kind,
    ...(item.category ? { category: item.category } : {}),
    ...(item.provider ? { provider: item.provider } : {}),
    ...(item.open !== undefined ? { open: item.open } : {}),
    ...(item.deadline ? { deadline: item.deadline } : {}),
    ...(item.amount ? { amount: item.amount } : {}),
    tags: item.tags,
    ...fields,
    ...facts,
    contentHash: contentHash(fields),
    updatedAt: `${facts.asOf}T00:00:00.000Z`,
    source: { name: item.source, verified: false },
    verified: false,
  };
}

function buildScholarships() {
  const fromExtra = catalogExtra.scholarships.map((item) => buildCatalogItem(item, 'scholarship'));
  return [...en.scholarships.map((item) => {
    const facts = factsFor(item.key, 'scholarships');
    const fields = localise('scholarship', item);
    return {
      id: item.key,
      key: item.key,
      type: 'scholarship',
      provider: item.provider,
      open: item.open,
      deadline: item.deadline,
      amount: item.amount,
      tags: item.tags,
      ...fields,
      ...facts,
      contentHash: contentHash(fields),
      updatedAt: `${facts.asOf}T00:00:00.000Z`,
      source: { name: item.source, verified: false },
      verified: false,
    };
  }), ...fromExtra];
}

function buildKnowledge() {
  const base = en.knowledge.map((item) => {
    const facts = factsFor(item.key, item.category);
    const fields = localise('knowledge', item);
    return {
      id: item.key,
      key: item.key,
      category: item.category,
      tags: [...new Set([...item.tags, ...(TAGS_EXTRA[item.key] || [])])],
      ...fields,
      ...facts,
      contentHash: contentHash(fields),
      updatedAt: `${facts.asOf}T00:00:00.000Z`,
      sources: item.sources.map((name) => ({ name })),
      verified: false,
    };
  });

  // The extra entries are already in { en, hi, kn } form, so they are copied
  // straight through. A key present in both files keeps the original entry.
  const seen = new Set(base.map((item) => item.key));
  const extra = knowledgeExtra
    .filter((item) => !seen.has(item.key))
    .map((item) => {
      const facts = factsFor(item.key, item.category);
      const fields = { question: { ...item.question }, answer: { ...item.answer } };
      return {
        id: item.key,
        key: item.key,
        category: item.category,
        tags: item.tags,
        ...fields,
        ...facts,
        contentHash: contentHash(fields),
        updatedAt: `${facts.asOf}T00:00:00.000Z`,
        sources: item.sources.map((name) => ({ name })),
        verified: false,
      };
    });

  return [...base, ...extra];
}

function buildSeed() {
  return {
    schemes: buildSchemes(),
    scholarships: buildScholarships(),
    knowledge: buildKnowledge(),
  };
}

module.exports = { buildSeed, LANGS };
