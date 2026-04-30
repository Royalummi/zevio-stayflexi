-- Migration: Create user_settings table
-- Created: January 11, 2026 - Session 27
-- Purpose: Store user notification preferences and privacy settings

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `user_id` char(36) NOT NULL,
  
  -- Notification Settings
  `email_notifications` BOOLEAN DEFAULT TRUE COMMENT 'Email notifications for bookings and updates',
  `email_promotions` BOOLEAN DEFAULT TRUE COMMENT 'Promotional emails and newsletters',
  `email_reminders` BOOLEAN DEFAULT TRUE COMMENT 'Booking reminders and check-in alerts',
  
  `sms_notifications` BOOLEAN DEFAULT FALSE COMMENT 'SMS notifications for urgent updates',
  `sms_reminders` BOOLEAN DEFAULT FALSE COMMENT 'SMS reminders for bookings',
  
  `push_notifications` BOOLEAN DEFAULT TRUE COMMENT 'Browser/mobile push notifications',
  
  -- Privacy Settings
  `profile_visibility` ENUM('public', 'private') DEFAULT 'private' COMMENT 'Profile visibility to other users',
  `show_wishlist` BOOLEAN DEFAULT FALSE COMMENT 'Show wishlist publicly',
  `share_activity` BOOLEAN DEFAULT FALSE COMMENT 'Share booking activity with friends',
  
  -- Newsletter
  `newsletter_subscription` BOOLEAN DEFAULT TRUE COMMENT 'Subscribe to newsletter',
  
  -- Timestamps
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_user_settings_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Insert default settings for existing users
INSERT INTO `user_settings` (`id`, `user_id`, `email_notifications`, `email_promotions`, `email_reminders`, `sms_notifications`, `sms_reminders`, `push_notifications`, `profile_visibility`, `show_wishlist`, `share_activity`, `newsletter_subscription`)
SELECT 
  UUID(),
  `id`,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  TRUE,
  'private',
  FALSE,
  FALSE,
  TRUE
FROM `users`
WHERE NOT EXISTS (
  SELECT 1 FROM `user_settings` WHERE `user_settings`.`user_id` = `users`.`id`
);

-- Migration complete
