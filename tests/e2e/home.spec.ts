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
