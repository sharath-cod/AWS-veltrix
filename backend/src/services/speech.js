/**
 * Speech service facade. Chooses the AWS implementation when credentials are
 * present, otherwise falls back to a clearly-labelled "unavailable" mode so the
 * rest of the app keeps working.
 */
const { pollySynthesize, transcribeAudio } = require('./aws-speech');

function credentialsFrom(config) {
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) return null;
  return {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    sessionToken: config.awsSessionToken || undefined,
  };
}

function resolveProvider(config) {
  if (config.speechProvider === 'off') return 'off';
  if (config.speechProvider === 'aws') return credentialsFrom(config) ? 'aws' : 'off';
  // auto
  return credentialsFrom(config) ? 'aws' : 'off';
}

function createSpeechService(config) {
  const credentials = credentialsFrom(config);
  const provider = resolveProvider(config);

  const status = {
    provider,
    speechToText: provider === 'aws' && config.awsS3Bucket ? 'aws-transcribe' : 'unavailable',
    textToSpeech: provider === 'aws' ? 'aws-polly' : 'unavailable',
    region: config.awsRegion,
    notes: [],
  };
  if (provider === 'off') {
    status.notes.push(
      'AWS credentials are not configured: voice turns return text only. Use the Ask screen for on-device speech recognition and text to speech.',
    );
  }
  if (provider === 'aws' && !config.awsS3Bucket) {
    status.notes.push('AWS_S3_BUCKET is not set: speech to text is disabled, text to speech still works.');
  }

  return {
    provider,
    status,
    credentials,

    async transcribe({ audio, contentType, language }) {
      if (provider !== 'aws' || !config.awsS3Bucket) return { text: '', provider: 'unavailable' };
      const result = await transcribeAudio({
        audio,
        contentType,
        language,
        bucket: config.awsS3Bucket,
        credentials,
        region: config.awsRegion,
        timeoutMs: config.speechTimeoutMs,
      });
      return result;
    },

    async synthesize({ text, language }) {
      if (provider !== 'aws') return { audio: null, provider: 'unavailable' };
      const result = await pollySynthesize({ text, language, credentials, region: config.awsRegion });
      return result;
    },
  };
}

module.exports = { createSpeechService, credentialsFrom };
