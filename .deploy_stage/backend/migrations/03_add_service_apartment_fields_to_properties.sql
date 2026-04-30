-- =====================================================
-- SESSION 35: SERVICE APARTMENTS EXPANSION - MIGRATION 3/4
-- Add service apartment specific fields to properties table
-- Date: January 17, 2026
-- =====================================================

USE zevio;

-- Add service apartment specific fields
ALTER TABLE `properties`
  -- Pricing & Stay Duration Fields
  ADD COLUMN `weekly_discount_percent` DECIMAL(5,2) DEFAULT 15.00 COMMENT '7-29 days discount (default 15%)',
  ADD COLUMN `monthly_discount_percent` DECIMAL(5,2) DEFAULT 25.00 COMMENT '30-89 days discount (default 25%)',
  ADD COLUMN `quarterly_discount_percent` DECIMAL(5,2) DEFAULT 30.00 COMMENT '90-179 days discount (default 30%)',
  ADD COLUMN `long_term_discount_percent` DECIMAL(5,2) DEFAULT 35.00 COMMENT '180+ days discount (default 35%)',
  ADD COLUMN `min_stay_days` INT DEFAULT 1 COMMENT 'Minimum stay requirement in days',
  ADD COLUMN `max_stay_days` INT DEFAULT NULL COMMENT 'Maximum stay allowed (NULL = unlimited)',
  
  -- Service Apartment Amenities (Boolean flags)
  ADD COLUMN `has_workspace` BOOLEAN DEFAULT FALSE COMMENT 'Dedicated workspace/desk available',
  ADD COLUMN `has_housekeeping` BOOLEAN DEFAULT FALSE COMMENT 'Housekeeping service included',
  ADD COLUMN `housekeeping_frequency` ENUM('daily', 'weekly', 'bi-weekly', 'on-demand') DEFAULT 'weekly' COMMENT 'Housekeeping frequency',
  ADD COLUMN `has_laundry` BOOLEAN DEFAULT FALSE COMMENT 'Laundry service included',
  ADD COLUMN `laundry_frequency` ENUM('weekly', 'bi-weekly', 'on-demand') DEFAULT 'weekly' COMMENT 'Laundry frequency',
  ADD COLUMN `utilities_included` BOOLEAN DEFAULT FALSE COMMENT 'Electricity, water bills included',
  ADD COLUMN `has_parking` BOOLEAN DEFAULT FALSE COMMENT 'Parking available',
  ADD COLUMN `parking_slots` INT DEFAULT 0 COMMENT 'Number of parking slots',
  ADD COLUMN `has_elevator` BOOLEAN DEFAULT FALSE COMMENT 'Elevator available (important for service apartments)',
  ADD COLUMN `has_gym` BOOLEAN DEFAULT FALSE COMMENT 'Gym/fitness center access',
  ADD COLUMN `has_security` BOOLEAN DEFAULT FALSE COMMENT '24/7 security available',
  ADD COLUMN `has_power_backup` BOOLEAN DEFAULT FALSE COMMENT 'Power backup/generator available',
  
  -- Location & Proximity (Service Apartment Specific)
  ADD COLUMN `floor_number` INT DEFAULT NULL COMMENT 'Floor number if in apartment building',
  ADD COLUMN `nearest_metro_km` DECIMAL(4,2) DEFAULT NULL COMMENT 'Distance to nearest metro station (km)',
  ADD COLUMN `nearest_metro_name` VARCHAR(200) DEFAULT NULL COMMENT 'Nearest metro station name',
  ADD COLUMN `nearest_airport_km` DECIMAL(5,2) DEFAULT NULL COMMENT 'Distance to nearest airport (km)',
  ADD COLUMN `nearest_hospital_km` DECIMAL(4,2) DEFAULT NULL COMMENT 'Distance to nearest hospital (km)',
  ADD COLUMN `nearest_mall_km` DECIMAL(4,2) DEFAULT NULL COMMENT 'Distance to nearest shopping mall (km)',
  ADD COLUMN `nearby_it_parks` TEXT DEFAULT NULL COMMENT 'Nearby IT parks/office areas (comma-separated)',
  
  -- Internet & Connectivity
  ADD COLUMN `wifi_speed_mbps` INT DEFAULT NULL COMMENT 'WiFi speed in Mbps',
  ADD COLUMN `wifi_provider` VARCHAR(100) DEFAULT NULL COMMENT 'Internet service provider name',
  
  -- Corporate Features (Minimal Implementation)
  ADD COLUMN `allow_corporate_booking` BOOLEAN DEFAULT FALSE COMMENT 'Property available for corporate bookings',
  ADD COLUMN `corporate_discount_percent` INT DEFAULT 20 COMMENT 'Corporate booking discount (default 20%)',
  
  -- Additional Service Apartment Info
  ADD COLUMN `furnishing_type` ENUM('fully_furnished', 'semi_furnished', 'unfurnished') DEFAULT 'fully_furnished' COMMENT 'Furnishing level',
  ADD COLUMN `maintenance_charges` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monthly maintenance charges (if applicable)',
  ADD COLUMN `deposit_amount` DECIMAL(12,2) DEFAULT NULL COMMENT 'Security deposit for long stays',
  ADD COLUMN `notice_period_days` INT DEFAULT 30 COMMENT 'Notice period for checkout (long stays)';

-- Create indexes for performance on service apartment queries
CREATE INDEX `idx_has_workspace` ON `properties`(`has_workspace`, `status`);
CREATE INDEX `idx_has_housekeeping` ON `properties`(`has_housekeeping`, `status`);
CREATE INDEX `idx_corporate_booking` ON `properties`(`allow_corporate_booking`, `status`);
CREATE INDEX `idx_min_stay` ON `properties`(`min_stay_days`, `status`);
CREATE INDEX `idx_nearest_metro` ON `properties`(`nearest_metro_km`);

-- =====================================================
-- MIGRATION COMPLETE: Service apartment fields added
-- Total new columns: 33
-- Indexes created: 5
-- Next: Run migration 4 (corporate user fields)
-- =====================================================
