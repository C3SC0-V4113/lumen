import en from './en';
import es from './es';

export type Locale = 'en' | 'es';
export type TranslationKey = keyof typeof en;
const dictionaries = { en, es };

export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key];
}

export function getLocaleFromUrl(path: URL | string): Locale {
  const url = new URL(path.toString(), 'https://lumen.invalid');
  return url.pathname === '/es' || url.pathname.startsWith('/es/') ? 'es' : 'en';
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const normalizedPath = `/${pathname.replace(/^\/+/, '')}`;
  const parsedPath = new URL(normalizedPath, 'https://lumen.invalid').pathname;
  const withoutLocale = parsedPath.replace(/^\/es(?=\/|$)/, '') || '/';
  const normalizedRoute = withoutLocale.replace(/\/+/g, '/') || '/';
  if (locale === 'en') return normalizedRoute;
  return normalizedRoute === '/' ? '/es' : `/es${normalizedRoute}`;
}
