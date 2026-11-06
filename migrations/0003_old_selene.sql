PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	CONSTRAINT "home_section_bg_light_check" CHECK(bg_light IS NULL OR bg_light IN ('paper', 'card', 'sand', 'lamp', 'night_band')),
	CONSTRAINT "home_section_bg_dark_check" CHECK(bg_dark IS NULL OR bg_dark IN ('night', 'deep_sea', 'card', 'ember', 'cream_band')),
	CONSTRAINT "home_section_fg_light_check" CHECK(fg_light IS NULL OR fg_light IN ('auto', 'ink', 'slate', 'toasted_amber', 'sea_teal', 'cream', 'mist', 'amber', 'glow_teal')),
	CONSTRAINT "home_section_fg_dark_check" CHECK(fg_dark IS NULL OR fg_dark IN ('auto', 'ink', 'slate', 'toasted_amber', 'sea_teal', 'cream', 'mist', 'amber', 'glow_teal'))
);
--> statement-breakpoint
INSERT INTO `__new_home_section`("id", "page_id", "kind", "sort_order", "hidden", "animation", "bg_light", "fg_light", "bg_dark", "fg_dark") SELECT "id", "page_id", "kind", "sort_order", "hidden", "animation", "bg_light", "fg_light", "bg_dark", "fg_dark" FROM `home_section`;--> statement-breakpoint
DROP TABLE `home_section`;--> statement-breakpoint
ALTER TABLE `__new_home_section` RENAME TO `home_section`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `home_section_page_order_idx` ON `home_section` (`page_id`,`sort_order`);