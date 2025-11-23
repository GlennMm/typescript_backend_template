ALTER TABLE users ADD `otp_hash` text;--> statement-breakpoint
ALTER TABLE users ADD `otp_expires_at` integer;--> statement-breakpoint
ALTER TABLE users ADD `require_password_change` integer DEFAULT false NOT NULL;