// Hurdle 3 tests: stale knowledge, code-mixed language, number read-back.
// Pure logic only - no database, no network, no AI. Run: npm run test:hurdle3
const test = require('node:test');
const assert = require('node:assert/strict');

const fresh = require('../src/services/freshness.service');
const lang = require('../src/services/lang.service');
const numbers = require('../src/services/numbers.service');
const gate = require('../src/services/gate.service');

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

// ------------------------------------------------------------------ 1. STALE KNOWLEDGE
test('freshness: a pack downloaded 5 days ago is fresh and says nothing', () => {
  const f = fresh.freshnessOf({ asOf: daysAgo(5), kind: 'scheme_rule' });
  assert.equal(f.state, 'fresh');
  assert.equal(f.disclose, false);
  assert.equal(f.ageDays, 5);
});

test('freshness: an amount older than its shelf life is expired and may not be quoted', () => {
  const f = fresh.freshnessOf({ asOf: daysAgo(45), kind: 'scheme_amount' });
  assert.equal(f.state, 'expired');
  assert.equal(f.disclose, true);
  assert.deepEqual(f.restrict, ['amount']);
  assert.ok(f.confidenceCap <= 0.4);
});

test('freshness: between 60% and 100% of the shelf life the fact is stale, still quotable', () => {
  const f = fresh.freshnessOf({ asOf: daysAgo(14), kind: 'scheme_amount' }); // shelf 21
  assert.equal(f.state, 'stale');
  assert.equal(f.disclose, true);
  assert.deepEqual(f.restrict, []);
});

test('freshness: a passed deadline expires the fact even if it was checked yesterday', () => {
  const f = fresh.freshnessOf({ asOf: daysAgo(1), validUntil: daysAgo(2), kind: 'scholarship_deadline' });
  assert.equal(f.state, 'expired');
  assert.ok(f.daysLeft < 0);
});

test('freshness: a fact with no checked date is never called fresh', () => {
  const f = fresh.freshnessOf({ kind: 'health_advice' });
  assert.equal(f.state, 'stale');
  assert.equal(f.unknown, true);
});

test('freshness: health advice lasts longer than a rupee amount, on purpose', () => {
  const advice = fresh.freshnessOf({ asOf: daysAgo(70), kind: 'health_advice' }); // shelf 90
  const amount = fresh.freshnessOf({ asOf: daysAgo(70), kind: 'scheme_amount' }); // shelf 21
  assert.notEqual(advice.state, amount.state);
  assert.equal(advice.state, 'stale');
  assert.equal(amount.state, 'expired');
});

test('freshness: an expired amount is removed from the answer, not left to be believed', () => {
  const answer = {
    answer: 'PM-Kisan gives ₹6,000 per year to farmers.',
    language: 'en',
    confidence: { level: 'high', score: 0.9, lowConfidence: false },
  };
  const record = { slug: 'pm-kisan', eligibility: { requiresLand: true }, benefits: { en: '₹6,000 per year' }, updatedAt: daysAgo(50) };
  const out = fresh.applyToAnswer(answer, [record], { language: 'en' });
  assert.equal(out.freshness.state, 'expired');
  assert.ok(!/₹6,000/.test(out.answer), 'the stale amount must not survive');
  assert.match(out.answer, /out of date/);
  assert.equal(out.confidence.score, 0.35);
  assert.equal(out.confidence.level, 'low');
  assert.equal(out.confidence.cappedByFreshness, 'expired');
});

test('freshness: a fresh answer keeps its confidence and gets no lecture', () => {
  const answer = { answer: 'Wash hands with soap.', language: 'en', confidence: { level: 'high', score: 0.9, lowConfidence: false } };
  const out = fresh.applyToAnswer(answer, [{ slug: 'handwash', content: { en: 'x' }, category: 'hygiene', updatedAt: daysAgo(3) }], { language: 'en' });
  assert.equal(out.freshness.state, 'fresh');
  assert.equal(out.confidence.score, 0.9);
  assert.equal(out.answer, 'Wash hands with soap.');
});

test('pack: the manifest is a stable receipt, and any change breaks the hash', () => {
  const records = [
    { slug: 'pm-kisan', version: 1, benefits: { en: '₹6,000 per year' }, updatedAt: '2026-01-01T00:00:00Z' },
    { slug: 'fever-care', category: 'health', content: { en: 'rest' }, updatedAt: '2026-01-01T00:00:00Z' },
  ];
  const a = fresh.manifestOf(records);
  const b = fresh.manifestOf(records);
  assert.equal(a.packId, b.packId);
  const known = Object.fromEntries(a.items.map((i) => [i.slug, i.hash]));

  const unchanged = fresh.deltaFor(known, records);
  assert.equal(unchanged.changed.length, 0);
  assert.equal(unchanged.removed.length, 0);

  const edited = [{ ...records[0], benefits: { en: '₹7,000 per year' } }, records[1]];
  const changed = fresh.deltaFor(known, edited);
  assert.equal(changed.changed.length, 1);
  assert.equal(changed.changed[0].slug, 'pm-kisan');

  const removed = fresh.deltaFor(known, [records[0]]);
  assert.deepEqual(removed.removed, ['fever-care']);
});

