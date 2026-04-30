-- ============================================
-- SESSION 64: REVIEWS, COUPONS & SERVICE CHARGE
-- Date: February 15, 2026
-- Developer: AI Senior Full-Stack Developer
-- ============================================

-- ============================================
-- 1. MODIFY BOOKINGS TABLE
-- Add service charge and coupon tracking
-- ============================================

ALTER TABLE `bookings` 
ADD COLUMN `service_charge` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Platform fee (5% of booking amount)' AFTER `gst_amount`,
ADD COLUMN `coupon_id` CHAR(36) DEFAULT NULL COMMENT 'Applied coupon ID' AFTER `service_charge`,
ADD COLUMN `coupon_code` VARCHAR(50) DEFAULT NULL COMMENT 'Applied coupon code' AFTER `coupon_id`,
ADD COLUMN `coupon_discount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Discount amount from coupon' AFTER `coupon_code`;

-- Add foreign key constraint
ALTER TABLE `bookings`
ADD CONSTRAINT `fk_bookings_coupon` 
FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) 
ON DELETE SET NULL;

-- ============================================
-- 2. COUPONS TABLE
-- Store discount codes and promotional offers
-- ============================================

CREATE TABLE `coupons` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Coupon code (e.g., SAVE10, WELCOME15)',
  `type` ENUM('percentage', 'flat', 'first_time') NOT NULL COMMENT 'Discount type',
  `discount_percentage` DECIMAL(5,2) DEFAULT NULL COMMENT 'Percentage off (e.g., 10.00 for 10%)',
  `discount_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Flat discount amount (e.g., 500.00)',
  `min_booking_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Minimum booking amount to apply coupon',
  `max_discount_cap` DECIMAL(10,2) DEFAULT NULL COMMENT 'Maximum discount limit for percentage coupons',
  `valid_from` DATE NOT NULL COMMENT 'Coupon valid from date',
  `valid_until` DATE NOT NULL COMMENT 'Coupon expiry date',
  `usage_limit` INT DEFAULT NULL COMMENT 'Total usage limit (NULL = unlimited)',
  `usage_count` INT DEFAULT 0 COMMENT 'Current usage count',
  `per_user_limit` INT DEFAULT 1 COMMENT 'Usage limit per user',
  `applicable_properties` JSON DEFAULT NULL COMMENT 'Property IDs coupon applies to (NULL = all)',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Coupon active status',
  `description` TEXT DEFAULT NULL COMMENT 'Coupon description for users',
  `created_by` CHAR(36) DEFAULT NULL COMMENT 'Admin who created coupon',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_coupons_admin` FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  INDEX `idx_coupon_code` (`code`),
  INDEX `idx_coupon_type` (`type`),
  INDEX `idx_coupon_active` (`is_active`),
  INDEX `idx_coupon_dates` (`valid_from`, `valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. COUPON USAGE TABLE
-- Track coupon redemptions and user eligibility
-- ============================================

CREATE TABLE `coupon_usage` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `coupon_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `booking_id` CHAR(36) DEFAULT NULL COMMENT 'Booking ID (NULL if reserved)',
  `discount_applied` DECIMAL(10,2) NOT NULL COMMENT 'Discount amount applied',
  `status` ENUM('reserved', 'completed', 'cancelled') DEFAULT 'reserved' COMMENT 'reserved=locked at checkout, completed=payment done',
  `reserved_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When coupon was applied at checkout',
  `completed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When payment was completed',
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When reservation was cancelled',
  CONSTRAINT `fk_coupon_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_coupon_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_coupon_usage_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL,
  INDEX `idx_coupon_usage_user` (`user_id`),
  INDEX `idx_coupon_usage_coupon` (`coupon_id`),
  INDEX `idx_coupon_usage_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. REVIEWS TABLE
-- Store property reviews from guests
-- ============================================

CREATE TABLE `reviews` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL UNIQUE COMMENT 'One review per booking',
  `user_id` CHAR(36) NOT NULL,
  `property_id` CHAR(36) NOT NULL,
  
  -- Rating Categories (1-5 stars)
  `cleanliness_rating` INT NOT NULL COMMENT 'Cleanliness rating (1-5)',
  `accuracy_rating` INT NOT NULL COMMENT 'Accuracy rating (1-5)',
  `communication_rating` INT NOT NULL COMMENT 'Communication rating (1-5)',
  `location_rating` INT NOT NULL COMMENT 'Location rating (1-5)',
  `checkin_rating` INT NOT NULL COMMENT 'Check-in experience rating (1-5)',
  `value_rating` INT NOT NULL COMMENT 'Value for money rating (1-5)',
  `overall_rating` DECIMAL(2,1) NOT NULL COMMENT 'Weighted overall rating (calculated)',
  
  -- Review Content
  `review_text` TEXT DEFAULT NULL COMMENT 'Written review (optional)',
  `guest_name` VARCHAR(150) NOT NULL COMMENT 'Guest name at time of review',
  
  -- Moderation & Status
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Admin moderation status',
  `is_visible` BOOLEAN DEFAULT FALSE COMMENT 'Show on property page',
  `is_edited_by_admin` BOOLEAN DEFAULT FALSE COMMENT 'Was review edited by admin',
  `admin_edit_reason` VARCHAR(500) DEFAULT NULL COMMENT 'Reason for admin edit',
  `rejection_reason` TEXT DEFAULT NULL COMMENT 'Reason for rejection',
  
  -- Admin Actions
  `reviewed_by` CHAR(36) DEFAULT NULL COMMENT 'Admin who approved/rejected',
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When review was moderated',
  
  -- Timestamps
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_property` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_cleanliness_rating` CHECK (`cleanliness_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_accuracy_rating` CHECK (`accuracy_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_communication_rating` CHECK (`communication_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_location_rating` CHECK (`location_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_checkin_rating` CHECK (`checkin_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_value_rating` CHECK (`value_rating` BETWEEN 1 AND 5),
  CONSTRAINT `chk_overall_rating` CHECK (`overall_rating` BETWEEN 1.0 AND 5.0),
  INDEX `idx_reviews_property` (`property_id`),
  INDEX `idx_reviews_user` (`user_id`),
  INDEX `idx_reviews_status` (`status`),
  INDEX `idx_reviews_visible` (`is_visible`),
  INDEX `idx_reviews_rating` (`overall_rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. REVIEW PHOTOS TABLE
-- Store review images (R2 storage)
-- ============================================

CREATE TABLE `review_photos` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `review_id` CHAR(36) NOT NULL,
  `photo_url` VARCHAR(500) NOT NULL COMMENT 'R2 storage URL',
  `display_order` INT NOT NULL DEFAULT 1 COMMENT 'Photo display sequence',
  `file_size` INT DEFAULT NULL COMMENT 'File size in bytes',
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_review_photos_review` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE,
  INDEX `idx_review_photos_review` (`review_id`),
  INDEX `idx_review_photos_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. REVIEW EMAIL LOG TABLE
-- Track review request emails sent to users
-- ============================================

CREATE TABLE `review_email_log` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `email_type` ENUM('initial', 'reminder_7d', 'reminder_14d', 'manual') NOT NULL COMMENT 'Email trigger type',
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` CHAR(36) DEFAULT NULL COMMENT 'Admin ID if manual send',
  `custom_message` TEXT DEFAULT NULL COMMENT 'Custom message for manual emails',
  CONSTRAINT `fk_review_email_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_email_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_email_admin` FOREIGN KEY (`sent_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  INDEX `idx_review_email_booking` (`booking_id`),
  INDEX `idx_review_email_type` (`email_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. SAMPLE DATA (for testing)
-- ============================================

-- Sample Coupons
INSERT INTO `coupons` (`id`, `code`, `type`, `discount_percentage`, `discount_amount`, `min_booking_amount`, `max_discount_cap`, `valid_from`, `valid_until`, `usage_limit`, `description`, `created_by`) VALUES
(UUID(), 'SAVE10', 'percentage', 10.00, NULL, 5000.00, 1000.00, '2026-02-15', '2026-12-31', 100, '10% off on bookings above ₹5,000', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'),
(UUID(), 'FLAT500', 'flat', NULL, 500.00, 3000.00, NULL, '2026-02-15', '2026-06-30', 50, 'Flat ₹500 off on bookings above ₹3,000', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'),
(UUID(), 'WELCOME15', 'first_time', 15.00, NULL, 0.00, 3000.00, '2026-02-15', '2027-12-31', NULL, 'Welcome offer: 15% off on your first booking!', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e');

-- ============================================
-- 8. UPDATE ACTIVITY LOGS FOR NEW ACTIONS
-- ============================================

-- Activity log examples (will be created by application):
-- - 'Created coupon' → entity: 'coupon'
-- - 'Approved review' → entity: 'review'
-- - 'Edited review' → entity: 'review'
-- - 'Rejected review' → entity: 'review'

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✅ Modified bookings table (service_charge, coupon tracking)
-- ✅ Created coupons table (discount management)
-- ✅ Created coupon_usage table (redemption tracking)
-- ✅ Created reviews table (guest feedback)
-- ✅ Created review_photos table (R2 image storage)
-- ✅ Created review_email_log table (email automation tracking)
-- ✅ Added sample coupon data
-- ✅ All foreign keys and indexes configured

SELECT 'SESSION 64 DATABASE MIGRATION COMPLETED SUCCESSFULLY!' AS Status;
