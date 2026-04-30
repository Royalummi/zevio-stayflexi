-- ============================================
-- Add Performance Indexes and Data Constraints
-- Date: January 16, 2026
-- Purpose: Optimize booking queries and enforce data integrity
-- ============================================

-- Add indexes for better query performance
-- ============================================

-- 1. Index for booking overlap checks (most critical)
-- Used in: bookingController.js overlap detection query
-- Speeds up: Property availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates 
ON bookings(property_id, check_in, check_out);

-- 2. Index for user's booking list queries
-- Used in: getMyBookings endpoint
-- Speeds up: Dashboard booking list filtering
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
ON bookings(user_id, status);

-- 3. Index for expired booking cleanup
-- Used in: Cron job to delete expired bookings
-- Speeds up: Expiry checks in overlap detection
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at 
ON bookings(expires_at);

-- 4. Index for status-based queries
-- Used in: Admin dashboard, reporting
CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings(status);

-- Add data integrity constraints
-- ============================================

-- 1. Ensure check_out is always after check_in
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_dates 
CHECK (check_out > check_in);

-- 2. Ensure at least 1 guest
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_guests 
CHECK (guest_count > 0);

-- 3. Ensure nights calculation is positive
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_nights 
CHECK (nights > 0);

-- 4. Ensure amounts are non-negative
ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_base_amount 
CHECK (base_amount >= 0);

ALTER TABLE bookings 
ADD CONSTRAINT chk_bookings_total_amount 
CHECK (total_amount >= 0);

-- Verify indexes were created
-- ============================================
SHOW INDEXES FROM bookings;

-- Expected performance improvement:
-- - Overlap checks: 10-50x faster (depends on data size)
-- - User booking list: 5-10x faster
-- - Expiry cleanup: 100x faster
-- - Data integrity: Prevents invalid bookings at DB level
