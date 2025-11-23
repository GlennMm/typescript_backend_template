CREATE TABLE `subscription_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`max_users` integer NOT NULL,
	`features` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `super_admin_refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`super_admin_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `super_admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`subscription_plan_id` text NOT NULL,
	`subscription_status` text DEFAULT 'active' NOT NULL,
	`subscription_start_date` integer NOT NULL,
	`subscription_end_date` integer,
	`last_payment_date` integer,
	`grace_period_ends_at` integer,
	`db_path` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plans_name_unique` ON `subscription_plans` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `super_admin_refresh_tokens_token_unique` ON `super_admin_refresh_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `super_admins_email_unique` ON `super_admins` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);