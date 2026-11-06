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
});
