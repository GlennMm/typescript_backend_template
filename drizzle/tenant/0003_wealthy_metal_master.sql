CREATE TABLE `branch_discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_id` text NOT NULL,
	`name` text NOT NULL,
	`percentage` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `branch_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_id` text NOT NULL,
	`quotation_validity_days` integer,
	`layby_deposit` real,
	`cancellation_fee` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branch_settings_branch_id_unique` ON `branch_settings` (`branch_id`);--> statement-breakpoint
CREATE TABLE `layby_items` (
	`id` text PRIMARY KEY NOT NULL,
	`layby_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`stock_reserved` integer DEFAULT false NOT NULL,
	`stock_reserved_at` integer,
	`discount_id` text,
	`discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`line_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`layby_id`) REFERENCES `laybys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `laybys` (
	`id` text PRIMARY KEY NOT NULL,
	`layby_number` text NOT NULL,
	`branch_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`layby_date` integer DEFAULT (unixepoch()) NOT NULL,
	`collected_at` integer,
	`cancelled_at` integer,
	`subtotal` real DEFAULT 0 NOT NULL,
	`sale_discount_id` text,
	`sale_discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`tax_mode` text NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`deposit_required` real NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`amount_due` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cancellation_fee` real,
	`cancellation_reason` text,
	`cancelled_by` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`sale_discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `laybys_layby_number_unique` ON `laybys` (`layby_number`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_number` text NOT NULL,
	`sale_id` text,
	`layby_id` text,
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
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`layby_id`) REFERENCES `laybys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt_number_unique` ON `payments` (`receipt_number`);--> statement-breakpoint
CREATE TABLE `quotation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`quotation_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`discount_id` text,
	`discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`line_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` text PRIMARY KEY NOT NULL,
	`quotation_number` text NOT NULL,
	`branch_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`quotation_date` integer DEFAULT (unixepoch()) NOT NULL,
	`validity_days` integer NOT NULL,
	`expiry_date` integer NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`sale_discount_id` text,
	`sale_discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`tax_mode` text NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`converted_to_sale_id` text,
	`converted_to_layby_id` text,
	`converted_at` integer,
	`notes` text,
	`created_by` text NOT NULL,
	`sent_by` text,
	`sent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`sale_discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`converted_to_sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`converted_to_layby_id`) REFERENCES `laybys`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotations_quotation_number_unique` ON `quotations` (`quotation_number`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`discount_id` text,
	`discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`line_total` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`branch_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`sale_type` text DEFAULT 'credit' NOT NULL,
	`sale_date` integer DEFAULT (unixepoch()) NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`sale_discount_id` text,
	`sale_discount_percentage` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`tax_mode` text NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`amount_due` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`sale_discount_id`) REFERENCES `branch_discounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_number_unique` ON `sales` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `tenant_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`quotation_validity_days` integer DEFAULT 30 NOT NULL,
	`tax_mode` text DEFAULT 'exclusive' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`layby_fee` real DEFAULT 0 NOT NULL,
	`cancellation_fee` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `customer_type` text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `vat_number` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `tin_number` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `branch_id` text REFERENCES branches(id);--> statement-breakpoint
ALTER TABLE `customers` ADD `is_walk_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `is_active` integer DEFAULT true NOT NULL;