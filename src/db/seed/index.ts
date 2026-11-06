import {
  contentRevision,
  game,
  gameTranslation,
  homeSection,
  homeSectionTranslation,
  job,
  jobTranslation,
  page,
  publishedSnapshot,
  roadmapMilestone,
  roadmapMilestoneTranslation,
  settings,
  teamCredit,
  teamCreditTranslation,
  teamLink,
  teamLinkTranslation,
  teamMember,
  teamMemberTranslation,
} from '../schema';
import { kaiBioEnV3, kaiBioEnV4, kaiBioEs, rich, team } from './data';
import {
  gameSchema,
  homeSchema,
  jobSchema,
  memberSchema,
  teamListSchema,
} from '../../features/content/shared/schemas';
import { locales, type entityTypes } from '../enums';

import type { Db } from '../index';

const now = new Date(Date.UTC(2026, 10, 5));
const roles = new Map(team.map(([slug, , en, es]) => [slug, { en, es }]));

async function publish(
  db: Db,
  entityType: (typeof entityTypes)[number],
  entityId: string,
  locale: (typeof locales)[number],
  version: number,
  sourceVersion: number | null,
  data: unknown
) {
  const schemas = {
    team_member: memberSchema,
    team_list: teamListSchema,
    game: gameSchema,
    job: jobSchema,
    home: homeSchema,
  };
  const schema = schemas[entityType as keyof typeof schemas];
  if (!schema) throw new Error(`Unsupported snapshot type: ${entityType}`);
  const validated = schema.parse(data);
  const serialized = JSON.stringify(validated);
  await db
    .insert(publishedSnapshot)
    .values({
      entityType,
      entityId,
      locale,
      version,
      sourceVersion,
      data: serialized,
      publishedAt: now,
    })
    .onConflictDoUpdate({
      target: [publishedSnapshot.entityType, publishedSnapshot.entityId, publishedSnapshot.locale],
      set: { version, sourceVersion, data: serialized, publishedAt: now },
    })
    .run();
}

