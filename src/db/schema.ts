import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  type AnySQLiteColumn,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { type enumSql } from './enums';
import { checkedColumn, enumValues } from './generated/enum-checks';

const ms = (name: string) => integer(name, { mode: 'timestamp_ms' });
const enumCheck = (name: string, column: AnySQLiteColumn, key: keyof typeof enumSql) =>
  check(name, sql`${checkedColumn(column)} IN (${enumValues(key)})`);
const enumText = <K extends keyof typeof enumSql>(name: string, key: K) => {
  void key;
  return text(name).$type<(typeof enumSql)[K][number]>();
};
const nullableEnumCheck = (name: string, column: AnySQLiteColumn, key: keyof typeof enumSql) =>
  check(
    name,
    sql`${checkedColumn(column)} IS NULL OR ${checkedColumn(column)} IN (${enumValues(key)})`
  );

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: ms('created_at').notNull(),
  },
  (t) => [
    index('audit_log_entity_idx').on(t.entityType, t.entityId),
    index('audit_log_created_at_idx').on(t.createdAt),
  ]
);

export const mediaAsset = sqliteTable(
  'media_asset',
  {
    id: text('id').primaryKey(),
    r2Key: text('r2_key').notNull().unique(),
    kind: enumText('kind', 'mediaKind').notNull(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    sha256: text('sha256').notNull(),
    createdAt: ms('created_at').notNull(),
  },
  (t) => [
    check('media_asset_bytes_check', sql`bytes > 0`),
    enumCheck('media_asset_kind_check', t.kind, 'mediaKind'),
    check(
      'media_asset_dimensions_check',
      sql`(width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)`
    ),
  ]
);
export const mediaAssetTranslation = sqliteTable(
  'media_asset_translation',
  {
    assetId: text('asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    alt: text('alt').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.assetId, t.locale] }),
    index('media_asset_translation_locale_idx').on(t.locale),
    enumCheck('media_asset_translation_locale_check', t.locale, 'locale'),
  ]
);
export const mediaTag = sqliteTable('media_tag', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
});
export const mediaAssetTag = sqliteTable(
  'media_asset_tag',
  {
    assetId: text('asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => mediaTag.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.assetId, t.tagId] }),
    index('media_asset_tag_tag_idx').on(t.tagId),
  ]
);

export const game = sqliteTable(
  'game',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    status: enumText('status', 'publicationState').notNull(),
    coverMediaId: text('cover_media_id').references(() => mediaAsset.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    enumCheck('game_status_check', t.status, 'publicationState'),
    index('game_status_order_idx').on(t.status, t.sortOrder),
    index('game_cover_idx').on(t.coverMediaId),
  ]
);
export const gameTranslation = sqliteTable(
  'game_translation',
  {
    gameId: text('game_id')
      .notNull()
      .references(() => game.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    releaseLabel: text('release_label').notNull(),
    platformsLabel: text('platforms_label').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.gameId, t.locale] }),
    index('game_translation_locale_idx').on(t.locale),
    enumCheck('game_translation_locale_check', t.locale, 'locale'),
  ]
);
export const roadmapMilestone = sqliteTable(
  'roadmap_milestone',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    state: enumText('state', 'milestoneState').notNull(),
  },
  (t) => [
    index('roadmap_game_order_idx').on(t.gameId, t.sortOrder),
    enumCheck('roadmap_state_check', t.state, 'milestoneState'),
  ]
);
export const roadmapMilestoneTranslation = sqliteTable(
  'roadmap_milestone_translation',
  {
    milestoneId: text('milestone_id')
      .notNull()
      .references(() => roadmapMilestone.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    title: text('title').notNull(),
    dateLabel: text('date_label').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.milestoneId, t.locale] }),
    enumCheck('roadmap_translation_locale_check', t.locale, 'locale'),
  ]
);

