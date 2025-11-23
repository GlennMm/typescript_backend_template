CREATE TABLE `cash_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`shift_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`currency_id` text NOT NULL,
	`reason` text NOT NULL,
	`notes` text,
	`approved_by` text,
	`approved_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `day_end_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`day_end_id` text NOT NULL,
	`payment_method_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`expected_amount` real NOT NULL,
	`actual_amount` real NOT NULL,
	`variance` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`day_end_id`) REFERENCES `day_ends`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `day_end_shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`day_end_id` text NOT NULL,
	`shift_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`day_end_id`) REFERENCES `day_ends`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `day_ends` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_id` text NOT NULL,
	`business_date` integer NOT NULL,
	`total_sales` real DEFAULT 0 NOT NULL,
	`total_cash` real DEFAULT 0 NOT NULL,
	`total_variance` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`closed_at` integer,
	`can_edit_until` integer,
	`created_by` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`till_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`cashier_id` text NOT NULL,
	`opening_balance` real DEFAULT 0 NOT NULL,
	`closing_balance` real,
	`expected_cash` real,
	`actual_cash` real,
	`variance` real,
	`status` text DEFAULT 'open' NOT NULL,
	`opened_at` integer DEFAULT (unixepoch()) NOT NULL,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`till_id`) REFERENCES `tills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tills` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_id` text NOT NULL,
	`till_number` text NOT NULL,
	`name` text NOT NULL,
	`device_id` text,
	`device_name` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `shift_id` text REFERENCES shifts(id);