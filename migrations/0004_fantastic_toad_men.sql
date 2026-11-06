PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	CONSTRAINT "media_asset_kind_check" CHECK(kind IN ('key_art', 'screenshot', 'photo', 'portrait', 'logo')),
	CONSTRAINT "media_asset_dimensions_check" CHECK((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0))
);
--> statement-breakpoint
INSERT INTO `__new_media_asset`("id", "r2_key", "kind", "mime", "bytes", "width", "height", "sha256", "created_at") SELECT "id", "r2_key", "kind", "mime", "bytes", "width", "height", "sha256", "created_at" FROM `media_asset`;--> statement-breakpoint
DROP TABLE `media_asset`;--> statement-breakpoint
ALTER TABLE `__new_media_asset` RENAME TO `media_asset`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `media_asset_r2_key_unique` ON `media_asset` (`r2_key`);