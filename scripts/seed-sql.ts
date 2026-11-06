import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../src/db/schema';
import { seed } from '../src/db/seed';

import type { Db } from '../src/db';

function serializeParameter(value: unknown, index: number): string {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Seed SQL parameter ${index + 1} must be a finite number`);
    }
    return String(value);
  }
  if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
  throw new Error(`Unsupported seed SQL parameter ${index + 1}: ${typeof value}`);
}

export function serializeSeedQuery(query: string, params: unknown[]): string {
  let statement = '';
  let parameterIndex = 0;
  let closingQuote: string | null = null;

  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];
    if (closingQuote) {
      statement += character;
      if (character === closingQuote) {
        if (query[index + 1] === closingQuote) {
          statement += query[index + 1];
          index += 1;
        } else {
          closingQuote = null;
        }
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`' || character === '[') {
      closingQuote = character === '[' ? ']' : character;
      statement += character;
      continue;
    }
    if (character !== '?') {
      statement += character;
      continue;
    }
    if (parameterIndex >= params.length) {
      throw new Error('Seed SQL query has more placeholders than parameters');
    }
    statement += serializeParameter(params[parameterIndex], parameterIndex);
    parameterIndex += 1;
  }

  if (parameterIndex !== params.length) {
    throw new Error(
      `Seed SQL query has ${parameterIndex} placeholders for ${params.length} parameters; literal question marks are unsupported`
    );
  }
  return statement;
}

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
          statements.push(serializeSeedQuery(query, params));
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
