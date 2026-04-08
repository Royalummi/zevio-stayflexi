-- Migration: Add original_price to property_pricing
-- Date: 2026-04-07
-- Purpose: Store the original/rack rate (shown with strikethrough) alongside the
--          discounted price (price_per_night). When original_price > price_per_night
--          the UI shows the original crossed out and a "X% off" badge.

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS migrate_original_price()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'property_pricing'
      AND column_name  = 'original_price'
  ) THEN
    ALTER TABLE property_pricing
      ADD COLUMN `original_price` DECIMAL(12,2) DEFAULT NULL
        COMMENT 'Original rack rate before discount (displayed crossed-out); NULL = no discount'
      AFTER `price_per_night`;
  END IF;
END //
DELIMITER ;

CALL migrate_original_price();
DROP PROCEDURE IF EXISTS migrate_original_price;
