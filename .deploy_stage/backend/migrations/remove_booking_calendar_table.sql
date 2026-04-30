-- ============================================================================
-- MIGRATION: Remove booking_calendar Table (Scalability Optimization)
-- ============================================================================
-- Date: January 18, 2026
-- Reason: booking_calendar doesn't scale well (100 properties = 36,500 rows)
-- Solution: Use on-demand calculation with bookings + property_blackout_dates
-- Industry Standard: Airbnb, Booking.com use this approach
-- ============================================================================

-- Step 1: Backup existing data (optional - only if you want to keep history)
-- CREATE TABLE booking_calendar_backup_20260118 AS SELECT * FROM booking_calendar;

-- Step 2: Drop foreign key constraints first
ALTER TABLE booking_calendar DROP FOREIGN KEY IF EXISTS fk_booking_calendar_property;
ALTER TABLE booking_calendar DROP FOREIGN KEY IF EXISTS fk_booking_calendar_booking;

-- Step 3: Drop the table
DROP TABLE IF EXISTS booking_calendar;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- 1. Verify table is dropped:
--    SHOW TABLES LIKE 'booking_calendar';
-- 
-- 2. Check foreign keys removed:
--    SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
--    WHERE TABLE_SCHEMA = 'zevio' AND REFERENCED_TABLE_NAME = 'booking_calendar';
--
-- Expected: No results
-- ============================================================================

-- ============================================================================
-- NEW APPROACH: On-Demand Calendar Calculation
-- ============================================================================
-- Instead of pre-populating calendar, we calculate availability on-the-fly:
--
-- 1. Query bookings table for booked dates:
--    SELECT check_in, check_out FROM bookings 
--    WHERE property_id = ? AND status IN ('confirmed', 'checked_in')
--
-- 2. Query property_blackout_dates for blocked dates:
--    SELECT start_date, end_date FROM property_blackout_dates 
--    WHERE property_id = ? AND is_active = TRUE
--
-- 3. Calculate available dates in backend (JavaScript)
--
-- Benefits:
--   - Scales to unlimited properties
--   - No pre-population needed
--   - Only stores actual bookings/blocks (~99% storage savings)
--   - Industry standard approach
-- ============================================================================
