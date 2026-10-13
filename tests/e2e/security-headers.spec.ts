import { test, expect } from '@playwright/test';

test('security headers cover documents, auth redirect, metadata and assets', async ({ request }) => {
  for (const path of ['/', '/focus', '/auth/callback', '/auth/error', '/gizlilik', '/robots.txt', '/icon.svg']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBeLessThan(400);
    const headers = response.headers();
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['x-frame-options'], path).toBe('SAMEORIGIN');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy'], path).toContain("frame-ancestors 'self'");
    expect(headers['content-security-policy-report-only'], path).toContain("script-src 'self'");
    expect(headers['permissions-policy'], path).toContain('microphone=(self)');
    expect(headers['x-powered-by'], path).toBeUndefined();
  }
});
