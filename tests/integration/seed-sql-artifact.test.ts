import { describe, expect, it } from 'vitest';

import { generateSeedSql } from '../../scripts/seed-sql';

describe('seed SQL generation', () => {
  it('builds a staging-safe SQL artifact in memory', async () => {
    const sql = await generateSeedSql();
    expect(sql.split(';\n').length - 1).toBeGreaterThan(100);
    expect(sql.match(/insert into/gi)?.length ?? 0).toBeGreaterThan(100);
  });
});
