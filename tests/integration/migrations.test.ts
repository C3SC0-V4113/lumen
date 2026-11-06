import { readFileSync, readdirSync } from 'node:fs';
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

  it('rejects post-0002 migrations that drop tables referenced by foreign keys', () => {
    const migrationFiles = readdirSync(join(process.cwd(), 'migrations'))
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort()
      .map((file) => ({
        file,
        sql: readFileSync(join(process.cwd(), 'migrations', file), 'utf8'),
      }));
    const unsafeDrops = findUnsafeForeignKeyDrops(migrationFiles);

    if (unsafeDrops.length > 0) {
      throw new Error(
        [
          `Unsafe D1 migration table rebuild: ${unsafeDrops.join(', ')}.`,
          'D1 runs migrations transactionally, so PRAGMA foreign_keys=OFF is ignored and DROP TABLE executes CASCADE/SET NULL actions.',
          'Write the migration manually and preserve/restore child tables, or avoid rebuilding the referenced table.',
        ].join(' ')
      );
    }
    expect(unsafeDrops).toEqual([]);
  });

  it('detects a referenced-table drop in a migration after 0002', () => {
    expect(
      findUnsafeForeignKeyDrops([
        {
          file: '0002_content_model.sql',
          sql: 'CREATE TABLE child (parent_id TEXT REFERENCES parent(id));',
        },
        { file: '0003_unsafe_rebuild.sql', sql: 'DROP TABLE parent;' },
      ])
    ).toEqual(['0003_unsafe_rebuild.sql drops referenced table parent']);
  });
});

function findUnsafeForeignKeyDrops(migrations: Array<{ file: string; sql: string }>) {
  const referencedTables = new Set<string>();
  for (const migration of migrations) {
    for (const match of migration.sql.matchAll(/\bREFERENCES\s+[`"]?([A-Za-z_]\w*)[`"]?\s*\(/gi)) {
      referencedTables.add(match[1].toLowerCase());
    }
  }

  return migrations.flatMap((migration) => {
    const version = Number(migration.file.match(/^(\d+)/)?.[1] ?? 0);
    if (version <= 2) return [];
    return [
      ...migration.sql.matchAll(/\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"]?([A-Za-z_]\w*)[`"]?/gi),
    ]
      .map((match) => match[1].toLowerCase())
      .filter((table) => referencedTables.has(table))
      .map((table) => `${migration.file} drops referenced table ${table}`);
  });
}