export async function seed(db: Db) {
  await db
    .insert(settings)
    .values({
      id: 1,
      studioName: 'Lumen',
      stalePolicy: 'keep',
      flagStale: true,
      requireReview: true,
      approvers: 'editors_and_admins',
      pressEmail: 'press@lumen.example',
      contactEmail: 'hello@lumen.example',
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        studioName: 'Lumen',
        stalePolicy: 'keep',
        flagStale: true,
        requireReview: true,
        approvers: 'editors_and_admins',
        pressEmail: 'press@lumen.example',
        contactEmail: 'hello@lumen.example',
        updatedAt: now,
      },
    })
    .run();

  await db
    .insert(game)
    .values({
      id: 'driftlight',
      slug: 'driftlight',
      status: 'published',
      coverMediaId: null,
      sortOrder: 0,
    })
    .onConflictDoNothing()
    .run();
  const gameEn = {
    slug: 'driftlight',
    title: 'Driftlight',
    tagline:
      'Tend a floating lighthouse. Relight a dark coast, one beacon at a time, and find out why they went out.',
    description: rich('Tend a floating lighthouse and bring light back to a dark coast.'),
    releaseLabel: 'Early access in early 2027',
    platformsLabel: 'PC, consoles to be announced',
    coverMediaId: null,
    roadmap: [
      { title: 'Prototype', dateLabel: 'March 2025', state: 'done' },
      { title: 'Vertical slice', dateLabel: 'July 2026', state: 'done' },
      { title: 'Early access', dateLabel: 'Early 2027', state: 'current' },
      { title: 'Version 1.0', dateLabel: 'To be announced', state: 'upcoming' },
    ],
  };
  const gameEs = {
    ...gameEn,
    title: 'Driftlight',
    tagline:
      'Cuida un faro flotante. Devuelve la luz a una costa oscura, una baliza a la vez, y descubre por qué se apagaron.',
    description: rich('Cuida un faro flotante y devuelve la luz a una costa oscura.'),
    releaseLabel: 'Acceso anticipado a principios de 2027',
    platformsLabel: 'PC; consolas por anunciar',
    roadmap: gameEn.roadmap.map((m) => ({
      ...m,
      title: (
        {
          Prototype: 'Prototipo',
          'Vertical slice': 'Versión vertical',
          'Early access': 'Acceso anticipado',
          'Version 1.0': 'Versión 1.0',
        } as Record<string, string>
      )[m.title],
    })),
  };
  await Promise.all(
    locales.map(async (locale) => {
      const value = locale === 'en' ? gameEn : gameEs;
      await db
        .insert(gameTranslation)
        .values({
          gameId: 'driftlight',
          locale,
          title: value.title,
          tagline: value.tagline,
          description: JSON.stringify(value.description),
          releaseLabel: value.releaseLabel,
          platformsLabel: value.platformsLabel,
        })
        .onConflictDoNothing()
        .run();
      await publish(db, 'game', 'driftlight', locale, 1, null, value);
    })
  );
  const milestones = [
    ['prototype', 'Prototype', 'Prototipo', 'March 2025', 'Marzo de 2025', 'done'],
    ['vertical-slice', 'Vertical slice', 'Versión vertical', 'July 2026', 'Julio de 2026', 'done'],
    [
      'early-access',
      'Early access',
      'Acceso anticipado',
      'Early 2027',
      'Principios de 2027',
      'current',
    ],
    ['version-1', 'Version 1.0', 'Versión 1.0', 'To be announced', 'Por anunciar', 'upcoming'],
  ] as const;
  await Promise.all(
    milestones.map(async ([id, titleEn, titleEs, dateEn, dateEs, state], sortOrder) => {
      await db
        .insert(roadmapMilestone)
        .values({ id, gameId: 'driftlight', sortOrder, state })
        .onConflictDoUpdate({ target: roadmapMilestone.id, set: { sortOrder, state } })
        .run();
      await Promise.all(
        locales.map((locale) =>
          db
            .insert(roadmapMilestoneTranslation)
            .values({
              milestoneId: id,
              locale,
              title: locale === 'en' ? titleEn : titleEs,
              dateLabel: locale === 'en' ? dateEn : dateEs,
            })
            .onConflictDoNothing()
            .run()
        )
      );
    })
  );

  const jobs = [
    {
      slug: 'technical-sound-designer',
      discipline: 'sound',
      status: 'open',
      en: ['Technical sound designer', 'Remote · Europe'],
      es: ['Diseñador/a técnico/a de sonido', 'Remoto · Europa'],
      applicantsCount: 14,
      closesAt: new Date('2026-11-30T23:59:59Z'),
      applyUrl: 'https://example.com/jobs/technical-sound-designer',
    },
    {
      slug: 'gameplay-programmer',
      discipline: 'code',
      status: 'draft',
      en: ['Gameplay programmer', 'Lisbon or remote'],
      es: null,
      applicantsCount: null,
      closesAt: null,
      applyUrl: 'https://example.com/jobs/gameplay-programmer',
    },
    {
      slug: 'qa-tester',
      discipline: 'production',
      status: 'closed',
      en: ['QA tester', 'Remote'],
      es: ['Tester de QA', 'Remoto'],
      applicantsCount: 41,
      closesAt: null,
      closedAt: new Date('2026-09-12T23:59:59Z'),
      applyUrl: 'https://example.com/jobs/qa-tester',
    },
    {
      slug: 'concept-artist',
      discipline: 'art',
      status: 'filled',
      en: ['Concept artist', 'Remote'],
      es: ['Artista conceptual', 'Remoto'],
      applicantsCount: 63,
      closesAt: null,
      filledAt: new Date('2026-07-03T23:59:59Z'),
      applyUrl: 'https://example.com/jobs/concept-artist',
    },
  ] as const;
  await Promise.all(
    jobs.map(async (item) => {
      await db
        .insert(job)
        .values({
          id: item.slug,
          slug: item.slug,
          discipline: item.discipline,
          status: item.status,
          applyUrl: item.applyUrl,
          applicantsCount: item.applicantsCount,
          closesAt: item.closesAt ?? null,
          closedAt: 'closedAt' in item ? item.closedAt : null,
          filledAt: 'filledAt' in item ? item.filledAt : null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({ target: job.id, set: { status: item.status, updatedAt: now } })
        .run();
      await Promise.all(
        locales.map(async (locale) => {
          const translated = locale === 'en' ? item.en : item.es;
          if (!translated) return;
          const summary = rich(
            locale === 'en'
              ? `Join the Driftlight team as our ${translated[0].toLowerCase()}.`
              : `Únete al equipo de Driftlight como ${translated[0].toLowerCase()}.`
          );
          await db
            .insert(jobTranslation)
            .values({
              jobId: item.slug,
              locale,
              title: translated[0],
              locationLabel: translated[1],
              summary: JSON.stringify(summary),
            })
            .onConflictDoNothing()
            .run();
          if (item.status !== 'draft')
            await publish(db, 'job', item.slug, locale, 1, locale === 'es' ? 1 : null, {
              slug: item.slug,
              title: translated[0],
              discipline: item.discipline,
              status: item.status,
              locationLabel: translated[1],
              summary,
              applyUrl: item.applyUrl,
              applicantsCount: item.applicantsCount,
              closesAt: item.closesAt?.getTime() ?? null,
            });
        })
      );
    })
  );

  const homeSections = [
    ['hero', 'Driftlight', 'Driftlight', null, null, null, null],
    [
      'grid',
      'A quiet game about bringing light back',
      'Un juego tranquilo sobre devolver la luz',
      'card',
      'auto',
      'card',
      'mist',
    ],
    [
      'team',
      'The people keeping the lights on',
      'Las personas que mantienen las luces encendidas',
      'night_band',
      'auto',
      'cream_band',
      'slate',
    ],
    ['steps', 'Where we are', 'Dónde estamos', 'paper', 'auto', 'deep_sea', 'mist'],
    [
      'cta',
      "There's room on the boat",
      'Hay sitio en el barco',
      'sand',
      'toasted_amber',
      'ember',
      'amber',
    ],
    [
      'form',
      'One letter a month, from the lighthouse',
      'Una carta al mes, desde el faro',
      'card',
      'auto',
      'card',
      'mist',
    ],
  ] as const;
  await db
    .insert(page)
    .values({ id: 'home', slug: 'home', kind: 'sections' })
    .onConflictDoNothing()
    .run();
  const homeSnapshot = {
    sections: (await Promise.all(
      homeSections.map(
        async ([kind, headingEn, headingSpanish, bgLight, fgLight, bgDark, fgDark], index) => {
          const id = `home-${kind}`;
          await db
            .insert(homeSection)
            .values({
              id,
              pageId: 'home',
              kind,
              sortOrder: index,
              hidden: false,
              animation: 'fade_up',
              bgLight,
              fgLight,
              bgDark,
              fgDark,
            })
            .onConflictDoUpdate({
              target: homeSection.id,
              set: { sortOrder: index, hidden: false },
            })
            .run();
          await Promise.all(
            locales.map((locale) => {
              const heading = locale === 'en' ? headingEn : headingSpanish;
              return db
                .insert(homeSectionTranslation)
                .values({ sectionId: id, locale, heading, body: null })
                .onConflictDoNothing()
                .run();
            })
          );
          return {
            id,
            kind,
            sortOrder: index,
            hidden: false,
            heading: headingEn,
            body: null,
            bgLight,
            fgLight,
            bgDark,
            fgDark,
            items: [],
          };
        }
      )
    )) as Array<Record<string, unknown>>,
  };
  await publish(db, 'home', 'home', 'en', 1, null, homeSnapshot);
  await publish(db, 'home', 'home', 'es', 1, 1, {
    sections: homeSnapshot.sections.map((section, index) => ({
      ...section,
      heading: homeSections[index]?.[2] ?? null,
    })),
  });

  const publicMembers = await Promise.all(
    team.map(async ([slug, name, roleEn, roleEs, discipline], index) => {
      const status = slug === 'kai-moreno' ? 'review' : 'published';
      await db
        .insert(teamMember)
        .values({
          id: slug,
          slug,
          discipline,
          city: slug === 'kai-moreno' ? 'San Salvador' : null,
          portraitMediaId: null,
          sortOrder: index,
          status,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: teamMember.id,
          set: { sortOrder: index, status, updatedAt: now },
        })
        .run();
      await Promise.all(
        (['en', 'es'] as const).map((locale) => {
          if (slug === 'pau-serra' && locale === 'es') return Promise.resolve();
          const bio = slug === 'kai-moreno' ? (locale === 'en' ? kaiBioEnV4 : kaiBioEs) : null;
          const row = {
            role: locale === 'en' ? roleEn : roleEs,
            bio: bio ? JSON.stringify(bio) : null,
            madeIn: slug === 'kai-moreno' ? 'Town stories and the trade dialogue' : null,
            badge: slug === 'kai-moreno' ? 'Founding team · 2024' : null,
            sourceVersion: locale === 'es' && slug === 'kai-moreno' ? 2 : 1,
          };
          return db
            .insert(teamMemberTranslation)
            .values({ memberId: slug, locale, ...row })
            .onConflictDoUpdate({
              target: [teamMemberTranslation.memberId, teamMemberTranslation.locale],
              set: row,
            })
            .run();
        })
      );
      const localized = (locale: (typeof locales)[number], bio: unknown) => ({
        slug,
        name,
        role: locale === 'en' ? roleEn : roleEs,
        discipline,
        city: slug === 'kai-moreno' ? 'San Salvador' : null,
        bio,
        madeIn: slug === 'kai-moreno' ? 'Town stories and the trade dialogue' : null,
        badge: slug === 'kai-moreno' ? 'Founding team · 2024' : null,
        portraitMediaId: null,
        links:
          slug === 'kai-moreno'
            ? [
                {
                  kind: 'talk',
                  url: 'https://example.com/kai/talk',
                  year: 2026,
                  label:
                    locale === 'en'
                      ? 'Writing towns that remember wrong'
                      : 'Escribir pueblos que recuerdan mal',
                },
                {
                  kind: 'interview',
                  url: 'https://example.com/kai/interview',
                  year: 2026,
                  label:
                    locale === 'en'
                      ? "Interview about Driftlight's narrative"
                      : 'Entrevista sobre la narrativa de Driftlight',
                },
                {
                  kind: 'portfolio',
                  url: 'https://example.com/kai/portfolio',
                  year: null,
                  label:
                    locale === 'en' ? 'Tabletop campaign archive' : 'Archivo de campañas de rol',
                },
                {
                  kind: 'social',
                  url: 'https://example.com/kai/bluesky',
                  year: null,
                  label: 'Bluesky',
                },
                {
                  kind: 'social',
                  url: 'https://example.com/kai/linkedin',
                  year: null,
                  label: 'LinkedIn',
                },
              ]
            : [],
        credits:
          slug === 'kai-moreno'
            ? [
                {
                  game: 'driftlight',
                  work: locale === 'en' ? 'Town stories' : 'Historias de los pueblos',
                  credit: locale === 'en' ? 'Lead writer' : 'Guionista principal',
                },
                {
                  game: 'driftlight',
                  work: locale === 'en' ? 'Trade dialogue' : 'Diálogos de comercio',
                  credit: locale === 'en' ? 'Writer' : 'Guionista',
                },
                {
                  game: 'driftlight',
                  work: locale === 'en' ? 'Spanish version' : 'Versión en español',
                  credit: locale === 'en' ? 'Reviewer' : 'Revisión',
                },
              ]
            : [],
      });
      if (slug === 'kai-moreno') {
        await Promise.all([
          publish(db, 'team_member', slug, 'en', 3, null, localized('en', kaiBioEnV3)),
          publish(db, 'team_member', slug, 'es', 2, 2, localized('es', kaiBioEs)),
          db
            .insert(contentRevision)
            .values({
              id: 'kai-moreno-en-v3',
              entityType: 'team_member',
              entityId: slug,
              locale: 'en',
              version: 3,
              data: JSON.stringify(localized('en', kaiBioEnV3)),
              actorId: null,
              note: 'Published biography',
              state: 'published',
              createdAt: now,
            })
            .onConflictDoNothing()
            .run(),
          db
            .insert(contentRevision)
            .values({
              id: 'kai-moreno-en-v4',
              entityType: 'team_member',
              entityId: slug,
              locale: 'en',
              version: 4,
              data: JSON.stringify(localized('en', kaiBioEnV4)),
              actorId: null,
              note: 'Expanded biography',
              state: 'review',
              createdAt: now,
            })
            .onConflictDoNothing()
            .run(),
        ]);
        return { slug, name, role: roleEn, discipline, portraitMediaId: null };
      } else {
        await Promise.all([
          publish(db, 'team_member', slug, 'en', 1, null, localized('en', null)),
          ...(slug !== 'pau-serra'
            ? [publish(db, 'team_member', slug, 'es', 1, 1, localized('es', null))]
            : []),
        ]);
        return { slug, name, role: roleEn, discipline, portraitMediaId: null };
      }
    })
  );
  const links = [
    [
      'kai-talk',
      'talk',
      'https://example.com/kai/talk',
      2026,
      'Writing towns that remember wrong',
      'Escribir pueblos que recuerdan mal',
    ],
    [
      'kai-interview',
      'interview',
      'https://example.com/kai/interview',
      2026,
      "Interview about Driftlight's narrative",
      'Entrevista sobre la narrativa de Driftlight',
    ],
    [
      'kai-portfolio',
      'portfolio',
      'https://example.com/kai/portfolio',
      null,
      'Tabletop campaign archive',
      'Archivo de campañas de rol',
    ],
    ['kai-bluesky', 'social', 'https://example.com/kai/bluesky', null, 'Bluesky', 'Bluesky'],
    ['kai-linkedin', 'social', 'https://example.com/kai/linkedin', null, 'LinkedIn', 'LinkedIn'],
  ] as const;
  await Promise.all(
    links.map(async ([id, kind, url, year, labelEn, labelEs], sortOrder) => {
      await db
        .insert(teamLink)
        .values({ id, memberId: 'kai-moreno', sortOrder, kind, url, year })
        .onConflictDoNothing()
        .run();
      await Promise.all(
        locales.map((locale) =>
          db
            .insert(teamLinkTranslation)
            .values({ linkId: id, locale, label: locale === 'en' ? labelEn : labelEs })
            .onConflictDoNothing()
            .run()
        )
      );
    })
  );
  const credits = [
    [
      'kai-town-stories',
      'kai-moreno',
      0,
      'Town stories',
      'Historias de los pueblos',
      'Lead writer',
      'Guionista principal',
    ],
    [
      'kai-trade-dialogue',
      'kai-moreno',
      1,
      'Trade dialogue',
      'Diálogos de comercio',
      'Writer',
      'Guionista',
    ],
    [
      'jonas-trade-dialogue',
      'jonas-berg',
      0,
      'Trade dialogue',
      'Diálogos de comercio',
      'Writer',
      'Guionista',
    ],
    [
      'kai-spanish-version',
      'kai-moreno',
      2,
      'Spanish version',
      'Versión en español',
      'Reviewer',
      'Revisión',
    ],
    [
      'rafa-spanish-version',
      'rafa-duarte',
      0,
      'Spanish version',
      'Versión en español',
      'Reviewer',
      'Revisión',
    ],
  ] as const;
  await Promise.all(
    credits.map(async ([id, memberId, sortOrder, workEn, workEs, creditEn, creditEs]) => {
      await db
        .insert(teamCredit)
        .values({ id, memberId, gameId: 'driftlight', sortOrder })
        .onConflictDoNothing()
        .run();
      await Promise.all(
        locales.map((locale) =>
          db
            .insert(teamCreditTranslation)
            .values({
              creditId: id,
              locale,
              work: locale === 'en' ? workEn : workEs,
              credit: locale === 'en' ? creditEn : creditEs,
            })
            .onConflictDoNothing()
            .run()
        )
      );
    })
  );
  const spanishMembers = publicMembers.map((member) => ({
    ...member,
    role: roles.get(member.slug)?.es ?? member.role,
  }));
  await publish(db, 'team_list', 'team', 'en', 1, null, { members: publicMembers });
  await publish(db, 'team_list', 'team', 'es', 1, null, { members: spanishMembers });
}
