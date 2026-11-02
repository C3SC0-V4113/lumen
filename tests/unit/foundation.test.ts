import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const surfaces = [
  ['site', false],
  ['site', true],
  ['cms', false],
  ['cms', true],
] as const;

function palette(surface: string, dark: boolean) {
  const selector = `[data-surface='${surface}']${dark ? '.dark' : ''}`;
  const section = css
    .split(/(?=^\[data-surface)/m)
    .find((part) => part.startsWith(`${selector} {`) && part.includes('--background:'));
  if (!section) throw new Error(`Missing palette ${selector}`);
  return Object.fromEntries(
    [...section.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(([, key, value]) => [
      key,
      value,
    ])
  ) as Record<string, string>;
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contrast', () => {
  it.each(surfaces)('%s %s palette meets AA for text pairs', (surface, dark) => {
    const colors = palette(surface, dark);
    for (const token of [
      'foreground',
      'background',
      'muted-foreground',
      'primary-foreground',
      'primary',
      'success',
      'success-muted',
      'warning',
      'warning-muted',
      'info',
      'info-muted',
      'destructive',
      'destructive-muted',
    ]) {
      expect(colors[token], `missing ${token}`).toBeTruthy();
    }
    const pairs: [string, string][] = [
      [colors.foreground, colors.background],
      [colors['muted-foreground'], colors.background],
      [colors['primary-foreground'], colors.primary],
      [colors.success, colors['success-muted']],
      [colors.warning, colors['warning-muted']],
      [colors.info, colors['info-muted']],
      [colors.destructive, colors['destructive-muted']],
    ];

    for (const [foreground, background] of pairs) {
      expect(
        contrast(foreground, background),
        `${foreground} on ${background}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
