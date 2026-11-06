import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { describe, expect, it } from 'vitest';

import * as schema from '../../src/db/schema';
import { seed } from '../../src/db/seed';

import type { Db } from '../../src/db';

describe('seed SQL generation', () => {
  it('builds a staging-safe SQL artifact from the canonical seed function', async () => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const root = process.cwd();
    const journal = JSON.parse(
      readFileSync(join(root, 'migrations/meta/_journal.json'), 'utf8')
    ) as { entries: Array<{ idx: number; tag: string }> };
    for (const migration of journal.entries.sort((a, b) => a.idx - b.idx)) {
      sqlite.exec(readFileSync(join(root, `migrations/${migration.tag}.sql`), 'utf8'));
    }
    const statements: string[] = [];
    const db = drizzle(sqlite, {
      schema,
      logger: {
        logQuery(query, params) {
          let index = 0;
          const statement = query.replace(/\?/g, () => {
            const value = params[index++];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'number') return String(value);
            if (typeof value === 'boolean') return value ? '1' : '0';
            return `'${String(value).replaceAll("'", "''")}'`;
          });
          if (index !== params.length) throw new Error('Seed SQL parameter count mismatch');
          statements.push(statement);
        },
      },
    });
    await seed(db as unknown as Db);
    sqlite.close();
    const output = join(root, 'scripts/seed.sql');
    writeFileSync(output, `${statements.join(';\n')};\n`);
    expect(statements.length).toBeGreaterThan(100);
  });
});
