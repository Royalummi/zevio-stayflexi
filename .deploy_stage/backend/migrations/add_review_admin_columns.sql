-- Migration: Add missing review admin columns
-- Date: 2026-02-15
-- Description: Adds columns for admin review management functionality

USE zevio;

-- Add missing columns to reviews table
ALTER TABLE `reviews`
ADD COLUMN `guest_name` VARCHAR(150) NULL COMMENT 'Custom display name for the reviewer' AFTER `review_text`,
ADD COLUMN `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether review is visible to public' AFTER `status`,
ADD COLUMN `is_edited_by_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether admin has edited the review' AFTER `is_visible`,
ADD COLUMN `admin_edit_reason` TEXT NULL COMMENT 'Reason for admin edit or rejection' AFTER `is_edited_by_admin`,
ADD COLUMN `reviewed_by` CHAR(36) NULL COMMENT 'Admin ID who reviewed' AFTER `admin_edit_reason`,
ADD COLUMN `reviewed_at` TIMESTAMP NULL COMMENT 'When admin reviewed' AFTER `reviewed_by`;

-- Add foreign key for reviewed_by (optional, comment out if you don't want constraint)
ALTER TABLE `reviews`
ADD CONSTRAINT `fk_reviews_reviewed_by` 
FOREIGN KEY (`reviewed_by`) REFERENCES `admins`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX `idx_reviews_is_visible` ON `reviews`(`is_visible`);
CREATE INDEX `idx_reviews_status_visible` ON `reviews`(`status`, `is_visible`);
CREATE INDEX `idx_reviews_reviewed_by` ON `reviews`(`reviewed_by`);

SELECT 'Migration completed successfully!' AS message;