test('pack: a changed amount is reported as a money change, in the person\'s language', () => {
  const before = { slug: 'pm-kisan', name: { en: 'PM-Kisan', hi: 'पीएम किसान', kn: 'ಪಿಎಂ ಕಿಸಾನ್' }, benefits: { en: '₹6,000 per year', hi: '₹6,000 प्रति वर्ष', kn: '₹6,000 ವರ್ಷಕ್ಕೆ' }, eligibility: { maxAnnualIncome: 200000 } };
  const after = { slug: 'pm-kisan', name: before.name, benefits: { en: '₹7,000 per year', hi: '₹7,000 प्रति वर्ष', kn: '₹7,000 ವರ್ಷಕ್ಕೆ' }, eligibility: { maxAnnualIncome: 250000 } };

  const d = fresh.diffRecords(before, after, { language: 'en' });
  const fields = d.changes.map((c) => c.field);
  assert.ok(fields.includes('maxAnnualIncome'), 'the income limit change must be caught');
  assert.ok(fields.includes('benefits'), 'the amount change must be caught');

  const money = d.changes.find((c) => c.field === 'benefits');
  assert.deepEqual(money.fromValues, [6000]);
  assert.deepEqual(money.toValues, [7000]);

  const card = fresh.whatChanged([d], { language: 'en', names: { 'pm-kisan': before.name } });
  assert.equal(card.moneyChanged, true);
  assert.match(card.text, /6,000/);
  assert.match(card.text, /7,000/);
  assert.match(card.text, /PM-Kisan/);

  const kn = fresh.whatChanged([d], { language: 'kn', names: { 'pm-kisan': before.name } });
  assert.match(kn.headline, /ಬದಲಾಗಿವೆ/);
});

test('pack: an unchanged record produces no diff noise', () => {
  const rec = { slug: 'x', benefits: { en: '₹6,000 per year' }, eligibility: { minAge: 18 } };
  const d = fresh.diffRecords(rec, JSON.parse(JSON.stringify(rec)));
  assert.equal(d.changes.length, 0);
  assert.equal(fresh.whatChanged([d]).count, 0);
});

// ------------------------------------------------------------------ 2. CODE-MIXED LANGUAGE
test('language: one sentence in three scripts is detected as mixed', () => {
  const text = 'PM kisan योजना के लिए कौन documents लगते हैं';
  const p = lang.profile(text);
  assert.equal(p.mixed, true);
  assert.ok(p.scripts.includes('latin'));
  assert.ok(p.scripts.includes('devanagari'));
});

test('language: a single-language sentence is not called mixed', () => {
  assert.equal(lang.profile('मुझे बुखार है और दवा चाहिए').mixed, false);
  assert.equal(lang.profile('I have fever since two days').mixed, false);
});

test('language: romanised, Devanagari and Kannada words land on the same concept', () => {
  for (const word of ['kisaan', 'kisan', 'किसान', 'ರೈತ', 'ryot']) {
    const c = lang.conceptOf(word);
    assert.ok(c, `${word} should be understood`);
    assert.equal(c.concept, 'farmer', `${word} should map to farmer`);
  }
});

test('language: recogniser spelling drift still finds the concept', () => {
  assert.equal(lang.conceptOf('yojna').concept, 'scheme');
  assert.equal(lang.conceptOf('sabsidi').concept, 'subsidy');
  assert.equal(lang.conceptOf('schoarship').concept, 'scholarship');
  assert.equal(lang.conceptOf('vayassu').concept, 'age');
});

test('language: scheme names survive transliteration and script change', () => {
  assert.equal(lang.conceptOf('kisan samman nidhi').concept, 'pm-kisan');
  assert.equal(lang.conceptOf('पीएम किसान').concept, 'pm-kisan');
  assert.equal(lang.conceptOf('ಪಿಎಂ ಕಿಸಾನ್').concept, 'pm-kisan');
});

test('language: canonicalise turns a mixed sentence into one searchable form', () => {
  const { concepts, expanded } = lang.canonicalize('PM kisan योजना के लिए कौन documents लगते हैं');
  assert.ok(concepts.includes('pm-kisan'));
  assert.ok(concepts.includes('scheme'));
  assert.ok(concepts.includes('documents'));
  assert.ok(expanded.length > 0);
});

