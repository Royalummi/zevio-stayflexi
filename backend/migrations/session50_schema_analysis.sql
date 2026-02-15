-- ============================================
-- SESSION 50: Database Schema Analysis & Fixes
-- Date: February 9, 2026
-- Purpose: Identify and fix schema mismatches in property creation flow
-- ============================================

-- ============================================
-- STEP 1: Verify Current Schema
-- ============================================

-- Check properties table columns
DESCRIBE properties;

-- Check property_pricing table columns
DESCRIBE property_pricing;

-- Check property_contacts table structure  
DESCRIBE property_contacts;

-- Check contact_types lookup table
SELECT * FROM contact_types;

-- ============================================
-- STEP 2: Schema Mismatch Analysis
-- ============================================

/*
BACKEND CODE ISSUES (adminController.js lines 1861-1965):
Backend tries to INSERT these columns into properties table, but they DON'T exist:

1. PRICING FIELDS (these belong in property_pricing table):
   - min_guests
   - extra_guest_charge
   - min_children
   - max_children
   - extra_child_charge
   - price_per_night
   - gst_percentage

2. CONTACT FIELDS (these belong in property_contacts table):
   - primary_incharge_name
   - primary_incharge_phone
   - primary_incharge_email
   - primary_incharge_whatsapp
   - primary_incharge_alt_contact
   - secondary_incharge_name
   - secondary_incharge_phone
   - secondary_incharge_email
   - secondary_incharge_whatsapp
   - secondary_incharge_alt_contact

3. GUIDELINES FIELDS (NO TABLE EXISTS - need to create or store differently):
   - check_in_guidelines
   - house_rules_text
   - amenities_guide
   - safety_information
   - local_area_info
   - emergency_contacts

4. LOCATION FIELDS (already removed from backend, don't exist in properties):
   - city (properties uses city_id foreign key to cities table)
   - state (stored in cities table)
   - pincode (stored in cities table)
*/

-- ============================================
-- STEP 3: Decision on Guidelines Storage
-- ============================================

/*
OPTIONS for storing rich text guidelines:

Option A: Create new property_guidelines table (RECOMMENDED)
  - Follows normalized database pattern
  - Allows versioning/history
  - Keeps properties table focused

Option B: Add TEXT/JSON columns to properties table
  - Simpler implementation
  - Denormalizes database slightly
  - Faster reads (no JOIN needed)

Option C: Store in centralized content management table
  - Most flexible
  - Complex to query
  - Overkill for this use case

DECISION: Option A - Create property_guidelines table
*/

-- ============================================
-- STEP 4: Create property_guidelines Table
-- ============================================

CREATE TABLE IF NOT EXISTS `property_guidelines` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `property_id` CHAR(36) NOT NULL,
  `check_in_guidelines` TEXT NULL COMMENT 'Rich text - Check-in process and instructions',
  `house_rules_text` TEXT NULL COMMENT 'Rich text - Detailed house rules',
  `amenities_guide` TEXT NULL COMMENT 'Rich text - How to use amenities',
  `safety_information` TEXT NULL COMMENT 'Rich text - Safety guidelines and emergency procedures',
  `local_area_info` TEXT NULL COMMENT 'Rich text - Local attractions, restaurants, transport',
  `emergency_contacts` TEXT NULL COMMENT 'Rich text - Emergency contact information',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_property_guidelines_property` 
    FOREIGN KEY (`property_id`) 
    REFERENCES `properties` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_property_id` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores rich text guidelines and instructions for each property';

-- ============================================
-- STEP 5: Verify Database Normalization
-- ============================================

-- Check if property_pricing correctly stores pricing fields
SELECT 
  'property_pricing' AS table_name,
  COUNT(*) AS record_count,
  COUNT(DISTINCT property_id) AS unique_properties
FROM property_pricing;

-- Check if property_contacts correctly stores contact info
SELECT 
  'property_contacts' AS table_name,
  COUNT(*) AS record_count,
  COUNT(DISTINCT property_id) AS unique_properties,
  ct.name AS contact_type,
  COUNT(*) AS contacts_per_type
FROM property_contacts pc
LEFT JOIN contact_types ct ON pc.contact_type_id = ct.id
GROUP BY ct.name;

-- ============================================
-- STEP 6: FINAL VERIFICATION QUERIES
-- ============================================

-- Get properties with complete data (JOIN all related tables)
SELECT 
  p.id,
  p.title,
  p.city_id,
  c.name AS city_name,
  c.state,
  c.pincode,
  p.bedrooms,
  p.bathrooms,
  p.max_guests,
  pp.price_per_night,
  pp.min_guests,
  pp.extra_guest_charge,
  pp.gst_percentage,
  p.status
FROM properties p
LEFT JOIN cities c ON p.city_id = c.id
LEFT JOIN property_pricing pp ON p.id = pp.property_id
WHERE p.deleted_at IS NULL
LIMIT 5;

-- ============================================
-- IMPLEMENTATION NOTES:
-- ============================================

/*
BACKEND FIXES REQUIRED (adminController.js):

1. Remove from properties INSERT (lines 1867-1894):
   - min_guests, extra_guest_charge
   - min_children, max_children, extra_child_charge
   - price_per_night, gst_percentage
   - primary_incharge_* fields (all 5)
   - secondary_incharge_* fields (all 5)
   - check_in_guidelines, house_rules_text, amenities_guide
   - safety_information, local_area_info, emergency_contacts

2. Keep property_pricing INSERT (already correct at line 1967-1982)
   - Already handles: price_per_night, gst_percentage, min_guests, 
     extra_guest_charge, discounts, corporate booking fields

3. Add property_contacts INSERTs (MISSING):
   - Insert primary contact with contact_type_id = 1
   - Insert secondary contact with contact_type_id = 2 (if provided)

4. Add property_guidelines INSERT (MISSING):
   - Insert all 6 rich text guideline fields

5. Properties table INSERT should ONLY include:
   - Core property info (title, description, address, area)
   - Physical specs (bedrooms, bathrooms, max_guests)
   - Service apartment fields (min/max_stay_days, housekeeping, etc.)
   - Recommendation fields (is_recommended, recommended_priority)
   - JSON fields (amenities, house_rules, cancellation_policy, photos)
   - Check-in/out times, status, dates
   - maps_location
*/