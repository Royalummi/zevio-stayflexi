-- Add booking_discount_amount to vendor_settlements
-- Tracks coupon discount applied to the booking so settlement breakdown is accurate.
-- Without this, vendor_gross was incorrectly calculated using pre-discount base_amount
-- + post-discount gst_amount, making vendor_gross exceed the actual guest payment.

ALTER TABLE vendor_settlements
  ADD COLUMN `booking_discount_amount` DECIMAL(12,2) DEFAULT 0
    COMMENT 'Coupon/discount amount deducted from booking base before settlement'
    AFTER `booking_total_amount`;
