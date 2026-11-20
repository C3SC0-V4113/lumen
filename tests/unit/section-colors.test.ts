import { describe, expect, it } from 'vitest';

import { darkBackgrounds, lightBackgrounds, textColors } from '../../src/db/enums';
import {
  darkBackgroundClasses,
  lightBackgroundClasses,
  textColorClasses,
} from '../../src/features/home/shared/section-colors';

describe('home section color catalog', () => {
  it('maps every light background enum to a static class', () => {
    for (const key of lightBackgrounds) expect(lightBackgroundClasses[key]).toMatch(/^bg-/);
  });
  it('maps every dark background enum to a static class', () => {
    for (const key of darkBackgrounds) expect(darkBackgroundClasses[key]).toMatch(/^dark:bg-/);
  });
  it('maps every text color enum to a static class', () => {
    for (const key of textColors) expect(textColorClasses[key]).toMatch(/^text-/);
  });
});
