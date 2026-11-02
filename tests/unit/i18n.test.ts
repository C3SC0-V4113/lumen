import { describe, expect, it } from 'vitest';

import { getLocaleFromUrl, getLocalizedPath, t } from '@/i18n';

describe('localization', () => {
  it('returns typed translations for both dictionaries', () => {
    expect(t('en', 'home.title')).toBe('Stories for curious minds.');
    expect(t('es', 'home.title')).toBe('Historias para mentes curiosas.');
  });

  it('resolves locales from paths, queries, hashes, and absolute URLs', () => {
    expect(getLocaleFromUrl('https://lumen.example/')).toBe('en');
    expect(getLocaleFromUrl('https://lumen.example/es/about')).toBe('es');
    expect(getLocaleFromUrl('/es/about')).toBe('es');
    expect(getLocaleFromUrl('/es/')).toBe('es');
    expect(getLocaleFromUrl('/es?x=1')).toBe('es');
    expect(getLocaleFromUrl('/es/about?x=1#story')).toBe('es');
  });

  it('localizes only pathnames and collapses leading slashes', () => {
    expect(getLocalizedPath('/es/about', 'en')).toBe('/about');
    expect(getLocalizedPath('/about', 'es')).toBe('/es/about');
    expect(getLocalizedPath('/es', 'en')).toBe('/');
    expect(getLocalizedPath('//evil.com', 'en')).toBe('/evil.com');
    expect(getLocalizedPath('//evil.com', 'es')).toBe('/es/evil.com');
  });
});
