import { expect, test } from '@playwright/test';

test('renders both localized home pages and persists the theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stories for curious minds.');
  await expect(page.locator('html')).toHaveClass(/dark/);

  const themeToggle = page.getByRole('button', { name: 'Toggle color theme' });
  await themeToggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  const language = page.getByRole('combobox', { name: 'Language' });
  await language.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Historias para mentes curiosas.'
  );
});
