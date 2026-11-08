import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const surfaces = [
  ['site', false],
  ['site', true],
  ['cms', false],
  ['cms', true],
] as const;

function oklchToRgb(value: string): [number, number, number] {
  const [, lightness, chroma, hue] = value.match(
    /oklch\(((?:\d+\.\d+|\d+))\s+((?:\d+\.\d+|\d+))\s+(\d+(?:\.\d+)?)\)/
  )!;
  const L = Number(lightness);
  const C = Number(chroma);
  const angle = (Number(hue) * Math.PI) / 180;
  const a = C * Math.cos(angle);
  const b = C * Math.sin(angle);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return linear.map((channel) => {
    const srgb =
      channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.max(0, channel) ** (1 / 2.4) - 0.055;
    return Math.round(255 * Math.max(0, Math.min(1, srgb)));
  }) as [number, number, number];
}

function palette(surface: string, dark: boolean) {
  const selector = `[data-surface='${surface}']${dark ? '.dark' : ''}`;
  const section = css
    .split(/(?=^\[data-surface)/m)
    .find((part) => part.includes(`${selector} {`) && part.includes('--background:'));
  if (!section) throw new Error(`Missing palette ${selector}`);
  const rootSection = css.slice(0, css.indexOf("[data-surface='site'] {"));
  const parseColors = (source: string) =>
    Object.fromEntries(
      [...source.matchAll(/--([\w-]+):\s*(oklch\([^;]+\))\s*;/g)].map(([, key, value]) => [
        key,
        value,
      ])
    );
  const surfaceColors = parseColors(section) as Record<string, string>;
  if (section.match(/--control-line:\s*var\(--input\);/)) {
    surfaceColors['control-line'] = surfaceColors.input;
  }
  return { ...parseColors(rootSection), ...surfaceColors } as Record<string, string>;
}

function luminance(oklch: string) {
  const linear = oklchToRgb(oklch).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme color format', () => {
  it('uses only OKLCH values in global.css', () => {
    expect(css).not.toMatch(/#[\da-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/i);
    const tokens = [...css.matchAll(/oklch\(([^)]+)\)/g)].map(([, values]) => values);
    expect(tokens.length).toBeGreaterThan(0);
    expect(
      tokens.every((value) => /^(?:0\.\d{3} 0\.\d{3} \d{1,3}(?:\.\d{1,2})?|1 0 0)$/.test(value))
    ).toBe(true);
  });

  it.each([
    ['oklch(0.000 0.000 0)', [0, 0, 0]],
    ['oklch(1.000 0.000 0)', [255, 255, 255]],
    ['oklch(0.628 0.258 29.23)', [255, 0, 0]],
  ] as const)('converts %s to sRGB', (color, expected) => {
    const actual = oklchToRgb(color);
    actual.forEach((channel, index) =>
      expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(1)
    );
  });
});

describe('theme contrast', () => {
  it.each(surfaces)('%s %s palette meets AA for tested text pairs', (surface, dark) => {
    const colors = palette(surface, dark);
    const pairs: [string, string][] = [
      [colors.foreground, colors.background],
      [colors['muted-foreground'], colors.background],
      [colors['card-foreground'], colors.card],
      [colors['popover-foreground'], colors.popover],
      [colors['primary-foreground'], colors.primary],
      [colors['secondary-foreground'], colors.secondary],
      [colors['accent-foreground'], colors.accent],
      [colors['sidebar-foreground'], colors.sidebar],
      [colors['sidebar-primary-foreground'], colors['sidebar-primary']],
      [colors['sidebar-accent-foreground'], colors['sidebar-accent']],
      [colors['lamp-foreground'], colors.lamp],
      [colors['success-foreground'], colors.success],
      [colors['warning-foreground'], colors.warning],
      [colors['info-foreground'], colors.info],
      [colors.success, colors['success-muted']],
      [colors.warning, colors['warning-muted']],
      [colors.info, colors['info-muted']],
      [colors.destructive, colors['destructive-muted']],
    ];

    for (const [foreground, background] of pairs) {
      expect(
        contrast(foreground, background),
        `${foreground} on ${background} in ${surface}${dark ? ' dark' : ' light'}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(surfaces)('%s %s input boundary meets non-text contrast', (surface, dark) => {
    const colors = palette(surface, dark);
    for (const background of [colors.background, colors.card]) {
      expect(
        contrast(colors.input, background),
        `input ${colors.input} against ${background} in ${surface}${dark ? ' dark' : ' light'}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(surfaces)('%s %s control line meets non-text contrast', (surface, dark) => {
    const colors = palette(surface, dark);
    for (const background of [colors.background, colors.card]) {
      expect(
        contrast(colors['control-line'], background),
        `control line ${colors['control-line']} against ${background} in ${surface}${dark ? ' dark' : ' light'}`
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
