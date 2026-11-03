import { createHash } from 'node:crypto';

import { expect, test } from '@playwright/test';

const policyHeaderNames = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
];

function listenForCspViolations() {
  document.addEventListener('securitypolicyviolation', (event) => {
    type Violation = {
      directive: string;
      blockedURI: string;
      sourceFile: string;
      sample: string;
    };
    (window as Window & { __cspViolations?: Violation[] }).__cspViolations ??= [];
    (window as Window & { __cspViolations?: Violation[] }).__cspViolations!.push({
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      sourceFile: event.sourceFile,
      sample: event.sample,
    });
  });
}

test('sends security headers once on normal, localized, and missing routes', async ({ page }) => {
  const paths = ['/', '/es', '/security-missing-route'];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(path === '/security-missing-route' ? 404 : 200);
    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(headers['permissions-policy']).toBe(
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()'
    );
    const responseHeaders = await response!.headersArray();
    for (const name of policyHeaderNames) {
      expect(responseHeaders.filter((header) => header.name.toLowerCase() === name)).toHaveLength(
        1
      );
    }
  }
});

test('renders Astro’s custom 500 page with hardened headers', async ({ page }) => {
  const response = await page.goto('/500');
  expect(response?.status()).toBe(500);
  await expect(page.getByRole('heading', { name: 'Something went wrong.' })).toBeVisible();
  expect(response?.headers()['x-frame-options']).toBe('DENY');
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});

test('sends security headers on public assets', async ({ page }) => {
  const favicon = await page.request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['x-frame-options']).toBe('DENY');

  await page.goto('/');
  const assetPath = await page.locator('link[rel="stylesheet"]').getAttribute('href');
  expect(assetPath).toMatch(/^\/_astro\//);
  const asset = await page.request.get(assetPath!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['x-frame-options']).toBe('DENY');
});

test('does not report CSP violations on localized pages or 404', async ({ page }) => {
  await page.addInitScript(listenForCspViolations);
  for (const path of ['/', '/es', '/security-missing-route']) {
    const response = await page.goto(path);
    expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    await expect(page.locator('body')).toBeAttached();
    const pageViolations = await page.evaluate(
      () => (window as Window & { __cspViolations?: unknown[] }).__cspViolations ?? []
    );
    expect(pageViolations).toEqual([]);
  }
  const response = await page.goto('/');
  const policy = response?.headers()['content-security-policy'];
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("style-src-attr 'unsafe-hashes'");
  expect(policy).toMatch(/script-src[^;]*sha256-/);
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(policy).not.toMatch(/style-src-attr[^;]*'unsafe-inline'/);
  expect(policy).not.toContain('unpkg.com');
  await expect(page.locator('script[src*="unpkg.com"]')).toHaveCount(0);
});

test('CSP hashes the rendered theme script and Base UI inline styles', async ({ page }) => {
  const response = await page.goto('/');
  const policy = response?.headers()['content-security-policy'] ?? '';
  const themeScript = await page.locator('head script:not([src])').first().textContent();
  expect(themeScript).not.toBeNull();
  const themeHash = createHash('sha256').update(themeScript!).digest('base64');
  expect(policy, 'CSP must allow the current inline theme script hash').toContain(
    `'sha256-${themeHash}'`
  );

  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="prefs"]');
    return island !== null && !island.hasAttribute('ssr');
  });

  const language = page.getByRole('combobox', { name: 'Language' });
  const visuallyHiddenInput = page.locator('input[style]');
  await expect(visuallyHiddenInput).toHaveCount(1);
  const styleAttribute = await visuallyHiddenInput.getAttribute('style');
  expect(styleAttribute).not.toBeNull();
  const attributeHash = createHash('sha256').update(styleAttribute!).digest('base64');
  expect(policy, 'Base UI style attribute changed; review and update the CSP hash').toContain(
    `'sha256-${attributeHash}'`
  );

  await language.click();
  await expect(page.getByRole('listbox')).toBeVisible();
});

test('does not report CSP violations while the flash toast is visible', async ({ page }) => {
  await page.addInitScript(listenForCspViolations);
  await page.context().addCookies([
    {
      name: 'lumen-flash',
      value: encodeURIComponent(JSON.stringify({ type: 'success', title: 'Saved' })),
      domain: '127.0.0.1',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/');
  await expect(page.getByText('Saved')).toBeVisible();
  const violations = await page.evaluate(
    () => (window as Window & { __cspViolations?: unknown[] }).__cspViolations ?? []
  );
  expect(violations).toEqual([]);
});
