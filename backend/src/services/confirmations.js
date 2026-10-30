/**
 * Server-side confirmation of numbers and dates — hurdle 3.
 *
 * The Ask screen already read numbers back, but that gate lived only on the
 * phone: a client bug, an older APK or the voice path could skip it. Here the
 * gate is on the server, so an answer that depends on a number is only released
 * after the user says (or taps) "yes".
 *
 * A token is single-use, tied to the device that asked, and expires in ten
 * minutes, so a confirmation cannot be replayed later against a different
 * question.
 */
const crypto = require('crypto');

const TTL_MS = 10 * 60 * 1000;
const MAX_OPEN = 500;
const open = new Map();
// Tokens already used, kept briefly so a retry says "already used" instead of
// the vaguer "not recognised".
const used = new Map();

function prune(now = Date.now()) {
  for (const [token, payload] of open) {
    if (payload.expiresAt <= now) open.delete(token);
  }
  for (const [token, expiry] of used) {
    if (expiry <= now) used.delete(token);
  }
  // Hard cap so a long-running demo cannot grow without bound.
  while (open.size > MAX_OPEN) open.delete(open.keys().next().value);
  while (used.size > MAX_OPEN) used.delete(used.keys().next().value);
}

/**
 * Hold a question until the user confirms what the server understood.
 * @returns {{token: string, expiresAt: string, expiresInSeconds: number}}
 */
function issue({ deviceId, question, language, category, packVersion, packDownloadedAt, items, dates, speechScript }) {
  prune();
  const token = crypto.randomBytes(12).toString('hex');
  const expiresAt = Date.now() + TTL_MS;
  open.set(token, {
    deviceId: deviceId || null,
    question,
    language,
    category,
    packVersion,
    packDownloadedAt,
    items,
    dates,
    speechScript,
    createdAt: Date.now(),
    expiresAt,
    used: false,
  });
  return { token, expiresAt: new Date(expiresAt).toISOString(), expiresInSeconds: Math.round(TTL_MS / 1000) };
}

/**
 * Consume a token.
 * @returns {{payload?: object, error?: 'unknown'|'expired'|'used'|'device-mismatch'}}
 */
function take(token, deviceId) {
  prune();
  const payload = open.get(String(token || ''));
  if (!payload) return { error: used.has(String(token || '')) ? 'used' : 'unknown' };
  if (payload.expiresAt <= Date.now()) {
    open.delete(token);
    return { error: 'expired' };
  }
  if (payload.deviceId && deviceId && payload.deviceId !== deviceId) return { error: 'device-mismatch' };
  payload.used = true;
  open.delete(token);
  used.set(String(token), Date.now() + TTL_MS);
  return { payload };
}

/** Drop a held question without answering it (user said "no"). */
function drop(token) {
  prune();
  const payload = open.get(String(token || ''));
  if (payload) open.delete(token);
  return Boolean(payload);
}

function size() {
  prune();
  return open.size;
}

module.exports = { issue, take, drop, size, TTL_MS };
