/**
 * Knowledge-pack freshness — hurdle 1.
 *
 * "The information on the phone was correct on the day it was downloaded."
 * So the server publishes a content fingerprint (packVersion) plus, for every
 * entry, the date it was last checked (asOf) and which facts move (amount,
 * deadline, eligibility). That lets the app say three different things:
 *
 *   - your copy is N days old (compare)
 *   - exactly which answers changed since your copy was made (changesSince)
 *   - this particular answer is volatile, so verify it here (recheckFor)
 *
 * All timestamps are deterministic seed data, not boot time, so a restart does
 * not make every phone think everything changed.
 */
const crypto = require('crypto');

const MAX_AGE_DAYS = Number(process.env.PACK_MAX_AGE_DAYS) || 14;
const BOOT_TIME = new Date().toISOString();
const STRIP = new Set(['_id', '__v', 'createdAt', 'updatedAt']);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).filter((k) => !STRIP.has(k)).sort()
      .reduce((acc, k) => { acc[k] = stable(value[k]); return acc; }, {});
  }
  return value;
}

async function buildManifest(store) {
  const [schemes, knowledge] = await Promise.all([store.schemes.all(), store.knowledge.all()]);
  const hash = crypto.createHash('sha1').update(JSON.stringify(stable({ schemes, knowledge }))).digest('hex').slice(0, 12);
  const stamps = [...schemes, ...knowledge].map((d) => d.updatedAt || d.asOf).filter(Boolean).map((d) => new Date(d).getTime());
  const asOf = stamps.length ? new Date(Math.max(...stamps)).toISOString() : BOOT_TIME;
  const volatile = [...schemes, ...knowledge].filter((d) => d.volatile).length;
  return {
    packVersion: hash,
    contentAsOf: asOf,
    schemes: schemes.length,
    knowledge: knowledge.length,
    volatileEntries: volatile,
    languages: ['en', 'hi', 'kn'],
    maxAgeDays: MAX_AGE_DAYS,
    serverTime: new Date().toISOString(),
  };
}

const MESSAGES = {
  outdated: {
    en: 'Scheme rules or amounts may have changed since your information was downloaded. Please confirm at the Gram Panchayat or the official portal before acting.',
    hi: 'आपकी जानकारी डाउनलोड होने के बाद योजना के नियम या राशि बदल सकते हैं। कदम उठाने से पहले ग्राम पंचायत या आधिकारिक पोर्टल पर पुष्टि करें।',
    kn: 'ನಿಮ್ಮ ಮಾಹಿತಿ ಡೌನ್‌ಲೋಡ್ ಆದ ನಂತರ ಯೋಜನೆಯ ನಿಯಮ ಅಥವಾ ಮೊತ್ತ ಬದಲಾಗಿರಬಹುದು. ಮುಂದುವರಿಯುವ ಮೊದಲು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
  },
  current: {
    en: 'Your information is up to date with the server.',
    hi: 'आपकी जानकारी सर्वर के अनुसार नई है।',
    kn: 'ನಿಮ್ಮ ಮಾಹಿತಿ ಸರ್ವರ್‌ನೊಂದಿಗೆ ನವೀಕೃತವಾಗಿದೆ.',
  },
  unknown: {
    en: 'This answer may be out of date. Amounts and dates change; confirm on the official portal.',
    hi: 'यह उत्तर पुराना हो सकता है। राशि और तारीखें बदलती हैं; आधिकारिक पोर्टल पर पुष्टि करें।',
    kn: 'ಈ ಉತ್ತರ ಹಳೆಯದಾಗಿರಬಹುದು. ಮೊತ್ತ ಮತ್ತು ದಿನಾಂಕಗಳು ಬದಲಾಗುತ್ತವೆ; ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
  },
};

/** Compare what the phone holds with what the server holds. */
function compare(manifest, { packVersion, downloadedAt } = {}) {
  const ageDays = downloadedAt && !Number.isNaN(Date.parse(downloadedAt))
    ? Math.floor((Date.now() - Date.parse(downloadedAt)) / 86400000) : null;
  const versionKnown = Boolean(packVersion);
  const behind = versionKnown && packVersion !== manifest.packVersion;
  const tooOld = ageDays !== null && ageDays > manifest.maxAgeDays;
  const stale = behind || tooOld;
  let status = 'unknown';
  if (stale) status = 'stale';
  else if (versionKnown) status = 'current';
  return {
    status,
    stale,
    behind,
    tooOld,
    ageDays,
    downloadedAt: downloadedAt || null,
    clientVersion: packVersion || null,
    serverVersion: manifest.packVersion,
    contentAsOf: manifest.contentAsOf,
    volatileEntries: manifest.volatileEntries,
    refreshRecommended: stale || !versionKnown,
    message: MESSAGES[stale ? 'outdated' : status === 'current' ? 'current' : 'unknown'],
  };
}

