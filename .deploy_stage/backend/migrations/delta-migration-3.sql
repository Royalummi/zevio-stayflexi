-- Delta Migration 3: Comprehensive schema sync
-- Covers: living_area, apartment_only, vendor_terms_conditions, drop deposit_amount, drop guideline columns
-- MySQL 8.0 compatible (uses stored procedure for conditional DDL)

DELIMITER //

DROP PROCEDURE IF EXISTS run_delta_migration_3//

CREATE PROCEDURE run_delta_migration_3()
BEGIN

  -- ============================================================
  -- 1. Add living_area column to properties (if not exists)
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'living_area'
  ) THEN
    ALTER TABLE properties ADD COLUMN living_area INT DEFAULT NULL COMMENT 'Living area in square feet' AFTER bathrooms;
    SELECT 'ADDED: properties.living_area' AS status;
  ELSE
    SELECT 'SKIP: properties.living_area already exists' AS status;
  END IF;

  -- ============================================================
  -- 2. Add apartment_only column to amenities (if not exists)
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'amenities' AND column_name = 'apartment_only'
  ) THEN
    ALTER TABLE amenities ADD COLUMN apartment_only TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'If 1, only show for Service Apartment (pt-002) properties' AFTER is_active;
    SELECT 'ADDED: amenities.apartment_only' AS status;
  ELSE
    SELECT 'SKIP: amenities.apartment_only already exists' AS status;
  END IF;

  -- ============================================================
  -- 3. Drop deposit_amount from property_pricing (if exists)
  -- ============================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'property_pricing' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE property_pricing DROP COLUMN deposit_amount;
    SELECT 'DROPPED: property_pricing.deposit_amount' AS status;
  ELSE
    SELECT 'SKIP: property_pricing.deposit_amount does not exist' AS status;
  END IF;

  -- ============================================================
  -- 4. Drop guideline columns from properties (if exist)
  -- ============================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'check_in_guidelines'
  ) THEN
    ALTER TABLE properties DROP COLUMN check_in_guidelines;
    SELECT 'DROPPED: properties.check_in_guidelines' AS status;
  ELSE
    SELECT 'SKIP: properties.check_in_guidelines does not exist' AS status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'house_rules_text'
  ) THEN
    ALTER TABLE properties DROP COLUMN house_rules_text;
    SELECT 'DROPPED: properties.house_rules_text' AS status;
  ELSE
    SELECT 'SKIP: properties.house_rules_text does not exist' AS status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'amenities_guide'
  ) THEN
    ALTER TABLE properties DROP COLUMN amenities_guide;
    SELECT 'DROPPED: properties.amenities_guide' AS status;
  ELSE
    SELECT 'SKIP: properties.amenities_guide does not exist' AS status;
  END IF;

  -- ============================================================
  -- 5. Drop guideline columns from property_guidelines (if exist)
  -- ============================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'property_guidelines' AND column_name = 'check_in_guidelines'
  ) THEN
    ALTER TABLE property_guidelines DROP COLUMN check_in_guidelines;
    SELECT 'DROPPED: property_guidelines.check_in_guidelines' AS status;
  ELSE
    SELECT 'SKIP: property_guidelines.check_in_guidelines does not exist' AS status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'property_guidelines' AND column_name = 'house_rules_text'
  ) THEN
    ALTER TABLE property_guidelines DROP COLUMN house_rules_text;
    SELECT 'DROPPED: property_guidelines.house_rules_text' AS status;
  ELSE
    SELECT 'SKIP: property_guidelines.house_rules_text does not exist' AS status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'property_guidelines' AND column_name = 'amenities_guide'
  ) THEN
    ALTER TABLE property_guidelines DROP COLUMN amenities_guide;
    SELECT 'DROPPED: property_guidelines.amenities_guide' AS status;
  ELSE
    SELECT 'SKIP: property_guidelines.amenities_guide does not exist' AS status;
  END IF;

END//

DELIMITER ;

-- Run the conditional migrations
CALL run_delta_migration_3();
DROP PROCEDURE IF EXISTS run_delta_migration_3;

