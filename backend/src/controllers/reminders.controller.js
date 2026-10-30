const AppError = require('../utils/AppError');
const { ok, okList } = require('../utils/respond');

const TYPES = ['health', 'scheme', 'scholarship', 'medicine', 'appointment', 'other'];
const REPEATS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

function validate(body, { partial = false } = {}) {
  const out = {};
  if (body.title !== undefined || !partial) {
    const title = String(body.title || '').trim();
    if (title.length < 2 || title.length > 120) {
      throw new AppError('title must be between 2 and 120 characters', 400, 'INVALID_TITLE');
    }
    out.title = title;
  }
  if (body.remindAt !== undefined || !partial) {
    const raw = String(body.remindAt || '').trim();
    const parsed = new Date(raw);
    if (!raw || Number.isNaN(parsed.getTime())) {
      throw new AppError('remindAt must be a valid ISO 8601 date and time', 400, 'INVALID_REMIND_AT');
    }
    out.remindAt = raw;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) throw new AppError(`type must be one of ${TYPES.join(', ')}`, 400, 'INVALID_TYPE');
    out.type = body.type;
  }
  if (body.repeat !== undefined) {
    if (!REPEATS.includes(body.repeat)) {
      throw new AppError(`repeat must be one of ${REPEATS.join(', ')}`, 400, 'INVALID_REPEAT');
    }
    out.repeat = body.repeat;
  }
  if (body.completed !== undefined) out.completed = Boolean(body.completed);
  if (body.notes !== undefined) out.notes = body.notes === null ? null : String(body.notes).slice(0, 500);
  if (body.clientId !== undefined) out.clientId = body.clientId === null ? null : String(body.clientId).slice(0, 64);
  return out;
}

/** GET /api/reminders */
exports.list = async (req, res) => {
  const items = await req.app.locals.store.reminders.list(req.deviceId);
  okList(res, items, { deviceId: req.deviceId });
};

/**
 * POST /api/reminders
 * Idempotent on clientId, so an offline queue can safely retry the same
 * reminder after a network failure without creating duplicates.
 */
exports.create = async (req, res) => {
  const data = validate(req.body || {});
  const { store } = req.app.locals;

  if (data.clientId) {
    const existing = (await store.reminders.list(req.deviceId)).find((r) => r.clientId === data.clientId);
    if (existing) return ok(res, existing, { deduplicated: true });
  }

  const row = await store.reminders.create(req.deviceId, {
    type: 'other',
    repeat: 'none',
    ...data,
  });
  return ok(res, row, {}, 201);
};

/** PUT /api/reminders/:id */
exports.update = async (req, res) => {
  const patch = validate(req.body || {}, { partial: true });
  if (!Object.keys(patch).length) {
    throw new AppError('Nothing to update', 400, 'EMPTY_PATCH');
  }
  const row = await req.app.locals.store.reminders.update(req.deviceId, req.params.id, patch);
  if (!row) throw new AppError('Reminder not found', 404, 'NOT_FOUND');
  ok(res, row);
};

/** DELETE /api/reminders/:id */
exports.remove = async (req, res) => {
  const removed = await req.app.locals.store.reminders.remove(req.deviceId, req.params.id);
  if (!removed) throw new AppError('Reminder not found', 404, 'NOT_FOUND');
  ok(res, { id: req.params.id, removed: true });
};
