-- Migration: Add Featured Properties Support
-- Created: February 12, 2026
-- Purpose: Add is_featured and priority_order columns to properties table

-- Add is_featured column
ALTER TABLE `properties` 
ADD COLUMN `is_featured` TINYINT(1) DEFAULT 0 
COMMENT 'Whether property is featured in hero/homepage sections' 
AFTER `status`;

-- Add priority_order column for featured properties
ALTER TABLE `properties` 
ADD COLUMN `priority_order` INT(11) DEFAULT 0 
COMMENT 'Display order for featured properties (higher = shown first)' 
AFTER `is_featured`;

-- Add featured_at timestamp
ALTER TABLE `properties` 
ADD COLUMN `featured_at` TIMESTAMP NULL DEFAULT NULL 
COMMENT 'When property was marked as featured' 
AFTER `priority_order`;

-- Add featured_by admin tracking
ALTER TABLE `properties` 
ADD COLUMN `featured_by` CHAR(36) NULL DEFAULT NULL 
COMMENT 'Admin ID who marked property as featured' 
AFTER `featured_at`;

-- Create index for featured properties queries
ALTER TABLE `properties` 
ADD INDEX `idx_featured` (`is_featured`, `priority_order`, `status`);

-- Add foreign key for featured_by
ALTER TABLE `properties` 
ADD CONSTRAINT `fk_featured_by_admin` 
FOREIGN KEY (`featured_by`) 
REFERENCES `admins` (`id`) 
ON DELETE SET NULL;
