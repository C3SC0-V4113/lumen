ALTER TABLE `home_section_item` ADD COLUMN `state` text CHECK(state IS NULL OR state IN ('done', 'now', 'next', 'later'));
--> statement-breakpoint
