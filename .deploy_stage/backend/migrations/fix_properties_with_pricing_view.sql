-- ============================================================================
-- Fix properties_with_pricing View - Phase 8+9+10 Follow-up
-- ============================================================================
-- Date: January 18, 2026
-- Issue: View references dropped columns city and property_type
-- Solution: Recreate view with JOIN to cities and property_types tables
-- ============================================================================

USE zevio;

-- Drop existing view
DROP VIEW IF EXISTS properties_with_pricing;

-- Recreate view with proper JOINs
CREATE OR REPLACE VIEW properties_with_pricing AS
SELECT 
  p.id,
  p.vendor_id,
  p.title,
  p.description,
  p.address,
  c.name AS city,  -- JOIN with cities table
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
  p.city_id,  -- Add city_id for filtering
  p.property_type_id,  -- Add property_type_id for filtering
  pt.name AS property_type,  -- JOIN with property_types table
  pt.stay_type,  -- Include stay_type (short_term/long_term/hybrid)
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
  pr.deposit_amount,
  pr.maintenance_charges,
  GROUP_CONCAT(DISTINCT a.name ORDER BY a.display_order, a.name SEPARATOR ', ') AS amenities_list,
  GROUP_CONCAT(DISTINCT a.id ORDER BY a.display_order, a.name SEPARATOR ',') AS amenity_ids,
  GROUP_CONCAT(DISTINCT f.name ORDER BY f.display_order SEPARATOR ', ') AS features_list,
  GROUP_CONCAT(DISTINCT f.id ORDER BY f.display_order SEPARATOR ',') AS feature_ids
FROM properties p
JOIN property_pricing pr ON p.id = pr.property_id
LEFT JOIN cities c ON p.city_id = c.id  -- JOIN for city name
LEFT JOIN property_types pt ON p.property_type_id = pt.id  -- JOIN for property_type name
LEFT JOIN property_amenities pa ON p.id = pa.property_id
LEFT JOIN amenities a ON pa.amenity_id = a.id AND a.is_active = 1
LEFT JOIN property_features pf ON p.id = pf.property_id
LEFT JOIN features f ON pf.feature_id = f.id AND f.is_active = 1
WHERE p.deleted_at IS NULL
GROUP BY p.id, pr.id;

-- Verify view creation
SELECT 'View properties_with_pricing recreated successfully' AS status;

-- Test the view
SELECT 'Testing view with sample query...' AS status;
SELECT id, title, city, property_type, price_per_night, amenities_list, features_list
FROM properties_with_pricing
LIMIT 1;

SELECT 'View fix complete!' AS status;
