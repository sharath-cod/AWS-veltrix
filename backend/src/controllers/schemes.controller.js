const AppError = require('../utils/AppError');
const { ok, okList } = require('../utils/respond');
const { filterDocs, pick } = require('../services/retrieval');

/**
 * GET /api/schemes?q=&category=
 * Trilingual government scheme catalogue.
 */
exports.list = async (req, res) => {
  const { q, category } = req.query;
  const all = await req.app.locals.store.schemes.all();
  let items = all;
  if (category && category !== 'all') items = items.filter((s) => s.category === category);
  if (q) items = filterDocs(items, q, 'scheme');
  okList(res, items, {
    category: category || 'all',
    query: q || null,
    categories: [...new Set(all.map((s) => s.category))].sort(),
    note: 'Seed catalogue, verified:false. Confirm amounts and dates on the official portal.',
  });
};

/** GET /api/schemes/:id */
exports.getOne = async (req, res) => {
  const scheme = await req.app.locals.store.schemes.get(req.params.id);
  if (!scheme) throw new AppError('Scheme not found', 404, 'NOT_FOUND');
  res.json({ success: true, data: scheme });
};

/**
 * General eligibility first pass. The Android screen currently sends only a
 * language, so a profile is optional; when fields are present a light rule set
 * gives an indicative result. Nothing here is an official determination.
 */
const RULES = {
  'pm-kisan': (p) => (p.landHoldingHa > 0 ? true : undefined),
  pmfby: (p) => (p.landHoldingHa > 0 ? true : undefined),
  mgnrega: (p) => (p.rural === false ? false : true),
  'pmay-g': (p) => (['kutcha', 'houseless'].includes(p.housing) ? true : undefined),
  ujjwala: (p) => (p.gender === 'female' ? true : undefined),
  'sukanya-samriddhi': (p) => (p.girlChildUnder10 ? true : undefined),
  'mudra-loan': (p) => (p.wantsBusiness ? true : undefined),
  'ayushman-bharat': (p) => (typeof p.annualIncome === 'number' ? p.annualIncome <= 250000 : undefined),
  'pmjay-senior': (p) => (typeof p.age === 'number' ? p.age >= 70 : undefined),
  'ration-card': () => true,
};

const DOCUMENTS = [
  'Aadhaar card',
  'Bank account in your own name, seeded with Aadhaar',
  'Ration card',
  'Income certificate from the taluk or tehsil office',
  'Caste or category certificate, where applicable',
  'Land records (RTC / khata) for farmer schemes',
  'Passport size photograph',
];

exports.check = async (req, res) => {
  const body = req.body || {};
  const language = ['en', 'hi', 'kn'].includes(body.language) ? body.language : 'en';
  const profileKeys = ['age', 'gender', 'annualIncome', 'landHoldingHa', 'housing', 'rural', 'girlChildUnder10', 'wantsBusiness'];
  const profileProvided = profileKeys.some((k) => body[k] !== undefined && body[k] !== null);

  const schemes = await req.app.locals.store.schemes.all();
  const results = schemes.map((scheme) => {
    const rule = RULES[scheme.id];
    const verdict = profileProvided && rule ? rule(body) : undefined;
    let status = 'needs_profile';
    if (verdict === true) status = 'likely';
    else if (verdict === false) status = 'unlikely';
    return {
      id: scheme.id,
      name: pick(scheme.name, language),
      status,
      reason:
        status === 'likely'
          ? 'The details you gave match this scheme at a first glance.'
          : status === 'unlikely'
            ? 'The details you gave do not match this scheme.'
            : 'Share a few more details to check this scheme.',
    };
  });

  const summary = {
    en: 'This is a general first pass only. Visit the Gram Panchayat or the official portal for a final decision.',
    hi: 'यह केवल एक सामान्य पहला अनुमान है। अंतिम निर्णय के लिए ग्राम पंचायत या आधिकारिक पोर्टल पर जाएं।',
    kn: 'ಇದು ಸಾಮಾನ್ಯ ಮೊದಲ ಅಂದಾಜು ಮಾತ್ರ. ಅಂತಿಮ ನಿರ್ಧಾರಕ್ಕೆ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ನೋಡಿ.',
  };

  ok(res, {
    language,
    profileProvided,
    summary: summary[language],
    documents: DOCUMENTS,
    counts: {
      likely: results.filter((r) => r.status === 'likely').length,
      needsProfile: results.filter((r) => r.status === 'needs_profile').length,
    },
    results,
    disclaimer: 'Indicative only, not an official eligibility decision.',
  });
};
