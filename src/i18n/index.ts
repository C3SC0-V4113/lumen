import en from './en';
import es from './es';

export type Locale = 'en' | 'es';
export type TranslationKey = keyof typeof en;
const dictionaries = { en, es };

export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key];
}

export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname =
    typeof url === 'string' ? (url.includes('://') ? new URL(url).pathname : url) : url.pathname;
  return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en';
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const withoutLocale = pathname.replace(/^\/es(?=\/|$)/, '') || '/';
  if (locale === 'en') return withoutLocale;
  return withoutLocale === '/' ? '/es' : `/es${withoutLocale}`;
}

export function getEquivalentPath(pathname: string): string {
  const locale = getLocaleFromUrl(pathname);
  return getLocalizedPath(pathname, locale === 'en' ? 'es' : 'en');
}
