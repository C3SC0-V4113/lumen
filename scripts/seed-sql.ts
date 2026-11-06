import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../src/db/schema';
import { seed } from '../src/db/seed';

import type { Db } from '../src/db';

export async function generateSeedSql(): Promise<string> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const journal = JSON.parse(readFileSync('migrations/meta/_journal.json', 'utf8')) as {
    entries: Array<{ idx: number; tag: string }>;
  };
  for (const migration of journal.entries.sort((a, b) => a.idx - b.idx)) {
    sqlite.exec(readFileSync(`migrations/${migration.tag}.sql`, 'utf8'));
  }

  try {
    const statements: string[] = [];
    const db = drizzle(sqlite, {
      schema,
      logger: {
        logQuery(query, params) {
          const placeholders = query.match(/\?/g)?.length ?? 0;
          if (placeholders !== params.length) {
            throw new Error(
              `Seed SQL query has ${placeholders} question marks for ${params.length} parameters; literal question marks are unsupported`
            );
          }
          let index = 0;
          const statement = query.replace(/\?/g, () => {
            const value = params[index++];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'number') return String(value);
            if (typeof value === 'boolean') return value ? '1' : '0';
            return `'${String(value).replaceAll("'", "''")}'`;
          });
          statements.push(statement);
        },
      },
    });
    await seed(db as unknown as Db);
    return `${statements.join(';\n')};\n`;
  } finally {
    sqlite.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const sql = await generateSeedSql();
  writeFileSync('scripts/seed.sql', sql);
}
