import { mkdirSync, readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

test('captures the Home comparison set for the design review', async ({ page }) => {
  const output = '/home/francisco/repos/personal/.lumen-orch/screens/phase-4';
  mkdirSync(output, { recursive: true });
  for (const locale of ['en', 'es'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript((value) => localStorage.setItem('lumen:site:theme', value), theme);
        await page.goto(locale === 'en' ? '/' : '/es');
        await page.screenshot({
          path: `${output}/home-${locale}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
  expect(readdirSync(output).filter((name) => name.endsWith('.png'))).toHaveLength(8);
});
