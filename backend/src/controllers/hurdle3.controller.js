const KnowledgeItem = require('../models/KnowledgeItem');
const Scheme = require('../models/Scheme');
const Scholarship = require('../models/Scholarship');
const freshness = require('../services/freshness.service');
const numbers = require('../services/numbers.service');
const gate = require('../services/gate.service');
const lang = require('../services/lang.service');
const { ok } = require('../utils/response');
const { toClient } = require('../utils/response');

const typeOf = (r) => {
  if (r.deadline) return 'scholarship_deadline';
  if (r.eligibility) return 'scheme_rule';
  if (r.category === 'health' || r.content) return 'health_advice';
  return 'general';
};

const clean = (doc) => {
  const c = toClient(doc);
  delete c.keywords;
  return c;
};

async function allRecords() {
  const [knowledge, schemes, scholarships] = await Promise.all([
    KnowledgeItem.find({ active: true }).lean(),
    Scheme.find({ active: true }).lean(),
    Scholarship.find({ active: true }).lean(),
  ]);
  return [...knowledge, ...schemes, ...scholarships].map(clean);
}

// GET /api/pack/manifest - the receipt for what the phone just downloaded
async function manifest(req, res) {
  const records = await allRecords();
  const pack = freshness.manifestOf(records, { typeOf });
  return ok(res, pack);
}

// POST /api/pack/delta - what changed since this phone's last download
async function delta(req, res) {
  const { known = {}, previous = null, language = 'en' } = req.validated.body;
  const records = await allRecords();
  const result = freshness.deltaFor(known, records, { typeOf });

  // If the phone sent its old copies, answer the question it actually cares about:
  // "what changed?", in money terms.
  let whatChanged = null;
  if (previous && typeof previous === 'object') {
    const diffs = result.changed.map((rec) => freshness.diffRecords(previous[rec.slug] || null, rec, { language })).filter((d) => d.changes.length || d.isNew);
    const names = Object.fromEntries(records.map((r) => [r.slug, r.name || r.title || { en: r.slug }]));
    whatChanged = freshness.whatChanged(diffs, { language, names });
  }

  return ok(res, {
    changed: result.changed,
    removed: result.removed,
    unchanged: result.unchanged,
    whatChanged,
    // the phone stores this and sends it back next time
    checkpoint: new Date().toISOString(),
  });
}

// POST /api/pack/diff - pure diff between two copies of a record (used by tests and the demo)
async function diff(req, res) {
  const { before, after, language = 'en' } = req.validated.body;
  const d = freshness.diffRecords(before, after, { language });
  return ok(res, d);
}

// POST /api/readback - parse a transcript and return the read-back cards, storing nothing.
// The Android app calls this on the speech result before it asks the assistant anything.
async function readback(req, res) {
  const { text, language = 'en', profile = {}, fromSpeech = true } = req.validated.body;
  const policy = lang.replyPolicy(text, language);
  const parsed = numbers.parseNumbers(text);
  const cards = parsed
    .filter((n) => numbers.needsConfirmation(n, { fromSpeech }))
    .map((entry) => {
      const flags = numbers.plausibility(entry, profile);
      const rb = numbers.readBack(entry, { language: policy.language, alternatives: numbers.confusionCandidates(entry), flags });
      return { ...rb, field: entry.kind === 'money' ? 'annualIncome' : entry.kind === 'age' ? 'age' : gate.FIELD_FOR_KIND[entry.kind], raw: entry.raw };
    });
  return ok(res, {
    language: policy.language,
    languagePolicy: policy,
    numbers: parsed,
    cards,
    required: cards.length > 0,
    segments: lang.speechSegments(text, policy.language),
    sttPrompt: lang.sttPrompt(policy.language),
  });
}

// POST /api/confirm - the person pressed "yes" or corrected the number
async function confirm(req, res) {
  const { id, action = 'confirm', corrected = {} } = req.validated.body;
  const result = gate.resolveConfirmation(id, { action, corrected });
  if (!result.ok) return res.status(result.code === 'expired' ? 410 : 400).json({ success: false, error: { message: result.message, code: result.code } });
  return ok(res, result);
}

// GET /api/freshness/policy - the shelf lives, so the phone mirrors the server exactly
async function policy(req, res) {
  return ok(res, {
    policy: freshness.POLICY,
    agingAt: 0.6,
    confidenceCap: { fresh: 1, ageing: 0.9, stale: 0.6, expired: 0.35 },
    needsConfirmation: { money: 'always', date: 'always', age: 'when spoken', other: 'never' },
    languages: lang.VOICE_OF,
  });
}

// GET /api/language/probe?text=... - what the server makes of a mixed sentence (demo + debugging)
async function probe(req, res) {
  const text = String(req.validated.query.text || '');
  return ok(res, {
    profile: lang.profile(text),
    segments: lang.segment(text),
    canonical: lang.canonicalize(text),
    policy: lang.replyPolicy(text, req.validated.query.language || 'en'),
    speechSegments: lang.speechSegments(text, req.validated.query.language || 'en'),
  });
}

module.exports = { manifest, delta, diff, readback, confirm, policy, probe };
