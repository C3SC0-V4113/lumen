import { expect, test, type Locator, type Page } from '@playwright/test';

async function tabToTarget(page: Page, target: Locator, maxTabs: number) {
  for (let tab = 0; tab < maxTabs; tab += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return true;
  }
  return false;
}

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
  await expect(
    page.getByRole('status').filter({ hasText: 'Parte del contenido se muestra en inglés' })
  ).toHaveCount(0);
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Parte del contenido traducido podría estar desactualizado' })
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Idioma: ES' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page).toHaveURL('/');
});

test('renders the lighthouse in server HTML without JavaScript at both capture widths', async ({
  browser,
  request,
}) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('data-hero="tower"');

  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(response.url());
      await expect(page.locator('[data-hero="tower"]')).toBeVisible();
      const target = await page.locator('[data-hero="control"]').boundingBox();
      expect(target?.width).toBeGreaterThanOrEqual(44);
      expect(target?.height).toBeGreaterThanOrEqual(44);
    }
  } finally {
    await context.close();
  }
});

test('hero copy keeps AA contrast and stays clear of the orb across themes and widths', async ({
  page,
}) => {
  for (const theme of ['dark', 'light'] as const) {
    for (const locale of ['en', 'es'] as const) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(locale === 'en' ? '/' : '/es');
        await page.evaluate((value) => localStorage.setItem('lumen:site:theme', value), theme);
        await page.reload();

        const report = await page.locator('[data-hero="scene"]').evaluate((hero) => {
          const toRgb = (value: string) => {
            const oklch = value.match(/oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
            if (oklch) {
              const lightness =
                Number(oklch[1].replace('%', '')) / (oklch[1].endsWith('%') ? 100 : 1);
              const chroma = Number(oklch[2]);
              const hue = (Number(oklch[3]) * Math.PI) / 180;
              const a = chroma * Math.cos(hue);
              const b = chroma * Math.sin(hue);
              const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
              const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
              const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
              const channels = [
                4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
              ];
              return channels.map((channel) => {
                const clipped = Math.max(0, Math.min(1, channel));
                return (
                  255 *
                  (clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055)
                );
              });
            }
            const rgb = value.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
            return rgb ? rgb.slice(1, 4).map(Number) : [0, 0, 0];
          };
          const luminance = (channels: number[]) => {
            const linear = channels.map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
          };
          const heroSky = toRgb(getComputedStyle(hero).getPropertyValue('--hero-sky'));
          const samples = Array.from(
            hero.querySelectorAll(
              '[data-hero="copy"] h1, [data-hero="copy"] p, [data-hero="copy"] a'
            )
          ).map((element) => {
            const color = getComputedStyle(element).color;
            const foreground = luminance(toRgb(color));
            const isFilledCta = element.matches('a.bg-lamp');
            const background = isFilledCta
              ? toRgb(getComputedStyle(element).backgroundColor)
              : heroSky;
            const base = luminance(background);
            return {
              text: element.textContent,
              color,
              background: isFilledCta ? getComputedStyle(element).backgroundColor : 'hero sky',
              isCta: element.tagName === 'A',
              ratio: (Math.max(foreground, base) + 0.05) / (Math.min(foreground, base) + 0.05),
            };
          });
          const copy = hero.querySelector('[data-hero="copy"]')?.getBoundingClientRect();
          const dots = hero.querySelector('[data-hero="dots"]')?.getBoundingClientRect();
          const firstWave = hero.querySelector('[data-hero="wave-a"]')?.getBoundingClientRect();
          const tower = hero
            .querySelector('[data-hero="tower"] [data-hero="tower-fill"]')
            ?.getBoundingClientRect();
          const copyElements = Array.from(
            hero.querySelectorAll('[data-hero="copy"] h1, [data-hero="copy"] p')
          );
          const lighthouseClear =
            !!tower &&
            copyElements.every((element) => {
              const rect = element.getBoundingClientRect();
              return (
                rect.right <= tower.left ||
                rect.left >= tower.right ||
                rect.bottom <= tower.top ||
                rect.top >= tower.bottom
              );
            });
          return {
            minimumContrast: Math.min(...samples.map((sample) => sample.ratio)),
            background: getComputedStyle(hero).getPropertyValue('--hero-sky'),
            samples,
            copyClearsOrb: !!copy && !!dots && copy.right <= dots.left,
            copyClearsWaves: !!copy && !!firstWave && copy.bottom <= firstWave.top,
            copyClearsLighthouse: lighthouseClear,
          };
        });

        expect(
          report.minimumContrast,
          `${theme}/${locale}/${width}px ${JSON.stringify(report)}`
        ).toBeGreaterThanOrEqual(4.5);
        expect(report.samples.filter((sample) => sample.isCta)).toHaveLength(2);
        expect(
          Math.min(
            ...report.samples.filter((sample) => sample.isCta).map((sample) => sample.ratio)
          ),
          `${theme}/${locale}/${width}px CTA contrast ${JSON.stringify(report.samples.filter((sample) => sample.isCta))}`
        ).toBeGreaterThanOrEqual(4.5);
        expect(report.copyClearsOrb, `${theme}/${locale}/${width}px`).toBe(true);
        expect(report.copyClearsWaves, `${theme}/${locale}/${width}px`).toBe(true);
        expect(report.copyClearsLighthouse, `${theme}/${locale}/${width}px`).toBe(true);
      }
    }
  }
});

test('pauses and resumes the beacon and persists the choice', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Pause lighthouse beam' });
  await expect(button).toHaveAttribute('data-hydrated', 'true');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await tabToTarget(page, button, 30)).toBe(true);
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page.locator('[data-hero="scene"]').evaluate((scene) =>
        scene
          .getAnimations({ subtree: true })
          .filter((animation): animation is CSSAnimation => animation instanceof CSSAnimation)
          .map((animation) => ({ name: animation.animationName, state: animation.playState }))
      )
    )
    .toEqual([
      { name: 'hero-pulse', state: 'paused' },
      { name: 'hero-pulse', state: 'paused' },
      { name: 'hero-rotate', state: 'paused' },
      { name: 'hero-swell', state: 'paused' },
      { name: 'hero-swell', state: 'paused' },
      { name: 'hero-swell', state: 'paused' },
    ]);
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

test('beacon pause state remains interactive when localStorage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'lumen:beacon-paused')
        throw new DOMException('Storage is unavailable', 'SecurityError');
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lumen:beacon-paused')
        throw new DOMException('Storage is unavailable', 'SecurityError');
      return setItem.call(this, key, value);
    };
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Pause lighthouse beam' });
  await expect(button).toHaveAttribute('data-hydrated', 'true');
  await button.click();
  await expect(page.getByRole('button', { name: 'Resume lighthouse beam' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator('html')).toHaveClass(/beacon-paused/);
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
      .locator('[data-hero="scene"]')
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
