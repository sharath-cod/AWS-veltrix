/**
 * Minimal AWS Signature Version 4 signer built on node:crypto.
 * Used so the backend can call Polly, Transcribe, S3 and Bedrock without
 * pulling the (large) AWS SDK into the deployment package.
 */
const crypto = require('crypto');
const { request } = require('./http');

const ALGORITHM = 'AWS4-HMAC-SHA256';

const sha256Hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

/** RFC 3986 encoding, as required by SigV4. */
function uriEncode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQuery(searchParams) {
  const pairs = [];
  for (const [key, value] of searchParams.entries()) {
    pairs.push([uriEncode(key), uriEncode(value)]);
  }
  pairs.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1));
  return pairs.map(([k, v]) => `${k}=${v}`).join('&');
}

function canonicalUri(pathname) {
  const path = pathname || '/';
  return path
    .split('/')
    .map((segment) => uriEncode(decodeURIComponent(segment)))
    .join('/') || '/';
}

function signingKey(secretAccessKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/**
 * Sign and send a request.
 * @param {object} options
 * @param {string} options.service  e.g. 'polly'
 * @param {string} options.region   e.g. 'ap-south-1'
 * @param {string} options.method
 * @param {string} options.url
 * @param {object} [options.headers]
 * @param {Buffer|string} [options.body]
 * @param {object} options.credentials {accessKeyId, secretAccessKey, sessionToken}
 * @param {number} [options.timeoutMs]
 */
async function signedRequest({ service, region, method, url, headers = {}, body, credentials, timeoutMs = 30000 }) {
  if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }
  const target = new URL(url);
  const now = new Date();
  const dateStamp = amzDate(now).slice(0, 8);
  const timestamp = amzDate(now);
  const payload = body === undefined || body === null ? Buffer.alloc(0) : Buffer.from(body);
  const payloadHash = sha256Hex(payload);

  const canonicalHeadersMap = {
    host: target.host,
    'x-amz-date': timestamp,
    'x-amz-content-sha256': payloadHash,
  };
  if (credentials.sessionToken) canonicalHeadersMap['x-amz-security-token'] = credentials.sessionToken;
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue;
    canonicalHeadersMap[key.toLowerCase()] = String(value).trim();
  }

  const sortedKeys = Object.keys(canonicalHeadersMap).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${canonicalHeadersMap[k]}\n`).join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri(target.pathname),
    canonicalQuery(target.searchParams),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [ALGORITHM, timestamp, scope, sha256Hex(canonicalRequest)].join('\n');
  const signature = crypto
    .createHmac('sha256', signingKey(credentials.secretAccessKey, dateStamp, region, service))
    .update(stringToSign)
    .digest('hex');

  const authorization =
    `${ALGORITHM} Credential=${credentials.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const outHeaders = { ...headers, 'x-amz-date': timestamp, 'x-amz-content-sha256': payloadHash, Authorization: authorization };
  if (credentials.sessionToken) outHeaders['x-amz-security-token'] = credentials.sessionToken;

  const verb = method.toUpperCase();
  return request(target.toString(), {
    method: verb,
    headers: outHeaders,
    body: verb === 'GET' || verb === 'HEAD' ? undefined : payload,
    timeoutMs,
  });
}

module.exports = { signedRequest, uriEncode, canonicalQuery, canonicalUri, signingKey, sha256Hex };
