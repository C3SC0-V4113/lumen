import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('SQLite migrations', () => {
  it('applies every migration and stores portable CHECK expressions', () => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('legacy_alter_table = OFF');
    const root = process.cwd();
    const journal = JSON.parse(
      readFileSync(join(root, 'migrations/meta/_journal.json'), 'utf8')
    ) as { entries: Array<{ idx: number; tag: string }> };

    try {
      for (const migration of journal.entries.sort((a, b) => a.idx - b.idx)) {
        sqlite.exec(readFileSync(join(root, `migrations/${migration.tag}.sql`), 'utf8'));
      }

      const checks = sqlite
        .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND sql LIKE '%CHECK%'")
        .all() as Array<{ name: string; sql: string }>;
      const checkSql = checks.map(({ sql }) => sql).join('\n');

      expect(checks.length).toBeGreaterThan(0);
      expect(checkSql).not.toContain('__new_');
      expect(checkSql).not.toMatch(/(?:"[^"\n]+"|[A-Za-z_]\w*)\s*\.\s*(?:"[^"\n]+"|[A-Za-z_]\w*)/);
    } finally {
      sqlite.close();
    }
  });

  it('preserves dependent rows while applying the integrity migration', () => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const root = process.cwd();
    const journal = JSON.parse(
      readFileSync(join(root, 'migrations/meta/_journal.json'), 'utf8')
    ) as { entries: Array<{ idx: number; tag: string }> };

    try {
      for (const migration of journal.entries.filter(({ idx }) => idx < 3)) {
        sqlite.exec(readFileSync(join(root, `migrations/${migration.tag}.sql`), 'utf8'));
      }
      sqlite.exec(
        "INSERT INTO page (id, slug, kind) VALUES ('migration-test-page', 'migration-test', 'sections')"
      );
      sqlite.exec(
        "INSERT INTO home_section (id, page_id, kind, sort_order, hidden, animation) VALUES ('migration-test-section', 'migration-test-page', 'hero', 0, 0, 'none')"
      );
      sqlite.exec(
        "INSERT INTO home_section_item (id, section_id, sort_order) VALUES ('migration-test-item', 'migration-test-section', 0)"
      );
      const integrityMigration = journal.entries.find(({ idx }) => idx === 3);
      if (!integrityMigration) throw new Error('Missing integrity migration');
      sqlite.exec(readFileSync(join(root, `migrations/${integrityMigration.tag}.sql`), 'utf8'));

      expect(
        sqlite
          .prepare("SELECT section_id FROM home_section_item WHERE id = 'migration-test-item'")
          .get()
      ).toEqual({ section_id: 'migration-test-section' });
      expect(sqlite.pragma('foreign_key_check')).toEqual([]);
    } finally {
      sqlite.close();
    }
  });
});
