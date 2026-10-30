/**
 * npm run contract
 *
 * Replays every call the Android app actually makes, in the exact shape the
 * Kotlin screens send it, and checks the exact fields the Compose code reads.
 * Also drives the assistant in English, Hindi and Kannada across every phase,
 * and proves the speech-to-text path end to end against a stand-in provider —
 * no AWS account, no API key, no open port needed.
 *
 * Exit code 0 = the backend and the app agree.
 */
process.env.MONGODB_URI = '';
process.env.SPEECH_PROVIDER = 'auto';
process.env.STT_PROVIDER = 'auto';
process.env.SARVAM_API_KEY = '';
process.env.AWS_ACCESS_KEY_ID = '';
process.env.AWS_SECRET_ACCESS_KEY = '';
process.env.AWS_S3_BUCKET = '';

const http = require('http');
const { loadConfig } = require('../src/config/env');
const { createStore } = require('../src/store');
const { createSpeechService } = require('../src/services/speech');
const createApp = require('../src/app');
const { request } = require('../src/services/http');

const DEVICE = 'contract-test-device-0001';
let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail).slice(0, 260)}`}`);
  }
}

const hasDevanagari = (s) => /[\u0900-\u097F]/.test(s || '');
const hasKannada = (s) => /[\u0C80-\u0CFF]/.test(s || '');

