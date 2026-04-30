-- Migration: Drop check_in_guidelines, house_rules_text, amenities_guide columns
-- These fields have been removed from the application code

ALTER TABLE properties
  DROP COLUMN check_in_guidelines,
  DROP COLUMN house_rules_text,
  DROP COLUMN amenities_guide;

ALTER TABLE property_guidelines
  DROP COLUMN check_in_guidelines,
  DROP COLUMN house_rules_text,
  DROP COLUMN amenities_guide;
