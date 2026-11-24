import type { darkBackgrounds, lightBackgrounds, textColors } from '../../../db/enums';
import type { homeSchema } from '../../content/shared/schemas';
import type { z } from 'zod';

export type HomeSection = z.infer<typeof homeSchema>['sections'][number];

export const lightBackgroundClasses: Record<(typeof lightBackgrounds)[number], string> = {
  paper: 'bg-background',
  card: 'bg-card',
  sand: 'bg-secondary',
  lamp: 'bg-lamp',
  night_band: 'bg-card',
};
export const darkBackgroundClasses: Record<(typeof darkBackgrounds)[number], string> = {
  night: 'dark:bg-background',
  deep_sea: 'dark:bg-secondary',
  card: 'dark:bg-card',
  ember: 'dark:bg-destructive-muted',
  cream_band: 'dark:bg-secondary',
};
export const textColorClasses: Record<(typeof textColors)[number], string> = {
  auto: 'text-foreground dark:text-foreground',
  ink: 'text-foreground dark:text-foreground',
  slate: 'text-muted-foreground dark:text-muted-foreground',
  toasted_amber: 'text-primary dark:text-primary',
  sea_teal: 'text-info dark:text-info',
  cream: 'text-foreground dark:text-foreground',
  mist: 'text-muted-foreground dark:text-muted-foreground',
  amber: 'text-lamp dark:text-lamp',
  glow_teal: 'text-info dark:text-info',
};

export const darkTextColorClasses: Record<(typeof textColors)[number], string> = {
  auto: 'dark:text-foreground',
  ink: 'dark:text-foreground',
  slate: 'dark:text-muted-foreground',
  toasted_amber: 'dark:text-primary',
  sea_teal: 'dark:text-info',
  cream: 'dark:text-foreground',
  mist: 'dark:text-muted-foreground',
  amber: 'dark:text-lamp',
  glow_teal: 'dark:text-info',
};

export function sectionColorClasses(section: {
  bgLight: keyof typeof lightBackgroundClasses | null;
  fgLight: keyof typeof textColorClasses | null;
  bgDark: keyof typeof darkBackgroundClasses | null;
  fgDark: keyof typeof textColorClasses | null;
}) {
  const lightBg = section.bgLight ? lightBackgroundClasses[section.bgLight] : 'bg-background';
  const darkBg = section.bgDark ? darkBackgroundClasses[section.bgDark] : 'dark:bg-background';
  const lightFg = section.fgLight ? textColorClasses[section.fgLight] : 'text-foreground';
  const darkFg = section.fgDark ? darkTextColorClasses[section.fgDark] : 'dark:text-foreground';
  // Tokens adapt to the active site palette; the catalog still selects the semantic role.
  return `${lightBg} ${lightFg} ${darkBg} ${darkFg}`;
}
