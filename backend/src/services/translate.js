/**
 * Optional translation, so a caller can speak Tamil or Bengali and still get a
 * full answer.
 *
 * The knowledge base is written in English, Hindi and Kannada. When a caller
 * speaks another language we translate the question into English, answer it,
 * and translate the answer back — but only if a Sarvam key is configured. With
 * no key the call still works: the answer comes in English and the assistant
 * says so in the caller's language, which is honest and better than a machine
 * translation of unknown quality.
 *
 * Sarvam AI translate: POST https://api.sarvam.ai/translate
 * { input, source_language_code, target_language_code, model }
 * -> { translated_text }
 */
const { request } = require('./http');
const { PROVIDER_CODES } = require('../data/languages');

const CACHE_LIMIT = 400;

function codeOf(lang, fallback = 'en-IN') {
  return PROVIDER_CODES[lang] || fallback;
}

function createTranslator(config) {
  const cache = new Map();
  const enabled = Boolean(config && config.sarvamApiKey);
  const url = (config && config.translateUrl) || 'https://api.sarvam.ai/translate';
  const model = (config && config.translateModel) || 'mayura:v1';

  async function call(input, source, target) {
    const key = `${source}>${target}:${input}`;
    if (cache.has(key)) return cache.get(key);
    const res = await request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-subscription-key': config.sarvamApiKey,
      },
      body: JSON.stringify({
        input,
        source_language_code: source,
        target_language_code: target,
        model,
        enable_preprocessing: true,
      }),
      timeoutMs: config.speechTimeoutMs || 20000,
    });
    if (!res.ok) throw new Error(`translate failed (${res.status})`);
    const json = res.json() || {};
    const out = String(json.translated_text || json.output || '').trim();
    if (!out) throw new Error('translate returned nothing');
    if (cache.size > CACHE_LIMIT) cache.clear();
    cache.set(key, out);
    return out;
  }

  return {
    enabled,
    /** Translate any language into English for reasoning. */
    async toEnglish(input, fromLang) {
      if (!enabled) return null;
      const text = String(input || '').trim();
      if (!text) return null;
      const source = fromLang === 'en' ? 'en-IN' : (PROVIDER_CODES[fromLang] || 'auto');
      try {
        return await call(text, source, 'en-IN');
      } catch (err) {
        console.warn('[translate] toEnglish failed:', err.message);
        return null;
      }
    },
    /** Translate an English answer back into the caller's language. */
    async fromEnglish(input, toLang) {
      if (!enabled) return null;
      if (toLang === 'en') return String(input || '');
      const text = String(input || '').trim();
      if (!text) return null;
      try {
        return await call(text, 'en-IN', codeOf(toLang));
      } catch (err) {
        console.warn('[translate] fromEnglish failed:', err.message);
        return null;
      }
    },
  };
}

module.exports = { createTranslator, codeOf };
