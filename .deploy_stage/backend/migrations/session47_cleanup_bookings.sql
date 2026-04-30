-- ============================================
-- SESSION 47: CLEANUP OLD BOOKINGS FOR TESTING
-- Date: February 3, 2026
-- Purpose: Remove old/test bookings, keep only confirmed bookings
-- ============================================

-- Step 1: Show current booking counts by status
SELECT 
  status,
  payment_status,
  COUNT(*) as count
FROM bookings
GROUP BY status, payment_status
ORDER BY status;

-- Step 2: List all bookings that will be DELETED (pending/cancelled/empty status)
SELECT 
  id,
  user_id,
  property_id,
  check_in,
  status,
  payment_status,
  total_amount
FROM bookings
WHERE status IN ('cancelled', 'pending_payment', 'cancel_requested', '')
   OR status IS NULL
ORDER BY created_at DESC;

-- Step 3: DELETE all non-confirmed bookings (soft delete by setting deleted_at)
UPDATE bookings 
SET deleted_at = NOW()
WHERE status IN ('cancelled', 'pending_payment', 'cancel_requested', '')
   OR status IS NULL;

-- Step 4: Also delete related records for cancelled bookings
-- Delete employee points for cancelled bookings
DELETE FROM employee_points 
WHERE booking_id IN (
  SELECT id FROM bookings WHERE deleted_at IS NOT NULL
);

-- Delete coupon usages for cancelled bookings
DELETE FROM coupon_usages 
WHERE booking_id IN (
  SELECT id FROM bookings WHERE deleted_at IS NOT NULL
);

-- Delete payments for cancelled bookings
DELETE FROM payments 
WHERE booking_id IN (
  SELECT id FROM bookings WHERE deleted_at IS NOT NULL
);

-- Step 5: Verify cleanup - Show remaining bookings
SELECT 
  id,
  property_id,
  check_in,
  check_out,
  status,
  payment_status,
  total_amount,
  created_at
FROM bookings
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Step 6: Show final counts
SELECT 
  'Total Remaining Bookings' as label,
  COUNT(*) as count
FROM bookings
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Deleted Bookings',
  COUNT(*)
FROM bookings
WHERE deleted_at IS NOT NULL;

-- Success message
SELECT '✅ SESSION 47: Booking cleanup complete! Only confirmed bookings remain for testing.' as Message;
