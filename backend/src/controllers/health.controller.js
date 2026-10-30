const { getDatabaseStatus } = require('../config/database');

exports.getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rural Assistant backend is running',
    database: getDatabaseStatus(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
