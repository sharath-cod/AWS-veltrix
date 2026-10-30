const { okList } = require('../utils/respond');
const { rank, filterDocs } = require('../services/retrieval');
const { buildManifest, compare, changesSince } = require('../services/freshness');

/** Human names for each knowledge category, in the three app languages. */
const CATEGORY_LABELS = {
  health: { en: 'Health and medical', hi: 'स्वास्थ्य और इलाज', kn: 'ಆರೋಗ್ಯ ಮತ್ತು ಚಿಕಿತ್ಸೆ' },
  schemes: { en: 'Government schemes', hi: 'सरकारी योजनाएं', kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು' },
  scholarships: { en: 'Scholarships', hi: 'छात्रवृत्ति', kn: 'ವಿದ್ಯಾರ್ಥಿವೇತನ' },
  scam: { en: 'Fraud and scam check', hi: 'धोखाधड़ी और ठगी', kn: 'ಮೋಸ ಮತ್ತು ವಂಚನೆ' },
  agriculture: { en: 'Farming and crops', hi: 'खेती और फसल', kn: 'ಕೃಷಿ ಮತ್ತು ಬೆಳೆ' },
  education: { en: 'School and education', hi: 'स्कूल और शिक्षा', kn: 'ಶಾಲೆ ಮತ್ತು ಶಿಕ್ಷಣ' },
  documents: { en: 'Certificates and documents', hi: 'प्रमाण पत्र और दस्तावेज़', kn: 'ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ದಾಖಲೆ' },
  emergency: { en: 'Emergency help', hi: 'आपातकालीन सहायता', kn: 'ತುರ್ತು ಸಹಾಯ' },
  finance: { en: 'Money and banking', hi: 'पैसा और बैंक', kn: 'ಹಣ ಮತ್ತು ಬ್ಯಾಂಕ್' },
  general: { en: 'General help', hi: 'सामान्य सहायता', kn: 'ಸಾಮಾನ್ಯ ಸಹಾಯ' },
};

/**
 * GET /api/knowledge?q=&category=&limit=
 * The offline-first client mirrors this list into Room; the same data powers
 * the assistant answers.
 */
exports.list = async (req, res) => {
  const { q, category } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const all = await req.app.locals.store.knowledge.all();

  let items = all;
  if (category && category !== 'all') items = items.filter((d) => d.category === category);
  if (q) items = filterDocs(items, q, 'knowledge');

  okList(res, items.slice(0, limit), {
    category: category || 'all',
    query: q || null,
    categories: exports.categoryCounts(all),
    source: 'seed-knowledge-base',
    note: 'Seed content is marked verified:false. Confirm with the official portal before relying on it.',
  });
};

/** Count of entries per category, used by the list metadata and /api/categories. */
exports.categoryCounts = (docs) => {
  const counts = {};
  for (const doc of docs) counts[doc.category] = (counts[doc.category] || 0) + 1;
  return counts;
};

/**
 * GET /api/categories
 * Every knowledge phase the assistant can answer, with a trilingual label and
 * the number of entries behind it. The Home screen can use this to build tiles
 * instead of hard-coding them.
 */
exports.categories = async (req, res) => {
  const all = await req.app.locals.store.knowledge.all();
  const counts = exports.categoryCounts(all);
  const items = Object.keys(CATEGORY_LABELS)
    .filter((key) => counts[key])
    .map((key) => ({
      id: key,
      label: CATEGORY_LABELS[key],
      entries: counts[key],
    }));
  okList(res, items, { total: all.length });
};

/** GET /api/knowledge/:id */
exports.getOne = async (req, res) => {
  const all = await req.app.locals.store.knowledge.all();
  const doc = all.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({
      success: false,
      error: { message: 'Knowledge entry not found', code: 'NOT_FOUND' },
    });
  }
  return res.json({ success: true, data: doc });
};

/**
 * GET /api/knowledge/manifest?have=<packVersion>&downloadedAt=<ISO>
 * Tiny, cheap call the phone makes whenever it is online. Tells it whether its
 * downloaded pack is stale and how to explain that to the user.
 */
exports.manifest = async (req, res) => {
  const { store } = req.app.locals;
  const manifest = await buildManifest(store);
  const freshness = compare(manifest, { packVersion: req.query.have, downloadedAt: req.query.downloadedAt });
  res.json({ success: true, data: { ...manifest, freshness } });
};

/**
 * GET /api/knowledge/changes?downloadedAt=<ISO>&have=<packVersion>
 *
 * What actually changed since this phone downloaded its pack: every entry whose
 * content was re-checked after that date, with the facts that move (amount,
 * deadline, eligibility) and where to verify them. This is the difference
 * between "your copy is old" and "these three answers changed, look at them".
 */
exports.changes = async (req, res) => {
  const { store } = req.app.locals;
  const data = await changesSince(store, {
    downloadedAt: req.query.downloadedAt,
    packVersion: req.query.have,
    limit: req.query.limit,
  });
  res.json({ success: true, data });
};

/**
 * GET /api/knowledge/pack — everything the phone needs in one download
 * (all schemes + knowledge, all languages) stamped with its packVersion.
 */
exports.pack = async (req, res) => {
  const { store } = req.app.locals;
  const [manifest, schemes, knowledge] = await Promise.all([
    buildManifest(store), store.schemes.all(), store.knowledge.all(),
  ]);
  res.json({ success: true, data: { ...manifest, schemes, knowledge } });
};

exports.search = rank;
