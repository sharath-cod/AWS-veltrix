// Text normalisation shared by lang.service and numbers.service.
// NFKC, lower-case, zero-width characters removed. Indic combining marks are kept.
function normalize(s) {
  return String(s == null ? '' : s)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase();
}
module.exports = { normalize };