-- ============================================================
-- 6. Create vendor_terms_conditions table (IF NOT EXISTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS `vendor_terms_conditions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` LONGTEXT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `updated_by` CHAR(36) DEFAULT NULL COMMENT 'Admin user ID who last updated',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default T&C only if table is empty
INSERT INTO `vendor_terms_conditions` (`content`, `version`)
SELECT '<h2>Vendor Terms and Conditions</h2><p>By listing your property on Zevio, you agree to the following terms.</p><h3>1. Property Listing</h3><p>You agree to provide accurate information about your property.</p><h3>2. Commission and Payments</h3><p>Zevio charges a platform commission on each confirmed booking.</p><h3>3. Cancellation Policy</h3><p>You must honour the cancellation policy associated with your property type.</p><h3>4. Property Standards</h3><p>Your property must meet Zevio quality and safety standards.</p><h3>5. Guest Conduct</h3><p>You agree to treat all guests with respect and professionalism.</p><h3>6. Legal Compliance</h3><p>You are responsible for ensuring compliance with all applicable local laws.</p><h3>7. Amendments</h3><p>Zevio reserves the right to update these Terms and Conditions at any time.</p>', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `vendor_terms_conditions` LIMIT 1);

-- ============================================================
-- 7. Update amenities data
-- ============================================================
-- Update Kitchen display order
UPDATE `amenities` SET `display_order` = 1 WHERE `name` = 'Kitchen' AND `category` = 'facility';

-- Mark Housekeeping as apartment_only (safe even if column was just added)
UPDATE `amenities` SET `apartment_only` = 1 WHERE `name` = 'Housekeeping' AND `category` = 'service';

-- Insert new amenities (only if they don't already exist)
INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`)
SELECT UUID(), 'Private Pool', 'facility', 'private-pool', NULL, 17, 1, 0, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `amenities` WHERE `name` = 'Private Pool');

INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`)
SELECT UUID(), 'Jacuzzi', 'facility', 'jacuzzi', NULL, 18, 1, 0, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `amenities` WHERE `name` = 'Jacuzzi');

INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`)
SELECT UUID(), 'Mountain View', 'feature', 'mountain', NULL, 5, 1, 0, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `amenities` WHERE `name` = 'Mountain View');

INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`)
SELECT UUID(), 'Smoke Alarms', 'safety', 'smoke-alarm', NULL, 16, 1, 0, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `amenities` WHERE `name` = 'Smoke Alarms');

-- ============================================================
-- 8. Recreate the view WITHOUT deposit_amount
-- ============================================================
DROP VIEW IF EXISTS properties_with_pricing;

CREATE VIEW properties_with_pricing AS
SELECT 
  p.id,
  p.vendor_id,
  p.title,
  p.description,
  p.address,
  c.name AS city,
  p.area,
  p.state,
  p.pincode,
  p.bedrooms,
  p.bathrooms,
  p.max_guests,
  p.check_in_time,
  p.check_out_time,
  p.min_stay_days,
  p.max_stay_days,
  p.photos,
  p.rating,
  p.reviews_count,
  p.status,
  p.created_at,
  p.city_id,
  p.property_type_id,
  pt.name AS property_type,
  pt.stay_type,
  pr.price_per_night,
  pr.gst_percentage,
  pr.min_guests AS pricing_min_guests,
  pr.extra_guest_charge,
  pr.weekly_discount_percent,
  pr.monthly_discount_percent,
  pr.quarterly_discount_percent,
  pr.long_term_discount_percent,
  pr.allow_corporate_booking,
  pr.corporate_discount_percent,
  pr.maintenance_charges,
  GROUP_CONCAT(DISTINCT a.name ORDER BY a.display_order, a.name SEPARATOR ', ') AS amenities_list,
  GROUP_CONCAT(DISTINCT a.id ORDER BY a.display_order, a.name SEPARATOR ',') AS amenity_ids,
  GROUP_CONCAT(DISTINCT f.name ORDER BY f.display_order SEPARATOR ', ') AS features_list,
  GROUP_CONCAT(DISTINCT f.id ORDER BY f.display_order SEPARATOR ',') AS feature_ids
FROM properties p
JOIN property_pricing pr ON p.id = pr.property_id
LEFT JOIN cities c ON p.city_id = c.id
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN property_amenities pa ON p.id = pa.property_id
LEFT JOIN amenities a ON pa.amenity_id = a.id AND a.is_active = 1
LEFT JOIN property_features pf ON p.id = pf.property_id
LEFT JOIN features f ON pf.feature_id = f.id AND f.is_active = 1
WHERE p.deleted_at IS NULL
GROUP BY p.id, pr.id;

SELECT 'Delta Migration 3 complete!' AS final_status;
