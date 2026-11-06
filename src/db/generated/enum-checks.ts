import { sql } from 'drizzle-orm';

import { enumSql } from '../enums';

import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

const checkedColumns = new Set([
  'kind',
  'locale',
  'status',
  'state',
  'discipline',
  'animation',
  'bg_light',
  'bg_dark',
  'fg_light',
  'fg_dark',
  'entity_type',
  'stale_policy',
  'approvers',
]);

const escapeValues = (values: readonly string[]) =>
  values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', ');

export function checkedColumn(column: AnySQLiteColumn) {
  if (!checkedColumns.has(column.name)) throw new Error('Unknown enum check column');
  return sql.raw(column.name);
}

export function enumValues<K extends keyof typeof enumSql>(key: K) {
  return sql.raw(escapeValues(enumSql[key]));
}
