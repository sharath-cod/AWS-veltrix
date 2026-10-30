// Hurdle 3, pillar 1: the phone's knowledge was correct on the day it was downloaded.
//
// A pack downloaded in June is still on the phone in October. The scheme amount moved,
// the income limit was raised, a scholarship deadline passed. Nothing in the app noticed,
// because "offline" was treated as a state of the NETWORK rather than a state of the DATA.
//
// The fix is that freshness becomes a field of the content, and of the answer:
//   1. every cached record carries asOf (when the fact was checked) and, where the
//      source gives one, validUntil (when it stops being true by itself)
//   2. freshnessOf() turns that into fresh / ageing / stale / expired, with a per-kind
//      shelf life: a rupee amount goes bad far faster than "drink water for fever"
//   3. a stale answer is still given - people offline need an answer - but it is
//      DISCLOSED, its confidence is capped, and the money figure is withheld once the
//      fact is expired. Never confidently wrong.
//   4. diffRecords() turns a refresh into "what changed since you downloaded", which is
//      the sentence that actually protects money: "₹6,000 -> ₹7,000".
//
// Rule-based and pure: the same functions run on the server and on the phone.

const crypto = require('crypto');
const { parseNumbers } = require('./numbers.service');

const DAY = 24 * 60 * 60 * 1000;

// How long each kind of fact stays trustworthy without re-checking.
// Money-critical rules are short on purpose: a wrong amount is worse than no amount.
const POLICY = {
  scheme_amount: { staleAfterDays: 21, critical: true, restrictWhenExpired: ['amount'] },
  scheme_rule: { staleAfterDays: 30, critical: true, restrictWhenExpired: [] },
  scheme_deadline: { staleAfterDays: 7, critical: true, restrictWhenExpired: ['date'] },
  scholarship_deadline: { staleAfterDays: 7, critical: true, restrictWhenExpired: ['date'] },
  scholarship_rule: { staleAfterDays: 30, critical: true, restrictWhenExpired: [] },
  health_advice: { staleAfterDays: 90, critical: false, restrictWhenExpired: [] },
  helpline: { staleAfterDays: 180, critical: true, restrictWhenExpired: ['number'] },
  general: { staleAfterDays: 120, critical: false, restrictWhenExpired: [] },
};

const AGING_AT = 0.6; // 60% of the shelf life: still fine, but start saying when it was checked
const CONFIDENCE_CAP = { fresh: 1, ageing: 0.9, stale: 0.6, expired: 0.35 };

const STATE_ORDER = { fresh: 0, ageing: 1, stale: 2, expired: 3 };
const worst = (a, b) => (STATE_ORDER[a] >= STATE_ORDER[b] ? a : b);

const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

function policyFor(kind) {
  return POLICY[kind] || POLICY.general;
}

/**
 * Freshness of one fact.
 * asOf       - when this fact was last checked against the official source
 * validUntil - optional hard truth: after this the fact is simply no longer true
 *              (a scholarship deadline, a rule that sunsets on a date)
 */
function freshnessOf({ asOf, validUntil, kind = 'general' }, now = new Date()) {
  const policy = policyFor(kind);
  const t = now instanceof Date ? now : new Date(now);
  const checked = asOf ? new Date(asOf) : null;
  if (!checked || Number.isNaN(checked.getTime())) {
    // No provenance at all: treat as stale, never as fresh. Unknown is not safe.
    return { state: 'stale', kind, asOf: null, ageDays: null, shelfLifeDays: policy.staleAfterDays, critical: policy.critical, unknown: true, disclose: true, restrict: policy.restrictWhenExpired };
  }
  const ageDays = Math.max(0, Math.floor((t.getTime() - checked.getTime()) / DAY));
  const shelf = policy.staleAfterDays;
  const expiry = validUntil ? new Date(validUntil) : null;
  const expiredByDate = expiry && !Number.isNaN(expiry.getTime()) && t.getTime() > expiry.getTime();

  let state;
  if (expiredByDate) state = 'expired';
  else if (ageDays > shelf) state = 'expired';
  else if (ageDays > shelf * AGING_AT) state = 'stale';
  else if (ageDays > shelf * AGING_AT * 0.5) state = 'ageing';
  else state = 'fresh';

  const daysLeft = expiry && !Number.isNaN(expiry.getTime()) ? Math.ceil((expiry.getTime() - t.getTime()) / DAY) : null;
  return {
    state,
    kind,
    asOf: checked.toISOString(),
    ageDays,
    daysLeft,
    validUntil: expiry && !Number.isNaN(expiry.getTime()) ? expiry.toISOString() : null,
    shelfLifeDays: shelf,
    critical: policy.critical,
    disclose: state !== 'fresh',
    restrict: state === 'expired' ? policy.restrictWhenExpired : [],
    confidenceCap: CONFIDENCE_CAP[state],
  };
}

