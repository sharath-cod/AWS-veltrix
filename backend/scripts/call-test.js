/**
 * npm run call
 *
 * The call simulation: the AI picks up, answers in the caller's language,
 * keeps answers short enough to listen to ("tell me more" for the rest),
 * understands a follow-up against the previous question, and does not guess on
 * medical questions — red flags go to 108, unsure medical and dose questions go
 * to 104 / 108.
 *
 * Also covers POST /api/transcribe, the endpoint the app uses to turn a
 * recording made while offline into text once the network is back.
 *
 * Boots the app in-process against the in-memory store, with a stand-in speech
 * provider so audio works without AWS or an API key.
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

const DEVICE = 'call-test-device-0001';
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
const hasTamil = (s) => /[\u0B80-\u0BFF]/.test(s || '');

function startFakeStt() {
  const state = { transcript: '', calls: 0 };
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      state.calls += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ text: state.transcript }));
    });
  });
  return { server, state };
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function main() {
  const fake = startFakeStt();
  const fakeUrl = await listen(fake.server);
  process.env.STT_HTTP_URL = `${fakeUrl}/v1/audio/transcriptions`;
  process.env.STT_HTTP_API_KEY = 'call-test-key';

  const config = loadConfig();
  const store = createStore(config);
  const speech = createSpeechService(config);
  const app = createApp(config, { store, speech });
  const server = http.createServer(app);
  const base = await listen(server);

  const call = async (method, path, { body, headers = {}, raw, contentType } = {}) => {
    const options = { method, headers: { ...headers }, timeoutMs: 20000 };
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

  const H = { 'x-device-id': DEVICE };
  const start = async (language, uiLanguage) =>
    (await call('POST', '/api/calls', { headers: H, body: { language, uiLanguage } })).json.data;
  const say = async (id, transcript, language = 'en') =>
    (await call('POST', `/api/calls/${id}/turns?language=${language}&transcript=${encodeURIComponent(transcript)}`, {
      headers: H,
      raw: Buffer.alloc(0),
    })).json.data;

  // ------------------------------------------------------- picking up the call
  console.log('\nThe AI picks up');

  const en = await start('en', 'en');
  check('a call starts and is connected', en.status === 'connected' && Boolean(en.id), en.status);
  check('the greeting is in English', en.greeting.language === 'en' && /Namaskara/i.test(en.greeting.text));
  check('the phone is told how long to ring', en.pickupDelayMs > 0, en.pickupDelayMs);
  check('the call lists the languages it can hold', (en.supportedLanguages || []).length >= 11);
  check('the call says which languages have full answers',
    JSON.stringify(en.contentLanguages) === '["en","hi","kn"]', en.contentLanguages);

  const hiCall = await start('hi', 'hi');
  check('a Hindi call is greeted in Hindi', hiCall.greeting.language === 'hi' && hasDevanagari(hiCall.greeting.text));
  const knCall = await start('kn', 'kn');
  check('a Kannada call is greeted in Kannada', knCall.greeting.language === 'kn' && hasKannada(knCall.greeting.text));
  const taCall = await start('ta', 'ta');
  check('a Tamil call is greeted in Tamil', taCall.greeting.language === 'ta' && hasTamil(taCall.greeting.text));
  const noDevice = await call('POST', '/api/calls', { body: { language: 'en' } });
  check('a call needs a device id', noDevice.status === 400, noDevice.status);

  // -------------------------------------------------------------- conversation
  console.log('\nConversation');

  const c1 = await start('en', 'en');
  const hello = await say(c1.id, 'hello');
  check('"hello" is answered as conversation', hello.kind === 'conversation' && hello.intent === 'greeting');
  const who = await say(c1.id, 'who are you');
  check('"who are you" introduces the assistant', who.kind === 'conversation' && /GramSahayak/i.test(who.answer));
  const helloQuestion = await say(c1.id, 'hello, what is pm kisan');
  check('a greeting followed by a question is treated as a question',
    helloQuestion.kind === 'knowledge' && helloQuestion.grounded === true, helloQuestion.kind);
  const bye = await say(c1.id, 'bye');
  check('"bye" ends the call', bye.endCall === true && bye.status === 'ended');
  const afterEnd = await call('POST', `/api/calls/${c1.id}/turns?transcript=hello`, { headers: H, raw: Buffer.alloc(0) });
  check('a turn after the call ended is refused', afterEnd.status === 409, afterEnd.status);

  // ------------------------------------------------------------- answer quality
  console.log('\nAnswers that are apt, not just correct');

  const c2 = await start('en', 'en');
  const pm = await say(c2.id, 'how do I apply for pm kisan');
  check('a scheme question is answered from the knowledge base',
    pm.kind === 'knowledge' && pm.grounded === true, { kind: pm.kind, grounded: pm.grounded });
  check('the spoken answer is shorter than the full entry',
    pm.answer.length < pm.answerFull.length, { spoken: pm.answer.length, full: pm.answerFull.length });
  check('the spoken answer is short enough to listen to', pm.answer.split(/\s+/).length <= 70, pm.answer.split(/\s+/).length);
  check('the full answer is still available for reading', pm.answerFull.length > pm.answer.length);
  check('the call says there is more to hear', pm.moreAvailable === true, pm.moreAvailable);
  check('sources and the fact date ride along', (pm.trustedSources || []).length > 0 && Boolean(pm.fact && pm.fact.asOf));

  const more = await say(c2.id, 'tell me more');
  check('"tell me more" continues the same answer', more.kind === 'more' && more.answer.length > 20, more.kind);
  check('the continuation is different text', more.answer !== pm.answer);

  const knFever = await say((await start('kn', 'kn')).id, 'ನನ್ನ ಮಗುವಿಗೆ ಜ್ವರ ಇದೆ', 'kn');
  check('a Kannada medical question is answered in Kannada',
    knFever.language === 'kn' && knFever.grounded === true && hasKannada(knFever.answer), knFever.kind);
  check('a normal medical answer adds a caution rather than an alarm',
    knFever.kind === 'medical-answer' && /108/.test(knFever.answer), knFever.kind);

  // A short follow-up must resolve against the previous question.
  const c3 = await start('en', 'en');
  const first = await say(c3.id, 'how do I apply for pm kisan');
  const followUp = await say(c3.id, 'aur kitna');
  check('a short follow-up reuses the previous question',
    Boolean(followUp.contextualQuestion) && followUp.grounded === true,
    { contextual: followUp.contextualQuestion, grounded: followUp.grounded });
  check('the follow-up lands on the same topic', followUp.matchedKey === first.matchedKey,
    { first: first.matchedKey, follow: followUp.matchedKey });

  // The follow-up above landed on the same entry, so it should have carried on
  // with the rest of that answer rather than repeating the first sentences.
  check('a follow-up on the same entry continues instead of repeating',
    followUp.continued === true && followUp.answer !== first.answer,
    { continued: followUp.continued, same: followUp.answer === first.answer });

  // ---------------------------------------------------- unsure medical -> 108
  console.log('\nUnsure or urgent medical questions are redirected');

  const chest = await say(c2.id, 'my father has chest pain and is sweating');
  check('chest pain is treated as an emergency', chest.kind === 'emergency', chest.kind);
  check('the emergency answer says 108', /108/.test(chest.answer));
  check('the redirect names the ambulance number', chest.redirect && chest.redirect.primary === '108');
  check('the emergency answer is marked urgent', chest.urgency === 'urgent');
  check('safe first aid is given with the redirect', /Sit the person up/i.test(chest.answer), chest.answer.slice(-80));

  const chestHi = await say((await start('hi', 'hi')).id, 'मेरे पिता को छाती में दर्द हो रहा है', 'hi');
  check('the Hindi emergency answer is in Hindi', hasDevanagari(chestHi.answer) && /108/.test(chestHi.answer));

  const harm = await say(c2.id, 'i am thinking about suicide');
  check('thoughts of self-harm are answered with the mental health line',
    harm.kind === 'mental-health-crisis' && /14416/.test(harm.answer), harm.kind);

  const dose = await say(c2.id, 'how many tablets should i take for fever');
  check('a dose question is refused', dose.kind === 'dose-refusal', dose.kind);
  check('the refusal never states a dose', !/\d+\s*(mg|ml|tablet|goli)/i.test(dose.answer), dose.answer);
  check('the dose refusal points to 104', /104/.test(dose.answer) && dose.redirect.primary === '104');

  const unsure = await say(c2.id, 'my knee is swollen and i cannot walk since yesterday');
  check('a medical question with no verified answer is redirected, not guessed',
    unsure.kind === 'medical-uncertain' && /104/.test(unsure.answer), unsure.kind);

  const paris = await say(c2.id, 'what is the capital of france');
  check('an off-topic question is not invented', paris.grounded === false && paris.kind === 'not-found', paris.kind);

  // ---------------------------------------------------------- other languages
  console.log('\nAny language');

  const tamil = await say(c2.id, 'என் அம்மாவுக்கு காய்ச்சல் இருக்கு', 'ta');
  check('a Tamil question is answered in the call, in Tamil', tamil.language === 'ta' && hasTamil(tamil.answer), tamil.language);
  check('the Tamil answer says the full explanation is in English for now',
    /ஆங்கிலம்|இந்தி|கன்னட/.test(tamil.answer), tamil.answer.slice(0, 50));

  // ------------------------------------------------------- numbers in a call
  console.log('\nNumbers said out loud');

  const amount = await say(c2.id, 'pm kisan gives 6000 rupaye when');
  check('an amount in the question is picked up', (amount.heardNumbers || []).some((n) => n.value === 6000),
    amount.heardNumbers && amount.heardNumbers.map((n) => n.value));
  check('the call reads the amount back before moving on', /is this correct/i.test(amount.answer), amount.answer.slice(-90));
  check('the answer is split for speech', (amount.answerSpeech || []).some((s) => s.type === 'amount'));

  // ------------------------------------------------------------- audio turns
  console.log('\nSpeaking instead of typing');

  const c5 = await start('en', 'en');
  fake.state.transcript = 'how do I open a bank account';
  const audioTurn = await call('POST', `/api/calls/${c5.id}/turns`, {
    headers: H, raw: Buffer.alloc(2048, 3), contentType: 'audio/mp4',
  });
  const at = audioTurn.json.data || {};
  check('recorded audio is transcribed', at.transcript === 'how do I open a bank account', at.transcript);
  check('the transcript is answered', at.grounded === true && at.answer.length > 20);

  fake.state.transcript = 'मेरे पिता को सांस लेने में तकलीफ है';
  const audioHindi = await call('POST', `/api/calls/${c5.id}/turns`, {
    headers: H, raw: Buffer.alloc(1024, 4), contentType: 'audio/mp4',
  });
  check('an audio emergency is caught and answered in Hindi',
    audioHindi.json.data.kind === 'emergency' && hasDevanagari(audioHindi.json.data.answer),
    audioHindi.json.data.kind);

  // ------------------------------------------- transcription for offline clips
  console.log('\nTranscribing a clip recorded while offline');

  fake.state.transcript = 'ಅಕ್ಕಿ ಕಾರ್ಡ್ ಹೇಗೆ ಪಡೆಯುವುದು';
  const tr = await call('POST', '/api/transcribe?language=kn', {
    headers: H, raw: Buffer.alloc(1500, 5), contentType: 'audio/mp4',
  });
  check('a clip can be transcribed on its own', tr.json.data.transcript === 'ಅಕ್ಕಿ ಕಾರ್ಡ್ ಹೇಗೆ ಪಡೆಯುವುದು', tr.json.data.transcript);
  check('the transcription reports its provider', Boolean(tr.json.data.provider), tr.json.data.provider);

  const trEmpty = await call('POST', '/api/transcribe?language=hi', {
    headers: H, raw: Buffer.alloc(0), contentType: 'audio/mp4',
  });
  check('an empty clip is rejected', trEmpty.status === 400, trEmpty.status);

  // ------------------------------------------------------- reading the call back
  console.log('\nEnding the call');

  const readBack = await call('GET', `/api/calls/${c5.id}`, { headers: H });
  check('the call can be read back with its turns',
    readBack.json.data.turns.length >= 2 && readBack.json.data.status === 'connected', readBack.json.data.turns.length);
  const ended = await call('DELETE', `/api/calls/${c5.id}`, { headers: H });
  check('ending a call reports its length', ended.json.data.status === 'ended' && ended.json.data.durationSeconds >= 0);
  check('the farewell is in the caller\'s language', Boolean(ended.json.data.farewell), ended.json.data.farewell);
  const unknownCall = await call('GET', '/api/calls/does-not-exist', { headers: H });
  check('an unknown call returns 404', unknownCall.status === 404, unknownCall.status);

  const health = await call('GET', '/api/health');
  check('health advertises the call and transcribe features',
    health.json.features.call === true && health.json.features.transcribe === true, health.json.features);

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
  console.error('call test crashed:', err);
  process.exit(1);
});
