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
      variant="beacon"
      size="touch"
      aria-pressed={paused}
      aria-label={t(lang, paused ? 'home.beaconResume' : 'home.beaconPause')}
      onClick={toggle}
    >
      <svg viewBox="0 0 80 150" aria-hidden="true" className="hero-control-tower">
        <path d="M22 37h36l13 96H9l13-96Z" className="hero-tower-fill" />
        <path d="M19 54h42l3 12H17l2-12Zm-5 36h52l2 12H12l2-12Z" className="hero-tower-band" />
        <path d="M20 33h40l-6-13H26l-6 13Z" className="hero-roof-fill" />
        <rect x="26" y="9" width="28" height="12" rx="2" className="hero-lamp-fill" />
        <path d="M16 38h48M8 134h64" className="hero-tower-line" />
      </svg>
      <span className="hero-control-ring" aria-hidden="true"></span>
      <span className="hero-control-tip" aria-hidden="true">
        {paused ? t(lang, 'home.beaconResume') : t(lang, 'home.beaconPause')}
      </span>
    </Button>
  );
}
