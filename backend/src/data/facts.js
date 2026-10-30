/**
 * Which facts go stale, and where the user can check them.
 *
 * Hurdle 1 in one line: "the information on the phone was correct on the day it
 * was downloaded". So every entry carries:
 *
 *   asOf          the date this rule/amount was last checked by a human
 *   volatileFacts what can change — amount, deadline, eligibility, contact
 *   verifyUrl     the official page where the user can confirm it (only where
 *                 we are confident of the official domain)
 *   verifyAt      who to ask when there is no single official page
 *
 * Nothing here is a guess about content: these are metadata about how quickly a
 * fact moves. Money, deadlines and eligibility move; how to treat a snake bite
 * does not.
 */

const VERIFY = {
  'pm-kisan': { url: 'https://pmkisan.gov.in', at: 'PM-KISAN portal or the Gram Panchayat' },
  'ayushman-bharat': { url: 'https://pmjay.gov.in', at: 'PM-JAY portal or the Ayushman Arogya Mandir' },
  'pmjay-senior': { url: 'https://pmjay.gov.in', at: 'PM-JAY portal or the Ayushman Arogya Mandir' },
  pmfby: { url: 'https://pmfby.gov.in', at: 'crop insurance portal, bank or agriculture office' },
  mgnrega: { url: 'https://nrega.nic.in', at: 'Gram Panchayat or the MGNREGA portal' },
  'pmay-g': { url: 'https://pmayg.nic.in', at: 'Gram Panchayat or the PMAY-G portal' },
  ujjwala: { url: 'https://www.pmuy.gov.in', at: 'the gas agency or the Ujjwala portal' },
  'ration-card': { url: 'https://nfsa.gov.in', at: 'the taluk food and civil supplies office' },
  'mudra-loan': { url: 'https://www.mudra.org.in', at: 'the bank branch or the Mudra portal' },
  'sukanya-samriddhi': { url: null, at: 'the post office or the authorised bank' },
  'kb-scheme-pension': { url: 'https://nsap.nic.in', at: 'the Gram Panchayat or the social welfare office' },
  'kb-scheme-pm-kisan': { url: 'https://pmkisan.gov.in', at: 'the PM-KISAN portal or the Gram Panchayat' },
  'kb-scheme-ayushman': { url: 'https://pmjay.gov.in', at: 'the PM-JAY portal or the Ayushman Arogya Mandir' },
  'kb-scheme-mgnrega': { url: 'https://nrega.nic.in', at: 'the Gram Panchayat or the MGNREGA portal' },
  'kb-scheme-ujjwala': { url: 'https://www.pmuy.gov.in', at: 'the gas agency or the Ujjwala portal' },
  'kb-scheme-housing': { url: 'https://pmayg.nic.in', at: 'the Gram Panchayat or the PMAY-G portal' },
  'kb-scholarship-nsp': { url: 'https://scholarships.gov.in', at: 'the National Scholarship Portal' },
  'kb-scholarship-prematric': { url: 'https://scholarships.gov.in', at: 'the school or the National Scholarship Portal' },
  'kb-scholarship-postmatric': { url: 'https://scholarships.gov.in', at: 'the college scholarship section or the portal' },
  'kb-scholarship-girls': { url: 'https://scholarships.gov.in', at: 'the school, college or the scholarship portal' },
  'kb-scholarship-minority': { url: 'https://scholarships.gov.in', at: 'the minority cell of the school or college' },
  'kb-scholarship-deadline': { url: 'https://scholarships.gov.in', at: 'the scholarship portal or the institute' },
  'kb-agri-pmfby': { url: 'https://pmfby.gov.in', at: 'the bank, insurance company or agriculture office' },
  'kb-agri-soil-health': { url: null, at: 'the Raitha Samparka Kendra or the agriculture officer' },
  'kb-agri-kcc': { url: null, at: 'the bank branch' },
  'kb-agri-msp-mandi': { url: null, at: 'the mandi board or the agriculture marketing office' },
  'kb-agri-pest': { url: null, at: 'the Raitha Samparka Kendra or the Krishi Vigyan Kendra' },
  'kb-doc-aadhaar': { url: 'https://uidai.gov.in', at: 'the Aadhaar enrolment centre or uidai.gov.in' },
  'kb-doc-caste-certificate': { url: null, at: 'the taluk office or the state e-District portal' },
  'kb-doc-income-certificate': { url: null, at: 'the taluk office or the state e-District portal' },
  'kb-doc-ration-card': { url: 'https://nfsa.gov.in', at: 'the taluk food and civil supplies office' },
  'kb-fin-dbt': { url: 'https://dbtbharat.gov.in', at: 'the scheme portal or the bank branch' },
  'kb-fin-bank-account': { url: null, at: 'any bank branch or the Bank Mitra point' },
  'kb-fin-shg-loan': { url: 'https://www.mudra.org.in', at: 'the bank branch or the RSETI office' },
  'kb-fin-insurance': { url: null, at: 'the bank branch' },
  'kb-edu-rte-admission': { url: null, at: 'the Block Education Office or the state RTE portal' },
  'kb-scam-kyc-upi': { url: 'https://cybercrime.gov.in', at: 'the cyber crime helpline 1930 or cybercrime.gov.in' },
  'kb-scam-loan-app': { url: 'https://cybercrime.gov.in', at: 'the cyber crime helpline 1930 or the RBI Sachet portal' },
  'kb-scam-fake-officer': { url: 'https://cybercrime.gov.in', at: 'the cyber crime helpline 1930' },
  'kb-scam-report': { url: 'https://cybercrime.gov.in', at: 'the cyber crime helpline 1930' },
  'kb-emergency-ambulance': { url: null, at: '108 for an ambulance, 112 for any emergency' },
  'kb-emergency-women-child': { url: null, at: '181 for women, 1098 for children' },
  'kb-general-land-records': { url: null, at: 'the taluk office or the state land records portal' },
  'kb-general-gram-panchayat': { url: null, at: 'the Gram Panchayat office' },
  'kb-health-mental-health': { url: null, at: 'Tele-MANAS 14416 or the health centre' },

  // --- added with knowledge-extra-3 and catalog-extra -----------------------
  eshram: { url: 'https://eshram.gov.in', at: 'the eShram portal or a Common Service Centre' },
  'pm-vishwakarma': { url: 'https://pmvishwakarma.gov.in', at: 'the PM Vishwakarma portal or a Common Service Centre' },
  'jal-jeevan': { url: 'https://jaljeevanmission.gov.in', at: 'the Gram Panchayat or the Jal Jeevan Mission portal' },
  'pm-surya-ghar': { url: 'https://pmsuryaghar.gov.in', at: 'the PM Surya Ghar portal or the state electricity company' },
  nmmss: { url: 'https://scholarships.gov.in', at: 'the school or the National Scholarship Portal' },
  'post-matric-disability': { url: 'https://scholarships.gov.in', at: 'the institution or the National Scholarship Portal' },
  'kb-health-dog-bite': { url: null, at: 'the nearest government hospital or the health worker' },
  'kb-health-delivery': { url: null, at: 'the ASHA worker or the nearest health centre' },
  'kb-health-child-nutrition': { url: null, at: 'the Anganwadi worker or the health centre' },
  'kb-health-teleconsultation': { url: 'https://esanjeevani.mohfw.gov.in', at: 'eSanjeevani or the Ayushman Arogya Mandir' },
  'kb-scheme-eshram': { url: 'https://eshram.gov.in', at: 'the eShram portal or a Common Service Centre' },
  'kb-scheme-vishwakarma': { url: 'https://pmvishwakarma.gov.in', at: 'the PM Vishwakarma portal or a Common Service Centre' },
  'kb-scheme-jal-jeevan': { url: 'https://jaljeevanmission.gov.in', at: 'the Gram Panchayat or the village water committee' },
  'kb-scheme-solar': { url: 'https://pmsuryaghar.gov.in', at: 'the PM Surya Ghar portal or the state electricity company' },
  'kb-scheme-poshan': { url: null, at: 'the Anganwadi worker or the school' },
  'kb-scheme-disability': { url: 'https://www.swavlambancard.gov.in', at: 'the UDID portal or the district hospital' },
  'kb-doc-birth-death': { url: null, at: 'the Gram Panchayat or the municipal office' },
  'kb-doc-voter-id': { url: 'https://voters.eci.gov.in', at: 'the voters portal or your Booth Level Officer' },
  'kb-doc-name-correction': { url: 'https://uidai.gov.in', at: 'the Aadhaar enrolment centre or uidai.gov.in' },
  'kb-agri-livestock': { url: null, at: 'the veterinary hospital or the animal husbandry office' },
  'kb-agri-natural-farming': { url: null, at: 'the Raitha Samparka Kendra or the agriculture officer' },
  'kb-agri-weather-advisory': { url: null, at: 'the Kisan Suvidha app or the agriculture office' },
  'kb-fin-upi-safety': { url: 'https://cybercrime.gov.in', at: 'the cyber crime helpline 1930 or your bank branch' },
  'kb-fin-post-office-savings': { url: null, at: 'the post office branch or the Bank Mitra point' },
  'kb-edu-skill-training': { url: 'https://www.skillindiadigital.gov.in', at: 'the District Skill Development Office or the Skill India portal' },
  'kb-edu-nios-open-school': { url: 'https://www.nios.ac.in', at: 'the NIOS website or an accredited institution' },
  'kb-emergency-cyclone-storm': { url: null, at: 'the district control room or the panchayat' },
  'kb-general-rti': { url: 'https://rtionline.gov.in', at: 'the Public Information Officer of that office' },
  'kb-general-legal-aid': { url: 'https://nalsa.gov.in', at: 'the District Legal Services Authority or helpline 15100' },
  'kb-general-complaint': { url: 'https://pgportal.gov.in', at: 'CPGRAMS or the district grievance office' },
  'kb-general-gram-sabha': { url: null, at: 'the panchayat secretary' },
};

