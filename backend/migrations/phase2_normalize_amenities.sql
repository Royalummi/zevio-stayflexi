-- =====================================================
-- PHASE 2: NORMALIZE AMENITIES
-- =====================================================
-- This migration extracts amenities from JSON column into separate tables
-- Properties: 85 columns → Will enable cleaner amenity management
-- 
-- Tables to create:
--   1. amenities - Master list of all available amenities
--   2. property_amenities - Junction table (many-to-many)
--
-- SAFETY: Backup before running! This extracts data from JSON column.
-- =====================================================

-- Step 1: Create amenities master table
CREATE TABLE IF NOT EXISTS amenities (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'general',
  icon VARCHAR(50),
  description VARCHAR(255),
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Step 2: Create property_amenities junction table
CREATE TABLE IF NOT EXISTS property_amenities (
  id CHAR(36) PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  amenity_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_property_amenity (property_id, amenity_id),
  INDEX idx_property (property_id),
  INDEX idx_amenity (amenity_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Step 3: Add foreign key constraints (will be added after data migration)
-- ALTER TABLE property_amenities
-- ADD CONSTRAINT fk_property_amenities_property
--   FOREIGN KEY (property_id) REFERENCES properties(id)
--   ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE property_amenities
-- ADD CONSTRAINT fk_property_amenities_amenity
--   FOREIGN KEY (amenity_id) REFERENCES amenities(id)
--   ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Seed common amenities (based on your property data)
INSERT INTO amenities (id, name, category, icon, display_order) VALUES
(UUID(), 'WiFi', 'connectivity', 'wifi', 10),
(UUID(), 'Workspace', 'workspace', 'desk', 20),
(UUID(), 'AC', 'comfort', 'snowflake', 30),
(UUID(), 'Parking', 'facility', 'car', 40),
(UUID(), 'Kitchen', 'facility', 'utensils', 50),
(UUID(), 'TV', 'entertainment', 'tv', 60),
(UUID(), 'Washing Machine', 'appliance', 'washing-machine', 70),
(UUID(), 'Refrigerator', 'appliance', 'refrigerator', 80),
(UUID(), 'Microwave', 'appliance', 'microwave', 90),
(UUID(), 'Geyser', 'comfort', 'hot-tub', 100),
(UUID(), 'Gym', 'facility', 'dumbbell', 110),
(UUID(), 'Swimming Pool', 'facility', 'swimming-pool', 120),
(UUID(), 'Security', 'safety', 'shield', 130),
(UUID(), 'Power Backup', 'facility', 'battery', 140),
(UUID(), 'Elevator', 'facility', 'elevator', 150),
(UUID(), 'Housekeeping', 'service', 'broom', 160),
(UUID(), 'Laundry', 'service', 'laundry', 170),
(UUID(), 'Balcony', 'feature', 'balcony', 180),
(UUID(), 'Garden', 'feature', 'tree', 190),
(UUID(), 'Pet Friendly', 'policy', 'paw', 200)
ON DUPLICATE KEY UPDATE name=name;

-- Step 5: Migrate existing amenities from JSON column to junction table
-- This will be done via Node.js script because MySQL JSON parsing is complex
-- See: backend/migrations/migrate_amenities.js

-- Step 6: Create VIEW for backward compatibility
CREATE OR REPLACE VIEW properties_with_amenities AS
SELECT 
  p.*,
  GROUP_CONCAT(a.name ORDER BY a.display_order SEPARATOR ', ') as amenities_list,
  GROUP_CONCAT(a.id ORDER BY a.display_order SEPARATOR ',') as amenity_ids
FROM properties p
LEFT JOIN property_amenities pa ON p.id = pa.property_id
LEFT JOIN amenities a ON pa.amenity_id = a.amenity_id
GROUP BY p.id;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check amenities count
-- SELECT COUNT(*) as total_amenities FROM amenities;

-- Check property_amenities count
-- SELECT COUNT(*) as total_mappings FROM property_amenities;

-- Check properties with amenities
-- SELECT 
--   p.title,
--   COUNT(pa.amenity_id) as amenity_count,
--   GROUP_CONCAT(a.name SEPARATOR ', ') as amenities
-- FROM properties p
-- LEFT JOIN property_amenities pa ON p.id = pa.property_id
-- LEFT JOIN amenities a ON pa.amenity_id = a.amenity_id
-- GROUP BY p.id, p.title
-- LIMIT 5;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP VIEW IF EXISTS properties_with_amenities;
-- DROP TABLE IF EXISTS property_amenities;
-- DROP TABLE IF EXISTS amenities;
