const AppError = require('../utils/AppError');

const HEADER = 'x-device-id';

/**
 * Anonymous per-install identity. The Android app generates a UUID once and
 * sends it as X-Device-Id on every personal endpoint. No accounts, no PII.
 */
module.exports = (req, res, next) => {
  const raw = req.get(HEADER) || (req.body && req.body.deviceId) || '';
  const deviceId = String(raw).trim();

  if (!deviceId) {
    return next(
      new AppError(
        'X-Device-Id header is required for this endpoint',
        400,
        'DEVICE_ID_REQUIRED',
      ),
    );
  }
  if (deviceId.length < 8 || deviceId.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(deviceId)) {
    return next(new AppError('X-Device-Id is not a valid device identifier', 400, 'DEVICE_ID_INVALID'));
  }
  req.deviceId = deviceId;
  return next();
};
