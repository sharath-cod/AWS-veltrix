/**
 * Tiny HTTP client on top of node:https / node:http.
 *
 * Used instead of the global fetch so the backend runs on any Node 18+ host
 * (including small containers where undici's Wasm build cannot allocate) and
 * so no HTTP dependency has to be installed.
 */
const https = require('https');
const http = require('http');

/**
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.headers]
 * @param {Buffer|string} [options.body]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxRedirects]
 * @returns {Promise<{ok: boolean, status: number, headers: object, body: Buffer,
 *                    text: () => string, json: () => any}>}
 */
function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30000,
    maxRedirects = 3,
  } = options;

  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch (err) {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }
    const transport = target.protocol === 'http:' ? http : https;
    const payload = body === undefined || body === null ? null : Buffer.from(body);

    const req = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: `${target.pathname}${target.search}`,
        method,
        headers: {
          ...headers,
          ...(payload ? { 'content-length': payload.length } : {}),
        },
      },
      (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          maxRedirects > 0
        ) {
          res.resume();
          const next = new URL(res.headers.location, target).toString();
          resolve(request(next, { ...options, method: 'GET', body: undefined, maxRedirects: maxRedirects - 1 }));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: res.headers,
            body: buffer,
            text: () => buffer.toString('utf8'),
            json: () => JSON.parse(buffer.toString('utf8')),
          });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { request };