// ---------------------------------------------------------------- disclosure text
const D = {
  ageing: {
    en: (d) => `Checked on ${d}. Rules can change, so confirm at the office before you travel.`,
    hi: (d) => `${d} को जाँचा गया था। नियम बदल सकते हैं, इसलिए दफ़्तर जाने से पहले पुष्टि कर लें।`,
    kn: (d) => `${d} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ನಿಯಮ ಬದಲಾಗಬಹುದು, ಕಚೇರಿಗೆ ಹೋಗುವ ಮೊದಲು ಖಚಿತಪಡಿಸಿ.`,
  },
  stale: {
    en: (d, n) => `This was checked on ${d}, ${n} days ago, and may have changed since. Treat the amount as a guide, not a promise, and confirm at the office.`,
    hi: (d, n) => `यह ${d} को जाँचा गया था, यानी ${n} दिन पहले। तब से बदल सकता है। रकम को अनुमान मानें, वादा नहीं, और दफ़्तर में पुष्टि करें।`,
    kn: (d, n) => `ಇದನ್ನು ${d} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ, ಅಂದರೆ ${n} ದಿನಗಳ ಹಿಂದೆ. ಆಮೇಲೆ ಬದಲಾಗಿರಬಹುದು. ಮೊತ್ತವನ್ನು ಅಂದಾಜು ಎಂದು ತಿಳಿಯಿರಿ, ಭರವಸೆ ಅಲ್ಲ, ಮತ್ತು ಕಚೇರಿಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿ.`,
  },
  expired: {
    en: (d, n) => `This was last checked on ${d}, ${n} days ago, and is too old to rely on. I will not quote the amount. Please confirm at the office or on the official website.`,
    hi: (d, n) => `यह आखिरी बार ${d} को जाँचा गया था, यानी ${n} दिन पहले, और भरोसे लायक नहीं है। मैं रकम नहीं बताऊँगा। दफ़्तर या सरकारी वेबसाइट पर पुष्टि करें।`,
    kn: (d, n) => `ಇದನ್ನು ಕೊನೆಯ ಬಾರಿ ${d} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ, ಅಂದರೆ ${n} ದಿನಗಳ ಹಿಂದೆ, ಮತ್ತು ನಂಬಲು ಸಾಧ್ಯವಿಲ್ಲ. ನಾನು ಮೊತ್ತ ಹೇಳುವುದಿಲ್ಲ. ಕಚೇರಿ ಅಥವಾ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿ.`,
  },
  unknown: {
    en: () => 'This information has no checked date, so please confirm it at the office.',
    hi: () => 'इस जानकारी की जाँच की तारीख नहीं है, इसलिए दफ़्तर में पुष्टि करें।',
    kn: () => 'ಈ ಮಾಹಿತಿಗೆ ಪರಿಶೀಲನೆಯ ದಿನಾಂಕ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಕಚೇರಿಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿ.',
  },
  refresh: {
    en: 'When you get network, I will update this and tell you exactly what changed.',
    hi: 'जब नेटवर्क मिलेगा, मैं इसे अपडेट करूँगा और बताऊँगा कि क्या बदला।',
    kn: 'ನೆಟ್‌ವರ್ಕ್ ಸಿಕ್ಕಾಗ ನಾನು ಇದನ್ನು ನವೀಕರಿಸಿ ಏನು ಬದಲಾಗಿದೆ ಎಂದು ಹೇಳುತ್ತೇನೆ.',
  },
};

