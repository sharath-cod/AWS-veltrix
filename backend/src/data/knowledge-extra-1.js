/**
 * Extra knowledge-base entries — part 1 (health, schemes, scholarships).
 * Every entry is fully localised in English, Hindi and Kannada so the assistant
 * answers in whichever language the phone is set to.
 *
 * Tags carry English words plus Devanagari and Kannada words, because rural
 * users often speak one language and type in another.
 *
 * Content rule: general public-service guidance only. Anything that changes
 * often (amounts, dates, eligibility) tells the user to confirm on the official
 * portal. Nothing here is invented.
 */
module.exports = [
  // ------------------------------------------------------------------ health
  {
    key: 'kb-health-bp-sugar',
    category: 'health',
    tags: ['blood pressure', 'bp', 'sugar', 'diabetes', 'hypertension', 'medicine', 'salt', 'बीपी', 'शुगर', 'मधुमेह', 'रक्तचाप', 'ರಕ್ತದೊತ್ತಡ', 'ಸಕ್ಕರೆ ಕಾಯಿಲೆ', 'ಮಧುಮೇಹ'],
    question: {
      en: 'What should I do if I have high blood pressure or diabetes?',
      hi: 'अगर मेरा बीपी या शुगर बढ़ा हुआ है तो क्या करना चाहिए?',
      kn: 'ನನ್ನ ರಕ್ತದೊತ್ತಡ ಅಥವಾ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಹೆಚ್ಚಿದ್ದರೆ ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Get your blood pressure and sugar checked at the nearest Health and Wellness Centre or Primary Health Centre; the test is free there. Take the tablets every day at the same time and never stop them on your own when you feel better. Reduce salt, fried food and sweet drinks, walk for about thirty minutes a day, and stop tobacco and alcohol. Go to a hospital at once if you have chest pain, breathlessness, severe headache, blurred vision, or a wound on the foot that does not heal.',
      hi: 'अपना बीपी और शुगर नज़दीकी आयुष्मान आरोग्य मंदिर या प्राथमिक स्वास्थ्य केंद्र में जांचें, वहां जांच मुफ्त होती है। दवा रोज़ एक ही समय पर लें और आराम महसूस होने पर अपने आप बंद न करें। नमक, तला खाना और मीठे पेय कम करें, रोज़ लगभग तीस मिनट टहलें, तंबाकू और शराब छोड़ें। सीने में दर्द, सांस फूलना, तेज़ सिरदर्द, धुंधला दिखना या पैर के घाव के न भरने पर तुरंत अस्पताल जाएं।',
      kn: 'ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸಕ್ಕರೆಯನ್ನು ಹತ್ತಿರದ ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಮಂದಿರ ಅಥವಾ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ; ಅಲ್ಲಿ ಪರೀಕ್ಷೆ ಉಚಿತ. ಮಾತ್ರೆಗಳನ್ನು ಪ್ರತಿದಿನ ಒಂದೇ ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ಚೆನ್ನಾಗಿದೆ ಎಂದು ತಾವೇ ನಿಲ್ಲಿಸಬೇಡಿ. ಉಪ್ಪು, ಕರಿದ ಆಹಾರ ಮತ್ತು ಸಿಹಿ ಪಾನೀಯ ಕಡಿಮೆ ಮಾಡಿ, ದಿನಕ್ಕೆ ಸುಮಾರು ಮೂವತ್ತು ನಿಮಿಷ ನಡೆಯಿರಿ, ತಂಬಾಕು ಮತ್ತು ಮದ್ಯ ಬಿಡಿ. ಎದೆ ನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ, ತೀವ್ರ ತಲೆನೋವು, ಮಂಜು ಕಾಣುವುದು ಅಥವಾ ಕಾಲಿನ ಗಾಯ ವಾಸಿಯಾಗದಿದ್ದರೆ ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ.',
    },
    sources: ['National Health Mission — Ayushman Arogya Mandir screening', 'National Programme for Prevention and Control of NCDs'],
  },
  {
    key: 'kb-health-anaemia',
    category: 'health',
    tags: ['anaemia', 'iron tablet', 'ifa', 'weakness', 'tiredness', 'pregnancy', 'blood', 'खून की कमी', 'एनीमिया', 'आयरन', 'कमजोरी', 'ರಕ್ತಹೀನತೆ', 'ಐರನ್ ಮಾತ್ರೆ', 'ದುರ್ಬಲತೆ'],
    question: {
      en: 'What should I do for weakness and low blood (anaemia)?',
      hi: 'कमज़ोरी और खून की कमी (एनीमिया) के लिए क्या करें?',
      kn: 'ದುರ್ಬಲತೆ ಮತ್ತು ರಕ್ತಹೀನತೆಗೆ ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Get a free haemoglobin test at the Health and Wellness Centre or with the ASHA worker. Pregnant women and adolescent girls are given iron and folic acid tablets free of cost — take them with water, not with tea or milk, and expect dark stools, which is normal. Eat green leafy vegetables, jaggery, groundnut, and sprouted pulses. If you feel breathless, giddy or have swelling in the feet, get checked the same day because severe anaemia needs treatment at a health centre.',
      hi: 'आयुष्मान आरोग्य मंदिर या आशा कार्यकर्ता से मुफ्त हीमोग्लोबिन जांच कराएं। गर्भवती महिलाओं और किशोरियों को आयरन और फोलिक एसिड की गोली मुफ्त मिलती है — इसे पानी के साथ लें, चाय या दूध के साथ नहीं; मल का रंग काला होना सामान्य है। हरी पत्तेदार सब्जी, गुड़, मूंगफली और अंकुरित दालें खाएं। सांस फूलना, चक्कर आना या पैरों में सूजन हो तो उसी दिन जांच कराएं, क्योंकि गंभीर एनीमिया में स्वास्थ्य केंद्र पर इलाज ज़रूरी है।',
      kn: 'ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಮಂದಿರ ಅಥವಾ ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯಿಂದ ಉಚಿತ ಹಿಮೋಗ್ಲೋಬಿನ್ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ. ಗರ್ಭಿಣಿಯರು ಮತ್ತು ಹದಿಹರೆಯದ ಹುಡುಗಿಯರಿಗೆ ಕಬ್ಬಿಣ ಮತ್ತು ಫೋಲಿಕ್ ಆಸಿಡ್ ಮಾತ್ರೆ ಉಚಿತವಾಗಿ ಸಿಗುತ್ತದೆ — ಅದನ್ನು ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ, ಚಹಾ ಅಥವಾ ಹಾಲಿನೊಂದಿಗೆ ಅಲ್ಲ; ಮಲದ ಬಣ್ಣ ಕಪ್ಪಾಗುವುದು ಸಹಜ. ಹಸಿರು ಸೊಪ್ಪು, ಬೆಲ್ಲ, ಶೇಂಗಾ ಮತ್ತು ಮೊಳಕೆ ಬೇಳೆ ತಿನ್ನಿರಿ. ಉಸಿರಾಟದ ತೊಂದರೆ, ತಲೆಸುತ್ತು ಅಥವಾ ಕಾಲು ಊತ ಕಂಡರೆ ಅದೇ ದಿನ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ, ಏಕೆಂದರೆ ತೀವ್ರ ರಕ್ತಹೀನತೆಗೆ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ಚಿಕಿತ್ಸೆ ಬೇಕು.',
    },
    sources: ['National Health Mission — Anemia Mukt Bharat', 'Health and Wellness Centre services'],
  },
  {
    key: 'kb-health-immunisation',
    category: 'health',
    tags: ['vaccine', 'vaccination', 'immunisation', 'child', 'baby', 'polio', 'measles', 'टीका', 'टीकाकरण', 'बच्चा', 'लस', 'ಲಸಿಕೆ', 'ಮಗು', 'ಚುಚ್ಚುಮದ್ದು'],
    question: {
      en: 'Which vaccines should my child get and where are they free?',
      hi: 'मेरे बच्चे को कौन-कौन से टीके लगने चाहिए और मुफ्त कहां मिलते हैं?',
      kn: 'ನನ್ನ ಮಗುವಿಗೆ ಯಾವ ಲಸಿಕೆಗಳು ಬೇಕು ಮತ್ತು ಉಚಿತವಾಗಿ ಎಲ್ಲಿ ಸಿಗುತ್ತವೆ?',
    },
    answer: {
      en: 'All routine vaccines under the Universal Immunisation Programme are free at the Anganwadi, Health and Wellness Centre and government hospital, and on Village Health and Nutrition Days. A child gets BCG, polio drops and hepatitis B at birth; then several rounds at six, ten and fourteen weeks; measles and rubella at nine to twelve months and again at sixteen to twenty-four months; and booster doses after that. Pregnant women get free tetanus vaccines. Carry the immunisation card every visit — if a dose is missed, it can still be given later, so ask the ASHA worker.',
      hi: 'सार्वभौमिक टीकाकरण कार्यक्रम के सभी नियमित टीके आंगनवाड़ी, आयुष्मान आरोग्य मंदिर, सरकारी अस्पताल और गांव के स्वास्थ्य एवं पोषण दिवस पर मुफ्त लगते हैं। जन्म पर बीसीजी, पोलियो की खुराक और हेपेटाइटिस बी; फिर छह, दस और चौदह हफ्ते पर कई टीके; नौ से बारह महीने और सोलह से चौबीस महीने पर खसरा-रूबेला; इसके बाद बूस्टर खुराकें। गर्भवती महिलाओं को टिटनेस का टीका मुफ्त लगता है। हर बार टीकाकरण कार्ड ले जाएं — कोई खुराक छूट जाए तो बाद में भी लग सकती है, आशा कार्यकर्ता से पूछें।',
      kn: 'ಸಾರ್ವತ್ರಿಕ ಲಸಿಕೆ ಕಾರ್ಯಕ್ರಮದ ಎಲ್ಲಾ ನಿಯಮಿತ ಲಸಿಕೆಗಳು ಅಂಗನವಾಡಿ, ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಮಂದಿರ, ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಗ್ರಾಮ ಆರೋಗ್ಯ ಮತ್ತು ಪೋಷಣಾ ದಿನದಂದು ಉಚಿತ. ಹುಟ್ಟಿದಾಗ ಬಿಸಿಜಿ, ಪೋಲಿಯೊ ಹನಿ ಮತ್ತು ಹೆಪಟೈಟಿಸ್ ಬಿ; ನಂತರ ಆರು, ಹತ್ತು ಮತ್ತು ಹದಿನಾಲ್ಕು ವಾರಗಳಲ್ಲಿ ಹಲವು ಲಸಿಕೆಗಳು; ಒಂಬತ್ತರಿಂದ ಹನ್ನೆರಡು ತಿಂಗಳು ಮತ್ತು ಹದಿನಾರರಿಂದ ಇಪ್ಪತ್ತನಾಲ್ಕು ತಿಂಗಳಲ್ಲಿ ದಡಾರ-ರೂಬೆಲ್ಲಾ; ನಂತರ ಬೂಸ್ಟರ್ ಡೋಸ್. ಗರ್ಭಿಣಿಯರಿಗೆ ಟೆಟನಸ್ ಲಸಿಕೆ ಉಚಿತ. ಪ್ರತಿ ಬಾರಿ ಲಸಿಕೆ ಕಾರ್ಡ್ ಒಯ್ಯಿರಿ — ಒಂದು ಡೋಸ್ ತಪ್ಪಿಹೋದರೆ ನಂತರವೂ ಹಾಕಿಸಬಹುದು, ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯನ್ನು ಕೇಳಿ.',
    },
    sources: ['Universal Immunisation Programme — MoHFW', 'National Health Mission immunisation schedule'],
  },
  {
    key: 'kb-health-snake-bite',
    category: 'health',
    tags: ['snake', 'snake bite', 'bite', 'poison', 'saap', 'सांप', 'सर्प', 'जहर', 'ಹಾವು', 'ವಿಷ', 'ಹಾವು ಕಡಿತ'],
    question: {
      en: 'What first aid should I give for a snake bite?',
      hi: 'सांप काटने पर तुरंत क्या करना चाहिए?',
      kn: 'ಹಾವು ಕಡಿದರೆ ತಕ್ಷಣ ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Keep the person calm and still, and take them to a government hospital that has anti-snake venom as fast as possible — call 108 for an ambulance. Keep the bitten limb below the level of the heart and remove rings, bangles and tight clothing before it swells. Do not cut the wound, do not suck out the poison, do not tie a tight rope or tourniquet, and do not give any traditional or herbal treatment. Note the time of the bite and, if it is safe, the colour and pattern of the snake so the doctor can decide the treatment.',
      hi: 'मरीज़ को शांत और स्थिर रखें और जल्द से जल्द सरकारी अस्पताल ले जाएं जहां सांप का एंटी-वेनम उपलब्ध हो — एम्बुलेंस के लिए 108 पर कॉल करें। काटे गए अंग को दिल के स्तर से नीचे रखें और सूजन बढ़ने से पहले अंगूठी, चूड़ी और तंग कपड़े उतार दें। घाव को चीरा न लगाएं, ज़हर मुंह से न चूसें, रस्सी या पट्टी से कसकर न बांधें, और कोई देसी या झाड़-फूंक इलाज न करें। काटने का समय और सांप का रंग-निशान याद रखें ताकि डॉक्टर इलाज तय कर सकें।',
      kn: 'ರೋಗಿಯನ್ನು ಶಾಂತವಾಗಿ ಮತ್ತು ಚಲಿಸದಂತೆ ಇಟ್ಟು, ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ, ಅಲ್ಲಿ ಸರ್ಪ ವಿಷದ ಔಷಧ (ಆಂಟಿ-ವೆನಮ್) ಇರುತ್ತದೆ — ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಾಗಿ 108 ಗೆ ಕರೆ ಮಾಡಿ. ಕಚ್ಚಿದ ಅಂಗವನ್ನು ಹೃದಯದ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗೆ ಇರಿಸಿ ಮತ್ತು ಊತ ಬರುವ ಮೊದಲು ಉಂಗುರ, ಬಳೆ, ಬಿಗಿಯಾದ ಬಟ್ಟೆ ತೆಗೆಯಿರಿ. ಗಾಯಕ್ಕೆ ಕತ್ತರಿ ಹಾಕಬೇಡಿ, ಬಾಯಿಯಿಂದ ವಿಷ ಹೀರಬೇಡಿ, ಹಗ್ಗ ಅಥವಾ ಪಟ್ಟಿಯಿಂದ ಬಿಗಿಯಾಗಿ ಕಟ್ಟಬೇಡಿ, ಮತ್ತು ಯಾವುದೇ ದೇಸಿ ಅಥವಾ ಮಂತ್ರ-ತಂತ್ರ ಚಿಕಿತ್ಸೆ ಮಾಡಬೇಡಿ. ಕಚ್ಚಿದ ಸಮಯ ಮತ್ತು ಹಾವಿನ ಬಣ್ಣ-ಗುರುತನ್ನು ನೆನಪಿಡಿ, ವೈದ್ಯರು ಚಿಕಿತ್ಸೆ ನಿರ್ಧರಿಸಲು ಸಹಾಯವಾಗುತ್ತದೆ.',
    },
    sources: ['National Health Mission — snake bite management protocol', '108 ambulance service'],
  },
  {
    key: 'kb-health-heat-stroke',
    category: 'health',
    tags: ['heat', 'heat stroke', 'summer', 'sunstroke', 'dehydration', 'loo', 'गर्मी', 'लू', 'धूप', 'पानी की कमी', 'ಬಿಸಿಲು', 'ಬೇಸಿಗೆ', 'ನೀರಿನ ಕೊರತೆ'],
    question: {
      en: 'What should I do in very hot weather to avoid heat stroke?',
      hi: 'बहुत गर्मी में लू से बचने के लिए क्या करें?',
      kn: 'ತುಂಬಾ ಬಿಸಿಲಿನಲ್ಲಿ ಬಿಸಿಲು ಏಟಿನಿಂದ ತಪ್ಪಿಸಿಕೊಳ್ಳಲು ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Drink water often even when you are not thirsty, and carry water when you go to the field. Avoid heavy work between noon and three in the afternoon, cover your head with a cloth or hat, and wear loose cotton clothes. Give children and elderly people water, buttermilk or lemon water frequently. If someone becomes very hot, confused, stops sweating or faints, move them to shade, wet their body and fan them, give cool water to drink if they are conscious, and take them to a hospital at once — heat stroke is an emergency.',
      hi: 'प्यास न लगे तब भी बार-बार पानी पिएं और खेत जाते समय पानी साथ रखें। दोपहर से तीन बजे तक भारी काम से बचें, सिर को कपड़े या टोपी से ढकें और ढीले सूती कपड़े पहनें। बच्चों और बुज़ुर्गों को बार-बार पानी, छाछ या नींबू पानी दें। किसी को बहुत गर्मी लगे, वह भ्रम में पड़े, पसीना आना बंद हो जाए या बेहोश हो जाए तो उसे छाया में ले जाएं, शरीर गीला करके पंखा करें, होश में हो तो ठंडा पानी पिलाएं और तुरंत अस्पताल ले जाएं — लू एक आपातकाल है।',
      kn: 'ಬಾಯಾರಿಕೆ ಇಲ್ಲದಿದ್ದರೂ ಆಗಾಗ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ಹೊಲಕ್ಕೆ ಹೋಗುವಾಗ ನೀರು ಒಯ್ಯಿರಿ. ಮಧ್ಯಾಹ್ನದಿಂದ ಮೂರು ಗಂಟೆಯವರೆಗೆ ಭಾರೀ ಕೆಲಸ ಮಾಡಬೇಡಿ, ತಲೆಗೆ ಬಟ್ಟೆ ಅಥವಾ ಟೋಪಿ ಹಾಕಿಕೊಳ್ಳಿ ಮತ್ತು ಸಡಿಲ ಹತ್ತಿ ಬಟ್ಟೆ ಧರಿಸಿ. ಮಕ್ಕಳಿಗೆ ಮತ್ತು ವೃದ್ಧರಿಗೆ ಆಗಾಗ ನೀರು, ಮಜ್ಜಿಗೆ ಅಥವಾ ನಿಂಬೆ ನೀರು ಕೊಡಿ. ಯಾರಿಗಾದರೂ ತುಂಬಾ ಬಿಸಿ ಆಗಿ, ಗೊಂದಲ ಉಂಟಾಗಿ, ಬೆವರು ನಿಂತು ಅಥವಾ ಪ್ರಜ್ಞೆ ತಪ್ಪಿದರೆ ಅವರನ್ನು ನೆರಳಿಗೆ ಸರಿಸಿ, ದೇಹ ಒದ್ದೆ ಮಾಡಿ ಬೀಸಣಿಗೆ ಬೀಸಿ, ಎಚ್ಚರದಲ್ಲಿದ್ದರೆ ತಣ್ಣೀರು ಕುಡಿಸಿ ಮತ್ತು ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಒಯ್ಯಿರಿ — ಬಿಸಿಲು ಏಟು ತುರ್ತು ಪರಿಸ್ಥಿತಿ.',
    },
    sources: ['National Health Mission — heat wave advisory', 'NDMA heat wave guidelines'],
  },
  {
    key: 'kb-health-mental-health',
    category: 'health',
    tags: ['mental health', 'stress', 'depression', 'tension', 'sleep', 'sad', 'counselling', 'मानसिक', 'तनाव', 'डिप्रेशन', 'उदासी', 'मन', 'ಮಾನಸಿಕ ಆರೋಗ್ಯ', 'ಒತ್ತಡ', 'ಖಿನ್ನತೆ', 'ದುಃಖ'],
    question: {
      en: 'I feel very tense and cannot sleep. Where can I get help?',
      hi: 'मुझे बहुत तनाव होता है और नींद नहीं आती। मदद कहां मिलेगी?',
      kn: 'ನನಗೆ ತುಂಬಾ ಒತ್ತಡವಾಗುತ್ತದೆ ಮತ್ತು ನಿದ್ರೆ ಬರುತ್ತಿಲ್ಲ. ಸಹಾಯ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Feeling tense, sad or unable to sleep is common and it can be treated — it is not weakness. You can talk free of cost to a trained counsellor on the Tele-MANAS helpline 14416, in your own language, any time of the day. Your Health and Wellness Centre also has a counsellor and can refer you to a district hospital. Keep a fixed sleep time, reduce alcohol and tobacco, and share the problem with someone you trust. If you ever think of harming yourself, please call 14416 or go to the nearest hospital immediately — do not stay alone.',
      hi: 'तनाव, उदासी या नींद न आना आम बात है और इसका इलाज संभव है — यह कमज़ोरी नहीं है। आप तले-मानस हेल्पलाइन 14416 पर दिन के किसी भी समय, अपनी भाषा में, मुफ्त में प्रशिक्षित सलाहकार से बात कर सकते हैं। आपके आयुष्मान आरोग्य मंदिर में भी सलाहकार हैं जो ज़िला अस्पताल भेज सकते हैं। सोने का समय तय रखें, शराब और तंबाकू कम करें, और किसी भरोसेमंद व्यक्ति से बात करें। अगर कभी अपने आप को नुकसान पहुंचाने का ख्याल आए तो तुरंत 14416 पर कॉल करें या नज़दीकी अस्पताल जाएं — अकेले न रहें।',
      kn: 'ಒತ್ತಡ, ದುಃಖ ಅಥವಾ ನಿದ್ರೆ ಬಾರದಿರುವುದು ಸಾಮಾನ್ಯ ಮತ್ತು ಅದಕ್ಕೆ ಚಿಕಿತ್ಸೆ ಇದೆ — ಅದು ದೌರ್ಬಲ್ಯ ಅಲ್ಲ. ನೀವು ತೆಲೆ-ಮಾನಸ್ ಸಹಾಯವಾಣಿ 14416 ಗೆ ದಿನದ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ, ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ, ಉಚಿತವಾಗಿ ತರಬೇತಿ ಪಡೆದ ಸಲಹೆಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಬಹುದು. ನಿಮ್ಮ ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಮಂದಿರದಲ್ಲೂ ಸಲಹೆಗಾರರಿದ್ದಾರೆ, ಅವರು ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗೆ ಕಳುಹಿಸಬಹುದು. ಮಲಗುವ ಸಮಯ ನಿಗದಿಪಡಿಸಿ, ಮದ್ಯ ಮತ್ತು ತಂಬಾಕು ಕಡಿಮೆ ಮಾಡಿ, ಮತ್ತು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ. ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ನಿಮಗೆ ನೀವೇ ಹಾನಿ ಮಾಡಿಕೊಳ್ಳುವ ಯೋಚನೆ ಬಂದರೆ ತಕ್ಷಣ 14416 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ — ಒಂಟಿಯಾಗಿ ಇರಬೇಡಿ.',
    },
    sources: ['Tele-MANAS mental health helpline 14416', 'National Mental Health Programme'],
  },

  // ----------------------------------------------------------------- schemes
  {
    key: 'kb-scheme-pm-kisan',
    category: 'schemes',
    tags: ['pm kisan', 'kisan', 'farmer', 'farmers', 'money', 'installment', 'land', 'किसान', 'पीएम किसान', 'खेती', 'किस्त', 'ರೈತ', 'ಪಿಎಂ ಕಿಸಾನ್', 'ಕೃಷಿ', 'ಕಂತು'],
    question: {
      en: 'How do I get the PM-KISAN money for farmers?',
      hi: 'किसानों को पीएम-किसान के पैसे कैसे मिलते हैं?',
      kn: 'ರೈತರಿಗೆ ಪಿಎಂ-ಕಿಸಾನ್ ಹಣ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'PM-KISAN gives small and marginal farmer families income support of about six thousand rupees a year in three instalments of two thousand rupees, paid straight into the bank account. Your name must be in the land records and the bank account must be linked to Aadhaar. Register at the nearest Common Service Centre or on the PM-KISAN portal with Aadhaar, land papers and bank passbook, or ask the village accountant. Check your payment status on the portal; income-tax payers and government employees are not eligible. Confirm the current instalment date on the portal.',
      hi: 'पीएम-किसान छोटे और सीमांत किसान परिवारों को सालाना लगभग छह हज़ार रुपये की आय सहायता तीन किस्तों में देती है, जो सीधे बैंक खाते में आती है। आपका नाम ज़मीन के कागज़ों में होना चाहिए और बैंक खाता आधार से जुड़ा होना चाहिए। आधार, ज़मीन के कागज़ और बैंक पासबुक लेकर नज़दीकी सीएससी केंद्र या पीएम-किसान पोर्टल पर पंजीकरण करें, या ग्राम लेखपाल से पूछें। पोर्टल पर भुगतान की स्थिति देखें; आयकर देने वाले और सरकारी कर्मचारी पात्र नहीं हैं। वर्तमान किस्त की तारीख पोर्टल पर जांच लें।',
      kn: 'ಪಿಎಂ-ಕಿಸಾನ್ ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ಸುಮಾರು ಆರು ಸಾವಿರ ರೂಪಾಯಿ ಆದಾಯ ಬೆಂಬಲವನ್ನು ಎರಡು ಸಾವಿರ ರೂಪಾಯಿಯ ಮೂರು ಕಂತುಗಳಲ್ಲಿ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೀಡುತ್ತದೆ. ನಿಮ್ಮ ಹೆಸರು ಭೂ ದಾಖಲೆಗಳಲ್ಲಿ ಇರಬೇಕು ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗಿರಬೇಕು. ಆಧಾರ್, ಭೂ ದಾಖಲೆ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಒಯ್ದು ಹತ್ತಿರದ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ ಅಥವಾ ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ, ಅಥವಾ ಗ್ರಾಮ ಲೆಕ್ಕಿಗರನ್ನು ಕೇಳಿ. ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪಾವತಿ ಸ್ಥಿತಿ ನೋಡಿ; ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸುವವರು ಮತ್ತು ಸರ್ಕಾರಿ ನೌಕರರು ಅರ್ಹರಲ್ಲ. ಪ್ರಸ್ತುತ ಕಂತಿನ ದಿನಾಂಕವನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    },
    sources: ['PM-KISAN portal', 'Department of Agriculture and Farmers Welfare'],
  },
  {
    key: 'kb-scheme-ayushman',
    category: 'schemes',
    tags: ['ayushman', 'health insurance', 'hospital', 'card', 'pmjay', 'free treatment', 'आयुष्मान', 'बीमा', 'अस्पताल', 'कार्ड', 'ಮುಚ್ಚಳಿಕೆ', 'ಆಯುಷ್ಮಾನ್', 'ಆಸ್ಪತ್ರೆ'],
    question: {
      en: 'How do I get an Ayushman Bharat card and free hospital treatment?',
      hi: 'आयुष्मान भारत कार्ड और मुफ्त इलाज कैसे मिलता है?',
      kn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಕಾರ್ಡ್ ಮತ್ತು ಉಚಿತ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Under Ayushman Bharat PM-JAY an eligible family gets hospital treatment up to about five lakh rupees a year at listed government and private hospitals. Check whether your family is on the SECC list on the PM-JAY portal or ask at the Ayushman Arogya Mandir or Common Service Centre, where the card is made from Aadhaar for a small fee. Show the card at the hospital help desk before treatment so it is cashless; keep the discharge papers. All senior citizens aged seventy and above can get the Ayushman Vay Vandana card. Confirm the current rules and the hospital list on the portal before you go.',
      hi: 'आयुष्मान भारत पीएम-जय में पात्र परिवार को सूचीबद्ध सरकारी और निजी अस्पतालों में सालाना लगभग पांच लाख रुपये तक का इलाज मिलता है। पीएम-जय पोर्टल पर देखें कि आपका परिवार एसईसीसी सूची में है या नहीं, या आयुष्मान आरोग्य मंदिर या सीएससी केंद्र में पूछें, जहां आधार से थोड़े शुल्क पर कार्ड बनता है। इलाज से पहले अस्पताल के हेल्प डेस्क पर कार्ड दिखाएं ताकि इलाज कैशलेस हो; डिस्चार्ज के कागज़ रखें। सत्तर वर्ष और अधिक उम्र के सभी वरिष्ठ नागरिक आयुष्मान वय वंदना कार्ड ले सकते हैं। जाने से पहले पोर्टल पर वर्तमान नियम और अस्पताल की सूची जांच लें।',
      kn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಪಿಎಂ-ಜಯ್ ಅಡಿಯಲ್ಲಿ ಅರ್ಹ ಕುಟುಂಬಕ್ಕೆ ಪಟ್ಟಿ ಮಾಡಿದ ಸರ್ಕಾರಿ ಮತ್ತು ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ವರ್ಷಕ್ಕೆ ಸುಮಾರು ಐದು ಲಕ್ಷ ರೂಪಾಯಿವರೆಗೆ ಚಿಕಿತ್ಸೆ ಸಿಗುತ್ತದೆ. ನಿಮ್ಮ ಕುಟುಂಬ ಎಸ್ಇಸಿಸಿ ಪಟ್ಟಿಯಲ್ಲಿದೆಯೇ ಎಂದು ಪಿಎಂ-ಜಯ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಡಿ, ಅಥವಾ ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಮಂದಿರ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರದಲ್ಲಿ ಕೇಳಿ; ಅಲ್ಲಿ ಆಧಾರ್‌ನಿಂದ ಸ್ವಲ್ಪ ಶುಲ್ಕಕ್ಕೆ ಕಾರ್ಡ್ ಮಾಡುತ್ತಾರೆ. ಚಿಕಿತ್ಸೆಗೆ ಮೊದಲು ಆಸ್ಪತ್ರೆಯ ಸಹಾಯ ಕೇಂದ್ರದಲ್ಲಿ ಕಾರ್ಡ್ ತೋರಿಸಿ, ಆಗ ಚಿಕಿತ್ಸೆ ನಗದುರಹಿತವಾಗುತ್ತದೆ; ಡಿಸ್ಚಾರ್ಜ್ ದಾಖಲೆಗಳನ್ನು ಇಟ್ಟುಕೊಳ್ಳಿ. ಎಪ್ಪತ್ತು ವರ್ಷ ಮತ್ತು ಮೇಲ್ಪಟ್ಟ ಎಲ್ಲಾ ಹಿರಿಯ ನಾಗರಿಕರು ಆಯುಷ್ಮಾನ್ ವಯ್ ವಂದನಾ ಕಾರ್ಡ್ ಪಡೆಯಬಹುದು. ಹೋಗುವ ಮೊದಲು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ನಿಯಮ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಪಟ್ಟಿ ಪರಿಶೀಲಿಸಿ.',
    },
    sources: ['Ayushman Bharat PM-JAY portal', 'National Health Authority'],
  },
  {
    key: 'kb-scheme-pension',
    category: 'schemes',
    tags: ['pension', 'old age', 'widow', 'disability', 'nsap', 'monthly', 'पेंशन', 'वृद्धावस्था', 'विधवा', 'विकलांग', 'ಪಿಂಚಣಿ', 'ವೃದ್ಧಾಪ್ಯ', 'ವಿಧವೆ', 'ಅಂಗವಿಕಲ'],
    question: {
      en: 'How can I apply for an old age, widow or disability pension?',
      hi: 'वृद्धावस्था, विधवा या विकलांग पेंशन के लिए कैसे आवेदन करें?',
      kn: 'ವೃದ್ಧಾಪ್ಯ, ವಿಧವೆ ಅಥವಾ ಅಂಗವಿಕಲ ಪಿಂಚಣಿಗೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?',
    },
    answer: {
      en: 'Old age, widow and disability pensions under the National Social Assistance Programme are applied for at the Gram Panchayat or the taluk social welfare office, and many states also accept applications online. Usually you need Aadhaar, a bank account in your own name linked to Aadhaar, age proof, and for disability a certificate from the medical board; widows need the husband\'s death certificate. The pension is paid every month into the bank account. Ask the Panchayat secretary for the form and the current age and income limits in your state, because these differ from state to state.',
      hi: 'राष्ट्रीय सामाजिक सहायता कार्यक्रम के तहत वृद्धावस्था, विधवा और विकलांग पेंशन के लिए ग्राम पंचायत या तालुका समाज कल्याण कार्यालय में आवेदन करें, कई राज्यों में ऑनलाइन आवेदन भी होता है। आमतौर पर आधार, अपने नाम का बैंक खाता जो आधार से जुड़ा हो, उम्र का प्रमाण, और विकलांगता के लिए मेडिकल बोर्ड का प्रमाण पत्र चाहिए; विधवा के लिए पति का मृत्यु प्रमाण पत्र। पेंशन हर महीने बैंक खाते में आती है। फॉर्म और अपने राज्य की वर्तमान उम्र और आय सीमा पंचायत सचिव से पूछें, क्योंकि ये हर राज्य में अलग हैं।',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ಸಹಾಯ ಕಾರ್ಯಕ್ರಮದ ಅಡಿಯಲ್ಲಿ ವೃದ್ಧಾಪ್ಯ, ವಿಧವೆ ಮತ್ತು ಅಂಗವಿಕಲ ಪಿಂಚಣಿಗೆ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ತಾಲೂಕು ಸಮಾಜ ಕಲ್ಯಾಣ ಕಚೇರಿಯಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ; ಅನೇಕ ರಾಜ್ಯಗಳಲ್ಲಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿಯೂ ಇದೆ. ಸಾಮಾನ್ಯವಾಗಿ ಆಧಾರ್, ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ, ವಯಸ್ಸಿನ ದಾಖಲೆ, ಮತ್ತು ಅಂಗವಿಕಲತೆಗೆ ವೈದ್ಯಕೀಯ ಮಂಡಳಿಯ ಪ್ರಮಾಣಪತ್ರ ಬೇಕು; ವಿಧವೆಯರಿಗೆ ಗಂಡನ ಮರಣ ಪ್ರಮಾಣಪತ್ರ ಬೇಕು. ಪಿಂಚಣಿ ಪ್ರತಿ ತಿಂಗಳು ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬರುತ್ತದೆ. ಅರ್ಜಿ ನಮೂನೆ ಮತ್ತು ನಿಮ್ಮ ರಾಜ್ಯದ ಪ್ರಸ್ತುತ ವಯಸ್ಸು ಮತ್ತು ಆದಾಯ ಮಿತಿಯನ್ನು ಪಂಚಾಯತ್ ಕಾರ್ಯದರ್ಶಿಯನ್ನು ಕೇಳಿ, ಏಕೆಂದರೆ ಅವು ರಾಜ್ಯದಿಂದ ರಾಜ್ಯಕ್ಕೆ ಬೇರೆ.',
    },
    sources: ['National Social Assistance Programme', 'State social welfare department'],
  },
  {
    key: 'kb-scheme-mgnrega',
    category: 'schemes',
    tags: ['mgnrega', 'job card', 'wage', 'employment', '100 days', 'work', 'मनरेगा', 'जॉब कार्ड', 'मजदूरी', 'रोजगार', 'ಕೆಲಸ', 'ಮನರೇಗಾ', 'ಜಾಬ್ ಕಾರ್ಡ್', 'ಕೂಲಿ'],
    question: {
      en: 'How do I get a MGNREGA job card and work?',
      hi: 'मनरेगा जॉब कार्ड और काम कैसे मिलता है?',
      kn: 'ಮನರೇಗಾ ಜಾಬ್ ಕಾರ್ಡ್ ಮತ್ತು ಕೆಲಸ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Ask the Gram Panchayat for a job card; it is free, and the card should be given within fifteen days of applying with your family photograph and Aadhaar. After that, give a written demand for work to the Panchayat — keep a receipt or a photo of the application. Work should be provided within fifteen days of the demand, and every rural household is entitled to at least one hundred days of wage work a year. Wages must be paid into the bank or post office account. If work is not given in time or wages are delayed, you can complain to the Block Development Officer or on the MGNREGA public grievance portal.',
      hi: 'ग्राम पंचायत से जॉब कार्ड मांगें; यह मुफ्त है और परिवार की फोटो तथा आधार के साथ आवेदन के पंद्रह दिन में मिल जाना चाहिए। इसके बाद पंचायत को काम की लिखित मांग दें — रसीद या आवेदन की फोटो रखें। मांग के पंद्रह दिन में काम मिलना चाहिए, और हर ग्रामीण परिवार को साल में कम से कम सौ दिन की मज़दूरी का हक है। मज़दूरी बैंक या डाकघर खाते में दी जानी चाहिए। समय पर काम न मिले या मज़दूरी में देरी हो तो खंड विकास अधिकारी या मनरेगा शिकायत पोर्टल पर शिकायत करें।',
      kn: 'ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ಜಾಬ್ ಕಾರ್ಡ್ ಕೇಳಿ; ಅದು ಉಚಿತ, ಕುಟುಂಬದ ಫೋಟೋ ಮತ್ತು ಆಧಾರ್ ಜೊತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ಹದಿನೈದು ದಿನಗಳಲ್ಲಿ ಸಿಗಬೇಕು. ನಂತರ ಪಂಚಾಯತ್‌ಗೆ ಕೆಲಸದ ಬರಹ ರೂಪದ ಬೇಡಿಕೆ ನೀಡಿ — ರಸೀದಿ ಅಥವಾ ಅರ್ಜಿಯ ಫೋಟೋ ಇಟ್ಟುಕೊಳ್ಳಿ. ಬೇಡಿಕೆಯ ಹದಿನೈದು ದಿನಗಳಲ್ಲಿ ಕೆಲಸ ಸಿಗಬೇಕು, ಮತ್ತು ಪ್ರತಿ ಗ್ರಾಮೀಣ ಕುಟುಂಬಕ್ಕೆ ವರ್ಷಕ್ಕೆ ಕನಿಷ್ಠ ನೂರು ದಿನಗಳ ಕೂಲಿ ಕೆಲಸದ ಹಕ್ಕು ಇದೆ. ಕೂಲಿ ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಕಚೇರಿ ಖಾತೆಗೆ ಬರಬೇಕು. ಸಮಯಕ್ಕೆ ಕೆಲಸ ಸಿಗದಿದ್ದರೆ ಅಥವಾ ಕೂಲಿ ತಡವಾದರೆ ತಾಲೂಕು ಕಾರ್ಯನಿರ್ವಾಹಕ ಅಧಿಕಾರಿ ಅಥವಾ ಮನರೇಗಾ ದೂರು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ದೂರು ನೀಡಿ.',
    },
    sources: ['MGNREGA public portal', 'Ministry of Rural Development'],
  },
  {
    key: 'kb-scheme-ujjwala',
    category: 'schemes',
    tags: ['ujjwala', 'lpg', 'gas', 'cylinder', 'connection', 'उज्ज्वला', 'गैस', 'सिलेंडर', 'कनेक्शन', 'ಉಜ್ವಾಲಾ', 'ಗ್ಯಾಸ್', 'ಸಿಲಿಂಡರ್'],
    question: {
      en: 'How do I get a free LPG gas connection under Ujjwala?',
      hi: 'उज्ज्वला योजना में मुफ्त गैस कनेक्शन कैसे मिलता है?',
      kn: 'ಉಜ್ವಾಲಾ ಯೋಜನೆಯಲ್ಲಿ ಉಚಿತ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Under the Ujjwala scheme a woman from a poor household who does not already have an LPG connection can get a connection without paying the deposit. Apply at the nearest LPG distributor or on the Ujjwala portal with Aadhaar, ration card, bank account details and a photograph, and give the distributor\'s reference number from your ration card. Refills are paid for, though some states give a subsidy; check the current subsidy rule with the distributor. Never keep the cylinder near a flame, always keep the room ventilated, and turn off the regulator when you finish cooking.',
      hi: 'उज्ज्वला योजना में गरीब परिवार की ऐसी महिला जिसके नाम गैस कनेक्शन नहीं है, बिना जमा राशि दिए कनेक्शन ले सकती है। आधार, राशन कार्ड, बैंक खाते की जानकारी और फोटो लेकर नज़दीकी गैस एजेंसी या उज्ज्वला पोर्टल पर आवेदन करें और राशन कार्ड पर लिखा एजेंसी का संदर्भ नंबर बताएं। रिफिल का पैसा देना होता है, हालांकि कुछ राज्य सब्सिडी देते हैं; वर्तमान नियम एजेंसी से पूछें। सिलेंडर को कभी आग के पास न रखें, कमरे में हवा आने दें और खाना बनाने के बाद रेगुलेटर बंद करें।',
      kn: 'ಉಜ್ವಾಲಾ ಯೋಜನೆಯಲ್ಲಿ ಈಗಾಗಲೇ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ ಇಲ್ಲದ ಬಡ ಕುಟುಂಬದ ಮಹಿಳೆ ಠೇವಣಿ ಪಾವತಿಸದೆ ಸಂಪರ್ಕ ಪಡೆಯಬಹುದು. ಆಧಾರ್, ರೇಷನ್ ಕಾರ್ಡ್, ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ ಮತ್ತು ಫೋಟೋ ಒಯ್ದು ಹತ್ತಿರದ ಗ್ಯಾಸ್ ಏಜೆನ್ಸಿ ಅಥವಾ ಉಜ್ವಾಲಾ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ರೇಷನ್ ಕಾರ್ಡ್‌ನಲ್ಲಿರುವ ಏಜೆನ್ಸಿ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ತಿಳಿಸಿ. ರಿಫಿಲ್‌ಗೆ ಹಣ ಕೊಡಬೇಕು, ಆದರೂ ಕೆಲವು ರಾಜ್ಯಗಳು ಸಬ್ಸಿಡಿ ನೀಡುತ್ತವೆ; ಪ್ರಸ್ತುತ ನಿಯಮವನ್ನು ಏಜೆನ್ಸಿಯಲ್ಲಿ ಕೇಳಿ. ಸಿಲಿಂಡರ್ ಅನ್ನು ಎಂದಿಗೂ ಬೆಂಕಿಯ ಹತ್ತಿರ ಇಡಬೇಡಿ, ಕೊಠಡಿಗೆ ಗಾಳಿ ಆಡಲಿ ಮತ್ತು ಅಡುಗೆ ಮುಗಿದ ಮೇಲೆ ರೆಗ್ಯುಲೇಟರ್ ಆಫ್ ಮಾಡಿ.',
    },
    sources: ['Pradhan Mantri Ujjwala Yojana portal', 'Ministry of Petroleum and Natural Gas'],
  },
  {
    key: 'kb-scheme-housing',
    category: 'schemes',
    tags: ['housing', 'house', 'pmay', 'awas', 'home', 'आवास', 'मकान', 'घर', 'ಪಿಎಂಎವೈ', 'ಮನೆ', 'ವಸತಿ'],
    question: {
      en: 'How can I apply for a rural housing scheme house?',
      hi: 'ग्रामीण आवास योजना में घर के लिए कैसे आवेदन करें?',
      kn: 'ಗ್ರಾಮೀಣ ವಸತಿ ಯೋಜನೆಯಲ್ಲಿ ಮನೆಗೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?',
    },
    answer: {
      en: 'Under PMAY-Gramin, families who are homeless or living in kutcha or dilapidated houses get financial help to build a pucca house with a toilet, electricity and water. The list is prepared from the SECC housing data and verified by the Gram Sabha, so first ask the Gram Panchayat whether your family is on the verified list; if not, request a survey. You need Aadhaar, job card or MGNREGA number, bank account and land papers. The money is released in instalments as each stage of construction is verified, so photographs of each stage are needed. Confirm the current unit cost and rules on the PMAY-G portal.',
      hi: 'पीएमएवाई-ग्रामीण में बेघर या कच्चे/जर्जर घर में रहने वाले परिवारों को शौचालय, बिजली और पानी वाला पक्का घर बनाने के लिए आर्थिक सहायता मिलती है। सूची एसईसीसी आवास डेटा से बनती है और ग्राम सभा से सत्यापित होती है, इसलिए पहले ग्राम पंचायत से पूछें कि आपका परिवार सत्यापित सूची में है या नहीं; न हो तो सर्वेक्षण की मांग करें। आधार, जॉब कार्ड या मनरेगा नंबर, बैंक खाता और ज़मीन के कागज़ चाहिए। पैसा निर्माण के हर चरण के सत्यापन पर किस्तों में मिलता है, इसलिए हर चरण की फोटो ज़रूरी है। वर्तमान लागत और नियम पीएमएवाई-जी पोर्टल पर जांचें।',
      kn: 'ಪಿಎಂಎವೈ-ಗ್ರಾಮೀಣ ಅಡಿಯಲ್ಲಿ ಮನೆಯಿಲ್ಲದ ಅಥವಾ ಮಣ್ಣಿನ/ಶಿಥಿಲ ಮನೆಯಲ್ಲಿ ವಾಸಿಸುವ ಕುಟುಂಬಗಳಿಗೆ ಶೌಚಾಲಯ, ವಿದ್ಯುತ್ ಮತ್ತು ನೀರಿನ ಸೌಲಭ್ಯವಿರುವ ಪಕ್ಕಾ ಮನೆ ಕಟ್ಟಲು ಆರ್ಥಿಕ ಸಹಾಯ ಸಿಗುತ್ತದೆ. ಪಟ್ಟಿ ಎಸ್‌ಇಸಿಸಿ ವಸತಿ ಮಾಹಿತಿಯಿಂದ ತಯಾರಾಗಿ ಗ್ರಾಮ ಸಭೆಯಿಂದ ಪರಿಶೀಲನೆಯಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಮೊದಲು ನಿಮ್ಮ ಕುಟುಂಬ ಪರಿಶೀಲಿತ ಪಟ್ಟಿಯಲ್ಲಿದೆಯೇ ಎಂದು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ಕೇಳಿ; ಇಲ್ಲದಿದ್ದರೆ ಸಮೀಕ್ಷೆಗೆ ಬೇಡಿಕೆ ಸಲ್ಲಿಸಿ. ಆಧಾರ್, ಜಾಬ್ ಕಾರ್ಡ್ ಅಥವಾ ಮನರೇಗಾ ಸಂಖ್ಯೆ, ಬ್ಯಾಂಕ್ ಖಾತೆ ಮತ್ತು ಭೂ ದಾಖಲೆ ಬೇಕು. ನಿರ್ಮಾಣದ ಪ್ರತಿ ಹಂತದ ಪರಿಶೀಲನೆಯ ನಂತರ ಹಣ ಕಂತುಗಳಲ್ಲಿ ಬರುತ್ತದೆ, ಆದ್ದರಿಂದ ಪ್ರತಿ ಹಂತದ ಫೋಟೋ ಬೇಕು. ಪ್ರಸ್ತುತ ವೆಚ್ಚ ಮತ್ತು ನಿಯಮಗಳನ್ನು ಪಿಎಂಎವೈ-ಜಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    },
    sources: ['PMAY-Gramin portal', 'Ministry of Rural Development'],
  },

  // ------------------------------------------------------------- scholarships
  {
    key: 'kb-scholarship-nsp',
    category: 'scholarships',
    tags: ['scholarship', 'nsp', 'national scholarship portal', 'apply', 'online', 'छात्रवृत्ति', 'स्कॉलरशिप', 'आवेदन', 'पोर्टल', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'ಅರ್ಜಿ', 'ಪೋರ್ಟಲ್'],
    question: {
      en: 'How do I apply for a scholarship on the National Scholarship Portal?',
      hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर छात्रवृत्ति के लिए कैसे आवेदन करें?',
      kn: 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?',
    },
    answer: {
      en: 'Register on the National Scholarship Portal with your Aadhaar, mobile number and bank account, then choose the scholarship you are eligible for — pre-matric, post-matric, minority, SC/ST or the state scheme. You will need the institute and course details, marksheet, income certificate, caste certificate where applicable, Aadhaar-linked bank account and a photograph; the institute must verify the application online. Apply well before the closing date, keep the application number, and check the portal for the "defective" or "rejected" status because a wrong bank or Aadhaar detail is the most common reason for rejection. Deadlines change every year, so confirm the current dates on the portal.',
      hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर आधार, मोबाइल नंबर और बैंक खाते से पंजीकरण करें, फिर वह छात्रवृत्ति चुनें जिसके आप पात्र हैं — प्री-मैट्रिक, पोस्ट-मैट्रिक, अल्पसंख्यक, अनुसूचित जाति/जनजाति या राज्य की योजना। संस्थान और कोर्स की जानकारी, अंकतालिका, आय प्रमाण पत्र, जाति प्रमाण पत्र (जहां लागू हो), आधार से जुड़ा बैंक खाता और फोटो चाहिए; संस्थान को ऑनलाइन सत्यापन करना होता है। अंतिम तारीख से काफी पहले आवेदन करें, आवेदन संख्या रखें, और पोर्टल पर "डिफेक्टिव" या "रिजेक्टेड" स्थिति देखें क्योंकि गलत बैंक या आधार जानकारी से आवेदन सबसे ज़्यादा रद्द होते हैं। तारीखें हर साल बदलती हैं, इसलिए वर्तमान तारीख पोर्टल पर जांचें।',
      kn: 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆಧಾರ್, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ನೋಂದಣಿ ಮಾಡಿ, ನಂತರ ನೀವು ಅರ್ಹರಾದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಆಯ್ಕೆ ಮಾಡಿ — ಪ್ರಿ-ಮೆಟ್ರಿಕ್, ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್, ಅಲ್ಪಸಂಖ್ಯಾತ, ಪರಿಶಿಷ್ಟ ಜಾತಿ/ಪಂಗಡ ಅಥವಾ ರಾಜ್ಯ ಯೋಜನೆ. ಸಂಸ್ಥೆ ಮತ್ತು ಕೋರ್ಸ್ ವಿವರ, ಅಂಕಪಟ್ಟಿ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ (ಅನ್ವಯಿಸಿದರೆ), ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಮತ್ತು ಫೋಟೋ ಬೇಕು; ಸಂಸ್ಥೆಯು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಬೇಕು. ಕೊನೆಯ ದಿನಾಂಕಕ್ಕಿಂತ ಚೆನ್ನಾಗಿ ಮುಂಚೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಅರ್ಜಿ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಳ್ಳಿ, ಮತ್ತು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ "ದೋಷಪೂರಿತ" ಅಥವಾ "ತಿರಸ್ಕೃತ" ಸ್ಥಿತಿ ನೋಡಿ, ಏಕೆಂದರೆ ತಪ್ಪು ಬ್ಯಾಂಕ್ ಅಥವಾ ಆಧಾರ್ ವಿವರವೇ ಅರ್ಜಿ ತಿರಸ್ಕಾರಕ್ಕೆ ಪ್ರಮುಖ ಕಾರಣ. ದಿನಾಂಕಗಳು ಪ್ರತಿ ವರ್ಷ ಬದಲಾಗುತ್ತವೆ, ಆದ್ದರಿಂದ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ದಿನಾಂಕ ಪರಿಶೀಲಿಸಿ.',
    },
    sources: ['National Scholarship Portal (scholarships.gov.in)', 'Ministry of Education'],
  },
  {
    key: 'kb-scholarship-prematric',
    category: 'scholarships',
    tags: ['pre matric', 'school', 'class 9', 'class 10', 'sc st', 'obc', 'छात्रवृत्ति', 'स्कूल', 'नौवीं', 'दसवीं', 'ಶಾಲೆ', 'ಒಂಬತ್ತನೇ ತರಗತಿ', 'ಹತ್ತನೇ ತರಗತಿ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ'],
    question: {
      en: 'Is there a scholarship for school students up to class ten?',
      hi: 'दसवीं तक के स्कूली छात्रों के लिए छात्रवृत्ति है क्या?',
      kn: 'ಹತ್ತನೇ ತರಗತಿವರೆಗಿನ ಶಾಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ ಇದೆಯೇ?',
    },
    answer: {
      en: 'Yes. Pre-matric scholarships are given to students of classes one to ten from SC, ST, OBC, minority and other eligible families, and some states give them to all girls. The scholarship usually covers a monthly maintenance amount, books and a one-time admission allowance, and is paid into an Aadhaar-linked bank account. Apply on the National Scholarship Portal or your state scholarship portal, get the school to verify it, and attach the income and caste certificates. There are income limits and attendance conditions, so ask the school teacher or headmaster about the exact rule for your state and the current last date.',
      hi: 'हां। प्री-मैट्रिक छात्रवृत्ति पहली से दसवीं कक्षा के अनुसूचित जाति, जनजाति, अन्य पिछड़ा वर्ग, अल्पसंख्यक और अन्य पात्र परिवारों के छात्रों को मिलती है, कुछ राज्यों में सभी छात्राओं को भी। इसमें आमतौर पर मासिक रखरखाव राशि, किताबें और एक बार का प्रवेश भत्ता शामिल होता है, जो आधार से जुड़े बैंक खाते में आता है। राष्ट्रीय छात्रवृत्ति पोर्टल या अपने राज्य के पोर्टल पर आवेदन करें, स्कूल से सत्यापन कराएं, और आय तथा जाति प्रमाण पत्र लगाएं। आय सीमा और उपस्थिति की शर्तें होती हैं, इसलिए स्कूल के शिक्षक या प्रधानाचार्य से अपने राज्य का सटीक नियम और वर्तमान अंतिम तारीख पूछें।',
      kn: 'ಹೌದು. ಪ್ರಿ-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನವು ಒಂದರಿಂದ ಹತ್ತನೇ ತರಗತಿಯ ಪರಿಶಿಷ್ಟ ಜಾತಿ, ಪಂಗಡ, ಇತರ ಹಿಂದುಳಿದ ವರ್ಗ, ಅಲ್ಪಸಂಖ್ಯಾತ ಮತ್ತು ಇತರ ಅರ್ಹ ಕುಟುಂಬಗಳ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸಿಗುತ್ತದೆ; ಕೆಲವು ರಾಜ್ಯಗಳಲ್ಲಿ ಎಲ್ಲಾ ಹುಡುಗಿಯರಿಗೂ ಸಿಗುತ್ತದೆ. ಇದರಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ ಮಾಸಿಕ ನಿರ್ವಹಣಾ ಹಣ, ಪುಸ್ತಕಗಳು ಮತ್ತು ಒಂದು ಬಾರಿಯ ಪ್ರವೇಶ ಭತ್ಯೆ ಇರುತ್ತದೆ, ಅದು ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬರುತ್ತದೆ. ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ಅಥವಾ ನಿಮ್ಮ ರಾಜ್ಯದ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಶಾಲೆಯಿಂದ ಪರಿಶೀಲನೆ ಮಾಡಿಸಿ, ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಲಗತ್ತಿಸಿ. ಆದಾಯ ಮಿತಿ ಮತ್ತು ಹಾಜರಾತಿ ಷರತ್ತುಗಳಿರುತ್ತವೆ, ಆದ್ದರಿಂದ ಶಾಲೆಯ ಶಿಕ್ಷಕರು ಅಥವಾ ಮುಖ್ಯೋಪಾಧ್ಯಾಯರನ್ನು ನಿಮ್ಮ ರಾಜ್ಯದ ನಿಖರ ನಿಯಮ ಮತ್ತು ಪ್ರಸ್ತುತ ಕೊನೆಯ ದಿನಾಂಕ ಕೇಳಿ.',
    },
    sources: ['National Scholarship Portal — pre-matric schemes', 'State education department'],
  },
  {
    key: 'kb-scholarship-postmatric',
    category: 'scholarships',
    tags: ['post matric', 'college', 'degree', 'hostel', 'tuition', 'पोस्ट मैट्रिक', 'कॉलेज', 'छात्रवृत्ति', 'हॉस्टल', 'ಕಾಲೇಜು', 'ಪದವಿ', 'ವಸತಿ ನಿಲಯ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ'],
    question: {
      en: 'How do I get a scholarship for college or ITI after class twelve?',
      hi: 'बारहवीं के बाद कॉलेज या आईटीआई के लिए छात्रवृत्ति कैसे मिलेगी?',
      kn: 'ಹನ್ನೆರಡನೇ ತರಗತಿಯ ನಂತರ ಕಾಲೇಜು ಅಥವಾ ಐಟಿಐಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ ಹೇಗೆ ಸಿಗುತ್ತದೆ?',
    },
    answer: {
      en: 'Post-matric scholarships cover college, ITI, polytechnic and professional courses for SC, ST, OBC, minority and other eligible students. They usually pay the course fee or a maintenance allowance, and some include hostel charges; the amount depends on the course and the state. Apply on the National Scholarship Portal after admission, upload the fee receipt, marksheets, income and caste certificates and the Aadhaar-linked bank account, and get the institute to verify it online. Keep the application number and check the status every week, because a small mistake in the bank account stops the payment. Ask the college scholarship section for the current last date.',
      hi: 'पोस्ट-मैट्रिक छात्रवृत्ति अनुसूचित जाति, जनजाति, अन्य पिछड़ा वर्ग, अल्पसंख्यक और अन्य पात्र छात्रों के कॉलेज, आईटीआई, पॉलिटेक्निक और व्यावसायिक कोर्स के लिए है। इसमें आमतौर पर कोर्स फीस या रखरखाव भत्ता मिलता है, कुछ में हॉस्टल का खर्च भी; राशि कोर्स और राज्य पर निर्भर है। प्रवेश के बाद राष्ट्रीय छात्रवृत्ति पोर्टल पर आवेदन करें, फीस रसीद, अंकतालिका, आय और जाति प्रमाण पत्र तथा आधार से जुड़ा बैंक खाता अपलोड करें, और संस्थान से ऑनलाइन सत्यापन कराएं। आवेदन संख्या रखें और हर हफ्ते स्थिति देखें, क्योंकि बैंक खाते की छोटी गलती से भुगतान रुक जाता है। वर्तमान अंतिम तारीख कॉलेज की छात्रवृत्ति शाखा से पूछें।',
      kn: 'ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನವು ಪರಿಶಿಷ್ಟ ಜಾತಿ, ಪಂಗಡ, ಇತರ ಹಿಂದುಳಿದ ವರ್ಗ, ಅಲ್ಪಸಂಖ್ಯಾತ ಮತ್ತು ಇತರ ಅರ್ಹ ವಿದ್ಯಾರ್ಥಿಗಳ ಕಾಲೇಜು, ಐಟಿಐ, ಪಾಲಿಟೆಕ್ನಿಕ್ ಮತ್ತು ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳಿಗೆ ಸಿಗುತ್ತದೆ. ಇದರಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ ಕೋರ್ಸ್ ಶುಲ್ಕ ಅಥವಾ ನಿರ್ವಹಣಾ ಭತ್ಯೆ ಸಿಗುತ್ತದೆ, ಕೆಲವಲ್ಲಿ ವಸತಿ ನಿಲಯದ ಖರ್ಚೂ ಸೇರುತ್ತದೆ; ಮೊತ್ತ ಕೋರ್ಸ್ ಮತ್ತು ರಾಜ್ಯವನ್ನು ಅವಲಂಬಿಸಿದೆ. ಪ್ರವೇಶದ ನಂತರ ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಶುಲ್ಕ ರಸೀದಿ, ಅಂಕಪಟ್ಟಿ, ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಹಾಗೂ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಮತ್ತು ಸಂಸ್ಥೆಯಿಂದ ಆನ್‌ಲೈನ್ ಪರಿಶೀಲನೆ ಮಾಡಿಸಿ. ಅರ್ಜಿ ಸಂಖ್ಯೆ ಇಟ್ಟುಕೊಂಡು ಪ್ರತಿ ವಾರ ಸ್ಥಿತಿ ನೋಡಿ, ಏಕೆಂದರೆ ಬ್ಯಾಂಕ್ ಖಾತೆಯ ಸಣ್ಣ ತಪ್ಪಿನಿಂದ ಪಾವತಿ ನಿಲ್ಲುತ್ತದೆ. ಪ್ರಸ್ತುತ ಕೊನೆಯ ದಿನಾಂಕವನ್ನು ಕಾಲೇಜಿನ ವಿದ್ಯಾರ್ಥಿವೇತನ ವಿಭಾಗದಲ್ಲಿ ಕೇಳಿ.',
    },
    sources: ['National Scholarship Portal — post-matric schemes', 'Ministry of Social Justice and Empowerment'],
  },
  {
    key: 'kb-scholarship-girls',
    category: 'scholarships',
    tags: ['girl', 'girls', 'daughter', 'female student', 'ladki', 'बेटी', 'छात्रा', 'लड़की', 'ಹುಡುಗಿ', 'ಮಗಳು', 'ವಿದ್ಯಾರ್ಥಿನಿ'],
    question: {
      en: 'What scholarship can a girl student get for her studies?',
      hi: 'लड़की की पढ़ाई के लिए कौन सी छात्रवृत्ति मिल सकती है?',
      kn: 'ಹುಡುಗಿಯ ಓದಿಗೆ ಯಾವ ವಿದ್ಯಾರ್ಥಿವೇತನ ಸಿಗಬಹುದು?',
    },
    answer: {
      en: 'Girl students can get the pre-matric and post-matric scholarships, the minority girl scholarship, and in many states a separate girl-child scholarship with a higher amount. Some schemes also pay for a bicycle, hostel or a lump sum on passing each class. Apply on the National Scholarship Portal or the state portal, and ask the school or college and the local women and child development office which girl-specific scheme is open now. Documents are the same as other scholarships — Aadhaar, income certificate, marksheet, Aadhaar-linked bank account in the girl\'s own name. Open a bank account in her name early, because payments cannot go to the father\'s account.',
      hi: 'छात्राओं को प्री-मैट्रिक और पोस्ट-मैट्रिक छात्रवृत्ति, अल्पसंख्यक छात्रा छात्रवृत्ति, और कई राज्यों में अधिक राशि वाली अलग बालिका छात्रवृत्ति मिल सकती है। कुछ योजनाओं में साइकिल, हॉस्टल या हर कक्षा पास करने पर एकमुश्त राशि भी मिलती है। राष्ट्रीय छात्रवृत्ति पोर्टल या राज्य के पोर्टल पर आवेदन करें, और स्कूल या कॉलेज तथा स्थानीय महिला एवं बाल विकास कार्यालय से पूछें कि अभी कौन सी बालिका योजना खुली है। कागज़ वही हैं — आधार, आय प्रमाण पत्र, अंकतालिका, और छात्रा के अपने नाम का आधार से जुड़ा बैंक खाता। उसके नाम खाता जल्दी खुलवाएं, क्योंकि भुगतान पिता के खाते में नहीं जा सकता।',
      kn: 'ವಿದ್ಯಾರ್ಥಿನಿಯರಿಗೆ ಪ್ರಿ-ಮೆಟ್ರಿಕ್ ಮತ್ತು ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಅಲ್ಪಸಂಖ್ಯಾತ ಬಾಲಕಿಯರ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಮತ್ತು ಅನೇಕ ರಾಜ್ಯಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಮೊತ್ತದ ಪ್ರತ್ಯೇಕ ಬಾಲಕಿಯರ ವಿದ್ಯಾರ್ಥಿವೇತನ ಸಿಗಬಹುದು. ಕೆಲವು ಯೋಜನೆಗಳಲ್ಲಿ ಸೈಕಲ್, ವಸತಿ ನಿಲಯ ಅಥವಾ ಪ್ರತಿ ತರಗತಿ ಉತ್ತೀರ್ಣರಾದಾಗ ಒಂದು ಬಾರಿಯ ಹಣವೂ ಸಿಗುತ್ತದೆ. ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ಅಥವಾ ರಾಜ್ಯದ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಮತ್ತು ಶಾಲೆ ಅಥವಾ ಕಾಲೇಜು ಹಾಗೂ ಸ್ಥಳೀಯ ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಕಚೇರಿಯಲ್ಲಿ ಈಗ ಯಾವ ಬಾಲಕಿಯರ ಯೋಜನೆ ತೆರೆದಿದೆ ಎಂದು ಕೇಳಿ. ದಾಖಲೆಗಳು ಬೇರೆ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳಂತೆಯೇ — ಆಧಾರ್, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಅಂಕಪಟ್ಟಿ, ಮತ್ತು ಹುಡುಗಿಯ ಹೆಸರಿನಲ್ಲೇ ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ. ಅವಳ ಹೆಸರಿನಲ್ಲಿ ಖಾತೆ ಬೇಗ ತೆರೆಯಿರಿ, ಏಕೆಂದರೆ ಹಣ ತಂದೆಯ ಖಾತೆಗೆ ಹೋಗುವುದಿಲ್ಲ.',
    },
    sources: ['National Scholarship Portal', 'State women and child development department'],
  },
  {
    key: 'kb-scholarship-minority',
    category: 'scholarships',
    tags: ['minority', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi', 'अल्पसंख्यक', 'मुस्लिम', 'ईसाई', 'ಅಲ್ಪಸಂಖ್ಯಾತ', 'ಮುಸ್ಲಿಂ', 'ಕ್ರಿಶ್ಚಿಯನ್'],
    question: {
      en: 'Which scholarships are available for minority students?',
      hi: 'अल्पसंख्यक छात्रों के लिए कौन सी छात्रवृत्तियां हैं?',
      kn: 'ಅಲ್ಪಸಂಖ್ಯಾತ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಯಾವ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳಿವೆ?',
    },
    answer: {
      en: 'Minority students — Muslim, Christian, Sikh, Buddhist, Jain and Parsi — can apply for the pre-matric and post-matric minority scholarships, and for merit-cum-means scholarships for professional courses. Some schemes are for girls only. Applications go through the National Scholarship Portal and need a minority community self-declaration or certificate, income certificate, marksheet and an Aadhaar-linked bank account; the institute verifies online. There are income limits and a minimum mark requirement in some schemes. Confirm the current schemes and last dates on the portal, and ask the school or college minority cell for help with the form.',
      hi: 'अल्पसंख्यक छात्र — मुस्लिम, ईसाई, सिख, बौद्ध, जैन और पारसी — प्री-मैट्रिक और पोस्ट-मैट्रिक अल्पसंख्यक छात्रवृत्ति तथा व्यावसायिक कोर्स के लिए मेरिट-कम-मीन्स छात्रवृत्ति के लिए आवेदन कर सकते हैं। कुछ योजनाएं केवल छात्राओं के लिए हैं। आवेदन राष्ट्रीय छात्रवृत्ति पोर्टल से होते हैं और इसमें अल्पसंख्यक समुदाय का स्वघोषणा पत्र या प्रमाण पत्र, आय प्रमाण पत्र, अंकतालिका और आधार से जुड़ा बैंक खाता चाहिए; संस्थान ऑनलाइन सत्यापन करता है। कुछ योजनाओं में आय सीमा और न्यूनतम अंक की शर्त है। वर्तमान योजनाएं और अंतिम तारीखें पोर्टल पर जांचें, और फॉर्म भरने में स्कूल या कॉलेज के अल्पसंख्यक प्रकोष्ठ से मदद लें।',
      kn: 'ಅಲ್ಪಸಂಖ್ಯಾತ ವಿದ್ಯಾರ್ಥಿಗಳು — ಮುಸ್ಲಿಂ, ಕ್ರಿಶ್ಚಿಯನ್, ಸಿಖ್, ಬೌದ್ಧ, ಜೈನ ಮತ್ತು ಪಾರ್ಸಿ — ಪ್ರಿ-ಮೆಟ್ರಿಕ್ ಮತ್ತು ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ಅಲ್ಪಸಂಖ್ಯಾತ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಹಾಗೂ ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳಿಗೆ ಮೆರಿಟ್-ಕಮ್-ಮೀನ್ಸ್ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ಕೆಲವು ಯೋಜನೆಗಳು ಹುಡುಗಿಯರಿಗೆ ಮಾತ್ರ. ಅರ್ಜಿಗಳು ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ಮೂಲಕ ಹೋಗುತ್ತವೆ ಮತ್ತು ಅಲ್ಪಸಂಖ್ಯಾತ ಸಮುದಾಯದ ಸ್ವಯಂ ಘೋಷಣೆ ಅಥವಾ ಪ್ರಮಾಣಪತ್ರ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ, ಅಂಕಪಟ್ಟಿ ಮತ್ತು ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಬೇಕು; ಸಂಸ್ಥೆಯು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸುತ್ತದೆ. ಕೆಲವು ಯೋಜನೆಗಳಲ್ಲಿ ಆದಾಯ ಮಿತಿ ಮತ್ತು ಕನಿಷ್ಠ ಅಂಕಗಳ ಷರತ್ತು ಇರುತ್ತದೆ. ಪ್ರಸ್ತುತ ಯೋಜನೆಗಳು ಮತ್ತು ಕೊನೆಯ ದಿನಾಂಕಗಳನ್ನು ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಮತ್ತು ಅರ್ಜಿ ತುಂಬಲು ಶಾಲೆ ಅಥವಾ ಕಾಲೇಜಿನ ಅಲ್ಪಸಂಖ್ಯಾತ ವಿಭಾಗದ ಸಹಾಯ ಪಡೆಯಿರಿ.',
    },
    sources: ['National Scholarship Portal — minority schemes', 'Ministry of Minority Affairs'],
  },
  {
    key: 'kb-scholarship-deadline',
    category: 'scholarships',
    tags: ['deadline', 'last date', 'renewal', 'status', 'rejected', 'defective', 'अंतिम तारीख', 'नवीनीकरण', 'स्थिति', 'रद्द', 'ಕೊನೆಯ ದಿನಾಂಕ', 'ನವೀಕರಣ', 'ಸ್ಥಿತಿ', 'ತಿರಸ್ಕೃತ'],
    question: {
      en: 'My scholarship application is pending or rejected. What should I do?',
      hi: 'मेरी छात्रवृत्ति का आवेदन लंबित या रद्द है। क्या करना चाहिए?',
      kn: 'ನನ್ನ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿ ಬಾಕಿ ಇದೆ ಅಥವಾ ತಿರಸ್ಕೃತವಾಗಿದೆ. ಏನು ಮಾಡಬೇಕು?',
    },
    answer: {
      en: 'Log in to the National Scholarship Portal and open your application to see the exact reason — "defective" means the institute or the state has sent it back for a correction, "rejected" means a rule was not met. The most common reasons are a bank account that is not linked to Aadhaar, a name or date of birth that does not match Aadhaar, a missing income or caste certificate, or an expired certificate. Correct it, resubmit before the closing date and ask the institute to verify again. If money is still not received after approval, check the bank account seeding with the branch and complain through the portal grievance option or the state scholarship helpline.',
      hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल में लॉगिन करें और आवेदन खोलकर सटीक कारण देखें — "डिफेक्टिव" का मतलब है कि संस्थान या राज्य ने सुधार के लिए लौटाया है, "रिजेक्टेड" का मतलब कोई नियम पूरा नहीं हुआ। सबसे आम कारण हैं आधार से न जुड़ा बैंक खाता, आधार से न मिलता नाम या जन्म तिथि, गायब आय या जाति प्रमाण पत्र, या समय-सीमा पार कर चुका प्रमाण पत्र। सुधार करें, अंतिम तारीख से पहले फिर जमा करें और संस्थान से दोबारा सत्यापन कराएं। मंजूरी के बाद भी पैसा न आए तो बैंक शाखा में खाते का आधार सीडिंग जांचें और पोर्टल की शिकायत या राज्य की छात्रवृत्ति हेल्पलाइन पर शिकायत करें।',
      kn: 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ಗೆ ಲಾಗಿನ್ ಆಗಿ ಅರ್ಜಿ ತೆರೆದು ನಿಖರ ಕಾರಣ ನೋಡಿ — "ದೋಷಪೂರಿತ" ಎಂದರೆ ಸಂಸ್ಥೆ ಅಥವಾ ರಾಜ್ಯವು ಸರಿಪಡಿಸಲು ಹಿಂತಿರುಗಿಸಿದೆ, "ತಿರಸ್ಕೃತ" ಎಂದರೆ ಯಾವುದೋ ನಿಯಮ ಪಾಲಿಸಿಲ್ಲ. ಸಾಮಾನ್ಯ ಕಾರಣಗಳು ಆಧಾರ್‌ಗೆ ಜೋಡಣೆಯಾಗದ ಬ್ಯಾಂಕ್ ಖಾತೆ, ಆಧಾರ್‌ಗೆ ಹೊಂದದ ಹೆಸರು ಅಥವಾ ಹುಟ್ಟಿದ ದಿನಾಂಕ, ಇಲ್ಲದ ಆದಾಯ ಅಥವಾ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ, ಅಥವಾ ಅವಧಿ ಮುಗಿದ ಪ್ರಮಾಣಪತ್ರ. ಸರಿಪಡಿಸಿ, ಕೊನೆಯ ದಿನಾಂಕಕ್ಕಿಂತ ಮೊದಲು ಮತ್ತೆ ಸಲ್ಲಿಸಿ ಮತ್ತು ಸಂಸ್ಥೆಯಿಂದ ಪುನಃ ಪರಿಶೀಲನೆ ಮಾಡಿಸಿ. ಅನುಮೋದನೆಯ ನಂತರವೂ ಹಣ ಬಾರದಿದ್ದರೆ ಬ್ಯಾಂಕ್ ಶಾಖೆಯಲ್ಲಿ ಖಾತೆಯ ಆಧಾರ್ ಜೋಡಣೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪೋರ್ಟಲ್‌ನ ದೂರು ಅಥವಾ ರಾಜ್ಯದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಸಹಾಯವಾಣಿಗೆ ದೂರು ನೀಡಿ.',
    },
    sources: ['National Scholarship Portal grievance module', 'Ministry of Education scholarship helpdesk'],
  },
];
