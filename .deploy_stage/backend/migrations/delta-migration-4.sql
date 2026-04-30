-- Delta Migration 4: living_area column update
-- Changes living_area from "square feet" to "number of living rooms" (default 1)
-- MySQL 8.0 compatible

ALTER TABLE `properties`
MODIFY COLUMN `living_area` INT DEFAULT 1 COMMENT 'Number of living rooms';

UPDATE `properties` SET `living_area` = 1 WHERE `living_area` IS NULL;

SELECT 'Delta Migration 4 complete: living_area updated' AS status;
