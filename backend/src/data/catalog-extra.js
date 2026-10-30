/**
 * Catalogue additions — four schemes and two scholarships that the first seed
 * file did not cover, each written in English, Hindi and Kannada in the same
 * { en, hi, kn } shape the rest of the API uses.
 *
 * They are merged into the seed by data/seed-data.js, which also attaches the
 * freshness metadata (asOf, volatileFacts, verifyUrl) from data/facts.js.
 */
module.exports = {
  schemes: [
    {
      key: "eshram",
      category: "schemes",
      tags: ["e shram", "unorganised worker", "labour", "worker card", "uan", "migrant worker", "ई श्रम", "मजदूर", "श्रमिक", "ಇ ಶ್ರಮ", "ಕಾರ್ಮಿಕ", "ಕೂಲಿ"],
      source: "eShram — Ministry of Labour and Employment",
      name: {
        en: "e-Shram Card for Unorganised Workers",
        hi: "असंगठित श्रमिकों के लिए ई-श्रम कार्ड",
        kn: "ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರಿಗಾಗಿ ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್",
      },
      description: {
        en: "Free national registration for unorganised and migrant workers, giving a Universal Account Number card, accident insurance cover and portability of benefits across states.",
        hi: "असंगठित और प्रवासी श्रमिकों के लिए मुफ्त राष्ट्रीय पंजीकरण, जिससे एक यूनिवर्सल अकाउंट नंबर कार्ड, दुर्घटना बीमा कवर और राज्यों के बीच लाभों की पोर्टेबिलिटी मिलती है।",
        kn: "ಅಸಂಘಟಿತ ಮತ್ತು ವಲಸೆ ಕಾರ್ಮಿಕರಿಗೆ ಉಚಿತ ರಾಷ್ಟ್ರೀಯ ನೋಂದಣಿ, ಯುನಿವರ್ಸಲ್ ಅಕೌಂಟ್ ನಂಬರ್ ಕಾರ್ಡ್, ಅಪಘಾತ ವಿಮೆ ಮತ್ತು ರಾಜ್ಯಗಳಾದ್ಯಂತ ಸೌಲಭ್ಯಗಳನ್ನು ಪಡೆಯುವ ಅವಕಾಶ.",
      },
      eligibility: {
        en: "Unorganised workers aged 16 to 59 who are not members of the Employees Provident Fund or ESIC, such as farm labourers, construction workers, domestic workers, drivers and street vendors.",
        hi: "16 से 59 वर्ष की आयु के असंगठित श्रमिक जो कर्मचारी भविष्य निधि या ESIC के सदस्य नहीं हैं, जैसे कि खेत मजदूर, निर्माण श्रमिक, घरेलू कामगार, ड्राइवर और रेहड़ी-पटरी वाले।",
        kn: "ಕೃಷಿ ಕಾರ್ಮಿಕರು, ಕಟ್ಟಡ ಕಾರ್ಮಿಕರು, ಮನೆಗೆಲಸದವರು, ಚಾಲಕರು ಮತ್ತು ಬೀದಿ ವ್ಯಾಪಾರಿಗಳಂತಹ ಉದ್ಯೋಗಿಗಳ ಭವಿಷ್ಯ ನಿಧಿ ಅಥವಾ ESIC ಸದಸ್ಯರಲ್ಲದ 16 ರಿಂದ 59 ವರ್ಷ ವಯಸ್ಸಿನ ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರು.",
      },
      apply: {
        en: "Register free of cost at any Common Service Centre or on the eShram portal with Aadhaar, bank account and mobile number, then download and keep the card.",
        hi: "किसी भी कॉमन सर्विस सेंटर या eShram पोर्टल पर आधार, बैंक खाते और मोबाइल नंबर के साथ मुफ्त में पंजीकरण करें, फिर कार्ड डाउनलोड करके अपने पास सुरक्षित रखें।",
        kn: "ಯಾವುದೇ ಕಾಮನ್ ಸರ್ವೀಸ್ ಸೆಂಟರ್‌ನಲ್ಲಿ ಅಥವಾ ಇ-ಶ್ರಮ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆಧಾರ್, ಬ್ಯಾಂಕ್ ಖಾತೆ ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಉಚಿತವಾಗಿ ನೋಂದಾಯಿಸಿ, ನಂತರ ಕಾರ್ಡ್ ಅನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಇಟ್ಟುಕೊಳ್ಳಿ.",
      },
    },
    {
      key: "pm-vishwakarma",
      category: "schemes",
      tags: ["vishwakarma", "artisan", "craft", "toolkit", "loan", "विश्वकर्मा", "कारीगर", "शिल्प", "ಲೋಹಗಾರ", "ಕರಕುಶಲ", "ಸಾಲ"],
      source: "PM Vishwakarma — official portal",
      name: {
        en: "PM Vishwakarma Yojana",
        hi: "पीएम विश्वकर्मा योजना",
        kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಯೋಜನೆ",
      },
      description: {
        en: "Support for traditional artisans and craftspeople in eighteen trades: skill training with a stipend, a toolkit incentive, collateral free loans at concessional interest and an incentive for digital transactions.",
        hi: "18 पारंपरिक शिल्पों में कारीगरों और शिल्पकारों के लिए सहायता: मानदेय के साथ कौशल प्रशिक्षण, टूलकिट प्रोत्साहन, रियायती ब्याज पर बिना गारंटी का लोन और डिजिटल लेनदेन के लिए प्रोत्साहन।",
        kn: "ಹದಿನೆಂಟು ವೃತ್ತಿಗಳಲ್ಲಿ ಸಾಂಪ್ರದಾಯಿಕ ಕುಶಲಕರ್ಮಿಗಳು ಮತ್ತು ಕರಕುಶಲಕರ್ಮಿಗಳಿಗೆ ಬೆಂಬಲ: ಸ್ಟೈಫಂಡ್‌ನೊಂದಿಗೆ ಕೌಶಲ್ಯ ತರಬೇತಿ, ಟೂಲ್‌ಕಿಟ್ ಪ್ರೋತ್ಸಾಹಕ, ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಯಾವುದೇ ಮೇಲಾಧಾರವಿಲ್ಲದ ಸಾಲಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ವಹಿವಾಟುಗಳಿಗೆ ಪ್ರೋತ್ಸಾಹಕ.",
      },
      eligibility: {
        en: "Artisans and craftspeople who work with their hands and tools in one of the eighteen listed trades, and who have not taken a similar loan in the last five years.",
        hi: "कारीगर और शिल्पकार जो 18 सूचीबद्ध शिल्पों में से किसी एक में अपने हाथों और औजारों से काम करते हैं, और जिन्होंने पिछले पांच वर्षों में ऐसा कोई लोन नहीं लिया है।",
        kn: "ಹದಿನೆಂಟು ಪಟ್ಟಿ ಮಾಡಲಾದ ವೃತ್ತಿಗಳಲ್ಲಿ ತಮ್ಮ ಕೈಗಳು ಮತ್ತು ಉಪಕರಣಗಳೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವ ಕುಶಲಕರ್ಮಿಗಳು ಮತ್ತು ಕರಕುಶಲಕರ್ಮಿಗಳು, ಮತ್ತು ಕಳೆದ ಐದು ವರ್ಷಗಳಲ್ಲಿ ಇದೇ ರೀತಿಯ ಸಾಲವನ್ನು ಪಡೆಯದವರು.",
      },
      apply: {
        en: "Register at the nearest Common Service Centre with Aadhaar and bank details, get verified by the Gram Panchayat or district office, then complete the training to receive the toolkit incentive and loan.",
        hi: "आधार और बैंक विवरण के साथ नजदीकी कॉमन सर्विस सेंटर पर पंजीकरण करें, ग्राम पंचायत या जिला कार्यालय से सत्यापन कराएं, फिर टूलकिट प्रोत्साहन और लोन प्राप्त करने के लिए प्रशिक्षण पूरा करें।",
        kn: "ಆಧಾರ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರಗಳೊಂದಿಗೆ ಹತ್ತಿರದ ಕಾಮನ್ ಸರ್ವೀಸ್ ಸೆಂಟರ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ, ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ಜಿಲ್ಲಾ ಕಚೇರಿಯಿಂದ ಪರಿಶೀಲನೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ, ನಂತರ ಟೂಲ್‌ಕಿಟ್ ಪ್ರೋತ್ಸಾಹಕ ಮತ್ತು ಸಾಲವನ್ನು ಪಡೆಯಲು ತರಬೇತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",
      },
    },
    {
      key: "jal-jeevan",
      category: "schemes",
      tags: ["water", "tap connection", "drinking water", "pipeline", "जल जीवन", "नल", "पानी", "ಜಲ ಜೀವನ", "ನಲ್ಲಿ", "ನೀರು"],
      source: "Jal Jeevan Mission — Department of Drinking Water and Sanitation",
      name: {
        en: "Jal Jeevan Mission — Household Tap Connection",
        hi: "जल जीवन मिशन — घरेलू नल कनेक्शन",
        kn: "ಜಲ ಜೀವನ್ ಮಿಷನ್ — ಮನೆಯ ನಲ್ಲಿ ಸಂಪರ್ಕ",
      },
      description: {
        en: "Aims to give every rural household a functional tap connection with a regular supply of safe, chlorinated drinking water, managed by the village water and sanitation committee.",
        hi: "इसका उद्देश्य हर ग्रामीण घर को सुरक्षित, क्लोरीन युक्त पीने के पानी की नियमित आपूर्ति के साथ एक चालू नल कनेक्शन देना है, जिसका प्रबंधन गांव की जल और स्वच्छता समिति द्वारा किया जाता है।",
        kn: "ಗ್ರಾಮದ ನೀರು ಮತ್ತು ನೈರ್ಮಲ್ಯ ಸಮಿತಿಯಿಂದ ನಿರ್ವಹಿಸಲ್ಪಡುವ ಸುರಕ್ಷಿತ, ಕ್ಲೋರಿನ್ ಬೆರೆಸಿದ ಕುಡಿಯುವ ನೀರಿನ ನಿಯಮಿತ ಪೂರೈಕೆಯೊಂದಿಗೆ ಪ್ರತಿ ಗ್ರಾಮೀಣ ಮನೆಗೂ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ನಲ್ಲಿ ಸಂಪರ್ಕವನ್ನು ನೀಡುವ ಗುರಿ.",
      },
      eligibility: {
        en: "Every rural household in a village covered by a Jal Jeevan Mission water supply scheme.",
        hi: "जल जीवन मिशन जल आपूर्ति योजना के अंतर्गत आने वाले गांव का हर ग्रामीण घर।",
        kn: "ಜಲ ಜೀವನ್ ಮಿಷನ್ ನೀರು ಸರಬರಾಜು ಯೋಜನೆಯಿಂದ ಒಳಗೊಂಡಿರುವ ಗ್ರಾಮದ ಪ್ರತಿ ಗ್ರಾಮೀಣ ಮನೆ.",
      },
      apply: {
        en: "Apply at the Gram Panchayat or to the village water and sanitation committee during the village survey, and attend the Gram Sabha where the water tariff is decided.",
        hi: "गांव के सर्वेक्षण के दौरान ग्राम पंचायत या गांव की जल और स्वच्छता समिति में आवेदन करें, और ग्राम सभा में भाग लें जहां पानी का टैरिफ तय किया जाता है।",
        kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ಅಥವಾ ಗ್ರಾಮದ ಸಮೀಕ್ಷೆಯ ಸಮಯದಲ್ಲಿ ಗ್ರಾಮದ ನೀರು ಮತ್ತು ನೈರ್ಮಲ್ಯ ಸಮಿತಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಮತ್ತು ನೀರಿನ ದರವನ್ನು ನಿರ್ಧರಿಸುವ ಗ್ರಾಮ ಸಭೆಯಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಿ.",
      },
    },
    {
      key: "pm-surya-ghar",
      category: "schemes",
      tags: ["solar", "rooftop", "electricity", "subsidy", "net metering", "सोलर", "बिजली", "सब्सिडी", "ಸೌರ", "ವಿದ್ಯುತ್", "ಸಬ್ಸಿಡಿ"],
      source: "PM Surya Ghar — Ministry of New and Renewable Energy",
      name: {
        en: "PM Surya Ghar Muft Bijli Yojana",
        hi: "पीएम सूर्य घर मुफ्त बिजली योजना",
        kn: "ಪಿಎಂ ಸೂರ್ಯ ಘರ್ ಉಚಿತ ವಿದ್ಯುತ್ ಯೋಜನೆ",
      },
      description: {
        en: "Subsidy for rooftop solar panels on a house, with net metering so that the electricity generated is adjusted against the household bill.",
        hi: "घर की छत पर सोलर पैनल के लिए सब्सिडी, नेट मीटरिंग के साथ ताकि उत्पन्न बिजली को घरेलू बिल में एडजस्ट किया जा सके।",
        kn: "ಮನೆಯ ಮೇಲ್ಛಾವಣಿಯ ಮೇಲಿನ ಸೌರ ಫಲಕಗಳಿಗೆ ಸಬ್ಸಿಡಿ, ನೆಟ್ ಮೀಟರಿಂಗ್‌ನೊಂದಿಗೆ ಉತ್ಪತ್ತಿಯಾಗುವ ವಿದ್ಯುತ್ ಅನ್ನು ಮನೆಯ ಬಿಲ್‌ನೊಂದಿಗೆ ಸರಿಹೊಂದಿಸಲಾಗುತ್ತದೆ.",
      },
      eligibility: {
        en: "Households with their own roof and a valid electricity connection, applying through an empanelled vendor on the national portal.",
        hi: "जिन घरों की अपनी छत है और उनके पास वैध बिजली कनेक्शन है, जो राष्ट्रीय पोर्टल पर एक पैनल वाले विक्रेता के माध्यम से आवेदन करते हैं।",
        kn: "ತಮ್ಮದೇ ಆದ ಮೇಲ್ಛಾವಣಿ ಮತ್ತು ಮಾನ್ಯವಾದ ವಿದ್ಯುತ್ ಸಂಪರ್ಕವನ್ನು ಹೊಂದಿರುವ ಮನೆಗಳು, ರಾಷ್ಟ್ರೀಯ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಎಂಪ್ಯಾನೆಲ್ಡ್ ಮಾರಾಟಗಾರರ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು.",
      },
      apply: {
        en: "Register on the PM Surya Ghar portal or through the state electricity distribution company, get the feasibility approval, then install through an empanelled vendor and apply for net metering.",
        hi: "पीएम सूर्य घर पोर्टल पर या राज्य बिजली वितरण कंपनी के माध्यम से पंजीकरण करें, व्यवहार्यता मंजूरी (फीजिबिलिटी अप्रूवल) प्राप्त करें, फिर एक पैनल वाले विक्रेता के माध्यम से इंस्टॉलेशन कराएं और नेट मीटरिंग के लिए आवेदन करें।",
        kn: "ಪಿಎಂ ಸೂರ್ಯ ಘರ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅಥವಾ ರಾಜ್ಯ ವಿದ್ಯುತ್ ವಿತರಣಾ ಕಂಪನಿಯ ಮೂಲಕ ನೋಂದಾಯಿಸಿ, ಕಾರ್ಯಸಾಧ್ಯತೆಯ ಅನುಮೋದನೆಯನ್ನು ಪಡೆಯಿರಿ, ನಂತರ ಎಂಪ್ಯಾನೆಲ್ಡ್ ಮಾರಾಟಗಾರರ ಮೂಲಕ ಸ್ಥಾಪಿಸಿ ಮತ್ತು ನೆಟ್ ಮೀಟರಿಂಗ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
      },
    },
  ],
  scholarships: [
    {
      key: "nmmss",
      provider: "Department of School Education and Literacy",
      open: true,
      deadline: "2026-11-15",
      amount: "Rs 12,000 per year",
      tags: ["nmmss", "class 8", "merit", "means cum merit", "school", "मेधावी", "आठवीं", "छात्रवृत्ति", "ಪ್ರತಿಭಾನ್ವಿತ", "ಎಂಟನೇ ತರಗತಿ", "ವಿದ್ಯಾರ್ಥಿವೇತನ"],
      source: "National Scholarship Portal",
      name: {
        en: "National Means-cum-Merit Scholarship (NMMSS)",
        hi: "नेशनल मीन्स-कम-मेरिट स्कॉलरशिप (NMMSS)",
        kn: "ನ್ಯಾಷನಲ್ ಮೀನ್ಸ್-ಕಮ್-ಮೆರಿಟ್ ಸ್ಕಾಲರ್‌ಶಿಪ್ (NMMSS)",
      },
      description: {
        en: "Scholarship for meritorious students of class 9 to 12 from low income families, paid every year to reduce dropout at the secondary stage.",
        hi: "कम आय वाले परिवारों के कक्षा 9 से 12 के मेधावी छात्रों के लिए स्कॉलरशिप, जो माध्यमिक स्तर पर पढ़ाई छोड़ने वालों की संख्या को कम करने के लिए हर साल दी जाती है।",
        kn: "ಕಡಿಮೆ ಆದಾಯದ ಕುಟುಂಬಗಳ 9 ರಿಂದ 12 ನೇ ತರಗತಿಯ ಪ್ರತಿಭಾವಂತ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಪ್ರೌಢ ಹಂತದಲ್ಲಿ ಶಾಲೆಯಿಂದ ಹೊರಗುಳಿಯುವುದನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಪ್ರತಿ ವರ್ಷ ಪಾವತಿಸಲಾಗುತ್ತದೆ.",
      },
      eligibility: {
        en: "Students who passed class 8 with at least 55 per cent marks, whose family income is within the notified limit, and who clear the state level selection test.",
        hi: "वे छात्र जिन्होंने कक्षा 8 में कम से कम 55 प्रतिशत अंकों के साथ पास किया है, जिनके परिवार की आय अधिसूचित सीमा के भीतर है, और जो राज्य स्तरीय चयन परीक्षा पास करते हैं।",
        kn: "ಕನಿಷ್ಠ 55 ಪ್ರತಿಶತ ಅಂಕಗಳೊಂದಿಗೆ 8 ನೇ ತರಗತಿಯನ್ನು ಉತ್ತೀರ್ಣರಾದ, ಅಧಿಸೂಚಿತ ಮಿತಿಯೊಳಗೆ ಕುಟುಂಬ ಆದಾಯವನ್ನು ಹೊಂದಿರುವ ಮತ್ತು ರಾಜ್ಯ ಮಟ್ಟದ ಆಯ್ಕೆ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಉತ್ತೀರ್ಣರಾದ ವಿದ್ಯಾರ್ಥಿಗಳು.",
      },
      apply: {
        en: "Appear for the state NMMSS selection test after class 8, then register on the National Scholarship Portal with Aadhaar, bank account and income certificate and get the application verified by the school.",
        hi: "कक्षा 8 के बाद राज्य NMMSS चयन परीक्षा में बैठें, फिर आधार, बैंक खाते और आय प्रमाण पत्र के साथ नेशनल स्कॉलरशिप पोर्टल पर पंजीकरण करें और स्कूल से आवेदन का सत्यापन कराएं।",
        kn: "8 ನೇ ತರಗತಿಯ ನಂತರ ರಾಜ್ಯ NMMSS ಆಯ್ಕೆ ಪರೀಕ್ಷೆಗೆ ಹಾಜರಾಗಿ, ನಂತರ ಆಧಾರ್, ಬ್ಯಾಂಕ್ ಖಾತೆ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ನ್ಯಾಷನಲ್ ಸ್ಕಾಲರ್‌ಶಿಪ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ ಮತ್ತು ಶಾಲೆಯಿಂದ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲನೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.",
      },
    },
    {
      key: "post-matric-disability",
      provider: "Department of Empowerment of Persons with Disabilities",
      open: true,
      deadline: "2026-12-15",
      amount: "Course fee and maintenance allowance",
      tags: ["disability", "divyang", "post matric", "college", "udid", "विकलांग", "दिव्यांग", "कॉलेज", "ಅಂಗವಿಕಲ", "ಕಾಲೇಜು", "ವಿದ್ಯಾರ್ಥಿವೇತನ"],
      source: "National Scholarship Portal",
      name: {
        en: "Post-Matric Scholarship for Students with Disabilities",
        hi: "दिव्यांग छात्रों के लिए पोस्ट-मैट्रिक स्कॉलरशिप",
        kn: "ವಿಕಲಚೇತನ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ",
      },
      description: {
        en: "Scholarship for students with disabilities studying after class 10, covering course fees and a maintenance allowance.",
        hi: "कक्षा 10 के बाद पढ़ने वाले दिव्यांग छात्रों के लिए स्कॉलरशिप, जिसमें कोर्स फीस और रखरखाव भत्ता शामिल है।",
        kn: "10 ನೇ ತರಗತಿಯ ನಂತರ ಓದುತ್ತಿರುವ ವಿಕಲಚೇತನ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಕೋರ್ಸ್ ಶುಲ್ಕ ಮತ್ತು ನಿರ್ವಹಣಾ ಭತ್ಯೆಯನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ.",
      },
      eligibility: {
        en: "Students with a disability of forty per cent or more, holding a UDID card, studying in a recognised course after class 10, with family income within the notified limit.",
        hi: "40 प्रतिशत या उससे अधिक की दिव्यांगता वाले छात्र, जिनके पास UDID कार्ड है, जो कक्षा 10 के बाद किसी मान्यता प्राप्त कोर्स में पढ़ रहे हैं, और जिनके परिवार की आय अधिसूचित सीमा के भीतर है।",
        kn: "ನಲವತ್ತು ಪ್ರತಿಶತ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಿಕಲಾಂಗತೆ ಹೊಂದಿರುವ, UDID ಕಾರ್ಡ್ ಹೊಂದಿರುವ, 10 ನೇ ತರಗತಿಯ ನಂತರ ಮಾನ್ಯತೆ ಪಡೆದ ಕೋರ್ಸ್‌ನಲ್ಲಿ ಓದುತ್ತಿರುವ, ಅಧಿಸೂಚಿತ ಮಿತಿಯೊಳಗೆ ಕುಟುಂಬ ಆದಾಯವನ್ನು ಹೊಂದಿರುವ ವಿದ್ಯಾರ್ಥಿಗಳು.",
      },
      apply: {
        en: "Apply on the National Scholarship Portal with the UDID card, Aadhaar, bank account, income certificate and fee receipt, and get it verified by the institution.",
        hi: "UDID कार्ड, आधार, बैंक खाते, आय प्रमाण पत्र और फीस रसीद के साथ नेशनल स्कॉलरशिप पोर्टल पर आवेदन करें, और संस्थान से इसका सत्यापन कराएं।",
        kn: "UDID ಕಾರ್ಡ್, ಆಧಾರ್, ಬ್ಯಾಂಕ್ ಖಾತೆ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಶುಲ್ಕ ರಸೀದಿಯೊಂದಿಗೆ ನ್ಯಾಷನಲ್ ಸ್ಕಾಲರ್‌ಶಿಪ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಮತ್ತು ಸಂಸ್ಥೆಯಿಂದ ಪರಿಶೀಲನೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.",
      },
    },
  ],
};
