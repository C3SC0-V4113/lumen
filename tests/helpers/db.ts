import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../../src/db/schema';

import type { Db } from '../../src/db';

const migrationsDirectory = join(process.cwd(), 'migrations');

export function createTestDb(): { sqlite: Database.Database; db: Db } {
  const sqlite = new Database(':memory:');
  const migrations = readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const migration of migrations) {
    sqlite.exec(readFileSync(join(migrationsDirectory, migration), 'utf8'));
  }

  const db = drizzle(sqlite, { schema });
  return { sqlite, db: db as unknown as Db };
}
