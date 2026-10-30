/**
 * npm run hurdles
 *
 * Focused checks for the three hurdle hints, on the server side:
 *
 *   Hint 1  the information was correct on the day it was downloaded
 *           -> asOf per fact, a change feed, verify links, per-answer recheck
 *   Hint 2  rural users do not stick to one language per sentence
 *           -> mixed-script parsing, fraction words, auto answer language
 *   Hint 3  a misheard number can cost someone money
 *           -> read-back, a server-side confirmation gate, spoken yes/no,
 *              ambiguous dates, and a guard for money words with no amount
 *
 * Boots the app in-process against the in-memory store. No AWS, no API key, no
 * open port. Exit code 0 = every hurdle behaviour is in place.
 */
process.env.MONGODB_URI = '';
process.env.SPEECH_PROVIDER = 'auto';
process.env.STT_PROVIDER = 'auto';
process.env.SARVAM_API_KEY = '';
process.env.STT_HTTP_URL = '';
process.env.AWS_ACCESS_KEY_ID = '';
process.env.AWS_SECRET_ACCESS_KEY = '';
process.env.AWS_S3_BUCKET = '';

const http = require('http');
const { loadConfig } = require('../src/config/env');
const { createStore } = require('../src/store');
const { createSpeechService } = require('../src/services/speech');
const createApp = require('../src/app');
const { request } = require('../src/services/http');

const DEVICE = 'hurdle-test-device-0001';
let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail).slice(0, 300)}`}`);
  }
}

