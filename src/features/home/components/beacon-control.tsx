import { useEffect, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { t, type Locale } from '@/i18n';

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
        return false;
      }
    },
    () => false
  );
  function toggle() {
    const next = !paused;
    document.documentElement.classList.toggle('beacon-paused', next);
    try {
      localStorage.setItem('lumen:beacon-paused', String(next));
    } catch {
      /* in-memory state still applies */
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
