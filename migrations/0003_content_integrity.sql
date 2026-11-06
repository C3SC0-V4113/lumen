PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_content_revision` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`locale` text NOT NULL,
	`version` integer NOT NULL,
	`data` text NOT NULL,
	`actor_id` text,
	`note` text,
	`state` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "content_revision_entity_check" CHECK(entity_type IN ('team_member', 'team_list', 'game', 'job', 'home')),
	CONSTRAINT "content_revision_locale_check" CHECK(locale IN ('en', 'es')),
	CONSTRAINT "content_revision_state_check" CHECK(state IN ('draft', 'review', 'approved', 'published', 'superseded')),
	CONSTRAINT "content_revision_version_check" CHECK(version >= 1),
	CONSTRAINT "content_revision_data_json_check" CHECK(json_valid(data))
);
--> statement-breakpoint
INSERT INTO `__new_content_revision`("id", "entity_type", "entity_id", "locale", "version", "data", "actor_id", "note", "state", "created_at") SELECT "id", "entity_type", "entity_id", "locale", "version", "data", "actor_id", "note", "state", "created_at" FROM `content_revision`;--> statement-breakpoint
DROP TABLE `content_revision`;--> statement-breakpoint
ALTER TABLE `__new_content_revision` RENAME TO `content_revision`;--> statement-breakpoint
CREATE UNIQUE INDEX `content_revision_version_unique` ON `content_revision` (`entity_type`,`entity_id`,`locale`,`version`);--> statement-breakpoint
CREATE INDEX `content_revision_entity_idx` ON `content_revision` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `__new_home_section` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`kind` text NOT NULL,
	`sort_order` integer NOT NULL,
	`hidden` integer NOT NULL,
	`animation` text NOT NULL,
	`bg_light` text,
	`fg_light` text,
	`bg_dark` text,
	`fg_dark` text,
	FOREIGN KEY (`page_id`) REFERENCES `page`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "home_section_kind_check" CHECK(kind IN ('hero', 'grid', 'team', 'steps', 'cta', 'form')),
	CONSTRAINT "home_section_animation_check" CHECK(animation IN ('fade_up', 'none')),
	CONSTRAINT "home_section_hidden_check" CHECK(hidden IN (0, 1)),
	CONSTRAINT "home_section_bg_light_check" CHECK(bg_light IS NULL OR bg_light IN ('paper', 'card', 'sand', 'lamp', 'night_band')),
	CONSTRAINT "home_section_bg_dark_check" CHECK(bg_dark IS NULL OR bg_dark IN ('night', 'deep_sea', 'card', 'ember', 'cream_band')),
	CONSTRAINT "home_section_fg_light_check" CHECK(fg_light IS NULL OR fg_light IN ('auto', 'ink', 'slate', 'toasted_amber', 'sea_teal', 'cream', 'mist', 'amber', 'glow_teal')),
	CONSTRAINT "home_section_fg_dark_check" CHECK(fg_dark IS NULL OR fg_dark IN ('auto', 'ink', 'slate', 'toasted_amber', 'sea_teal', 'cream', 'mist', 'amber', 'glow_teal'))
);
--> statement-breakpoint
INSERT INTO `__new_home_section`("id", "page_id", "kind", "sort_order", "hidden", "animation", "bg_light", "fg_light", "bg_dark", "fg_dark") SELECT "id", "page_id", "kind", "sort_order", "hidden", "animation", "bg_light", "fg_light", "bg_dark", "fg_dark" FROM `home_section`;--> statement-breakpoint
DROP TABLE `home_section`;--> statement-breakpoint
ALTER TABLE `__new_home_section` RENAME TO `home_section`;--> statement-breakpoint
CREATE INDEX `home_section_page_order_idx` ON `home_section` (`page_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `__new_job` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`discipline` text NOT NULL,
	`status` text NOT NULL,
	`apply_url` text NOT NULL,
	`applicants_count` integer,
	`closes_at` integer,
	`closed_at` integer,
	`filled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "job_discipline_check" CHECK(discipline IN ('art', 'code', 'design', 'sound', 'production')),
	CONSTRAINT "job_status_check" CHECK(status IN ('draft', 'open', 'closed', 'filled')),
	CONSTRAINT "job_applicants_count_check" CHECK(applicants_count IS NULL OR applicants_count >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_job`("id", "slug", "discipline", "status", "apply_url", "applicants_count", "closes_at", "closed_at", "filled_at", "created_at", "updated_at") SELECT "id", "slug", "discipline", "status", "apply_url", "applicants_count", "closes_at", "closed_at", "filled_at", "created_at", "updated_at" FROM `job`;--> statement-breakpoint