const FIELD_WORDS = {
  amount: { en: 'amount', hi: 'राशि', kn: 'ಮೊತ್ತ' },
  deadline: { en: 'last date', hi: 'अंतिम तारीख', kn: 'ಕೊನೆಯ ದಿನಾಂಕ' },
  eligibility: { en: 'who can apply', hi: 'कौन पात्र है', kn: 'ಯಾರು ಅರ್ಹರು' },
  fees: { en: 'fees', hi: 'शुल्क', kn: 'ಶುಲ್ಕ' },
  procedure: { en: 'procedure', hi: 'प्रक्रिया', kn: 'ಕ್ರಮ' },
  contact: { en: 'helpline number', hi: 'हेल्पलाइन नंबर', kn: 'ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆ' },
};

function fieldList(fields, lang) {
  return (fields || []).map((f) => (FIELD_WORDS[f] ? FIELD_WORDS[f][lang] || FIELD_WORDS[f].en : f)).join(', ');
}

/** Trilingual "what changed" sentence for one entry. */
function changeSummary(entry, lang) {
  const fields = fieldList(entry.volatileFacts, lang);
  const asOf = entry.asOf;
  if (lang === 'hi') {
    return `${entry.title.hi || entry.title.en} — ${asOf} को फिर से जाँचा गया। ${fields ? `${fields} बदल सकते हैं, ` : ''}कदम उठाने से पहले पुष्टि करें।`;
  }
  if (lang === 'kn') {
    return `${entry.title.kn || entry.title.en} — ${asOf} ರಂದು ಮತ್ತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ${fields ? `${fields} ಬದಲಾಗಿರಬಹುದು, ` : ''}ಮುಂದುವರಿಯುವ ಮೊದಲು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`;
  }
  return `${entry.title.en} — re-checked on ${asOf}. ${fields ? `The ${fields} may have changed, ` : ''}so confirm before you act.`;
}

/**
 * GET /api/knowledge/changes?downloadedAt=<ISO>&have=<packVersion>
 *
 * The honest answer to "what changed since my copy": every entry whose content
 * was re-checked after the phone downloaded its pack. No history table is
 * needed, because each entry carries the date it was checked.
 */
async function changesSince(store, { downloadedAt, packVersion, limit = 40 } = {}) {
  const [schemes, knowledge] = await Promise.all([store.schemes.all(), store.knowledge.all()]);
  const manifest = await buildManifest(store);
  const cutoffMs = downloadedAt && !Number.isNaN(Date.parse(downloadedAt)) ? Date.parse(downloadedAt) : null;
  const versionBehind = Boolean(packVersion) && packVersion !== manifest.packVersion;

  const entries = [
    ...schemes.map((s) => ({
      id: s.id,
      type: 'scheme',
      category: s.category || 'schemes',
      title: s.name,
      asOf: s.asOf,
      volatileFacts: s.volatileFacts || [],
      volatile: Boolean(s.volatile),
      verifyUrl: s.verifyUrl || null,
      verifyAt: s.verifyAt || null,
      updatedAt: s.updatedAt || s.asOf,
    })),
    ...knowledge.map((k) => ({
      id: k.id,
      type: 'knowledge',
      category: k.category,
      title: k.question,
      asOf: k.asOf,
      volatileFacts: k.volatileFacts || [],
      volatile: Boolean(k.volatile),
      verifyUrl: k.verifyUrl || null,
      verifyAt: k.verifyAt || null,
      updatedAt: k.updatedAt || k.asOf,
    })),
  ];

  let changed;
  let basis;
  if (cutoffMs !== null) {
    changed = entries.filter((e) => e.updatedAt && Date.parse(e.updatedAt) > cutoffMs);
    basis = 'checked-after-download';
  } else if (versionBehind) {
    // We cannot diff an unknown pack, so point the user at everything that can
    // move rather than pretending nothing changed.
    changed = entries.filter((e) => e.volatile);
    basis = 'volatile-only';
  } else {
    changed = [];
    basis = 'nothing-known';
  }

  changed.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const trimmed = changed.slice(0, Math.min(Number(limit) || 40, 200)).map((e) => ({
    id: e.id,
    type: e.type,
    category: e.category,
    title: e.title,
    asOf: e.asOf,
    changedFields: e.volatileFacts,
    verifyUrl: e.verifyUrl,
    verifyAt: e.verifyAt,
    summary: {
      en: changeSummary(e, 'en'),
      hi: changeSummary(e, 'hi'),
      kn: changeSummary(e, 'kn'),
    },
  }));

  return {
    downloadedAt: downloadedAt || null,
    clientVersion: packVersion || null,
    serverVersion: manifest.packVersion,
    versionBehind,
    basis,
    changedCount: changed.length,
    returned: trimmed.length,
    contentAsOf: manifest.contentAsOf,
    changes: trimmed,
    message: {
      en: changed.length
        ? `${changed.length} answer(s) have been re-checked since your copy was made. Open them before you act.`
        : 'Nothing has changed since your copy was made.',
      hi: changed.length
        ? `आपकी कॉपी बनने के बाद ${changed.length} उत्तर फिर से जाँचे गए हैं। कदम उठाने से पहले उन्हें देखें।`
        : 'आपकी कॉपी बनने के बाद कुछ नहीं बदला।',
      kn: changed.length
        ? `ನಿಮ್ಮ ಪ್ರತಿ ತಯಾರಾದ ನಂತರ ${changed.length} ಉತ್ತರಗಳನ್ನು ಮತ್ತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮುಂದುವರಿಯುವ ಮೊದಲು ಅವುಗಳನ್ನು ನೋಡಿ.`
        : 'ನಿಮ್ಮ ಪ್ರತಿ ತಯಾರಾದ ನಂತರ ಏನೂ ಬದಲಾಗಿಲ್ಲ.',
    },
  };
}

