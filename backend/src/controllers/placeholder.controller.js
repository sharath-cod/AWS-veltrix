// Shared placeholder for APIs implemented in later phases.
exports.notImplemented = (feature) => (req, res) => {
  res.status(501).json({
    success: false,
    error: { message: `${feature} API is not implemented yet`, code: 'NOT_IMPLEMENTED' },
  });
};