/** What moves quickly in each category. Everything not listed is stable. */
const CATEGORY_FACTS = {
  schemes: ['amount', 'deadline', 'eligibility'],
  scholarships: ['amount', 'deadline', 'eligibility'],
  finance: ['amount', 'eligibility', 'contact'],
  agriculture: ['amount', 'deadline'],
  documents: ['fees', 'procedure'],
  education: ['eligibility', 'deadline'],
  health: ['contact'],
  emergency: ['contact'],
  scam: ['contact'],
  general: ['contact'],
};

/** Where to check a fact when there is no single official page for it. */
const CATEGORY_VERIFY_AT = {
  health: 'the nearest Health and Wellness Centre, your ASHA worker or helpline 104',
  emergency: 'the emergency numbers 112 and 108',
  scam: 'the cyber crime helpline 1930 or cybercrime.gov.in',
  schemes: 'the Gram Panchayat or the official portal',
  scholarships: 'the school, college or the National Scholarship Portal',
  agriculture: 'the Raitha Samparka Kendra or the agriculture officer',
  documents: 'the taluk office or the state e-District portal',
  finance: 'the bank branch',
  education: 'the school or the Block Education Office',
  general: 'the Gram Panchayat office',
};

/** Entries whose content is stable even though the category moves. */
const STABLE = new Set([
  'kb-health-dog-bite',
  'kb-health-first-aid',
  'kb-emergency-cyclone-storm',
  'kb-general-gram-sabha',
  'kb-agri-soil-health',
  'kb-agri-pest',
  'kb-general-gram-panchayat',
  'kb-health-snake-bite',
  'kb-health-diarrhoea',
  'kb-health-immunisation',
  'kb-health-heat-stroke',
  'kb-health-fever',
]);

