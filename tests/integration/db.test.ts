import { afterEach, describe, expect, it } from 'vitest';

import { auditLog } from '../../src/db/schema';
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
      createdAt: new Date('2026-11-02T12:00:00.000Z'),
    });

    expect(await db.select().from(auditLog)).toEqual([
      {
        id: 'audit-1',
        actorId: null,
        action: 'content.updated',
        entityType: 'team_member',
        entityId: 'member-1',
        createdAt: new Date('2026-11-02T12:00:00.000Z'),
      },
    ]);

    const columns = sqlite
      .prepare('PRAGMA table_info(audit_log)')
      .all()
      .map((column) => (column as { name: string }).name);
    expect(columns).toEqual(['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'created_at']);
  });
});
