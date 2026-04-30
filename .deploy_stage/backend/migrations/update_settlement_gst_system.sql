-- Migration: New vendor settlement system with GST-aware calculations
-- Adds is_gst_registered to vendors
-- Adds settlement breakdown columns to vendor_settlements

-- 1. Add is_gst_registered boolean to vendors table
-- If gst_number already exists and is not empty, default to true
ALTER TABLE `vendors`
ADD COLUMN `is_gst_registered` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Whether vendor is GST registered' AFTER `gst_number`;

UPDATE `vendors` SET `is_gst_registered` = 1 
WHERE `gst_number` IS NOT NULL AND `gst_number` != '';

-- 2. Add settlement breakdown columns to vendor_settlements
ALTER TABLE `vendor_settlements`
ADD COLUMN `booking_base_amount` DECIMAL(12,2) DEFAULT NULL COMMENT 'Booking base amount (before GST/service charge)' AFTER `booking_id`,
ADD COLUMN `booking_gst_amount` DECIMAL(12,2) DEFAULT NULL COMMENT 'GST amount from booking' AFTER `booking_base_amount`,
ADD COLUMN `booking_service_charge` DECIMAL(12,2) DEFAULT NULL COMMENT 'Service charge from booking' AFTER `booking_gst_amount`,
ADD COLUMN `booking_total_amount` DECIMAL(12,2) DEFAULT NULL COMMENT 'Total amount guest paid' AFTER `booking_service_charge`,
ADD COLUMN `vendor_gross_amount` DECIMAL(12,2) DEFAULT NULL COMMENT 'Vendor gross (base+GST for GST vendor, base only for non-GST)' AFTER `booking_total_amount`,
ADD COLUMN `platform_fee` DECIMAL(12,2) DEFAULT NULL COMMENT '3% of vendor gross amount' AFTER `vendor_gross_amount`,
ADD COLUMN `platform_fee_gst` DECIMAL(12,2) DEFAULT NULL COMMENT '18% GST on platform fee' AFTER `platform_fee`,
ADD COLUMN `total_deduction` DECIMAL(12,2) DEFAULT NULL COMMENT 'platform_fee + platform_fee_gst' AFTER `platform_fee_gst`,
ADD COLUMN `is_vendor_gst` TINYINT(1) DEFAULT 0 COMMENT 'Was vendor GST registered at time of settlement' AFTER `total_deduction`;

-- 3. Rename old 'amount' to keep backward compat, it now stores final settlement amount
-- (amount already stores the final vendor payout, we keep using it)
