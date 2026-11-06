import { readLocalizedMany, type Locale } from '../../content/server/snapshots';
import { jobSchema } from '../../content/shared/schemas';

import type { Db } from '../../../db';

export async function listPublishedJobs(db: Db, locale: Locale, options: { status?: string } = {}) {
  const jobs = await readLocalizedMany(db, 'job', locale, jobSchema);
  return [...jobs.values()]
    .filter((job) => !options.status || job.data.status === options.status)
    .map((job) => ({ ...job.data, fallback: job.fallback, stale: job.stale }));
}
