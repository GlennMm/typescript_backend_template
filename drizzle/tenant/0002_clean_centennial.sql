CREATE TABLE `branch_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`minimum_stock` real DEFAULT 0,
	`maximum_stock` real,
	`last_restocked` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`use_shop_vat` integer DEFAULT true NOT NULL,
	`use_shop_tin` integer DEFAULT true NOT NULL,
	`use_shop_business_reg` integer DEFAULT true NOT NULL,
	`use_shop_tax_rate` integer DEFAULT true NOT NULL,
	`use_shop_address` integer DEFAULT false NOT NULL,
	`use_shop_contact` integer DEFAULT false NOT NULL,
	`use_shop_currency` integer DEFAULT true NOT NULL,
	`use_shop_receipts` integer DEFAULT true NOT NULL,
	`vat_number` text,
	`tin_number` text,
	`business_registration_number` text,
	`tax_rate` real,
	`address_line1` text,
	`address_line2` text,
	`city` text,
	`state_province` text,
	`postal_code` text,
	`country` text,
	`phone_number` text,
	`alternative_phone` text,
	`email` text,
	`fax_number` text,
	`currency` text,
	`timezone` text,
	`opening_hours` text,
	`receipt_header` text,
	`receipt_footer` text,
	`logo_url` text,
	`manager_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branches_code_unique` ON `branches` (`code`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`date_of_birth` integer,
	`loyalty_points` integer DEFAULT 0,
	`last_purchase_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`from_branch_id` text NOT NULL,
	`to_branch_id` text NOT NULL,
	`quantity` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`requested_by` text NOT NULL,
	`approved_by` text,
	`requested_at` integer DEFAULT (unixepoch()) NOT NULL,
	`approved_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parent_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`barcode` text,
	`category_id` text,
	`description` text,
	`price` real NOT NULL,
	`cost` real,
	`unit` text DEFAULT 'piece' NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`trading_name` text,
	`vat_number` text,
	`tin_number` text,
	`business_registration_number` text,
	`default_tax_rate` real DEFAULT 0 NOT NULL,
	`address_line1` text NOT NULL,
	`address_line2` text,
	`city` text NOT NULL,
	`state_province` text,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`phone_number` text NOT NULL,
	`alternative_phone` text,
	`email` text NOT NULL,
	`fax_number` text,
	`website` text,
	`default_currency` text DEFAULT 'USD' NOT NULL,
	`default_timezone` text,
	`logo_url` text,
	`default_receipt_header` text,
	`default_receipt_footer` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`role_at_branch` text,
	`assigned_at` integer DEFAULT (unixepoch()) NOT NULL,
	`assigned_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `users` ADD `primary_branch_id` text REFERENCES branches(id);