test('language: the answer follows the dominant script, and keeps the person\'s own words', () => {
  const policy = lang.replyPolicy('PM kisan योजना में मेरी income कितनी होनी चाहिए भाई', 'en');
  assert.equal(policy.mixed, true);
  assert.equal(policy.language, 'hi');
  assert.ok(policy.preserve.some((p) => p.slug === 'pm-kisan'));
});

test('language: a reply is split so each script gets its own voice', () => {
  const segs = lang.speechSegments('PM Kisan ಯೋಜನೆಗೆ ಅರ್ಜಿ ಹಾಕಿ, ₹6,000 ಸಿಗುತ್ತದೆ', 'kn');
  assert.ok(segs.length >= 2);
  const langs = segs.map((s) => s.language);
  assert.ok(langs.includes('en'));
  assert.ok(langs.includes('kn'));
  assert.ok(segs.every((s) => s.locale === 'en-IN' || s.locale === 'kn-IN'));
});

test('language: the speech recogniser is given the vocabulary it keeps getting wrong', () => {
  const prompt = lang.sttPrompt('kn');
  assert.match(prompt, /ಕಿಸಾನ್/);
  assert.match(prompt, /ಸಾವಿರ/);
});

// ------------------------------------------------------------------ 3. NUMBER READ-BACK
test('numbers: Indian scale words in any script give the right value', () => {
  assert.equal(numbers.parseNumbers('meri income 1 lakh 20 hajar hai')[0].value, 120000);
  assert.equal(numbers.parseNumbers('आय 1 लाख 20 हज़ार')[0].value, 120000);
  assert.equal(numbers.parseNumbers('1.2 lakh income')[0].value, 120000);
  assert.equal(numbers.parseNumbers('do hazar panch sau rupaye')[0].value, 2500);
});

test('numbers: Devanagari and Kannada digits are read as digits', () => {
  assert.equal(numbers.parseNumbers('income ५०००')[0].value, 5000);
  assert.equal(numbers.parseNumbers('income ೫೦೦೦')[0].value, 5000);
});

test('numbers: a number said in Kannada words is understood', () => {
  const n = numbers.parseNumbers('ನನ್ನ ಆದಾಯ ಐವತ್ತು ಸಾವಿರ')[0];
  assert.equal(n.value, 50000);
});

test('numbers: money is recognised as money, and age as age', () => {
  assert.equal(numbers.parseNumbers('meri income 1 lakh hai')[0].kind, 'money');
  assert.equal(numbers.parseNumbers('my age is 45')[0].kind, 'age');
  assert.equal(numbers.parseNumbers('मेरी उम्र 45 साल है')[0].kind, 'age');
});

test('numbers: money is always read back, a count never is', () => {
  const money = numbers.parseNumbers('income 1 lakh')[0];
  const count = numbers.parseNumbers('2 acres land')[0];
  assert.equal(numbers.needsConfirmation(money), true);
  assert.equal(numbers.needsConfirmation(count), false);
});

test('numbers: a 10x jump against the saved profile is flagged, not believed', () => {
  const entry = { value: 12000, kind: 'money' };
  const flags = numbers.plausibility(entry, { annualIncome: 120000 });
  assert.ok(flags.some((f) => f.code === 'tenfold-change'));
});

test('numbers: a plausible amount raises no flag', () => {
  assert.deepEqual(numbers.plausibility({ value: 130000, kind: 'money' }, { annualIncome: 120000 }), []);
});

test('numbers: the alternatives offered are the ones speech actually confuses', () => {
  const cands = numbers.confusionCandidates({ value: 50000, kind: 'money', sawScale: true });
  assert.ok(cands.length <= 2, 'never a wall of choices');
  assert.ok(cands.some((c) => c.value === 5000 || c.value === 500000 || c.value === 100000));
});

test('numbers: the read-back says the value in words and offers the alternative', () => {
  const rb = numbers.readBack({ value: 50000, kind: 'money' }, { language: 'kn', alternatives: [{ value: 15000, reason: 'sounds-alike' }] });
  assert.match(rb.text, /50,000/);
  assert.match(rb.text, /50 ಸಾವಿರ/);
  assert.match(rb.text, /15,000/);
  assert.equal(rb.buttons.confirm, 'ಹೌದು, ಸರಿ');
});

test('numbers: Indian digit grouping is used on screen', () => {
  assert.equal(numbers.groupIndian(120000), '1,20,000');
  assert.equal(numbers.groupIndian(6000), '6,000');
  assert.equal(numbers.groupIndian(12500000), '1,25,00,000');
});

// ------------------------------------------------------------------ the gate
test('gate: a money question is stopped for read-back before any verdict', () => {
  const out = gate.preflight({ question: 'meri income 1 lakh hai, kya main eligible hoon', language: 'en', profile: {} });
  assert.equal(out.proceed, false);
  assert.equal(out.confirmation.required, true);
  assert.equal(out.confirmation.cards.length, 1);
  assert.equal(out.confirmation.cards[0].field, 'annualIncome');
  assert.match(out.confirmation.text, /1,00,000/);
});

