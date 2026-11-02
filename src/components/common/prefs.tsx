import { cn } from 'cn';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocalizedPath, t, type Locale } from '@/i18n';

interface Props {
  lang: Locale;
  surface: 'site' | 'cms';
}

export default function Prefs({ lang, surface }: Props) {
  const isDark = useSyncExternalStore(
    (notify) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => surface === 'site'
  );

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    try {
      localStorage.setItem(`lumen:${surface}:theme`, nextTheme);
    } catch {
      // The in-memory preference still applies when storage is unavailable.
    }
  }

  function changeLocale(next: string | null) {
    if (next !== 'en' && next !== 'es') return;
    const pathname = getLocalizedPath(window.location.pathname, next);
    window.location.assign(`${pathname}${window.location.search}${window.location.hash}`);
  }

  return (
    <div role="group" aria-label={t(lang, 'preferences.group')} className="flex items-center gap-2">
      <Select value={lang} onValueChange={changeLocale}>
        <SelectTrigger aria-label={t(lang, 'preferences.language')} size="touch">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
        </SelectContent>
      </Select>
      <Button
        aria-label={t(lang, 'preferences.theme')}
        aria-pressed={isDark}
        onClick={toggleTheme}
        size="touch"
        variant="ghost"
      >
        <span className="relative grid size-5 place-items-center">
          <Sun
            aria-hidden="true"
            className={cn(
              'absolute size-5 transition duration-300 ease-in-out motion-reduce:transform-none motion-reduce:filter-none motion-reduce:duration-100',
              isDark
                ? 'scale-25 opacity-0 blur-sm motion-reduce:scale-100 motion-reduce:blur-none'
                : 'scale-100 opacity-100 blur-none'
            )}
          />
          <Moon
            aria-hidden="true"
            className={cn(
              'absolute size-5 transition duration-300 ease-in-out motion-reduce:transform-none motion-reduce:filter-none motion-reduce:duration-100',
              isDark
                ? 'scale-100 opacity-100 blur-none'
                : 'scale-25 opacity-0 blur-sm motion-reduce:scale-100 motion-reduce:blur-none'
            )}
          />
        </span>
      </Button>
    </div>
  );
}
