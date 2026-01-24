-- Migration: Add area column to properties table for service apartments
-- This will allow storing specific locality/area information like "Koramangala", "Andheri East", etc.

ALTER TABLE `properties` 
ADD COLUMN `area` VARCHAR(100) DEFAULT NULL COMMENT 'Specific area/locality within city (e.g., Koramangala, Andheri East)' AFTER `city`;

-- Add index for faster area-based searches
CREATE INDEX idx_properties_area ON properties(area);