export const teamMember = sqliteTable(
  'team_member',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    discipline: enumText('discipline', 'discipline').notNull(),
    city: text('city'),
    portraitMediaId: text('portrait_media_id').references(() => mediaAsset.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').notNull(),
    status: enumText('status', 'publicationState').notNull(),
    createdAt: ms('created_at').notNull(),
    updatedAt: ms('updated_at').notNull(),
  },
  (t) => [
    enumCheck('team_member_discipline_check', t.discipline, 'discipline'),
    enumCheck('team_member_status_check', t.status, 'publicationState'),
    index('team_member_status_order_idx').on(t.status, t.sortOrder),
    index('team_member_portrait_idx').on(t.portraitMediaId),
  ]
);
export const teamMemberTranslation = sqliteTable(
  'team_member_translation',
  {
    memberId: text('member_id')
      .notNull()
      .references(() => teamMember.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    role: text('role').notNull(),
    bio: text('bio'),
    madeIn: text('made_in'),
    badge: text('badge'),
    sourceVersion: integer('source_version'),
  },
  (t) => [
    primaryKey({ columns: [t.memberId, t.locale] }),
    enumCheck('team_member_translation_locale_check', t.locale, 'locale'),
    index('team_member_translation_locale_idx').on(t.locale),
  ]
);
export const teamLink = sqliteTable(
  'team_link',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => teamMember.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    kind: enumText('kind', 'linkKind').notNull(),
    url: text('url').notNull(),
    year: integer('year'),
  },
  (t) => [
    enumCheck('team_link_kind_check', t.kind, 'linkKind'),
    check('team_link_year_check', sql`year IS NULL OR year BETWEEN 1900 AND 2100`),
    index('team_link_member_order_idx').on(t.memberId, t.sortOrder),
  ]
);
export const teamLinkTranslation = sqliteTable(
  'team_link_translation',
  {
    linkId: text('link_id')
      .notNull()
      .references(() => teamLink.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    label: text('label').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.linkId, t.locale] }),
    enumCheck('team_link_translation_locale_check', t.locale, 'locale'),
  ]
);
export const teamCredit = sqliteTable(
  'team_credit',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => teamMember.id, { onDelete: 'cascade' }),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    index('team_credit_member_order_idx').on(t.memberId, t.sortOrder),
    index('team_credit_game_idx').on(t.gameId),
  ]
);
export const teamCreditTranslation = sqliteTable(
  'team_credit_translation',
  {
    creditId: text('credit_id')
      .notNull()
      .references(() => teamCredit.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    work: text('work').notNull(),
    credit: text('credit').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.creditId, t.locale] }),
    enumCheck('team_credit_translation_locale_check', t.locale, 'locale'),
  ]
);

export const job = sqliteTable(
  'job',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    discipline: enumText('discipline', 'discipline').notNull(),
    status: enumText('status', 'jobState').notNull(),
    applyUrl: text('apply_url').notNull(),
    applicantsCount: integer('applicants_count'),
    closesAt: ms('closes_at'),
    closedAt: ms('closed_at'),
    filledAt: ms('filled_at'),
    createdAt: ms('created_at').notNull(),
    updatedAt: ms('updated_at').notNull(),
  },
  (t) => [
    enumCheck('job_discipline_check', t.discipline, 'discipline'),
    enumCheck('job_status_check', t.status, 'jobState'),
    check('job_applicants_count_check', sql`applicants_count IS NULL OR applicants_count >= 0`),
    index('job_status_discipline_idx').on(t.status, t.discipline),
    index('job_closes_at_idx').on(t.closesAt),
  ]
);
export const jobTranslation = sqliteTable(
  'job_translation',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => job.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    title: text('title').notNull(),
    locationLabel: text('location_label').notNull(),
    summary: text('summary').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.jobId, t.locale] }),
    enumCheck('job_translation_locale_check', t.locale, 'locale'),
  ]
);

export const page = sqliteTable(
  'page',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    kind: enumText('kind', 'pageKind').notNull(),
  },
  (t) => [enumCheck('page_kind_check', t.kind, 'pageKind')]
);
export const homeSection = sqliteTable(
  'home_section',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    kind: enumText('kind', 'sectionKind').notNull(),
    sortOrder: integer('sort_order').notNull(),
    hidden: integer('hidden', { mode: 'boolean' }).notNull(),
    animation: enumText('animation', 'animation').notNull(),
    bgLight: enumText('bg_light', 'lightBackground'),
    fgLight: enumText('fg_light', 'textColor'),
    bgDark: enumText('bg_dark', 'darkBackground'),
    fgDark: enumText('fg_dark', 'textColor'),
  },
  (t) => [
    enumCheck('home_section_kind_check', t.kind, 'sectionKind'),
    enumCheck('home_section_animation_check', t.animation, 'animation'),
    check('home_section_hidden_check', sql`hidden IN (0, 1)`),
    nullableEnumCheck('home_section_bg_light_check', t.bgLight, 'lightBackground'),
    nullableEnumCheck('home_section_bg_dark_check', t.bgDark, 'darkBackground'),
    nullableEnumCheck('home_section_fg_light_check', t.fgLight, 'textColor'),
    nullableEnumCheck('home_section_fg_dark_check', t.fgDark, 'textColor'),
    index('home_section_page_order_idx').on(t.pageId, t.sortOrder),
  ]
);
export const homeSectionTranslation = sqliteTable(
  'home_section_translation',
  {
    sectionId: text('section_id')
      .notNull()
      .references(() => homeSection.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    heading: text('heading'),
    body: text('body'),
  },
  (t) => [
    primaryKey({ columns: [t.sectionId, t.locale] }),
    enumCheck('home_section_translation_locale_check', t.locale, 'locale'),
  ]
);
export const homeSectionItem = sqliteTable(
  'home_section_item',
  {
    id: text('id').primaryKey(),
    sectionId: text('section_id')
      .notNull()
      .references(() => homeSection.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [index('home_section_item_order_idx').on(t.sectionId, t.sortOrder)]
);
export const homeSectionItemTranslation = sqliteTable(
  'home_section_item_translation',
  {
    itemId: text('item_id')
      .notNull()
      .references(() => homeSectionItem.id, { onDelete: 'cascade' }),
    locale: enumText('locale', 'locale').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.locale] }),
    enumCheck('home_section_item_translation_locale_check', t.locale, 'locale'),
  ]
);

