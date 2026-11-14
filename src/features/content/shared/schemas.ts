import { z } from 'zod';

import {
  approverPolicies,
  darkBackgrounds,
  disciplines,
  jobStates,
  linkKinds,
  lightBackgrounds,
  milestoneStates,
  sectionKinds,
  stalePolicies,
  textColors,
} from '../../../db/enums';

const linkHref = z.string().refine((value) => {
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
});
const mark = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('bold'), attrs: z.never().optional() }),
  z.strictObject({ type: z.literal('italic'), attrs: z.never().optional() }),
  z.strictObject({ type: z.literal('link'), attrs: z.strictObject({ href: linkHref }) }),
]);
export const richTextSchema = z.strictObject({
  type: z.literal('doc'),
  content: z.array(
    z.strictObject({
      type: z.literal('paragraph'),
      content: z
        .array(
          z.strictObject({
            type: z.literal('text'),
            text: z.string(),
            marks: z.array(mark).optional(),
          })
        )
        .optional(),
    })
  ),
});

const optionalRichText = richTextSchema.nullable();
export const memberSchema = z.strictObject({
  slug: z.string(),
  name: z.string(),
  role: z.string(),
  discipline: z.enum(disciplines),
  city: z.string().nullable(),
  bio: optionalRichText,
  madeIn: z.string().nullable(),
  badge: z.string().nullable(),
  portraitMediaId: z.string().nullable(),
  links: z.array(
    z.strictObject({
      kind: z.enum(linkKinds),
      url: linkHref,
      year: z.number().nullable(),
      label: z.string(),
    })
  ),
  credits: z.array(z.strictObject({ game: z.string(), work: z.string(), credit: z.string() })),
});
export const teamListSchema = z.strictObject({
  members: z.array(
    z.strictObject({
      slug: z.string(),
      name: z.string(),
      role: z.string(),
      discipline: z.enum(disciplines),
      portraitMediaId: z.string().nullable(),
    })
  ),
});
export const gameSchema = z.strictObject({
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: richTextSchema,
  releaseLabel: z.string(),
  platformsLabel: z.string(),
  coverMediaId: z.string().nullable(),
  roadmap: z.array(
    z.strictObject({ title: z.string(), dateLabel: z.string(), state: z.enum(milestoneStates) })
  ),
});
export const jobSchema = z.strictObject({
  slug: z.string(),
  title: z.string(),
  discipline: z.enum(disciplines),
  status: z.enum(jobStates),
  locationLabel: z.string(),
  summary: richTextSchema,
  applyUrl: linkHref,
  applicantsCount: z.number().nullable(),
  closesAt: z.number().nullable(),
});
export const homeSchema = z.strictObject({
  sections: z.array(
    z.strictObject({
      id: z.string(),
      kind: z.enum(sectionKinds),
      sortOrder: z.number(),
      hidden: z.boolean(),
      heading: z.string().nullable(),
      body: optionalRichText,
      bgLight: z.enum(lightBackgrounds).nullable(),
      fgLight: z.enum(textColors).nullable(),
      bgDark: z.enum(darkBackgrounds).nullable(),
      fgDark: z.enum(textColors).nullable(),
      items: z.array(z.strictObject({ title: z.string(), body: z.string() })),
    })
  ),
});
export const settingsSchema = z.strictObject({
  studioName: z.string(),
  stalePolicy: z.enum(stalePolicies),
  flagStale: z.boolean(),
  requireReview: z.boolean(),
  approvers: z.enum(approverPolicies),
  pressEmail: z.email(),
  contactEmail: z.email(),
});

export type RichText = z.infer<typeof richTextSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Job = z.infer<typeof jobSchema>;
