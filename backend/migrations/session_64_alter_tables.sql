-- ============================================
-- SESSION 64: MINIMAL SAFE MIGRATION
-- Only add new columns, don't rename/modify existing ones
-- Date: February 15, 2026  
-- ============================================

-- ============================================  
-- 1. BOOKINGS TABLE - Add service charge and coupon tracking
-- ============================================

ALTER TABLE `bookings`
ADD COLUMN IF NOT EXISTS `service_charge` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Platform fee (5%)' AFTER `gst_amount`,
ADD COLUMN IF NOT EXISTS `coupon_id` CHAR(36) DEFAULT NULL AFTER `service_charge`,
ADD COLUMN IF NOT EXISTS `coupon_code` VARCHAR(50) DEFAULT NULL AFTER `coupon_id`,
ADD COLUMN IF NOT EXISTS `coupon_discount` DECIMAL(10,2) DEFAULT 0.00 AFTER `coupon_code`;

-- ============================================
-- 2. COUPONS TABLE - Add missing fields only
-- ============================================

ALTER TABLE `coupons`
ADD COLUMN IF NOT EXISTS `type` ENUM('percentage', 'flat', 'first_time') NOT NULL DEFAULT 'percentage' AFTER `code`,
ADD COLUMN IF NOT EXISTS `usage_count` INT DEFAULT 0 AFTER `usage_limit`,
ADD COLUMN IF NOT EXISTS `per_user_limit` INT DEFAULT 1 AFTER `usage_count`,
ADD COLUMN IF NOT EXISTS `description` TEXT DEFAULT NULL AFTER `per_user_limit`,
ADD COLUMN IF NOT EXISTS `created_by` CHAR(36) DEFAULT NULL AFTER `description`,
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_by`,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ============================================
-- 3. COUPON_USAGES TABLE - Add reservation tracking
-- ============================================

ALTER TABLE `coupon_usages`
ADD COLUMN IF NOT EXISTS `discount_applied` DECIMAL(10,2) DEFAULT 0.00 AFTER `booking_id`,
ADD COLUMN IF NOT EXISTS `status` ENUM('reserved', 'completed', 'cancelled') DEFAULT 'completed' AFTER `discount_applied`;

-- ============================================
-- 4. REVIEWS TABLE - Add admin moderation
-- ============================================

ALTER TABLE `reviews`
ADD COLUMN IF NOT EXISTS `overall_rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0 AFTER `value_rating`,
ADD COLUMN IF NOT EXISTS `guest_name` VARCHAR(150) DEFAULT NULL AFTER `review_text`,
ADD COLUMN IF NOT EXISTS `is_visible` BOOLEAN DEFAULT FALSE AFTER `status`,
ADD COLUMN IF NOT EXISTS `is_edited_by_admin` BOOLEAN DEFAULT FALSE AFTER `is_visible`,
ADD COLUMN IF NOT EXISTS `admin_edit_reason` VARCHAR(500) DEFAULT NULL AFTER `is_edited_by_admin`,
ADD COLUMN IF NOT EXISTS `reviewed_by` CHAR(36) DEFAULT NULL AFTER `admin_edit_reason`,
ADD COLUMN IF NOT EXISTS `reviewed_at` TIMESTAMP NULL DEFAULT NULL AFTER `reviewed_by`;

-- ============================================
-- 5. CREATE REVIEW_PHOTOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `review_photos` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `review_id` CHAR(36) NOT NULL,
  `photo_url` VARCHAR(500) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 1,
  `file_size` INT DEFAULT NULL,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_review_photos_review` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CREATE REVIEW_EMAIL_LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `review_email_log` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `email_type` ENUM('initial', 'reminder_7d', 'reminder_14d', 'manual') NOT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` CHAR(36) DEFAULT NULL,
  `custom_message` TEXT DEFAULT NULL,
  INDEX `idx_review_email_booking` (`booking_id`),
  INDEX `idx_review_email_type` (`email_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

SELECT 'SESSION 64 MINIMAL MIGRATION COMPLETED!' AS Status;
