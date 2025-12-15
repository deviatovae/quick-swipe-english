CREATE TABLE `word_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`interval` integer DEFAULT 1 NOT NULL,
	`repetitions` integer DEFAULT 0 NOT NULL,
	`next_review_date` integer,
	`last_review_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `word_progress_user_id_word_id_unique` ON `word_progress` (`user_id`,`word_id`);