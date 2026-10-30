/**
 * Rule-based scam / fraud risk assessment for a pasted message.
 * Deliberately transparent: every signal that fired is returned so a user can
 * see why a message was flagged. No personal data leaves the server.
 */

const RULES = [
  {
    id: 'otp_request',
    weight: 34,
    patterns: [/\botp\b/i, /one[\s-]?time\s?password/i, /ओटीपी/, /ಒಟಿಪಿ/],
    reason: {
      en: 'It asks for an OTP or one-time password. No bank or government office ever asks for this.',
      hi: 'इसमें ओटीपी या वन-टाइम पासवर्ड मांगा गया है। कोई बैंक या सरकारी दफ़्तर यह कभी नहीं मांगता।',
      kn: 'ಇದರಲ್ಲಿ ಒಟಿಪಿ ಅಥವಾ ಒನ್-ಟೈಮ್ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳಲಾಗಿದೆ. ಯಾವುದೇ ಬ್ಯಾಂಕ್ ಅಥವಾ ಸರ್ಕಾರಿ ಕಚೇರಿ ಇದನ್ನು ಎಂದಿಗೂ ಕೇಳುವುದಿಲ್ಲ.',
    },
  },
  {
    id: 'pin_cvv',
    weight: 30,
    patterns: [/\bpin\b/i, /\bcvv\b/i, /atm\s?pin/i, /upi\s?pin/i, /पिन/, /पासवर्ड/, /ಪಿನ್/],
    reason: {
      en: 'It mentions an ATM PIN, CVV, UPI PIN or password. Never share these with anyone.',
      hi: 'इसमें एटीएम पिन, सीवीवी, यूपीआई पिन या पासवर्ड का ज़िक्र है। ये किसी को न बताएं।',
      kn: 'ಇದರಲ್ಲಿ ಎಟಿಎಂ ಪಿನ್, ಸಿವಿವಿ, ಯುಪಿಐ ಪಿನ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಉಲ್ಲೇಖ ಇದೆ. ಇವನ್ನು ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.',
    },
  },
  {
    id: 'kyc_block',
    weight: 24,
    patterns: [
      /kyc/i, /account\s+(will\s+be\s+)?(blocked|suspended|frozen)/i, /blocked\s+today/i,
      /केवाईसी/, /खाता\s*बंद/, /ಖಾತೆ\s*ಮುಚ್ಚ/, /ಕೆವೈಸಿ/,
    ],
    reason: {
      en: 'It threatens that your account or KYC will be blocked. This is a common pressure tactic.',
      hi: 'इसमें खाता या केवाईसी बंद होने की धमकी दी गई है। यह डराने का आम तरीका है।',
      kn: 'ಇದರಲ್ಲಿ ಖಾತೆ ಅಥವಾ ಕೆವೈಸಿ ಮುಚ್ಚುತ್ತದೆ ಎಂದು ಬೆದರಿಕೆ ಹಾಕಲಾಗಿದೆ. ಇದು ಸಾಮಾನ್ಯ ಒತ್ತಡದ ತಂತ್ರ.',
    },
  },
  {
    id: 'prize',
    weight: 26,
    patterns: [
      /lottery/i, /lucky\s+draw/i, /you\s+(have\s+)?won/i, /prize\s+money/i, /crore/i,
      /लॉटरी/, /इनाम/, /लकी\s*ड्रॉ/, /ಲಾಟರಿ/, /ಬಹುಮಾನ/,
    ],
    reason: {
      en: 'It claims you won a prize or lottery you did not enter.',
      hi: 'इसमें ऐसा इनाम या लॉटरी जीतने का दावा है जिसमें आपने हिस्सा नहीं लिया।',
      kn: 'ನೀವು ಭಾಗವಹಿಸದ ಬಹುಮಾನ ಅಥವಾ ಲಾಟರಿ ಗೆದ್ದಿದ್ದೀರಿ ಎಂದು ಹೇಳಲಾಗಿದೆ.',
    },
  },
  {
    id: 'advance_fee',
    weight: 28,
    patterns: [
      /processing\s+fee/i, /registration\s+fee/i, /pay\s+(rs\.?|₹)?\s?\d+/i,
      /send\s+(rs\.?|₹)?\s?\d+/i, /शुल्क/, /फीस\s*भेज/, /ಶುಲ್ಕ/, /ಹಣ\s*ಕಳುಹಿಸಿ/,
    ],
    reason: {
      en: 'It asks you to pay a fee or send money first. Genuine schemes never ask for advance payment.',
      hi: 'इसमें पहले शुल्क या पैसा भेजने को कहा गया है। असली योजनाएं पहले पैसा नहीं मांगतीं।',
      kn: 'ಮೊದಲು ಶುಲ್ಕ ಅಥವಾ ಹಣ ಕಳುಹಿಸಲು ಹೇಳಲಾಗಿದೆ. ನಿಜವಾದ ಯೋಜನೆಗಳು ಮುಂಗಡ ಹಣ ಕೇಳುವುದಿಲ್ಲ.',
    },
  },
  {
    id: 'suspicious_link',
    weight: 22,
    patterns: [
      /https?:\/\/(bit\.ly|tinyurl|t\.co|rb\.gy|is\.gd|shorturl|tiny\.cc)/i,
      /https?:\/\/\d{1,3}(\.\d{1,3}){3}/i,
      /\.(apk|xyz|top|click|info)\b/i, /click\s+(here|this\s+link)/i, /लिंक\s*पर\s*क्लिक/, /ಲಿಂಕ್\s*ಒತ್ತಿ/,
    ],
    reason: {
      en: 'It contains a shortened, numeric or unusual link. Do not open it.',
      hi: 'इसमें छोटा, अंकों वाला या असामान्य लिंक है। इसे न खोलें।',
      kn: 'ಇದರಲ್ಲಿ ಚಿಕ್ಕದಾದ, ಸಂಖ್ಯೆಗಳಿರುವ ಅಥವಾ ಅಸಾಮಾನ್ಯ ಲಿಂಕ್ ಇದೆ. ಅದನ್ನು ತೆರೆಯಬೇಡಿ.',
    },
  },
  {
    id: 'urgency',
    weight: 16,
    patterns: [
      /urgent/i, /immediately/i, /within\s+\d+\s+(hours|minutes)/i, /last\s+chance/i,
      /तुरंत/, /आज\s*ही/, /तಕ್ಷಣ/, /ಇಂದೇ/,
    ],
    reason: {
      en: 'It creates urgency to stop you from checking the facts.',
      hi: 'इसमें तुरंत कार्रवाई का दबाव है ताकि आप जांच न कर सकें।',
      kn: 'ತಕ್ಷಣ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುವಂತೆ ಒತ್ತಡ ಹಾಕಲಾಗಿದೆ, ಇದರಿಂದ ನೀವು ಪರಿಶೀಲಿಸಲು ಆಗುವುದಿಲ್ಲ.',
    },
  },
  {
    id: 'impersonation',
    weight: 20,
    patterns: [
      /(income\s+tax|it\s+department|police|cbi|court|bank\s+manager|customer\s+care)\s+(notice|officer|department)/i,
      /digital\s+arrest/i, /गिरफ्तार/, /ಬಂಧನ/,
    ],
    reason: {
      en: 'It pretends to be a bank, police or government officer. Verify by calling the official number yourself.',
      hi: 'यह बैंक, पुलिस या सरकारी अधिकारी होने का दिखावा करता है। आधिकारिक नंबर पर खुद कॉल करके पुष्टि करें।',
      kn: 'ಇದು ಬ್ಯಾಂಕ್, ಪೊಲೀಸ್ ಅಥವಾ ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ ಎಂದು ನಟಿಸುತ್ತದೆ. ಅಧಿಕೃತ ಸಂಖ್ಯೆಗೆ ನೀವೇ ಕರೆ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ.',
    },
  },
  {
    id: 'upi_collect',
    weight: 32,
    patterns: [/upi\s+request/i, /collect\s+request/i, /approve\s+the\s+request/i, /यूपीआई\s*रिक्वेस्ट/, /ಯುಪಿಐ\s*ವಿನಂತಿ/],
    reason: {
      en: 'It asks you to approve a UPI request. Approving a collect request sends money out of your account.',
      hi: 'इसमें यूपीआई रिक्वेस्ट स्वीकार करने को कहा गया है। इसे स्वीकार करने पर आपके खाते से पैसा कट जाता है।',
      kn: 'ಯುಪಿಐ ವಿನಂತಿ ಒಪ್ಪಿಕೊಳ್ಳಲು ಹೇಳಲಾಗಿದೆ. ಅದನ್ನು ಒಪ್ಪಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗುತ್ತದೆ.',
    },
  },
  {
    id: 'remote_access',
    weight: 30,
    patterns: [
      /anydesk/i, /teamviewer/i, /quick\s?support/i, /screen\s?shar/i, /install\s+(this\s+)?app/i,
      /स्क्रीन\s*शेयर/, /ಸ್ಕ್ರೀನ್\s*ಶೇರ್/,
    ],
    reason: {
      en: 'It asks you to install a screen sharing or remote access app. This lets a fraudster control your phone.',
      hi: 'यह स्क्रीन शेयरिंग या रिमोट ऐप डालने को कहता है। इससे ठग आपका फोन चला सकता है।',
      kn: 'ಸ್ಕ್ರೀನ್ ಶೇರಿಂಗ್ ಅಥವಾ ರಿಮೋಟ್ ಆ್ಯಪ್ ಸ್ಥಾಪಿಸಲು ಹೇಳುತ್ತದೆ. ಇದರಿಂದ ಮೋಸಗಾರ ನಿಮ್ಮ ಫೋನ್ ನಿಯಂತ್ರಿಸಬಹುದು.',
    },
  },
];

