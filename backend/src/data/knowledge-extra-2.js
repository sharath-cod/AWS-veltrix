/**
 * Extra knowledge-base entries — part 2 (scam, agriculture, education,
 * documents, emergency, money/banking, general).
 * Same rule as part 1: fully localised in en/hi/kn, general public-service
 * guidance, nothing invented, amounts and dates always "confirm on the portal".
 */
module.exports = [
  // -------------------------------------------------------------------- scam
  {
    key: 'kb-scam-kyc-upi',
    category: 'scam',
    tags: ['kyc', 'upi', 'pin', 'otp', 'bank', 'fraud', 'link', 'केवाईसी', 'यूपीआई', 'पिन', 'धोखा', 'बैंक', 'ಕೆವೈಸಿ', 'ಯುಪಿಐ', 'ಪಿನ್', 'ಮೋಸ', 'ಬ್ಯಾಂಕ್'],
    question: {
      en: 'Someone called saying my KYC is expiring and asked for a UPI PIN. Is it a fraud?',
      hi: 'किसी ने फोन करके कहा कि मेरी केवाईसी खत्म हो रही है और यूपीआई पिन मांगा। क्या यह धोखा है?',
      kn: 'ಯಾರೋ ಕರೆ ಮಾಡಿ ನನ್ನ ಕೆವೈಸಿ ಮುಗಿಯುತ್ತಿದೆ ಎಂದು ಹೇಳಿ ಯುಪಿಐ ಪಿನ್ ಕೇಳಿದರು. ಇದು ಮೋಸವೇ?',
    },
    answer: {
      en: 'Yes, that is a fraud. No bank, and no government office, ever asks for your UPI PIN, ATM PIN, card number, CVV, OTP or password on a phone call or by message. Do not click the link that was sent. If you have already shared the PIN or OTP, call your bank at once, ask them to block the card or account, and report it on the cyber crime helpline 1930 or at cybercrime.gov.in within the first hours, because early reporting gives the best chance of stopping the money. Change your PIN from the bank app afterwards and do not keep the same PIN everywhere.',
      hi: 'हां, यह धोखाधड़ी है। कोई बैंक और कोई सरकारी दफ्तर फोन या संदेश पर आपका यूपीआई पिन, एटीएम पिन, कार्ड नंबर, सीवीवी, ओटीपी या पासवर्ड कभी नहीं मांगता। भेजे गए लिंक पर क्लिक न करें। अगर पिन या ओटीपी बता दिया है तो तुरंत बैंक को कॉल करके कार्ड या खाता बंद कराएं, और साइबर अपराध हेल्पलाइन 1930 या cybercrime.gov.in पर पहले कुछ घंटों में शिकायत करें, क्योंकि जल्दी शिकायत से पैसा रुकने की सबसे ज़्यादा संभावना होती है। बाद में बैंक ऐप से पिन बदलें और हर जगह एक ही पिन न रखें।',
      kn: 'ಹೌದು, ಅದು ಮೋಸ. ಯಾವುದೇ ಬ್ಯಾಂಕ್, ಯಾವುದೇ ಸರ್ಕಾರಿ ಕಚೇರಿ ಫೋನ್ ಕರೆ ಅಥವಾ ಸಂದೇಶದಲ್ಲಿ ನಿಮ್ಮ ಯುಪಿಐ ಪಿನ್, ಎಟಿಎಂ ಪಿನ್, ಕಾರ್ಡ್ ಸಂಖ್ಯೆ, ಸಿವಿವಿ, ಒಟಿಪಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳುವುದಿಲ್ಲ. ಕಳುಹಿಸಿದ ಲಿಂಕ್ ಒತ್ತಬೇಡಿ. ಪಿನ್ ಅಥವಾ ಒಟಿಪಿ ಹೇಳಿಬಿಟ್ಟರೆ ತಕ್ಷಣ ಬ್ಯಾಂಕ್‌ಗೆ ಕರೆ ಮಾಡಿ ಕಾರ್ಡ್ ಅಥವಾ ಖಾತೆ ಬ್ಲಾಕ್ ಮಾಡಿಸಿ, ಮತ್ತು ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ಮೊದಲ ಕೆಲವು ಗಂಟೆಗಳಲ್ಲೇ ದೂರು ನೀಡಿ, ಏಕೆಂದರೆ ಬೇಗ ದೂರು ನೀಡಿದರೆ ಹಣ ನಿಲ್ಲಿಸುವ ಸಾಧ್ಯತೆ ಹೆಚ್ಚು. ನಂತರ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಿಂದ ಪಿನ್ ಬದಲಾಯಿಸಿ ಮತ್ತು ಎಲ್ಲೆಡೆ ಒಂದೇ ಪಿನ್ ಇಟ್ಟುಕೊಳ್ಳಬೇಡಿ.',
    },
    sources: ['Cyber Crime Helpline 1930', 'RBI customer awareness guidelines', 'cybercrime.gov.in'],
  },
  {
    key: 'kb-scam-loan-app',
    category: 'scam',
    tags: ['loan app', 'loan', 'app', 'harassment', 'photo', 'contacts', 'लोन ऐप', 'कर्ज', 'परेशान', 'ಸಾಲ ಆ್ಯಪ್', 'ಸಾಲ', 'ಕಿರುಕುಳ'],
    question: {
      en: 'A loan app is calling my contacts and threatening me. What can I do?',
      hi: 'एक लोन ऐप मेरे संपर्कों को फोन करके धमका रहा है। क्या कर सकता हूं?',
      kn: 'ಒಂದು ಸಾಲ ಆ್ಯಪ್ ನನ್ನ ಸಂಪರ್ಕಗಳಿಗೆ ಕರೆ ಮಾಡಿ ಬೆದರಿಕೆ ಹಾಕುತ್ತಿದೆ. ಏನು ಮಾಡಬಹುದು?',
    },
    answer: {
      en: 'This is illegal recovery harassment. Do not pay any extra "penalty" outside the app, and do not send any more photographs or documents. Take screenshots of the calls, messages and the app page, note the phone numbers, and report it — call the cyber crime helpline 1930, file a complaint on cybercrime.gov.in, and inform the local police station; you can also complain to the RBI Sachet portal against the lender. Tell your contacts that the app is misusing your data so they do not fall for it. Only borrow from banks, regional rural banks or NBFCs registered with the RBI, and check on the RBI website before installing any loan app.',
      hi: 'यह अवैध वसूली और परेशानी है। ऐप के बाहर कोई अतिरिक्त "जुर्माना" न दें, और कोई और फोटो या दस्तावेज़ न भेजें। कॉल, संदेश और ऐप पेज के स्क्रीनशॉट लें, फोन नंबर लिखें, और शिकायत करें — साइबर अपराध हेल्पलाइन 1930 पर कॉल करें, cybercrime.gov.in पर शिकायत दर्ज करें, और स्थानीय पुलिस थाने को बताएं; आरबीआई के सचेत पोर्टल पर भी ऋणदाता के खिलाफ शिकायत कर सकते हैं। अपने संपर्कों को बताएं कि ऐप उनका डेटा दुरुपयोग कर रहा है ताकि वे भी ठगे न जाएं। केवल बैंक, क्षेत्रीय ग्रामीण बैंक या आरबीआई में पंजीकृत एनबीएफसी से कर्ज लें, और कोई भी लोन ऐप डाउनलोड करने से पहले आरबीआई वेबसाइट पर जांचें।',
      kn: 'ಇದು ಕಾನೂನುಬಾಹಿರ ವಸೂಲಿ ಕಿರುಕುಳ. ಆ್ಯಪ್‌ನ ಹೊರಗೆ ಹೆಚ್ಚುವರಿ "ದಂಡ" ಪಾವತಿಸಬೇಡಿ, ಮತ್ತು ಇನ್ನಷ್ಟು ಫೋಟೋ ಅಥವಾ ದಾಖಲೆ ಕಳುಹಿಸಬೇಡಿ. ಕರೆ, ಸಂದೇಶ ಮತ್ತು ಆ್ಯಪ್ ಪುಟದ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ತೆಗೆದುಕೊಳ್ಳಿ, ಫೋನ್ ಸಂಖ್ಯೆಗಳನ್ನು ಬರೆದಿಟ್ಟುಕೊಳ್ಳಿ, ಮತ್ತು ದೂರು ನೀಡಿ — ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ, cybercrime.gov.in ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ, ಮತ್ತು ಸ್ಥಳೀಯ ಪೊಲೀಸ್ ಠಾಣೆಗೆ ತಿಳಿಸಿ; ಆರ್‌ಬಿಐನ ಸಚೇತ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸಾಲದಾತರ ವಿರುದ್ಧವೂ ದೂರು ನೀಡಬಹುದು. ಆ್ಯಪ್ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ದುರುಪಯೋಗ ಮಾಡುತ್ತಿದೆ ಎಂದು ನಿಮ್ಮ ಸಂಪರ್ಕಗಳಿಗೆ ಹೇಳಿ, ಅವರೂ ಮೋಸ ಹೋಗದಂತೆ. ಬ್ಯಾಂಕ್, ಪ್ರಾದೇಶಿಕ ಗ್ರಾಮೀಣ ಬ್ಯಾಂಕ್ ಅಥವಾ ಆರ್‌ಬಿಐ ನೋಂದಾಯಿತ ಎನ್‌ಬಿಎಫ್‌ಸಿ ಸಂಸ್ಥೆಗಳಿಂದ ಮಾತ್ರ ಸಾಲ ಪಡೆಯಿರಿ, ಮತ್ತು ಯಾವುದೇ ಸಾಲ ಆ್ಯಪ್ ಸ್ಥಾಪಿಸುವ ಮೊದಲು ಆರ್‌ಬಿಐ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    },
    sources: ['Cyber Crime Helpline 1930', 'RBI Sachet portal', 'cybercrime.gov.in'],
  },
  {
    key: 'kb-scam-fake-officer',
    category: 'scam',
    tags: ['police', 'officer', 'court', 'case', 'arrest', 'cbi', 'parcel', 'पुलिस', 'अफसर', 'कोर्ट', 'गिरफ्तार', 'ಪೊಲೀಸ್', 'ಅಧಿಕಾರಿ', 'ನ್ಯಾಯಾಲಯ', 'ಬಂಧನ'],
    question: {
      en: 'Someone on video call said he is a police officer and my parcel has drugs. Is it real?',
      hi: 'वीडियो कॉल पर किसी ने कहा कि वह पुलिस अफसर है और मेरे पार्सल में ड्रग्स हैं। क्या यह सच है?',
      kn: 'ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ಯಾರೋ ನಾನು ಪೊಲೀಸ್ ಅಧಿಕಾರಿ ಎಂದು ಹೇಳಿ ನನ್ನ ಪಾರ್ಸೆಲ್‌ನಲ್ಲಿ ಮಾದಕ ವಸ್ತು ಇದೆ ಎಂದರು. ಇದು ನಿಜವೇ?',
    },
    answer: {
      en: 'This is a well-known digital arrest fraud. No police officer, CBI officer, court or courier company conducts an investigation over a video call, and none of them asks you to pay money, transfer funds to a "government account", or stay on the call in secret. Disconnect the call immediately, do not share any document or screen, and do not pay anything. Report the number to the cyber crime helpline 1930 and on cybercrime.gov.in. If you are ever unsure whether a real case exists, walk into the nearest police station in person or ask a lawyer — a genuine notice always comes in writing.',
      hi: 'यह "डिजिटल अरेस्ट" नाम की जानी-मानी ठगी है। कोई पुलिस अफसर, सीबीआई अधिकारी, कोर्ट या कूरियर कंपनी वीडियो कॉल पर जांच नहीं करती, और कोई भी आपसे पैसे देने, "सरकारी खाते" में पैसा भेजने या चुपचाप कॉल पर बने रहने को नहीं कहता। कॉल तुरंत काट दें, कोई दस्तावेज़ या स्क्रीन साझा न करें, और कुछ भी भुगतान न करें। उस नंबर की शिकायत साइबर अपराध हेल्पलाइन 1930 और cybercrime.gov.in पर करें। अगर कभी संदेह हो कि सच में कोई मामला है, तो खुद नज़दीकी पुलिस थाने जाएं या वकील से पूछें — असली नोटिस हमेशा लिखित में आता है।',
      kn: 'ಇದು "ಡಿಜಿಟಲ್ ಬಂಧನ" ಎಂದು ಕರೆಯಲಾಗುವ ಪ್ರಸಿದ್ಧ ಮೋಸ. ಯಾವುದೇ ಪೊಲೀಸ್ ಅಧಿಕಾರಿ, ಸಿಬಿಐ ಅಧಿಕಾರಿ, ನ್ಯಾಯಾಲಯ ಅಥವಾ ಕೊರಿಯರ್ ಕಂಪನಿ ವೀಡಿಯೊ ಕರೆಯಲ್ಲಿ ತನಿಖೆ ನಡೆಸುವುದಿಲ್ಲ, ಮತ್ತು ಯಾರೂ ನೀವು ಹಣ ಕೊಡಬೇಕು, "ಸರ್ಕಾರಿ ಖಾತೆ"ಗೆ ಹಣ ವರ್ಗಾಯಿಸಬೇಕು ಅಥವಾ ರಹಸ್ಯವಾಗಿ ಕರೆಯಲ್ಲಿ ಇರಬೇಕು ಎಂದು ಹೇಳುವುದಿಲ್ಲ. ಕರೆ ತಕ್ಷಣ ಕಡಿತಗೊಳಿಸಿ, ಯಾವುದೇ ದಾಖಲೆ ಅಥವಾ ಪರದೆ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ, ಮತ್ತು ಯಾವುದೇ ಹಣ ಪಾವತಿಸಬೇಡಿ. ಆ ಸಂಖ್ಯೆಯನ್ನು ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಮತ್ತು cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಿ. ನಿಜವಾಗಿ ಪ್ರಕರಣ ಇದೆಯೇ ಎಂದು ಸಂದೇಹವಾದರೆ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆಗೆ ನೇರವಾಗಿ ಹೋಗಿ ಅಥವಾ ವಕೀಲರನ್ನು ಕೇಳಿ — ನಿಜವಾದ ನೋಟಿಸ್ ಯಾವಾಗಲೂ ಬರಹ ರೂಪದಲ್ಲಿ ಬರುತ್ತದೆ.',
    },
    sources: ['Cyber Crime Helpline 1930', 'MHA advisory on digital arrest frauds'],
  },
  {
    key: 'kb-scam-report',
    category: 'scam',
    tags: ['report', 'complaint', 'helpline', '1930', 'money lost', 'bank', 'शिकायत', 'हेल्पलाइन', 'पैसा गया', 'ದೂರು', 'ಸಹಾಯವಾಣಿ', 'ಹಣ ಹೋಗಿದೆ'],
    question: {
      en: 'Money has already been taken from my account by fraud. Where do I complain?',
      hi: 'धोखे से मेरे खाते से पैसे निकल गए हैं। शिकायत कहां करें?',
      kn: 'ಮೋಸದಿಂದ ನನ್ನ ಖಾತೆಯಿಂದ ಹಣ ಹೋಗಿದೆ. ಎಲ್ಲಿ ದೂರು ನೀಡಬೇಕು?',
    },
    answer: {
      en: 'Act within the first few hours — that is when the money can still be frozen. Call your bank on the number printed on the passbook or card, block the card or account, and ask them to raise a dispute. Then call the national cyber crime helpline 1930 and file a complaint at cybercrime.gov.in or at the nearest police station; keep the complaint number. Note down the date, time, amount, the number that called and any transaction IDs. You can also complain to the RBI Ombudsman if the bank does not help. Never pay anyone who promises to "recover" your money — that is a second fraud.',
      hi: 'पहले कुछ घंटों में ही कार्रवाई करें — उसी समय पैसा रुक सकता है। पासबुक या कार्ड पर छपे नंबर पर बैंक को कॉल करें, कार्ड या खाता बंद कराएं, और लिखित शिकायत दर्ज करने को कहें। फिर राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर कॉल करें और cybercrime.gov.in या नज़दीकी पुलिस थाने में शिकायत दर्ज करें; शिकायत संख्या संभालकर रखें। तारीख, समय, राशि, कॉल करने वाला नंबर और ट्रांजैक्शन आईडी लिख लें। बैंक मदद न करे तो आरबीआई ऑम्बुड्समैन के पास भी शिकायत कर सकते हैं। जो कोई पैसा "वापस दिलाने" का वादा करे उसे कभी पैसा न दें — वह दूसरा धोखा है।',
      kn: 'ಮೊದಲ ಕೆಲವು ಗಂಟೆಗಳಲ್ಲೇ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಿ — ಆಗಷ್ಟೇ ಹಣ ನಿಲ್ಲಿಸಲು ಸಾಧ್ಯ. ಪಾಸ್‌ಬುಕ್ ಅಥವಾ ಕಾರ್ಡ್‌ನಲ್ಲಿ ಮುದ್ರಿತವಾದ ಸಂಖ್ಯೆಗೆ ಬ್ಯಾಂಕ್‌ಗೆ ಕರೆ ಮಾಡಿ, ಕಾರ್ಡ್ ಅಥವಾ ಖಾತೆ ಬ್ಲಾಕ್ ಮಾಡಿಸಿ, ಮತ್ತು ಬರಹ ರೂಪದ ದೂರು ದಾಖಲಿಸಲು ಹೇಳಿ. ನಂತರ ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ ಮತ್ತು cybercrime.gov.in ಅಥವಾ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ; ದೂರು ಸಂಖ್ಯೆ ಜೋಪಾನವಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಿ. ದಿನಾಂಕ, ಸಮಯ, ಮೊತ್ತ, ಕರೆ ಮಾಡಿದ ಸಂಖ್ಯೆ ಮತ್ತು ವಹಿವಾಟು ಐಡಿ ಬರೆದಿಟ್ಟುಕೊಳ್ಳಿ. ಬ್ಯಾಂಕ್ ಸಹಾಯ ಮಾಡದಿದ್ದರೆ ಆರ್‌ಬಿಐ ಒಂಬುಡ್ಸ್‌ಮನ್‌ಗೂ ದೂರು ನೀಡಬಹುದು. ಹಣ "ವಾಪಸ್ ತಂದುಕೊಡುತ್ತೇನೆ" ಎಂದು ಹೇಳುವ ಯಾರಿಗೂ ಹಣ ಕೊಡಬೇಡಿ — ಅದು ಎರಡನೇ ಮೋಸ.',
    },
    sources: ['Cyber Crime Helpline 1930', 'cybercrime.gov.in', 'RBI Ombudsman scheme'],
  },

  // -------------------------------------------------------------- agriculture
  {
    key: 'kb-agri-pmfby',
    category: 'agriculture',
    tags: ['crop insurance', 'pmfby', 'fasal bima', 'crop loss', 'rain', 'फसल बीमा', 'पीएमएफबीवाई', 'फसल खराब', 'बारिश', 'ಬೆಳೆ ವಿಮೆ', 'ಬೆಳೆ ಹಾನಿ', 'ಮಳೆ'],
    question: {
      en: 'My crop is damaged. How do I claim crop insurance?',
      hi: 'मेरी फसल खराब हो गई है। फसल बीमा का दावा कैसे करें?',
      kn: 'ನನ್ನ ಬೆಳೆ ಹಾನಿಯಾಗಿದೆ. ಬೆಳೆ ವಿಮೆ ಕ್ಲೇಮ್ ಹೇಗೆ ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Under PMFBY you must report the loss to the bank, the insurance company, the village accountant or the agriculture officer within seventy-two hours, and also on the crop insurance app or helpline, so that a survey can be done. The premium is about two per cent of the sum insured for kharif and one and a half per cent for rabi, and the rest is paid by the government. Keep the application or policy number, the sowing certificate, land records and photographs of the damaged crop. The claim is paid into the bank account after the survey. Report quickly — a late report is the main reason claims are refused.',
      hi: 'पीएमएफबीवाई में नुकसान की सूचना बैंक, बीमा कंपनी, ग्राम लेखपाल या कृषि अधिकारी को बहत्तर घंटे के भीतर देनी होती है, और फसल बीमा ऐप या हेल्पलाइन पर भी, ताकि सर्वेक्षण हो सके। खरीफ में बीमित राशि का लगभग दो प्रतिशत और रबी में डेढ़ प्रतिशत प्रीमियम किसान देता है, बाकी सरकार देती है। आवेदन या पॉलिसी संख्या, बुवाई का प्रमाण पत्र, ज़मीन के कागज़ और खराब फसल की फोटो रखें। सर्वेक्षण के बाद दावा बैंक खाते में आता है। जल्दी सूचना दें — देर से सूचना ही दावा रद्द होने का मुख्य कारण है।',
      kn: 'ಪಿಎಂಎಫ್‌ಬಿವೈ ಅಡಿಯಲ್ಲಿ ನಷ್ಟದ ಮಾಹಿತಿಯನ್ನು ಬ್ಯಾಂಕ್, ವಿಮಾ ಕಂಪನಿ, ಗ್ರಾಮ ಲೆಕ್ಕಿಗ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಗೆ ಎಪ್ಪತ್ತೆರಡು ಗಂಟೆಗಳ ಒಳಗೆ ತಿಳಿಸಬೇಕು, ಮತ್ತು ಬೆಳೆ ವಿಮೆ ಆ್ಯಪ್ ಅಥವಾ ಸಹಾಯವಾಣಿಯಲ್ಲೂ ತಿಳಿಸಬೇಕು, ಆಗ ಸಮೀಕ್ಷೆ ನಡೆಯುತ್ತದೆ. ಖಾರಿಫ್‌ನಲ್ಲಿ ವಿಮಿತ ಮೊತ್ತದ ಸುಮಾರು ಎರಡು ಪ್ರತಿಶತ ಮತ್ತು ರಬಿಯಲ್ಲಿ ಒಂದೂವರೆ ಪ್ರತಿಶತ ಪ್ರೀಮಿಯಂ ರೈತರು ಕೊಡುತ್ತಾರೆ, ಉಳಿದದ್ದನ್ನು ಸರ್ಕಾರ ಕೊಡುತ್ತದೆ. ಅರ್ಜಿ ಅಥವಾ ಪಾಲಿಸಿ ಸಂಖ್ಯೆ, ಬಿತ್ತನೆ ಪ್ರಮಾಣಪತ್ರ, ಭೂ ದಾಖಲೆ ಮತ್ತು ಹಾನಿಗೊಳಗಾದ ಬೆಳೆಯ ಫೋಟೋ ಇಟ್ಟುಕೊಳ್ಳಿ. ಸಮೀಕ್ಷೆಯ ನಂತರ ಪರಿಹಾರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬರುತ್ತದೆ. ಬೇಗ ಮಾಹಿತಿ ನೀಡಿ — ತಡವಾದ ಮಾಹಿತಿಯೇ ಕ್ಲೇಮ್ ತಿರಸ್ಕಾರಕ್ಕೆ ಮುಖ್ಯ ಕಾರಣ.',
    },
    sources: ['Pradhan Mantri Fasal Bima Yojana portal', 'Department of Agriculture and Farmers Welfare'],
  },
  {
    key: 'kb-agri-soil-health',
    category: 'agriculture',
    tags: ['soil', 'soil health card', 'fertiliser', 'urea', 'dap', 'compost', 'मिट्टी', 'मृदा', 'खाद', 'उर्वरक', 'ಯೂರಿಯಾ', 'ಮಣ್ಣು', 'ಗೊಬ್ಬರ'],
    question: {
      en: 'How do I get a soil health card and how much fertiliser should I use?',
      hi: 'मृदा स्वास्थ्य कार्ड कैसे मिलेगा और कितनी खाद डालनी चाहिए?',
      kn: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಹೇಗೆ ಸಿಗುತ್ತದೆ ಮತ್ತು ಎಷ್ಟು ಗೊಬ್ಬರ ಹಾಕಬೇಕು?',
    },
    answer: {
      en: 'Ask the village agriculture assistant, the Raitha Samparka Kendra or the agriculture officer to take a soil sample; the test and the soil health card are free and the card gives the exact dose of nitrogen, phosphorus, potash and micronutrients for your crop. Following the card saves money and stops over-use of urea, which hardens the soil. Mix farmyard manure or compost and grow a pulse once in the rotation to keep the soil healthy. Do not buy fertiliser without a bill, and check the packet seal and the MRP printed on it — overcharging is illegal and can be reported to the agriculture department.',
      hi: 'गांव के कृषि सहायक, रायता संपर्क केंद्र या कृषि अधिकारी से मिट्टी का नमूना लेने को कहें; जांच और मृदा स्वास्थ्य कार्ड मुफ्त है और कार्ड में आपकी फसल के लिए नाइट्रोजन, फॉस्फोरस, पोटाश और सूक्ष्म पोषक तत्वों की सही मात्रा लिखी होती है। कार्ड के अनुसार खाद डालने से पैसा बचता है और यूरिया का अधिक इस्तेमाल रुकता है, जो मिट्टी को कड़ा कर देता है। गोबर की खाद या कंपोस्ट मिलाएं और फसल चक्र में एक बार दलहन उगाएं। बिना बिल खाद न खरीदें, और पैकेट की सील तथा छपी हुई एमआरपी जांचें — अधिक पैसा लेना गैरकानूनी है और कृषि विभाग में शिकायत की जा सकती है।',
      kn: 'ಗ್ರಾಮದ ಕೃಷಿ ಸಹಾಯಕ, ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಗೆ ಮಣ್ಣಿನ ಮಾದರಿ ತೆಗೆದುಕೊಳ್ಳಲು ಹೇಳಿ; ಪರೀಕ್ಷೆ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಉಚಿತ ಮತ್ತು ಕಾರ್ಡ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆಗೆ ಸಾರಜನಕ, ರಂಜಕ, ಪೊಟ್ಯಾಶ್ ಮತ್ತು ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳ ನಿಖರ ಪ್ರಮಾಣ ಇರುತ್ತದೆ. ಕಾರ್ಡ್ ಪ್ರಕಾರ ಗೊಬ್ಬರ ಹಾಕಿದರೆ ಹಣ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಯೂರಿಯಾದ ಅತಿ ಬಳಕೆ ನಿಲ್ಲುತ್ತದೆ, ಅದು ಮಣ್ಣನ್ನು ಗಟ್ಟಿಗೊಳಿಸುತ್ತದೆ. ಸಾವಿಗೆ ಗೊಬ್ಬರ ಅಥವಾ ಕಾಂಪೋಸ್ಟ್ ಸೇರಿಸಿ ಮತ್ತು ಬೆಳೆ ಪರಿವರ್ತನೆಯಲ್ಲಿ ಒಮ್ಮೆ ಬೇಳೆ ಬೆಳೆ ಬೆಳೆಯಿರಿ. ಬಿಲ್ ಇಲ್ಲದೆ ಗೊಬ್ಬರ ಖರೀದಿಸಬೇಡಿ, ಮತ್ತು ಪ್ಯಾಕೆಟ್ ಮುದ್ರೆ ಹಾಗೂ ಮುದ್ರಿತ ಎಂಆರ್‌ಪಿ ಪರಿಶೀಲಿಸಿ — ಹೆಚ್ಚು ಹಣ ಪಡೆಯುವುದು ಕಾನೂನುಬಾಹಿರ, ಕೃಷಿ ಇಲಾಖೆಗೆ ದೂರು ನೀಡಬಹುದು.',
    },
    sources: ['Soil Health Card scheme', 'Department of Agriculture and Farmers Welfare'],
  },
  {
    key: 'kb-agri-kcc',
    category: 'agriculture',
    tags: ['kisan credit card', 'kcc', 'loan', 'credit', 'interest', 'bank', 'किसान क्रेडिट कार्ड', 'कर्ज', 'ब्याज', 'ಬ್ಯಾಂಕ್ ಸಾಲ', 'ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್', 'ಬಡ್ಡಿ'],
    question: {
      en: 'How do I get a Kisan Credit Card loan for farming?',
      hi: 'खेती के लिए किसान क्रेडिट कार्ड का कर्ज कैसे मिलेगा?',
      kn: 'ಕೃಷಿಗೆ ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಸಾಲ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Apply for a Kisan Credit Card at any bank, regional rural bank or cooperative society with Aadhaar, land records and a photograph; tenant farmers and sharecroppers can also apply with a tenancy proof. The card gives a short-term crop loan limit, and if you repay on time you get interest support under the scheme, so the effective rate is low. Use the money only for farming needs and repay before the due date, otherwise the interest support is lost and the next loan becomes difficult. Ask the branch for the current interest rate, the limit for your land and the documents needed, and never sign a blank form or take a loan through an agent who asks for a commission.',
      hi: 'किसी भी बैंक, क्षेत्रीय ग्रामीण बैंक या सहकारी समिति में आधार, ज़मीन के कागज़ और फोटो के साथ किसान क्रेडिट कार्ड के लिए आवेदन करें; बटाईदार किसान भी बटाई के प्रमाण के साथ आवेदन कर सकते हैं। कार्ड से अल्पकालिक फसल ऋण की सीमा मिलती है, और समय पर चुकाने पर योजना के तहत ब्याज सहायता मिलती है, इसलिए असल ब्याज दर कम हो जाती है। पैसा सिर्फ खेती के काम में लगाएं और नियत तारीख से पहले चुकाएं, वरना ब्याज सहायता नहीं मिलेगी और अगला कर्ज मुश्किल हो जाएगा। शाखा से वर्तमान ब्याज दर, अपनी ज़मीन की सीमा और ज़रूरी कागज़ पूछें, और खाली फॉर्म पर हस्ताक्षर न करें तथा कमीशन मांगने वाले एजेंट से कर्ज न लें।',
      kn: 'ಯಾವುದೇ ಬ್ಯಾಂಕ್, ಪ್ರಾದೇಶಿಕ ಗ್ರಾಮೀಣ ಬ್ಯಾಂಕ್ ಅಥವಾ ಸಹಕಾರ ಸಂಘದಲ್ಲಿ ಆಧಾರ್, ಭೂ ದಾಖಲೆ ಮತ್ತು ಫೋಟೋ ಜೊತೆ ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ಗೇಣಿದಾರ ರೈತರೂ ಗೇಣಿ ದಾಖಲೆ ಜೊತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ಕಾರ್ಡ್‌ನಿಂದ ಅಲ್ಪಾವಧಿ ಬೆಳೆ ಸಾಲದ ಮಿತಿ ಸಿಗುತ್ತದೆ, ಮತ್ತು ಸಮಯಕ್ಕೆ ಮರುಪಾವತಿಸಿದರೆ ಯೋಜನೆಯಡಿ ಬಡ್ಡಿ ಸಹಾಯ ಸಿಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಪರಿಣಾಮಕಾರಿ ಬಡ್ಡಿ ದರ ಕಡಿಮೆ. ಹಣವನ್ನು ಕೃಷಿ ಅಗತ್ಯಕ್ಕೆ ಮಾತ್ರ ಬಳಸಿ ಮತ್ತು ಗಡುವಿನ ಮೊದಲು ಮರುಪಾವತಿಸಿ, ಇಲ್ಲದಿದ್ದರೆ ಬಡ್ಡಿ ಸಹಾಯ ಸಿಗುವುದಿಲ್ಲ ಮತ್ತು ಮುಂದಿನ ಸಾಲ ಕಷ್ಟವಾಗುತ್ತದೆ. ಶಾಖೆಯಲ್ಲಿ ಪ್ರಸ್ತುತ ಬಡ್ಡಿ ದರ, ನಿಮ್ಮ ಭೂಮಿಯ ಮಿತಿ ಮತ್ತು ಬೇಕಾದ ದಾಖಲೆ ಕೇಳಿ, ಮತ್ತು ಖಾಲಿ ಅರ್ಜಿಗೆ ಸಹಿ ಹಾಕಬೇಡಿ ಅಥವಾ ಕಮಿಷನ್ ಕೇಳುವ ಏಜೆಂಟ್ ಮೂಲಕ ಸಾಲ ಪಡೆಯಬೇಡಿ.',
    },
    sources: ['Kisan Credit Card scheme — Department of Agriculture', 'NABARD'],
  },
  {
    key: 'kb-agri-msp-mandi',
    category: 'agriculture',
    tags: ['msp', 'mandi', 'sell', 'price', 'market', 'apmc', 'मंडी', 'बाजार', 'भाव', 'बेचना', 'ಮಂಡಿ', 'ಮಾರುಕಟ್ಟೆ', 'ಬೆಲೆ', 'ಮಾರಾಟ'],
    question: {
      en: 'Where can I sell my crop at the right price?',
      hi: 'अपनी फसल सही भाव पर कहां बेचें?',
      kn: 'ನನ್ನ ಬೆಳೆಯನ್ನು ಸರಿಯಾದ ಬೆಲೆಗೆ ಎಲ್ಲಿ ಮಾರಾಟ ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Sell through the regulated mandi (APMC) or a government procurement centre, where the weight is checked on a verified scale and you get a receipt and the payment goes to your bank account. Check the daily price for your crop on the mandi board or agriculture department website or app before you go, so you know the fair rate. Keep the sale receipt and the gate entry slip. Do not accept a lower weight or a deduction without a written reason; if a trader cheats on weight or price you can complain to the mandi secretary or the agriculture marketing officer. For crops covered by minimum support price, sell only at the notified procurement centre during the notified dates.',
      hi: 'नियंत्रित मंडी (एपीएमसी) या सरकारी खरीद केंद्र के जरिए बेचें, जहां तुलाई सत्यापित कांटे पर होती है और आपको रसीद मिलती है तथा भुगतान बैंक खाते में आता है। जाने से पहले मंडी बोर्ड या कृषि विभाग की वेबसाइट या ऐप पर अपनी फसल का आज का भाव देखें, ताकि आपको उचित दर पता हो। बिक्री की रसीद और गेट एंट्री पर्ची रखें। बिना लिखित कारण के कम तुलाई या कटौती स्वीकार न करें; व्यापारी वज़न या भाव में गड़बड़ करे तो मंडी सचिव या कृषि विपणन अधिकारी से शिकायत करें। न्यूनतम समर्थन मूल्य वाली फसलें अधिसूचित तारीखों में ही अधिसूचित खरीद केंद्र पर बेचें।',
      kn: 'ನಿಯಂತ್ರಿತ ಮಂಡಿ (ಎಪಿಎಂಸಿ) ಅಥವಾ ಸರ್ಕಾರಿ ಖರೀದಿ ಕೇಂದ್ರದ ಮೂಲಕ ಮಾರಾಟ ಮಾಡಿ, ಅಲ್ಲಿ ಪರಿಶೀಲಿತ ತಕ್ಕಡಿಯಲ್ಲಿ ತೂಕ ಮಾಡುತ್ತಾರೆ, ನಿಮಗೆ ರಸೀದಿ ಸಿಗುತ್ತದೆ ಮತ್ತು ಹಣ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬರುತ್ತದೆ. ಹೋಗುವ ಮೊದಲು ಮಂಡಿ ಮಂಡಳಿ ಅಥವಾ ಕೃಷಿ ಇಲಾಖೆಯ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಆ್ಯಪ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆಯ ಇಂದಿನ ಬೆಲೆ ನೋಡಿ, ಆಗ ಸರಿಯಾದ ದರ ತಿಳಿಯುತ್ತದೆ. ಮಾರಾಟದ ರಸೀದಿ ಮತ್ತು ಗೇಟ್ ಎಂಟ್ರಿ ಚೀಟಿ ಇಟ್ಟುಕೊಳ್ಳಿ. ಬರಹ ರೂಪದ ಕಾರಣ ಇಲ್ಲದೆ ಕಡಿಮೆ ತೂಕ ಅಥವಾ ಕಡಿತ ಒಪ್ಪಬೇಡಿ; ವರ್ತಕರು ತೂಕ ಅಥವಾ ಬೆಲೆಯಲ್ಲಿ ಮೋಸ ಮಾಡಿದರೆ ಮಂಡಿ ಕಾರ್ಯದರ್ಶಿ ಅಥವಾ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ಅಧಿಕಾರಿಗೆ ದೂರು ನೀಡಿ. ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ ಇರುವ ಬೆಳೆಗಳನ್ನು ಅಧಿಸೂಚಿತ ದಿನಾಂಕಗಳಲ್ಲಿ ಅಧಿಸೂಚಿತ ಖರೀದಿ ಕೇಂದ್ರದಲ್ಲಿ ಮಾತ್ರ ಮಾರಿ.',
    },
    sources: ['Agricultural Produce Market Committee (APMC) / mandi board', 'Department of Agriculture and Farmers Welfare'],
  },
  {
    key: 'kb-agri-pest',
    category: 'agriculture',
    tags: ['pest', 'insect', 'disease', 'crop damage', 'spray', 'pesticide', 'कीट', 'रोग', 'कीड़ा', 'दवा', 'ಕೀಟ', 'ರೋಗ', 'ಸಿಂಪಡಣೆ'],
    question: {
      en: 'Insects are attacking my crop. Whom should I ask for help?',
      hi: 'फसल पर कीट लग गए हैं। मदद के लिए किससे पूछें?',
      kn: 'ಬೆಳೆಗೆ ಕೀಟ ಬಾಧೆ ಬಂದಿದೆ. ಸಹಾಯಕ್ಕೆ ಯಾರನ್ನು ಕೇಳಬೇಕು?',
    },
    answer: {
      en: 'Take a few affected leaves or stems in a plastic bag to the Raitha Samparka Kendra, the Krishi Vigyan Kendra or the village agriculture assistant, and they will identify the pest and tell you the correct medicine and dose — this is free. Do not spray a random pesticide or mix several medicines, because that wastes money and can harm the crop and your health. Always wear a cloth over the nose and mouth and wash hands after spraying, and keep children and animals away for the stated period. If a large area is affected, report it to the agriculture officer so a survey can be done and compensation considered.',
      hi: 'कुछ प्रभावित पत्ते या तने पॉलीथिन की थैली में लेकर रायता संपर्क केंद्र, कृषि विज्ञान केंद्र या गांव के कृषि सहायक के पास जाएं; वे कीट की पहचान करके सही दवा और मात्रा बताएंगे — यह मुफ्त है। कोई भी दवा अंदाज़े से न छिड़कें और कई दवाएं न मिलाएं, इससे पैसा बर्बाद होता है और फसल तथा आपकी सेहत को नुकसान हो सकता है। छिड़काव के समय नाक-मुंह पर कपड़ा रखें, बाद में हाथ धोएं, और बताई गई अवधि तक बच्चों और पशुओं को दूर रखें। बड़ा क्षेत्र प्रभावित हो तो कृषि अधिकारी को सूचित करें ताकि सर्वेक्षण और मुआवज़े पर विचार हो सके।',
      kn: 'ಕೆಲವು ಬಾಧಿತ ಎಲೆ ಅಥವಾ ಕಾಂಡವನ್ನು ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲದಲ್ಲಿ ತೆಗೆದುಕೊಂಡು ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ, ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ಗ್ರಾಮದ ಕೃಷಿ ಸಹಾಯಕರ ಬಳಿ ಹೋಗಿ; ಅವರು ಕೀಟವನ್ನು ಗುರುತಿಸಿ ಸರಿಯಾದ ಔಷಧಿ ಮತ್ತು ಪ್ರಮಾಣ ಹೇಳುತ್ತಾರೆ — ಇದು ಉಚಿತ. ಯಾವುದೋ ಔಷಧಿಯನ್ನು ಊಹೆಯಿಂದ ಸಿಂಪಡಿಸಬೇಡಿ ಮತ್ತು ಹಲವು ಔಷಧಿ ಬೆರೆಸಬೇಡಿ, ಅದರಿಂದ ಹಣ ವ್ಯರ್ಥವಾಗುತ್ತದೆ ಮತ್ತು ಬೆಳೆ ಹಾಗೂ ನಿಮ್ಮ ಆರೋಗ್ಯಕ್ಕೆ ಹಾನಿಯಾಗಬಹುದು. ಸಿಂಪಡಿಸುವಾಗ ಮೂಗು-ಬಾಯಿಗೆ ಬಟ್ಟೆ ಕಟ್ಟಿಕೊಳ್ಳಿ, ನಂತರ ಕೈ ತೊಳೆಯಿರಿ, ಮತ್ತು ಹೇಳಿದ ಅವಧಿವರೆಗೆ ಮಕ್ಕಳು ಹಾಗೂ ಪ್ರಾಣಿಗಳನ್ನು ದೂರ ಇರಿಸಿ. ದೊಡ್ಡ ಪ್ರದೇಶ ಬಾಧಿತವಾದರೆ ಕೃಷಿ ಅಧಿಕಾರಿಗೆ ತಿಳಿಸಿ, ಸಮೀಕ್ಷೆ ಮತ್ತು ಪರಿಹಾರ ಪರಿಗಣಿಸಲು.',
    },
    sources: ['Krishi Vigyan Kendra network (ICAR)', 'Department of Agriculture plant protection'],
  },

  // ---------------------------------------------------------------- education
  {
    key: 'kb-edu-rte-admission',
    category: 'education',
    tags: ['rte', 'admission', 'school', 'free seat', 'private school', '25 percent', 'दाखिला', 'स्कूल', 'आरटीई', 'मुफ्त', 'ಪ್ರವೇಶ', 'ಶಾಲೆ', 'ಆರ್‌ಟಿಇ', 'ಉಚಿತ'],
    question: {
      en: 'Can my child get a free seat in a private school under RTE?',
      hi: 'क्या मेरे बच्चे को आरटीई के तहत निजी स्कूल में मुफ्त सीट मिल सकती है?',
      kn: 'ಆರ್‌ಟಿಇ ಅಡಿಯಲ್ಲಿ ನನ್ನ ಮಗುವಿಗೆ ಖಾಸಗಿ ಶಾಲೆಯಲ್ಲಿ ಉಚಿತ ಸೀಟು ಸಿಗಬಹುದೇ?',
    },
    answer: {
      en: 'Yes. Under the Right to Education Act, twenty-five per cent of seats in class one in private unaided schools are reserved for children from weaker and disadvantaged families, and the school cannot charge them a fee. Apply in the state RTE online portal or at the Block Education Office during the admission notification period, with the child\'s birth certificate, Aadhaar, address proof, income certificate and a caste certificate if applicable. Seats are given by lottery, so apply to every school you can. Admission cannot be refused for lack of documents like a transfer certificate; if a school refuses, complain to the Block Education Officer.',
      hi: 'हां। शिक्षा का अधिकार कानून के तहत निजी गैर-सहायता प्राप्त स्कूलों की पहली कक्षा में पच्चीस प्रतिशत सीटें कमज़ोर और वंचित वर्ग के बच्चों के लिए आरक्षित हैं, और स्कूल उनसे फीस नहीं ले सकता। दाखिला अधिसूचना के समय राज्य के आरटीई ऑनलाइन पोर्टल या खंड शिक्षा कार्यालय में बच्चे का जन्म प्रमाण पत्र, आधार, पते का प्रमाण, आय प्रमाण पत्र और जाति प्रमाण पत्र (यदि लागू हो) के साथ आवेदन करें। सीटें लॉटरी से मिलती हैं, इसलिए जितने स्कूलों में हो सके आवेदन करें। ट्रांसफर सर्टिफिकेट जैसे कागज़ों की कमी पर दाखिला नहीं रोका जा सकता; स्कूल मना करे तो खंड शिक्षा अधिकारी से शिकायत करें।',
      kn: 'ಹೌದು. ಶಿಕ್ಷಣದ ಹಕ್ಕು ಕಾಯ್ದೆಯಡಿ ಖಾಸಗಿ ಅನುದಾನರಹಿತ ಶಾಲೆಗಳ ಮೊದಲ ತರಗತಿಯ ಇಪ್ಪತ್ತೈದು ಪ್ರತಿಶತ ಸೀಟುಗಳು ದುರ್ಬಲ ಮತ್ತು ಹಿಂದುಳಿದ ಕುಟುಂಬಗಳ ಮಕ್ಕಳಿಗೆ ಮೀಸಲು, ಮತ್ತು ಶಾಲೆ ಅವರಿಂದ ಶುಲ್ಕ ಪಡೆಯುವಂತಿಲ್ಲ. ಪ್ರವೇಶ ಅಧಿಸೂಚನೆಯ ಸಮಯದಲ್ಲಿ ರಾಜ್ಯದ ಆರ್‌ಟಿಇ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್ ಅಥವಾ ತಾಲೂಕು ಶಿಕ್ಷಣ ಕಚೇರಿಯಲ್ಲಿ ಮಗುವಿನ ಜನನ ಪ್ರಮಾಣಪತ್ರ, ಆಧಾರ್, ವಿಳಾಸ ದಾಖಲೆ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಅನ್ವಯಿಸಿದರೆ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ಸೀಟುಗಳು ಲಾಟರಿ ಮೂಲಕ ಸಿಗುತ್ತವೆ, ಆದ್ದರಿಂದ ಸಾಧ್ಯವಾದಷ್ಟು ಶಾಲೆಗಳಿಗೆ ಅರ್ಜಿ ಹಾಕಿ. ವರ್ಗಾವಣೆ ಪ್ರಮಾಣಪತ್ರದಂತಹ ದಾಖಲೆ ಇಲ್ಲದ ಕಾರಣ ಪ್ರವೇಶ ನಿರಾಕರಿಸುವಂತಿಲ್ಲ; ಶಾಲೆ ನಿರಾಕರಿಸಿದರೆ ತಾಲೂಕು ಶಿಕ್ಷಣ ಅಧಿಕಾರಿಗೆ ದೂರು ನೀಡಿ.',
    },
    sources: ['Right to Education Act 2009', 'State RTE admission portal'],
  },
  {
    key: 'kb-edu-school-facilities',
    category: 'education',
    tags: ['mid day meal', 'school', 'books', 'uniform', 'scholarship', 'attendance', 'मध्याह्न भोजन', 'स्कूल', 'किताब', 'यूनिफॉर्म', 'ಶಾಲೆ', 'ಮಧ್ಯಾಹ್ನ ಊಟ', 'ಪುಸ್ತಕ', 'ಸಮವಸ್ತ್ರ'],
    question: {
      en: 'What free facilities should my child get in a government school?',
      hi: 'सरकारी स्कूल में मेरे बच्चे को कौन सी मुफ्त सुविधाएं मिलनी चाहिए?',
      kn: 'ಸರ್ಕಾರಿ ಶಾಲೆಯಲ್ಲಿ ನನ್ನ ಮಗುವಿಗೆ ಯಾವ ಉಚಿತ ಸೌಲಭ್ಯಗಳು ಸಿಗಬೇಕು?',
    },
    answer: {
      en: 'In a government school a child should get free textbooks, free uniform or a uniform allowance, a hot cooked midday meal on every school day, free admission and no fee up to class eight, and free bicycles or bus passes in many states. Girls get free sanitary napkins in many schools and there are separate toilets. If any of this is not being given, tell the School Management Committee, the headmaster or the Block Education Officer; the midday meal menu must be displayed and the school must keep a register. Also ask about the pre-matric scholarship and any state book or kit allowance your child is entitled to.',
      hi: 'सरकारी स्कूल में बच्चे को मुफ्त किताबें, मुफ्त यूनिफॉर्म या यूनिफॉर्म भत्ता, हर स्कूल दिवस पर गर्म पका मध्याह्न भोजन, आठवीं तक मुफ्त दाखिला और कोई फीस नहीं, और कई राज्यों में मुफ्त साइकिल या बस पास मिलना चाहिए। कई स्कूलों में छात्राओं को मुफ्त सैनिटरी नैपकिन मिलते हैं और अलग शौचालय होते हैं। इनमें से कुछ न मिले तो स्कूल प्रबंधन समिति, प्रधानाचार्य या खंड शिक्षा अधिकारी को बताएं; मध्याह्न भोजन का मेन्यू लगा होना चाहिए और स्कूल को रजिस्टर रखना होता है। प्री-मैट्रिक छात्रवृत्ति और राज्य की किताब या किट भत्ता के बारे में भी पूछें।',
      kn: 'ಸರ್ಕಾರಿ ಶಾಲೆಯಲ್ಲಿ ಮಗುವಿಗೆ ಉಚಿತ ಪಠ್ಯಪುಸ್ತಕ, ಉಚಿತ ಸಮವಸ್ತ್ರ ಅಥವಾ ಸಮವಸ್ತ್ರ ಭತ್ಯೆ, ಪ್ರತಿ ಶಾಲಾ ದಿನದಂದು ಬಿಸಿ ಬೇಯಿಸಿದ ಮಧ್ಯಾಹ್ನ ಊಟ, ಎಂಟನೇ ತರಗತಿವರೆಗೆ ಉಚಿತ ಪ್ರವೇಶ ಮತ್ತು ಶುಲ್ಕ ಇಲ್ಲ, ಮತ್ತು ಅನೇಕ ರಾಜ್ಯಗಳಲ್ಲಿ ಉಚಿತ ಸೈಕಲ್ ಅಥವಾ ಬಸ್ ಪಾಸ್ ಸಿಗಬೇಕು. ಅನೇಕ ಶಾಲೆಗಳಲ್ಲಿ ಹುಡುಗಿಯರಿಗೆ ಉಚಿತ ಸ್ಯಾನಿಟರಿ ಪ್ಯಾಡ್ ಮತ್ತು ಪ್ರತ್ಯೇಕ ಶೌಚಾಲಯ ಇರುತ್ತದೆ. ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಸಿಗದಿದ್ದರೆ ಶಾಲಾ ನಿರ್ವಹಣಾ ಸಮಿತಿ, ಮುಖ್ಯೋಪಾಧ್ಯಾಯರು ಅಥವಾ ತಾಲೂಕು ಶಿಕ್ಷಣ ಅಧಿಕಾರಿಗೆ ತಿಳಿಸಿ; ಮಧ್ಯಾಹ್ನ ಊಟದ ಮೆನು ಪ್ರದರ್ಶನವಾಗಿರಬೇಕು ಮತ್ತು ಶಾಲೆ ನೋಂದಣಿ ಪುಸ್ತಕ ಇಟ್ಟುಕೊಳ್ಳಬೇಕು. ಪ್ರಿ-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ರಾಜ್ಯದ ಪುಸ್ತಕ ಅಥವಾ ಕಿಟ್ ಭತ್ಯೆಯ ಬಗ್ಗೆಯೂ ಕೇಳಿ.',
    },
    sources: ['PM POSHAN (midday meal) scheme', 'Samagra Shiksha', 'State education department'],
  },
  {
    key: 'kb-edu-dropout-rejoin',
    category: 'education',
    tags: ['dropout', 'child labour', 'rejoin', 'school', 'open school', 'बीच में छोड़ा', 'स्कूल', 'बाल मजदूरी', 'ಶಾಲೆ ಬಿಟ್ಟ', 'ಮಕ್ಕಳ ಕೂಲಿ', 'ಮತ್ತೆ ಪ್ರವೇಶ'],
    question: {
      en: 'My child stopped going to school. How can he or she join again?',
      hi: 'मेरे बच्चे ने स्कूल जाना बंद कर दिया। दोबारा दाखिला कैसे होगा?',
      kn: 'ನನ್ನ ಮಗು ಶಾಲೆಗೆ ಹೋಗುವುದನ್ನು ನಿಲ್ಲಿಸಿದೆ. ಮತ್ತೆ ಪ್ರವೇಶ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'A child who has dropped out has the right to rejoin school at the age-appropriate class under the Right to Education Act, and the school cannot refuse. Go to the nearest government school or the Block Education Office with the child\'s Aadhaar, birth certificate and any old report card; if the child has no documents, the school must still admit and help with the paperwork. Special training is given to help the child catch up with the class. If the child is above fourteen, ask about open schooling, NIOS or a skill course at the ITI. If a child is being made to work instead of going to school, that is child labour — report it on the Childline 1098 number.',
      hi: 'स्कूल छोड़ चुके बच्चे को शिक्षा के अधिकार कानून के तहत उम्र के अनुसार कक्षा में दोबारा दाखिला पाने का हक है, और स्कूल मना नहीं कर सकता। बच्चे के आधार, जन्म प्रमाण पत्र और पुरानी रिपोर्ट कार्ड लेकर नज़दीकी सरकारी स्कूल या खंड शिक्षा कार्यालय जाएं; कागज़ न हों तो भी स्कूल को दाखिला देना चाहिए और कागज़ी काम में मदद करनी चाहिए। बच्चे को कक्षा के साथ चलने के लिए विशेष प्रशिक्षण दिया जाता है। बच्चा चौदह साल से अधिक हो तो ओपन स्कूलिंग, एनआईओएस या आईटीआई के कौशल कोर्स के बारे में पूछें। बच्चे से स्कूल की जगह काम कराया जा रहा हो तो यह बाल मजदूरी है — चाइल्डलाइन 1098 पर शिकायत करें।',
      kn: 'ಶಾಲೆ ಬಿಟ್ಟ ಮಗುವಿಗೆ ಶಿಕ್ಷಣದ ಹಕ್ಕು ಕಾಯ್ದೆಯಡಿ ವಯಸ್ಸಿಗೆ ತಕ್ಕ ತರಗತಿಯಲ್ಲಿ ಮತ್ತೆ ಪ್ರವೇಶ ಪಡೆಯುವ ಹಕ್ಕು ಇದೆ, ಮತ್ತು ಶಾಲೆ ನಿರಾಕರಿಸುವಂತಿಲ್ಲ. ಮಗುವಿನ ಆಧಾರ್, ಜನನ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಹಳೆಯ ವರದಿ ಪತ್ರಿಕೆ ಜೊತೆ ಹತ್ತಿರದ ಸರ್ಕಾರಿ ಶಾಲೆ ಅಥವಾ ತಾಲೂಕು ಶಿಕ್ಷಣ ಕಚೇರಿಗೆ ಹೋಗಿ; ದಾಖಲೆ ಇಲ್ಲದಿದ್ದರೂ ಶಾಲೆ ಪ್ರವೇಶ ನೀಡಬೇಕು ಮತ್ತು ಕಾಗದದ ಕೆಲಸದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬೇಕು. ಮಗು ತರಗತಿಯೊಂದಿಗೆ ಹೋಗಲು ವಿಶೇಷ ತರಬೇತಿ ನೀಡುತ್ತಾರೆ. ಮಗು ಹದಿನಾಲ್ಕು ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚಿದ್ದರೆ ಮುಕ್ತ ಶಾಲೆ, ಎನ್‌ಐಒಎಸ್ ಅಥವಾ ಐಟಿಐ ಕೌಶಲ ಕೋರ್ಸ್ ಬಗ್ಗೆ ಕೇಳಿ. ಮಗುವನ್ನು ಶಾಲೆಗೆ ಬದಲು ಕೆಲಸಕ್ಕೆ ಕಳುಹಿಸುತ್ತಿದ್ದರೆ ಅದು ಬಾಲ ಕಾರ್ಮಿಕ ಪದ್ಧತಿ — ಚೈಲ್ಡ್‌ಲೈನ್ 1098 ಗೆ ದೂರು ನೀಡಿ.',
    },
    sources: ['Right to Education Act — re-admission provisions', 'Childline 1098', 'NIOS open schooling'],
  },

  // ---------------------------------------------------------------- documents
  {
    key: 'kb-doc-aadhaar',
    category: 'documents',
    tags: ['aadhaar', 'aadhar', 'enrolment', 'update', 'address', 'card', 'आधार', 'सुधार', 'पता', 'कार्ड', 'ಆಧಾರ್', 'ಬದಲಾವಣೆ', 'ವಿಳಾಸ'],
    question: {
      en: 'How do I make a new Aadhaar or correct the name and address?',
      hi: 'नया आधार बनवाना या नाम-पता सुधारना है, कैसे करें?',
      kn: 'ಹೊಸ ಆಧಾರ್ ಮಾಡಿಸುವುದು ಅಥವಾ ಹೆಸರು-ವಿಳಾಸ ತಿದ್ದುವುದು ಹೇಗೆ?',
    },
    answer: {
      en: 'Go to an Aadhaar enrolment centre — usually at the Gram Panchayat, post office, bank branch or Common Service Centre — with proof of identity, address and date of birth; enrolment for a new Aadhaar is free and updates carry a small fee printed at the centre. Always take the acknowledgement slip and check the details printed on it before you leave, because corrections later need another visit. Never pay more than the printed fee and never give your Aadhaar number or OTP to anyone on the phone. For a child below five the biometrics are not taken and the Aadhaar must be updated after the child turns five and again at fifteen.',
      hi: 'आधार नामांकन केंद्र जाएं — आमतौर पर ग्राम पंचायत, डाकघर, बैंक शाखा या सीएससी केंद्र — पहचान, पते और जन्म तिथि के प्रमाण के साथ; नया आधार मुफ्त बनता है और सुधार का थोड़ा शुल्क केंद्र पर लिखा होता है। पावती पर्ची ज़रूर लें और जाने से पहले उस पर छपी जानकारी जांच लें, क्योंकि बाद में सुधार के लिए फिर आना पड़ेगा। छपे हुए शुल्क से ज़्यादा कभी न दें और अपना आधार नंबर या ओटीपी फोन पर किसी को न बताएं। पांच साल से छोटे बच्चे का बायोमेट्रिक नहीं लिया जाता और बच्चे के पांच साल तथा फिर पंद्रह साल पूरे होने पर आधार अपडेट कराना चाहिए।',
      kn: 'ಆಧಾರ್ ನೋಂದಣಿ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ — ಸಾಮಾನ್ಯವಾಗಿ ಗ್ರಾಮ ಪಂಚಾಯತ್, ಅಂಚೆ ಕಚೇರಿ, ಬ್ಯಾಂಕ್ ಶಾಖೆ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ — ಗುರುತು, ವಿಳಾಸ ಮತ್ತು ಹುಟ್ಟಿದ ದಿನಾಂಕದ ದಾಖಲೆ ಜೊತೆ; ಹೊಸ ಆಧಾರ್ ಉಚಿತ ಮತ್ತು ಬದಲಾವಣೆಗೆ ಕೇಂದ್ರದಲ್ಲಿ ಮುದ್ರಿತವಾದ ಸ್ವಲ್ಪ ಶುಲ್ಕ ಇರುತ್ತದೆ. ಸ್ವೀಕೃತಿ ಚೀಟಿ ಕಡ್ಡಾಯವಾಗಿ ಪಡೆಯಿರಿ ಮತ್ತು ಹೊರಡುವ ಮೊದಲು ಅದರಲ್ಲಿ ಮುದ್ರಿತ ವಿವರ ಪರಿಶೀಲಿಸಿ, ಏಕೆಂದರೆ ನಂತರ ತಿದ್ದುಪಡಿಗೆ ಮತ್ತೊಮ್ಮೆ ಬರಬೇಕು. ಮುದ್ರಿತ ಶುಲ್ಕಕ್ಕಿಂತ ಹೆಚ್ಚು ಎಂದಿಗೂ ಕೊಡಬೇಡಿ ಮತ್ತು ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಒಟಿಪಿ ಫೋನ್‌ನಲ್ಲಿ ಯಾರಿಗೂ ಹೇಳಬೇಡಿ. ಐದು ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಮಗುವಿನ ಬಯೋಮೆಟ್ರಿಕ್ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ ಮತ್ತು ಮಗು ಐದು ವರ್ಷ ಹಾಗೂ ನಂತರ ಹದಿನೈದು ವರ್ಷ ತುಂಬಿದಾಗ ಆಧಾರ್ ನವೀಕರಿಸಬೇಕು.',
    },
    sources: ['UIDAI Aadhaar portal', 'Aadhaar enrolment and update centres'],
  },
  {
    key: 'kb-doc-caste-certificate',
    category: 'documents',
    tags: ['caste certificate', 'caste', 'sc', 'st', 'obc', 'certificate', 'जाति प्रमाण पत्र', 'जाति', 'आरक्षण', 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ', 'ಜಾತಿ', 'ಮೀಸಲಾತಿ'],
    question: {
      en: 'How do I get a caste certificate?',
      hi: 'जाति प्रमाण पत्र कैसे बनवाएं?',
      kn: 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಹೇಗೆ ಪಡೆಯಬೇಕು?',
    },
    answer: {
      en: 'Apply at the taluk or tehsil office, the Gram Panchayat in some states, or on your state\'s e-district or Seva Sindhu portal; the certificate is normally issued within a few weeks and the fee is small. You need your Aadhaar, a photograph, address proof, your father\'s or a relative\'s existing caste certificate, and school records; for a scheduled tribe certificate the school record of a parent showing the tribe is important. Keep the application number to check the status online. The certificate is needed for scholarships, reservations, and some schemes, so apply in the name exactly as it appears on Aadhaar to avoid a mismatch later.',
      hi: 'तालुका या तहसील कार्यालय, कुछ राज्यों में ग्राम पंचायत, या अपने राज्य के ई-डिस्ट्रिक्ट या सेवा सिंधु पोर्टल पर आवेदन करें; प्रमाण पत्र आमतौर पर कुछ हफ्तों में बनता है और शुल्क कम होता है। आपको अपना आधार, फोटो, पते का प्रमाण, पिता या रिश्तेदार का पुराना जाति प्रमाण पत्र और स्कूल के रिकॉर्ड चाहिए; अनुसूचित जनजाति प्रमाण पत्र के लिए माता-पिता के स्कूल रिकॉर्ड में जनजाति का उल्लेख ज़रूरी है। स्थिति ऑनलाइन देखने के लिए आवेदन संख्या रखें। यह प्रमाण पत्र छात्रवृत्ति, आरक्षण और कई योजनाओं के लिए चाहिए, इसलिए नाम ठीक वैसा ही लिखें जैसा आधार पर है, ताकि बाद में गड़बड़ न हो।',
      kn: 'ತಾಲೂಕು ಕಚೇರಿ, ಕೆಲವು ರಾಜ್ಯಗಳಲ್ಲಿ ಗ್ರಾಮ ಪಂಚಾಯತ್, ಅಥವಾ ನಿಮ್ಮ ರಾಜ್ಯದ ಇ-ಡಿಸ್ಟ್ರಿಕ್ಟ್ ಅಥವಾ ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ಪ್ರಮಾಣಪತ್ರ ಸಾಮಾನ್ಯವಾಗಿ ಕೆಲವು ವಾರಗಳಲ್ಲಿ ಸಿಗುತ್ತದೆ ಮತ್ತು ಶುಲ್ಕ ಕಡಿಮೆ. ನಿಮ್ಮ ಆಧಾರ್, ಫೋಟೋ, ವಿಳಾಸ ದಾಖಲೆ, ತಂದೆ ಅಥವಾ ಸಂಬಂಧಿಕರ ಹಳೆಯ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಶಾಲಾ ದಾಖಲೆ ಬೇಕು; ಪರಿಶಿಷ್ಟ ಪಂಗಡ ಪ್ರಮಾಣಪತ್ರಕ್ಕೆ ಪೋಷಕರ ಶಾಲಾ ದಾಖಲೆಯಲ್ಲಿ ಪಂಗಡದ ಉಲ್ಲೇಖ ಮುಖ್ಯ. ಸ್ಥಿತಿಯನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನೋಡಲು ಅರ್ಜಿ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ. ಈ ಪ್ರಮಾಣಪತ್ರ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಮೀಸಲಾತಿ ಮತ್ತು ಅನೇಕ ಯೋಜನೆಗಳಿಗೆ ಬೇಕು, ಆದ್ದರಿಂದ ಹೆಸರನ್ನು ಆಧಾರ್‌ನಲ್ಲಿರುವಂತೆಯೇ ನಿಖರವಾಗಿ ಬರೆಯಿರಿ, ನಂತರ ಗೊಂದಲ ಆಗದಂತೆ.',
    },
    sources: ['State e-District / Seva Sindhu portals', 'Revenue department (taluk office)'],
  },
  {
    key: 'kb-doc-income-certificate',
    category: 'documents',
    tags: ['income certificate', 'income', 'certificate', 'annual income', 'आय प्रमाण पत्र', 'आय', 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ', 'ಆದಾಯ'],
    question: {
      en: 'How do I get an income certificate for a scheme or scholarship?',
      hi: 'योजना या छात्रवृत्ति के लिए आय प्रमाण पत्र कैसे बनवाएं?',
      kn: 'ಯೋಜನೆ ಅಥವಾ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಹೇಗೆ ಪಡೆಯಬೇಕು?',
    },
    answer: {
      en: 'Apply at the taluk or tehsil office, the Gram Panchayat, or your state\'s e-district or Seva Sindhu portal; the certificate is usually issued within a week or two for a small fee. You need Aadhaar, a photograph, address proof, and a declaration of the family\'s annual income from all sources — some offices also ask for a ration card, land records or a salary slip. Check the name and the amount printed on the certificate before you leave, because a wrong figure is the commonest reason a scholarship is rejected. Certificates are valid for one year, so apply again for each academic year and keep two photocopies.',
      hi: 'तालुका या तहसील कार्यालय, ग्राम पंचायत, या अपने राज्य के ई-डिस्ट्रिक्ट या सेवा सिंधु पोर्टल पर आवेदन करें; प्रमाण पत्र आमतौर पर एक-दो हफ्ते में थोड़े शुल्क पर मिल जाता है। आपको आधार, फोटो, पते का प्रमाण और परिवार की सभी स्रोतों से सालाना आय की घोषणा चाहिए — कुछ दफ्तर राशन कार्ड, ज़मीन के कागज़ या वेतन पर्ची भी मांगते हैं। जाने से पहले प्रमाण पत्र पर छपा नाम और राशि जांच लें, क्योंकि गलत आंकड़ा ही छात्रवृत्ति रद्द होने का सबसे आम कारण है। प्रमाण पत्र एक साल के लिए मान्य होता है, इसलिए हर शैक्षणिक वर्ष फिर आवेदन करें और दो फोटोकॉपी रखें।',
      kn: 'ತಾಲೂಕು ಕಚೇರಿ, ಗ್ರಾಮ ಪಂಚಾಯತ್, ಅಥವಾ ನಿಮ್ಮ ರಾಜ್ಯದ ಇ-ಡಿಸ್ಟ್ರಿಕ್ಟ್ ಅಥವಾ ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ಪ್ರಮಾಣಪತ್ರ ಸಾಮಾನ್ಯವಾಗಿ ಒಂದೆರಡು ವಾರಗಳಲ್ಲಿ ಸ್ವಲ್ಪ ಶುಲ್ಕಕ್ಕೆ ಸಿಗುತ್ತದೆ. ನಿಮ್ಮ ಆಧಾರ್, ಫೋಟೋ, ವಿಳಾಸ ದಾಖಲೆ, ಮತ್ತು ಕುಟುಂಬದ ಎಲ್ಲಾ ಮೂಲಗಳ ವಾರ್ಷಿಕ ಆದಾಯದ ಘೋಷಣೆ ಬೇಕು — ಕೆಲವು ಕಚೇರಿಗಳು ರೇಷನ್ ಕಾರ್ಡ್, ಭೂ ದಾಖಲೆ ಅಥವಾ ಸಂಬಳ ಪತ್ರವನ್ನೂ ಕೇಳುತ್ತವೆ. ಹೊರಡುವ ಮೊದಲು ಪ್ರಮಾಣಪತ್ರದಲ್ಲಿ ಮುದ್ರಿತ ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಪರಿಶೀಲಿಸಿ, ಏಕೆಂದರೆ ತಪ್ಪು ಅಂಕಿಯೇ ವಿದ್ಯಾರ್ಥಿವೇತನ ತಿರಸ್ಕಾರಕ್ಕೆ ಸಾಮಾನ್ಯ ಕಾರಣ. ಪ್ರಮಾಣಪತ್ರ ಒಂದು ವರ್ಷ ಮಾನ್ಯ, ಆದ್ದರಿಂದ ಪ್ರತಿ ಶೈಕ್ಷಣಿಕ ವರ್ಷ ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಎರಡು ಫೋಟೋಕಾಪಿ ಇಟ್ಟುಕೊಳ್ಳಿ.',
    },
    sources: ['State e-District / Seva Sindhu portals', 'Revenue department (taluk office)'],
  },
  {
    key: 'kb-doc-ration-card',
    category: 'documents',
    tags: ['ration card', 'ration', 'pds', 'food', 'add name', 'new card', 'राशन कार्ड', 'राशन', 'नाम जोड़ना', 'ಅಕ್ಕಿ ಕಾರ್ಡ್', 'ರೇಷನ್', 'ಹೆಸರು ಸೇರಿಸುವುದು'],
    question: {
      en: 'How do I add a name to the ration card or apply for a new one?',
      hi: 'राशन कार्ड में नाम जोड़ना या नया कार्ड बनवाना है, कैसे करें?',
      kn: 'ಅಕ್ಕಿ ಕಾರ್ಡ್‌ಗೆ ಹೆಸರು ಸೇರಿಸುವುದು ಅಥವಾ ಹೊಸ ಕಾರ್ಡ್ ಪಡೆಯುವುದು ಹೇಗೆ?',
    },
    answer: {
      en: 'Apply at the Gram Panchayat or the taluk food and civil supplies office, or on the state food department portal; a new card is free or carries a very small fee. For a new card you need Aadhaar of every family member, address proof, and an income or category declaration; to add a newborn or a daughter-in-law you need the birth or marriage certificate and their Aadhaar. The family must be linked to one ration card only — holding two cards is an offence. After the change, check that the name appears on the card and in the fair price shop register; if the dealer refuses, complain to the taluk food inspector or on the department helpline.',
      hi: 'ग्राम पंचायत या तालुका खाद्य एवं नागरिक आपूर्ति कार्यालय, या राज्य के खाद्य विभाग पोर्टल पर आवेदन करें; नया कार्ड मुफ्त या बहुत कम शुल्क पर बनता है। नए कार्ड के लिए परिवार के हर सदस्य का आधार, पते का प्रमाण, और आय या श्रेणी की घोषणा चाहिए; नवजात या बहू का नाम जोड़ने के लिए जन्म या विवाह प्रमाण पत्र और उनका आधार चाहिए। एक परिवार का एक ही राशन कार्ड होना चाहिए — दो कार्ड रखना अपराध है। बदलाव के बाद जांचें कि नाम कार्ड और उचित दर दुकान के रजिस्टर में दिख रहा है; डीलर मना करे तो तालुका खाद्य निरीक्षक या विभाग की हेल्पलाइन पर शिकायत करें।',
      kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ತಾಲೂಕು ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಕಚೇರಿ, ಅಥವಾ ರಾಜ್ಯದ ಆಹಾರ ಇಲಾಖೆ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ಹೊಸ ಕಾರ್ಡ್ ಉಚಿತ ಅಥವಾ ತೀರಾ ಕಡಿಮೆ ಶುಲ್ಕ. ಹೊಸ ಕಾರ್ಡ್‌ಗೆ ಕುಟುಂಬದ ಪ್ರತಿ ಸದಸ್ಯರ ಆಧಾರ್, ವಿಳಾಸ ದಾಖಲೆ, ಮತ್ತು ಆದಾಯ ಅಥವಾ ವರ್ಗದ ಘೋಷಣೆ ಬೇಕು; ನವಜಾತ ಶಿಶು ಅಥವಾ ಸೊಸೆಯ ಹೆಸರು ಸೇರಿಸಲು ಜನನ ಅಥವಾ ವಿವಾಹ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಅವರ ಆಧಾರ್ ಬೇಕು. ಒಂದು ಕುಟುಂಬಕ್ಕೆ ಒಂದೇ ಅಕ್ಕಿ ಕಾರ್ಡ್ ಇರಬೇಕು — ಎರಡು ಕಾರ್ಡ್ ಇಟ್ಟುಕೊಳ್ಳುವುದು ಅಪರಾಧ. ಬದಲಾವಣೆಯ ನಂತರ ಹೆಸರು ಕಾರ್ಡ್‌ನಲ್ಲಿ ಮತ್ತು ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ ನೋಂದಣಿಯಲ್ಲಿ ಕಾಣುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ; ಡೀಲರ್ ನಿರಾಕರಿಸಿದರೆ ತಾಲೂಕು ಆಹಾರ ನಿರೀಕ್ಷಕ ಅಥವಾ ಇಲಾಖೆಯ ಸಹಾಯವಾಣಿಗೆ ದೂರು ನೀಡಿ.',
    },
    sources: ['National Food Security Act — PDS', 'State food and civil supplies department'],
  },

  // ---------------------------------------------------------------- emergency
  {
    key: 'kb-emergency-ambulance',
    category: 'emergency',
    tags: ['ambulance', '108', '112', 'emergency', 'hospital', 'asha', 'एम्बुलेंस', 'आपातकाल', 'अस्पताल', 'आशा', 'ಆಂಬ್ಯುಲೆನ್ಸ್', 'ತುರ್ತು', 'ಆಸ್ಪತ್ರೆ', 'ಆಶಾ'],
    question: {
      en: 'How do I call an ambulance in an emergency?',
      hi: 'आपात स्थिति में एम्बुलेंस कैसे बुलाएं?',
      kn: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಆಂಬ್ಯುಲೆನ್ಸ್ ಹೇಗೆ ಕರೆಯಬೇಕು?',
    },
    answer: {
      en: 'Dial 108 for a free emergency ambulance, and 112 for police, fire or any emergency; both work from any phone, even without balance. Tell the operator the exact village, a landmark, the patient\'s age and what happened, and keep the phone reachable. For pregnancy and child emergencies you can also call the ASHA worker or ANM, who can arrange transport and accompany the patient. While waiting, keep the patient lying down, do not give food or water if they are unconscious, and carry any medicine strips and old papers to the hospital. 104 is the health advice line for non-emergency questions.',
      hi: 'मुफ्त आपातकालीन एम्बुलेंस के लिए 108 डायल करें, और पुलिस, दमकल या किसी भी आपात स्थिति के लिए 112; दोनों किसी भी फोन से, बिना बैलेंस के भी लगते हैं। ऑपरेटर को सही गांव, कोई पहचान चिह्न, मरीज़ की उम्र और क्या हुआ बताएं, और फोन पास रखें। गर्भावस्था और बच्चों की आपात स्थिति में आशा कार्यकर्ता या एएनएम को भी बुला सकते हैं, जो वाहन की व्यवस्था कर अस्पताल तक साथ जाती हैं। प्रतीक्षा में मरीज़ को लिटाए रखें, बेहोश हो तो कुछ खाने-पीने न दें, और दवाइयों के पत्ते तथा पुराने कागज़ अस्पताल ले जाएं। गैर-आपातकालीन सलाह के लिए 104 स्वास्थ्य सलाह लाइन है।',
      kn: 'ಉಚಿತ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ 108 ಡಯಲ್ ಮಾಡಿ, ಮತ್ತು ಪೊಲೀಸ್, ಅಗ್ನಿಶಾಮಕ ಅಥವಾ ಯಾವುದೇ ತುರ್ತಿಗೆ 112; ಎರಡೂ ಯಾವುದೇ ಫೋನ್‌ನಿಂದ, ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲದಿದ್ದರೂ ಸಂಪರ್ಕವಾಗುತ್ತವೆ. ನಿರ್ವಾಹಕರಿಗೆ ನಿಖರ ಹಳ್ಳಿ, ಗುರುತಿನ ಸ್ಥಳ, ರೋಗಿಯ ವಯಸ್ಸು ಮತ್ತು ಏನಾಯಿತು ಎಂದು ಹೇಳಿ, ಮತ್ತು ಫೋನ್ ಹತ್ತಿರ ಇಟ್ಟುಕೊಳ್ಳಿ. ಗರ್ಭಾವಸ್ಥೆ ಮತ್ತು ಮಕ್ಕಳ ತುರ್ತಿನಲ್ಲಿ ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಅಥವಾ ಎಎನ್‌ಎಂ ಅವರನ್ನೂ ಕರೆಯಬಹುದು, ಅವರು ವಾಹನದ ವ್ಯವಸ್ಥೆ ಮಾಡಿ ಆಸ್ಪತ್ರೆಯವರೆಗೆ ಜೊತೆ ಬರುತ್ತಾರೆ. ಕಾಯುತ್ತಿರುವಾಗ ರೋಗಿಯನ್ನು ಮಲಗಿಸಿ, ಪ್ರಜ್ಞೆ ಇಲ್ಲದಿದ್ದರೆ ಏನನ್ನೂ ತಿನ್ನಲು ಅಥವಾ ಕುಡಿಯಲು ಕೊಡಬೇಡಿ, ಮತ್ತು ಔಷಧಿ ಪ್ಯಾಕೆಟ್ ಹಾಗೂ ಹಳೆಯ ದಾಖಲೆಗಳನ್ನು ಆಸ್ಪತ್ರೆಗೆ ಒಯ್ಯಿರಿ. ತುರ್ತಲ್ಲದ ಸಲಹೆಗೆ 104 ಆರೋಗ್ಯ ಸಲಹಾ ಸಂಖ್ಯೆ.',
    },
    sources: ['108 emergency ambulance service', '112 national emergency number', '104 health helpline'],
  },
  {
    key: 'kb-emergency-flood',
    category: 'emergency',
    tags: ['flood', 'rain', 'water', 'rescue', 'disaster', 'बाढ़', 'पानी', 'बारिश', 'राहत', 'ಪ್ರವಾಹ', 'ಮಳೆ', 'ರಕ್ಷಣೆ', 'ಆಪತ್ತು'],
    question: {
      en: 'What should I do during heavy rain and floods?',
      hi: 'भारी बारिश और बाढ़ के समय क्या करें?',
      kn: 'ಭಾರೀ ಮಳೆ ಮತ್ತು ಪ್ರವಾಹದ ಸಮಯದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Move to higher ground or a relief camp as soon as the Panchayat or the administration announces it, and do not wait for the water to reach the house. Switch off the electricity at the main switch before water enters, keep drinking water in a covered container, and carry your documents in a plastic bag. Do not walk or drive through flowing water, and do not touch electric poles or wires. Boil or chlorinate drinking water during and after the flood, because diarrhoea spreads quickly. Take children and elderly people with you, and call 112 for rescue. Report damage to the Panchayat with photographs for compensation.',
      hi: 'पंचायत या प्रशासन की घोषणा होते ही ऊंची जगह या राहत शिविर में चले जाएं, पानी घर तक पहुंचने का इंतज़ार न करें। पानी घर में घुसने से पहले मेन स्विच से बिजली बंद करें, पीने का पानी ढके बर्तन में रखें, और अपने दस्तावेज़ पॉलीथिन की थैली में रखकर साथ ले जाएं। बहते पानी में पैदल या वाहन से न जाएं, और बिजली के खंभे या तार न छुएं। बाढ़ के दौरान और बाद में पीने का पानी उबालें या क्लोरीन डालें, क्योंकि दस्त तेज़ी से फैलते हैं। बच्चों और बुज़ुर्गों को साथ ले जाएं, और बचाव के लिए 112 पर कॉल करें। मुआवज़े के लिए नुकसान की फोटो के साथ पंचायत में सूचना दें।',
      kn: 'ಪಂಚಾಯತ್ ಅಥವಾ ಆಡಳಿತ ಘೋಷಣೆ ಮಾಡಿದ ತಕ್ಷಣ ಎತ್ತರದ ಸ್ಥಳ ಅಥವಾ ಪರಿಹಾರ ಶಿಬಿರಕ್ಕೆ ಹೋಗಿ, ನೀರು ಮನೆಗೆ ಬರುವವರೆಗೆ ಕಾಯಬೇಡಿ. ನೀರು ಮನೆಗೆ ಬರುವ ಮೊದಲು ಮುಖ್ಯ ಸ್ವಿಚ್‌ನಿಂದ ವಿದ್ಯುತ್ ಆಫ್ ಮಾಡಿ, ಕುಡಿಯುವ ನೀರನ್ನು ಮುಚ್ಚಿದ ಪಾತ್ರೆಯಲ್ಲಿ ಇಡಿ, ಮತ್ತು ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲದಲ್ಲಿ ಹಾಕಿ ಒಯ್ಯಿರಿ. ಹರಿಯುವ ನೀರಿನಲ್ಲಿ ನಡೆಯಬೇಡಿ ಅಥವಾ ವಾಹನದಲ್ಲಿ ಹೋಗಬೇಡಿ, ಮತ್ತು ವಿದ್ಯುತ್ ಕಂಬ ಅಥವಾ ತಂತಿ ಮುಟ್ಟಬೇಡಿ. ಪ್ರವಾಹದ ಸಮಯ ಮತ್ತು ನಂತರ ಕುಡಿಯುವ ನೀರನ್ನು ಕುದಿಸಿ ಅಥವಾ ಕ್ಲೋರಿನ್ ಹಾಕಿ, ಏಕೆಂದರೆ ಭೇದಿ ಬೇಗ ಹರಡುತ್ತದೆ. ಮಕ್ಕಳು ಮತ್ತು ವೃದ್ಧರನ್ನು ಜೊತೆಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ, ಮತ್ತು ರಕ್ಷಣೆಗೆ 112 ಗೆ ಕರೆ ಮಾಡಿ. ಪರಿಹಾರಕ್ಕಾಗಿ ಹಾನಿಯ ಫೋಟೋ ಜೊತೆ ಪಂಚಾಯತ್‌ಗೆ ಮಾಹಿತಿ ನೀಡಿ.',
    },
    sources: ['NDMA flood guidelines', '112 national emergency number'],
  },
  {
    key: 'kb-emergency-fire-burns',
    category: 'emergency',
    tags: ['fire', 'burn', 'burns', 'cylinder', 'electric', 'आग', 'जलना', 'सिलेंडर', 'बिजली', 'ಬೆಂಕಿ', 'ಸುಟ್ಟ ಗಾಯ', 'ಸಿಲಿಂಡರ್'],
    question: {
      en: 'What should I do if there is a fire or someone is burnt?',
      hi: 'आग लगने या कोई जल जाए तो क्या करें?',
      kn: 'ಬೆಂಕಿ ಆದರೆ ಅಥವಾ ಯಾರಾದರೂ ಸುಟ್ಟುಕೊಂಡರೆ ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'For a burn, pour cool running water over the area for about twenty minutes, remove rings and tight clothes before swelling starts, and cover the burn with a clean cloth or cling film. Do not apply oil, toothpaste, turmeric or ash, and do not burst blisters. Take the person to a hospital for any large, deep, facial or child burn, and call 108. For a fire, switch off the electricity and gas, get everyone out, and call 101 for the fire service and 112 for help; never go back inside for belongings. If clothes catch fire, stop, drop to the ground and roll to smother the flames.',
      hi: 'जलने पर जले हुए हिस्से पर लगभग बीस मिनट तक ठंडा बहता पानी डालें, सूजन शुरू होने से पहले अंगूठी और तंग कपड़े निकालें, और जगह को साफ कपड़े या क्लिंग फिल्म से ढकें। तेल, टूथपेस्ट, हल्दी या राख न लगाएं, और छाले न फोड़ें। बड़ा, गहरा, चेहरे का या बच्चे का जला हुआ हिस्सा हो तो मरीज़ को अस्पताल ले जाएं और 108 पर कॉल करें। आग लगने पर बिजली और गैस बंद करें, सबको बाहर निकालें, और दमकल के लिए 101 तथा मदद के लिए 112 पर कॉल करें; सामान के लिए कभी वापस अंदर न जाएं। कपड़े में आग लगे तो रुकें, ज़मीन पर लेटें और लुढ़ककर आग बुझाएं।',
      kn: 'ಸುಟ್ಟ ಗಾಯಕ್ಕೆ ಸುಮಾರು ಇಪ್ಪತ್ತು ನಿಮಿಷ ತಣ್ಣನೆಯ ಹರಿಯುವ ನೀರನ್ನು ಸುರಿಯಿರಿ, ಊತ ಪ್ರಾರಂಭವಾಗುವ ಮೊದಲು ಉಂಗುರ ಮತ್ತು ಬಿಗಿಯಾದ ಬಟ್ಟೆ ತೆಗೆಯಿರಿ, ಮತ್ತು ಗಾಯವನ್ನು ಸ್ವಚ್ಛ ಬಟ್ಟೆ ಅಥವಾ ಕ್ಲಿಂಗ್ ಫಿಲ್ಮ್‌ನಿಂದ ಮುಚ್ಚಿ. ಎಣ್ಣೆ, ಟೂತ್‌ಪೇಸ್ಟ್, ಅರಿಶಿನ ಅಥವಾ ಬೂದಿ ಹಚ್ಚಬೇಡಿ, ಮತ್ತು ಗುಳ್ಳೆ ಒಡೆಯಬೇಡಿ. ದೊಡ್ಡ, ಆಳವಾದ, ಮುಖದ ಅಥವಾ ಮಗುವಿನ ಸುಟ್ಟ ಗಾಯವಾದರೆ ರೋಗಿಯನ್ನು ಆಸ್ಪತ್ರೆಗೆ ಒಯ್ಯಿರಿ ಮತ್ತು 108 ಗೆ ಕರೆ ಮಾಡಿ. ಬೆಂಕಿ ಆದರೆ ವಿದ್ಯುತ್ ಮತ್ತು ಗ್ಯಾಸ್ ಆಫ್ ಮಾಡಿ, ಎಲ್ಲರನ್ನು ಹೊರಗೆ ಕಳುಹಿಸಿ, ಅಗ್ನಿಶಾಮಕಕ್ಕೆ 101 ಮತ್ತು ಸಹಾಯಕ್ಕೆ 112 ಗೆ ಕರೆ ಮಾಡಿ; ಸಾಮಾನುಗಳಿಗಾಗಿ ಎಂದಿಗೂ ಒಳಗೆ ಹಿಂತಿರುಗಬೇಡಿ. ಬಟ್ಟೆಗೆ ಬೆಂಕಿ ಹತ್ತಿದರೆ ನಿಲ್ಲಿ, ನೆಲಕ್ಕೆ ಮಲಗಿ ಉರುಳಿ ಬೆಂಕಿ ಆರಿಸಿ.',
    },
    sources: ['NDMA fire safety guidelines', '101 fire service', '112 national emergency number'],
  },
  {
    key: 'kb-emergency-women-child',
    category: 'emergency',
    tags: ['women', 'safety', 'violence', 'child', 'helpline', '181', '1098', 'महिला', 'सुरक्षा', 'हिंसा', 'बच्चा', 'मಹಿಳಾ', 'ಸುರಕ್ಷತೆ', 'ಹಿಂಸೆ', 'ಮಗು'],
    question: {
      en: 'Where can a woman or child in danger get help?',
      hi: 'खतरे में महिला या बच्चा मदद कहां से पा सकता है?',
      kn: 'ಅಪಾಯದಲ್ಲಿರುವ ಮಹಿಳೆ ಅಥವಾ ಮಗುವಿಗೆ ಸಹಾಯ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Call 181 for the women\'s helpline, 1098 for Childline, and 112 for immediate police help; all are free and work from any phone. The 181 helpline can arrange a counsellor, a shelter and legal help, and the Anganwadi worker, ASHA worker and the Gram Panchayat can also support you. If there is violence at home, try to reach a safe place and keep a copy of your documents with a trusted person. A complaint can be filed at any police station, including a zero FIR, and there are special women\'s help desks at district police offices. Do not withdraw a complaint under pressure — ask the helpline or a legal aid lawyer at the District Legal Services Authority for free advice.',
      hi: 'महिला हेल्पलाइन 181, चाइल्डलाइन 1098, और तुरंत पुलिस सहायता के लिए 112 पर कॉल करें; सभी मुफ्त हैं और किसी भी फोन से लगते हैं। 181 हेल्पलाइन सलाहकार, आश्रय और कानूनी मदद की व्यवस्था कर सकती है, और आंगनवाड़ी कार्यकर्ता, आशा कार्यकर्ता तथा ग्राम पंचायत भी सहायता कर सकते हैं। घर में हिंसा हो तो सुरक्षित जगह पहुंचने की कोशिश करें और अपने दस्तावेज़ों की एक प्रति किसी भरोसेमंद व्यक्ति के पास रखें। शिकायत किसी भी थाने में, ज़ीरो एफआईआर सहित, दर्ज हो सकती है, और ज़िला पुलिस कार्यालय में महिला हेल्प डेस्क होते हैं। दबाव में शिकायत वापस न लें — हेल्पलाइन या ज़िला विधिक सेवा प्राधिकरण के वकील से मुफ्त सलाह लें।',
      kn: 'ಮಹಿಳಾ ಸಹಾಯವಾಣಿ 181, ಚೈಲ್ಡ್‌ಲೈನ್ 1098, ಮತ್ತು ತಕ್ಷಣ ಪೊಲೀಸ್ ಸಹಾಯಕ್ಕೆ 112 ಗೆ ಕರೆ ಮಾಡಿ; ಎಲ್ಲವೂ ಉಚಿತ ಮತ್ತು ಯಾವುದೇ ಫೋನ್‌ನಿಂದ ಸಂಪರ್ಕವಾಗುತ್ತವೆ. 181 ಸಹಾಯವಾಣಿ ಸಲಹೆಗಾರ, ಆಶ್ರಯ ಮತ್ತು ಕಾನೂನು ಸಹಾಯದ ವ್ಯವಸ್ಥೆ ಮಾಡಬಹುದು, ಮತ್ತು ಅಂಗನವಾಡಿ ಕಾರ್ಯಕರ್ತೆ, ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಹಾಗೂ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕೂಡ ಸಹಾಯ ಮಾಡಬಹುದು. ಮನೆಯಲ್ಲಿ ಹಿಂಸೆ ಇದ್ದರೆ ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತಲುಪಲು ಪ್ರಯತ್ನಿಸಿ ಮತ್ತು ನಿಮ್ಮ ದಾಖಲೆಗಳ ಪ್ರತಿಯನ್ನು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯ ಬಳಿ ಇಡಿ. ದೂರನ್ನು ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ, ಜೀರೋ ಎಫ್‌ಐಆರ್ ಸೇರಿದಂತೆ, ದಾಖಲಿಸಬಹುದು, ಮತ್ತು ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ಕಚೇರಿಯಲ್ಲಿ ಮಹಿಳಾ ಸಹಾಯ ಡೆಸ್ಕ್ ಇರುತ್ತದೆ. ಒತ್ತಡಕ್ಕೆ ಒಳಗಾಗಿ ದೂರು ಹಿಂಪಡೆಯಬೇಡಿ — ಸಹಾಯವಾಣಿ ಅಥವಾ ಜಿಲ್ಲಾ ಕಾನೂನು ಸೇವಾ ಪ್ರಾಧಿಕಾರದ ವಕೀಲರಿಂದ ಉಚಿತ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    },
    sources: ['181 women helpline', 'Childline 1098', 'District Legal Services Authority'],
  },

  // ---------------------------------------------------------- money & banking
  {
    key: 'kb-fin-bank-account',
    category: 'finance',
    tags: ['bank account', 'jan dhan', 'zero balance', 'account', 'passbook', 'atm', 'बैंक खाता', 'जन धन', 'शून्य बैलेंस', 'पासबुक', 'ಬ್ಯಾಂಕ್ ಖಾತೆ', 'ಜನ್ ಧನ', 'ಪಾಸ್‌ಬುಕ್'],
    question: {
      en: 'How do I open a bank account with no minimum balance?',
      hi: 'बिना न्यूनतम बैलेंस वाला बैंक खाता कैसे खोलें?',
      kn: 'ಕನಿಷ್ಠ ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಹೇಗೆ ತೆರೆಯಬೇಕು?',
    },
    answer: {
      en: 'Ask for a Basic Savings Bank Deposit account, or a Jan Dhan account, at any bank branch or the Bank Mitra (business correspondent) point in your village. These need no minimum balance and no charges for basic services. You need Aadhaar, a photograph and, if you have one, a ration card or MGNREGA job card; a self-declaration of address is accepted. Always fill the form yourself or ask the Bank Mitra to explain each line, take the passbook, and register your own mobile number so you get an SMS for every transaction. Never leave a signed blank form and never let anyone keep your passbook or debit card.',
      hi: 'किसी भी बैंक शाखा या गांव के बैंक मित्र (बिज़नेस कॉरेस्पॉन्डेंट) केंद्र पर बेसिक सेविंग्स बैंक डिपॉजिट खाता या जन धन खाता मांगें। इनमें न्यूनतम बैलेंस की ज़रूरत नहीं होती और बुनियादी सेवाओं का शुल्क नहीं लगता। आपको आधार, फोटो और यदि हो तो राशन कार्ड या मनरेगा जॉब कार्ड चाहिए; पते का स्वघोषणा पत्र स्वीकार होता है। फॉर्म हमेशा खुद भरें या बैंक मित्र से हर पंक्ति समझाएं, पासबुक लें, और अपना मोबाइल नंबर दर्ज कराएं ताकि हर लेन-देन का एसएमएस आए। हस्ताक्षर किया खाली फॉर्म कभी न छोड़ें और किसी को अपनी पासबुक या डेबिट कार्ड न रखने दें।',
      kn: 'ಯಾವುದೇ ಬ್ಯಾಂಕ್ ಶಾಖೆ ಅಥವಾ ಹಳ್ಳಿಯ ಬ್ಯಾಂಕ್ ಮಿತ್ರ (ವ್ಯಾಪಾರ ಪ್ರತಿನಿಧಿ) ಕೇಂದ್ರದಲ್ಲಿ ಬೇಸಿಕ್ ಸೇವಿಂಗ್ಸ್ ಬ್ಯಾಂಕ್ ಡಿಪಾಸಿಟ್ ಖಾತೆ ಅಥವಾ ಜನ್ ಧನ ಖಾತೆ ಕೇಳಿ. ಇವುಗಳಿಗೆ ಕನಿಷ್ಠ ಬ್ಯಾಲೆನ್ಸ್ ಬೇಕಿಲ್ಲ ಮತ್ತು ಮೂಲ ಸೇವೆಗಳಿಗೆ ಶುಲ್ಕ ಇಲ್ಲ. ನಿಮಗೆ ಆಧಾರ್, ಫೋಟೋ ಮತ್ತು ಇದ್ದರೆ ರೇಷನ್ ಕಾರ್ಡ್ ಅಥವಾ ಮನರೇಗಾ ಜಾಬ್ ಕಾರ್ಡ್ ಬೇಕು; ವಿಳಾಸದ ಸ್ವಯಂ ಘೋಷಣೆ ಸ್ವೀಕಾರವಾಗುತ್ತದೆ. ಅರ್ಜಿಯನ್ನು ಯಾವಾಗಲೂ ನೀವೇ ತುಂಬಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮಿತ್ರರಿಂದ ಪ್ರತಿ ಸಾಲನ್ನು ವಿವರಿಸಲು ಹೇಳಿ, ಪಾಸ್‌ಬುಕ್ ಪಡೆಯಿರಿ, ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನೋಂದಾಯಿಸಿ, ಆಗ ಪ್ರತಿ ವಹಿವಾಟಿಗೆ ಎಸ್‌ಎಂಎಸ್ ಬರುತ್ತದೆ. ಸಹಿ ಮಾಡಿದ ಖಾಲಿ ಅರ್ಜಿ ಎಂದಿಗೂ ಬಿಡಬೇಡಿ ಮತ್ತು ನಿಮ್ಮ ಪಾಸ್‌ಬುಕ್ ಅಥವಾ ಡೆಬಿಟ್ ಕಾರ್ಡ್ ಯಾರಿಗೂ ಇಟ್ಟುಕೊಳ್ಳಲು ಬಿಡಬೇಡಿ.',
    },
    sources: ['Pradhan Mantri Jan Dhan Yojana', 'RBI Basic Savings Bank Deposit Account guidelines'],
  },
  {
    key: 'kb-fin-dbt',
    category: 'finance',
    tags: ['dbt', 'direct benefit transfer', 'aadhaar seeding', 'money not received', 'subsidy', 'डीबीटी', 'आधार सीडिंग', 'पैसा नहीं आया', 'ಸಬ್ಸಿಡಿ', 'ಡಿಬಿಟಿ', 'ಆಧಾರ್ ಜೋಡಣೆ', 'ಹಣ ಬಂದಿಲ್ಲ'],
    question: {
      en: 'Scheme money has not reached my account. How do I check?',
      hi: 'योजना का पैसा मेरे खाते में नहीं आया। कैसे जांचें?',
      kn: 'ಯೋಜನೆಯ ಹಣ ನನ್ನ ಖಾತೆಗೆ ಬಂದಿಲ್ಲ. ಹೇಗೆ ಪರಿಶೀಲಿಸಬೇಕು?',
    },
    answer: {
      en: 'Most scheme money comes by Direct Benefit Transfer, so the first thing to check is that your bank account is linked (seeded) with Aadhaar and that the name and date of birth match exactly. Ask the bank branch to print the Aadhaar seeding status, or check the scheme portal — PM-KISAN, scholarship, pension and DBT portals all show a payment status by Aadhaar or registration number. Common reasons for failure are a dormant or frozen account, a joint account, a wrong IFSC in the application, or the name on the bank account not matching Aadhaar. Correct it with the bank and the Panchayat, then follow up with the department office; keep the transaction and application numbers.',
      hi: 'अधिकांश योजनाओं का पैसा डीबीटी से आता है, इसलिए पहले जांचें कि आपका बैंक खाता आधार से जुड़ा (सीडेड) है और नाम तथा जन्म तिथि बिल्कुल मिलती है। बैंक शाखा से आधार सीडिंग की स्थिति छापकर मांगें, या योजना के पोर्टल पर देखें — पीएम-किसान, छात्रवृत्ति, पेंशन और डीबीटी पोर्टल आधार या पंजीकरण संख्या से भुगतान की स्थिति दिखाते हैं। विफलता के आम कारण हैं निष्क्रिय या फ्रीज़ खाता, संयुक्त खाता, आवेदन में गलत आईएफएससी कोड, या बैंक खाते का नाम आधार से न मिलना। बैंक और पंचायत में सुधार कराएं, फिर विभागीय कार्यालय में पीछे लगें; ट्रांजैक्शन और आवेदन संख्या रखें।',
      kn: 'ಬಹುತೇಕ ಯೋಜನೆಗಳ ಹಣ ನೇರ ಲಾಭ ವರ್ಗಾವಣೆ (ಡಿಬಿಟಿ) ಮೂಲಕ ಬರುತ್ತದೆ, ಆದ್ದರಿಂದ ಮೊದಲು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿದೆಯೇ ಮತ್ತು ಹೆಸರು ಹಾಗೂ ಹುಟ್ಟಿದ ದಿನಾಂಕ ನಿಖರವಾಗಿ ಹೊಂದುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ. ಬ್ಯಾಂಕ್ ಶಾಖೆಯಲ್ಲಿ ಆಧಾರ್ ಜೋಡಣೆ ಸ್ಥಿತಿ ಮುದ್ರಿಸಲು ಕೇಳಿ, ಅಥವಾ ಯೋಜನೆಯ ಪೋರ್ಟಲ್ ನೋಡಿ — ಪಿಎಂ-ಕಿಸಾನ್, ವಿದ್ಯಾರ್ಥಿವೇತನ, ಪಿಂಚಣಿ ಮತ್ತು ಡಿಬಿಟಿ ಪೋರ್ಟಲ್‌ಗಳು ಆಧಾರ್ ಅಥವಾ ನೋಂದಣಿ ಸಂಖ್ಯೆಯಿಂದ ಪಾವತಿ ಸ್ಥಿತಿ ತೋರಿಸುತ್ತವೆ. ವಿಫಲತೆಯ ಸಾಮಾನ್ಯ ಕಾರಣಗಳು ನಿಷ್ಕ್ರಿಯ ಅಥವಾ ಫ್ರೀಜ್ ಖಾತೆ, ಜಂಟಿ ಖಾತೆ, ಅರ್ಜಿಯಲ್ಲಿ ತಪ್ಪು ಐಎಫ್‌ಎಸ್‌ಸಿ ಕೋಡ್, ಅಥವಾ ಬ್ಯಾಂಕ್ ಖಾತೆಯ ಹೆಸರು ಆಧಾರ್‌ಗೆ ಹೊಂದದಿರುವುದು. ಬ್ಯಾಂಕ್ ಮತ್ತು ಪಂಚಾಯತ್‌ನಲ್ಲಿ ಸರಿಪಡಿಸಿ, ನಂತರ ಇಲಾಖೆ ಕಚೇರಿಯಲ್ಲಿ ಮುಂದುವರಿಸಿ; ವಹಿವಾಟು ಮತ್ತು ಅರ್ಜಿ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ.',
    },
    sources: ['DBT Bharat portal', 'PM-KISAN beneficiary status', 'Bank Aadhaar seeding'],
  },
  {
    key: 'kb-fin-shg-loan',
    category: 'finance',
    tags: ['shg', 'self help group', 'loan', 'business', 'mudra', 'women group', 'स्वयं सहायता समूह', 'कर्ज', 'व्यापार', 'मुद्रा', 'ಸ್ವಸಹಾಯ ಸಂಘ', 'ಸಾಲ', 'ಉದ್ಯಮ', 'ಮುದ್ರಾ'],
    question: {
      en: 'How can a women\'s group or a small shop get a loan?',
      hi: 'महिला समूह या छोटी दुकान को कर्ज कैसे मिल सकता है?',
      kn: 'ಮಹಿಳಾ ಸಂಘ ಅಥವಾ ಸಣ್ಣ ಅಂಗಡಿಗೆ ಸಾಲ ಹೇಗೆ ಸಿಗಬಹುದು?',
    },
    answer: {
      en: 'A self-help group of about ten to twenty women can open a group savings account at the bank, save regularly for a few months, and then get a group loan — this is the cheapest route and needs no collateral. For a small shop, dairy, tailoring or handicraft business, ask the bank about a Mudra loan, which gives up to about ten lakh rupees without security for small units. Take a written list of the documents and the interest rate from the branch, keep a simple record of your sales and repayments, and never borrow from a moneylender who takes a blank cheque or your land papers. Free help is available at the RSETI, the District Industries Centre and the Panchayat\'s National Rural Livelihoods Mission office.',
      hi: 'लगभग दस से बीस महिलाओं का स्वयं सहायता समूह बैंक में समूह बचत खाता खोल सकता है, कुछ महीने नियमित बचत कर सकता है और फिर समूह ऋण ले सकता है — यह सबसे सस्ता रास्ता है और इसमें गारंटी नहीं चाहिए। छोटी दुकान, डेयरी, सिलाई या हस्तशिल्प के काम के लिए बैंक से मुद्रा ऋण के बारे में पूछें, जो छोटी इकाइयों को लगभग दस लाख रुपये तक बिना ज़मानत देता है। शाखा से कागज़ों की सूची और ब्याज दर लिखवाकर लें, अपनी बिक्री और किस्तों का सादा हिसाब रखें, और ऐसे साहूकार से कर्ज न लें जो खाली चेक या ज़मीन के कागज़ मांगे। मुफ्त मदद आरसेटी, ज़िला उद्योग केंद्र और पंचायत के राष्ट्रीय ग्रामीण आजीविका मिशन कार्यालय में मिलती है।',
      kn: 'ಸುಮಾರು ಹತ್ತರಿಂದ ಇಪ್ಪತ್ತು ಮಹಿಳೆಯರ ಸ್ವಸಹಾಯ ಸಂಘ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಗುಂಪು ಉಳಿತಾಯ ಖಾತೆ ತೆರೆದು, ಕೆಲವು ತಿಂಗಳು ನಿಯಮಿತವಾಗಿ ಉಳಿತಾಯ ಮಾಡಿ, ನಂತರ ಗುಂಪು ಸಾಲ ಪಡೆಯಬಹುದು — ಇದು ಅಗ್ಗದ ದಾರಿ ಮತ್ತು ಜಾಮೀನು ಬೇಕಿಲ್ಲ. ಸಣ್ಣ ಅಂಗಡಿ, ಹಾಲಿನ ಡೇರಿ, ಹೊಲಿಗೆ ಅಥವಾ ಕರಕುಶಲ ಉದ್ಯಮಕ್ಕೆ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಮುದ್ರಾ ಸಾಲದ ಬಗ್ಗೆ ಕೇಳಿ, ಅದು ಸಣ್ಣ ಘಟಕಗಳಿಗೆ ಸುಮಾರು ಹತ್ತು ಲಕ್ಷ ರೂಪಾಯಿವರೆಗೆ ಭದ್ರತೆ ಇಲ್ಲದೆ ಸಿಗುತ್ತದೆ. ಶಾಖೆಯಲ್ಲಿ ದಾಖಲೆಗಳ ಪಟ್ಟಿ ಮತ್ತು ಬಡ್ಡಿ ದರ ಬರೆಸಿಕೊಳ್ಳಿ, ನಿಮ್ಮ ಮಾರಾಟ ಮತ್ತು ಕಂತುಗಳ ಸರಳ ಲೆಕ್ಕ ಇಟ್ಟುಕೊಳ್ಳಿ, ಮತ್ತು ಖಾಲಿ ಚೆಕ್ ಅಥವಾ ಭೂ ದಾಖಲೆ ಕೇಳುವ ಬಡ್ಡಿವ್ಯಾಪಾರಿಯಿಂದ ಸಾಲ ಪಡೆಯಬೇಡಿ. ಉಚಿತ ಸಹಾಯ ಆರ್ಸೆಟಿ, ಜಿಲ್ಲಾ ಕೈಗಾರಿಕಾ ಕೇಂದ್ರ ಮತ್ತು ಪಂಚಾಯತ್‌ನ ರಾಷ್ಟ್ರೀಯ ಗ್ರಾಮೀಣ ಜೀವನೋಪಾಯ ಮಿಷನ್ ಕಚೇರಿಯಲ್ಲಿ ಸಿಗುತ್ತದೆ.',
    },
    sources: ['Deendayal Antyodaya Yojana — National Rural Livelihoods Mission', 'Pradhan Mantri MUDRA Yojana'],
  },
  {
    key: 'kb-fin-insurance',
    category: 'finance',
    tags: ['insurance', 'pmjjby', 'pmsym', 'accident', 'life cover', 'pension', 'बीमा', 'दुर्घटना', 'जीवन बीमा', 'पेंशन', 'ವಿಮೆ', 'ಅಪಘಾತ', 'ಜೀವ ವಿಮೆ', 'ಪಿಂಚಣಿ'],
    question: {
      en: 'Is there a cheap life and accident insurance for poor families?',
      hi: 'गरीब परिवारों के लिए सस्ता जीवन और दुर्घटना बीमा है क्या?',
      kn: 'ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಅಗ್ಗದ ಜೀವ ಮತ್ತು ಅಪಘಾತ ವಿಮೆ ಇದೆಯೇ?',
    },
    answer: {
      en: 'Yes. Under PMJJBY a bank account holder aged eighteen to fifty can get life cover of about two lakh rupees for a small yearly premium, and under PMSBY accident cover of about two lakh rupees for an even smaller premium; both are auto-debited from the account once you enrol. Ask the bank branch for the enrolment form and the current premium, and check that the debit appears in your passbook each year — if the account has no money on the debit date, the cover lapses. Keep the enrolment acknowledgement, and tell your family that the claim must be made through the bank with the death or accident certificate.',
      hi: 'हां। पीएमजेजेबीवाई में अठारह से पचास साल का बैंक खाताधारक छोटे सालाना प्रीमियम पर लगभग दो लाख रुपये का जीवन बीमा पा सकता है, और पीएमएसबीवाई में इससे भी कम प्रीमियम पर लगभग दो लाख रुपये का दुर्घटना बीमा; नामांकन के बाद दोनों खाते से अपने आप कटते हैं। बैंक शाखा से नामांकन फॉर्म और वर्तमान प्रीमियम पूछें, और हर साल जांचें कि पासबुक में कटौती दिख रही है — कटौती की तारीख पर खाते में पैसा न हो तो बीमा बंद हो जाता है। नामांकन की पावती रखें, और परिवार को बताएं कि दावा मृत्यु या दुर्घटना प्रमाण पत्र के साथ बैंक के जरिए करना होता है।',
      kn: 'ಹೌದು. ಪಿಎಂಜೆಜೆಬಿವೈನಲ್ಲಿ ಹದಿನೆಂಟರಿಂದ ಐವತ್ತು ವರ್ಷದ ಬ್ಯಾಂಕ್ ಖಾತೆದಾರರು ಸಣ್ಣ ವಾರ್ಷಿಕ ಪ್ರೀಮಿಯಂಗೆ ಸುಮಾರು ಎರಡು ಲಕ್ಷ ರೂಪಾಯಿ ಜೀವ ವಿಮೆ ಪಡೆಯಬಹುದು, ಮತ್ತು ಪಿಎಂಎಸ್‌ಬಿವೈನಲ್ಲಿ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಪ್ರೀಮಿಯಂಗೆ ಸುಮಾರು ಎರಡು ಲಕ್ಷ ರೂಪಾಯಿ ಅಪಘಾತ ವಿಮೆ; ನೋಂದಣಿಯ ನಂತರ ಎರಡೂ ಖಾತೆಯಿಂದ ತಾನಾಗಿಯೇ ಕಡಿತವಾಗುತ್ತವೆ. ಬ್ಯಾಂಕ್ ಶಾಖೆಯಲ್ಲಿ ನೋಂದಣಿ ಅರ್ಜಿ ಮತ್ತು ಪ್ರಸ್ತುತ ಪ್ರೀಮಿಯಂ ಕೇಳಿ, ಮತ್ತು ಪ್ರತಿ ವರ್ಷ ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿ ಕಡಿತ ಕಾಣುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ — ಕಡಿತದ ದಿನಾಂಕಕ್ಕೆ ಖಾತೆಯಲ್ಲಿ ಹಣ ಇಲ್ಲದಿದ್ದರೆ ವಿಮೆ ರದ್ದಾಗುತ್ತದೆ. ನೋಂದಣಿ ಸ್ವೀಕೃತಿ ಇಟ್ಟುಕೊಳ್ಳಿ, ಮತ್ತು ಮರಣ ಅಥವಾ ಅಪಘಾತ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಕ್ಲೇಮ್ ಮಾಡಬೇಕು ಎಂದು ಕುಟುಂಬಕ್ಕೆ ತಿಳಿಸಿ.',
    },
    sources: ['Pradhan Mantri Jeevan Jyoti Bima Yojana', 'Pradhan Mantri Suraksha Bima Yojana'],
  },

  // ------------------------------------------------------------------ general
  {
    key: 'kb-general-gram-panchayat',
    category: 'general',
    tags: ['gram panchayat', 'panchayat', 'complaint', 'village', 'officer', 'ग्राम पंचायत', 'पंचायत', 'शिकायत', 'गांव', 'ಗ್ರಾಮ ಪಂಚಾಯತ್', 'ಪಂಚಾಯತ್', 'ದೂರು', 'ಹಳ್ಳಿ'],
    question: {
      en: 'Whom do I approach in the village for a certificate, scheme or complaint?',
      hi: 'प्रमाण पत्र, योजना या शिकायत के लिए गांव में किससे मिलें?',
      kn: 'ಪ್ರಮಾಣಪತ್ರ, ಯೋಜನೆ ಅಥವಾ ದೂರಿಗೆ ಹಳ್ಳಿಯಲ್ಲಿ ಯಾರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು?',
    },
    answer: {
      en: 'Start at the Gram Panchayat office: the Panchayat Development Officer or secretary handles certificates, scheme applications, job cards and complaints, and the elected ward member takes village issues to the Panchayat meeting. The village accountant handles land records, the ASHA and Anganwadi workers handle health and nutrition, and the agriculture assistant handles crop issues. For anything the Panchayat cannot solve, the Panchayat can pass a resolution and send it to the taluk or block office. Ask for a written acknowledgement or receipt for every application you submit — that is what you need if you have to follow up or complain to a higher officer.',
      hi: 'ग्राम पंचायत कार्यालय से शुरू करें: पंचायत विकास अधिकारी या सचिव प्रमाण पत्र, योजना आवेदन, जॉब कार्ड और शिकायतें संभालते हैं, और चुने हुए वार्ड सदस्य गांव के मुद्दे पंचायत बैठक में ले जाते हैं। ग्राम लेखपाल ज़मीन के कागज़, आशा और आंगनवाड़ी कार्यकर्ता स्वास्थ्य और पोषण, और कृषि सहायक फसल के मामले देखते हैं। जो बात पंचायत हल न कर सके, उसके लिए पंचायत प्रस्ताव पास करके तालुका या खंड कार्यालय भेज सकती है। जो भी आवेदन दें उसकी लिखित पावती या रसीद मांगें — आगे पीछे लगने या ऊपर के अधिकारी से शिकायत करने में यही काम आती है।',
      kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಯಿಂದ ಪ್ರಾರಂಭಿಸಿ: ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ಅಥವಾ ಕಾರ್ಯದರ್ಶಿ ಪ್ರಮಾಣಪತ್ರ, ಯೋಜನೆ ಅರ್ಜಿ, ಜಾಬ್ ಕಾರ್ಡ್ ಮತ್ತು ದೂರುಗಳನ್ನು ನೋಡುತ್ತಾರೆ, ಮತ್ತು ಆಯ್ಕೆಯಾದ ವಾರ್ಡ್ ಸದಸ್ಯರು ಹಳ್ಳಿಯ ಸಮಸ್ಯೆಗಳನ್ನು ಪಂಚಾಯತ್ ಸಭೆಗೆ ಒಯ್ಯುತ್ತಾರೆ. ಗ್ರಾಮ ಲೆಕ್ಕಿಗ ಭೂ ದಾಖಲೆ, ಆಶಾ ಮತ್ತು ಅಂಗನವಾಡಿ ಕಾರ್ಯಕರ್ತೆಯರು ಆರೋಗ್ಯ ಮತ್ತು ಪೋಷಣೆ, ಮತ್ತು ಕೃಷಿ ಸಹಾಯಕ ಬೆಳೆ ವಿಷಯ ನೋಡುತ್ತಾರೆ. ಪಂಚಾಯತ್ ಬಗೆಹರಿಸಲಾಗದ ವಿಷಯಕ್ಕೆ ಪಂಚಾಯತ್ ಠರಾವು ಮಂಡಿಸಿ ತಾಲೂಕು ಅಥವಾ ತಾಲೂಕು ಕಚೇರಿಗೆ ಕಳುಹಿಸಬಹುದು. ನೀವು ಸಲ್ಲಿಸುವ ಪ್ರತಿ ಅರ್ಜಿಗೂ ಬರಹ ರೂಪದ ಸ್ವೀಕೃತಿ ಅಥವಾ ರಸೀದಿ ಕೇಳಿ — ಮುಂದೆ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ಅಥವಾ ಉನ್ನತ ಅಧಿಕಾರಿಗೆ ದೂರು ನೀಡಲು ಅದೇ ಬೇಕು.',
    },
    sources: ['73rd Constitutional Amendment — Gram Panchayat functions', 'Ministry of Panchayati Raj'],
  },
  {
    key: 'kb-general-land-records',
    category: 'general',
    tags: ['land record', 'rtc', 'khata', 'pahani', 'mutation', 'survey', 'ज़मीन के कागज़', 'खाता', 'पहानी', 'भूमि', 'ಭೂ ದಾಖಲೆ', 'ಆರ್‌ಟಿಸಿ', 'ಪಹಣಿ', 'ಖಾತೆ'],
    question: {
      en: 'How do I get land records in my name and correct a mistake in them?',
      hi: 'ज़मीन के कागज़ अपने नाम कैसे कराएं और उनमें गलती कैसे सुधरवाएं?',
      kn: 'ಭೂ ದಾಖಲೆ ನನ್ನ ಹೆಸರಿಗೆ ಹೇಗೆ ಮಾಡಿಸಬೇಕು ಮತ್ತು ಅದರಲ್ಲಿನ ತಪ್ಪು ಹೇಗೆ ಸರಿಪಡಿಸಬೇಕು?',
    },
    answer: {
      en: 'The record of rights — called RTC or pahani in Karnataka, khatauni in the north — is available at the taluk office or on the state land records website, and the village accountant maintains the local copy. After a purchase, inheritance or partition you must apply for mutation at the taluk office with the sale deed or death certificate, the old record, Aadhaar and the application fee; mutation is what puts the land in your name. If a name, survey number or extent is wrong, apply for correction with the supporting document. Keep a certified copy of the record and check it every year, because a wrong entry can block a loan or a scheme benefit. Take a lawyer\'s or the village accountant\'s help for disputed land.',
      hi: 'अधिकार अभिलेख — कर्नाटक में आरटीसी या पहानी, उत्तर में खतौनी — तालुका कार्यालय या राज्य के भू-अभिलेख वेबसाइट पर मिलता है, और स्थानीय प्रति ग्राम लेखपाल रखते हैं। खरीद, उत्तराधिकार या बंटवारे के बाद तालुका कार्यालय में विक्रय पत्र या मृत्यु प्रमाण पत्र, पुराना अभिलेख, आधार और आवेदन शुल्क के साथ नामांतरण के लिए आवेदन करें; नामांतरण से ही ज़मीन आपके नाम आती है। नाम, सर्वे नंबर या रकबा गलत हो तो सहायक दस्तावेज़ के साथ सुधार के लिए आवेदन करें। अभिलेख की प्रमाणित प्रति रखें और हर साल जांचें, क्योंकि गलत प्रविष्टि कर्ज या योजना का लाभ रोक सकती है। विवादित ज़मीन के लिए वकील या ग्राम लेखपाल की मदद लें।',
      kn: 'ಹಕ್ಕು ದಾಖಲೆ — ಕರ್ನಾಟಕದಲ್ಲಿ ಆರ್‌ಟಿಸಿ ಅಥವಾ ಪಹಣಿ — ತಾಲೂಕು ಕಚೇರಿಯಲ್ಲಿ ಅಥವಾ ರಾಜ್ಯದ ಭೂ ದಾಖಲೆ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಸಿಗುತ್ತದೆ, ಮತ್ತು ಸ್ಥಳೀಯ ಪ್ರತಿಯನ್ನು ಗ್ರಾಮ ಲೆಕ್ಕಿಗ ಇಡುತ್ತಾರೆ. ಖರೀದಿ, ಉತ್ತರಾಧಿಕಾರ ಅಥವಾ ಹಂಚಿಕೆಯ ನಂತರ ತಾಲೂಕು ಕಚೇರಿಯಲ್ಲಿ ಕ್ರಯಪತ್ರ ಅಥವಾ ಮರಣ ಪ್ರಮಾಣಪತ್ರ, ಹಳೆಯ ದಾಖಲೆ, ಆಧಾರ್ ಮತ್ತು ಅರ್ಜಿ ಶುಲ್ಕದೊಂದಿಗೆ ನಾಮಾಂತರಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ನಾಮಾಂತರದಿಂದಲೇ ಭೂಮಿ ನಿಮ್ಮ ಹೆಸರಿಗೆ ಬರುತ್ತದೆ. ಹೆಸರು, ಸರ್ವೆ ನಂಬರ್ ಅಥವಾ ವಿಸ್ತೀರ್ಣ ತಪ್ಪಾಗಿದ್ದರೆ ಪೂರಕ ದಾಖಲೆಯೊಂದಿಗೆ ತಿದ್ದುಪಡಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ದಾಖಲೆಯ ಪ್ರಮಾಣೀಕೃತ ಪ್ರತಿ ಇಟ್ಟುಕೊಂಡು ಪ್ರತಿ ವರ್ಷ ಪರಿಶೀಲಿಸಿ, ಏಕೆಂದರೆ ತಪ್ಪು ನಮೂದು ಸಾಲ ಅಥವಾ ಯೋಜನೆಯ ಲಾಭವನ್ನು ತಡೆಯಬಹುದು. ವಿವಾದಿತ ಭೂಮಿಗೆ ವಕೀಲರ ಅಥವಾ ಗ್ರಾಮ ಲೆಕ್ಕಿಗರ ಸಹಾಯ ಪಡೆಯಿರಿ.',
    },
    sources: ['State land records portal (Bhoomi / Dharani / Bhulekh)', 'Revenue department (taluk office)'],
  },
];
