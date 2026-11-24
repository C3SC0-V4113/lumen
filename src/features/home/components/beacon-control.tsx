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

function getHydratedSnapshot() {
  return true;
}

export function BeaconControl({ lang }: { lang: Locale }) {
  const paused = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribe, getHydratedSnapshot, getServerSnapshot);
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
      size="icon-touch"
      data-hero="control"
      data-hydrated={hydrated ? 'true' : undefined}
      className="group absolute top-1/2 left-7/10 flex h-22.5 w-12 translate-x-4 translate-y-25 items-start justify-center max-tiny:left-13/16 max-tiny:h-12 max-tiny:w-11 max-tiny:translate-x-1.5 max-tiny:translate-y-30 hero:top-1/3 hero:left-5/8 hero:h-45 hero:w-24 hero:translate-y-35.5"
      aria-pressed={paused}
      aria-label={t(lang, paused ? 'home.beaconResume' : 'home.beaconPause')}
      onClick={toggle}
    >
      <svg
        viewBox="0 0 80 150"
        aria-hidden="true"
        data-hero="tower"
        className="size-full overflow-visible max-tiny:w-6"
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
        className="absolute -inset-3 rounded-full border border-hero-orb/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none max-tiny:-inset-2"
        aria-hidden="true"
      ></span>
      <span
        className="absolute top-1/2 left-full ml-3 w-max rounded-lg bg-background px-3 py-2 text-xs text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none max-hero:right-full max-hero:left-auto max-hero:mr-3 max-hero:ml-0"
        aria-hidden="true"
      >
        {paused ? t(lang, 'home.beaconResume') : t(lang, 'home.beaconPause')}
      </span>
    </Button>
  );
}