const ADVICE = {
  high: {
    en: 'Do not reply, do not click any link and do not send money. If you already shared details or lost money, call the cyber crime helpline 1930 immediately and report at cybercrime.gov.in.',
    hi: 'जवाब न दें, किसी लिंक पर क्लिक न करें और पैसा न भेजें। जानकारी दे चुके हैं या पैसा कट गया है तो तुरंत साइबर क्राइम हेल्पलाइन 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें।',
    kn: 'ಉತ್ತರ ಕೊಡಬೇಡಿ, ಯಾವುದೇ ಲಿಂಕ್ ಒತ್ತಬೇಡಿ ಮತ್ತು ಹಣ ಕಳುಹಿಸಬೇಡಿ. ಈಗಾಗಲೇ ವಿವರ ನೀಡಿದ್ದರೆ ಅಥವಾ ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದರೆ ತಕ್ಷಣ ಸೈಬರ್ ಕ್ರೈಂ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ ಮತ್ತು cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಿ.',
  },
  medium: {
    en: 'Treat this as suspicious. Do not share OTPs or bank details. Verify by calling the organisation on its official number that you find yourself.',
    hi: 'इसे संदिग्ध मानें। ओटीपी या बैंक जानकारी न दें। संस्था के आधिकारिक नंबर पर खुद कॉल करके पुष्टि करें।',
    kn: 'ಇದನ್ನು ಸಂಶಯಾಸ್ಪದ ಎಂದು ಪರಿಗಣಿಸಿ. ಒಟಿಪಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರ ನೀಡಬೇಡಿ. ಸಂಸ್ಥೆಯ ಅಧಿಕೃತ ಸಂಖ್ಯೆಗೆ ನೀವೇ ಕರೆ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ.',
  },
  low: {
    en: 'No common fraud pattern matched, but stay careful with links and never share an OTP or PIN with anyone.',
    hi: 'धोखाधड़ी का कोई आम पैटर्न नहीं मिला, फिर भी लिंक से सावधान रहें और ओटीपी या पिन किसी को न बताएं।',
    kn: 'ಸಾಮಾನ್ಯ ಮೋಸದ ಮಾದರಿ ಕಂಡುಬಂದಿಲ್ಲ, ಆದರೂ ಲಿಂಕ್ ಬಗ್ಗೆ ಎಚ್ಚರವಿರಲಿ ಮತ್ತು ಒಟಿಪಿ ಅಥವಾ ಪಿನ್ ಯಾರಿಗೂ ಹೇಳಬೇಡಿ.',
  },
};

function assess(text, language = 'en') {
  const body = String(text || '');
  const reasons = [];
  let score = 0;

  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(body))) {
      score += rule.weight;
      reasons.push({ id: rule.id, text: rule.reason[language] || rule.reason.en });
    }
  }

  // A message that contains a link plus any pressure signal is riskier.
  if (reasons.length >= 3) score += 8;
  score = Math.max(0, Math.min(100, score));

  const riskLevel = score >= 55 ? 'high' : score >= 25 ? 'medium' : 'low';

  return {
    riskLevel,
    score,
    reasons,
    advice: ADVICE[riskLevel][language] || ADVICE[riskLevel].en,
    signals: reasons.length,
    checkedAt: new Date().toISOString(),
    disclaimer:
      'This is an automated first check, not a legal opinion. Always confirm with your bank or the cyber crime helpline 1930.',
  };
}

module.exports = { assess, RULES };
