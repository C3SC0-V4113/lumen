import { readLocalized, type Locale } from '../../content/server/snapshots';
import { gameSchema } from '../../content/shared/schemas';

import type { Db } from '../../../db';

export function getPublishedGame(db: Db, slug: string, locale: Locale) {
  return readLocalized(db, 'game', slug, locale, gameSchema);
}
