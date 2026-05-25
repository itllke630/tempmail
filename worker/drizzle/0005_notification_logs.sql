CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` text NOT NULL PRIMARY KEY,
  `recipient` text NOT NULL,
  `step` text NOT NULL,
  `detail` text,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_notification_logs_recipient`
ON `notification_logs` (`recipient`);
