CREATE TABLE `content_revision` (
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
CREATE UNIQUE INDEX `content_revision_version_unique` ON `content_revision` (`entity_type`,`entity_id`,`locale`,`version`);--> statement-breakpoint
CREATE INDEX `content_revision_entity_idx` ON `content_revision` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`status` text NOT NULL,
	`cover_media_id` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_asset`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "game_status_check" CHECK(status IN ('draft', 'review', 'published', 'hidden'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_slug_unique` ON `game` (`slug`);--> statement-breakpoint
CREATE INDEX `game_status_order_idx` ON `game` (`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `game_cover_idx` ON `game` (`cover_media_id`);--> statement-breakpoint
CREATE TABLE `game_translation` (
	`game_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`release_label` text NOT NULL,
	`platforms_label` text NOT NULL,
	PRIMARY KEY(`game_id`, `locale`),
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "game_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE INDEX `game_translation_locale_idx` ON `game_translation` (`locale`);--> statement-breakpoint
CREATE TABLE `home_section` (
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
CREATE INDEX `home_section_page_order_idx` ON `home_section` (`page_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `home_section_item` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `home_section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `home_section_item_order_idx` ON `home_section_item` (`section_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `home_section_item_translation` (
	`item_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	PRIMARY KEY(`item_id`, `locale`),
	FOREIGN KEY (`item_id`) REFERENCES `home_section_item`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "home_section_item_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `home_section_translation` (
	`section_id` text NOT NULL,
	`locale` text NOT NULL,
	`heading` text,
	`body` text,
	PRIMARY KEY(`section_id`, `locale`),
	FOREIGN KEY (`section_id`) REFERENCES `home_section`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "home_section_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `job` (
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
CREATE UNIQUE INDEX `job_slug_unique` ON `job` (`slug`);--> statement-breakpoint
CREATE INDEX `job_status_discipline_idx` ON `job` (`status`,`discipline`);--> statement-breakpoint
CREATE INDEX `job_closes_at_idx` ON `job` (`closes_at`);--> statement-breakpoint
CREATE TABLE `job_translation` (
	`job_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`location_label` text NOT NULL,
	`summary` text NOT NULL,
	PRIMARY KEY(`job_id`, `locale`),
	FOREIGN KEY (`job_id`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "job_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `media_asset` (
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
CREATE UNIQUE INDEX `media_asset_r2_key_unique` ON `media_asset` (`r2_key`);--> statement-breakpoint
CREATE TABLE `media_asset_tag` (
	`asset_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`asset_id`, `tag_id`),
	FOREIGN KEY (`asset_id`) REFERENCES `media_asset`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `media_tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_asset_tag_tag_idx` ON `media_asset_tag` (`tag_id`);--> statement-breakpoint
CREATE TABLE `media_asset_translation` (
	`asset_id` text NOT NULL,
	`locale` text NOT NULL,
	`alt` text NOT NULL,
	PRIMARY KEY(`asset_id`, `locale`),
	FOREIGN KEY (`asset_id`) REFERENCES `media_asset`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "media_asset_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE INDEX `media_asset_translation_locale_idx` ON `media_asset_translation` (`locale`);--> statement-breakpoint
CREATE TABLE `media_tag` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_tag_slug_unique` ON `media_tag` (`slug`);--> statement-breakpoint
CREATE TABLE `newsletter_subscriber` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`locale` text NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "newsletter_email_normalized_check" CHECK(email = lower(trim(email))),
	CONSTRAINT "newsletter_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_email_unique` ON `newsletter_subscriber` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_created_idx` ON `newsletter_subscriber` (`created_at`);--> statement-breakpoint
CREATE TABLE `page` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "page_kind_check" CHECK(kind IN ('sections', 'derived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_slug_unique` ON `page` (`slug`);--> statement-breakpoint
CREATE TABLE `press_kit` (
	`id` integer PRIMARY KEY NOT NULL,
	`embargo_until` integer,
	`zip_r2_key` text,
	`zip_bytes` integer,
	`built_at` integer,
	`status` text NOT NULL,
	CONSTRAINT "press_kit_singleton_check" CHECK(id = 1),
	CONSTRAINT "press_kit_status_check" CHECK(status IN ('idle', 'building', 'ready', 'failed'))
);
--> statement-breakpoint
CREATE TABLE `press_kit_asset` (
	`media_id` text PRIMARY KEY NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media_asset`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `press_kit_asset_order_idx` ON `press_kit_asset` (`sort_order`);--> statement-breakpoint
CREATE TABLE `preview_link` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	CONSTRAINT "preview_link_entity_check" CHECK(entity_type IN ('team_member', 'team_list', 'game', 'job', 'home'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `preview_link_token_hash_unique` ON `preview_link` (`token_hash`);--> statement-breakpoint
CREATE INDEX `preview_link_entity_idx` ON `preview_link` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `preview_link_expiry_idx` ON `preview_link` (`expires_at`);--> statement-breakpoint
CREATE TABLE `published_snapshot` (
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
CREATE INDEX `published_snapshot_locale_type_idx` ON `published_snapshot` (`locale`,`entity_type`);--> statement-breakpoint
CREATE TABLE `roadmap_milestone` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "roadmap_state_check" CHECK(state IN ('done', 'current', 'upcoming'))
);
--> statement-breakpoint
CREATE INDEX `roadmap_game_order_idx` ON `roadmap_milestone` (`game_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `roadmap_milestone_translation` (
	`milestone_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`date_label` text NOT NULL,
	PRIMARY KEY(`milestone_id`, `locale`),
	FOREIGN KEY (`milestone_id`) REFERENCES `roadmap_milestone`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "roadmap_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `settings` (
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
CREATE TABLE `team_credit` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`game_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `team_member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_credit_member_order_idx` ON `team_credit` (`member_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `team_credit_game_idx` ON `team_credit` (`game_id`);--> statement-breakpoint
CREATE TABLE `team_credit_translation` (
	`credit_id` text NOT NULL,
	`locale` text NOT NULL,
	`work` text NOT NULL,
	`credit` text NOT NULL,
	PRIMARY KEY(`credit_id`, `locale`),
	FOREIGN KEY (`credit_id`) REFERENCES `team_credit`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "team_credit_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `team_link` (
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
CREATE INDEX `team_link_member_order_idx` ON `team_link` (`member_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `team_link_translation` (
	`link_id` text NOT NULL,
	`locale` text NOT NULL,
	`label` text NOT NULL,
	PRIMARY KEY(`link_id`, `locale`),
	FOREIGN KEY (`link_id`) REFERENCES `team_link`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "team_link_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE TABLE `team_member` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`discipline` text NOT NULL,
	`city` text,
	`portrait_media_id` text,
	`sort_order` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`portrait_media_id`) REFERENCES `media_asset`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "team_member_discipline_check" CHECK(discipline IN ('art', 'code', 'design', 'sound', 'production')),
	CONSTRAINT "team_member_status_check" CHECK(status IN ('draft', 'review', 'published', 'hidden'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_slug_unique` ON `team_member` (`slug`);--> statement-breakpoint
CREATE INDEX `team_member_status_order_idx` ON `team_member` (`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `team_member_portrait_idx` ON `team_member` (`portrait_media_id`);--> statement-breakpoint
CREATE TABLE `team_member_translation` (
	`member_id` text NOT NULL,
	`locale` text NOT NULL,
	`role` text NOT NULL,
	`bio` text,
	`made_in` text,
	`badge` text,
	`source_version` integer,
	PRIMARY KEY(`member_id`, `locale`),
	FOREIGN KEY (`member_id`) REFERENCES `team_member`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "team_member_translation_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
CREATE INDEX `team_member_translation_locale_idx` ON `team_member_translation` (`locale`);