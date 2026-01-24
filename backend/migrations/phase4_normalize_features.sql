-- ============================================================================
-- PHASE 4: FEATURE FLAGS NORMALIZATION
-- ============================================================================
-- Purpose: Normalize boolean feature flag columns into relational tables
-- Date: January 18, 2026
-- 
-- CHANGES:
-- 1. Create `features` master table (9 columns)
-- 2. Create `property_features` junction table (4 columns)
-- 3. Migrate 8 boolean columns to relational structure
-- 4. Drop 8 duplicate boolean columns from properties table
--
-- RESULT: properties table: 68 columns → 60 columns (-8 columns, -12%)
-- ============================================================================

USE zevio;

-- ============================================================================
-- STEP 1: Create Features Master Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `key` varchar(50) NOT NULL COMMENT 'Machine-readable key matching has_* column names',
  `description` text,
  `icon` varchar(50) DEFAULT NULL COMMENT 'Icon name for UI display',
  `category` enum('facility','utility','service','security') DEFAULT 'facility',
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_feature_key` (`key`),
  KEY `idx_feature_active` (`is_active`),
  KEY `idx_feature_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 2: Insert Master Feature Data
-- ============================================================================

INSERT INTO `features` (`name`, `key`, `description`, `icon`, `category`, `is_active`, `display_order`) VALUES
('Elevator', 'elevator', 'Building has elevator/lift facility', 'elevator', 'facility', 1, 1),
('Gym', 'gym', 'On-site gym or fitness center', 'dumbbell', 'facility', 1, 2),
('Housekeeping', 'housekeeping', 'Regular housekeeping service', 'broom', 'service', 1, 3),
('Laundry', 'laundry', 'Laundry service or facilities', 'washing-machine', 'service', 1, 4),
('Parking', 'parking', 'Dedicated parking space', 'car', 'facility', 1, 5),
('Power Backup', 'power_backup', 'Power backup generator', 'battery', 'utility', 1, 6),
('Security', 'security', '24/7 security service', 'shield', 'security', 1, 7),
('Workspace', 'workspace', 'Dedicated workspace area', 'desk', 'facility', 1, 8);

-- ============================================================================
-- STEP 3: Create Property Features Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `property_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` char(36) NOT NULL,
  `feature_id` int NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_property_feature_unique` (`property_id`, `feature_id`),
  KEY `idx_pf_property` (`property_id`),
  KEY `idx_pf_feature` (`feature_id`),
  CONSTRAINT `fk_pf_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pf_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 4: Migrate Boolean Data to Relational Structure
-- ============================================================================

-- Migrate has_elevator
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'elevator'
WHERE p.has_elevator = 1 AND p.deleted_at IS NULL;

-- Migrate has_gym
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'gym'
WHERE p.has_gym = 1 AND p.deleted_at IS NULL;

-- Migrate has_housekeeping
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'housekeeping'
WHERE p.has_housekeeping = 1 AND p.deleted_at IS NULL;

-- Migrate has_laundry
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'laundry'
WHERE p.has_laundry = 1 AND p.deleted_at IS NULL;

-- Migrate has_parking
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'parking'
WHERE p.has_parking = 1 AND p.deleted_at IS NULL;

-- Migrate has_power_backup
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'power_backup'
WHERE p.has_power_backup = 1 AND p.deleted_at IS NULL;

-- Migrate has_security
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'security'
WHERE p.has_security = 1 AND p.deleted_at IS NULL;

-- Migrate has_workspace
INSERT INTO property_features (property_id, feature_id)
SELECT p.id, f.id
FROM properties p
INNER JOIN features f ON f.key = 'workspace'
WHERE p.has_workspace = 1 AND p.deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (RUN BEFORE DROPPING COLUMNS)
-- ============================================================================

-- 1. Check migration counts
SELECT 'Migration Summary' as Report;
SELECT 
  'has_elevator' as feature,
  (SELECT COUNT(*) FROM properties WHERE has_elevator = 1 AND deleted_at IS NULL) as old_count,
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'elevator') as new_count
UNION ALL
SELECT 
  'has_gym',
  (SELECT COUNT(*) FROM properties WHERE has_gym = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'gym')
UNION ALL
SELECT 
  'has_housekeeping',
  (SELECT COUNT(*) FROM properties WHERE has_housekeeping = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'housekeeping')
UNION ALL
SELECT 
  'has_laundry',
  (SELECT COUNT(*) FROM properties WHERE has_laundry = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'laundry')
UNION ALL
SELECT 
  'has_parking',
  (SELECT COUNT(*) FROM properties WHERE has_parking = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'parking')
UNION ALL
SELECT 
  'has_power_backup',
  (SELECT COUNT(*) FROM properties WHERE has_power_backup = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'power_backup')
