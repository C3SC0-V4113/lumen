import { describe, expect, it } from 'vitest';

import { getEquivalentPath, getLocaleFromUrl, getLocalizedPath, t } from '@/i18n';

describe('localization', () => {
  it('returns typed translations for both dictionaries', () => {
    expect(t('en', 'home.title')).toBe('Stories for curious minds.');
    expect(t('es', 'home.title')).toBe('Historias para mentes curiosas.');
  });

  it('resolves locale from the URL and preserves the equivalent route', () => {
    expect(getLocaleFromUrl('https://lumen.example/')).toBe('en');
    expect(getLocaleFromUrl('/es/about')).toBe('es');
    expect(getEquivalentPath('/es/about')).toBe('/about');
    expect(getEquivalentPath('/about')).toBe('/es/about');
    expect(getLocalizedPath('/es', 'en')).toBe('/');
  });
});
