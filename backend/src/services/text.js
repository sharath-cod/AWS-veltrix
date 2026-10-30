/**
 * Text utilities shared by the retrieval layer and the search index.
 *
 * Kept in its own module so that search-index.js can tokenise documents
 * without importing retrieval.js (which imports the index — a cycle).
 *
 * The CONCEPTS table maps the many ways rural users say one idea — English,
 * romanised Hindi and Kannada, Devanagari, Kannada script — onto a single
 * concept name, so "jwara", "बुखार" and "fever" all reach the same entry.
 */

const STOPWORDS = new Set([
  // english
  'the', 'a', 'an', 'is', 'are', 'am', 'do', 'does', 'did', 'i', 'me', 'my', 'we', 'you', 'your',
  'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'will',
  'for', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'if', 'it', 'this', 'that', 'there', 'be',
  'get', 'got', 'have', 'has', 'about', 'with', 'from', 'need', 'want', 'any', 'please',
  'tell', 'know', 'also', 'than', 'then', 'some', 'much', 'many', 'more', 'very', 'not',
  // hindi (romanised and devanagari)
  'kya', 'kaise', 'kaisa', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'me', 'mein', 'aur', 'ya',
  'kar', 'karna', 'kare', 'kaun', 'kab', 'kahan', 'liye', 'chahiye', 'milta', 'mil', 'mera', 'meri',
  'kuch', 'koi', 'bhi', 'hoga', 'hota', 'hoti', 'raha', 'rahi', 'gaya', 'gayi', 'tha', 'thi',
  'क्या', 'कैसे', 'है', 'हैं', 'का', 'की', 'के', 'को', 'में', 'और', 'या', 'कर', 'करना', 'करें',
  'कौन', 'कब', 'कहां', 'लिए', 'चाहिए', 'मिलता', 'मेरा', 'मेरी', 'कुछ', 'कोई', 'भी', 'होगा', 'होता',
  // possessives and pronouns: present in almost every question, so they say
  // nothing about what is being asked
  'मेरे', 'मुझे', 'मुझको', 'हमारे', 'हमें', 'आपके', 'आपको', 'तेरे', 'उसके', 'उनके',
  'mere', 'mujhe', 'hamare', 'hamen', 'aapke', 'uske',
  // auxiliary verbs: grammar, not topic
  'हो', 'रहा', 'रही', 'रहे', 'गया', 'गई', 'गए', 'था', 'थी', 'थे', 'हुआ', 'हुई', 'हुए', 'करने', 'वाला', 'वाली',
  'hona', 'hua', 'hui', 'rahe', 'wala', 'wali',
  // kannada
  'enu', 'hege', 'yake', 'yavudu', 'ide', 'illa', 'nanna', 'nanage', 'beku', 'sigutte',
  'yaaru', 'yelli', 'aagide', 'aagu', 'maadi', 'madabeku', 'nimage', 'nimma',
  'ಏನು', 'ಹೇಗೆ', 'ಯಾಕೆ', 'ಇದೆ', 'ಇಲ್ಲ', 'ನನ್ನ', 'ನನಗೆ', 'ಬೇಕು', 'ಸಿಗುತ್ತದೆ',
  'ಯಾರು', 'ಎಲ್ಲಿ', 'ಆಗಿದೆ', 'ಮಾಡಿ', 'ಮಾಡಬೇಕು', 'ನಿಮಗೆ', 'ನಿಮ್ಮ',
]);

