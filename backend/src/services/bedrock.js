/**
 * Optional answer rewriting with Amazon Bedrock (Converse API).
 * Retrieval always runs first; Bedrock only rephrases the retrieved facts in
 * the user's language. If it is not configured or fails, the extractive answer
 * from the knowledge base is returned unchanged.
 */
const { signedRequest } = require('./aws-sigv4');

const SYSTEM_PROMPT = [
  'You are GramSahayak, an assistant for rural citizens in India.',
  'Answer ONLY from the context passages provided. If the context does not cover the question, say that you do not have verified information and suggest calling the helpline 112.',
  'Reply in the requested language, in at most 120 words, in simple words a person with basic literacy can follow.',
  'Never ask for OTP, PIN, bank details or money. Never invent scheme amounts or deadlines.',
].join(' ');

/**
 * @returns {Promise<{text: string, provider: string}|null>} null when unavailable.
 */
async function composeAnswer({ question, context, language, config, credentials }) {
  if (!config.bedrockModelId || !credentials) return null;
  const languageName = { en: 'English', hi: 'Hindi', kn: 'Kannada' }[language] || 'English';
  const payload = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: [
              `Answer in ${languageName}.`,
              `Question: ${question}`,
              '',
              'Context passages:',
              context,
            ].join('\n'),
          },
        ],
      },
    ],
    system: [{ text: SYSTEM_PROMPT }],
    inferenceConfig: { maxTokens: 400, temperature: 0.2, topP: 0.9 },
  };

  const region = config.bedrockRegion || config.awsRegion;
  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(config.bedrockModelId)}/converse`;

  try {
    const response = await signedRequest({
      service: 'bedrock',
      region,
      method: 'POST',
      url,
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials,
      timeoutMs: 20000,
    });
    if (!response.ok) {
      const detail = await response.text();
      console.warn('[bedrock] failed:', response.status, detail.slice(0, 200));
      return null;
    }
    const data = await response.json();
    const parts = (data.output && data.output.message && data.output.message.content) || [];
    const text = parts.map((p) => p.text || '').join('').trim();
    return text ? { text, provider: 'aws-bedrock' } : null;
  } catch (err) {
    console.warn('[bedrock] error:', err.message);
    return null;
  }
}

module.exports = { composeAnswer };
