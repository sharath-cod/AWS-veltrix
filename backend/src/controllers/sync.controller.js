const AppError = require('../utils/AppError');
const { ok } = require('../utils/respond');

/**
 * POST /api/sync
 * The Android app keeps an outbox (Room table pending_sync) of operations made
 * while offline. SyncWorker posts them here; the server applies each one and
 * reports which were accepted so the client can clear its queue.
 *
 * Body: { operations: [{ id, entityType, entityId, operation, payload, createdAt }] }
 */
const MAX_BATCH = 200;

async function applyReminder(store, deviceId, op) {
  const payload = op.payload || {};
  if (op.operation === 'create') {
    const existing = payload.clientId
      ? (await store.reminders.list(deviceId)).find((r) => r.clientId === payload.clientId)
      : null;
    if (existing) return { applied: 'already_exists', id: existing.id };
    const row = await store.reminders.create(deviceId, {
      title: payload.title || 'Untitled reminder',
      type: payload.type || 'other',
      remindAt: payload.remindAt || new Date().toISOString(),
      repeat: payload.repeat || 'none',
      clientId: payload.clientId || null,
    });
    return { applied: 'created', id: row.id };
  }
  if (op.operation === 'update') {
    const row = await store.reminders.update(deviceId, op.entityId, {
      ...(payload.title ? { title: payload.title } : {}),
      ...(payload.completed !== undefined ? { completed: Boolean(payload.completed) } : {}),
      ...(payload.remindAt ? { remindAt: payload.remindAt } : {}),
    });
    if (!row) throw new Error('reminder not found on server');
    return { applied: 'updated', id: row.id };
  }
  if (op.operation === 'delete') {
    const removed = await store.reminders.remove(deviceId, op.entityId);
    return { applied: removed ? 'deleted' : 'already_deleted', id: op.entityId };
  }
  throw new Error(`unsupported reminder operation: ${op.operation}`);
}

async function applySavedScholarship(store, deviceId, op) {
  const key = (op.payload && (op.payload.scholarshipId || op.payload.scholarship)) || op.entityId;
  if (!key) throw new Error('scholarship id missing');
  if (op.operation === 'create') {
    const row = await store.saved.add(deviceId, String(key));
    return { applied: 'saved', id: row.id };
  }
  if (op.operation === 'delete') {
    const removed = await store.saved.remove(deviceId, String(key));
    return { applied: removed ? 'unsaved' : 'already_unsaved', id: String(key) };
  }
  throw new Error(`unsupported scholarship operation: ${op.operation}`);
}

exports.push = async (req, res) => {
  const { store } = req.app.locals;
  const operations = (req.body && req.body.operations) || [];
  if (!Array.isArray(operations)) {
    throw new AppError('operations must be an array', 400, 'INVALID_OPERATIONS');
  }
  if (operations.length > MAX_BATCH) {
    throw new AppError(`Send at most ${MAX_BATCH} operations per request`, 413, 'BATCH_TOO_LARGE');
  }

  const accepted = [];
  const rejected = [];

  for (const op of operations) {
    try {
      if (!op || !op.entityType || !op.operation) throw new Error('entityType and operation are required');
      let result;
      if (op.entityType === 'reminder') result = await applyReminder(store, req.deviceId, op);
      else if (op.entityType === 'scholarship_saved') result = await applySavedScholarship(store, req.deviceId, op);
      else throw new Error(`unsupported entityType: ${op.entityType}`);
      accepted.push({ id: op.id, ...result });
    } catch (err) {
      rejected.push({ id: op && op.id, reason: err.message });
    }
  }

  ok(res, {
    accepted,
    rejected,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    serverTime: new Date().toISOString(),
    note: 'Only reminders and saved scholarships are synced. Answers and scam checks stay on the device.',
  });
};

/** GET /api/sync — what the server currently holds for this device. */
exports.status = async (req, res) => {
  const { store } = req.app.locals;
  const [reminders, saved] = await Promise.all([
    store.reminders.list(req.deviceId),
    store.saved.list(req.deviceId),
  ]);
  ok(res, {
    deviceId: req.deviceId,
    reminders: reminders.length,
    savedScholarships: saved.length,
    serverTime: new Date().toISOString(),
  });
};
