-- ============================================
-- SESSION 47: PAYMENT TRACKING & 15-MIN EXPIRY
-- Date: February 3, 2026
-- Purpose: Add payment status tracking and payment expiry window
-- ============================================

-- Add payment_status field to track payment state separately from booking state
ALTER TABLE bookings 
ADD COLUMN payment_status ENUM('pending', 'completed', 'failed', 'refunded') 
DEFAULT 'pending' 
COMMENT 'Separate payment tracking: pending=awaiting payment, completed=payment received'
AFTER status;

-- Add payment_expires_at for 15-minute payment window enforcement
ALTER TABLE bookings 
ADD COLUMN payment_expires_at DATETIME DEFAULT NULL 
COMMENT '15-minute payment window: auto-cancel if payment not received by this time'
AFTER expires_at;

-- Add index for efficient cron job queries
ALTER TABLE bookings 
ADD INDEX idx_payment_expiry (status, payment_status, payment_expires_at);

-- Update existing bookings to set payment_status based on current status
UPDATE bookings 
SET payment_status = CASE
  WHEN status = 'confirmed' OR status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'failed'
  ELSE 'pending'
END
WHERE payment_status = 'pending';

-- Set payment_expires_at for existing pending_payment bookings (give them 1 hour from now)
UPDATE bookings 
SET payment_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
WHERE status = 'pending_payment' 
AND payment_status = 'pending'
AND payment_expires_at IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check schema changes
DESCRIBE bookings;

-- Check existing pending bookings
SELECT 
  id, 
  status, 
  payment_status, 
  payment_expires_at, 
  created_at,
  TIMESTAMPDIFF(MINUTE, NOW(), payment_expires_at) as minutes_until_expiry
FROM bookings 
WHERE status = 'pending_payment'
LIMIT 10;

-- Success message
SELECT 'SESSION 47: Database schema updated successfully!' as Message;
