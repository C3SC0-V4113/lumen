import { expect, test, type Page } from '@playwright/test';

function captureDiagnostics(page: Page) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { warnings, errors, pageErrors };
}

async function setFlashCookie(page: Page, message: { type: string; title: string }) {
  await page.context().addCookies([
    {
      name: 'lumen-flash',
      value: encodeURIComponent(JSON.stringify(message)),
      domain: '127.0.0.1',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
}

async function waitForFlashHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="flash-toast"]');
    return island !== null && !island.hasAttribute('ssr');
  });
}

async function waitForPreferencesHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="prefs"]');
    return island !== null && !island.hasAttribute('ssr');
  });
}

test('renders localized home pages, preserves URL parts, and persists the theme', async ({
  page,
}) => {
  const diagnostics = captureDiagnostics(page);

  await page.goto('/?source=header#preferences');
  await waitForPreferencesHydration(page);
  const languageControl = page.getByRole('combobox', { name: 'Language' });
  const themeControl = page.getByRole('button', { name: 'Dark theme' });
  await expect(languageControl).toHaveCSS('height', '44px');
  await expect(languageControl).toHaveCSS('border-radius', '12px');
  await expect(themeControl).toHaveCSS('width', '44px');
  await expect(themeControl).toHaveCSS('height', '44px');
  await expect(themeControl).toHaveCSS('border-radius', '12px');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(languageControl).toHaveAccessibleName('Language: EN');
  await expect(languageControl.locator('[data-slot="select-value"]')).toHaveText('EN');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stories for curious minds.');
  await expect(page.locator('html')).toHaveClass(/dark/);

  const themeToggle = page.getByRole('button', { name: 'Dark theme', pressed: true });
  await expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
  await themeToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await page.reload();
  await waitForPreferencesHydration(page);
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await page.evaluate(() =>
    history.replaceState(null, '', `${location.pathname}${location.search}#preferences`)
  );
  const language = page.getByRole('combobox', { name: 'Language' });
  await language.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option', { name: 'Español' }).click();
  await expect(page).toHaveURL(/\/es\?source=header#preferences$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  const spanishLanguageControl = page.getByRole('combobox', { name: 'Idioma' });
  await expect(spanishLanguageControl).toHaveAccessibleName('Idioma: ES');
  await expect(spanishLanguageControl.locator('[data-slot="select-value"]')).toHaveText('ES');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Historias para mentes curiosas.'
  );
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('theme preferences still work when localStorage is blocked', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);
  await page.addInitScript(() => {
    const themeKey = 'lumen:site:theme';
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === themeKey) throw new DOMException('Storage is unavailable', 'SecurityError');
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === themeKey) throw new DOMException('Storage is unavailable', 'SecurityError');
      return setItem.call(this, key, value);
    };
  });
  await page.goto('/');
  await waitForPreferencesHydration(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  const toggle = page.getByRole('button', { name: 'Dark theme', pressed: true });
  await toggle.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('corrupt theme preference falls back to the surface default', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);
  await page.addInitScript(() => {
    localStorage.setItem('lumen:site:theme', 'corrupt');
  });
  await page.goto('/');
  await waitForPreferencesHydration(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('shows an English flash toast once and follows the active theme', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);
  await setFlashCookie(page, { type: 'success', title: 'Profile saved' });
  await page.goto('/');
  await waitForFlashHydration(page);

  await expect(page.getByRole('region', { name: 'Notifications' })).toBeAttached();
  await expect(page.getByText('Profile saved')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  const themeColors = await page.evaluate(() => {
    const html = document.documentElement;
    const toast = document.querySelector('[data-slot="toast"]');
    if (!toast) return null;
    const dark = getComputedStyle(toast).backgroundColor;
    html.classList.remove('dark');
    const light = getComputedStyle(toast).backgroundColor;
    html.classList.add('dark');
    const restored = getComputedStyle(toast).backgroundColor;
    return { dark, light, restored };
  });
  expect(themeColors).not.toBeNull();
  expect(themeColors?.dark).not.toBe(themeColors?.light);
  expect(themeColors?.restored).toBe(themeColors?.dark);
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');

  await page.keyboard.press('F6');
  const viewport = page.locator('[data-slot="toast-viewport"]');
  await expect(viewport).toBeFocused();
  await expect
    .poll(() => viewport.evaluate((element) => getComputedStyle(element).outlineStyle))
    .toBe('solid');
  await expect
    .poll(() => viewport.evaluate((element) => getComputedStyle(element).outlineWidth))
    .toBe('3px');
  const closeButton = page.getByRole('button', { name: 'Close notification' });
  await expect(closeButton).toBeVisible();
  await closeButton.focus();
  await expect(closeButton).toBeFocused();
  await expect
    .poll(() => closeButton.evaluate((element) => getComputedStyle(element).outlineStyle))
    .toBe('solid');

  await page.reload();
  await waitForFlashHydration(page);
  await expect(page.getByText('Profile saved')).toHaveCount(0);
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('shows a Spanish info flash toast and ignores a malformed cookie', async ({ page }) => {
  const diagnostics = captureDiagnostics(page);
  await setFlashCookie(page, { type: 'info', title: 'Cambios guardados' });
  await page.goto('/es');
  await waitForFlashHydration(page);

  await expect(page.getByRole('region', { name: 'Notificaciones' })).toBeAttached();
  await expect(page.getByText('Cambios guardados')).toBeVisible();
  await page.locator('[data-slot="toast-viewport"]').hover();
  await expect(page.getByRole('button', { name: 'Cerrar notificación' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('[data-slot="toast-icon"] svg')).toHaveClass(/text-info/);
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');

  await page.context().addCookies([
    {
      name: 'lumen-flash',
      value: '%E0%A4%A',
      domain: '127.0.0.1',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/es');
  await waitForFlashHydration(page);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});

test('closes a flash toast with its keyboard-accessible close button', async ({ page }) => {
  await setFlashCookie(page, { type: 'success', title: 'Saved before close' });
  await page.goto('/');
  await waitForFlashHydration(page);
  await expect(page.getByText('Saved before close')).toBeVisible();

  await page.keyboard.press('F6');
  await expect(page.locator('[data-slot="toast-viewport"]')).toBeFocused();
  const closeButton = page.getByRole('button', { name: 'Close notification' });
  await expect(closeButton).toBeVisible();
  await closeButton.click();

  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
});
