CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`notes` text,
	`metadata` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`category` text DEFAULT 'general' NOT NULL,
	`due_at` integer NOT NULL,
	`repeat_interval` text,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
