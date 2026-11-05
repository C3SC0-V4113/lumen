import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  applySecurityHeaders,
  getContentSecurityPolicyHeader,
  getHttpsRedirectLocation,
  hasNullBodyStatus,
  getRobotsTag,
  hardenResponse,
  renderErrorPageSafely,
  securityHeaders,
  staticSecurityHeaders,
  shouldRedirectToHttps,
} from '../../src/lib/security-headers';

describe('security headers', () => {
  it('keeps the configured inline theme hash synchronized with its source', () => {
    const layout = readFileSync('src/layouts/main.astro', 'utf8');
    const script = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
    expect(script, 'Expected the inline theme bootstrap in the main layout').toBeDefined();
    const hash = createHash('sha256').update(script!).digest('base64');
    const config = readFileSync('astro.config.mjs', 'utf8');

    expect(config, 'Update astro.config.mjs when the theme bootstrap changes').toContain(
      `'sha256-${hash}'`
    );
  });

  it('keeps Base UI inline style hashes synchronized with the installed package', () => {
    const baseUiStyles = readFileSync('node_modules/@base-ui/react/utils/styles.js', 'utf8');
    const className = baseUiStyles.match(/DISABLE_SCROLLBAR_CLASS_NAME = '([^']+)'/)?.[1];
    const cssTemplate = baseUiStyles.match(/children: `([^`]+)`/)?.[1];
    expect(className, 'Base UI scrollbar class was not found').toBeDefined();
    expect(cssTemplate, 'Base UI scrollbar stylesheet was not found').toBeDefined();
    const css = cssTemplate!.replaceAll('${DISABLE_SCROLLBAR_CLASS_NAME}', className!);
    const hash = createHash('sha256').update(css).digest('base64');
    const config = readFileSync('astro.config.mjs', 'utf8');

    expect(config, 'Update CSP when Base UI scrollbar styles change').toContain(`'sha256-${hash}'`);
  });

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

  it('copies immutable redirect headers before applying security policy', () => {
    const response = Response.redirect('https://example.com/next', 308);
    const hardened = hardenResponse(response, new URL('https://example.com/'), 'staging');

    expect(hardened.status).toBe(308);
    expect(hardened.headers.get('location')).toBe('https://example.com/next');
    expect(hardened.headers.get('x-frame-options')).toBe('DENY');
    expect(hardened.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('uses a null body for statuses that forbid one', () => {
    expect(hasNullBodyStatus(101)).toBe(true);
    expect(hasNullBodyStatus(204)).toBe(true);
    expect(hasNullBodyStatus(205)).toBe(true);
    expect(hasNullBodyStatus(304)).toBe(true);
    expect(hasNullBodyStatus(200)).toBe(false);
  });

  it.each([204, 205, 304])('uses a null body for status %s', (status) => {
    const response = new Response(null, { status });
    const hardened = hardenResponse(response, new URL('https://example.com/'), 'staging');
    expect(hardened.status).toBe(status);
    expect(hardened.body).toBeNull();
  });

  it('redirects non-loopback HTTP requests with hardened headers', () => {
    const url = new URL('http://example.com/private?q=1');
    const redirect = new Response(null, {
      status: 308,
      headers: { Location: getHttpsRedirectLocation(url)! },
    });
    const hardened = hardenResponse(redirect, url, 'staging');
    expect(hardened.status).toBe(308);
    expect(hardened.headers.get('location')).toBe('https://example.com/private?q=1');
    expect(hardened.headers.get('x-frame-options')).toBe('DENY');
    expect(hardened.headers.get('content-security-policy')).toContain('upgrade-insecure-requests');
  });

  it('returns a hardened plain 500 when rendering the error page throws', async () => {
    const locals: { errorPageFailed?: boolean } = {};
    const view = await renderErrorPageSafely(
      locals,
      async () => {
        throw new Error('render failed');
      },
      new URL('https://example.com/'),
      'staging'
    );

    expect(locals.errorPageFailed).toBe(true);
    expect(view.status).toBe(500);
    expect(await view.text()).toBe('Internal Server Error');
    expect(view.headers.get('x-frame-options')).toBe('DENY');
  });

  it('marks non-production environments as noindex', () => {
    expect(getRobotsTag('local')).toBe('noindex, nofollow');
    expect(getRobotsTag('staging')).toBe('noindex, nofollow');
    expect(getRobotsTag('production')).toBeUndefined();
  });

  it('upgrades insecure subresources only for public hosts', () => {
    expect(getContentSecurityPolicyHeader('lumen-staging.cescovalledev.workers.dev')).toBe(
      "frame-ancestors 'none'; upgrade-insecure-requests"
    );
    expect(getContentSecurityPolicyHeader('localhost')).toBe("frame-ancestors 'none'");
  });

  it('preserves Astro CSP directives and replaces ineffective frame-ancestors duplicates', () => {
    expect(
      getContentSecurityPolicyHeader(
        'lumen-staging.cescovalledev.workers.dev',
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
