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
  path: string;
  surface: 'site' | 'cms';
}

export default function Prefs({ lang, path, surface }: Props) {
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
    window.location.assign(getLocalizedPath(path, next));
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
              'absolute size-5 theme-icon',
              isDark ? 'theme-icon-hidden' : 'theme-icon-visible'
            )}
          />
          <Moon
            aria-hidden="true"
            className={cn(
              'absolute size-5 theme-icon',
              isDark ? 'theme-icon-visible' : 'theme-icon-hidden'
            )}
          />
        </span>
      </Button>
    </div>
  );
}