export const contentRevision = sqliteTable(
  'content_revision',
  {
    id: text('id').primaryKey(),
    entityType: enumText('entity_type', 'entityType').notNull(),
    entityId: text('entity_id').notNull(),
    locale: enumText('locale', 'locale').notNull(),
    version: integer('version').notNull(),
    data: text('data').notNull(),
    actorId: text('actor_id'),
    note: text('note'),
    state: enumText('state', 'revisionState').notNull(),
    createdAt: ms('created_at').notNull(),
  },
  (t) => [
    enumCheck('content_revision_entity_check', t.entityType, 'entityType'),
    enumCheck('content_revision_locale_check', t.locale, 'locale'),
    enumCheck('content_revision_state_check', t.state, 'revisionState'),
    check('content_revision_version_check', sql`version >= 1`),
    check('content_revision_data_json_check', sql`json_valid(data)`),
    uniqueIndex('content_revision_version_unique').on(
      t.entityType,
      t.entityId,
      t.locale,
      t.version
    ),
    index('content_revision_entity_idx').on(t.entityType, t.entityId),
  ]
);
export const publishedSnapshot = sqliteTable(
  'published_snapshot',
  {
    entityType: enumText('entity_type', 'entityType').notNull(),
    entityId: text('entity_id').notNull(),
    locale: enumText('locale', 'locale').notNull(),
    version: integer('version').notNull(),
    sourceVersion: integer('source_version'),
    data: text('data').notNull(),
    publishedAt: ms('published_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entityType, t.entityId, t.locale] }),
    enumCheck('published_snapshot_entity_check', t.entityType, 'entityType'),
    enumCheck('published_snapshot_locale_check', t.locale, 'locale'),
    check('published_snapshot_version_check', sql`version >= 1`),
    check('published_snapshot_data_json_check', sql`json_valid(data)`),
    index('published_snapshot_locale_type_idx').on(t.locale, t.entityType),
  ]
);
export const previewLink = sqliteTable(
  'preview_link',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    entityType: enumText('entity_type', 'entityType').notNull(),
    entityId: text('entity_id').notNull(),
    expiresAt: ms('expires_at').notNull(),
    revokedAt: ms('revoked_at'),
  },
  (t) => [
    enumCheck('preview_link_entity_check', t.entityType, 'entityType'),
    index('preview_link_entity_idx').on(t.entityType, t.entityId),
    index('preview_link_expiry_idx').on(t.expiresAt),
  ]
);

export const settings = sqliteTable(
  'settings',
  {
    id: integer('id').primaryKey(),
    studioName: text('studio_name').notNull(),
    stalePolicy: enumText('stale_policy', 'stalePolicy').notNull(),
    flagStale: integer('flag_stale', { mode: 'boolean' }).notNull(),
    requireReview: integer('require_review', { mode: 'boolean' }).notNull(),
    approvers: enumText('approvers', 'approverPolicy').notNull(),
    pressEmail: text('press_email').notNull(),
    contactEmail: text('contact_email').notNull(),
    updatedAt: ms('updated_at').notNull(),
  },
  (t) => [
    check('settings_singleton_check', sql`id = 1`),
    check('settings_flag_stale_check', sql`flag_stale IN (0, 1)`),
    check('settings_require_review_check', sql`require_review IN (0, 1)`),
    enumCheck('settings_stale_policy_check', t.stalePolicy, 'stalePolicy'),
    enumCheck('settings_approvers_check', t.approvers, 'approverPolicy'),
  ]
);
export const pressKit = sqliteTable(
  'press_kit',
  {
    id: integer('id').primaryKey(),
    embargoUntil: ms('embargo_until'),
    zipR2Key: text('zip_r2_key'),
    zipBytes: integer('zip_bytes'),
    builtAt: ms('built_at'),
    status: enumText('status', 'pressKitState').notNull(),
  },
  (t) => [
    check('press_kit_singleton_check', sql`id = 1`),
    enumCheck('press_kit_status_check', t.status, 'pressKitState'),
  ]
);
export const pressKitAsset = sqliteTable(
  'press_kit_asset',
  {
    mediaId: text('media_id')
      .primaryKey()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [index('press_kit_asset_order_idx').on(t.sortOrder)]
);
export const newsletterSubscriber = sqliteTable(
  'newsletter_subscriber',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    locale: enumText('locale', 'locale').notNull(),
    consentVersion: text('consent_version').notNull(),
    createdAt: ms('created_at').notNull(),
  },
  (t) => [
    check('newsletter_email_normalized_check', sql`email = lower(trim(email))`),
    uniqueIndex('newsletter_email_unique').on(t.email),
    enumCheck('newsletter_locale_check', t.locale, 'locale'),
    index('newsletter_created_idx').on(t.createdAt),
  ]
);
