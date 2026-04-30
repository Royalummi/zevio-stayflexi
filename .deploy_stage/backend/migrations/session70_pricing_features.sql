-- ============================================================
-- SESSION 70: PRICING FEATURES MIGRATION
-- 1. property_calendar_pricing  — day-wise price overrides
-- 2. property_pricing columns   — villa duration discount slabs
-- 3. cancellation_policies      — per-property-type CRUD by admin
-- ============================================================

-- 1. Calendar Pricing Table
CREATE TABLE IF NOT EXISTS `property_calendar_pricing` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `price_date` date NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL COMMENT 'admin or vendor id who set the price',
  `created_by_role` enum('admin','vendor') DEFAULT 'vendor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_property_date` (`property_id`, `price_date`),
  KEY `idx_calendar_property` (`property_id`),
  KEY `idx_calendar_date` (`price_date`),
  CONSTRAINT `fk_calendar_property` FOREIGN KEY (`property_id`)
    REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- 2. Villa Duration Discount Slabs on property_pricing
ALTER TABLE `property_pricing`
  ADD COLUMN IF NOT EXISTS `discount_3_5_days`   decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 3-5 night bookings',
  ADD COLUMN IF NOT EXISTS `discount_6_14_days`  decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 6-14 night bookings',
  ADD COLUMN IF NOT EXISTS `discount_15_plus_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 15+ night bookings';

-- 3. Cancellation Policies Table
CREATE TABLE IF NOT EXISTS `cancellation_policies` (
  `id` char(36) NOT NULL,
  `property_type_id` char(36) NOT NULL,
  `policy_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `tiers` longtext NOT NULL
    COMMENT 'JSON array: [{label, days_before_checkin, refund_percent}]',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cancel_policy_type` (`property_type_id`),
  CONSTRAINT `fk_cancel_policy_type` FOREIGN KEY (`property_type_id`)
    REFERENCES `property_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Seed default cancellation policies for Villa (pt-001) and Service Apartment (pt-002)
INSERT IGNORE INTO `cancellation_policies`
  (`id`, `property_type_id`, `policy_name`, `description`, `tiers`, `is_active`, `created_by`)
VALUES
(
  UUID(),
  'pt-001',
  'Villa Standard Cancellation',
  'Applies to all villa bookings. Refunds are processed within 5-7 business days after cancellation.',
  '[{"label":"Full Refund","days_before_checkin":7,"refund_percent":100},{"label":"Partial Refund","days_before_checkin":3,"refund_percent":50},{"label":"No Refund","days_before_checkin":0,"refund_percent":0}]',
  1,
  (SELECT id FROM admins ORDER BY created_at ASC LIMIT 1)
),
(
  UUID(),
  'pt-002',
  'Service Apartment Standard Cancellation',
  'Applies to all service apartment bookings. Refunds are processed within 5-7 business days after cancellation.',
  '[{"label":"Full Refund","days_before_checkin":14,"refund_percent":100},{"label":"Partial Refund","days_before_checkin":7,"refund_percent":50},{"label":"No Refund","days_before_checkin":0,"refund_percent":0}]',
  1,
  (SELECT id FROM admins ORDER BY created_at ASC LIMIT 1)
);
