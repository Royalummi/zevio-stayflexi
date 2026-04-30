-- =====================================================
-- RECOMMENDED PROPERTIES FEATURE - MIGRATION
-- Add fields to support admin-curated recommended properties
-- Date: February 1, 2026
-- =====================================================

USE zevio;

-- Add recommended properties fields to properties table
ALTER TABLE `properties`
  -- Recommended Status & Priority
  ADD COLUMN `is_recommended` TINYINT(1) DEFAULT 0 COMMENT 'Whether property is marked as recommended by admin',
  ADD COLUMN `recommended_priority` INT DEFAULT 0 COMMENT 'Display order priority (higher = shown first, 1-12 range)',
  ADD COLUMN `recommended_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When property was marked as recommended',
  ADD COLUMN `recommended_by` CHAR(36) NULL DEFAULT NULL COMMENT 'Admin ID who marked it as recommended',
  
  -- Add index for faster recommended properties queries
  ADD INDEX `idx_recommended` (`is_recommended`, `recommended_priority`, `property_type_id`, `status`);

-- Add foreign key for recommended_by (references admins table)
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_properties_recommended_by` 
  FOREIGN KEY (`recommended_by`) 
  REFERENCES `admins`(`id`) 
  ON DELETE SET NULL;

-- =====================================================
-- DATA VALIDATION & NOTES
-- =====================================================
-- Maximum 12 properties per property type can be recommended
-- Priority range: 1-12 (1 = highest priority, displayed first)
-- When is_recommended = 1, recommended_priority must be > 0
-- Frontend displays top 6 with "Show More" for 7-12
-- =====================================================

SELECT 'Migration 10: Recommended Properties fields added successfully!' as status;
