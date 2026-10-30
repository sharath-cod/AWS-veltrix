/** Small helpers so every controller returns the same envelope. */

/** Success: { success: true, data, ...extra } */
function ok(res, data, extra = {}, status = 200) {
  return res.status(status).json({ success: true, data, ...extra });
}

/** Success with a list: { success: true, data: [...], count, ...extra } */
function okList(res, items, extra = {}) {
  return res.status(200).json({ success: true, data: items, count: items.length, ...extra });
}

module.exports = { ok, okList };
