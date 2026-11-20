import { expect, test } from '@playwright/test';

test('renders published home content in both locales and maps the locale switch to the same route', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Driftlight');
  await expect(
    page.getByRole('heading', { name: 'A quiet game about bringing light back' })
  ).toBeVisible();
  await expect(page.getByText('Mar Ortega')).toBeVisible();
  await page.getByRole('combobox', { name: 'Language: EN' }).click();
  await page.getByRole('option', { name: 'Español' }).click();
  await expect(page).toHaveURL('/es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(
    page.getByRole('heading', { name: 'Un juego tranquilo sobre devolver la luz' })
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Idioma: ES' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page).toHaveURL('/');
});

test('pauses and resumes the beacon and persists the choice', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Pause lighthouse beam' });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  for (let tab = 0; tab < 11; tab += 1) await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Resume lighthouse beam' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume lighthouse beam' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Resume lighthouse beam' }).click();
  await expect(page.getByRole('button', { name: 'Pause lighthouse beam' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('reduced motion removes hero animations and mobile header opens the sheet menu', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', () => {
      document.documentElement.dataset.cspViolation = 'true';
    });
  });
  await page.goto('/');
  expect(
    await page
      .locator('.beacon-scene')
      .evaluate((element) => element.getAnimations({ subtree: true }).length)
  ).toBe(0);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Team' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-csp-violation', 'true');
});

test('keyboard navigation reaches the language switch', async ({ page }) => {
  await page.goto('/');
  for (let tab = 0; tab < 6; tab += 1) await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Language: EN' })).toBeFocused();
});
