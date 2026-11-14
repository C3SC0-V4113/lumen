import { readLocalizedMany, type Locale } from '../../content/server/snapshots';
import { jobSchema } from '../../content/shared/schemas';

import type { Db } from '../../../db';

export async function listPublishedJobs(db: Db, locale: Locale, options: { status?: string } = {}) {
  const jobs = await readLocalizedMany(db, 'job', locale, jobSchema);
  return [...jobs.values()]
    .filter((job) => !options.status || job.data.status === options.status)
    .map((job) => ({ ...job.data, fallback: job.fallback, stale: job.stale }))
    .sort((left, right) => {
      const openFirst = Number(right.status === 'open') - Number(left.status === 'open');
      if (openFirst !== 0) return openFirst;
      if (left.closesAt !== right.closesAt) {
        if (left.closesAt === null) return 1;
        if (right.closesAt === null) return -1;
        return left.closesAt - right.closesAt;
      }
      if (left.slug < right.slug) return -1;
      if (left.slug > right.slug) return 1;
      return 0;
    });
}