const LOCALE = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
function fmtDate(iso, language) {
  try {
    return new Intl.DateTimeFormat(LOCALE[language] || 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

function disclosureText(f, language = 'en') {
  if (!f || !f.disclose) return null;
  const lang = D.stale[language] ? language : 'en';
  if (f.unknown) return `${D.unknown[lang]()} ${D.refresh[lang]}`;
  const d = fmtDate(f.asOf, lang);
  const body = f.state === 'ageing' ? D.ageing[lang](d) : f.state === 'stale' ? D.stale[lang](d, f.ageDays) : D.expired[lang](d, f.ageDays);
  return `${body} ${D.refresh[lang]}`;
}

// ---------------------------------------------------------------- applying it to an answer
/**
 * Fold the freshness of the records behind an answer into the answer itself.
 * `records` are the knowledge/scheme/scholarship documents the answer used.
 * The result keeps the app's existing response shape and adds `freshness`.
 */
function applyToAnswer(result, records = [], { now = new Date(), language = 'en', kindOf = null, keepAmounts = [] } = {}) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const assessments = records.map((r) => {
    const kind = kindOf ? kindOf(r) : guessKind(r);
    const f = freshnessOf({ asOf: r.asOf || r.verifiedAt || r.updatedAt, validUntil: r.validUntil || r.deadline, kind }, nowDate);
    return { slug: r.slug, kind, ...f };
  });

  const state = assessments.reduce((acc, a) => worst(acc, a.state), 'fresh');
  const oldest = assessments.slice().sort((a, b) => (a.ageDays === null ? -1 : b.ageDays === null ? 1 : b.ageDays - a.ageDays))[0] || null;
  const restrict = [...new Set(assessments.flatMap((a) => a.restrict || []))];
  const cap = Math.min(...assessments.map((a) => a.confidenceCap ?? 1), 1);

  const freshness = {
    state,
    asOf: oldest && oldest.asOf ? oldest.asOf : null,
    ageDays: oldest ? oldest.ageDays : null,
    shelfLifeDays: oldest ? oldest.shelfLifeDays : null,
    disclose: state !== 'fresh',
    message: disclosureText(oldest || { disclose: false }, language),
    // what the answer is not allowed to say any more
    restrict,
    perRecord: assessments.map((a) => ({ slug: a.slug, state: a.state, asOf: a.asOf, ageDays: a.ageDays })),
    refreshSuggested: state === 'stale' || state === 'expired',
  };

  const out = { ...result, freshness };

  // Cap confidence: an old fact can never be a confident answer.
  if (result.confidence && typeof result.confidence.score === 'number') {
    const capped = Math.min(result.confidence.score, cap);
    out.confidence = {
      ...result.confidence,
      score: Math.round(capped * 100) / 100,
      level: capped >= 0.75 ? 'high' : capped >= 0.5 ? 'medium' : 'low',
      lowConfidence: capped < 0.5,
      cappedByFreshness: capped < result.confidence.score ? state : null,
    };
  }

  // Expired money: never quote the figure. Say it exists, say it is out of date.
  if (restrict.includes('amount') && typeof out.answer === 'string') {
    // The person's OWN confirmed numbers are not stale facts, so they stay.
    out.answer = stripAmounts(out.answer, language, keepAmounts);
  }
  if (freshness.message && typeof out.answer === 'string' && !out.answer.includes(freshness.message)) {
    out.answer = `${out.answer}\n\n${freshness.message}`;
  }
  return out;
}

const AMOUNT_RE = /₹\s?[0-9०-९೦-೯][0-9०-९೦-೯,.]*(\s*(lakh|lac|लाख|ಲಕ್ಷ|crore|करोड़|ಕೋಟಿ|thousand|हज़ार|ಸಾವಿರ))?/gi;
const STRIP_NOTE = {
  en: '(current amount not shown: our copy is out of date)',
  hi: '(मौजूदा रकम नहीं दिखा रहे: हमारी जानकारी पुरानी है)',
  kn: '(ಈಗಿನ ಮೊತ್ತ ತೋರಿಸುತ್ತಿಲ್ಲ: ನಮ್ಮ ಮಾಹಿತಿ ಹಳೆಯದಾಗಿದೆ)',
};
/**
 * Remove money figures we are no longer entitled to quote.
 * `keep` holds values the person themselves confirmed (their income, their age): those are
 * their facts, not our cached ones, so they are never touched.
 */
function stripAmounts(text, language = 'en', keep = []) {
  const safe = new Set((keep || []).map((v) => Math.round(Number(v))).filter(Number.isFinite));
  return String(text).replace(AMOUNT_RE, (match) => {
    const value = Math.round(Number(String(match).replace(/[^0-9.]/g, '')) || 0);
    const scaleWord = /lakh|लाख|ಲಕ್ಷ|lac/i.test(match) ? 100000 : /crore|करोड़|ಕೋಟಿ/i.test(match) ? 10000000 : /thousand|हज़ार|ಸಾವಿರ/i.test(match) ? 1000 : 1;
    const scaled = value * scaleWord;
    if (safe.has(value) || safe.has(scaled)) return match;
    return STRIP_NOTE[language] || STRIP_NOTE.en;
  });
}

const MENTIONS_AMOUNT = /₹|rupee|रुपये|रुपए|ರೂಪಾಯಿ/i;

function guessKind(record) {
  if (record.deadline) return 'scholarship_deadline';
  // A scheme that quotes money ages like money, even though it also carries rules.
  const prose = [record.benefits, record.description, record.summary, record.content]
    .filter(Boolean)
    .map((f) => (typeof f === 'string' ? f : Object.values(f).join(' ')))
    .join(' ');
  if (record.eligibility || record.applyUrl || record.benefits) {
    return MENTIONS_AMOUNT.test(prose) ? 'scheme_amount' : 'scheme_rule';
  }
  if (record.category === 'health' || record.content) return 'health_advice';
  return 'general';
}

// ---------------------------------------------------------------- packs and deltas
/**
 * A pack is what the phone downloaded. The manifest is the phone's receipt:
 * which records, which version, and a hash so a partial download is detectable.
 */
function manifestOf(records, { generatedAt = new Date(), packId = null, typeOf = (r) => guessKind(r) } = {}) {
  const items = records.map((r) => ({
    slug: r.slug,
    type: typeOf(r),
    version: r.version || 1,
    hash: hash({ ...r, _id: undefined, __v: undefined }),
    asOf: r.asOf || r.verifiedAt || r.updatedAt || null,
    validUntil: r.validUntil || r.deadline || null,
    category: r.category || null,
  }));
  return {
    packId: packId || `pack_${hash(items)}`,
    generatedAt: new Date(generatedAt).toISOString(),
    count: items.length,
    items,
  };
}

/**
 * What must be sent to a phone that already has `known` ({ slug: hash }).
 * Records the phone does not have, records whose hash changed, and records that
 * vanished from the server (the phone must delete them, not keep them forever).
 */
function deltaFor(known = {}, records = [], { typeOf = (r) => guessKind(r) } = {}) {
  const have = known || {};
  const changed = [];
  const seen = new Set();
  for (const r of records) {
    if (!r || !r.slug) continue;
    seen.add(r.slug);
    const h = hash({ ...r, _id: undefined, __v: undefined });
    if (have[r.slug] !== h) changed.push({ ...r, _hash: h, _type: typeOf(r) });
  }
  const removed = Object.keys(have).filter((slug) => !seen.has(slug));
  return { changed, removed, unchanged: Object.keys(have).length - removed.length };
}

// ---------------------------------------------------------------- "what changed"
const CHANGE_TEXT = {
  en: (name, from, to) => `${name}: ${from} → ${to}`,
  hi: (name, from, to) => `${name}: ${from} → ${to}`,
  kn: (name, from, to) => `${name}: ${from} → ${to}`,
};
const HEAD = {
  en: (n) => (n === 1 ? 'One thing changed since you downloaded this:' : `${n} things changed since you downloaded this:`),
  hi: (n) => `डाउनलोड के बाद ${n} चीज़ें बदलीं:`,
  kn: (n) => `ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಮೇಲೆ ${n} ವಿಷಯಗಳು ಬದಲಾಗಿವೆ:`,
};
const FIELD_LABEL = {
  maxAnnualIncome: { en: 'Yearly income limit', hi: 'वार्षिक आय सीमा', kn: 'ವಾರ್ಷಿಕ ಆದಾಯ ಮಿತಿ' },
  minAge: { en: 'Minimum age', hi: 'न्यूनतम आयु', kn: 'ಕನಿಷ್ಠ ವಯಸ್ಸು' },
  maxAge: { en: 'Maximum age', hi: 'अधिकतम आयु', kn: 'ಗರಿಷ್ಠ ವಯಸ್ಸು' },
  amount: { en: 'Amount', hi: 'रकम', kn: 'ಮೊತ್ತ' },
  deadline: { en: 'Last date', hi: 'अंतिम तिथि', kn: 'ಕೊನೆಯ ದಿನಾಂಕ' },
  benefits: { en: 'Benefit', hi: 'फ़ायदा', kn: 'ಪ್ರಯೋಜನ' },
};

const nameOf = (r, language) => (r && r.name ? r.name[language] || r.name.en : r && r.title ? r.title[language] || r.title.en : r && r.slug) || '';

/**
 * Diff one record the phone had against the same record now.
 * Structured rules are compared key by key; prose is compared by the NUMBERS in it,
 * because a number that moved is the change that costs money.
 */
function diffRecords(oldRec, newRec, { language = 'en' } = {}) {
  const changes = [];
  if (!oldRec) return { slug: newRec && newRec.slug, changes, isNew: true };
  if (!newRec) return { slug: oldRec.slug, changes, isRemoved: true };

  const push = (field, from, to, kind = 'value') => {
    if (String(from) === String(to)) return;
    changes.push({ field, kind, from, to });
  };

  // 1. structured eligibility rules
  const oe = oldRec.eligibility || {};
  const ne = newRec.eligibility || {};
  for (const key of new Set([...Object.keys(oe), ...Object.keys(ne)])) {
    const a = oe[key];
    const b = ne[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    if (Array.isArray(a) || Array.isArray(b)) push(key, (a || []).join(', '), (b || []).join(', '));
    else push(key, a === undefined ? '—' : a, b === undefined ? '—' : b, 'value'); // structured: no ₹ guessed
  }

  // 2. deadline
  if (oldRec.deadline || newRec.deadline) push('deadline', String(oldRec.deadline || '—').slice(0, 10), String(newRec.deadline || '—').slice(0, 10), 'date');

  // 3. numbers inside prose, per language, compared as a multiset
  for (const field of ['benefits', 'description', 'summary', 'content']) {
    const a = oldRec[field];
    const b = newRec[field];
    if (!a || !b) continue;
    for (const lang of Object.keys(b)) {
      if (typeof b[lang] !== 'string' || !a[lang]) continue;
      const na = parseNumbers(a[lang]).filter((n) => n.value >= 100).map((n) => n.value);
      const nb = parseNumbers(b[lang]).filter((n) => n.value >= 100).map((n) => n.value);
      if (!na.length && !nb.length) continue;
      const sa = [...new Set(na)].sort((x, y) => x - y).join(',');
      const sb = [...new Set(nb)].sort((x, y) => x - y).join(',');
      if (sa !== sb) {
        changes.push({
          field, kind: 'number', language: lang,
          from: sa, to: sb,
          fromValues: [...new Set(na)], toValues: [...new Set(nb)],
        });
        break; // one language is enough to know the fact changed
      }
    }
  }
  return { slug: newRec.slug || oldRec.slug, changes };
}

const groupIndian = (n) => {
  const s = String(Math.round(Number(n)));
  if (s.length <= 3) return s;
  return `${s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${s.slice(-3)}`;
};

/** Turn diffs into the one card that matters: what changed, in money terms. */
function whatChanged(diffs, { language = 'en', names = {} } = {}) {
  const lang = HEAD[language] ? language : 'en';
  const lines = [];
  let moneyChanged = false;
  for (const d of diffs) {
    const name = names[d.slug] ? names[d.slug][lang] || names[d.slug].en : d.slug;
    if (d.isNew) { lines.push(CHANGE_TEXT[lang](name, '—', lang === 'hi' ? 'नया' : lang === 'kn' ? 'ಹೊಸದು' : 'new')); continue; }
    if (d.isRemoved) { lines.push(CHANGE_TEXT[lang](name, '—', lang === 'hi' ? 'हटा दिया गया' : lang === 'kn' ? 'ತೆಗೆದುಹಾಕಲಾಗಿದೆ' : 'removed')); continue; }
    for (const c of d.changes) {
      const label = FIELD_LABEL[c.field] ? FIELD_LABEL[c.field][lang] || FIELD_LABEL[c.field].en : c.field;
      let from = c.from;
      let to = c.to;
      if (c.kind === 'number') {
        moneyChanged = true;
        from = `₹${groupIndian(c.fromValues[0])}`;
        to = `₹${groupIndian(c.toValues[0])}`;
      } else if (c.kind === 'date') {
        from = String(from).slice(0, 10);
        to = String(to).slice(0, 10);
      } else if (typeof c.from === 'number' || typeof c.to === 'number') {
        from = groupIndian(c.from);
        to = groupIndian(c.to);
      }
      lines.push(CHANGE_TEXT[lang](`${name} — ${label}`, from, to));
    }
  }
  return {
    count: lines.length,
    moneyChanged,
    headline: lines.length ? HEAD[lang](lines.length) : null,
    lines,
    text: lines.length ? `${HEAD[lang](lines.length)}\n${lines.join('\n')}` : null,
  };
}

module.exports = {
  POLICY, DAY, freshnessOf, disclosureText, applyToAnswer, stripAmounts,
  manifestOf, deltaFor, diffRecords, whatChanged, hash, guessKind, worst,
};
