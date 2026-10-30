/**
 * Speech service facade.
 *
 * Speech to text (what the Virtual Call screen needs) can run on:
 *   - Sarvam AI            (SARVAM_API_KEY)                — best for Indian languages
 *   - any OpenAI-compatible endpoint (STT_HTTP_URL + key)  — Whisper, Groq, self-hosted
 *   - Amazon Transcribe    (AWS keys + AWS_S3_BUCKET)
 * Speech to text is tried in that order under SPEECH_PROVIDER=auto, so the voice
 * screen works with whichever single key the deployment happens to have.
 *
 * Speech to speech (the spoken reply) uses Amazon Polly when AWS credentials
 * exist; otherwise the voice turn returns the text answer, which the Android
 * screen already handles.
 *
 * When nothing is configured the facade still works: it reports a clearly
 * labelled "unavailable" status, so /api/health and the app can explain why.
 */
const { pollySynthesize, transcribeAudio } = require('./aws-speech');
const { transcribeSarvam, transcribeHttp } = require('./stt');

function credentialsFrom(config) {
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) return null;
  return {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    sessionToken: config.awsSessionToken || undefined,
  };
}

/** Which speech-to-text providers are usable with the current environment. */
function sttChain(config) {
  const hasAws = Boolean(config.awsAccessKeyId && config.awsSecretAccessKey && config.awsS3Bucket);
  const chain = [];
  if (config.sarvamApiKey) chain.push('sarvam');
  if (config.sttHttpUrl) chain.push('http');
  if (hasAws) chain.push('aws');

  const requested = (config.sttProvider || '').trim().toLowerCase();
  if (requested && requested !== 'auto' && requested !== 'off') {
    // An explicit choice wins, but only if it is actually configured.
    return chain.includes(requested) ? [requested] : [];
  }
  if (requested === 'off' || config.speechProvider === 'off') return [];
  if (config.speechProvider === 'aws') return hasAws ? ['aws'] : [];
  return chain;
}

function createSpeechService(config) {
  const credentials = credentialsFrom(config);
  const chain = sttChain(config);
  const ttsProvider = credentials && config.speechProvider !== 'off' ? 'aws-polly' : 'unavailable';

  const status = {
    provider: chain[0] || 'off',
    speechToText: chain[0] ? `configured:${chain[0]}` : 'unavailable',
    textToSpeech: ttsProvider,
    chain,
    region: config.awsRegion,
    notes: [],
  };
  if (!chain.length) {
    status.notes.push(
      'No speech-to-text provider is configured. Set SARVAM_API_KEY, or STT_HTTP_URL (+ STT_HTTP_API_KEY) for an OpenAI-compatible endpoint, or AWS keys with AWS_S3_BUCKET for Amazon Transcribe. The Ask screen uses the phone\'s own speech recognition and keeps working.',
    );
  }
  if (ttsProvider === 'unavailable') {
    status.notes.push(
      'Spoken replies are unavailable (no AWS credentials): a voice turn returns the text answer, which the app displays.',
    );
  }

  async function transcribeWith(provider, { audio, contentType, language }) {
    if (provider === 'sarvam') return transcribeSarvam({ audio, contentType, language, config });
    if (provider === 'http') return transcribeHttp({ audio, contentType, language, config });
    if (provider === 'aws') {
      return transcribeAudio({
        audio,
        contentType,
        language,
        bucket: config.awsS3Bucket,
        credentials,
        region: config.awsRegion,
        timeoutMs: config.speechTimeoutMs,
      });
    }
    throw new Error(`Unknown speech-to-text provider: ${provider}`);
  }

  return {
    provider: status.provider,
    status,
    credentials,
    chain,

    /** True when at least one speech-to-text provider can be used. */
    canTranscribe() {
      return chain.length > 0;
    },

    async transcribe({ audio, contentType, language }) {
      if (!chain.length) {
        return { text: '', provider: 'unavailable', reason: 'no-provider' };
      }
      const failures = [];
      for (const provider of chain) {
        try {
          const result = await transcribeWith(provider, { audio, contentType, language });
          if (result.text) return { ...result, attempted: failures };
          failures.push(`${provider}: empty transcript`);
        } catch (err) {
          failures.push(`${provider}: ${err.message}`);
        }
      }
      throw new Error(failures.join(' | ') || 'speech to text failed');
    },

    async synthesize({ text, language }) {
      if (ttsProvider === 'unavailable') return { audio: null, provider: 'unavailable' };
      const result = await pollySynthesize({ text, language, credentials, region: config.awsRegion });
      return result;
    },
  };
}

module.exports = { createSpeechService, credentialsFrom, sttChain };
