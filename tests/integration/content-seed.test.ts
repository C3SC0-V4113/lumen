import { and, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import {
  publishedSnapshot,
  settings,
  teamMember,
  teamMemberTranslation,
} from '../../src/db/schema';
import { seed } from '../../src/db/seed';
import { getPublishedGame } from '../../src/features/games/server/queries';
import { getPublishedHome } from '../../src/features/home/server/queries';
import { listPublishedJobs } from '../../src/features/jobs/server/queries';
import { getPublishedMember, listPublishedTeam } from '../../src/features/team/server/queries';
import { createTestDb } from '../helpers/db';

describe('content snapshot seed', () => {
  let close: (() => void) | undefined;
  afterEach(() => {
    close?.();
    close = undefined;
  });

  it('seeds idempotently and provides translated public reads', async () => {
    const { db, sqlite } = createTestDb();
    close = () => sqlite.close();
    await seed(db);
    await seed(db);
    expect((await db.select().from(teamMember)).length).toBe(23);
    expect((await db.select().from(settings)).length).toBe(1);
    const teoSources = await db
      .select({ sourceVersion: teamMemberTranslation.sourceVersion })
      .from(teamMemberTranslation)
      .where(eq(teamMemberTranslation.memberId, 'teo-lindqvist'));
    expect(teoSources).toHaveLength(2);
    expect(teoSources.every((translation) => translation.sourceVersion === 1)).toBe(true);
    expect((await db.select().from(publishedSnapshot)).length).toBeGreaterThan(45);
    expect((await listPublishedTeam(db, 'en')).length).toBe(23);
    expect((await listPublishedTeam(db, 'es')).length).toBe(23);
    expect((await getPublishedMember(db, 'kai-moreno', 'en'))?.stale).toBe(false);
    expect((await getPublishedMember(db, 'kai-moreno', 'es'))?.stale).toBe(true);
    expect((await getPublishedMember(db, 'pau-serra', 'es'))?.fallback).toBe(true);
    expect((await getPublishedGame(db, 'driftlight', 'en'))?.data.roadmap).toHaveLength(4);
    expect((await getPublishedGame(db, 'driftlight', 'es'))?.fallback).toBe(false);
    expect((await listPublishedJobs(db, 'en', { status: 'open' })).map((job) => job.slug)).toEqual([
      'technical-sound-designer',
    ]);
    expect((await listPublishedJobs(db, 'es', { status: 'open' })).map((job) => job.slug)).toEqual([
      'technical-sound-designer',
    ]);
    expect((await getPublishedHome(db, 'en'))?.data.sections).toHaveLength(6);
    expect((await getPublishedHome(db, 'es'))?.data.sections).toHaveLength(6);
    await db.update(settings).set({ stalePolicy: 'source' }).where(eq(settings.id, 1));
    expect((await getPublishedMember(db, 'kai-moreno', 'es'))?.fallback).toBe(true);
    await db.update(settings).set({ stalePolicy: 'hide' }).where(eq(settings.id, 1));
    expect(await getPublishedMember(db, 'kai-moreno', 'es')).toBeNull();
    expect(await getPublishedMember(db, 'pau-serra', 'es')).toBeNull();
  });

  it('rejects invalid enums and foreign keys', async () => {
    const { sqlite } = createTestDb();
    close = () => sqlite.close();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO team_member (id, slug, discipline, sort_order, status, created_at, updated_at) VALUES ('x','x','wizard',0,'published',0,0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO team_member_translation (member_id, locale, role) VALUES ('missing','en','role')"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO settings (id, studio_name, stale_policy, flag_stale, require_review, approvers, press_email, contact_email, updated_at) VALUES (2,'x','keep',1,1,'admins','press@lumen.example','hello@lumen.example',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO newsletter_subscriber (id, email, locale, consent_version, created_at) VALUES ('x','Contact@Lumen.example','en','v1',0)"
        )
        .run()
    ).toThrow();
  });

  it('cascades member-owned translations, links, and credits', async () => {
    const { db, sqlite } = createTestDb();
    close = () => sqlite.close();
    await seed(db);
    sqlite.prepare("DELETE FROM team_member WHERE id = 'kai-moreno'").run();
    expect(
      sqlite
        .prepare(
          "SELECT count(*) AS count FROM team_member_translation WHERE member_id = 'kai-moreno'"
        )
        .get()
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM team_link WHERE member_id = 'kai-moreno'").get()
    ).toEqual({ count: 0 });
    expect(
      sqlite
        .prepare("SELECT count(*) AS count FROM team_credit WHERE member_id = 'kai-moreno'")
        .get()
    ).toEqual({ count: 0 });
  });

  it('hides the employment CTA when no published job is open', async () => {
    const { db, sqlite } = createTestDb();
    close = () => sqlite.close();
    await seed(db);
    const jobSnapshots = await db.select().from(publishedSnapshot);
    await Promise.all(
      jobSnapshots
        .filter((snapshot) => snapshot.entityType === 'job')
        .map((snapshot) => {
          const data = JSON.parse(snapshot.data) as { status: string };
          if (data.status !== 'open') return Promise.resolve();
          return db
            .update(publishedSnapshot)
            .set({ data: JSON.stringify({ ...data, status: 'closed' }) })
            .where(
              and(
                eq(publishedSnapshot.entityId, snapshot.entityId),
                eq(publishedSnapshot.locale, snapshot.locale)
              )
            );
        })
    );
    expect((await getPublishedHome(db, 'en'))?.data.sections).toHaveLength(5);
  });

  it('treats corrupt snapshots as absent', async () => {
    const { db, sqlite } = createTestDb();
    close = () => sqlite.close();
    await seed(db);
    sqlite
      .prepare(
        "UPDATE published_snapshot SET data = '{' WHERE entity_type = 'game' AND entity_id = 'driftlight' AND locale = 'en'"
      )
      .run();
    expect(await getPublishedGame(db, 'driftlight', 'en')).toBeNull();
    sqlite
      .prepare(
        "UPDATE published_snapshot SET data = '{' WHERE entity_type = 'team_member' AND entity_id = 'kai-moreno' AND locale = 'es'"
      )
      .run();
    expect((await getPublishedMember(db, 'kai-moreno', 'es'))?.fallback).toBe(true);
  });
});
