-- Session 42: Add maps_location column to properties table
-- Created: February 2, 2026
-- Purpose: Store Google Maps URLs for each property to enable location viewing

ALTER TABLE properties
ADD COLUMN maps_location VARCHAR(500) DEFAULT NULL COMMENT 'Google Maps URL or coordinates for property location';

-- Add index for potential future queries
CREATE INDEX idx_properties_maps_location ON properties(maps_location(100));
