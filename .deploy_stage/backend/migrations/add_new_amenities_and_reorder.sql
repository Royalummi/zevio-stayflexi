-- Migration: Add new amenities, apartment_only column, reorder Kitchen first in Facilities
-- Date: 2026

-- Step 1: Add apartment_only column to amenities table
ALTER TABLE `amenities`
ADD COLUMN `apartment_only` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'If 1, only show for Service Apartment (pt-002) properties' AFTER `is_active`;

-- Step 2: Update Kitchen to be first in Facilities (display_order = 1 within its category)
UPDATE `amenities` SET `display_order` = 1 WHERE `name` = 'Kitchen' AND `category` = 'facility';

-- Step 3: Mark existing Housekeeping as apartment_only
UPDATE `amenities` SET `apartment_only` = 1 WHERE `name` = 'Housekeeping' AND `category` = 'service';

-- Step 4: Insert new amenities
INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`) VALUES
(UUID(), 'Private Pool', 'facility', 'private-pool', NULL, 17, 1, 0, NOW(), NOW()),
(UUID(), 'Jacuzzi', 'facility', 'jacuzzi', NULL, 18, 1, 0, NOW(), NOW()),
(UUID(), 'Mountain View', 'feature', 'mountain', NULL, 5, 1, 0, NOW(), NOW()),
(UUID(), 'Smoke Alarms', 'safety', 'smoke-alarm', NULL, 16, 1, 0, NOW(), NOW());