test('gate: a question with no dangerous number goes straight through', () => {
  const out = gate.preflight({ question: 'I have fever since two days', language: 'en' });
  assert.equal(out.proceed, true);
});

test('gate: "yes" turns the heard value into a confirmed profile value', () => {
  const pre = gate.preflight({ question: 'meri income 1 lakh hai', language: 'hi', profile: { age: 40 } });
  const res = gate.resolveConfirmation(pre.confirmation.id, { action: 'confirm' });
  assert.equal(res.ok, true);
  assert.equal(res.confirmed.annualIncome, 100000);
  assert.equal(res.profile.age, 40, 'the rest of the profile is kept');
  assert.equal(res.language, 'hi');
});

test('gate: a correction wins over what was heard', () => {
  const pre = gate.preflight({ question: 'meri income 1 lakh hai', language: 'hi' });
  const res = gate.resolveConfirmation(pre.confirmation.id, { action: 'correct', corrected: { annualIncome: 60000 } });
  assert.equal(res.profile.annualIncome, 60000);
});

test('gate: a confirmation cannot be reused', () => {
  const pre = gate.preflight({ question: 'income 50000', language: 'en' });
  assert.equal(gate.resolveConfirmation(pre.confirmation.id, {}).ok, true);
  assert.equal(gate.resolveConfirmation(pre.confirmation.id, {}).ok, false);
});

test('gate: the finished answer carries freshness, understanding and speakable pieces', () => {
  const ctx = { question: 'PM kisan योजना में income limit kya hai', language: 'hi', policy: lang.replyPolicy('PM kisan योजना में income limit kya hai', 'hi'), numbers: numbers.parseNumbers('income 2 lakh') };
  const result = { answer: 'सीमा ₹2,00,000 है।', language: 'hi', confidence: { level: 'high', score: 0.9, lowConfidence: false }, matches: [{ slug: 'pm-kisan', name: 'पीएम किसान' }] };
  const record = { slug: 'pm-kisan', eligibility: { maxAnnualIncome: 200000 }, updatedAt: daysAgo(40) };
  const out = gate.decorate(result, ctx, [record], { language: 'hi' });
  assert.equal(out.freshness.state, 'expired');
  assert.ok(out.confidence.score < 0.9);
  assert.ok(out.understanding, 'the interpretation is shown back');
  assert.match(out.understanding.text, /पीएम किसान/);
  assert.ok(Array.isArray(out.speechSegments) && out.speechSegments.length > 0);
  assert.equal(out.language, 'hi');
});

// ------------------------------------------------------------------ safety details
test('freshness: the person\'s own confirmed amount is never scrubbed with the stale one', () => {
  const text = 'It gives ₹6,000 a year. Your own income is ₹1,50,000.';
  const out = fresh.stripAmounts(text, 'en', [150000]);
  assert.ok(!out.includes('₹6,000'), 'the cached benefit must go');
  assert.ok(out.includes('₹1,50,000'), 'their own confirmed income must stay');
});

test('numbers: dedh lakh against do lakh is offered as the alternative that matters', () => {
  const cands = numbers.confusionCandidates({ value: 250000, kind: 'money', sawScale: true });
  assert.equal(cands[0].value, 150000);
  assert.ok(cands.every((c) => c.value <= 2000000), 'nothing absurd as a "yearly income"');
});

test('gate: after read-back the understanding line shows the confirmed value, not the heard one', () => {
  const pre = gate.preflight({ question: 'meri income 2 lakh 50 hajar hai', language: 'hi', profile: {} });
  assert.equal(pre.confirmation.cards[0].value, 250000);
  const res = gate.resolveConfirmation(pre.confirmation.id, { action: 'correct', corrected: { annualIncome: 150000 } });
  const u = gate.understanding({ ...pre.ctx, ...res.ctxPatch });
  assert.match(u.text, /1,50,000/);
  assert.ok(!/2,50,000/.test(u.text));
});

test('gate: an expired record does not scrub the confirmed income out of the answer', () => {
  const ctx = { language: 'en', confirmed: { annualIncome: 150000 }, numbers: [] };
  const result = { answer: 'PM-Kisan pays ₹6,000 a year. Your income is ₹1,50,000, so you are eligible.', language: 'en', confidence: { level: 'high', score: 0.9 } };
  const out = gate.decorate(result, ctx, [{ slug: 'pm-kisan', eligibility: {}, benefits: { en: '₹6,000' }, updatedAt: daysAgo(47) }]);
  assert.ok(out.answer.includes('₹1,50,000'));
  assert.ok(!out.answer.includes('₹6,000'));
  assert.equal(out.freshness.state, 'expired');
});
