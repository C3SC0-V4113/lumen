import { expect, test, type Page } from '@playwright/test';

async function waitForPreferencesHydration(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island');
    return island !== null && !island.hasAttribute('ssr');
  });
}

test('renders both localized home pages and persists the theme', async ({ page }) => {
  const hydrationWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && /hydration/i.test(message.text())) {
      hydrationWarnings.push(message.text());
    }
  });

  await page.goto('/');
  await waitForPreferencesHydration(page);
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stories for curious minds.');
  await expect(page.locator('html')).toHaveClass(/dark/);

  const themeToggle = page.getByRole('button', { name: 'Toggle color theme' });
  await themeToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.reload();
  await waitForPreferencesHydration(page);
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  const language = page.getByRole('combobox', { name: 'Language' });
  await language.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option', { name: 'Español' })).toHaveAttribute('tabindex', '0');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Historias para mentes curiosas.'
  );
  expect(hydrationWarnings).toEqual([]);
});
