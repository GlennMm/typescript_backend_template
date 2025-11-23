CREATE TABLE `inventory_loss_items` (
	`id` text PRIMARY KEY NOT NULL,
	`loss_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`cost_price` real NOT NULL,
	`line_total` real NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`loss_id`) REFERENCES `inventory_losses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `inventory_losses` (
	`id` text PRIMARY KEY NOT NULL,
	`loss_number` text NOT NULL,
	`branch_id` text NOT NULL,
	`loss_type` text NOT NULL,
	`reason` text NOT NULL,
	`reference_number` text,
	`total_value` real DEFAULT 0 NOT NULL,
	`expense_category_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`loss_date` integer DEFAULT (unixepoch()) NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_losses_loss_number_unique` ON `inventory_losses` (`loss_number`);