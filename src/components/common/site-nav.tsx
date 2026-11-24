import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getLocalizedPath, t, type Locale } from '@/i18n';

const nav = [
  ['Driftlight', '/driftlight'],
  ['site.nav.team', '/team'],
  ['site.nav.pressKit', '/press-kit'],
] as const;

export function SiteNav({ lang }: { lang: Locale }) {
  return (
    <>
      <nav
        aria-label={lang === 'es' ? 'Principal' : 'Main'}
        className="hidden items-center gap-7 md:flex"
      >
        {nav.map(([key, href]) => (
          <a
            key={href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href={getLocalizedPath(href, lang)}
          >
            {key === 'Driftlight' ? key : t(lang, key)}
          </a>
        ))}
      </nav>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="control"
                size="icon-touch"
                aria-label={lang === 'es' ? 'Abrir menú' : 'Open menu'}
              />
            }
          >
            <Menu aria-hidden="true" data-icon="inline-start" />
          </SheetTrigger>
          <SheetContent side="right">
            <div className="space-y-4 p-6">
              <SheetHeader>
                <SheetTitle>{lang === 'es' ? 'Menú' : 'Menu'}</SheetTitle>
              </SheetHeader>
              <nav
                aria-label={lang === 'es' ? 'Principal' : 'Main'}
                className="flex flex-col gap-5 px-4 py-4"
              >
                {nav.map(([key, href]) => (
                  <a key={href} className="text-lg" href={getLocalizedPath(href, lang)}>
                    {key === 'Driftlight' ? key : t(lang, key)}
                  </a>
                ))}
                <a
                  className="font-semibold text-primary"
                  href={getLocalizedPath('/driftlight', lang) + '#wishlist'}
                >
                  {t(lang, 'home.wishlist')}
                </a>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
