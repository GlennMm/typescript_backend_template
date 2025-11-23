CREATE TABLE `product_cost_history` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`purchase_id` text,
	`old_cost_price` real NOT NULL,
	`new_cost_price` real NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`quantity_received` real DEFAULT 0 NOT NULL,
	`current_cost_price` real NOT NULL,
	`total_amount` real NOT NULL,
	`new_cost_price` real NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `purchase_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency_id` text NOT NULL,
	`payment_method_id` text NOT NULL,
	`exchange_rate` real NOT NULL,
	`amount_in_base_currency` real NOT NULL,
	`reference_number` text,
	`payment_date` integer DEFAULT (unixepoch()) NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`po_number` text NOT NULL,
	`branch_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`purchase_date` integer DEFAULT (unixepoch()) NOT NULL,
	`expected_delivery_date` integer,
	`actual_delivery_date` integer,
	`invoice_number` text,
	`notes` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`shipping_cost` real DEFAULT 0,
	`tax_applied` integer DEFAULT false NOT NULL,
	`tax_amount` real DEFAULT 0,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`amount_due` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_po_number_unique` ON `purchases` (`po_number`);