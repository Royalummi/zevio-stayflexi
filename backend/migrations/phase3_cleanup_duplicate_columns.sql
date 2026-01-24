-- =====================================================
-- PHASE 3: CLEANUP DUPLICATE COLUMNS
-- =====================================================
-- Remove pricing and amenities columns from properties table
-- These are now stored in normalized tables:
--   - property_pricing (17 pricing columns)
--   - amenities + property_amenities (amenities data)
--
-- BEFORE: properties has 85 columns
-- AFTER:  properties will have ~51 columns
--
-- SAFETY: Backup before running! This operation is IRREVERSIBLE.
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP VERIFICATION
-- =====================================================
-- Verify data exists in new tables before dropping columns
-- Run these queries to ensure data is safe:

-- Check pricing data exists
-- SELECT COUNT(*) FROM property_pricing;
-- Expected: 17 rows

-- Check amenities data exists
-- SELECT COUNT(*) FROM property_amenities;
-- Expected: 60+ rows

-- Compare old vs new (sample)
-- SELECT 
--   p.price_per_night as old_price,
--   pr.price_per_night as new_price,
--   p.amenities as old_amenities
-- FROM properties p
-- LEFT JOIN property_pricing pr ON p.id = pr.property_id
-- LIMIT 5;

-- =====================================================
-- STEP 2: DROP PRICING COLUMNS (17 columns)
-- =====================================================

ALTER TABLE properties
  -- Price & GST
  DROP COLUMN price_per_night,
  DROP COLUMN gst_percentage,
  
  -- Guest charges
  DROP COLUMN min_guests,
  DROP COLUMN extra_guest_charge,
  DROP COLUMN min_children,
  DROP COLUMN max_children,
  DROP COLUMN extra_child_charge,
  
  -- Discounts
  DROP COLUMN weekly_discount_percent,
  DROP COLUMN monthly_discount_percent,
  DROP COLUMN quarterly_discount_percent,
  DROP COLUMN long_term_discount_percent,
  
  -- Corporate
  DROP COLUMN allow_corporate_booking,
  DROP COLUMN corporate_discount_percent,
  
  -- Deposits & Charges
  DROP COLUMN deposit_amount,
  DROP COLUMN maintenance_charges,
  DROP COLUMN notice_period_days;

-- =====================================================
-- STEP 3: DROP AMENITIES COLUMN (1 column)
-- =====================================================

ALTER TABLE properties
  DROP COLUMN amenities;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Check new column count
-- SELECT COUNT(*) as total_columns 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'zevio' AND TABLE_NAME = 'properties';
-- Expected: ~67 columns (85 - 18)

-- Verify properties table still has essential columns
-- SHOW COLUMNS FROM properties;

-- Test that VIEWs still work
-- SELECT * FROM properties_with_pricing LIMIT 1;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. The properties_with_pricing VIEW will still provide
--    backward compatibility for queries that expect pricing
--    columns to be in the properties table.
--
-- 2. All APIs have been updated to use JOINs, so this
--    cleanup is safe.
--
-- 3. This is a one-way operation. Make sure backup exists:
--    backup_before_phase2.sql (or create new backup)
--
-- 4. Benefits after cleanup:
--    - Smaller table size (~40% reduction)
--    - Faster queries (less data to scan)
--    - Cleaner table structure
--    - Better maintainability
--
-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- If you need to rollback, restore from backup:
-- mysql -u root zevio < backup_before_phase3.sql
--
-- Or manually add columns back and copy data:
-- ALTER TABLE properties ADD COLUMN price_per_night DECIMAL(12,2);
-- UPDATE properties p 
-- INNER JOIN property_pricing pr ON p.id = pr.property_id
-- SET p.price_per_night = pr.price_per_night;
-- (repeat for all columns)
-- =====================================================
