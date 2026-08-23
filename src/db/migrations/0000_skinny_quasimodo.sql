CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`performed_by` text DEFAULT 'system' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '📦' NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`category_name` text NOT NULL,
	`content_type` text NOT NULL,
	`delivered_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	`price_label` text NOT NULL,
	`is_delivered` integer DEFAULT false NOT NULL,
	`delivered_to` integer,
	`delivered_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`delivered_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` integer NOT NULL,
	`username` text,
	`first_name` text NOT NULL,
	`last_name` text,
	`is_blocked` integer DEFAULT false NOT NULL,
	`total_received` integer DEFAULT 0 NOT NULL,
	`first_seen` text DEFAULT (current_timestamp) NOT NULL,
	`last_seen` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);