const AppError = require('../utils/AppError');
const { ok, okList } = require('../utils/respond');
const { filterDocs } = require('../services/retrieval');

/**
 * GET /api/scholarships?q=&open=
 */
exports.list = async (req, res) => {
  const { q } = req.query;
  const openOnly = req.query.open === undefined ? true : req.query.open === 'true';
  const all = await req.app.locals.store.scholarships.all();
  let items = all;
  if (openOnly) items = items.filter((s) => s.open !== false);
  if (q) items = filterDocs(items, q, 'scholarship');
  okList(res, items, {
    openOnly,
    query: q || null,
    note: 'Deadlines are seed values. Verify the current date on the National Scholarship Portal.',
  });
};

/** GET /api/scholarships/:id */
exports.getOne = async (req, res) => {
  const item = await req.app.locals.store.scholarships.get(req.params.id);
  if (!item) throw new AppError('Scholarship not found', 404, 'NOT_FOUND');
  res.json({ success: true, data: item });
};

/** GET /api/scholarships/saved */
exports.listSaved = async (req, res) => {
  const { store } = req.app.locals;
  const saved = await store.saved.list(req.deviceId);
  const catalogue = await store.scholarships.all();
  const byId = new Map(catalogue.map((s) => [s.id, s]));

  const items = saved.map((row) => ({
    ...(byId.get(row.scholarshipId) || { id: row.scholarshipId, name: { en: row.scholarshipId } }),
    savedAt: row.createdAt,
    savedId: row.id,
  }));
  okList(res, items, { deviceId: req.deviceId });
};

/** POST /api/scholarships/saved  { scholarship | scholarshipId } */
exports.save = async (req, res) => {
  const body = req.body || {};
  const scholarshipId = body.scholarship || body.scholarshipId || body.id;
  if (!scholarshipId) {
    throw new AppError('scholarship is required', 400, 'MISSING_SCHOLARSHIP');
  }
  const exists = await req.app.locals.store.scholarships.get(String(scholarshipId));
  if (!exists) throw new AppError('Unknown scholarship', 404, 'NOT_FOUND');

  const row = await req.app.locals.store.saved.add(req.deviceId, String(scholarshipId));
  ok(res, { ...exists, savedId: row.id, savedAt: row.createdAt, saved: true }, {}, 201);
};

/** DELETE /api/scholarships/saved/:id */
exports.unsave = async (req, res) => {
  const removed = await req.app.locals.store.saved.remove(req.deviceId, req.params.id);
  ok(res, { scholarshipId: req.params.id, removed: removed > 0 });
};
