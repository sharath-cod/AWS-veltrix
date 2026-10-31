require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const int = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

function loadConfig() {
  const port = Number(process.env.PORT) || 5000;
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const config = {
    isProduction,
    port,
    mongoUri,
    corsOrigins,

    // AWS: shared by Polly, Transcribe, S3 and Bedrock
    awsRegion: (process.env.AWS_REGION || 'ap-south-1').trim(),
    awsAccessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
    awsSecretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    awsSessionToken: (process.env.AWS_SESSION_TOKEN || '').trim(),
    awsS3Bucket: (process.env.AWS_S3_BUCKET || '').trim(),

    // Speech
    speechProvider: (process.env.SPEECH_PROVIDER || 'auto').trim(), // auto | aws | off
    // Speech to text: auto tries sarvam -> http -> aws, in that order.
    sttProvider: (process.env.STT_PROVIDER || 'auto').trim(), // auto | sarvam | http | aws | off
    speechTimeoutMs: int(process.env.SPEECH_TIMEOUT_MS, 25000),
    maxAudioBytes: int(process.env.MAX_AUDIO_BYTES, 8 * 1024 * 1024),

    // Sarvam AI (Indian languages, one HTTPS call, no S3 bucket needed)
    sarvamApiKey: (process.env.SARVAM_API_KEY || '').trim(),
    sarvamSttUrl: (process.env.SARVAM_STT_URL || 'https://api.sarvam.ai/speech-to-text').trim(),
    sarvamSttModel: (process.env.SARVAM_STT_MODEL || 'saarika:v2.5').trim(),
    // Translation for callers whose language has no content pack
    translateUrl: (process.env.SARVAM_TRANSLATE_URL || 'https://api.sarvam.ai/translate').trim(),
    translateModel: (process.env.SARVAM_TRANSLATE_MODEL || 'mayura:v1').trim(),

    // Any OpenAI-compatible /audio/transcriptions endpoint (Whisper, Groq, self-hosted)
    sttHttpUrl: (process.env.STT_HTTP_URL || '').trim(),
    sttHttpApiKey: (process.env.STT_HTTP_API_KEY || '').trim(),
    sttHttpModel: (process.env.STT_HTTP_MODEL || 'whisper-1').trim(),

    // Optional answer rewriting
    bedrockModelId: (process.env.BEDROCK_MODEL_ID || '').trim(),
    bedrockRegion: (process.env.BEDROCK_REGION || '').trim(),

    // Demo guards
    allowSmsSimulation: (process.env.ALLOW_SMS_SIMULATION || 'true') !== 'false',
  };

  const errors = [];
  const warnings = [];

  if (!mongoUri) {
    (isProduction ? warnings : warnings).push(
      'MONGODB_URI is not set: using the in-memory demo store (data resets on restart)',
    );
  } else if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  if (isProduction && corsOrigins.length === 0) {
    warnings.push('CORS_ORIGIN is empty: browser origins will be rejected (native apps are unaffected)');
  }

  const hasAwsKeys = Boolean(config.awsAccessKeyId && config.awsSecretAccessKey);
  if (config.speechProvider === 'aws' && !hasAwsKeys) {
    warnings.push('SPEECH_PROVIDER=aws but AWS credentials are missing: voice turns return text only');
  }
  if (hasAwsKeys && !config.awsS3Bucket) {
    warnings.push('AWS_S3_BUCKET is empty: speech to text is disabled (Polly text to speech still works)');
  }
  if (!['auto', 'aws', 'off'].includes(config.speechProvider)) {
    errors.push('SPEECH_PROVIDER must be one of: auto, aws, off');
  }
  if (!['auto', 'sarvam', 'http', 'aws', 'off'].includes(config.sttProvider)) {
    errors.push('STT_PROVIDER must be one of: auto, sarvam, http, aws, off');
  }
  const hasStt = Boolean(config.sarvamApiKey || config.sttHttpUrl || (hasAwsKeys && config.awsS3Bucket));
  if (!hasStt) {
    warnings.push(
      'No speech-to-text provider configured: the Virtual Call screen will return text answers only. Set SARVAM_API_KEY, or STT_HTTP_URL, or AWS keys plus AWS_S3_BUCKET.',
    );
  }
  if (config.sttProvider === 'sarvam' && !config.sarvamApiKey) {
    warnings.push('STT_PROVIDER=sarvam but SARVAM_API_KEY is empty: voice turns return text only');
  }
  if (config.sttProvider === 'http' && !config.sttHttpUrl) {
    warnings.push('STT_PROVIDER=http but STT_HTTP_URL is empty: voice turns return text only');
  }
  if (config.bedrockModelId && !hasAwsKeys) {
    warnings.push('BEDROCK_MODEL_ID is set but AWS credentials are missing: answers stay extractive');
  }

  return { ...config, hasAwsKeys, errors, warnings };
}

module.exports = { loadConfig, isProduction };