/**
 * Dates the content was last checked. Grouped by when the guidance was reviewed,
 * so a single field stays honest instead of pretending to be real time.
 */
const CHECKED = {
  '2026-08-12': ['schemes', 'scholarships'],
  '2026-08-20': ['health', 'emergency'],
  '2026-09-02': ['agriculture', 'documents'],
  '2026-09-15': ['scam', 'finance'],
  '2026-09-20': ['education', 'general'],
};
const ASOF_BY_CATEGORY = (() => {
  const map = {};
  for (const [date, cats] of Object.entries(CHECKED)) cats.forEach((c) => { map[c] = date; });
  return map;
})();

/** Per-entry overrides where a single fact was re-checked later than its group. */
const ASOF_OVERRIDE = {
  'pm-kisan': '2026-09-28',
  'kb-scheme-pm-kisan': '2026-09-28',
  'kb-scholarship-nsp': '2026-09-25',
  'kb-scholarship-deadline': '2026-09-25',
  'kb-scheme-pension': '2026-09-22',
  'kb-fin-insurance': '2026-09-22',
};

/**
 * Everything added in the October coverage expansion was reviewed together on
 * this date, so it is stamped per entry rather than moving a whole category's
 * asOf (which would make old answers look freshly re-checked).
 */
const EXPANSION_ASOF = '2026-10-20';
for (const id of [
  'eshram', 'pm-vishwakarma', 'jal-jeevan', 'pm-surya-ghar', 'nmmss', 'post-matric-disability',
  'kb-health-dengue-malaria', 'kb-health-dog-bite', 'kb-health-delivery',
  'kb-health-child-nutrition', 'kb-health-first-aid', 'kb-health-teleconsultation',
  'kb-scheme-eshram', 'kb-scheme-vishwakarma', 'kb-scheme-jal-jeevan', 'kb-scheme-solar',
  'kb-scheme-poshan', 'kb-scheme-disability', 'kb-doc-birth-death', 'kb-doc-voter-id',
  'kb-doc-name-correction', 'kb-agri-livestock', 'kb-agri-natural-farming',
  'kb-agri-weather-advisory', 'kb-fin-upi-safety', 'kb-fin-post-office-savings',
  'kb-edu-skill-training', 'kb-edu-nios-open-school', 'kb-emergency-cyclone-storm',
  'kb-general-rti', 'kb-general-legal-aid', 'kb-general-complaint', 'kb-general-gram-sabha',
]) ASOF_OVERRIDE[id] = EXPANSION_ASOF;

/**
 * Facts for one entry.
 * @param {string} id  entry id (scheme key or knowledge key)
 * @param {string} category
 */
function factsFor(id, category) {
  const verify = VERIFY[id] || {};
  const volatileFacts = STABLE.has(id) ? [] : (CATEGORY_FACTS[category] || []);
  return {
    asOf: ASOF_OVERRIDE[id] || ASOF_BY_CATEGORY[category] || '2026-09-01',
    volatile: volatileFacts.length > 0,
    volatileFacts,
    verifyUrl: verify.url || null,
    verifyAt: verify.at || CATEGORY_VERIFY_AT[category] || 'your Gram Panchayat or the official portal',
  };
}

module.exports = { factsFor, VERIFY, CATEGORY_FACTS };
