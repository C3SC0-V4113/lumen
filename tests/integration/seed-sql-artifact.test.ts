import { describe, expect, it } from 'vitest';

import { generateSeedSql, serializeSeedQuery } from '../../scripts/seed-sql';
import { seed } from '../../src/db/seed';
import { createTestDb } from '../helpers/db';

import type Database from 'better-sqlite3';

describe('seed SQL generation', () => {
  it('round-trips counts and SQLite storage types against the direct seed', async () => {
    const direct = createTestDb();
    const generated = createTestDb();
    try {
      await seed(direct.db);
      const sql = await generateSeedSql();
      generated.sqlite.exec(sql);

      expect(sql.split(';\n').length - 1).toBeGreaterThan(100);
      expect(sql.match(/insert into/gi)?.length ?? 0).toBeGreaterThan(100);
      expect(readSeedShape(generated.sqlite)).toEqual(readSeedShape(direct.sqlite));
    } finally {
      direct.sqlite.close();
      generated.sqlite.close();
    }
  });

  it('serializes only supported finite SQL parameters and skips quoted question marks', () => {
    expect(serializeSeedQuery("SELECT ?, ?, ?, ?, ?, '?'", [1, 1.5, 'Lumen', null, true])).toBe(
      "SELECT 1, 1.5, 'Lumen', NULL, 1, '?'"
    );
    expect(() => serializeSeedQuery('SELECT ?', [Number.NaN])).toThrow(/finite number/);
    expect(() => serializeSeedQuery('SELECT ?', [Number.POSITIVE_INFINITY])).toThrow(
      /finite number/
    );
    expect(() => serializeSeedQuery('SELECT ?', [new Date()])).toThrow(/Unsupported seed SQL/);
    expect(() => serializeSeedQuery('SELECT ?', [undefined])).toThrow(/Unsupported seed SQL/);
  });
});

function readSeedShape(sqlite: Database.Database) {
  const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as Array<{ name: string }>;

  return tables.map(({ name: table }) => {
    const quotedTable = quote(table);
    const row = sqlite.prepare(`SELECT count(*) AS count FROM ${quotedTable}`).get() as {
      count: number;
    };
    const columns = sqlite.pragma(`table_info(${quotedTable})`) as Array<{ name: string }>;
    return {
      table,
      count: row.count,
      types: columns.map(({ name: column }) => ({
        column,
        counts: sqlite
          .prepare(
            `SELECT typeof(${quote(column)}) AS type, count(*) AS count FROM ${quotedTable} GROUP BY typeof(${quote(column)}) ORDER BY type`
          )
          .all(),
      })),
    };
  });
}
