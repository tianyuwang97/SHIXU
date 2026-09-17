CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL,
	`credential_tag` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_session_expires` ON `admin_sessions` (`expires`);