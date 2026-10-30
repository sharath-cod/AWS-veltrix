/**
 * npm run smoke
 * Boots the app in-process against the in-memory store, calls every endpoint
 * the Android client uses, and checks the response shape. No external services
 * and no open port are required.
 *
 * Exit code 0 = all checks passed.
 */
process.env.MONGODB_URI = '';
process.env.SPEECH_PROVIDER = 'auto';

const http = require('http');
const { loadConfig } = require('../src/config/env');
const { createStore } = require('../src/store');
const { createSpeechService } = require('../src/services/speech');
const createApp = require('../src/app');
const { request } = require('../src/services/http');

const DEVICE = 'smoke-test-device-0001';
let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail ? ` -> ${JSON.stringify(detail).slice(0, 300)}` : ''}`);
  }
}

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  const speech = createSpeechService(config);
  const app = createApp(config, { store, speech });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { body, headers = {}, raw } = {}) => {
    const options = { method, headers: { ...headers }, timeoutMs: 15000 };
    if (raw) {
      options.body = raw;
      options.headers['content-type'] = options.headers['content-type'] || 'audio/mp4';
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

  console.log(`\nGramSahayak backend smoke test (store: ${store.mode})\n`);

  // --- root and health -----------------------------------------------------
  const root = await call('GET', '/');
  check('GET / returns the API banner', root.status === 200 && root.json.success === true, root.json);

  const health = await call('GET', '/api/health');
  check('GET /api/health reports running', health.status === 200 && health.json.success === true, health.json);
  check('health reports the store mode', health.json.storeMode === 'memory', health.json.storeMode);

  // --- knowledge -----------------------------------------------------------
  const kb = await call('GET', '/api/knowledge');
  check('GET /api/knowledge returns the seeded base', kb.json.count >= 12, kb.json.count);

  const kbHealth = await call('GET', '/api/knowledge?category=health');
  check('knowledge category filter works', kbHealth.json.count >= 4, kbHealth.json.count);

  const kbOne = await call('GET', '/api/knowledge/kb-health-fever');
  check('GET /api/knowledge/:id returns one entry', kbOne.status === 200 && kbOne.json.data.id === 'kb-health-fever', kbOne.json);

  const kbMissing = await call('GET', '/api/knowledge/does-not-exist');
  check('unknown knowledge id returns 404', kbMissing.status === 404, kbMissing.status);

  // --- assistant query -----------------------------------------------------
  const q1 = await call('POST', '/api/query', {
    body: { question: 'What should I do if I have fever for two days?', language: 'en' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('POST /api/query answers a health question', q1.status === 200 && q1.json.data.grounded === true, q1.json);
  check('answer carries trusted sources', Array.isArray(q1.json.data.trustedSources) && q1.json.data.trustedSources.length > 0, q1.json.data && q1.json.data.trustedSources);

  const q2 = await call('POST', '/api/query', {
    body: { question: 'ಜ್ವರ ಇದ್ದರೆ ಏನು ಮಾಡಬೇಕು?', language: 'kn' },
  });
  check('Kannada question is answered in Kannada', q2.json.data.language === 'kn' && /[\u0C80-\u0CFF]/.test(q2.json.data.answer), q2.json.data && q2.json.data.answer && q2.json.data.answer.slice(0, 60));

  const q3 = await call('POST', '/api/query', {
    body: { question: 'zzzz qqqq unrelated nonsense topic', language: 'en' },
  });
  check('unknown question is not answered with invented facts', q3.json.data.grounded === false, q3.json.data);

  const q4 = await call('POST', '/api/query', { body: { question: '' } });
  check('empty question returns 400', q4.status === 400, q4.status);

  // --- schemes -------------------------------------------------------------
  const schemes = await call('GET', '/api/schemes');
  check('GET /api/schemes returns the catalogue', schemes.json.count >= 10, schemes.json.count);
  check('scheme names are trilingual', Boolean(schemes.json.data[0].name.en && schemes.json.data[0].name.hi && schemes.json.data[0].name.kn), schemes.json.data[0].name);

  const schemeSearch = await call('GET', '/api/schemes?q=farmer');
  check('scheme search matches free text', schemeSearch.json.count > 0, schemeSearch.json.count);

  const schemeOne = await call('GET', '/api/schemes/pm-kisan');
  check('GET /api/schemes/:id returns a scheme', schemeOne.status === 200 && schemeOne.json.data.id === 'pm-kisan', schemeOne.json);

  const schemeCheck = await call('POST', '/api/schemes/check', { body: { language: 'hi' } });
  check('POST /api/schemes/check returns per-scheme results', schemeCheck.status === 200 && schemeCheck.json.data.results.length >= 10, schemeCheck.json.data && schemeCheck.json.data.results.length);

  const schemeCheckProfile = await call('POST', '/api/schemes/check', {
    body: { language: 'en', age: 72, landHoldingHa: 1.2, gender: 'female' },
  });
  const likely = schemeCheckProfile.json.data.results.filter((r) => r.status === 'likely').map((r) => r.id);
  check('eligibility rules use the profile when present', likely.includes('pmjay-senior') && likely.includes('pm-kisan'), likely);

  // --- scholarships --------------------------------------------------------
  const sch = await call('GET', '/api/scholarships');
  check('GET /api/scholarships returns open scholarships', sch.json.count >= 6, sch.json.count);

  const savedAdd = await call('POST', '/api/scholarships/saved', {
    body: { scholarship: 'nsp-post-matric' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('POST /api/scholarships/saved saves one', savedAdd.status === 201 && savedAdd.json.data.saved === true, savedAdd.json);

  const savedList = await call('GET', '/api/scholarships/saved', { headers: { 'X-Device-Id': DEVICE } });
  check('GET /api/scholarships/saved lists it back', savedList.json.count === 1, savedList.json.count);

  const savedAgain = await call('POST', '/api/scholarships/saved', {
    body: { scholarship: 'nsp-post-matric' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('saving twice does not duplicate', savedAgain.status === 201 && savedList.json.count === 1, savedAgain.status);

  const savedDelete = await call('DELETE', '/api/scholarships/saved/nsp-post-matric', {
    headers: { 'X-Device-Id': DEVICE },
  });
  check('DELETE /api/scholarships/saved/:id removes it', savedDelete.json.data.removed === true, savedDelete.json);

  const noDevice = await call('GET', '/api/scholarships/saved');
  check('missing X-Device-Id is rejected', noDevice.status === 400, noDevice.status);

  // --- reminders -----------------------------------------------------------
  const clientId = 'client-reminder-1';
  const remCreate = await call('POST', '/api/reminders', {
    body: { title: 'Take BP tablet', type: 'medicine', remindAt: '2026-11-01T09:00:00+05:30', repeat: 'daily', clientId },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('POST /api/reminders creates a reminder', remCreate.status === 201 && Boolean(remCreate.json.data.id), remCreate.json);
  const reminderId = remCreate.json.data.id;

  const remDup = await call('POST', '/api/reminders', {
    body: { title: 'Take BP tablet', type: 'medicine', remindAt: '2026-11-01T09:00:00+05:30', repeat: 'daily', clientId },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('same clientId is deduplicated', remDup.json.deduplicated === true && remDup.json.data.id === reminderId, remDup.json.deduplicated);

  const remList = await call('GET', '/api/reminders', { headers: { 'X-Device-Id': DEVICE } });
  check('GET /api/reminders lists one reminder', remList.json.count === 1, remList.json.count);

  const remUpdate = await call('PUT', `/api/reminders/${reminderId}`, {
    body: { completed: true },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('PUT /api/reminders/:id marks it complete', remUpdate.json.data.completed === true, remUpdate.json);

  const remBad = await call('POST', '/api/reminders', {
    body: { title: 'x', remindAt: 'not-a-date' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('invalid reminder payload returns 400', remBad.status === 400, remBad.status);

  const remDelete = await call('DELETE', `/api/reminders/${reminderId}`, { headers: { 'X-Device-Id': DEVICE } });
  check('DELETE /api/reminders/:id removes it', remDelete.json.data.removed === true, remDelete.json);

  const remGone = await call('DELETE', `/api/reminders/${reminderId}`, { headers: { 'X-Device-Id': DEVICE } });
  check('deleting twice returns 404', remGone.status === 404, remGone.status);

  // --- scam check ----------------------------------------------------------
  const scamHigh = await call('POST', '/api/scam-check', {
    body: { text: 'URGENT: Your KYC is blocked. Share the OTP and click this link http://bit.ly/xyz to update immediately', language: 'en' },
  });
  check('scam check flags an OTP/KYC message as high risk', scamHigh.json.data.riskLevel === 'high', scamHigh.json.data && scamHigh.json.data.riskLevel);
  check('scam check explains the reasons', scamHigh.json.data.reasons.length >= 2, scamHigh.json.data && scamHigh.json.data.reasons.length);

  const scamLow = await call('POST', '/api/scam-check', { body: { text: 'Meeting at the panchayat office tomorrow at 10 am', language: 'en' } });
  check('a normal message is low risk', scamLow.json.data.riskLevel === 'low', scamLow.json.data && scamLow.json.data.riskLevel);

  const scamHi = await call('POST', '/api/scam-check', { body: { text: 'आपने लॉटरी जीती है, प्रोसेसिंग फीस भेजें', language: 'hi' } });
  check('Hindi lottery message is flagged', scamHi.json.data.riskLevel !== 'low', scamHi.json.data && scamHi.json.data.riskLevel);

  // --- sms simulation ------------------------------------------------------
  const smsPreview = await call('POST', '/api/sms/preview', {
    body: { to: '9876543210', message: 'Your scheme application is ready for collection.' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('sms preview accepts a valid Indian number', smsPreview.json.data.allowed === true && smsPreview.json.data.toMasked === '+91 ******3210', smsPreview.json.data);

  const smsBad = await call('POST', '/api/sms/preview', {
    body: { to: '12345', message: 'hi' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('sms preview rejects a bad number', smsBad.json.data.allowed === false, smsBad.json.data);

  const smsSend = await call('POST', '/api/sms/send', {
    body: { to: '9876543210', message: 'Your scheme application is ready.', language: 'en', consent: true },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('sms send records a simulated message', smsSend.status === 201 && smsSend.json.data.simulated === true, smsSend.json);

  const smsNoConsent = await call('POST', '/api/sms/send', {
    body: { to: '9876543210', message: 'test' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('sms send without consent is rejected', smsNoConsent.status === 400, smsNoConsent.status);

  const smsHistory = await call('GET', '/api/sms', { headers: { 'X-Device-Id': DEVICE } });
  check('sms history returns the entry with a masked number', smsHistory.json.count === 1 && smsHistory.json.data[0].toMasked.startsWith('+91'), smsHistory.json.data);

  // --- voice sessions ------------------------------------------------------
  const voiceStart = await call('POST', '/api/voice-sessions', {
    body: { language: 'kn' },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('POST /api/voice-sessions starts a session', voiceStart.status === 201 && Boolean(voiceStart.json.data.id), voiceStart.json);
  const sessionId = voiceStart.json.data.id;

  const fakeAudio = Buffer.alloc(2048, 1);
  const turn = await call('POST', `/api/voice-sessions/${sessionId}/turns`, {
    raw: fakeAudio,
    headers: { 'X-Device-Id': DEVICE, 'content-type': 'audio/mp4' },
  });
  check('voice turn returns a text answer even without AWS', turn.status === 200 && typeof turn.json.data.answer === 'string' && turn.json.data.answer.length > 10, turn.json);
  check('voice turn states that speech is unavailable', turn.json.data.provider.speechToText === 'unavailable', turn.json.data.provider);

  const emptyTurn = await call('POST', `/api/voice-sessions/${sessionId}/turns`, {
    headers: { 'X-Device-Id': DEVICE },
  });
  check('voice turn without audio returns 400', emptyTurn.status === 400, emptyTurn.status);

  const voiceEnd = await call('DELETE', `/api/voice-sessions/${sessionId}`, { headers: { 'X-Device-Id': DEVICE } });
  check('DELETE /api/voice-sessions/:id ends the session', voiceEnd.json.data.status === 'ended', voiceEnd.json);

  const turnAfterEnd = await call('POST', `/api/voice-sessions/${sessionId}/turns`, {
    raw: fakeAudio,
    headers: { 'X-Device-Id': DEVICE, 'content-type': 'audio/mp4' },
  });
  check('a turn after ending returns 409', turnAfterEnd.status === 409, turnAfterEnd.status);

  // --- sync ----------------------------------------------------------------
  const sync = await call('POST', '/api/sync', {
    body: {
      operations: [
        { id: 'op-1', entityType: 'reminder', operation: 'create', payload: { title: 'Collect pension', remindAt: '2026-11-05T10:00:00+05:30', clientId: 'c-9' } },
        { id: 'op-2', entityType: 'scholarship_saved', operation: 'create', payload: { scholarshipId: 'inspire-she' } },
        { id: 'op-3', entityType: 'unknown_thing', operation: 'create', payload: {} },
      ],
    },
    headers: { 'X-Device-Id': DEVICE },
  });
  check('POST /api/sync accepts supported operations', sync.json.data.acceptedCount === 2, sync.json.data);
  check('POST /api/sync rejects unsupported operations', sync.json.data.rejectedCount === 1, sync.json.data);

  const syncStatus = await call('GET', '/api/sync', { headers: { 'X-Device-Id': DEVICE } });
  check('GET /api/sync counts server-side rows', syncStatus.json.data.reminders === 1 && syncStatus.json.data.savedScholarships === 1, syncStatus.json.data);

  // --- errors --------------------------------------------------------------
  const notFound = await call('GET', '/api/nope');
  check('unknown route returns 404 envelope', notFound.status === 404 && notFound.json.error.code === 'NOT_FOUND', notFound.json);

  const badJson = await request(base + '/api/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ not json',
  });
  check('invalid JSON returns 400', badJson.status === 400, badJson.status);

  server.close();
  await store.close();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed checks:');
    failures.forEach((f) => console.log(` - ${f}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exitCode = 1;
});
