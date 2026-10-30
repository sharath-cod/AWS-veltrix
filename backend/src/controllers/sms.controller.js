const AppError = require('../utils/AppError');
const { ok, okList } = require('../utils/respond');
const sms = require('../services/sms');

/**
 * POST /api/sms/preview
 * Validates a number and message without storing anything.
 */
exports.preview = async (req, res) => {
  const { to, message } = req.body || {};
  ok(res, sms.preview({ to, message }));
};

/**
 * POST /api/sms/send
 * SIMULATION ONLY. The message is recorded so the demo history works, but it is
 * never handed to an SMS gateway and never reaches a handset.
 */
exports.send = async (req, res) => {
  const { config, store } = req.app.locals;
  if (!config.allowSmsSimulation) {
    throw new AppError('SMS simulation is disabled on this server', 503, 'SMS_DISABLED');
  }

  const { to, message, language = 'en', category = 'other', consent } = req.body || {};
  if (!consent) {
    throw new AppError('consent must be true: the sender confirms they have permission', 400, 'CONSENT_REQUIRED');
  }
  const check = sms.preview({ to, message });
  if (!check.allowed) {
    throw new AppError(check.problems.join(' '), 400, 'INVALID_SMS');
  }

  const ten = sms.normaliseIndianMobile(to);
  const row = await store.sms.create(req.deviceId, {
    toMasked: sms.maskMobile(ten),
    message: String(message).trim(),
    language,
    category,
    status: sms.STATUS.simulated.status,
    statusLabel: sms.STATUS.simulated.statusLabel,
    simulated: true,
  });

  ok(res, { ...row, toMasked: row.toMasked, statusLabel: row.statusLabel }, {}, 201);
};

/** GET /api/sms */
exports.history = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const items = await req.app.locals.store.sms.list(req.deviceId, limit);
  okList(res, items, {
    deviceId: req.deviceId,
    simulated: true,
    note: 'All entries are simulations. Nothing was delivered to a phone.',
  });
};
