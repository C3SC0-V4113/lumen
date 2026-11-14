import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../../src/db/schema';

import type { Db } from '../../src/db';

const migrationsDirectory = join(process.cwd(), 'migrations');

export function createTestDb(): { sqlite: Database.Database; db: Db } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const journal = JSON.parse(
    readFileSync(join(migrationsDirectory, 'meta/_journal.json'), 'utf8')
  ) as { entries: Array<{ idx: number; tag: string }> };
  const migrations = [...journal.entries].sort((left, right) => left.idx - right.idx);

  for (const migration of migrations) {
    sqlite.exec(readFileSync(join(migrationsDirectory, `${migration.tag}.sql`), 'utf8'));
  }

  const db = drizzle(sqlite, { schema });
  return { sqlite, db: db as unknown as Db };
}