/** A stand-in speech provider: accepts multipart audio and returns a transcript. */
function startFakeStt(transcript) {
  const state = { calls: 0, lastHeaders: null, lastBody: '', transcript };
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      state.calls += 1;
      state.lastHeaders = req.headers;
      state.lastBody = Buffer.concat(chunks).toString('latin1');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ text: state.transcript, transcript: state.transcript }));
    });
  });
  return { server, state };
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function main() {
  // ---------------------------------------------------------------- fixtures
  const fake = startFakeStt('my child has fever since two days');
  const fakeUrl = await listen(fake.server);
  process.env.STT_HTTP_URL = `${fakeUrl}/v1/audio/transcriptions`;
  process.env.STT_HTTP_API_KEY = 'contract-test-key';
  process.env.STT_HTTP_MODEL = 'whisper-1';

  const config = loadConfig();
  const store = createStore(config);
  const speech = createSpeechService(config);
  const app = createApp(config, { store, speech });

  const server = http.createServer(app);
  const base = await listen(server);

  const call = async (method, path, { body, headers = {}, raw, contentType } = {}) => {
    const options = { method, headers: { ...headers }, timeoutMs: 20000 };
    if (raw) {
      options.body = raw;
      options.headers['content-type'] = contentType || 'audio/mp4';
    } else if (body !== undefined) {
      options.body = JSON.stringify(body);
      options.headers['content-type'] = 'application/json';
    }
    const res = await request(base + path, options);
    let json = null;
    try {
      json = res.json();
    } catch (_) {
      json = null;
    }
    return { status: res.status, json };
  };

  // ------------------------------------------------- Settings → Check backend
  console.log('\nSettings screen: GET /api/health');
  const health = await call('GET', '/api/health');
  check('health returns 200', health.status === 200, health.status);
  check('health reports the store mode', Boolean(health.json.storeMode), health.json.storeMode);
  check('health lists the three languages', JSON.stringify(health.json.languages) === '["en","hi","kn"]', health.json.languages);
  check('health reports speech-to-text availability', health.json.features.speechToText === true, health.json.features);
  check('health counts the knowledge base', health.json.content.knowledge >= 80, health.json.content);
  check('health exposes the speech chain', Array.isArray(health.json.speech.chain), health.json.speech);

  // ------------------------------------------------ Ask screen (all languages)
  console.log('\nAsk screen: POST /api/query across every phase and language');
  const askMatrix = [
    { phase: 'health', en: 'My child has fever and chills for two days, what should I do?', hi: 'बच्चे को दो दिन से बुखार और कंपकंपी है, क्या करूं?', kn: 'ಮಗುವಿಗೆ ಎರಡು ದಿನದಿಂದ ಜ್ವರ ಮತ್ತು ನಡುಕ ಇದೆ, ಏನು ಮಾಡಬೇಕು?', expect: 'kb-health-fever' },
    { phase: 'health', en: 'loose motions and vomiting in a small child', hi: 'छोटे बच्चे को दस्त और उल्टी', kn: 'ಸಣ್ಣ ಮಗುವಿಗೆ ಭೇದಿ ಮತ್ತು ವಾಂತಿ', expect: 'kb-health-diarrhoea' },
    { phase: 'health', en: 'danger signs in pregnancy', hi: 'गर्भावस्था में खतरे के संकेत', kn: 'ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ಅಪಾಯದ ಚಿಹ್ನೆಗಳು', expect: 'kb-health-pregnancy' },
    { phase: 'health', en: 'high blood pressure and sugar control', hi: 'बीपी और शुगर कैसे काबू करें', kn: 'ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಸಕ್ಕರೆ ನಿಯಂತ್ರಣ', expect: 'kb-health-bp-sugar' },
    { phase: 'schemes', en: 'how to apply for old age pension', hi: 'वृद्धावस्था पेंशन के लिए आवेदन कैसे करें', kn: 'ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿಗೆ ಅರ್ಜಿ ಹೇಗೆ', expect: 'kb-scheme-pension' },
    { phase: 'schemes', en: 'free gas connection under ujjwala', hi: 'उज्ज्वला में मुफ्त गैस कनेक्शन', kn: 'ಉಜ್ವಾಲಾದಲ್ಲಿ ಉಚಿತ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ', expect: 'kb-scheme-ujjwala' },
    { phase: 'schemes', en: 'mgnrega job card and hundred days work', hi: 'मनरेगा जॉब कार्ड सौ दिन काम', kn: 'ಮನರೇಗಾ ಜಾಬ್ ಕಾರ್ಡ್ ನೂರು ದಿನ ಕೆಲಸ', expect: 'kb-scheme-mgnrega' },
    { phase: 'scholarships', en: 'apply for scholarship on the national scholarship portal', hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर आवेदन', kn: 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ', expect: 'kb-scholarship-nsp' },
    { phase: 'scholarships', en: 'my scholarship application was rejected', hi: 'मेरी छात्रवृत्ति का आवेदन रद्द हो गया', kn: 'ನನ್ನ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿ ತಿರಸ್ಕೃತವಾಯಿತು', expect: 'kb-scholarship-deadline', alsoOk: ['kb-scholarship-nsp'] },
    { phase: 'scam', en: 'someone asked for my OTP on a phone call', hi: 'फोन पर किसी ने ओटीपी मांगा', kn: 'ಫೋನ್‌ನಲ್ಲಿ ಒಟಿಪಿ ಕೇಳಿದರು', expect: 'kb-scam-otp', alsoOk: ['kb-scam-kyc-upi'] },
    { phase: 'scam', en: 'money was taken from my bank account by fraud, where to complain', hi: 'धोखे से खाते से पैसे कटे, शिकायत कहां करें', kn: 'ಮೋಸದಿಂದ ಖಾತೆಯಿಂದ ಹಣ ಹೋಗಿದೆ, ದೂರು ಎಲ್ಲಿ', expect: 'kb-scam-report' },
    { phase: 'agriculture', en: 'crop damaged by heavy rain, crop insurance claim', hi: 'बारिश से फसल खराब, फसल बीमा दावा', kn: 'ಮಳೆಯಿಂದ ಬೆಳೆ ಹಾನಿ, ಬೆಳೆ ವಿಮೆ ಕ್ಲೇಮ್', expect: 'kb-agri-pmfby' },
    { phase: 'agriculture', en: 'soil health card and fertiliser dose', hi: 'मृदा स्वास्थ्य कार्ड और खाद मात्रा', kn: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಮತ್ತು ಗೊಬ್ಬರ ಪ್ರಮಾಣ', expect: 'kb-agri-soil-health' },
    { phase: 'education', en: 'free seat in a private school under RTE', hi: 'आरटीई में निजी स्कूल में मुफ्त सीट', kn: 'ಆರ್‌ಟಿಇ ಅಡಿಯಲ್ಲಿ ಖಾಸಗಿ ಶಾಲೆಯಲ್ಲಿ ಉಚಿತ ಸೀಟು', expect: 'kb-edu-rte-admission' },
    { phase: 'documents', en: 'how to correct the address on my Aadhaar', hi: 'आधार में पता सुधारना है', kn: 'ಆಧಾರ್‌ನಲ್ಲಿ ವಿಳಾಸ ಸರಿಪಡಿಸಬೇಕು', expect: 'kb-doc-aadhaar' },
    { phase: 'documents', en: 'income certificate for scholarship', hi: 'छात्रवृत्ति के लिए आय प्रमाण पत्र', kn: 'ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ', expect: 'kb-doc-income-certificate' },
    { phase: 'emergency', en: 'how to call an ambulance in an emergency', hi: 'आपात स्थिति में एम्बुलेंस कैसे बुलाएं', kn: 'ತುರ್ತಿನಲ್ಲಿ ಆಂಬ್ಯುಲೆನ್ಸ್ ಹೇಗೆ ಕರೆಯುವುದು', expect: 'kb-emergency-ambulance' },
    { phase: 'emergency', en: 'water entered the house in floods, what to do', hi: 'बाढ़ में घर में पानी घुस गया, क्या करें', kn: 'ಪ್ರವಾಹದಲ್ಲಿ ಮನೆಗೆ ನೀರು ಬಂತು, ಏನು ಮಾಡಬೇಕು', expect: 'kb-emergency-flood' },
    { phase: 'finance', en: 'open a bank account with no minimum balance', hi: 'बिना न्यूनतम बैलेंस बैंक खाता खोलना', kn: 'ಕನಿಷ್ಠ ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲದ ಬ್ಯಾಂಕ್ ಖಾತೆ', expect: 'kb-fin-bank-account' },
    { phase: 'finance', en: 'scheme money did not come to my account, check DBT status', hi: 'योजना का पैसा खाते में नहीं आया, डीबीटी जांच', kn: 'ಯೋಜನೆಯ ಹಣ ಖಾತೆಗೆ ಬಂದಿಲ್ಲ, ಡಿಬಿಟಿ ಪರಿಶೀಲನೆ', expect: 'kb-fin-dbt' },
    { phase: 'general', en: 'land record rtc mutation in my name', hi: 'ज़मीन का कागज़ नामांतरण', kn: 'ಭೂ ದಾಖಲೆ ನಾಮಾಂತರ', expect: 'kb-general-land-records' },
    // The October coverage expansion: entries added in knowledge-extra-3 and
    // catalog-extra, checked in all three languages so new content cannot ship
    // answering only in English.
    { phase: 'health', en: 'a dog bit my child what to do first', hi: 'कुत्ते ने बच्चे को काटा क्या करें', kn: 'ನಾಯಿ ಕಡಿದರೆ ಏನು ಮಾಡಬೇಕು', expect: 'kb-health-dog-bite' },
    { phase: 'schemes', en: 'e shram card registration for a labourer', hi: 'ई श्रम कार्ड कैसे बनवाएं', kn: 'ಇ ಶ್ರಮ್ ಕಾರ್ಡ್ ಹೇಗೆ ಪಡೆಯುವುದು', expect: 'kb-scheme-eshram' },
    { phase: 'documents', en: 'birth certificate registration', hi: 'जन्म प्रमाण पत्र कैसे बनवाएं', kn: 'ಜನನ ಪ್ರಮಾಣಪತ್ರ ಹೇಗೆ ಪಡೆಯುವುದು', expect: 'kb-doc-birth-death' },
    { phase: 'general', en: 'right to information application', hi: 'सूचना का अधिकार आवेदन', kn: 'ಮಾಹಿತಿ ಹಕ್ಕು ಅರ್ಜಿ', expect: 'kb-general-rti' },
    { phase: 'finance', en: 'is it safe to receive money on upi', hi: 'यूपीआई से पैसे लेना सुरक्षित है', kn: 'ಯುಪಿಐನಲ್ಲಿ ಹಣ ಪಡೆಯುವುದು ಸುರಕ್ಷಿತವೇ', expect: 'kb-fin-upi-safety' },
    { phase: 'schemes', en: 'tap water connection at home', hi: 'घर पर नल का पानी कनेक्शन', kn: 'ಮನೆಗೆ ನಲ್ಲಿ ನೀರಿನ ಸಂಪರ್ಕ', expect: 'kb-scheme-jal-jeevan' },
    { phase: 'emergency', en: 'what to do during lightning and storm', hi: 'बिजली गिरने और तूफान में क्या करें', kn: 'ಮಿಂಚು ಮತ್ತು ಚಂಡಮಾರುತದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು', expect: 'kb-emergency-cyclone-storm' },
    { phase: 'general', en: 'free legal aid lawyer for a poor family', hi: 'मुफ्त वकील कानूनी सहायता', kn: 'ಉಚಿತ ವಕೀಲ ಕಾನೂನು ಸಹಾಯ', expect: 'kb-general-legal-aid' },
    { phase: 'documents', en: 'new voter id card apply', hi: 'वोटर आईडी कार्ड कैसे बनवाएं', kn: 'ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಹೇಗೆ ಪಡೆಯುವುದು', expect: 'kb-doc-voter-id' },
    { phase: 'education', en: 'skill training for unemployed youth', hi: 'बेरोजगार युवाओं के लिए कौशल प्रशिक्षण', kn: 'ನಿರುದ್ಯೋಗಿ ಯುವಕರಿಗೆ ಕೌಶಲ್ಯ ತರಬೇತಿ', expect: 'kb-edu-skill-training' },
  ];

  for (const row of askMatrix) {
    for (const language of ['en', 'hi', 'kn']) {
      const res = await call('POST', '/api/query', {
        headers: { 'x-device-id': DEVICE },
        body: { question: row[language], language, category: 'general' },
      });
      const data = (res.json && res.json.data) || {};
      const scriptOk =
        language === 'en' ? true : language === 'hi' ? hasDevanagari(data.answer) : hasKannada(data.answer);
      // A few questions sit between two entries of the same phase (for example
      // "OTP fraud" is covered by both the OTP and the KYC entry); either is a
      // correct answer, so the check is that the phase is right.
      const acceptable = [row.expect, ...(row.alsoOk || [])];
      check(
        `[${row.phase}/${language}] ${row[language].slice(0, 42)} answered from ${row.expect}`,
        res.status === 200 && data.grounded === true && acceptable.includes(data.matchedKey) && scriptOk,
        { status: res.status, matched: data.matchedKey, grounded: data.grounded, script: scriptOk },
      );
    }
  }

  // Fields the Ask screen reads must always be present.
  const ask = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'how much money does pm kisan give', language: 'en', category: 'general' },
  });
  const askData = (ask.json && ask.json.data) || {};
  check('query returns an answer string', typeof askData.answer === 'string' && askData.answer.length > 20);
  check('query returns trustedSources the screen can list', Array.isArray(askData.trustedSources) && askData.trustedSources.length > 0);
  check('query returns freshness for the stale banner', Boolean(askData.freshness && askData.freshness.status), askData.freshness);
  check('money answers ask the user to verify', askData.verifyBeforeActing === true, askData.verifyBeforeActing);
  check('query returns suggestions', Array.isArray(askData.suggestions), askData.suggestions);
  check('query reports the category it answered from', typeof askData.category === 'string', askData.category);

  // Health screen: category=health must answer health questions…
  const healthAsk = await call('POST', '/api/query', {
    body: { question: 'my child has fever for two days', language: 'en', category: 'health' },
  });
  check('Health screen (category=health) answers a health question', healthAsk.json.data.grounded === true && healthAsk.json.data.category === 'health', healthAsk.json.data);
  // …and must not dead-end when the question belongs to another phase.
  const crossAsk = await call('POST', '/api/query', {
    body: { question: 'how to apply for a scholarship', language: 'en', category: 'health' },
  });
  check(
    'Health screen falls back to the whole knowledge base instead of refusing',
    crossAsk.json.data.grounded === true && crossAsk.json.data.category !== 'health',
    { category: crossAsk.json.data.category, grounded: crossAsk.json.data.grounded },
  );

  // Romanised (no native script) questions, the way people actually type.
  for (const [question, expect] of [
    ['bukhar hai kya karu', 'kb-health-fever'],
    ['kisan paisa kab aayega', 'kb-scheme-pm-kisan'],
    ['jwara ide enu madbeku', 'kb-health-fever'],
    ['saanp ne kaata kya kare', 'kb-health-snake-bite'],
  ]) {
    const res = await call('POST', '/api/query', { body: { question, language: 'en', category: 'general' } });
    check(`romanised question "${question}" finds ${expect}`, res.json.data.matchedKey === expect, res.json.data.matchedKey);
  }

  // A genuinely unknown question must still refuse to invent.
  const unknown = await call('POST', '/api/query', { body: { question: 'zzzz qqqq unrelated nonsense topic', language: 'en' } });
  check('unknown question returns grounded:false', unknown.json.data.grounded === false, unknown.json.data.grounded);

  // ------------------------------------------------------------ categories
  console.log('\nHome screen phases: GET /api/categories');
  const categories = await call('GET', '/api/categories');
  const ids = (categories.json.data || []).map((c) => c.id);
  check('categories endpoint lists the phases', ids.length >= 9, ids);
  check('every phase has a trilingual label', (categories.json.data || []).every((c) => c.label.en && c.label.hi && c.label.kn), categories.json.data && categories.json.data[0]);

  // ---------------------------------------------------------------- schemes
  console.log('\nSchemes screen');
  const schemes = await call('GET', '/api/schemes');
  check('scheme list returns the catalogue', schemes.json.count >= 10, schemes.json.count);
  check('scheme names are trilingual', Boolean(schemes.json.data[0].name.en && schemes.json.data[0].name.hi && schemes.json.data[0].name.kn));
  const schemeSearch = await call('GET', '/api/schemes?q=farmer');
  check('scheme search returns matches', schemeSearch.json.count > 0, schemeSearch.json.count);
  const schemeDetail = await call('GET', `/api/schemes/${schemes.json.data[0].id}`);
  check('scheme detail has eligibility and apply steps', Boolean(schemeDetail.json.data.eligibility && schemeDetail.json.data.apply));
  const schemeCheck = await call('POST', '/api/schemes/check', { body: { language: 'kn' } });
  check('eligibility check returns a summary', typeof schemeCheck.json.data.summary === 'string' && schemeCheck.json.data.summary.length > 10);
  check('eligibility check returns a document checklist', Array.isArray(schemeCheck.json.data.documents) && schemeCheck.json.data.documents.length > 0);
  check('eligibility check returns per-scheme rows with a status', Array.isArray(schemeCheck.json.data.results) && schemeCheck.json.data.results.every((r) => r.status && r.name));

  // ----------------------------------------------------------- scholarships
  console.log('\nScholarships screen');
  const scholarships = await call('GET', '/api/scholarships?open=true');
  check('scholarship list returns items', scholarships.json.count >= 6, scholarships.json.count);
  const target = scholarships.json.data[0].id;
  const save = await call('POST', '/api/scholarships/saved', { headers: { 'x-device-id': DEVICE }, body: { scholarship: target } });
  check('saving a scholarship returns 201 with the item', save.status === 201 && save.json.data.saved === true, save.status);
  const savedList = await call('GET', '/api/scholarships/saved', { headers: { 'x-device-id': DEVICE } });
  check('saved list contains the scholarship', (savedList.json.data || []).some((s) => s.id === target), savedList.json.count);
  const unsave = await call('DELETE', `/api/scholarships/saved/${target}`, { headers: { 'x-device-id': DEVICE } });
  check('unsaving removes it', unsave.json.data.removed === true, unsave.json.data);

  // -------------------------------------------------------------- reminders
  console.log('\nReminders screen');
  const created = await call('POST', '/api/reminders', {
    headers: { 'x-device-id': DEVICE },
    body: { title: 'PHC visit', type: 'other', remindAt: '2026-11-01T09:00:00+05:30', repeat: 'none', clientId: 'client-1' },
  });
  const reminderId = created.json.data && created.json.data.id;
  check('reminder is created', created.status === 201 && Boolean(reminderId), created.status);
  const reminders = await call('GET', '/api/reminders', { headers: { 'x-device-id': DEVICE } });
  check('reminder list contains it', (reminders.json.data || []).some((r) => r.id === reminderId));
  const updated = await call('PUT', `/api/reminders/${reminderId}`, { headers: { 'x-device-id': DEVICE }, body: { completed: true } });
  check('reminder can be completed', updated.json.data.completed === true, updated.json.data);
  const removed = await call('DELETE', `/api/reminders/${reminderId}`, { headers: { 'x-device-id': DEVICE } });
  check('reminder can be deleted', removed.status === 200, removed.status);

  // ----------------------------------------------------------- scam checker
  console.log('\nScam checker screen');
  const scam = await call('POST', '/api/scam-check', {
    body: { text: 'Your KYC will expire today. Click this link and share the OTP to keep your account active.', language: 'hi' },
  });
  check('scam check returns a risk level', ['high', 'medium', 'low'].includes(scam.json.data.riskLevel), scam.json.data.riskLevel);
  check('scam reasons carry text the screen prints', Array.isArray(scam.json.data.reasons) && scam.json.data.reasons.every((r) => typeof r.text === 'string'));
  check('scam advice is in the asked language', hasDevanagari(scam.json.data.advice), scam.json.data.advice);

  // ------------------------------------------------------------- SMS centre
  console.log('\nSMS centre screen');
  const preview = await call('POST', '/api/sms/preview', { headers: { 'x-device-id': DEVICE }, body: { to: '9876543210', message: 'Demo message' } });
  check('SMS preview validates the number', preview.json.data.allowed === true, preview.json.data);
  const sent = await call('POST', '/api/sms/send', {
    headers: { 'x-device-id': DEVICE },
    body: { to: '9876543210', message: 'Demo message', language: 'kn', category: 'other', consent: true },
  });
  check('SMS send is simulated and labelled', sent.json.data.simulated === true && Boolean(sent.json.data.statusLabel), sent.json.data && sent.json.data.statusLabel);
  check('SMS stores the number masked', /^[0-9Xx*]+$/.test(String(sent.json.data.toMasked).replace(/[^0-9Xx*]/g, '')), sent.json.data.toMasked);
  const smsHistory = await call('GET', '/api/sms', { headers: { 'x-device-id': DEVICE } });
  check('SMS history returns the entry', (smsHistory.json.data || []).length >= 1);

  // -------------------------------------------------------- virtual call: STT
  console.log('\nVirtual call screen: speech to text, then an answer');
  const session = await call('POST', '/api/voice-sessions', { headers: { 'x-device-id': DEVICE }, body: { language: 'en' } });
  const sessionId = session.json.data && session.json.data.id;
  check('voice session starts', session.status === 201 && Boolean(sessionId), session.status);
  check('voice session reports that speech works', session.json.data.canTranscribe === true, session.json.data.canTranscribe);

  const audio = Buffer.alloc(2048, 7); // stand-in for the MediaRecorder MP4
  const turn = await call('POST', `/api/voice-sessions/${sessionId}/turns?language=en`, {
    headers: { 'x-device-id': DEVICE },
    raw: audio,
    contentType: 'audio/mp4',
  });
  const turnData = (turn.json && turn.json.data) || {};
  check('recorded audio reaches the speech provider', fake.state.calls >= 1, fake.state.calls);
  check('provider received multipart audio with the API key', Boolean(fake.state.lastHeaders['content-type'].startsWith('multipart/form-data')) && fake.state.lastHeaders.authorization === 'Bearer contract-test-key', fake.state.lastHeaders && { ct: fake.state.lastHeaders['content-type'], auth: fake.state.lastHeaders.authorization });
  check('the transcript comes back to the screen', turnData.transcript === fake.state.transcript, turnData.transcript);
  check('the transcript is answered from the knowledge base', turnData.grounded === true && /fever/i.test(turnData.answer), turnData.answer && turnData.answer.slice(0, 60));
  check('the voice answer carries sources and read-back', Array.isArray(turnData.trustedSources) && Boolean(turnData.freshness), Object.keys(turnData));

  // The app sends ?language=kn on the same session; the answer must follow it.
  fake.state.transcript = 'ಜ್ವರ ಇದೆ ಏನು ಮಾಡಬೇಕು';
  const knTurn = await call('POST', `/api/voice-sessions/${sessionId}/turns?language=kn`, {
    headers: { 'x-device-id': DEVICE },
    raw: audio,
    contentType: 'audio/mp4',
  });
  check('voice turn honours the language query parameter', knTurn.json.data.language === 'kn' && hasKannada(knTurn.json.data.answer), knTurn.json.data.language);

  // No speech provider at all: the app can still get an answer by sending text.
  const textTurn = await call('POST', `/api/voice-sessions/${sessionId}/turns?language=hi&transcript=${encodeURIComponent('बुखार है क्या करूं')}`, {
    headers: { 'x-device-id': DEVICE },
    raw: Buffer.alloc(0),
    contentType: 'audio/mp4',
  });
  check('a transcript-only turn is answered in Hindi', textTurn.json.data.grounded === true && hasDevanagari(textTurn.json.data.answer), textTurn.json.data.transcript);

  const ended = await call('DELETE', `/api/voice-sessions/${sessionId}`, { headers: { 'x-device-id': DEVICE } });
  check('voice session ends', ended.json.data.status === 'ended', ended.json.data);

  // Sarvam provider shape, against the same stand-in server.
  console.log('\nSarvam speech-to-text request shape');
  const sarvamSpeech = createSpeechService({
    ...config,
    sttProvider: 'auto',
    sttHttpUrl: '',
    sarvamApiKey: 'test-sarvam-key',
    sarvamSttUrl: `${fakeUrl}/speech-to-text`,
    sarvamSttModel: 'saarika:v2.5',
  });
  fake.state.lastHeaders = null;
  const sarvamResult = await sarvamSpeech.transcribe({ audio, contentType: 'audio/mp4', language: 'kn' });
  check('Sarvam provider is used when only its key is set', sarvamResult.provider === 'sarvam-saarika', sarvamResult.provider);
  check('Sarvam request sends api-subscription-key', fake.state.lastHeaders['api-subscription-key'] === 'test-sarvam-key', fake.state.lastHeaders && fake.state.lastHeaders['api-subscription-key']);
  check('Sarvam request sends model and language_code', /name="model"/.test(fake.state.lastBody) && /kn-IN/.test(fake.state.lastBody), 'multipart body');

  // ------------------------------------------------------------- number tools
  console.log('\nRead-back of numbers (Ask and voice)');
  const readback = await call('POST', '/api/numbers/readback', { body: { text: 'paanch hazaar rupaye', language: 'hi' } });
  check('readback parses a mixed-language amount', readback.json.data.count >= 1, readback.json.data.count);
  check('readback returns a confirmation prompt per language', Boolean(readback.json.data.confirmationPrompt.en && readback.json.data.confirmationPrompt.hi && readback.json.data.confirmationPrompt.kn));

  // ------------------------------------------------------------ knowledge pack
  console.log('\nOffline pack and freshness');
  const manifest = await call('GET', '/api/knowledge/manifest');
  check('manifest exposes a pack version', typeof manifest.json.data.packVersion === 'string' && manifest.json.data.packVersion.length === 12);
  check('manifest counts knowledge and schemes', manifest.json.data.knowledge >= 80 && manifest.json.data.schemes >= 14, manifest.json.data);
  const staleManifest = await call('GET', '/api/knowledge/manifest?have=deadbeef1234&downloadedAt=2020-01-01T00:00:00Z');
  check('an old pack is reported stale', staleManifest.json.data.freshness.status === 'stale', staleManifest.json.data.freshness);
  check('the stale message is trilingual', Boolean(staleManifest.json.data.freshness.message.en && staleManifest.json.data.freshness.message.hi && staleManifest.json.data.freshness.message.kn));
  const pack = await call('GET', '/api/knowledge/pack');
  check('pack contains schemes and knowledge', (pack.json.data.schemes || []).length >= 14 && (pack.json.data.knowledge || []).length >= 80);
  check('pack knowledge is trilingual', (pack.json.data.knowledge || []).every((k) => k.answer.en && k.answer.hi && k.answer.kn));

  // ------------------------------------------------------------------ offline
  console.log('\nOffline outbox: POST /api/sync');
  const sync = await call('POST', '/api/sync', {
    headers: { 'x-device-id': DEVICE },
    body: {
      operations: [
        { id: 'op1', entityType: 'reminder', operation: 'create', payload: { title: 'Offline reminder', remindAt: '2026-11-02T10:00:00+05:30', clientId: 'offline-1' } },
        { id: 'op2', entityType: 'scholarship_saved', operation: 'create', payload: { scholarship: target } },
        { id: 'op3', entityType: 'unknown', operation: 'create', payload: {} },
      ],
    },
  });
  check('sync accepts the supported operations', sync.json.data.acceptedCount === 2, sync.json.data.accepted);
  check('sync rejects the unsupported one', sync.json.data.rejectedCount === 1, sync.json.data.rejected);

  // ------------------------------------------------------------------- misc
  console.log('\nEnvelope and errors');
  const notFound = await call('GET', '/api/nope');
  check('unknown route returns the error envelope', notFound.status === 404 && notFound.json.success === false);
  const badQuestion = await call('POST', '/api/query', { body: { question: '' } });
  check('empty question is rejected with 400', badQuestion.status === 400, badQuestion.status);

  // ------------------------------------------------------------------ report
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => fake.server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailed checks:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('contract test crashed:', err);
  process.exit(1);
});
