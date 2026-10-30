/**
 * SMS helper. This project never delivers a real SMS: sending is simulated so
 * the demo stays free and compliant. The helpers below normalise and mask
 * Indian mobile numbers so logs never hold a full number.
 */

/** Returns a normalised 10 digit Indian mobile number, or null. */
function normaliseIndianMobile(input) {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return ten;
}

/** +91 ******3210 style masking. */
function maskMobile(tenDigit) {
  if (!tenDigit) return 'unknown';
  return `+91 ******${tenDigit.slice(-4)}`;
}

/** Rough GSM segment count, good enough for a length warning in the UI. */
function segmentCount(message) {
  const length = String(message || '').length;
  if (length <= 160) return 1;
  return Math.ceil(length / 153);
}

const STATUS = {
  simulated: {
    status: 'simulated',
    statusLabel: 'Simulated — recorded only, not delivered (demo mode)',
  },
};

/** Preview a send: validates the number and message without storing anything. */
function preview({ to, message }) {
  const normalised = normaliseIndianMobile(to);
  const body = String(message || '').trim();
  const problems = [];
  if (!normalised) problems.push('Enter a valid 10 digit Indian mobile number starting with 6-9.');
  if (body.length < 2) problems.push('Message is too short.');
  if (body.length > 480) problems.push('Message is longer than 3 SMS segments (480 characters).');

  return {
    allowed: problems.length === 0,
    problems,
    toMasked: maskMobile(normalised),
    characters: body.length,
    segments: segmentCount(body),
    simulated: true,
    statusLabel: STATUS.simulated.statusLabel,
  };
}

module.exports = { normaliseIndianMobile, maskMobile, segmentCount, preview, STATUS };
