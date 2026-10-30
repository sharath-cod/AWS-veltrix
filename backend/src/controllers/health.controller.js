const { getDatabaseStatus } = require('../config/database');

/**
 * GET /api/health
 * Also reports which store is active and whether the speech providers are
 * configured, so the Android Settings screen can explain what will work.
 */
exports.getHealth = (req, res) => {
  const { store, speech, config } = req.app.locals;
  res.status(200).json({
    success: true,
    message: 'GramSahayak backend is running',
    database: store && store.mode === 'memory' ? 'in-memory (demo)' : getDatabaseStatus(),
    storeMode: store ? store.mode : 'unknown',
    speech: speech ? speech.status : { provider: 'unknown' },
    features: {
      query: true,
      schemes: true,
      scholarships: true,
      reminders: true,
      scamCheck: true,
      smsSimulation: Boolean(config && config.allowSmsSimulation),
      voice: Boolean(speech && speech.provider === 'aws'),
    },
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