UNION ALL
SELECT 
  'has_security',
  (SELECT COUNT(*) FROM properties WHERE has_security = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'security')
UNION ALL
SELECT 
  'has_workspace',
  (SELECT COUNT(*) FROM properties WHERE has_workspace = 1 AND deleted_at IS NULL),
  (SELECT COUNT(*) FROM property_features pf INNER JOIN features f ON pf.feature_id = f.id WHERE f.key = 'workspace');

-- 2. Sample data comparison (first 3 properties)
SELECT 'Sample Data Verification' as Report;
SELECT 
  p.id,
  p.title,
  p.has_elevator as old_elevator,
  p.has_gym as old_gym,
  p.has_housekeeping as old_housekeeping,
  p.has_laundry as old_laundry,
  p.has_parking as old_parking,
  p.has_power_backup as old_power_backup,
  p.has_security as old_security,
  p.has_workspace as old_workspace,
  GROUP_CONCAT(DISTINCT f.name ORDER BY f.name SEPARATOR ', ') as new_features
FROM properties p
LEFT JOIN property_features pf ON p.id = pf.property_id
LEFT JOIN features f ON pf.feature_id = f.id
WHERE p.deleted_at IS NULL
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 3;

-- ============================================================================
-- STEP 5: Drop Duplicate Boolean Columns (ONLY AFTER VERIFICATION)
-- ============================================================================

-- IMPORTANT: Only run this after verifying data migration is 100% accurate!
-- Uncomment the following lines to drop the columns:

/*
ALTER TABLE properties
  DROP COLUMN has_elevator,
  DROP COLUMN has_gym,
  DROP COLUMN has_housekeeping,
  DROP COLUMN has_laundry,
  DROP COLUMN has_parking,
  DROP COLUMN has_power_backup,
  DROP COLUMN has_security,
  DROP COLUMN has_workspace;
*/

-- ============================================================================
-- FINAL VERIFICATION QUERIES (AFTER DROPPING COLUMNS)
-- ============================================================================

-- Check final column count
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zevio' AND TABLE_NAME = 'properties';
-- Expected: 60 columns (was 68)

-- Verify columns are dropped
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zevio' 
  AND TABLE_NAME = 'properties' 
  AND COLUMN_NAME LIKE 'has_%';
-- Expected: 0 rows

-- Test full query with features
SELECT 
  p.id,
  p.title,
  p.city,
  GROUP_CONCAT(DISTINCT f.name ORDER BY f.display_order SEPARATOR ', ') as features
FROM properties p
LEFT JOIN property_features pf ON p.id = pf.property_id
LEFT JOIN features f ON pf.feature_id = f.id
WHERE p.deleted_at IS NULL
GROUP BY p.id
LIMIT 5;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
If you need to rollback this phase:

1. RESTORE FROM BACKUP:
   mysql -u root zevio < backup_before_phase4.sql

2. OR MANUALLY ROLLBACK:
   -- Drop the new tables
   DROP TABLE IF EXISTS property_features;
   DROP TABLE IF EXISTS features;
   
   -- Re-add the boolean columns (if they were dropped)
   ALTER TABLE properties
     ADD COLUMN has_elevator tinyint(1) DEFAULT 0 AFTER property_type,
     ADD COLUMN has_gym tinyint(1) DEFAULT 0 AFTER has_elevator,
     ADD COLUMN has_housekeeping tinyint(1) DEFAULT 0 AFTER has_gym,
     ADD COLUMN has_laundry tinyint(1) DEFAULT 0 AFTER has_housekeeping,
     ADD COLUMN has_parking tinyint(1) DEFAULT 0 AFTER has_laundry,
     ADD COLUMN has_power_backup tinyint(1) DEFAULT 0 AFTER has_parking,
     ADD COLUMN has_security tinyint(1) DEFAULT 0 AFTER has_power_backup,
     ADD COLUMN has_workspace tinyint(1) DEFAULT 0 AFTER has_security;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
BENEFITS OF THIS NORMALIZATION:
1. Column Reduction: 68 → 60 columns (-12%)
2. Flexibility: Add new features without schema changes
3. Consistency: Same pattern as amenities normalization
4. Maintainability: Centralized feature management
5. Scalability: Easy to add feature metadata (icons, categories, etc.)

PERFORMANCE CONSIDERATIONS:
- Uses indexed foreign keys for fast JOINs
- UNIQUE constraint prevents duplicate mappings
- Minimal performance impact due to small dataset size

USAGE IN CODE:
- Use featuresService.getByPropertyId(propertyId) to get features
- Use feature JOINs in property listing queries
- Filter by features: WHERE f.key IN ('gym', 'parking', 'workspace')
*/
