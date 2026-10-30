/**
 * npm run bench
 *
 * Measures the answer path against the in-memory store, with no network and no
 * model rewrite, so the number reflects retrieval and the store layer only.
 *
 * Three numbers matter:
 *   cold  — a question the cache has never seen. This is the honest cost of
 *           retrieval and is what grows if the knowledge base grows.
 *   warm  — the same question again, which is what a village desk or a voice
 *           session mostly does.
 *   build — the one-off cost of indexing the corpus, paid on the first
 *           question after a store refresh rather than on every question.
 *
 * Run it after `npm run seed` when changing content, to confirm that adding
 * entries did not make every question slower.
 */
process.env.MONGODB_URI = '';
process.env.BEDROCK_MODEL_ID = '';

const { loadConfig } = require('../src/config/env');
const { createStore } = require('../src/store');
const { answerFromKnowledge, answerCacheStats } = require('../src/services/answer');
const { indexStats } = require('../src/services/retrieval');
const { manifestStats } = require('../src/services/freshness');

const LANGS = ['en', 'hi', 'kn'];
const BASE_QUESTIONS = [
  'what should I do if my child has fever',
  'गर्भवती महिला को कौन से जांच करानी चाहिए',
  'ಅಕ್ಕಿ ಕಾರ್ಡ್ ಹೇಗೆ ಪಡೆಯುವುದು',
  'how much money does pm kisan give',
  'someone asked for my otp on the phone',
  'old age pension apply',
  'ನನ್ನ ಮಗುವಿಗೆ ಲಸಿಕೆ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ',
  'rtc pahani land record mutation',
  'mudra loan for small shop',
  'snake bite first aid',
  'dog bite what to do',
  'e shram card registration',
  'how to get a birth certificate',
  'free legal aid lawyer',
  'crop insurance claim after rain damage',
  'tap water connection at home',
];

/** Enough distinct phrasings that the repeat-question cache cannot help. */
function questionVariants(n) {
  const suffixes = [
    '', ' please', ' in my village', ' for my family', ' today',
    ' step by step', ' in karnataka', ' for a farmer', ' urgently', ' at the panchayat',
  ];
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const base = BASE_QUESTIONS[i % BASE_QUESTIONS.length];
    const suffix = suffixes[Math.floor(i / BASE_QUESTIONS.length) % suffixes.length];
    out.push({ question: `${base}${suffix}`, language: LANGS[i % 3], category: 'general' });
  }
  return out;
}

async function timeRun(ctx, inputs) {
  const started = process.hrtime.bigint();
  for (const input of inputs) await answerFromKnowledge(ctx, input);
  const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
  return elapsed / inputs.length;
}

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  const ctx = { store, config, speech: null };

  const all = await store.knowledge.all();
  const schemes = await store.schemes.all();
  const cold = questionVariants(150);

  // First call pays for indexing the corpus.
  const firstStart = process.hrtime.bigint();
  await answerFromKnowledge(ctx, cold[0]);
  const firstMs = Number(process.hrtime.bigint() - firstStart) / 1e6;

  const coldMs = await timeRun(ctx, cold);
  const warmInputs = cold.slice(0, 50);
  const warmMs = await timeRun(ctx, warmInputs);

  const started = process.hrtime.bigint();
  for (const q of warmInputs) await answerFromKnowledge(ctx, q);
  const throughput = warmInputs.length / (Number(process.hrtime.bigint() - started) / 1e9);

  console.log('');
  console.log(`knowledge entries : ${all.length}`);
  console.log(`schemes           : ${schemes.length}`);
  console.log(`first answer      : ${firstMs.toFixed(2)} ms (includes building the index)`);
  console.log(`cold question     : ${coldMs.toFixed(2)} ms  <- retrieval cost`);
  console.log(`warm question     : ${warmMs.toFixed(2)} ms  <- cache hit`);
  console.log(`throughput        : ${throughput.toFixed(0)} answers/sec`);
  console.log('');
  console.log('index             :', JSON.stringify(indexStats()));
  console.log('manifest          :', JSON.stringify(manifestStats()));
  console.log('answer cache      :', JSON.stringify(answerCacheStats()));
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
