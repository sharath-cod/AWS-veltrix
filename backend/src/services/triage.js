/**
 * Safety triage for the call — the "unsure medical question" rule.
 *
 * The call is conversational, which makes it easy for someone to describe a
 * symptom and expect an answer. Two rules keep that safe:
 *
 *   1. Red flags never get a chat answer. Chest pain, breathlessness, heavy
 *      bleeding, fits, poisoning, a snake bite, a road accident, thoughts of
 *      self-harm: the call says call 108 now (or 14416 for mental-health
 *      crisis), gives the safest first thing to do, and stops there.
 *   2. Anything medical that the knowledge base does not clearly cover, and any
 *      question about how much medicine to take, is answered with "I am not
 *      sure, call 104 / 108" instead of a guess.
 *
 * Both rules are language-aware: the redirect sentence exists in every call
 * language, and first-aid text exists in English, Hindi and Kannada.
 */

const { text } = require('../data/languages');

/** Emergency numbers used by the call. */
const NUMBERS = {
  ambulance: { number: '108', label: 'Ambulance', labelHi: 'एम्बुलेंस', labelKn: 'ಆಂಬ್ಯುಲೆನ್ಸ್' },
  healthAdvice: { number: '104', label: 'Health advice', labelHi: 'स्वास्थ्य सलाह', labelKn: 'ಆರೋಗ್ಯ ಸಲಹೆ' },
  allEmergency: { number: '112', label: 'All emergencies', labelHi: 'सभी आपातकाल', labelKn: 'ಎಲ್ಲಾ ತುರ್ತು' },
  mentalHealth: { number: '14416', label: 'Tele-MANAS mental health', labelHi: 'टेली-मानस मानसिक स्वास्थ्य', labelKn: 'ಟೆಲಿ-ಮಾನಸ್ ಮಾನಸಿಕ ಆರೋಗ್ಯ' },
};

/**
 * Red flags. `forms` are matched against the normalised transcript, so a
 * romanised, Devanagari or Kannada spelling all work.
 */
