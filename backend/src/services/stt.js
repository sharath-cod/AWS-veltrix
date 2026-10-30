/**
 * Speech-to-text providers that work over plain HTTPS, so the voice screen
 * works without an AWS account.
 *
 * Three providers are supported, all behind one shape:
 *   { text, provider }
 *
 *   sarvam  — Sarvam AI (Indian languages, one call, no S3 bucket needed).
 *             Needs SARVAM_API_KEY.
 *   http    — any OpenAI-compatible /audio/transcriptions endpoint (OpenAI
 *             Whisper, Groq Whisper, a self-hosted Whisper, etc.).
 *             Needs STT_HTTP_URL and STT_HTTP_API_KEY.
 *   aws     — Amazon Transcribe via S3, implemented in aws-speech.js.
 *
 * Nothing here throws on a missing key: the caller (services/speech.js) decides
 * the order and the fallback. No dependencies — multipart is built by hand.
 */
const crypto = require('crypto');
const { request } = require('./http');

/** Languages the app supports, mapped to what the providers expect. */
const SARVAM_LANGUAGE = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

/** File extension a provider expects for the recorded audio. */
const EXTENSION = {
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/amr': 'amr',
};

function extensionFor(contentType) {
  return EXTENSION[(contentType || '').split(';')[0].trim()] || 'm4a';
}

/**
 * Build a multipart/form-data body without any dependency.
 * @param {Array<{name: string, value?: string, buffer?: Buffer, filename?: string, contentType?: string}>} parts
 */
function buildMultipart(parts) {
  const boundary = `----gramsahayak${crypto.randomBytes(8).toString('hex')}`;
  const chunks = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    if (part.buffer) {
      chunks.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename || 'audio.m4a'}"\r\n`,
        ),
      );
      chunks.push(Buffer.from(`Content-Type: ${part.contentType || 'application/octet-stream'}\r\n\r\n`));
      chunks.push(part.buffer);
      chunks.push(Buffer.from('\r\n'));
    } else {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${part.name}"\r\n\r\n`));
      chunks.push(Buffer.from(String(part.value == null ? '' : part.value)));
      chunks.push(Buffer.from('\r\n'));
    }
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

/** Pull a transcript out of the several response shapes in the wild. */
function transcriptFrom(json) {
  if (!json) return '';
  return String(
    json.transcript || json.text || json.output || (json.data && (json.data.transcript || json.data.text)) || '',
  ).trim();
}

/**
 * Sarvam AI speech-to-text.
 * Docs shape: POST {SARVAM_STT_URL} with multipart file + model + language_code,
 * header api-subscription-key. Response: { transcript, language_code, ... }
 */
async function transcribeSarvam({ audio, contentType, language, config }) {
  const url = config.sarvamSttUrl || 'https://api.sarvam.ai/speech-to-text';
  const model = config.sarvamSttModel || 'saarika:v2.5';
  const { body, contentType: multipartType } = buildMultipart([
    { name: 'file', buffer: audio, filename: `turn.${extensionFor(contentType)}`, contentType: contentType || 'audio/mp4' },
    { name: 'model', value: model },
    { name: 'language_code', value: SARVAM_LANGUAGE[language] || 'unknown' },
  ]);

  const res = await request(url, {
    method: 'POST',
    headers: {
      'content-type': multipartType,
      'api-subscription-key': config.sarvamApiKey,
    },
    body,
    timeoutMs: config.speechTimeoutMs,
  });

  if (!res.ok) {
    const detail = res.text().slice(0, 200);
    throw new Error(`Sarvam speech to text failed (${res.status}): ${detail}`);
  }
  const text = transcriptFrom(res.json());
  return { text, provider: 'sarvam-saarika' };
}

/**
 * Any OpenAI-compatible transcription endpoint.
 * POST {STT_HTTP_URL} multipart file + model, Authorization: Bearer <key>.
 */
async function transcribeHttp({ audio, contentType, language, config }) {
  const { body, contentType: multipartType } = buildMultipart([
    { name: 'file', buffer: audio, filename: `turn.${extensionFor(contentType)}`, contentType: contentType || 'audio/mp4' },
    { name: 'model', value: config.sttHttpModel || 'whisper-1' },
    { name: 'language', value: language || 'en' },
    { name: 'response_format', value: 'json' },
  ]);

  const headers = { 'content-type': multipartType };
  if (config.sttHttpApiKey) headers.authorization = `Bearer ${config.sttHttpApiKey}`;

  const res = await request(config.sttHttpUrl, {
    method: 'POST',
    headers,
    body,
    timeoutMs: config.speechTimeoutMs,
  });

  if (!res.ok) {
    const detail = res.text().slice(0, 200);
    throw new Error(`Speech to text endpoint failed (${res.status}): ${detail}`);
  }
  const text = transcriptFrom(res.json());
  return { text, provider: 'http-whisper' };
}

module.exports = {
  transcribeSarvam,
  transcribeHttp,
  buildMultipart,
  extensionFor,
  SARVAM_LANGUAGE,
};
