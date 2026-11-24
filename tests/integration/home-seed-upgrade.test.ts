import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { describe, expect, it } from 'vitest';

import * as schema from '../../src/db/schema';
import { seed } from '../../src/db/seed';

import type { Db } from '../../src/db';

describe('Home seed upgrade from migration 0002', () => {
  it('preserves phase-three translations and seeds items and states idempotently after 0003', async () => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    try {
      const migrationsDirectory = join(process.cwd(), 'migrations');
      const journal = JSON.parse(
        readFileSync(join(migrationsDirectory, 'meta/_journal.json'), 'utf8')
      ) as { entries: Array<{ idx: number; tag: string }> };
      const migrations = [...journal.entries].sort((left, right) => left.idx - right.idx);

      for (const migration of migrations.filter(({ idx }) => idx <= 2)) {
        sqlite.exec(readFileSync(join(migrationsDirectory, `${migration.tag}.sql`), 'utf8'));
      }

      sqlite
        .prepare('INSERT INTO page (id, slug, kind) VALUES (?, ?, ?)')
        .run('home', 'home', 'sections');
      sqlite
        .prepare(
          `INSERT INTO home_section
            (id, page_id, kind, sort_order, hidden, animation, bg_light, fg_light, bg_dark, fg_dark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run('home-grid', 'home', 'grid', 1, 0, 'none', null, null, null, null);
      sqlite
        .prepare(
          'INSERT INTO home_section_translation (section_id, locale, heading, body) VALUES (?, ?, ?, ?)'
        )
        .run('home-grid', 'en', 'Phase 3 heading', 'Phase 3 body');
      sqlite
        .prepare('INSERT INTO home_section_item (id, section_id, sort_order) VALUES (?, ?, ?)')
        .run('home-grid-phase3-note', 'home-grid', 3);
      const insertLegacyTranslation = sqlite.prepare(
        'INSERT INTO home_section_item_translation (item_id, locale, title, body) VALUES (?, ?, ?, ?)'
      );
      insertLegacyTranslation.run(
        'home-grid-phase3-note',
        'en',
        'Phase 3 navigation note',
        'Saved before migration 0003.'
      );
      insertLegacyTranslation.run(
        'home-grid-phase3-note',
        'es',
        'Nota de navegación de la fase 3',
        'Guardada antes de la migración 0003.'
      );

      const migration0003 = migrations.find(({ idx }) => idx === 3);
      if (!migration0003) throw new Error('Missing migration 0003');
      sqlite.exec(readFileSync(join(migrationsDirectory, `${migration0003.tag}.sql`), 'utf8'));

      const readLegacyTranslations = () =>
        sqlite
          .prepare(
            `SELECT locale, title, body
             FROM home_section_item_translation
             WHERE item_id = ? ORDER BY locale`
          )
          .all('home-grid-phase3-note');
      const legacyTranslations = [
        {
          locale: 'en',
          title: 'Phase 3 navigation note',
          body: 'Saved before migration 0003.',
        },
        {
          locale: 'es',
          title: 'Nota de navegación de la fase 3',
          body: 'Guardada antes de la migración 0003.',
        },
      ];
      expect(readLegacyTranslations()).toEqual(legacyTranslations);

      const db = drizzle(sqlite, { schema }) as unknown as Db;
      await seed(db);
      await seed(db);

      const sectionCounts = sqlite
        .prepare(
          `SELECT count(*) AS total, count(DISTINCT id) AS uniqueCount
           FROM home_section`
        )
        .get();
      const itemCounts = sqlite
        .prepare(
          `SELECT count(*) AS total, count(DISTINCT id) AS uniqueCount
           FROM home_section_item`
        )
        .get();
      const translationCounts = sqlite
        .prepare(
          `SELECT count(*) AS total,
                  count(DISTINCT item_id || ':' || locale) AS uniqueCount
           FROM home_section_item_translation`
        )
        .get();
      expect(sectionCounts).toEqual({ total: 6, uniqueCount: 6 });
      expect(itemCounts).toEqual({ total: 9, uniqueCount: 9 });
      expect(translationCounts).toEqual({ total: 18, uniqueCount: 18 });

      const states = sqlite
        .prepare('SELECT id, state FROM home_section_item ORDER BY id')
        .all() as Array<{ id: string; state: string | null }>;
      expect(states.find(({ id }) => id === 'home-grid-phase3-note')).toEqual({
        id: 'home-grid-phase3-note',
        state: null,
      });
      expect(states.filter(({ id }) => id.startsWith('home-steps-'))).toEqual(
        expect.arrayContaining([
          { id: 'home-steps-prototype', state: 'done' },
          { id: 'home-steps-vertical-slice', state: 'done' },
          { id: 'home-steps-free-demo', state: 'now' },
          { id: 'home-steps-early-access', state: 'next' },
          { id: 'home-steps-release-1', state: 'later' },
        ])
      );
      expect(readLegacyTranslations()).toEqual(legacyTranslations);
    } finally {
      sqlite.close();
    }
  });
});
