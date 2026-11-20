import { useEffect, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { t, type Locale } from '@/i18n';

let fallbackPaused = false;

export function BeaconControl({ lang }: { lang: Locale }) {
  const paused = useSyncExternalStore(
    (notify) => {
      window.addEventListener('lumen:beacon-preference', notify);
      window.addEventListener('storage', notify);
      return () => {
        window.removeEventListener('lumen:beacon-preference', notify);
        window.removeEventListener('storage', notify);
      };
    },
    () => {
      try {
        return localStorage.getItem('lumen:beacon-paused') === 'true';
      } catch {
        return fallbackPaused;
      }
    },
    () => false
  );
  function toggle() {
    const next = !paused;
    fallbackPaused = next;
    document.documentElement.classList.toggle('beacon-paused', next);
    try {
      localStorage.setItem('lumen:beacon-paused', String(next));
    } catch {
      /* The module fallback keeps the control usable without browser storage. */
    }
    window.dispatchEvent(new Event('lumen:beacon-preference'));
  }
  useEffect(() => {
    document.documentElement.classList.toggle('beacon-paused', paused);
  }, [paused]);
  return (
    <Button
      type="button"
      variant="control"
      size="touch"
      aria-pressed={paused}
      aria-label={t(lang, paused ? 'home.beaconResume' : 'home.beaconPause')}
      onClick={toggle}
      className="absolute right-5 bottom-5 z-10"
    >
      {paused ? t(lang, 'home.beaconResume') : t(lang, 'home.beaconPause')}
    </Button>
  );
}