/**
 * Per-answer re-check block. Attached to any answer that comes from an entry
 * whose facts move, so the screen can show "checked on <date> — verify here"
 * and, when the entry was re-checked after the download, say so outright.
 */
function recheckFor(entry, freshness, { downloadedAt } = {}) {
  if (!entry) return undefined;
  const volatile = Boolean(entry.volatile);
  const asOf = entry.asOf || null;
  const changedSinceDownload = Boolean(
    downloadedAt && asOf && Date.parse(`${asOf}T00:00:00.000Z`) > Date.parse(downloadedAt),
  );
  if (!volatile && !changedSinceDownload) return undefined;
  const fields = fieldList(entry.volatileFacts, 'en');
  const title = entry.matchedQuestion || null;
  return {
    volatile,
    changedSinceDownload,
    asOf,
    changedFields: entry.volatileFacts || [],
    verifyUrl: entry.verifyUrl || null,
    verifyAt: entry.verifyAt || null,
    stale: Boolean(freshness && freshness.stale),
    message: {
      en: changedSinceDownload
        ? `This answer was re-checked on ${asOf}, after your copy was made${fields ? ` — the ${fields} may be different` : ''}. Confirm at ${entry.verifyAt || 'the official portal'} before acting.`
        : `Last checked on ${asOf}${fields ? `; the ${fields} can change` : ''}. Confirm at ${entry.verifyAt || 'the official portal'} before acting.`,
      hi: changedSinceDownload
        ? `यह उत्तर ${asOf} को फिर से जाँचा गया, आपकी कॉपी बनने के बाद${fields ? ` — ${fieldList(entry.volatileFacts, 'hi')} बदल सकती है` : ''}। कदम उठाने से पहले ${entry.verifyAt || 'आधिकारिक पोर्टल'} पर पुष्टि करें।`
        : `${asOf} को जाँचा गया${fields ? `; ${fieldList(entry.volatileFacts, 'hi')} बदल सकती है` : ''}। कदम उठाने से पहले ${entry.verifyAt || 'आधिकारिक पोर्टल'} पर पुष्टि करें।`,
      kn: changedSinceDownload
        ? `ಈ ಉತ್ತರವನ್ನು ${asOf} ರಂದು ಮತ್ತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ, ನಿಮ್ಮ ಪ್ರತಿ ತಯಾರಾದ ನಂತರ${fields ? ` — ${fieldList(entry.volatileFacts, 'kn')} ಬದಲಾಗಿರಬಹುದು` : ''}. ಮುಂದುವರಿಯುವ ಮೊದಲು ${entry.verifyAt || 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್'} ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`
        : `${asOf} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ${fields ? `; ${fieldList(entry.volatileFacts, 'kn')} ಬದಲಾಗಬಹುದು` : ''}. ಮುಂದುವರಿಯುವ ಮೊದಲು ${entry.verifyAt || 'ಅಧಿಕೃತ ಪೋರ್ಟಲ್'} ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`,
    },
  };
}

module.exports = {
  buildManifest,
  compare,
  changesSince,
  recheckFor,
  MESSAGES,
  MAX_AGE_DAYS,
  fieldList,
};
