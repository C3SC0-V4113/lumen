import { readLocalized, readLocalizedMany, type Locale } from '../../content/server/snapshots';
import { homeSchema, jobSchema } from '../../content/shared/schemas';

import type { Db } from '../../../db';

export async function getPublishedHome(db: Db, locale: Locale) {
  const result = await readLocalized(db, 'home', 'home', locale, homeSchema);
  if (!result) return null;
  const jobs = await readLocalizedMany(db, 'job', locale, jobSchema);
  const hasOpenRoles = [...jobs.values()].some((job) => job.data.status === 'open');
  return {
    ...result,
    data: {
      ...result.data,
      sections: result.data.sections.filter(
        (section) => !section.hidden && !(section.kind === 'cta' && !hasOpenRoles)
      ),
    },
  };
}
