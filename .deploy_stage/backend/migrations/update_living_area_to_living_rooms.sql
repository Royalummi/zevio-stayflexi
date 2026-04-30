-- Migration: Change living_area from square feet to living room count (integer, default 1)
-- Update column default and comment
ALTER TABLE `properties`
MODIFY COLUMN `living_area` INT DEFAULT 1 COMMENT 'Number of living rooms';

-- Set existing NULL values to 1
UPDATE `properties` SET `living_area` = 1 WHERE `living_area` IS NULL;
