import { readLocalized, readLocalizedMany, type Locale } from '../../content/server/snapshots';
import { memberSchema, teamListSchema } from '../../content/shared/schemas';

import type { Db } from '../../../db';

export async function listPublishedTeam(db: Db, locale: Locale) {
  const list = await readLocalized(db, 'team_list', 'team', locale, teamListSchema);
  if (!list) return [];
  const members = await readLocalizedMany(db, 'team_member', locale, memberSchema);
  return list.data.members.flatMap((entry) => {
    const result = members.get(entry.slug);
    return result ? [{ ...result.data, fallback: result.fallback, stale: result.stale }] : [];
  });
}

export async function getPublishedMember(db: Db, slug: string, locale: Locale) {
  const result = await readLocalized(db, 'team_member', slug, locale, memberSchema);
  if (!result) return null;
  const list = await readLocalized(db, 'team_list', 'team', locale, teamListSchema);
  const index = list?.data.members.findIndex((member) => member.slug === slug) ?? -1;
  return {
    ...result.data,
    fallback: result.fallback,
    stale: result.stale,
    previous: index > 0 ? (list?.data.members[index - 1]?.slug ?? null) : null,
    next: index >= 0 ? (list?.data.members[index + 1]?.slug ?? null) : null,
  };
}