const CONCEPTS = {
  fever: ['fever', 'bukhar', 'bukhaar', 'बुखार', 'ಜ್ವರ', 'jwara', 'jvara', 'temperature', 'malaria', 'dengue'],
  stomach: ['diarrhoea', 'diarrhea', 'loose motion', 'dast', 'दस्त', 'ಭೇದಿ', 'vomiting', 'ulti', 'उल्टी', 'ವಾಂತಿ', 'ors', 'dehydration'],
  pregnancy: ['pregnancy', 'pregnant', 'garbhvati', 'गर्भवती', 'गर्भावस्था', 'ಗರ್ಭಿಣಿ', 'ಗರ್ಭಾವಸ್ಥೆ', 'delivery', 'prasav', 'प्रसव', 'ಹೆರಿಗೆ', 'anc', 'checkup'],
  tb: ['tb', 'tuberculosis', 'kshay', 'तपेदिक', 'क्षय रोग', 'ಕ್ಷಯ ರೋಗ', 'cough', 'khansi', 'खांसी', 'ಕೆಮ್ಮು'],
  bp: ['bp', 'blood pressure', 'raktachap', 'रक्तचाप', 'ಬಿಪಿ', 'ರಕ್ತದೊತ್ತಡ', 'hypertension', 'sugar', 'diabetes', 'madhumeh', 'मधुमेह', 'ಶುಗರ್', 'ಮಧುಮೇಹ'],
  anaemia: ['anaemia', 'anemia', 'khoon ki kami', 'खून की कमी', 'एनीमिया', 'ರಕ್ತಹೀನತೆ', 'iron', 'आयरन', 'ಐರನ್', 'haemoglobin', 'हीमोग्लोबिन'],
  vaccine: ['vaccine', 'vaccination', 'tika', 'टीका', 'टीकाकरण', 'ಲಸಿಕೆ', 'ಚುಚ್ಚುಮದ್ದೆ', 'immunisation', 'polio', 'measles', 'खसरा', 'ದಡಾರ'],
  snake: ['snake', 'saap', 'saanp', 'सांप', 'सर्प', 'ಹಾವು', 'bite', 'kaata', 'डंक', 'ಕಡಿತ', 'poison', 'जहर', 'ವಿಷ'],
  heat: ['heat', 'garmi', 'गर्मी', 'लू', 'ಬಿಸಿಲು', 'ಬೇಸಿಗೆ', 'sunstroke', 'loo', 'hot'],
  mental: ['mental', 'tension', 'tanaav', 'तनाव', 'ಮಾನಸಿಕ', 'ಒತ್ತಡ', 'depression', 'udaasi', 'उदासी', 'ಖಿನ್ನತೆ', 'sleep', 'neend', 'नींद', 'ನಿದ್ರೆ', 'stress'],
  scheme: ['scheme', 'yojana', 'योजना', 'ಯೋಜನೆ', 'sarkari', 'सरकारी', 'ಸರ್ಕಾರಿ', 'benefit', 'labh', 'लाभ', 'ಲಾಭ', 'apply', 'aavedan', 'आवेदन', 'ಅರ್ಜಿ'],
  scholarship: ['scholarship', 'chhatravritti', 'छात्रवृत्ति', 'स्कॉलरशिप', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'nsp', 'fees', 'शुल्क', 'ಶುಲ್ಕ'],
  student: ['student', 'chhatra', 'छात्र', 'छात्रा', 'ವಿದ್ಯಾರ್ಥಿ', 'ವಿದ್ಯಾರ್ಥಿನಿ', 'school', 'स्कूल', 'ಶಾಲೆ', 'college', 'कॉलेज', 'ಕಾಲೇಜು', 'study', 'padhai', 'पढ़ाई', 'ಓದು'],
  farmer: ['farmer', 'kisan', 'किसान', 'रೈತ', 'ರೈತ', 'खेती', 'krishi', 'कृषि', 'ಕೃಷಿ', 'crop', 'fasal', 'फसल', 'ಬೆಳೆ', 'land', 'zameen', 'ज़मीन', 'ಭೂಮಿ'],
  insurance: ['insurance', 'bima', 'बीमा', 'ವಿಮೆ', 'cover', 'claim', 'दावा', 'ಕ್ಲೇಮ್', 'policy', 'पॉलिसी'],
  bank: ['bank', 'बैंक', 'ಬ್ಯಾಂಕ್', 'account', 'khata', 'khatha', 'खाता', 'ಖಾತೆ', 'passbook', 'पासबुक', 'atm', 'balance', 'बैलेंस'],
  loan: ['loan', 'karz', 'कर्ज', 'ऋण', 'ಸಾಲ', 'ಸಾಲು', 'credit', 'interest', 'byaj', 'ब्याज', 'ಬಡ್ಡಿ', 'mudra', 'मुद्रा', 'ಮುದ್ರಾ'],
  pension: ['pension', 'penshan', 'पेंशन', 'ಪಿಂಚಣಿ', 'old age', 'वृद्धावस्था', 'ವೃದ್ಧಾಪ್ಯ', 'widow', 'vidhwa', 'विधवा', 'ವಿಧವೆ', 'disability', 'viklang', 'विकलांग', 'ಅಂಗವಿಕಲ'],
  ration: ['ration', 'राशन', 'ರೇಷನ್', 'अಕ್ಕಿ ಕಾರ್ಡ್', 'pds', 'food', 'khana', 'खाना', 'ಆಹಾರ', 'anna', 'अनाज', 'ಧಾನ್ಯ'],
  aadhaar: ['aadhaar', 'aadhar', 'आधार', 'ಆಧಾರ್', 'uid', 'biometric'],
  certificate: ['certificate', 'praman patra', 'प्रमाण पत्र', 'ಪ್ರಮಾಣಪತ್ರ', 'caste', 'jati', 'जाति', 'ಜಾತಿ', 'income certificate', 'आय प्रमाण', 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ'],
  landrecord: ['rtc', 'pahani', 'पहानी', 'ಪಹಣಿ', 'khatauni', 'खतौनी', 'mutation', 'नामांतरण', 'ನಾಮಾಂತರ', 'survey', 'सर्वे', 'ಸರ್ವೆ'],
  job: ['job', 'naukri', 'नौकरी', 'काम', 'ಮನರೇಗಾ', 'mgnrega', 'मनरेगा', 'kelsa', 'ಕೆಲಸ', 'employment', 'रोजगार', 'ಉದ್ಯೋಗ', 'wage', 'mazdoori', 'मजदूरी', 'ಕೂಲಿ'],
  ambulance: ['ambulance', 'एम्बुलेंस', 'ಆಂಬ್ಯುಲೆನ್ಸ್', '108', '112', 'emergency', 'आपातकाल', 'ತುರ್ತು', 'hospital', 'अस्पताल', 'ಆಸ್ಪತ್ರೆ'],
  doctor: ['doctor', 'daktar', 'डॉक्टर', 'ವೈದ್ಯ', 'asha', 'आशा', 'ಆಶಾ', 'health worker', 'phc', 'आरोग्य ಮಂದಿರ'],
  fraud: ['fraud', 'dhokha', 'धोखा', 'धोखाधड़ी', 'ಮೋಸ', 'ವಂಚನೆ', 'scam', 'otp', 'ओटीपी', 'ಒಟಿಪಿ', 'pin', 'पिन', 'ಪಿನ್', 'kyc', 'केवाईसी', 'ಕೆವೈಸಿ', 'cheat', 'thagi', 'ठगी'],
  police: ['police', 'पुलिस', 'ಪೊಲೀಸ್', 'complaint', 'shikayat', 'शिकायत', 'ದೂರು', 'fir', 'एफआईआर', 'ಎಫ್‌ಐಆರ್', 'crime', 'अपराध', 'ಅಪರಾಧ'],
  gas: ['gas', 'lpg', 'गैस', 'ग्यास', 'ಗ್ಯಾಸ್', 'cylinder', 'सिलेंडर', 'ಸಿಲಿಂಡರ್', 'ujjwala', 'उज्ज्वला', 'ಉಜ್ವಾಲಾ'],
  house: ['house', 'ghar', 'घर', 'मकान', 'ಮನೆ', 'ವಸತಿ', 'awas', 'आवास', 'housing', 'pmay'],
  water: ['water', 'paani', 'पानी', 'ನೀರು', 'flood', 'badh', 'बाढ़', 'ಪ್ರವಾಹ', 'rain', 'barish', 'बारिश', 'ಮಳೆ'],
  fire: ['fire', 'aag', 'आग', 'ಬೆಂಕಿ', 'burn', 'jalna', 'जलना', 'ಸುಟ್ಟ', 'cylinder blast'],
  women: ['women', 'mahila', 'महिला', 'ಮಹಿಳೆ', 'girl', 'ladki', 'बेटी', 'लड़की', 'ಹುಡುಗಿ', 'ಮಗಳು', '181', '1098', 'safety', 'सुरक्षा', 'ಸುರಕ್ಷತೆ'],
  child: ['child', 'bachcha', 'बच्चा', 'ಬಾಲಕ', 'ಮಗು', 'baby', 'शिशु', 'ಶಿಶು', 'anganwadi', 'आंगनवाड़ी', 'ಅಂಗನವಾಡಿ'],
  money: ['money', 'paisa', 'पैसा', 'ಹಣ', 'rupees', 'rupaye', 'रुपये', 'ರೂಪಾಯಿ', 'subsidy', 'subsidy', 'dbt', 'डीबीटी'],
  panchayat: ['panchayat', 'पंचायत', 'ಪಂಚಾಯತ್', 'gram', 'ग्राम', 'ಗ್ರಾಮ', 'village', 'gaon', 'गांव', 'ಹಳ್ಳಿ', 'officer', 'adhikari', 'अधिकारी', 'ಅಧಿಕಾರಿ'],

  // --- concepts introduced with the October coverage expansion --------------
  mosquito: ['mosquito', 'macchar', 'मच्छर', 'ಸೊಳ್ಳೆ', 'dengue', 'malaria', 'platelet', 'डेंगू', 'मलेरिया', 'ಡೆಂಗ್ಯೂ', 'ಮಲೇರಿಯಾ'],
  rabies: ['rabies', 'dog', 'kutta', 'कुत्ता', 'कुत्ते', 'ನಾಯಿ', 'bite', 'kaata', 'काटना', 'ಕಡಿತ', 'wound', 'ghav', 'घाव', 'ಗಾಯ', 'stray'],
  firstaid: ['first aid', 'bandage', 'patti', 'पट्टी', 'ಕಟ್ಟು', 'bleeding', 'khoon', 'खून', 'ರಕ್ತ', 'fracture', 'haddi', 'हड्डी', 'ಮೂಳೆ', 'burn', 'jalna', 'जलना', 'ಸುಟ್ಟ', 'accident', 'durghatna', 'दुर्घटना', 'ಅಪಘಾತ'],
  nutrition: ['nutrition', 'poshan', 'पोषण', 'ಪೋಷಣ', 'malnutrition', 'kuposhan', 'कुपोषण', 'ಅಪೌಷ್ಟಿಕ', 'weight', 'vajan', 'वजन', 'ತೂಕ', 'anganwadi', 'आंगनवाड़ी', 'ಅಂಗನವಾಡಿ', 'growth'],
  telemedicine: ['teleconsultation', 'telemedicine', 'esanjeevani', 'online doctor', 'abha', 'health id', 'टेली', 'ऑनलाइन', 'ಆನ್‌ಲೈನ್', 'video call'],
  labour: ['labour', 'labor', 'mazdoor', 'मजदूर', 'श्रमिक', 'ಕಾರ್ಮಿಕ', 'ಕೂಲಿ', 'worker', 'eshram', 'ई श्रम', 'ಇ ಶ್ರಮ', 'uan', 'unorganised', 'migrant'],
  artisan: ['artisan', 'karigar', 'कारीगर', 'ಶಿಲ್ಪಿ', 'craft', 'craftsman', 'vishwakarma', 'विश्वकर्मा', 'ವಿಶ್ವಕರ್ಮ', 'carpenter', 'badhai', 'बढ़ई', 'ಬಡಗಿ', 'tailor', 'darzi', 'दर्जी', 'ದರ್ಜಿ', 'blacksmith', 'lohar', 'लोहार', 'ಕಮ್ಮಾರ', 'toolkit'],
  tapwater: ['tap', 'nal', 'नल', 'ನಲ್ಲಿ', 'pipeline', 'jal jeevan', 'जल जीवन', 'ಜಲ ಜೀವನ', 'connection', 'drinking water', 'पीने का पानी', 'ಕುಡಿಯುವ ನೀರು'],
  solar: ['solar', 'सोलर', 'ಸೌರ', 'panel', 'rooftop', 'kusum', 'कुसुम', 'ಕುಸುಮ್', 'surya ghar', 'सूर्य घर', 'ಸೂರ್ಯ ಘರ್', 'electricity', 'bijli', 'बिजली', 'ವಿದ್ಯುತ್', 'pump', 'पंप', 'ಪಂಪ್'],
  disability: ['disability', 'divyang', 'दिव्यांग', 'विकलांग', 'ವಿಕಲಚೇತನ', 'ಅಂಗವಿಕಲ', 'udid', 'handicapped', 'tricycle', 'hearing aid', 'artificial limb'],
  birthcert: ['birth certificate', 'death certificate', 'janm', 'जन्म', 'ಮರಣ', 'ಜನನ', 'registration', 'municipal', 'nagar palika', 'नगर पालिका', 'ಪುರಸಭೆ'],
  voter: ['voter', 'vote', 'matdata', 'मतदाता', 'ಮತದಾರ', 'election', 'chunav', 'चुनाव', 'ಚುನಾವಣೆ', 'epic', 'booth', 'form 6', 'electoral roll', 'मतदान ಪಟ್ಟಿ'],
  livestock: ['cow', 'cattle', 'goat', 'buffalo', 'pashu', 'पशु', 'गाय', 'भैंस', 'बकरी', 'ಹಸು', 'ಎಮ್ಮೆ', 'ಮೇಕೆ', 'ಜಾನುವಾರು', 'veterinary', 'doctor animal', 'ಪಶುವೈದ್ಯ', 'fmd', 'खुरपका'],
  organic: ['organic', 'jaivik', 'जैविक', 'ಸಾವಯವ', 'natural farming', 'प्राकृतिक खेती', 'ನೈಸರ್ಗಿಕ ಕೃಷಿ', 'compost', 'khad', 'खाद', 'ಗೊಬ್ಬರ', 'vermicompost'],
  weather: ['weather', 'mausam', 'मौसम', 'ಹವಾಮಾನ', 'forecast', 'barish', 'बारिश', 'ಮಳೆ', 'rain', 'advisory', 'kisan suvidha', 'mkisan'],
  upi: ['upi', 'यूपीआई', 'ಯುಪಿಐ', 'gpay', 'phonepe', 'paytm', 'qr', 'क्यूआर', 'ಕ್ಯೂಆರ್', 'payment', 'भुगतान', 'ಪಾವತಿ', 'pin', 'पिन', 'ಪಿನ್'],
  savings: ['savings', 'bachat', 'बचत', 'ಉಳಿತಾಯ', 'post office', 'dak', 'डाक', 'ಅಂಚೆ', 'recurring', 'rd', 'fd', 'ppf', 'deposit', 'जमा', 'ಠೇವಣಿ'],
  skill: ['skill', 'kaushal', 'कौशल', 'ಕೌಶಲ್ಯ', 'training', 'prashikshan', 'प्रशिक्षण', 'ತರಬೇತಿ', 'iti', 'pmkvy', 'placement', 'trade', 'unemployed', 'बेरोजगार', 'ನಿರುದ್ಯೋಗ'],
  openschool: ['open school', 'nios', 'ओपन स्कूल', 'ಓಪನ್ ಸ್ಕೂಲ್', 'class 10', 'class 12', 'दसवीं', 'बारहवीं', 'ಹತ್ತನೇ', 'ಹನ್ನೆರಡನೇ', 'dropout', 'certificate'],
  disaster: ['cyclone', 'storm', 'toofan', 'तूफान', 'चक्रवात', 'ಚಂಡಮಾರುತ', 'ಬಿರುಗಾಳಿ', 'lightning', 'bijli girna', 'बिजली', 'ಸಿಡಿಲು', 'ಮಿಂಚು', 'shelter', 'आश्रय', 'ಆಶ್ರಯ'],
  rti: ['rti', 'right to information', 'सूचना का अधिकार', 'आरटीआई', 'ಮಾಹಿತಿ ಹಕ್ಕು', 'information', 'जानकारी', 'ಮಾಹಿತಿ', 'appeal'],
  legalaid: ['legal aid', 'lawyer', 'vakil', 'वकील', 'ವಕೀಲ', 'court', 'adalat', 'अदालत', 'ನ್ಯಾಯಾಲಯ', '15100', 'nalsa', 'free legal', 'case'],
  grievance: ['grievance', 'complaint', 'shikayat', 'शिकायत', 'ದೂರು', 'cpgrams', 'pgportal', 'escalate', 'bdo', 'ceo', 'consumer'],
  gramsabha: ['gram sabha', 'ग्राम सभा', 'ಗ್ರಾಮ ಸಭೆ', 'meeting', 'baithak', 'बैठक', 'ಸಭೆ', 'panchayat', 'पंचायत', 'ಪಂಚಾಯತ್', 'resolution', 'प्रस्ताव'],
  namefix: ['name correction', 'spelling', 'नाम', 'हिज्जे', 'ಹೆಸರು', 'ಕಾಗುಣಿತ', 'mismatch', 'aadhaar', 'आधार', 'ಆಧಾರ್', 'gazette', 'राजपत्र'],
};

/** token -> concept name, built once from CONCEPTS. */
const TOKEN_CONCEPT = new Map();
for (const [concept, forms] of Object.entries(CONCEPTS)) {
  for (const form of forms) {
    for (const token of String(form).toLowerCase().split(/[\s.]+/)) {
      const clean = token.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
      if (clean.length >= 2 && !TOKEN_CONCEPT.has(clean)) TOKEN_CONCEPT.set(clean, concept);
    }
  }
}

/** All surface tokens of a concept, used to widen the query. */
const CONCEPT_TOKENS = new Map();
for (const [concept, forms] of Object.entries(CONCEPTS)) {
  const tokens = new Set();
  for (const form of forms) {
    for (const token of String(form).toLowerCase().split(/[\s.]+/)) {
      const clean = token.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
      if (clean.length >= 2) tokens.add(clean);
    }
  }
  CONCEPT_TOKENS.set(concept, [...tokens]);
}

/** Category hints used when the client sends category=general (the Ask screen). */
const CATEGORY_CONCEPTS = {
  health: ['fever', 'stomach', 'pregnancy', 'tb', 'bp', 'anaemia', 'vaccine', 'snake', 'heat', 'mental', 'doctor', 'mosquito', 'rabies', 'firstaid', 'nutrition', 'telemedicine'],
  schemes: ['scheme', 'gas', 'house', 'job', 'pension', 'ration', 'money', 'labour', 'artisan', 'tapwater', 'solar', 'disability'],
  scholarships: ['scholarship', 'student', 'certificate'],
  scam: ['fraud', 'police'],
  agriculture: ['farmer', 'insurance', 'landrecord', 'livestock', 'organic', 'weather'],
  education: ['student', 'scholarship', 'child', 'skill', 'openschool'],
  documents: ['aadhaar', 'certificate', 'ration', 'landrecord', 'birthcert', 'voter', 'namefix'],
  emergency: ['ambulance', 'fire', 'water', 'women', 'police', 'disaster'],
  finance: ['bank', 'loan', 'insurance', 'pension', 'money', 'upi', 'savings'],
  general: ['panchayat', 'money', 'certificate', 'rti', 'legalaid', 'grievance', 'gramsabha'],
};

/** Lowercase, strip punctuation, split on whitespace. Works for Latin and Indic scripts. */
function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Widen a token list with the other ways of saying the same thing. */
function expandTokens(tokens) {
  const out = new Set(tokens);
  for (const token of tokens) {
    const concept = TOKEN_CONCEPT.get(token);
    if (!concept) continue;
    for (const sibling of CONCEPT_TOKENS.get(concept) || []) out.add(sibling);
  }
  return [...out];
}

/** Concepts mentioned by a piece of text. */
function detectConcepts(text) {
  const found = new Set();
  for (const token of tokenize(text)) {
    const concept = TOKEN_CONCEPT.get(token);
    if (concept) found.add(concept);
  }
  return [...found];
}

/**
 * Guess which knowledge category a free-text question belongs to.
 * Returns null when nothing is clear enough to act on.
 */
function detectCategory(text) {
  const concepts = detectConcepts(text);
  if (!concepts.length) return null;
  const scores = {};
  for (const [category, categoryConcepts] of Object.entries(CATEGORY_CONCEPTS)) {
    if (category === 'general') continue;
    const hits = concepts.filter((c) => categoryConcepts.includes(c)).length;
    if (hits) scores[category] = hits;
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  // Only act when one category is clearly ahead, otherwise stay general.
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

/** Every searchable string in a localised document, across all languages. */
function flatten(value, acc = []) {
  if (value == null) return acc;
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => flatten(v, acc));
    return acc;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((v) => flatten(v, acc));
  }
  return acc;
}

const pick = (field, language) => (field && (field[language] || field.en)) || '';

module.exports = {
  STOPWORDS,
  CONCEPTS,
  TOKEN_CONCEPT,
  CONCEPT_TOKENS,
  CATEGORY_CONCEPTS,
  tokenize,
  expandTokens,
  detectConcepts,
  detectCategory,
  flatten,
  pick,
};
