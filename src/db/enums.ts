export const locales = ['en', 'es'] as const;
export const disciplines = ['art', 'code', 'design', 'sound', 'production'] as const;
export const publicationStates = ['draft', 'review', 'published', 'hidden'] as const;
export const jobStates = ['draft', 'open', 'closed', 'filled'] as const;
export const mediaKinds = ['key_art', 'screenshot', 'photo', 'portrait', 'logo'] as const;
export const linkKinds = ['talk', 'interview', 'portfolio', 'social'] as const;
export const milestoneStates = ['done', 'current', 'upcoming'] as const;
export const sectionKinds = ['hero', 'grid', 'team', 'steps', 'cta', 'form'] as const;
export const animations = ['fade_up', 'none'] as const;
export const pageKinds = ['sections', 'derived'] as const;
export const revisionStates = ['draft', 'review', 'approved', 'published', 'superseded'] as const;
export const entityTypes = ['team_member', 'team_list', 'game', 'job', 'home'] as const;
export const stalePolicies = ['keep', 'source', 'hide'] as const;
export const approverPolicies = ['editors_and_admins', 'admins'] as const;
export const pressKitStates = ['idle', 'building', 'ready', 'failed'] as const;
export const lightBackgrounds = ['paper', 'card', 'sand', 'lamp', 'night_band'] as const;
export const darkBackgrounds = ['night', 'deep_sea', 'card', 'ember', 'cream_band'] as const;
export const textColors = [
  'auto',
  'ink',
  'slate',
  'toasted_amber',
  'sea_teal',
  'cream',
  'mist',
  'amber',
  'glow_teal',
] as const;

export const enumSql = {
  locale: locales,
  discipline: disciplines,
  publicationState: publicationStates,
  jobState: jobStates,
  mediaKind: mediaKinds,
  linkKind: linkKinds,
  milestoneState: milestoneStates,
  sectionKind: sectionKinds,
  animation: animations,
  pageKind: pageKinds,
  revisionState: revisionStates,
  entityType: entityTypes,
  stalePolicy: stalePolicies,
  approverPolicy: approverPolicies,
  pressKitState: pressKitStates,
  lightBackground: lightBackgrounds,
  darkBackground: darkBackgrounds,
  textColor: textColors,
} as const;

export function enumCheck(column: string, values: readonly string[]) {
  return `${column} IN (${values.map((value) => `'${value}'`).join(', ')})`;
}
