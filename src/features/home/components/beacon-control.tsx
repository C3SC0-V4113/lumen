import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { t, type Locale } from '@/i18n';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains('beacon-paused');
}

function getServerSnapshot() {
  return false;
}

export function BeaconControl({ lang }: { lang: Locale }) {
  const paused = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  function toggle() {
    const next = !getSnapshot();
    document.documentElement.classList.toggle('beacon-paused', next);
    try {
      localStorage.setItem('lumen:beacon-paused', String(next));
    } catch {
      // The root class keeps the control usable when storage is unavailable.
    }
    listeners.forEach((listener) => listener());
  }
  return (
    <Button
      type="button"
      variant="beacon"
      size="touch"
      data-hero="control"
      className="group absolute top-1/2 left-7/10 flex h-72 w-20 items-start justify-center max-tiny:top-1/2 max-tiny:left-5/6 max-tiny:w-14 hero:top-1/3 hero:left-5/8 hero:h-116 hero:w-32"
      aria-pressed={paused}
      aria-label={t(lang, paused ? 'home.beaconResume' : 'home.beaconPause')}
      onClick={toggle}
    >
      <svg
        viewBox="0 0 80 150"
        aria-hidden="true"
        data-hero="tower"
        className="size-full overflow-visible"
      >
        <path d="M22 37h36l13 96H9l13-96Z" data-hero="tower-fill" className="fill-hero-tower" />
        <path d="M19 54h42l3 12H17l2-12Zm-5 36h52l2 12H12l2-12Z" className="fill-hero-red" />
        <path d="M20 33h40l-6-13H26l-6 13Z" className="fill-hero-tower" />
        <rect
          x="26"
          y="9"
          width="28"
          height="12"
          rx="2"
          className="fill-hero-orb stroke-hero-tower stroke-3"
        />
        <path d="M16 38h48M8 134h64" className="fill-none stroke-foreground stroke-3" />
      </svg>
      <span
        className="absolute -inset-3 rounded-full border border-hero-orb/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        aria-hidden="true"
      ></span>
      <span
        className="absolute top-1/2 left-full ml-3 w-max rounded-lg bg-background px-3 py-2 text-xs text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        aria-hidden="true"
      >
        {paused ? t(lang, 'home.beaconResume') : t(lang, 'home.beaconPause')}
      </span>
    </Button>
  );
}