const hasDevanagari = (s) => /[\u0900-\u097F]/.test(s || '');
const hasKannada = (s) => /[\u0C80-\u0CFF]/.test(s || '');

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  const speech = createSpeechService(config);
  const app = createApp(config, { store, speech });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { body, headers = {}, raw, contentType } = {}) => {
    const options = { method, headers: { ...headers }, timeoutMs: 15000 };
    if (raw !== undefined) {
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

  const readback = async (text, language) =>
    (await call('POST', '/api/numbers/readback', { body: { text, language } })).json.data;

  // ======================================================= HINT 1: stale data
  console.log('\nHint 1 — the information was correct on the day it was downloaded');

  const health = await call('GET', '/api/health');
  check('health advertises all three hurdle capabilities',
    health.json.hurdles && health.json.hurdles.staleKnowledge.supported
    && health.json.hurdles.mixedLanguage.supported && health.json.hurdles.numberReadback.supported,
    health.json.hurdles);
  check('health counts the entries whose facts move', health.json.hurdles.staleKnowledge.volatileEntries > 0,
    health.json.hurdles.staleKnowledge);

  const manifest = await call('GET', '/api/knowledge/manifest');
  const manifestData = manifest.json.data;
  check('manifest carries contentAsOf', Boolean(manifestData.contentAsOf), manifestData.contentAsOf);
  check('manifest says how many entries can go stale', manifestData.volatileEntries > 0, manifestData.volatileEntries);

  const pack = (await call('GET', '/api/knowledge/pack')).json.data;
  const sampleEntry = pack.knowledge.find((k) => k.id === 'kb-scheme-pm-kisan');
  check('every entry carries the date it was last checked', Boolean(sampleEntry.asOf), sampleEntry.asOf);
  check('every entry says which facts move', Array.isArray(sampleEntry.volatileFacts) && sampleEntry.volatileFacts.length > 0,
    sampleEntry.volatileFacts);
  check('entries that move carry an official verify link', /^https:\/\//.test(sampleEntry.verifyUrl || ''), sampleEntry.verifyUrl);
  check('entries without an official page say who to ask instead', Boolean(sampleEntry.verifyAt), sampleEntry.verifyAt);
  check('a stable entry is marked not volatile',
    pack.knowledge.find((k) => k.id === 'kb-health-snake-bite').volatile === false);
  check('the offline pack carries the fact dates too',
    pack.schemes.every((s) => s.asOf && s.verifyAt), pack.schemes[0] && pack.schemes[0].asOf);

  // The change feed: what actually changed since this phone's copy.
  const older = await call('GET', '/api/knowledge/changes?downloadedAt=2026-09-10T00:00:00Z');
  const olderData = older.json.data;
  check('a copy made on 10 Sep sees later re-checks as changes', olderData.changedCount > 0, olderData.changedCount);
  check('the change feed says what its basis is', olderData.basis === 'checked-after-download', olderData.basis);
  check('each change names the facts that moved',
    olderData.changes.every((c) => Array.isArray(c.changedFields)), olderData.changes[0]);
  check('each change carries a trilingual summary',
    olderData.changes.every((c) => c.summary && c.summary.en && c.summary.hi && c.summary.kn), olderData.changes[0] && olderData.changes[0].summary);
  check('the change summary is in the user\'s language when asked',
    hasDevanagari(olderData.changes[0].summary.hi) && hasKannada(olderData.changes[0].summary.kn));
  check('changes point at where to verify',
    olderData.changes.some((c) => /^https:\/\//.test(c.verifyUrl || '')), olderData.changes[0] && olderData.changes[0].verifyUrl);
  check('the change feed has a message in all three languages',
    Boolean(olderData.message.en && olderData.message.hi && olderData.message.kn), olderData.message);

  const fresh = await call('GET', `/api/knowledge/changes?downloadedAt=${encodeURIComponent(new Date().toISOString())}`);
  check('a copy made just now sees no changes', fresh.json.data.changedCount === 0, fresh.json.data.changedCount);

  const unknownVersion = await call('GET', '/api/knowledge/changes?have=deadbeef1234');
  check('an unknown old version falls back to everything that can move',
    unknownVersion.json.data.basis === 'volatile-only' && unknownVersion.json.data.changedCount > 0,
    { basis: unknownVersion.json.data.basis, count: unknownVersion.json.data.changedCount });

  // Per-answer freshness.
  const volatileAnswer = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'how much money does pm kisan give farmers', language: 'en', packDownloadedAt: '2026-09-10T00:00:00Z' },
  });
  const va = volatileAnswer.json.data;
  check('an answer from a moving entry reports the date it was checked', Boolean(va.fact && va.fact.asOf), va.fact);
  check('an answer from a moving entry says the facts can move', va.fact.volatile === true, va.fact);
  check('an answer re-checked after the download is flagged as changed', Boolean(va.recheck && va.recheck.changedSinceDownload === true), va.recheck);
  check('the recheck message is trilingual',
    Boolean(va.recheck && va.recheck.message.en && va.recheck.message.hi && va.recheck.message.kn), va.recheck && va.recheck.message);
  check('a moving fact always asks the user to verify before acting', va.verifyBeforeActing === true);

  const freshAnswer = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'how much money does pm kisan give farmers', language: 'en', packDownloadedAt: new Date().toISOString() },
  });
  check('with an up-to-date copy the answer is not flagged as changed',
    freshAnswer.json.data.recheck && freshAnswer.json.data.recheck.changedSinceDownload === false,
    freshAnswer.json.data.recheck);

  const stableAnswer = await call('POST', '/api/query', {
    body: { question: 'what first aid for a snake bite', language: 'en', packDownloadedAt: '2026-09-10T00:00:00Z' },
  });
  check('a stable fact is not nagged about', stableAnswer.json.data.fact.volatile === false && !stableAnswer.json.data.recheck,
    { fact: stableAnswer.json.data.fact, recheck: stableAnswer.json.data.recheck });

  const staleQuery = await call('POST', '/api/query', {
    body: { question: 'how to apply for old age pension', language: 'en', packDownloadedAt: '2020-01-01T00:00:00Z', packVersion: 'deadbeef1234' },
  });
  check('a stale pack adds the stale notice to the answer',
    Boolean(staleQuery.json.data.staleNotice) && staleQuery.json.data.freshness.status === 'stale',
    staleQuery.json.data.freshness && staleQuery.json.data.freshness.status);

  // =================================================== HINT 2: mixed language
  console.log('\nHint 2 — rural users do not stick to one language per sentence');

  const fractions = [
    ['dedh lakh rupaye', 150000, 'amount'],
    ['dhai hazaar', 2500, 'number'],
    ['paune do hazaar', 1750, 'number'],
    ['sava lakh', 125000, 'number'],
    ['aadha kilo', 0.5, 'number'],
    ['डेढ़ लाख रुपये', 150000, 'amount'],
    ['ಎರಡೂವರೆ ಲಕ್ಷ', 250000, 'number'],
  ];
  for (const [text, value, kind] of fractions) {
    const data = await readback(text, 'hi');
    const first = data.numbers[0];
    check(`"${text}" is understood as ${value}`, Boolean(first) && Math.abs(first.value - value) < 0.001 && first.kind === kind,
      first && { value: first.value, kind: first.kind });
  }

  const mixed = await readback('मेरे बच्चे को bukhar hai, २ दिन से, 500 rupaye ki dawa', 'hi');
  check('a mixed Hindi/English/Devanagari-digit sentence finds every number',
    mixed.numbers.length === 2 && mixed.numbers.some((n) => n.value === 2) && mixed.numbers.some((n) => n.value === 500),
    mixed.numbers.map((n) => n.value));
  check('the read-back knows which languages were mixed',
    mixed.languagesDetected.includes('hi') && mixed.languagesDetected.includes('en'), mixed.languagesDetected);
  check('the read-back says which language dominates', mixed.dominantLanguage === 'hi', mixed.dominantLanguage);

  const kannadaReadback = await readback('ಐದು ಸಾವಿರ ರೂಪಾಯಿ', 'kn');
  check('a Kannada amount is read back in Kannada',
    hasKannada(kannadaReadback.confirmationPrompt.kn) && kannadaReadback.numbers[0].value === 5000,
    kannadaReadback.confirmationPrompt.kn);

  const autoKn = await call('POST', '/api/query', {
    body: { question: 'ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಏನು ಬೇಕು', language: 'auto' },
  });
  check('language=auto answers a Kannada question in Kannada',
    autoKn.json.data.answerLanguage === 'kn' && hasKannada(autoKn.json.data.answer), autoKn.json.data.answerLanguage);

  const autoHi = await call('POST', '/api/query', {
    body: { question: 'बुखार है क्या करूं', language: 'auto' },
  });
  check('language=auto answers a Hindi question in Hindi',
    autoHi.json.data.answerLanguage === 'hi' && hasDevanagari(autoHi.json.data.answer), autoHi.json.data.answerLanguage);

  const autoRoman = await call('POST', '/api/query', {
    body: { question: 'bukhar hai kya karu', language: 'auto' },
  });
  check('language=auto recognises romanised Hindi and answers in Hindi',
    autoRoman.json.data.answerLanguage === 'hi' && hasDevanagari(autoRoman.json.data.answer), autoRoman.json.data.answerLanguage);

  const autoEn = await call('POST', '/api/query', {
    body: { question: 'how do I open a bank account', language: 'auto' },
  });
  check('language=auto keeps an English question in English', autoEn.json.data.answerLanguage === 'en', autoEn.json.data.answerLanguage);

  const script = await call('POST', '/api/numbers/speech', {
    body: { text: 'PM Kisan gives 6000 rupaye in three installments.', language: 'hi' },
  });
  check('the speech script splits prose from the amount',
    script.json.data.segments.some((s) => s.type === 'amount') && script.json.data.segments.some((s) => s.type === 'text'),
    script.json.data.segments.map((s) => s.type));
  check('the amount is spoken in the user\'s language',
    hasDevanagari(script.json.data.segments.find((s) => s.type === 'amount').readBack),
    script.json.data.segments.find((s) => s.type === 'amount'));

  // ======================================================= HINT 3: numbers
  console.log('\nHint 3 — a misheard number can cost someone money');

  const confusables = await readback('saat hazaar rupaye', 'hi');
  check('a confusable number word is flagged', confusables.numbers[0].confusions.length > 0,
    confusables.numbers[0].confusions);
  check('a confusable number must be confirmed', confusables.requiresConfirmation === true);
  check('the read-back spells the amount digit by digit as well',
    confusables.numbers[0].readBack.en.includes('seven, zero, zero, zero'), confusables.numbers[0].readBack.en);

  const ambiguous = await readback('last date 01/11/2026 hai', 'hi');
  check('a numeric date is recognised', ambiguous.dates.length === 1, ambiguous.dates.length);
  check('an ambiguous date is flagged with both readings',
    ambiguous.dates[0].ambiguous === true && ambiguous.dates[0].readings.length === 2, ambiguous.dates[0]);
  check('both date readings are spelled out in the user\'s language',
    hasDevanagari(ambiguous.dates[0].readBack.hi) && ambiguous.dates[0].readBack.hi.includes('या'),
    ambiguous.dates[0].readBack.hi);
  check('an ambiguous date must be confirmed', ambiguous.requiresConfirmation === true);

  const moneyNoAmount = await readback('kitne rupaye milenge', 'hi');
  check('money words with no understandable amount are caught, not ignored',
    moneyNoAmount.unparsedMoney === true && moneyNoAmount.requiresConfirmation === true, moneyNoAmount.unparsedMoney);
  check('the user is asked to repeat the amount',
    hasDevanagari(moneyNoAmount.confirmationPrompt.hi), moneyNoAmount.confirmationPrompt.hi);

  const idReadback = await readback('mera number 9876543210 hai', 'hi');
  check('a phone number is read back digit by digit', idReadback.numbers[0].kind === 'identifier'
    && idReadback.numbers[0].readBack.en.includes('nine'), idReadback.numbers[0]);

  // Spoken yes / no.
  for (const [utterance, expected] of [
    ['haan', true], ['ji haan', true], ['हाँ', true], ['सही है', true],
    ['haudu', true], ['ಹೌದು', true], ['sari', true], ['yes', true],
    ['nahi', false], ['गलत है', false], ['illa', false], ['ಇಲ್ಲ', false], ['no', false],
  ]) {
    const res = await call('POST', '/api/numbers/confirm', { body: { utterance } });
    check(`"${utterance}" is understood as ${expected ? 'yes' : 'no'}`,
      res.json.data.confirmed === expected, res.json.data);
  }
  const unclear = await call('POST', '/api/numbers/confirm', { body: { utterance: 'maybe later' } });
  check('an unclear answer is not treated as yes', unclear.json.data.confirmed === null, unclear.json.data);

  // The server-side gate.
  const gated = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'pm kisan 6000 rupaye kab aayega', language: 'hi', requireConfirmation: true },
  });
  const gatedData = gated.json.data;
  check('an answer that depends on an amount is held back', gatedData.requiresConfirmation === true && !gatedData.answer,
    { requires: gatedData.requiresConfirmation, hasAnswer: Boolean(gatedData.answer) });
  check('the held answer comes with a confirmation token', Boolean(gatedData.confirmation && gatedData.confirmation.token));
  check('the confirmation prompt is in all three languages',
    Boolean(gatedData.confirmation.prompt.en && gatedData.confirmation.prompt.hi && gatedData.confirmation.prompt.kn));
  check('the confirmation prompt is in the language of the question',
    hasDevanagari(gatedData.confirmation.prompt.hi));
  check('the token expires', gatedData.confirmation.expiresInSeconds > 0, gatedData.confirmation.expiresInSeconds);

  const token = gatedData.confirmation.token;
  const released = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token, confirmed: true },
  });
  check('confirming releases the answer', released.json.data.confirmed === true && released.json.data.answer.length > 20,
    released.json.data.answer && released.json.data.answer.slice(0, 40));
  check('the released answer reports what was confirmed',
    Array.isArray(released.json.data.confirmedNumbers) && released.json.data.confirmedNumbers.length === 1,
    released.json.data.confirmedNumbers);
  check('the released answer still carries its fact dates', Boolean(released.json.data.fact && released.json.data.fact.asOf));

  const reuse = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token, confirmed: true },
  });
  check('a token cannot be used twice', reuse.status === 409 && /CONFIRMATION_USED/.test(JSON.stringify(reuse.json)),
    reuse.status);

  const gated2 = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'pm kisan 6000 rupaye kab aayega', language: 'en', requireConfirmation: true },
  });
  const declined = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token: gated2.json.data.confirmation.token, confirmed: false },
  });
  check('saying no cancels instead of answering',
    declined.json.data.cancelled === true && !declined.json.data.answer, declined.json.data.cancelled);

  const gated3 = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'mujhe 2500 rupaye ka loan chahiye', language: 'hi', requireConfirmation: true },
  });
  const byVoice = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token: gated3.json.data.confirmation.token, utterance: 'haan sahi hai' },
  });
  check('a spoken "haan sahi hai" releases the answer',
    byVoice.json.data.confirmed === true && Boolean(byVoice.json.data.heard), byVoice.json.data.heard);

  const gated4 = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: 'mujhe 2500 rupaye ka loan chahiye', language: 'hi', requireConfirmation: true },
  });
  const byVoiceNo = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token: gated4.json.data.confirmation.token, utterance: 'nahi galat hai' },
  });
  check('a spoken "nahi" cancels', byVoiceNo.json.data.cancelled === true, byVoiceNo.json.data);

  const gated5 = await call('POST', '/api/query', {
    headers: { 'x-device-id': DEVICE },
    body: { question: '500 rupaye', language: 'en', requireConfirmation: true },
  });
  const unclearAnswer = await call('POST', '/api/query/confirm', {
    headers: { 'x-device-id': DEVICE },
    body: { token: gated5.json.data.confirmation.token, utterance: 'hmm later' },
  });
  check('an unclear spoken answer keeps the question open', unclearAnswer.json.data.retry === true, unclearAnswer.json.data);

  const noGate = await call('POST', '/api/query', {
    body: { question: 'pm kisan 6000 rupaye kab aayega', language: 'en' },
  });
  check('without the flag the old behaviour is unchanged (older APKs keep working)',
    noGate.json.data.grounded === true && Boolean(noGate.json.data.answer));

  // Voice path with the gate.
  const session = await call('POST', '/api/voice-sessions', {
    headers: { 'x-device-id': DEVICE },
    body: { language: 'kn' },
  });
  const sessionId = session.json.data.id;
  const voiceGate = await call('POST', `/api/voice-sessions/${sessionId}/turns?language=kn&confirm=true&transcript=${encodeURIComponent('ಐದು ಸಾವಿರ ರೂಪಾಯಿ ಸಾಲ ಬೇಕು')}`, {
    headers: { 'x-device-id': DEVICE },
    raw: Buffer.alloc(0),
    contentType: 'audio/mp4',
  });
  check('a voice turn with an amount asks for confirmation first',
    voiceGate.json.data.requiresConfirmation === true && !voiceGate.json.data.grounded,
    { requires: voiceGate.json.data.requiresConfirmation, grounded: voiceGate.json.data.grounded });
  check('the spoken read-back prompt is Kannada',
    hasKannada(voiceGate.json.data.answer), voiceGate.json.data.answer && voiceGate.json.data.answer.slice(0, 60));

  const voiceYes = await call('POST', `/api/voice-sessions/${sessionId}/turns?language=kn&confirmationToken=${voiceGate.json.data.confirmationToken}&transcript=${encodeURIComponent('ಹೌದು')}`, {
    headers: { 'x-device-id': DEVICE },
    raw: Buffer.alloc(0),
    contentType: 'audio/mp4',
  });
  check('saying "ಹೌದು" on the next turn releases the voice answer',
    voiceYes.json.data.confirmed === true && voiceYes.json.data.grounded === true,
    { confirmed: voiceYes.json.data.confirmed, grounded: voiceYes.json.data.grounded });
  check('the voice answer reports what was confirmed',
    Array.isArray(voiceYes.json.data.confirmedNumbers) && voiceYes.json.data.confirmedNumbers[0].value === 5000,
    voiceYes.json.data.confirmedNumbers);

  await call('DELETE', `/api/voice-sessions/${sessionId}`, { headers: { 'x-device-id': DEVICE } });

  // Answers carry the read-back material for the app.
  const answerSpeech = await call('POST', '/api/query', {
    body: { question: 'how much does pm kisan give', language: 'en' },
  });
  check('answers include a speech script for reading aloud',
    Array.isArray(answerSpeech.json.data.answerSpeech) && answerSpeech.json.data.answerSpeech.some((s) => s.type === 'amount'),
    answerSpeech.json.data.answerSpeech && answerSpeech.json.data.answerSpeech.map((s) => s.type));
  check('amounts in the answer are listed separately for checking',
    Array.isArray(answerSpeech.json.data.answerNumbers) && answerSpeech.json.data.answerNumbers.length > 0,
    answerSpeech.json.data.answerNumbers && answerSpeech.json.data.answerNumbers.length);
  check('identifiers are not treated as amounts in the answer',
    answerSpeech.json.data.answerNumbers.every((n) => n.kind !== 'identifier'));

  await new Promise((resolve) => server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailed checks:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('hurdle test crashed:', err);
  process.exit(1);
});
