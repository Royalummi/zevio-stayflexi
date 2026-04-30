-- =====================================================
-- SESSION 35: SERVICE APARTMENTS EXPANSION - MIGRATION 1/4
-- Create property_types table for flexible property taxonomy
-- Date: January 17, 2026
-- =====================================================

USE zevio;

-- Create property_types table
CREATE TABLE IF NOT EXISTS `property_types` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Display name: Villa, Service Apartment, Cottage, etc.',
  `slug` VARCHAR(100) NOT NULL UNIQUE COMMENT 'URL-friendly slug: villa, service-apartment, cottage',
  `stay_type` ENUM('short_term', 'long_term', 'hybrid') NOT NULL COMMENT 'Primary stay duration type',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT 'Icon name for UI: FiHome, FiBuilding, etc.',
  `description` TEXT DEFAULT NULL COMMENT 'Property type description',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Active status',
  `sort_order` INT DEFAULT 0 COMMENT 'Display order (lower = first)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial property types
INSERT INTO `property_types` (`id`, `name`, `slug`, `stay_type`, `icon`, `description`, `is_active`, `sort_order`, `created_at`) VALUES
('pt-001', 'Villa', 'villa', 'short_term', 'FiHome', 'Luxury vacation villas for short-term stays', TRUE, 1, NOW()),
('pt-002', 'Service Apartment', 'service-apartment', 'long_term', 'FiBuilding', 'Fully serviced apartments for extended stays (7-180 days)', TRUE, 2, NOW()),
('pt-003', 'Cottage', 'cottage', 'short_term', 'FiHome', 'Cozy cottages in nature', TRUE, 3, NOW()),
('pt-004', 'Penthouse', 'penthouse', 'hybrid', 'FiTrendingUp', 'Luxury penthouses for short or long stays', TRUE, 4, NOW());

-- Add property_type_id column to properties table (without foreign key first)
ALTER TABLE `properties` 
  ADD COLUMN `property_type_id` CHAR(36) DEFAULT NULL AFTER `city_id`,
  ADD INDEX `idx_property_type` (`property_type_id`);

-- Create index on stay_type for performance
CREATE INDEX `idx_stay_type` ON `properties`(`property_type`);

-- Update existing properties to link with Villa type (default)
-- All current properties are villas, so link them to pt-001
UPDATE `properties` SET `property_type_id` = 'pt-001' WHERE `property_type` = 'Villa' OR `property_type_id` IS NULL;

-- Now add the foreign key constraint after data is populated
ALTER TABLE `properties` 
  ADD CONSTRAINT `fk_property_type` 
  FOREIGN KEY (`property_type_id`) REFERENCES `property_types`(`id`) ON DELETE SET NULL;

-- Add comment to property_type column for clarity
ALTER TABLE `properties` 
  MODIFY COLUMN `property_type` VARCHAR(100) DEFAULT 'Villa' 
  COMMENT 'Legacy field - Use property_type_id instead (kept for backward compatibility)';

-- =====================================================
-- MIGRATION COMPLETE: property_types table created
-- Next: Run migration 2 (booking_calendar table)
-- =====================================================
