const { okList } = require('../utils/respond');
const { rank, filterDocs } = require('../services/retrieval');

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
    source: 'seed-knowledge-base',
    note: 'Seed content is marked verified:false. Confirm with the official portal before relying on it.',
  });
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

exports.search = rank;
