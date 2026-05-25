CREATE TABLE IF NOT EXISTS `telegram_subscriptions` (
  `chat_id` integer NOT NULL,
  `address` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`chat_id`, `address`)
);

CREATE INDEX IF NOT EXISTS `idx_telegram_subscriptions_address`
ON `telegram_subscriptions` (`address`);
