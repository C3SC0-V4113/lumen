import { expect, test, type Page } from '@playwright/test';

function captureDiagnostics(page: Page) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
    if (message.type() === 'error') {
      const source = message.location().url;
      if (
        source.includes('unpkg.com/react-scan@0.5.7') ||
        message.text().includes('react-scan@0.5.7')
      ) {
        return;
      }
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { warnings, errors, pageErrors };
}

async function setFlashCookie(page: Page, message: { type: string; title: string }) {
  await page.context().addCookies([
    {
      name: 'lumen-flash',
      value: encodeURIComponent(JSON.stringify(message)),
      url: 'http://127.0.0.1:3000/',
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
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stories for curious minds.');
  await expect(page.locator('html')).toHaveClass(/dark/);

  const themeToggle = page.getByRole('button', { name: 'Dark theme', pressed: true });
  await themeToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
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

  await expect(page.getByText('Profile saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close notification' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const toast = document.querySelector('[data-slot="toast"]');
        return toast ? getComputedStyle(toast).backgroundColor : '';
      })
    )
    .toBe(
      await page
        .locator('html')
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--popover').trim())
    );
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');

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

  await expect(page.getByText('Cambios guardados')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar notificación' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('[data-slot="toast-icon"] svg')).toHaveClass(/text-info/);
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');

  await page
    .context()
    .addCookies([
      { name: 'lumen-flash', value: '%E0%A4%A', url: 'http://127.0.0.1:3000/', sameSite: 'Lax' },
    ]);
  await page.goto('/es');
  await waitForFlashHydration(page);
  await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.cookie)).not.toContain('lumen-flash=');
  expect(diagnostics.warnings).toEqual([]);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.pageErrors).toEqual([]);
});
