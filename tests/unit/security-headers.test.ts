import { describe, expect, it } from 'vitest';

import {
  applySecurityHeaders,
  getContentSecurityPolicyHeader,
  getHttpsRedirectLocation,
  getRobotsTag,
  securityHeaders,
  staticSecurityHeaders,
  shouldRedirectToHttps,
} from '../../src/lib/security-headers';

describe('security headers', () => {
  it('applies the policy and omits HSTS on plain HTTP', () => {
    const headers = new Headers();
    applySecurityHeaders(headers, 'http:');
    expect(headers.get('Strict-Transport-Security')).toBeNull();
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('applies HSTS on HTTPS', () => {
    const headers = new Headers();
    applySecurityHeaders(headers, 'https:');
    expect(headers.get('Strict-Transport-Security')).toBe(
      securityHeaders['Strict-Transport-Security']
    );
    expect(headers.get('Strict-Transport-Security')).not.toContain('preload');
  });

  it('redirects external HTTP origins but preserves loopback during development', () => {
    expect(shouldRedirectToHttps('http:', 'example.com')).toBe(true);
    expect(shouldRedirectToHttps('http:', 'localhost')).toBe(false);
    expect(shouldRedirectToHttps('http:', '127.0.0.1')).toBe(false);
    expect(shouldRedirectToHttps('https:', 'example.com')).toBe(false);
  });

  it('preserves the URL path, query, and fragment during HTTPS redirects', () => {
    expect(getHttpsRedirectLocation(new URL('http://example.com/a?b=c#section'))).toBe(
      'https://example.com/a?b=c#section'
    );
    expect(getHttpsRedirectLocation(new URL('http://localhost:4174/a'))).toBeUndefined();
  });

  it('marks non-production environments as noindex', () => {
    expect(getRobotsTag('local')).toBe('noindex, nofollow');
    expect(getRobotsTag('staging')).toBe('noindex, nofollow');
    expect(getRobotsTag('production')).toBeUndefined();
  });

  it('upgrades insecure subresources only for public hosts', () => {
    expect(getContentSecurityPolicyHeader('lumen-staging.workers.dev')).toBe(
      "frame-ancestors 'none'; upgrade-insecure-requests"
    );
    expect(getContentSecurityPolicyHeader('localhost')).toBe("frame-ancestors 'none'");
  });

  it('preserves Astro CSP directives and replaces ineffective frame-ancestors duplicates', () => {
    expect(
      getContentSecurityPolicyHeader(
        'lumen-staging.workers.dev',
        "default-src 'self'; script-src 'self' 'sha256-test'; frame-ancestors 'self'"
      )
    ).toBe(
      "default-src 'self'; script-src 'self' 'sha256-test'; frame-ancestors 'none'; upgrade-insecure-requests"
    );
  });

  it('keeps Cloudflare static asset headers aligned with the shared policy', async () => {
    const { readFile } = await import('node:fs/promises');
    const staticHeaders = await readFile('public/_headers', 'utf8');
    for (const [name, value] of Object.entries(staticSecurityHeaders)) {
      expect(staticHeaders).toContain(`  ${name}: ${value}`);
    }
  });
});
