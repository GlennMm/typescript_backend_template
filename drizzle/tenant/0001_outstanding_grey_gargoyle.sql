CREATE TABLE `stock_take_items` (
	`id` text PRIMARY KEY NOT NULL,
	`stock_take_id` text NOT NULL,
	`product_id` text NOT NULL,
	`expected_quantity` real NOT NULL,
	`actual_quantity` real,
	`variance` real,
	`notes` text,
	`counted_by` text,
	`counted_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`stock_take_id`) REFERENCES `stock_takes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`counted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stock_takes` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_id` text NOT NULL,
	`status` text DEFAULT 'initialized' NOT NULL,
	`created_by` text NOT NULL,
	`started_by` text,
	`counted_by` text,
	`approved_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`started_at` integer,
	`counted_at` integer,
	`approved_at` integer,
	`rejection_notes` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`started_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`counted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
