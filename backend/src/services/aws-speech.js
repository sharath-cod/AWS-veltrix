/**
 * Amazon Polly (text to speech) and Amazon Transcribe (speech to text) calls.
 * Both use the hand-rolled SigV4 signer, so no AWS SDK dependency is needed.
 *
 * Transcribe is asynchronous: the audio is uploaded to S3, a batch job is
 * started, and the job is polled until the transcript is ready. That is why
 * the first voice turn can take 10-25 seconds.
 */
const { signedRequest } = require('./aws-sigv4');
const { request } = require('./http');

const VOICE_BY_LANGUAGE = {
  en: { voiceId: 'Kajal', engine: 'neural', languageCode: 'en-IN' },
  hi: { voiceId: 'Kajal', engine: 'neural', languageCode: 'hi-IN' },
  kn: { voiceId: 'Kajal', engine: 'neural', languageCode: 'kn-IN' },
};

const TRANSCRIBE_LANGUAGE = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
const MEDIA_FORMAT = { 'audio/mp4': 'mp4', 'audio/m4a': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollySynthesize({ text, language, credentials, region }) {
  const voice = VOICE_BY_LANGUAGE[language] || VOICE_BY_LANGUAGE.en;
  const payload = JSON.stringify({
    Text: text.slice(0, 2900),
    OutputFormat: 'mp3',
    VoiceId: voice.voiceId,
    Engine: voice.engine,
    LanguageCode: voice.languageCode,
  });

  const response = await signedRequest({
    service: 'polly',
    region,
    method: 'POST',
    url: `https://polly.${region}.amazonaws.com/v1/speech`,
    headers: { 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: payload,
    credentials,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Polly failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const buffer = response.body;
  return { audio: buffer, contentType: 'audio/mpeg', provider: 'aws-polly', voiceId: voice.voiceId };
}

async function s3PutObject({ bucket, key, body, contentType, credentials, region }) {
  const response = await signedRequest({
    service: 's3',
    region,
    method: 'PUT',
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    headers: { 'content-type': contentType || 'application/octet-stream' },
    body,
    credentials,
  });
  if (!response.ok) {
    throw new Error(`S3 upload failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
  }
}

async function s3DeleteObject({ bucket, key, credentials, region }) {
  try {
    await signedRequest({
      service: 's3',
      region,
      method: 'DELETE',
      url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      credentials,
    });
  } catch (_) {
    /* best effort cleanup */
  }
}

async function transcribeCall({ target, body, credentials, region }) {
  const response = await signedRequest({
    service: 'transcribe',
    region,
    method: 'POST',
    url: `https://transcribe.${region}.amazonaws.com/`,
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': `Transcribe.${target}`,
    },
    body: JSON.stringify(body),
    credentials,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Transcribe ${target} failed (${response.status}): ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

/**
 * Transcribe a short audio clip.
 * @returns {Promise<{text: string, provider: string}>}
 */
async function transcribeAudio({
  audio,
  contentType,
  language,
  bucket,
  credentials,
  region,
  timeoutMs = 25000,
  pollMs = 1500,
}) {
  if (!bucket) throw new Error('AWS_S3_BUCKET is required for speech to text');

  const format = MEDIA_FORMAT[contentType] || 'mp4';
  const jobName = `gs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const key = `voice-turns/${jobName}.${format}`;

  await s3PutObject({ bucket, key, body: audio, contentType, credentials, region });

  try {
    await transcribeCall({
      target: 'StartTranscriptionJob',
      body: {
        TranscriptionJobName: jobName,
        LanguageCode: TRANSCRIBE_LANGUAGE[language] || 'en-IN',
        MediaFormat: format,
        Media: { MediaFileUri: `s3://${bucket}/${key}` },
        OutputBucketName: bucket,
        Settings: { ShowSpeakerLabels: false },
      },
      credentials,
      region,
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const { TranscriptionJob: job } = await transcribeCall({
        target: 'GetTranscriptionJob',
        body: { TranscriptionJobName: jobName },
        credentials,
        region,
      });
      if (!job) throw new Error('Transcription job not found');
      if (job.TranscriptionJobStatus === 'COMPLETED') {
        const uri = job.Transcript && job.Transcript.TranscriptFileUri;
        if (!uri) throw new Error('Transcription finished without a transcript file');
        const res = await request(uri, { timeoutMs: 15000 }); // pre-signed S3 URL, no signing needed
        if (!res.ok) throw new Error(`Transcript download failed (${res.status})`);
        const payload = await res.json();
        const transcripts = (payload.results && payload.results.transcripts) || [];
        const text = transcripts.map((t) => t.transcript).join(' ').trim();
        return { text, provider: 'aws-transcribe' };
      }
      if (job.TranscriptionJobStatus === 'FAILED') {
        throw new Error(`Transcription failed: ${job.FailureReason || 'unknown reason'}`);
      }
      await sleep(pollMs);
    }
    throw new Error('Transcription timed out. Try a shorter recording.');
  } finally {
    await s3DeleteObject({ bucket, key, credentials, region });
  }
}

module.exports = { pollySynthesize, transcribeAudio, VOICE_BY_LANGUAGE, TRANSCRIBE_LANGUAGE };
