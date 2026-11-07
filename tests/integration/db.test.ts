import { afterEach, describe, expect, it } from 'vitest';

import { auditLog } from '../../src/db/schema';
import { seed } from '../../src/db/seed';
import { createTestDb } from '../helpers/db';

describe('D1 schema migrations', () => {
  let closeDatabase: (() => void) | undefined;

  afterEach(() => {
    closeDatabase?.();
    closeDatabase = undefined;
  });

  it('applies the real migration and writes audit metadata without values', async () => {
    const { db, sqlite } = createTestDb();
    closeDatabase = () => sqlite.close();

    await db.insert(auditLog).values({
      id: 'audit-1',
      actorId: null,
      action: 'content.updated',
      entityType: 'team_member',
      entityId: 'member-1',
      createdAt: new Date('2026-11-02T12:00:00.123Z'),
    });

    expect(await db.select().from(auditLog)).toEqual([
      {
        id: 'audit-1',
        actorId: null,
        action: 'content.updated',
        entityType: 'team_member',
        entityId: 'member-1',
        createdAt: new Date('2026-11-02T12:00:00.123Z'),
      },
    ]);

    const columns = sqlite
      .prepare('PRAGMA table_info(audit_log)')
      .all()
      .map((column) => (column as { name: string }).name);
    expect(columns).toEqual(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'created_at']);
  });

  it('rejects invalid scalar values while preserving orphaned revision authorship', async () => {
    const { db, sqlite } = createTestDb();
    closeDatabase = () => sqlite.close();
    await seed(db);

    expect(() => sqlite.prepare('UPDATE settings SET flag_stale = 2 WHERE id = 1').run()).toThrow();
    expect(() =>
      sqlite.prepare('UPDATE settings SET require_review = -1 WHERE id = 1').run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          'UPDATE home_section SET hidden = 2 WHERE id = (SELECT id FROM home_section LIMIT 1)'
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO job (id, slug, discipline, status, apply_url, applicants_count, created_at, updated_at) VALUES ('bad-count','bad-count','art','open','https://example.com',-1,0,0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO content_revision (id, entity_type, entity_id, locale, version, data, state, created_at) VALUES ('bad-revision-version','team_member','orphan-history','en',0,'{}','draft',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO content_revision (id, entity_type, entity_id, locale, version, data, state, created_at) VALUES ('bad-revision-json','team_member','orphan-json','en',1,'{','draft',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO published_snapshot (entity_type, entity_id, locale, version, data, published_at) VALUES ('game','bad-version','en',0,'{}',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO published_snapshot (entity_type, entity_id, locale, version, data, published_at) VALUES ('game','bad-json','en',1,'{',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO media_asset (id, r2_key, kind, mime, bytes, sha256, created_at) VALUES ('empty-file','empty-file','photo','image/webp',0,'hash',0)"
        )
        .run()
    ).toThrow();
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO team_link (id, member_id, sort_order, kind, url, year) VALUES ('old-link','kai-moreno',99,'social','https://example.com',1800)"
        )
        .run()
    ).toThrow();

    sqlite
      .prepare(
        "INSERT INTO content_revision (id, entity_type, entity_id, locale, version, data, actor_id, state, created_at) VALUES ('orphan-author-revision','team_member','orphan-author','en',1,'{}','deleted-user','draft',0)"
      )
      .run();
    expect(
      sqlite
        .prepare("SELECT actor_id FROM content_revision WHERE id = 'orphan-author-revision'")
        .get()
    ).toEqual({ actor_id: 'deleted-user' });
  });
});
