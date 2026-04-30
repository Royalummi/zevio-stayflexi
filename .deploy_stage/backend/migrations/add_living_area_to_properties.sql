-- Migration: Add living_area column to properties table
-- Date: 2026

ALTER TABLE `properties`
ADD COLUMN `living_area` INT DEFAULT NULL COMMENT 'Living area in square feet' AFTER `bathrooms`;