DROP TABLE `job`;--> statement-breakpoint
ALTER TABLE `__new_job` RENAME TO `job`;--> statement-breakpoint
CREATE UNIQUE INDEX `job_slug_unique` ON `job` (`slug`);--> statement-breakpoint
CREATE INDEX `job_status_discipline_idx` ON `job` (`status`,`discipline`);--> statement-breakpoint
CREATE INDEX `job_closes_at_idx` ON `job` (`closes_at`);--> statement-breakpoint
CREATE TABLE `__new_media_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`sha256` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "media_asset_bytes_check" CHECK(bytes > 0),
	CONSTRAINT "media_asset_kind_check" CHECK(kind IN ('key_art', 'screenshot', 'photo', 'portrait', 'logo')),
	CONSTRAINT "media_asset_dimensions_check" CHECK((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0))
);
--> statement-breakpoint
INSERT INTO `__new_media_asset`("id", "r2_key", "kind", "mime", "bytes", "width", "height", "sha256", "created_at") SELECT "id", "r2_key", "kind", "mime", "bytes", "width", "height", "sha256", "created_at" FROM `media_asset`;--> statement-breakpoint
DROP TABLE `media_asset`;--> statement-breakpoint
ALTER TABLE `__new_media_asset` RENAME TO `media_asset`;--> statement-breakpoint
CREATE UNIQUE INDEX `media_asset_r2_key_unique` ON `media_asset` (`r2_key`);--> statement-breakpoint
CREATE TABLE `__new_published_snapshot` (
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`locale` text NOT NULL,
	`version` integer NOT NULL,
	`source_version` integer,
	`data` text NOT NULL,
	`published_at` integer NOT NULL,
	PRIMARY KEY(`entity_type`, `entity_id`, `locale`),
	CONSTRAINT "published_snapshot_entity_check" CHECK(entity_type IN ('team_member', 'team_list', 'game', 'job', 'home')),
	CONSTRAINT "published_snapshot_locale_check" CHECK(locale IN ('en', 'es')),
	CONSTRAINT "published_snapshot_version_check" CHECK(version >= 1),
	CONSTRAINT "published_snapshot_data_json_check" CHECK(json_valid(data))
);
--> statement-breakpoint
INSERT INTO `__new_published_snapshot`("entity_type", "entity_id", "locale", "version", "source_version", "data", "published_at") SELECT "entity_type", "entity_id", "locale", "version", "source_version", "data", "published_at" FROM `published_snapshot`;--> statement-breakpoint
DROP TABLE `published_snapshot`;--> statement-breakpoint
ALTER TABLE `__new_published_snapshot` RENAME TO `published_snapshot`;--> statement-breakpoint
CREATE INDEX `published_snapshot_locale_type_idx` ON `published_snapshot` (`locale`,`entity_type`);--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`studio_name` text NOT NULL,
	`stale_policy` text NOT NULL,
	`flag_stale` integer NOT NULL,
	`require_review` integer NOT NULL,
	`approvers` text NOT NULL,
	`press_email` text NOT NULL,
	`contact_email` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "settings_singleton_check" CHECK(id = 1),
	CONSTRAINT "settings_flag_stale_check" CHECK(flag_stale IN (0, 1)),
	CONSTRAINT "settings_require_review_check" CHECK(require_review IN (0, 1)),
	CONSTRAINT "settings_stale_policy_check" CHECK(stale_policy IN ('keep', 'source', 'hide')),
	CONSTRAINT "settings_approvers_check" CHECK(approvers IN ('editors_and_admins', 'admins'))
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "studio_name", "stale_policy", "flag_stale", "require_review", "approvers", "press_email", "contact_email", "updated_at") SELECT "id", "studio_name", "stale_policy", "flag_stale", "require_review", "approvers", "press_email", "contact_email", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE TABLE `__new_team_link` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`year` integer,
	FOREIGN KEY (`member_id`) REFERENCES `team_member`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "team_link_kind_check" CHECK(kind IN ('talk', 'interview', 'portfolio', 'social')),
	CONSTRAINT "team_link_year_check" CHECK(year IS NULL OR year BETWEEN 1900 AND 2100)
);
--> statement-breakpoint
INSERT INTO `__new_team_link`("id", "member_id", "sort_order", "kind", "url", "year") SELECT "id", "member_id", "sort_order", "kind", "url", "year" FROM `team_link`;--> statement-breakpoint
DROP TABLE `team_link`;--> statement-breakpoint
ALTER TABLE `__new_team_link` RENAME TO `team_link`;--> statement-breakpoint
CREATE INDEX `team_link_member_order_idx` ON `team_link` (`member_id`,`sort_order`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
