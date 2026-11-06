import { and, eq } from 'drizzle-orm';

import { publishedSnapshot, settings } from '../../../db/schema';
import { settingsSchema } from '../shared/schemas';

import type { Db } from '../../../db';
import type { entityTypes, locales } from '../../../db/enums';

export type Locale = (typeof locales)[number];
export type SnapshotType = (typeof entityTypes)[number];

export async function getSettings(db: Db) {
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get();
  return settingsSchema.parse(
    row
      ? {
          studioName: row.studioName,
          stalePolicy: row.stalePolicy,
          flagStale: row.flagStale,
          requireReview: row.requireReview,
          approvers: row.approvers,
          pressEmail: row.pressEmail,
          contactEmail: row.contactEmail,
        }
      : {
          studioName: 'Lumen',
          stalePolicy: 'keep',
          flagStale: true,
          requireReview: true,
          approvers: 'editors_and_admins',
          pressEmail: 'press@lumen.example',
          contactEmail: 'hello@lumen.example',
        }
  );
}

export async function readSnapshot<T>(
  db: Db,
  entityType: SnapshotType,
  entityId: string,
  locale: Locale,
  schema: { safeParse(value: unknown): { success: boolean; data?: T } }
) {
  const row = await db
    .select()
    .from(publishedSnapshot)
    .where(
      and(
        eq(publishedSnapshot.entityType, entityType),
        eq(publishedSnapshot.entityId, entityId),
        eq(publishedSnapshot.locale, locale)
      )
    )
    .get();
  if (!row) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(row.data));
    if (!parsed.success) throw new Error('snapshot schema mismatch');
    return { data: parsed.data as T, version: row.version, sourceVersion: row.sourceVersion };
  } catch {
    console.error('Invalid published snapshot', { entityType, entityId, locale });
    return null;
  }
}

export async function readLocalized<T>(
  db: Db,
  type: SnapshotType,
  id: string,
  locale: Locale,
  schema: { safeParse(value: unknown): { success: boolean; data?: T } }
) {
  const [settings, selected, englishSnapshot] = await Promise.all([
    getSettings(db),
    readSnapshot(db, type, id, locale, schema),
    locale === 'en' ? Promise.resolve(null) : readSnapshot(db, type, id, 'en', schema),
  ]);
  const english = locale === 'en' ? selected : englishSnapshot;
  if (locale === 'en') return selected ? { ...selected, fallback: false, stale: false } : null;
  const stale = !!selected && !!english && (selected.sourceVersion ?? 0) < english.version;
  if (!selected)
    return settings.stalePolicy === 'hide' || !english
      ? null
      : { ...english, fallback: true, stale: false };
  if (stale && settings.stalePolicy === 'hide') return null;
  if (stale && settings.stalePolicy === 'source' && english)
    return { ...english, fallback: true, stale: true };
  return { ...selected, fallback: false, stale: stale && settings.flagStale };
}

export async function readLocalizedMany<T>(
  db: Db,
  type: SnapshotType,
  locale: Locale,
  schema: { safeParse(value: unknown): { success: boolean; data?: T } }
) {
  const rows = await db
    .select()
    .from(publishedSnapshot)
    .where(eq(publishedSnapshot.entityType, type))
    .all();
  const currentSettings = locale === 'en' ? null : await getSettings(db);
  const policy = currentSettings?.stalePolicy ?? 'keep';
  const english = new Map(
    rows.filter((row) => row.locale === 'en').map((row) => [row.entityId, row])
  );
  const requested = new Map(
    rows.filter((row) => row.locale === locale).map((row) => [row.entityId, row])
  );
  const ids = new Set([...english.keys(), ...requested.keys()]);
  const values = new Map<
    string,
    { data: T; version: number; sourceVersion: number | null; fallback: boolean; stale: boolean }
  >();
  for (const id of ids) {
    const translated = requested.get(id);
    const source = english.get(id);
    const stale = !!translated && !!source && (translated.sourceVersion ?? 0) < source.version;
    const useSource = locale === 'es' && (!translated || (stale && policy === 'source'));
    if (locale === 'es' && policy === 'hide' && (!translated || stale)) continue;
    const row = useSource ? source : translated;
    if (!row) continue;
    try {
      const parsed = schema.safeParse(JSON.parse(row.data));
      if (!parsed.success) throw new Error('snapshot schema mismatch');
      values.set(id, {
        data: parsed.data as T,
        version: row.version,
        sourceVersion: row.sourceVersion,
        fallback: useSource,
        stale: stale && !!translated && (currentSettings?.flagStale ?? false),
      });
    } catch {
      console.error('Invalid published snapshot', {
        entityType: type,
        entityId: id,
        locale: row.locale,
      });
      if (row === translated && locale === 'es' && policy !== 'hide' && source) {
        try {
          const parsedSource = schema.safeParse(JSON.parse(source.data));
          if (!parsedSource.success) throw new Error('snapshot schema mismatch');
          values.set(id, {
            data: parsedSource.data as T,
            version: source.version,
            sourceVersion: source.sourceVersion,
            fallback: true,
            stale: false,
          });
        } catch {
          console.error('Invalid published snapshot', {
            entityType: type,
            entityId: id,
            locale: source.locale,
          });
        }
      }
    }
  }
  return values;
}
