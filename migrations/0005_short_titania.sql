PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_newsletter_subscriber` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`locale` text NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "newsletter_email_normalized_check" CHECK("__new_newsletter_subscriber"."email" = lower(trim("__new_newsletter_subscriber"."email"))),
	CONSTRAINT "newsletter_locale_check" CHECK(locale IN ('en', 'es'))
);
--> statement-breakpoint
INSERT INTO `__new_newsletter_subscriber`("id", "email", "locale", "consent_version", "created_at") SELECT "id", "email", "locale", "consent_version", "created_at" FROM `newsletter_subscriber`;--> statement-breakpoint
DROP TABLE `newsletter_subscriber`;--> statement-breakpoint
ALTER TABLE `__new_newsletter_subscriber` RENAME TO `newsletter_subscriber`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_email_unique` ON `newsletter_subscriber` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_created_idx` ON `newsletter_subscriber` (`created_at`);