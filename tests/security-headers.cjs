const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = require('./helpers/load-typescript.cjs')('next.config.ts').default;

async function headers() {
  const rules = await config.headers();
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, '/:path*');
  return Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));
}
test('all routes have MIME, frame and referrer protections', async () => {
  const h = await headers();
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.equal(h['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(h['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(config.poweredByHeader, false);
});
test('enforced CSP protects embedding without blocking script, style or media delivery', async () => {
  const h = await headers();
  assert.equal(h['Content-Security-Policy'], "frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
  assert.doesNotMatch(h['Content-Security-Policy'], /default-src|script-src|style-src|connect-src|media-src/);
});
test('permissions retain first-party capture, location and fullscreen', async () => {
  const h = await headers();
  for (const feature of ['camera', 'microphone', 'geolocation', 'fullscreen']) {
    assert.ok(h['Permissions-Policy'].includes(`${feature}=(self)`));
  }
  assert.ok(h['Permissions-Policy'].includes('payment=()'));
});
test('candidate CSP stays report-only with no private report transmission', async () => {
  const h = await headers();
  const candidate = h['Content-Security-Policy-Report-Only'];
  assert.match(candidate, /script-src 'self'/);
  assert.doesNotMatch(candidate, /unsafe-eval|report-uri|report-to|report-sample/);
  assert.match(candidate, /wss:\/\//);
  for (const value of Object.values(h)) assert.doesNotMatch(value, /[\r\n]/);
});
