-- ==========================================
-- Session 30: Pending Booking Management
-- Migration: Add expires_at column
-- Date: January 16, 2026
-- ==========================================

-- Add expires_at column to bookings table
ALTER TABLE `bookings` 
ADD COLUMN `expires_at` DATETIME NULL DEFAULT NULL COMMENT '12-hour expiry time for pending bookings' 
AFTER `status`;

-- Create index for efficient expiry checks
CREATE INDEX `idx_bookings_expires_at` ON `bookings` (`expires_at`, `status`);

-- Update existing pending/pending_payment bookings with 12-hour expiry from created_at
UPDATE `bookings` 
SET `expires_at` = DATE_ADD(`created_at`, INTERVAL 12 HOUR)
WHERE `status` IN ('pending', 'pending_payment') 
AND `expires_at` IS NULL;

-- Verification query (run after migration)
-- SELECT id, status, created_at, expires_at FROM bookings WHERE status IN ('pending', 'pending_payment');