const RED_FLAGS = [
  {
    id: 'chest-pain',
    label: { en: 'chest pain', hi: 'छाती में दर्द', kn: 'ಎದೆ ನೋವು' },
    forms: ['chest pain', 'chest tightness', 'seene mein dard', 'chhati mein dard', 'sine me dard', 'छाती में दर्द', 'सीने में दर्द', 'ಎದೆ ನೋವು', 'ಎದೆನೋವು'],
    firstAid: {
      en: 'Sit the person up, keep them calm, and if you have aspirin let them chew one tablet unless they are allergic.',
      hi: 'मरीज़ को बैठाइए, उन्हें शांत रखिए, और अगर एस्पिरिन है और एलर्जी नहीं है तो एक गोली चबाने को दें।',
      kn: 'ರೋಗಿಯನ್ನು ಕುಳಿತುಕೊಳ್ಳಿಸಿ, ಶಾಂತವಾಗಿರಿಸಿ, ಮತ್ತು ಅಲರ್ಜಿ ಇಲ್ಲದಿದ್ದರೆ ಒಂದು ಆಸ್ಪಿರಿನ್ ಮಾತ್ರೆ ಜಗಿಯಲು ಕೊಡಿ.',
    },
  },
  {
    id: 'breathing',
    label: { en: 'difficulty breathing', hi: 'सांस लेने में तकलीफ', kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ' },
    forms: ['breathless', 'cannot breathe', 'can not breathe', 'difficulty breathing', 'difficulty in breathing', 'breathing trouble', 'saans nahi', 'saans phool', 'saans lene', 'taklif', 'दम घुट', 'सांस नहीं', 'सांस फूल', 'सांस लेने', 'तकलीफ', 'तकलीफ़', 'ಉಸಿರಾಟ', 'ಉಸಿರು', 'ಉಸಿರಾಟದ ತೊಂದರೆ'],
    firstAid: {
      en: 'Make them sit upright, loosen tight clothes, and open the windows.',
      hi: 'मरीज़ को सीधा बैठाइए, तंग कपड़े ढीले कीजिए और खिड़कियां खोलिए।',
      kn: 'ರೋಗಿಯನ್ನು ನೇರವಾಗಿ ಕುಳಿತುಕೊಳ್ಳಿಸಿ, ಬಿಗಿಯಾದ ಬಟ್ಟೆ ಸಡಿಲ ಮಾಡಿ, ಕಿಟಕಿ ತೆರೆಯಿರಿ.',
    },
  },
  {
    id: 'unconscious-fits',
    label: { en: 'unconsciousness or fits', hi: 'बेहोशी या दौरा', kn: 'ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು ಅಥವಾ ಫಿಟ್ಸ್' },
    forms: ['unconscious', 'behosh', 'बेहोश', 'fits', 'daurа', 'daura', 'दौरा', 'मिर्गी', 'mirgi', 'convulsion', 'seizure', 'ಪ್ರಜ್ಞೆ ತಪ್ಪ', 'ಮೂರ್ಛೆ', 'ಫಿಟ್ಸ್', 'ಸೆಳವು'],
    firstAid: {
      en: 'Lay them on their side so they do not choke, put nothing in the mouth, and time how long the fit lasts.',
      hi: 'मरीज़ को करवट पर लिटाइए ताकि दम न घुटे, मुंह में कुछ न डालिए, और दौरा कितनी देर रहा यह देखिए।',
      kn: 'ಉಸಿರು ಕಟ್ಟದಂತೆ ಅವರನ್ನು ಪಕ್ಕಕ್ಕೆ ಮಲಗಿಸಿ, ಬಾಯಿಗೆ ಏನನ್ನೂ ಹಾಕಬೇಡಿ, ಮತ್ತು ಸೆಳವು ಎಷ್ಟು ಸಮಯ ಇತ್ತು ಎಂದು ಗಮನಿಸಿ.',
    },
  },
  {
    id: 'bleeding',
    label: { en: 'heavy bleeding', hi: 'बहुत खून बहना', kn: 'ಹೆಚ್ಚು ರಕ್ತಸ್ರಾವ' },
    forms: ['heavy bleeding', 'bleeding a lot', 'blood loss', 'khoon beh', 'khoon bah', 'खून बह', 'खून निकल', 'ರಕ್ತಸ್ರಾವ', 'ರಕ್ತ ಹರಿ'],
    firstAid: {
      en: 'Press hard on the wound with a clean cloth and keep pressing; do not remove the cloth, add another on top.',
      hi: 'घाव पर साफ कपड़े से ज़ोर से दबाएं और दबाते रहें; कपड़ा हटाइए नहीं, ऊपर से दूसरा लगाइए।',
      kn: 'ಗಾಯದ ಮೇಲೆ ಸ್ವಚ್ಛ ಬಟ್ಟೆಯಿಂದ ಗಟ್ಟಿಯಾಗಿ ಒತ್ತಿ ಹಿಡಿಯಿರಿ; ಬಟ್ಟೆ ತೆಗೆಯಬೇಡಿ, ಮೇಲೆ ಇನ್ನೊಂದು ಹಾಕಿ.',
    },
  },
  {
    id: 'stroke',
    label: { en: 'signs of a stroke', hi: 'लकवे के लक्षण', kn: 'ಪಾರ್ಶ್ವವಾಯು ಚಿಹ್ನೆಗಳು' },
    forms: ['stroke', 'lakwa', 'लकवा', 'paralysis', 'face droop', 'slurred speech', 'munh tedha', 'मुंह टेढ़ा', 'ಪಾರ್ಶ್ವವಾಯು', 'ಮುಖ ವಾಲುವುದು'],
    firstAid: {
      en: 'Note the exact time it started, keep them lying with the head slightly raised, and give nothing by mouth.',
      hi: 'कब शुरू हुआ यह समय लिखिए, सिर थोड़ा ऊंचा रखकर लिटाइए, और मुंह से कुछ न दें।',
      kn: 'ಯಾವ ಸಮಯಕ್ಕೆ ಪ್ರಾರಂಭವಾಯಿತು ಎಂದು ಬರೆದಿಡಿ, ತಲೆ ಸ್ವಲ್ಪ ಎತ್ತರವಾಗಿ ಮಲಗಿಸಿ, ಬಾಯಿಯಿಂದ ಏನೂ ಕೊಡಬೇಡಿ.',
    },
  },
  {
    id: 'burns',
    label: { en: 'a serious burn', hi: 'गंभीर जलना', kn: 'ತೀವ್ರ ಸುಟ್ಟ ಗಾಯ' },
    forms: ['burnt', 'severe burn', 'jal gaya', 'jal gayi', 'जल गया', 'जल गई', 'सुट्ट', 'ಸುಟ್ಟು', 'ಬೆಂಕಿ ಆಕಸ್ಮಿಕ'],
    firstAid: {
      en: 'Pour cool running water for twenty minutes; do not apply oil, paste or ash, and do not burst blisters.',
      hi: 'बीस मिनट तक ठंडा बहता पानी डालिए; तेल, पेस्ट या राख न लगाइए, और छाले न फोड़िए।',
      kn: 'ಇಪ್ಪತ್ತು ನಿಮಿಷ ತಣ್ಣನೆಯ ಹರಿಯುವ ನೀರು ಸುರಿಯಿರಿ; ಎಣ್ಣೆ, ಪೇಸ್ಟ್ ಅಥವಾ ಬೂದಿ ಹಚ್ಚಬೇಡಿ, ಗುಳ್ಳೆ ಒಡೆಯಬೇಡಿ.',
    },
  },
  {
    id: 'snake-bite',
    label: { en: 'a snake bite', hi: 'सांप का काटना', kn: 'ಹಾವು ಕಡಿತ' },
    forms: ['snake bite', 'snake bit', 'saap ne kaata', 'saanp ne kaata', 'saap kaata', 'सांप ने काटा', 'सर्प', 'ಹಾವು ಕಡಿ', 'ಹಾವು ಕಚ್ಚ'],
    firstAid: {
      en: 'Keep the limb still and below heart level, remove rings and bangles, and do not cut or suck the wound.',
      hi: 'अंग को स्थिर और दिल से नीचे रखिए, अंगूठी-चूड़ी निकालिए, और घाव को चीरा न लगाइए या मुंह से न चूसिए।',
      kn: 'ಅಂಗವನ್ನು ಚಲಿಸದಂತೆ ಹೃದಯದ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗೆ ಇರಿಸಿ, ಉಂಗುರ-ಬಳೆ ತೆಗೆಯಿರಿ, ಗಾಯ ಕತ್ತರಿಸಬೇಡಿ ಅಥವಾ ಬಾಯಿಯಿಂದ ಹೀರಬೇಡಿ.',
    },
  },
  {
    id: 'poisoning',
    label: { en: 'poisoning', hi: 'ज़हर', kn: 'ವಿಷ' },
    forms: ['poison', 'poisoning', 'zeher', 'जहर', 'ज़हर', 'pesticide', 'keetnashak', 'कीटनाशक', 'ವಿಷ', 'ಕೀಟನಾಶಕ'],
    firstAid: {
      en: 'Do not make them vomit. Keep the container or the packet to show the doctor.',
      hi: 'उल्टी कराने की कोशिश न करें। डिब्बा या पैकेट डॉक्टर को दिखाने के लिए साथ रखें।',
      kn: 'ವಾಂತಿ ಮಾಡಿಸಲು ಪ್ರಯತ್ನಿಸಬೇಡಿ. ಡಬ್ಬಿ ಅಥವಾ ಪ್ಯಾಕೆಟ್ ವೈದ್ಯರಿಗೆ ತೋರಿಸಲು ಜೊತೆಗೆ ಇಟ್ಟುಕೊಳ್ಳಿ.',
    },
  },
  {
    id: 'pregnancy',
    label: { en: 'a pregnancy emergency', hi: 'गर्भावस्था में आपात स्थिति', kn: 'ಗರ್ಭಾವಸ್ಥೆಯ ತುರ್ತು' },
    forms: ['pregnancy bleeding', 'bleeding in pregnancy', 'labour pain', 'prasav', 'प्रसव', 'गर्भावस्था में खून', 'ಹೆರಿಗೆ ನೋವು', 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ರಕ್ತ'],
    firstAid: {
      en: 'Take her to the nearest health centre with a delivery facility; do not wait at home.',
      hi: 'उन्हें प्रसव सुविधा वाले नज़दीकी स्वास्थ्य केंद्र ले जाइए; घर पर इंतज़ार न कीजिए।',
      kn: 'ಹೆರಿಗೆ ಸೌಲಭ್ಯ ಇರುವ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ; ಮನೆಯಲ್ಲಿ ಕಾಯಬೇಡಿ.',
    },
  },
  {
    id: 'accident',
    label: { en: 'an accident', hi: 'दुर्घटना', kn: 'ಅಪಘಾತ' },
    forms: ['accident', 'durghatna', 'दुर्घटना', 'accident ho gaya', 'bike accident', 'ಅಪಘಾತ', 'ಡಿಕ್ಕಿ'],
    firstAid: {
      en: 'Do not move the person if the neck or back may be hurt; stop any bleeding and keep them warm.',
      hi: 'अगर गर्दन या कमर में चोट हो सकती है तो मरीज़ को हिलाइए नहीं; खून रोकिए और उन्हें गर्म रखिए।',
      kn: 'ಕುತ್ತಿಗೆ ಅಥವಾ ಬೆನ್ನುಗಳಿಗೆ ಪೆಟ್ಟು ಇರಬಹುದಾದರೆ ರೋಗಿಯನ್ನು ಚಲಿಸಬೇಡಿ; ರಕ್ತ ನಿಲ್ಲಿಸಿ ಮತ್ತು ಬೆಚ್ಚಗೆ ಇರಿಸಿ.',
    },
  },
  {
    id: 'drowning',
    label: { en: 'drowning', hi: 'डूबना', kn: 'ಮುಳುಗುವಿಕೆ' },
    forms: ['drowning', 'doob gaya', 'doob raha', 'डूब', 'ಮುಳುಗ'],
    firstAid: {
      en: 'Get them out safely, check if they are breathing, and start rescue breathing if you are trained.',
      hi: 'सुरक्षित तरीके से बाहर निकालिए, सांस जांचिए, और प्रशिक्षित हों तो कृत्रिम सांस शुरू कीजिए।',
      kn: 'ಸುರಕ್ಷಿತವಾಗಿ ಹೊರತೆಗೆಯಿರಿ, ಉಸಿರಾಟ ಪರಿಶೀಲಿಸಿ, ತರಬೇತಿ ಇದ್ದರೆ ಕೃತಕ ಉಸಿರಾಟ ಪ್ರಾರಂಭಿಸಿ.',
    },
  },
  {
    id: 'electric-shock',
    label: { en: 'an electric shock', hi: 'करंट लगना', kn: 'ವಿದ್ಯುತ್ ಶಾಕ್' },
    forms: ['electric shock', 'current lag', 'करंट', 'bijli ka jhatka', 'ಕರೆಂಟ್', 'ವಿದ್ಯುತ್ ಆಘಾತ'],
    firstAid: {
      en: 'Switch off the power first; do not touch the person while they are still in contact with the wire.',
      hi: 'पहले बिजली बंद कीजिए; जब तक तार से संपर्क है तब तक मरीज़ को न छुएं।',
      kn: 'ಮೊದಲು ವಿದ್ಯುತ್ ಆಫ್ ಮಾಡಿ; ತಂತಿಯ ಸಂಪರ್ಕದಲ್ಲಿರುವಾಗ ವ್ಯಕ್ತಿಯನ್ನು ಮುಟ್ಟಬೇಡಿ.',
    },
  },
  {
    id: 'self-harm',
    label: { en: 'thoughts of self-harm', hi: 'खुद को नुकसान पहुँचाने के विचार', kn: 'ತಮಗೆ ತಾವೇ ಹಾನಿ ಮಾಡಿಕೊಳ್ಳುವ ಯೋಚನೆ' },
    forms: ['suicide', 'atmahatya', 'आत्महत्या', 'khudkhushi', 'kill myself', 'end my life', 'ಆತ್ಮಹತ್ಯೆ', 'ನನ್ನ ಜೀವ'],
    mentalHealth: true,
    firstAid: {
      en: 'You are not alone in this. Please talk to a counsellor on 14416 right now, and stay with someone you trust.',
      hi: 'आप इसमें अकेले नहीं हैं। कृपया अभी 14416 पर सलाहकार से बात कीजिए, और किसी भरोसेमंद व्यक्ति के साथ रहिए।',
      kn: 'ನೀವು ಇದರಲ್ಲಿ ಒಂಟಿಯಲ್ಲ. ದಯವಿಟ್ಟು ಈಗಲೇ 14416 ನಲ್ಲಿ ಸಲಹೆಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಿ, ಮತ್ತು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಇರಿ.',
    },
  },
];

/** Phrases that mean "how much of this medicine should I take". */
const DOSE_FORMS = [
  'how many tablets', 'how many pills', 'how much medicine', 'what dose', 'dosage', 'how many mg',
  'kitni goli', 'kitni tablet', 'kitni dawa', 'kitna dose', 'कितनी गोली', 'कितनी दवा', 'खुराक', 'मात्रा',
  'ಎಷ್ಟು ಮಾತ್ರೆ', 'ಎಷ್ಟು ಔಷಧ', 'ಡೋಸ್', 'ಮಾತ್ರೆ ಎಷ್ಟು',
];

/** Words that mean the caller is asking about health at all. */
const MEDICAL_FORMS = [
  'doctor', 'dawa', 'dawai', 'tablet', 'medicine', 'injection', 'ilaj', 'treatment', 'hospital', 'clinic',
  'bimar', 'bimari', 'health', 'fever', 'bukhar', 'jwara', 'pain', 'dard', 'noyu', 'symptom',
  'bleeding', 'khoon', 'blood', 'pregnan', 'garbh', 'delivery', 'vaccine', 'tika', 'tb', 'cancer',
  'diabetes', 'sugar', 'bp', 'pressure', 'vomit', 'ulti', 'loose motion', 'dast', 'cough', 'khansi',
  'kammi', 'swelling', 'swollen', 'sujan', 'infection', 'wound', 'ghav', 'sick', 'weakness', 'kamzori',
  'ache', 'aching', 'hurts', 'hurt', 'injury', 'sprain', 'fracture', 'rash', 'itch', 'khujli', 'tooth', 'dental',
  'डॉक्टर', 'दवा', 'दवाई', 'गोली', 'इलाज', 'अस्पताल', 'बीमार', 'बुखार', 'दर्द', 'खून', 'उल्टी',
  'दस्त', 'खांसी', 'गर्भ', 'टीका', 'कमजोरी', 'सूजन', 'घाव',
  'ವೈದ್ಯ', 'ಔಷಧ', 'ಮಾತ್ರೆ', 'ಚಿಕಿತ್ಸೆ', 'ಆಸ್ಪತ್ರೆ', 'ಅನಾರೋಗ್ಯ', 'ಜ್ವರ', 'ನೋವು', 'ರಕ್ತ', 'ವಾಂತಿ',
  'ಭೇದಿ', 'ಕೆಮ್ಮು', 'ಗರ್ಭ', 'ಲಸಿಕೆ', 'ದುರ್ಬಲತೆ', 'ಊತ', 'ಗಾಯ',
];

function normalise(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[.,!?;:"'()।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(text, forms) {
  const t = normalise(text);
  return forms.some((f) => t.includes(normalise(f)));
}

/** Red flags present in the utterance. */
function findRedFlags(input) {
  const t = normalise(input);
  return RED_FLAGS.filter((flag) => flag.forms.some((f) => t.includes(normalise(f))));
}

function isDoseQuestion(input) {
  return matches(input, DOSE_FORMS);
}

function isMedical(input) {
  return matches(input, MEDICAL_FORMS);
}

/** First-aid sentence for a flag, in the best language available. */
function firstAidFor(flag, lang) {
  if (!flag || !flag.firstAid) return null;
  return flag.firstAid[lang] || flag.firstAid.en;
}

/**
 * Decide what kind of turn this is.
 * @param {string} question    the text we reason over (translated when needed)
 * @param {object} options     { language, grounded, confidence, matchQuality, category }
 */
function assess(question, { language = 'en', grounded = false, confidence = 0, matchQuality = 'exact', category = 'general', conceptOverlap = true } = {}) {
  const lang = language || 'en';
  const flags = findRedFlags(question);
  const medical = isMedical(question) || flags.length > 0 || category === 'health' || category === 'emergency';

  // 1. Emergency first, whatever else the question asked.
  if (flags.length) {
    const flag = flags[0];
    const numbers = flag.mentalHealth
      ? [NUMBERS.mentalHealth, NUMBERS.ambulance]
      : [NUMBERS.ambulance];
    return {
      kind: flag.mentalHealth ? 'mental-health-crisis' : 'emergency',
      urgency: 'urgent',
      medical: true,
      flags: flags.map((f) => ({ id: f.id, label: f.label.en })),
      redirect: {
        primary: numbers[0].number,
        numbers: numbers.map((n) => ({ number: n.number, label: n.label })),
        speech: text(lang, 'emergency'),
      },
      firstAid: firstAidFor(flag, lang),
      spoken: text(lang, 'emergency'),
      reason: `red flag: ${flag.id}`,
    };
  }

  // 2. Never give a dose.
  if (isDoseQuestion(question)) {
    return {
      kind: 'dose-refusal',
      urgency: 'normal',
      medical: true,
      redirect: { primary: NUMBERS.healthAdvice.number, numbers: [{ number: '104', label: 'Health advice' }], speech: text(lang, 'doseRefusal') },
      spoken: text(lang, 'doseRefusal'),
      reason: 'dose question',
    };
  }

  // 3. Medical but not confidently covered: do not guess.
  // A medical answer needs three things: a verified entry, a strong match, and
  // the question and the entry being about the same thing. Otherwise: 104/108.
  if (medical && (!grounded || !conceptOverlap || confidence < 0.34 || matchQuality === 'approximate')) {
    return {
      kind: 'medical-uncertain',
      urgency: 'normal',
      medical: true,
      redirect: {
        primary: NUMBERS.healthAdvice.number,
        numbers: [{ number: '104', label: 'Health advice' }, { number: '108', label: 'Ambulance' }],
        speech: text(lang, 'medicalUncertain'),
      },
      spoken: text(lang, 'medicalUncertain'),
      reason: !grounded
        ? 'medical question with no verified answer'
        : (!conceptOverlap ? 'matched entry is about something else' : 'weak medical match'),
    };
  }

  if (medical) {
    return { kind: 'medical-answer', urgency: 'normal', medical: true, redirect: null, spoken: null, reason: 'grounded medical answer' };
  }

  return { kind: 'general', urgency: 'normal', medical: false, redirect: null, spoken: null, reason: 'non-medical' };
}

/** Short caution appended to a grounded medical answer. */
const MEDICAL_CAUTION = {
  en: 'If it gets worse, or if you are worried, call 108.',
  hi: 'अगर हालत बिगड़े या आपको चिंता हो, तो 108 पर कॉल करें।',
  kn: 'ಪರಿಸ್ಥಿತಿ ಉಲ್ಬಣಿಸಿದರೆ ಅಥವಾ ಚಿಂತೆ ಇದ್ದರೆ 108 ಗೆ ಕರೆ ಮಾಡಿ.',
  ta: 'நிலைமை மோசமானால் அல்லது கவலையாக இருந்தால் 108-ஐ அழைக்கவும்.',
  te: 'పరిస్థితి దిగజారితే లేదా ఆందోళన ఉంటే 108కి కాల్ చేయండి.',
  bn: 'অবস্থা খারাপ হলে বা দুশ্চিন্তা হলে ১০৮-এ ফোন করুন।',
  mr: 'परिस्थिती बिघडल्यास किंवा काळजी वाटल्यास 108 वर कॉल करा.',
  gu: 'હાલત બગડે તો કે ચિંતા થાય તો 108 પર કૉલ કરો.',
  ml: 'അവസ്ഥ മോശമായാൽ അല്ലെങ്കിൽ ആശങ്കയുണ്ടെങ്കിൽ 108-ൽ വിളിക്കൂ.',
  pa: 'ਹਾਲਤ ਵਿਗੜੇ ਜਾਂ ਚਿੰਤਾ ਹੋਵੇ ਤਾਂ 108 ਉੱਤੇ ਕਾਲ ਕਰੋ।',
  ur: 'حالت بگڑے یا پریشانی ہو تو 108 پر کال کریں۔',
};

function cautionFor(lang) {
  return MEDICAL_CAUTION[lang] || MEDICAL_CAUTION.en;
}

module.exports = {
  assess,
  findRedFlags,
  isDoseQuestion,
  isMedical,
  cautionFor,
  firstAidFor,
  NUMBERS,
  RED_FLAGS,
};
