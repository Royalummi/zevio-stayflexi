-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 07, 2026 at 05:36 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `zevio`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `auto_populate_service_apartment_calendar` (IN `p_property_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)   BEGIN
  DECLARE property_price DECIMAL(12,2);
  DECLARE property_type_name VARCHAR(100);
  DECLARE v_start_date DATE;
  DECLARE v_end_date DATE;
  
  SELECT 
    p.price_per_night,
    pt.name
  INTO 
    property_price,
    property_type_name
  FROM properties p
  LEFT JOIN property_types pt ON p.property_type_id = pt.id
  WHERE p.id = p_property_id COLLATE utf8mb4_unicode_ci;
  
  IF property_type_name = 'Service Apartment' THEN
    SET v_start_date = CURDATE();
    SET v_end_date = DATE_ADD(CURDATE(), INTERVAL 2 YEAR);
    
    CALL populate_apartment_calendar(p_property_id, property_price, v_start_date, v_end_date);
    
    SELECT CONCAT('Auto-populated 2-year calendar for Service Apartment: ', p_property_id) as result;
  ELSE
    SELECT 'Not a Service Apartment - calendar not populated' as result;
  END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `populate_apartment_calendar` (IN `p_property_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci, IN `p_base_price` DECIMAL(12,2), IN `p_start_date` DATE, IN `p_end_date` DATE)   BEGIN
  DECLARE v_current_date DATE;
  
  SET v_current_date = p_start_date;
  
  WHILE v_current_date <= p_end_date DO
    INSERT INTO booking_calendar (
      id, property_id, date, status, price
    ) VALUES (
      UUID(), p_property_id, v_current_date, 'available', p_base_price
    )
    ON DUPLICATE KEY UPDATE
      price = p_base_price,
      status = 'available';
    
    SET v_current_date = DATE_ADD(v_current_date, INTERVAL 1 DAY);
  END WHILE;
  
  SELECT CONCAT('Calendar populated from ', p_start_date, ' to ', p_end_date) as result;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL,
  `actor_id` char(36) DEFAULT NULL,
  `actor_role` varchar(50) DEFAULT NULL,
  `action` varchar(200) DEFAULT NULL,
  `entity` varchar(100) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `actor_id`, `actor_role`, `action`, `entity`, `entity_id`, `created_at`) VALUES
('1ced775a-4cff-480e-8877-e42bb278d35a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Created coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-28 11:19:07'),
('34b5a30f-7018-4fd8-b2af-249faa415bf0', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-29 16:28:51'),
('359ce914-25ad-11f1-9f44-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', '2026-03-22 05:08:40'),
('36659c02-ec61-4f62-8f96-9d863ff9d5fd', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-29 16:28:47'),
('628d53e7-25ad-11f1-9f44-00410e2b5e6e', 'test-admin-id-00000000', 'admin', 'test action', 'property', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-22 05:09:55'),
('65f6dc6c-2b91-11f1-9fb9-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new vendor account: Mithun (mithunmanju77@gmail.com)', 'vendor', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', '2026-03-29 17:04:50'),
('6bddac24-25ae-11f1-9f44-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '085785eb-9d0e-45e9-b5ed-a333a67cfe20', '2026-03-22 05:17:20'),
('d20d4d0d-883b-4de4-9cf1-6c8a79db2ccb', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', '3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', '2026-04-04 07:46:37'),
('f98e09fa-2b90-11f1-9fb9-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Shashank (shashankzevio@gmail.com)', 'customer', '1dee3043-ff2a-4712-8e9e-a46ee3024845', '2026-03-29 17:01:48');

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` char(36) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` text NOT NULL,
  `role` enum('super_admin','admin') DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`, `deleted_at`, `avatar`, `reset_token`, `reset_token_expiry`) VALUES
('bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'Super Admin', 'admin@zevio.com', '$2a$10$nOsbi7ZKDC4fAyuc/geSk.3bksszLqnoWsqbulOpqK4o3yKowBfHG', 'super_admin', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL),
('bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'John Admin', 'john.admin@zevio.com', '$2a$10$9g7.OhgqaB0fKSsXR.dS/OOsFufK/b25zJlyU2jwHbwVaPxEAEb7O', 'admin', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `amenities`
--

CREATE TABLE `amenities` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT 'general',
  `icon` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `apartment_only` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'If 1, only show for Service Apartment properties',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `apartment_only`, `created_at`, `updated_at`) VALUES
('207aabd6-2aca-11f1-902c-00410e2b5e6e', 'Private Pool', 'facility', 'private-pool', NULL, 17, 1, 0, '2026-03-28 17:18:20', '2026-03-28 17:18:20'),
('207b3749-2aca-11f1-902c-00410e2b5e6e', 'Jacuzzi', 'facility', 'jacuzzi', NULL, 18, 1, 0, '2026-03-28 17:18:20', '2026-03-28 17:18:20'),
('207c0a7a-2aca-11f1-902c-00410e2b5e6e', 'Mountain View', 'feature', 'mountain', NULL, 5, 1, 0, '2026-03-28 17:18:20', '2026-03-28 17:18:20'),
('207c6c25-2aca-11f1-902c-00410e2b5e6e', 'Smoke Alarms', 'safety', 'smoke-alarm', NULL, 16, 1, 0, '2026-03-28 17:18:20', '2026-03-28 17:18:20'),
('5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', 'WiFi', 'connectivity', 'wifi', NULL, 19, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', 'Workspace', 'workspace', 'desk', NULL, 20, 1, 0, '2026-01-17 20:51:38', '2026-01-17 20:51:38'),
('5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', 'AC', 'comfort', 'snowflake', NULL, 1, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', 'Parking', 'facility', 'car', NULL, 11, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', 'Kitchen', 'facility', 'utensils', NULL, 1, 1, 0, '2026-01-17 20:51:38', '2026-03-28 17:18:20'),
('5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', 'TV', 'entertainment', 'tv', NULL, 17, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb510-f3e6-11f0-8f27-00410e2b5e6e', 'Washing Machine', 'appliance', 'washing-machine', NULL, 18, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb610-f3e6-11f0-8f27-00410e2b5e6e', 'Refrigerator', 'appliance', 'refrigerator', NULL, 14, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', 'Microwave', 'appliance', 'microwave', NULL, 10, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb817-f3e6-11f0-8f27-00410e2b5e6e', 'Geyser', 'comfort', 'hot-tub', NULL, 5, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', 'Gym', 'facility', 'dumbbell', NULL, 6, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bba14-f3e6-11f0-8f27-00410e2b5e6e', 'Swimming Pool', 'facility', 'swimming-pool', NULL, 16, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', 'Security', 'safety', 'shield', NULL, 15, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbc07-f3e6-11f0-8f27-00410e2b5e6e', 'Power Backup', 'facility', 'battery', NULL, 13, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbd10-f3e6-11f0-8f27-00410e2b5e6e', 'Elevator', 'facility', 'elevator', NULL, 3, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', 'Housekeeping', 'service', 'broom', NULL, 7, 1, 1, '2026-01-17 20:51:38', '2026-03-28 17:18:20'),
('5c1bbf0b-f3e6-11f0-8f27-00410e2b5e6e', 'Laundry', 'service', 'laundry', NULL, 9, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', 'Balcony', 'feature', 'balcony', NULL, 2, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', 'Garden', 'feature', 'tree', NULL, 4, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', 'Pet Friendly', 'policy', 'paw', NULL, 12, 1, 0, '2026-01-17 20:51:38', '2026-01-18 06:16:16');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `property_id` char(36) DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `nights` int(11) DEFAULT NULL,
  `guest_count` int(10) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Number of guests (13+ years)',
  `children_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of children (age 0-12)',
  `infants_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of infants (age 0-2, FREE)',
  `base_amount` decimal(12,2) DEFAULT NULL,
  `extra_guest_charges` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total charges for extra guests',
  `extra_children_charges` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total charges for extra children',
  `gst_amount` decimal(12,2) DEFAULT NULL,
  `service_charge` decimal(10,2) DEFAULT 0.00 COMMENT 'Platform fee (5% of booking amount)',
  `coupon_id` char(36) DEFAULT NULL COMMENT 'Applied coupon ID',
  `coupon_code` varchar(50) DEFAULT NULL COMMENT 'Applied coupon code',
  `coupon_discount` decimal(10,2) DEFAULT 0.00 COMMENT 'Discount amount from coupon',
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending_payment','confirmed','cancel_requested','cancelled','completed') DEFAULT 'pending_payment',
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending' COMMENT 'Separate payment tracking: pending=awaiting payment, completed=payment received',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `payment_expires_at` datetime DEFAULT NULL COMMENT '15-minute payment window: auto-cancel if payment not received by this time',
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `property_id`, `check_in`, `check_out`, `nights`, `guest_count`, `children_count`, `infants_count`, `base_amount`, `extra_guest_charges`, `extra_children_charges`, `gst_amount`, `service_charge`, `coupon_id`, `coupon_code`, `coupon_discount`, `discount_amount`, `total_amount`, `status`, `payment_status`, `created_at`, `expires_at`, `payment_expires_at`, `deleted_at`) VALUES
('d5133df0-cec7-48eb-9eb0-af30118d3001', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-11', '2026-05-12', 1, 2, 0, 0, 16000.00, 0.00, 0.00, 2880.00, 800.00, NULL, NULL, 0.00, 0.00, 19680.00, 'cancelled', 'failed', '2026-04-05 18:02:00', '2026-04-06 00:14:26', '2026-04-06 00:14:26', NULL),
('f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-10', '2026-04-16', 6, 4, 0, 0, 96000.00, 0.00, 0.00, 17280.00, 4800.00, NULL, NULL, 0.00, 0.00, 118080.00, 'confirmed', 'pending', '2026-04-05 20:23:23', '2026-04-06 02:11:25', '2026-04-06 02:11:25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cancellation_policies`
--

CREATE TABLE `cancellation_policies` (
  `id` char(36) NOT NULL,
  `property_type_id` char(36) NOT NULL,
  `policy_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `tiers` longtext NOT NULL COMMENT 'JSON array: [{label, days_before_checkin, refund_percent}]',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `cancellation_policies`
--

INSERT INTO `cancellation_policies` (`id`, `property_type_id`, `policy_name`, `description`, `tiers`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
('d76be101-0e85-11f1-9f1f-00410e2b5e6e', 'pt-001', 'Villa Standard Cancellation', 'Applies to all villa bookings. Refunds are processed within 5-7 business days after cancellation.', '[{\"label\":\"Full Refund\",\"days_before_checkin\":7,\"refund_percent\":100},{\"label\":\"Partial Refund\",\"days_before_checkin\":3,\"refund_percent\":50},{\"label\":\"No Refund\",\"days_before_checkin\":0,\"refund_percent\":0}]', 1, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-02-20 17:58:47', '2026-02-20 17:58:47'),
('d76bf370-0e85-11f1-9f1f-00410e2b5e6e', 'pt-002', 'Service Apartment Standard Cancellation', 'Applies to all service apartment bookings. Refunds are processed within 5-7 business days after cancellation.', '[{\"label\":\"Full Refund\",\"days_before_checkin\":14,\"refund_percent\":100},{\"label\":\"Partial Refund\",\"days_before_checkin\":7,\"refund_percent\":50},{\"label\":\"No Refund\",\"days_before_checkin\":0,\"refund_percent\":0}]', 1, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-02-20 17:58:47', '2026-02-20 17:58:47');

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` char(36) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `name`, `state`, `status`) VALUES
('0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'Bengaluru', 'Karnataka', 'active'),
('49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'Bangalore', 'Karnataka', 'active'),
('49ab220d-f31e-11f0-8f27-00410e2b5e6e', 'Delhi NCR', 'Delhi', 'active'),
('bb65409d-e418-11f0-9f30-00410e2b5e6e', 'Mumbai', 'Maharashtra', 'active'),
('bb655349-e418-11f0-9f30-00410e2b5e6e', 'Goa', 'Goa', 'active'),
('bb655492-e418-11f0-9f30-00410e2b5e6e', 'Lonavala', 'Maharashtra', 'active'),
('bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'Alibaug', 'Maharashtra', 'active'),
('bb65554a-e418-11f0-9f30-00410e2b5e6e', 'Jaipur', 'Rajasthan', 'active'),
('bb655595-e418-11f0-9f30-00410e2b5e6e', 'Udaipur', 'Rajasthan', 'active'),
('bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'Manali', 'Himachal Pradesh', 'active'),
('bb65562b-e418-11f0-9f30-00410e2b5e6e', 'Shimla', 'Himachal Pradesh', 'active'),
('bb655697-e418-11f0-9f30-00410e2b5e6e', 'Coorg', 'Karnataka', 'active'),
('bb6556e0-e418-11f0-9f30-00410e2b5e6e', 'Ooty', 'Tamil Nadu', 'active'),
('ebd366fe-2f57-4f27-8d5c-ceff67619238', 'Mysore', 'Karnataka', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `contact_types`
--

CREATE TABLE `contact_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_types`
--

INSERT INTO `contact_types` (`id`, `name`, `description`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'primary', 'Primary point of contact', 1, 1, '2026-01-18 10:33:07'),
(2, 'secondary', 'Secondary contact person', 2, 1, '2026-01-18 10:33:07'),
(3, 'emergency', 'Emergency contact', 3, 1, '2026-01-18 10:33:07'),
(4, 'maintenance', 'Maintenance contact', 4, 1, '2026-01-18 10:33:07'),
(5, 'vendor', 'Vendor/owner contact', 5, 1, '2026-01-18 10:33:07');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` char(36) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `type` enum('percentage','flat','first_time') NOT NULL COMMENT 'Discount type',
  `discount_percentage` decimal(5,2) DEFAULT NULL COMMENT 'Percentage off (for percentage type)',
  `discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Flat amount off (for flat type)',
  `max_discount_cap` decimal(10,2) DEFAULT NULL COMMENT 'Maximum discount limit',
  `discount_value` decimal(12,2) DEFAULT NULL COMMENT 'Percentage or flat amount',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `min_booking_amount` decimal(12,2) DEFAULT NULL,
  `valid_from` date NOT NULL COMMENT 'Coupon valid from',
  `valid_until` date NOT NULL COMMENT 'Coupon expiry date',
  `usage_limit` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0 COMMENT 'Current usage count',
  `per_user_limit` int(11) DEFAULT 1 COMMENT 'Usage limit per user',
  `applicable_properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Property IDs (NULL = all)' CHECK (json_valid(`applicable_properties`)),
  `description` text DEFAULT NULL COMMENT 'Coupon description',
  `created_by` char(36) DEFAULT NULL COMMENT 'Admin creator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Coupon active status'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `type`, `discount_percentage`, `discount_amount`, `max_discount_cap`, `discount_value`, `max_discount`, `min_booking_amount`, `valid_from`, `valid_until`, `usage_limit`, `usage_count`, `per_user_limit`, `applicable_properties`, `description`, `created_by`, `created_at`, `updated_at`, `deleted_at`, `is_active`) VALUES
('da184f4f-1f3f-4164-b5f7-cc9d053a04be', 'SUMMER1250', 'flat', NULL, 1000.00, NULL, NULL, NULL, 10000.00, '2026-03-27', '2026-04-01', 1, 0, 1, NULL, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-03-28 11:19:07', '2026-03-29 16:28:51', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usages`
--

CREATE TABLE `coupon_usages` (
  `id` char(36) NOT NULL,
  `coupon_id` char(36) DEFAULT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `discount_applied` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Discount amount',
  `status` enum('reserved','completed','cancelled') DEFAULT 'reserved' COMMENT 'Reservation status',
  `reserved_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'When locked',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'When payment done',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT 'When cancelled',
  `user_id` char(36) DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cron_jobs_log`
--

CREATE TABLE `cron_jobs_log` (
  `id` char(36) NOT NULL,
  `job_name` varchar(100) DEFAULT NULL,
  `run_date` date DEFAULT NULL,
  `status` enum('success','failed') DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `cron_jobs_log`
--

INSERT INTO `cron_jobs_log` (`id`, `job_name`, `run_date`, `status`, `remarks`) VALUES
('0916d3db-78be-4cd2-bba6-bedeaa2ba859', 'check_in_reminder_24h', '2026-01-10', 'success', 'Sent 0 reminders, 0 failed'),
('0b28c8cb-f910-4b88-a2fc-d912400b6e4a', 'daily_cleanup', '2026-02-14', 'success', 'Cancelled 0 expired bookings'),
('0fbfdcc5-d87d-4542-b33d-3ced967abded', 'check_out_reminder', '2026-01-24', 'success', 'Sent 0 reminders, 0 failed'),
('1048eca0-bd8d-4f6a-83f4-e2cd154046a4', 'check_in_reminder_24h', '2026-02-25', 'success', 'Sent 0 reminders, 0 failed'),
('21379069-b132-414b-a7cb-c5c7935b9734', 'check_in_reminder_24h', '2026-04-04', 'success', 'Sent 0 reminders, 0 failed'),
('2bcd0a3c-a8af-424c-bb44-f95f1ccd0d0d', 'check_in_reminder_24h', '2026-02-22', 'success', 'Sent 0 reminders, 0 failed'),
('31fb7be5-ded2-4527-8891-c4da7ba0811f', 'daily_booking_processor', '2026-03-17', 'success', 'Processed 0 settlements'),
('393ab217-4124-4485-b450-61eb13473535', 'daily_booking_processor', '2026-03-04', 'success', 'Processed 0 settlements'),
('3a359083-c8c2-4656-b59d-a15764489aab', 'daily_booking_processor', '2026-04-05', 'success', 'Processed 0 settlements'),
('3e2e27ab-923d-4a80-a3c8-dc22537cc210', 'review_request', '2026-02-15', 'success', 'Sent 0 review requests, 0 failed'),
('41380528-58cf-439e-bd65-03e5e4e655db', 'check_in_reminder_24h', '2026-03-03', 'success', 'Sent 0 reminders, 0 failed'),
('4e4f6494-4b55-4a62-8c18-2fdca9d49b5c', 'daily_booking_processor', '2026-01-19', 'success', 'Processed 0 settlements'),
('4eee4cab-7f09-4fde-bad2-c049d800b1c6', 'daily_booking_processor', '2026-02-14', 'success', 'Processed 0 settlements'),
('50f3f5a8-349a-4856-8712-1bd64b78bb53', 'daily_cleanup', '2026-01-19', 'success', 'Cancelled 0 expired bookings'),
('533977e8-da56-43ad-9c8b-f3aa053c5f64', 'check_out_reminder', '2026-03-04', 'success', 'Sent 0 reminders, 0 failed'),
('576a9bc9-593b-4f50-9d31-83d60edd0c5a', 'check_out_reminder', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
('6a87defb-247c-42df-ae4c-7b4b92cc19d2', 'check_in_reminder_24h', '2026-02-15', 'success', 'Sent 0 reminders, 0 failed'),
('6d6ba5b9-e24d-45ff-a09e-346a3180580c', 'daily_booking_processor', '2026-01-17', 'success', 'Processed 0 settlements'),
('8128c684-8420-4a35-86d7-097ee60fd371', 'check_in_reminder_24h', '2026-01-31', 'success', 'Sent 0 reminders, 0 failed'),
('84729866-fe54-44c0-8921-abd38bc8fee5', 'check_out_reminder', '2026-02-03', 'success', 'Sent 0 reminders, 0 failed'),
('849b75d5-e306-4b55-8443-f2871fe54266', 'daily_booking_processor', '2026-01-18', 'success', 'Processed 0 settlements'),
('883ee335-a6d4-4bb5-a41a-78eeb53ce2df', 'daily_cleanup', '2026-01-18', 'success', 'Cancelled 1 expired bookings'),
('89355d86-1c25-4374-b61d-86431e1f7180', 'check_in_reminder_24h', '2026-03-04', 'success', 'Sent 0 reminders, 0 failed'),
('91733ac3-7564-4901-8e31-31e7e78caa36', 'check_in_reminder_24h', '2026-02-17', 'success', 'Sent 0 reminders, 0 failed'),
('96a21ca2-4310-4684-ae62-b91d34fa4168', 'check_in_reminder_24h', '2026-01-25', 'success', 'Sent 0 reminders, 0 failed'),
('a3a20225-ddd1-44da-9f28-8587a5e500b4', 'check_in_reminder_24h', '2026-01-21', 'success', 'Sent 0 reminders, 0 failed'),
('a6bea39c-534a-475c-bf33-881348ae70dc', 'check_in_reminder_24h', '2026-03-17', 'success', 'Sent 0 reminders, 0 failed'),
('afa328e3-7777-49cc-ab14-c4a7905c743d', 'check_in_reminder_24h', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('b8a071e9-9d55-4e11-b6b7-854b9b00d0b4', 'check_in_reminder_24h', '2026-04-03', 'success', 'Sent 0 reminders, 0 failed'),
('bcf69c72-aaf8-49aa-8eed-8f62ffa4c172', 'check_in_reminder_24h', '2026-02-14', 'success', 'Sent 0 reminders, 1 failed'),
('cb1b166c-4bdd-4f9c-9280-fdc110a53529', 'daily_booking_processor', '2026-02-20', 'success', 'Processed 0 settlements'),
('ccdbfb8d-4881-4415-a178-5f3d99e1ad0f', 'check_in_reminder_24h', '2026-03-01', 'success', 'Sent 0 reminders, 0 failed'),
('ccf3d069-5135-4556-93b8-73b8e64e2ced', 'check_out_reminder', '2026-02-15', 'success', 'Sent 0 reminders, 0 failed'),
('ccfe878e-4c7c-4098-875a-ffeec4a38cfd', 'review_request', '2026-01-24', 'success', 'Sent 0 review requests, 0 failed'),
('d653fc40-9707-41d0-85a6-b08efe8e75da', 'review_request', '2026-03-22', 'success', 'Sent 0 review requests (multi-day), 0 failed'),
('d71183e4-bae3-47db-bc70-805a4704fff1', 'check_out_reminder', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('d929f8cc-8995-4008-b945-483a3e21aabe', 'check_in_reminder_24h', '2026-02-20', 'success', 'Sent 0 reminders, 0 failed'),
('e59c888e-1c81-43cc-841c-c0f7cad833e2', 'check_out_reminder', '2026-02-14', 'success', 'Sent 0 reminders, 0 failed'),
('e9cfbfc4-b67e-4cc9-b23b-7747e38bdd7e', 'check_in_reminder_24h', '2026-01-16', 'success', 'Sent 0 reminders, 0 failed'),
('ee0a50ca-95dc-4163-b146-983df8ce3db8', 'check_in_reminder_24h', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
('efd3e848-c056-4212-a1ec-3ef2e687951c', 'check_in_reminder_24h', '2026-04-05', 'success', 'Sent 0 reminders, 0 failed'),
('f0ad2938-2014-42d6-833e-26591a07fd34', 'check_in_reminder_24h', '2026-01-19', 'success', 'Sent 0 reminders, 0 failed'),
('f20afc7d-858c-4cd9-b891-1cb73082f62d', 'check_out_reminder', '2026-02-20', 'success', 'Sent 0 reminders, 0 failed'),
('fe848a12-bf5b-4904-af22-ecb4b6fe844f', 'check_out_reminder', '2026-03-22', 'success', 'Sent 0 reminders, 0 failed'),
('feafbaa6-7e6a-4325-8266-90e2ff47c804', 'review_request', '2026-01-17', 'success', 'Sent 0 review requests, 0 failed');

-- --------------------------------------------------------

--
-- Table structure for table `features`
--

CREATE TABLE `features` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `key_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `category` enum('facility','utility','service','security') DEFAULT 'facility',
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `features`
--

INSERT INTO `features` (`id`, `name`, `key_name`, `description`, `icon`, `category`, `is_active`, `display_order`, `created_at`) VALUES
(1, 'Elevator', 'elevator', 'Building has elevator/lift facility', 'elevator', 'facility', 1, 1, '2026-01-18 06:00:08'),
(2, 'Gym', 'gym', 'On-site gym or fitness center', 'dumbbell', 'facility', 1, 2, '2026-01-18 06:00:08'),
(3, 'Housekeeping', 'housekeeping', 'Regular housekeeping service', 'broom', 'service', 1, 3, '2026-01-18 06:00:08'),
(4, 'Laundry', 'laundry', 'Laundry service or facilities', 'washing-machine', 'service', 1, 4, '2026-01-18 06:00:08'),
(5, 'Parking', 'parking', 'Dedicated parking space', 'car', 'facility', 1, 5, '2026-01-18 06:00:08'),
(6, 'Power Backup', 'power_backup', 'Power backup generator', 'battery', 'utility', 1, 6, '2026-01-18 06:00:08'),
(7, 'Security', 'security', '24/7 security service', 'shield', 'security', 1, 7, '2026-01-18 06:00:08'),
(8, 'Workspace', 'workspace', 'Dedicated workspace area', 'desk', 'facility', 1, 8, '2026-01-18 06:00:08');

-- --------------------------------------------------------

--
-- Table structure for table `guide_types`
--

CREATE TABLE `guide_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guide_types`
--

INSERT INTO `guide_types` (`id`, `name`, `description`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'check_in', 'Check-in guidelines and procedures', 1, 1, '2026-01-18 10:33:42'),
(2, 'house_rules', 'House rules and regulations', 2, 1, '2026-01-18 10:33:42'),
(3, 'amenities', 'Amenities usage guide', 3, 1, '2026-01-18 10:33:42'),
(4, 'safety', 'Safety and security information', 4, 1, '2026-01-18 10:33:42'),
(5, 'local_area', 'Local area information and recommendations', 5, 1, '2026-01-18 10:33:42'),
(6, 'emergency', 'Emergency contacts and procedures', 6, 1, '2026-01-18 10:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` char(36) NOT NULL,
  `invoice_number` bigint(20) NOT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `base_amount` decimal(12,2) DEFAULT NULL,
  `gst_amount` decimal(12,2) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `invoice_type` enum('invoice','credit_note') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `user_id`, `base_amount`, `gst_amount`, `total_amount`, `invoice_type`, `created_at`) VALUES
('3ed7a7cc-d180-4c81-bfd5-c9a2f519c49d', 100012, '3c5e8c53-794f-4820-a5ac-ee46aa587004', '244c2909-85ef-4d38-8a0a-2723ff145942', 45000.00, 8100.00, 55350.00, 'invoice', '2026-02-22 03:24:20'),
('f2a18607-7858-4d55-8367-54891b1d4484', 100016, 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 96000.00, 17280.00, 118080.00, 'invoice', '2026-04-05 20:27:24'),
('fcba624e-8264-43e6-b0be-e3f3bb20474f', 100011, '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', '244c2909-85ef-4d38-8a0a-2723ff145942', 45000.00, 8100.00, 55350.00, 'invoice', '2026-02-22 03:17:41'),
('invoice-001', 100001, 'booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 51600.00, 9468.00, 61068.00, 'invoice', '2026-01-08 05:05:00'),
('invoice-002', 100002, 'booking-test-002', 'user-test-001', 21200.00, 3816.00, 25016.00, 'invoice', '2026-01-09 05:35:00'),
('invoice-003', 100003, 'booking-test-004', 'user-test-003', 95000.00, 18000.00, 113000.00, 'invoice', '2026-01-10 04:35:00'),
('invoice-004', 100004, 'booking-test-005', 'user-test-004', 36000.00, 6480.00, 42480.00, 'invoice', '2026-01-10 05:35:00'),
('invoice-005', 100005, 'booking-test-008', 'user-test-008', 46000.00, 8640.00, 54640.00, 'invoice', '2025-12-20 04:40:00'),
('invoice-007', 100007, 'booking-test-011', 'user-test-001', 16000.00, 2880.00, 18880.00, 'invoice', '2025-11-24 23:05:00'),
('invoice-008', 100008, 'booking-test-012', 'user-test-002', 20000.00, 3600.00, 23600.00, 'invoice', '2025-11-10 00:05:00'),
('invoice-009', 100009, 'booking-test-013', 'user-test-003', 42500.00, 7650.00, 50150.00, 'invoice', '2025-10-15 01:05:00'),
('invoice-010', 100010, 'booking-test-014', 'user-test-005', 69000.00, 12420.00, 81420.00, 'invoice', '2025-09-19 22:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `location_types`
--

CREATE TABLE `location_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `category` enum('transport','healthcare','commercial','tech','education','other') DEFAULT 'other',
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `location_types`
--

INSERT INTO `location_types` (`id`, `name`, `icon`, `category`, `display_order`, `is_active`, `created_at`) VALUES
(1, 'metro', 'train', 'transport', 1, 1, '2026-01-18 10:33:42'),
(2, 'airport', 'flight', 'transport', 2, 1, '2026-01-18 10:33:42'),
(3, 'hospital', 'medical', 'healthcare', 3, 1, '2026-01-18 10:33:42'),
(4, 'mall', 'shopping', 'commercial', 4, 1, '2026-01-18 10:33:42'),
(5, 'it_park', 'business', 'tech', 5, 1, '2026-01-18 10:33:42'),
(6, 'school', 'school', 'education', 6, 1, '2026-01-18 10:33:42'),
(7, 'restaurant', 'restaurant', 'commercial', 7, 1, '2026-01-18 10:33:42'),
(8, 'gym', 'fitness', 'other', 8, 1, '2026-01-18 10:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `email` varchar(255) NOT NULL,
  `attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_attempt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`email`, `attempts`, `locked_until`, `last_attempt`) VALUES
('wrong@email.com', 1, NULL, '2026-04-05 19:37:13');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `recipient_role` enum('user','vendor','employee','admin') DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_id`, `recipient_role`, `title`, `message`, `is_read`, `created_at`) VALUES
('ffb4fa16-688d-48a2-a021-89d38351ff17', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'user', 'Booking Confirmed', 'Your booking has been confirmed. Booking ID: f17ef3fd-7ed9-432a-9912-a03a4c84889c', 0, '2026-04-05 20:27:25');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `gateway_payment_id` varchar(150) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `status` enum('success','failed','pending') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `gateway`, `gateway_payment_id`, `amount`, `status`, `created_at`) VALUES
('07a95efd-8331-4509-af51-45093dd64a9a', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'cashfree', '5114926894326', 118080.00, 'success', '2026-04-05 20:23:23'),
('29789049-a094-4de6-a595-566d00ebad7e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413384097', 19680.00, 'pending', '2026-04-05 18:23:04'),
('8d849a61-53cb-48b5-9f72-3fddb36fd172', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413101902', 19680.00, 'pending', '2026-04-05 18:18:22'),
('8e595c87-4258-4abd-974a-c65833be2338', '3c5e8c53-794f-4820-a5ac-ee46aa587004', 'cashfree', '3c5e8c53-794f-4820-a5ac-ee46aa587004_1771730659999', 55350.00, 'success', '2026-02-22 03:24:20'),
('b0dd0063-8775-452d-a69d-9ca3373feab4', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413497024', 19680.00, 'pending', '2026-04-05 18:24:57'),
('bbd7cb58-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 'razorpay', 'pay_test_123456789', 53100.00, 'success', '2025-12-28 18:12:13'),
('d085b227-f211-414b-aaf7-75cc41d906c1', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775412120276', 137760.00, 'pending', '2026-04-05 18:02:00'),
('dafc1185-b8bc-43c1-bf4a-a20866f47139', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413599327', 19680.00, 'pending', '2026-04-05 18:26:39'),
('f44aef42-809f-4d64-a731-6cccbb88428c', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413248705', 19680.00, 'pending', '2026-04-05 18:20:48'),
('f4bbfda3-f7aa-4e51-823d-2bae6ae4801c', '3bb8abff-d1f9-4b6d-9a60-ce158e3f9a20', 'cashfree', '3bb8abff-d1f9-4b6d-9a60-ce158e3f9a20_1773333917176', 36900.00, 'pending', '2026-03-12 16:45:17'),
('fca89534-33b6-4966-81b8-1d06adc56857', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775412952556', 157440.00, 'pending', '2026-04-05 18:15:52'),
('fe71da5f-0315-4524-b584-ec6bbde9c6a5', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', 'cashfree', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e_1771730095281', 55350.00, 'success', '2026-02-22 03:14:55'),
('payment-test-001', 'booking-test-001', 'razorpay', 'pay_rzp_test_001', 61068.00, 'success', '2026-01-08 05:05:00'),
('payment-test-002', 'booking-test-002', 'razorpay', 'pay_rzp_test_002', 25016.00, 'success', '2026-01-09 05:35:00'),
('payment-test-004', 'booking-test-004', 'razorpay', 'pay_rzp_test_004', 113000.00, 'success', '2026-01-10 04:35:00'),
('payment-test-005', 'booking-test-005', 'razorpay', 'pay_rzp_test_005', 42480.00, 'success', '2026-01-10 05:35:00'),
('payment-test-008', 'booking-test-008', 'razorpay', 'pay_rzp_test_008', 54640.00, 'success', '2025-12-20 04:40:00'),
('payment-test-009', 'booking-test-009', 'razorpay', 'pay_rzp_test_009', 82600.00, 'success', '2026-01-10 07:35:00'),
('payment-test-010', 'booking-test-010', 'razorpay', 'pay_rzp_test_010', 28320.00, 'success', '2026-01-10 02:35:00'),
('payment-test-011', 'booking-test-011', 'razorpay', 'pay_rzp_test_011', 18880.00, 'success', '2025-11-24 23:05:00'),
('payment-test-012', 'booking-test-012', 'razorpay', 'pay_rzp_test_012', 23600.00, 'success', '2025-11-10 00:05:00'),
('payment-test-013', 'booking-test-013', 'razorpay', 'pay_rzp_test_013', 50150.00, 'success', '2025-10-15 01:05:00'),
('payment-test-014', 'booking-test-014', 'razorpay', 'pay_rzp_test_014', 81420.00, 'success', '2025-09-19 22:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` char(36) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `city_id` char(36) DEFAULT NULL,
  `property_type_id` char(36) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL COMMENT 'Specific area/locality within city',
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `living_area` int(11) DEFAULT 1 COMMENT 'Number of living rooms',
  `max_guests` int(11) DEFAULT 2,
  `same_day_booking_allowed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Allow same-day bookings (true/false)',
  `max_booking_days` int(10) UNSIGNED DEFAULT NULL COMMENT 'Maximum days allowed per booking (NULL = unlimited)',
  `check_in_time` varchar(50) DEFAULT '2:00 PM' COMMENT 'Default check-in time',
  `check_out_time` varchar(50) DEFAULT '11:00 AM' COMMENT 'Default check-out time',
  `house_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'House rules in JSON format' CHECK (json_valid(`house_rules`)),
  `cancellation_policy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Cancellation policy details in JSON' CHECK (json_valid(`cancellation_policy`)),
  `emergency_contacts` longtext DEFAULT NULL,
  `local_area_info` longtext DEFAULT NULL,
  `safety_information` longtext DEFAULT NULL,
  `amenities_guide` longtext DEFAULT NULL,
  `house_rules_text` longtext DEFAULT NULL,
  `check_in_guidelines` longtext DEFAULT NULL,
  `photos` text DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `reviews_count` int(11) DEFAULT 0,
  `status` enum('draft','pending_approval','approved','inactive') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `min_stay_days` int(11) DEFAULT 1 COMMENT 'Minimum stay requirement in days',
  `max_stay_days` int(11) DEFAULT NULL COMMENT 'Maximum stay allowed (NULL = unlimited)',
  `housekeeping_frequency` enum('daily','weekly','bi-weekly','on-demand') DEFAULT 'weekly' COMMENT 'Housekeeping frequency',
  `laundry_frequency` enum('weekly','bi-weekly','on-demand') DEFAULT 'weekly' COMMENT 'Laundry frequency',
  `utilities_included` tinyint(1) DEFAULT 0 COMMENT 'Electricity, water bills included',
  `parking_slots` int(11) DEFAULT 0 COMMENT 'Number of parking slots',
  `floor_number` int(11) DEFAULT NULL COMMENT 'Floor number if in apartment building',
  `wifi_speed_mbps` int(11) DEFAULT NULL COMMENT 'WiFi speed in Mbps',
  `wifi_provider` varchar(100) DEFAULT NULL COMMENT 'Internet service provider name',
  `furnishing_type` enum('fully_furnished','semi_furnished','unfurnished') DEFAULT 'fully_furnished' COMMENT 'Furnishing level',
  `is_recommended` tinyint(1) DEFAULT 0 COMMENT 'Whether property is marked as recommended by admin',
  `recommended_priority` int(11) DEFAULT 0 COMMENT 'Display order priority (higher = shown first, 1-12 range)',
  `recommended_at` timestamp NULL DEFAULT NULL COMMENT 'When property was marked as recommended',
  `recommended_by` char(36) DEFAULT NULL COMMENT 'Admin ID who marked it as recommended',
  `maps_location` varchar(500) DEFAULT NULL COMMENT 'Google Maps URL or coordinates for property location',
  `pool_type` enum('none','private','shared') NOT NULL DEFAULT 'none',
  `garden_type` enum('none','private','shared','terrace') NOT NULL DEFAULT 'none',
  `pets_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `events_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `event_capacity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `living_area`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `emergency_contacts`, `local_area_info`, `safety_information`, `amenities_guide`, `house_rules_text`, `check_in_guidelines`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`, `is_recommended`, `recommended_priority`, `recommended_at`, `recommended_by`, `maps_location`, `pool_type`, `garden_type`, `pets_allowed`, `events_allowed`, `event_capacity`) VALUES
('085785eb-9d0e-45e9-b5ed-a333a67cfe20', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa UPDATED 1774156640583', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-22 05:17:20', '2026-03-22 05:17:20', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('14821022-3028-4e3e-aa5e-3e5116ff9e36', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'TEST Vendor Villa EDITED', 'Updated by vendor', '456 Vendor St', NULL, NULL, NULL, 2, 1, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 08:44:08', '2026-04-04 08:44:08', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('3a2534cc-ffe4-414e-a761-764fce5be3bb', NULL, NULL, NULL, 'TEST Admin Villa EDITED', 'Updated by admin', NULL, NULL, NULL, NULL, 0, 0, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '', '', '', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 08:43:25', '2026-04-04 08:43:25', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('40bb16f7-bba7-4b3d-88c6-932bdebfd384', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'New Lake Villa', 'This is a new beach villa', 'Bangalore', 'Bangalore', 'Karnataka', '560085', 1, 1, 1, 2, 1, NULL, '2:00 PM', '11:00 AM', '\"{\\\"check_in_after\\\":\\\"2:00 PM\\\",\\\"check_out_before\\\":\\\"11:00 AM\\\",\\\"no_smoking\\\":true,\\\"no_parties\\\":true,\\\"no_events\\\":false,\\\"pets_allowed\\\":true,\\\"pets_approval_required\\\":false,\\\"quiet_hours\\\":\\\"10:00 PM - 8:00 AM\\\",\\\"additional_rules\\\":[]}\"', '\"{\\\"policy_type\\\":\\\"Flexible\\\",\\\"free_cancellation_hours\\\":48,\\\"free_cancellation_text\\\":\\\"Free cancellation for 48 hours after booking\\\",\\\"partial_refund_days\\\":7,\\\"partial_refund_percentage\\\":50,\\\"partial_refund_text\\\":\\\"Cancel up to 7 days before check-in for a 50% refund\\\",\\\"no_refund_text\\\":\\\"Cancellations within 7 days are non-refundable\\\",\\\"cleaning_fee_refundable\\\":true,\\\"service_fee_refundable_hours\\\":48,\\\"notes\\\":\\\"\\\"}\"', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', NULL, NULL, NULL, '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-4183852f-cd6a-4f98-9e01-8111072a9b50.webp\"]', 0.00, 0, 'pending_approval', '2026-03-28 15:55:39', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=18.7533,73.4069', 'none', 'none', 0, 0, NULL),
('43fbca17-da17-419f-b72a-f2d44d1caf5f', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', 'Karnataka', NULL, 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '', '', '', '', '', '', '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-2f442099-c9cc-4d22-93ba-c021ee67e08f.webp\",\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-434c0d40-8547-451b-b78e-1e634d37ae1c.webp\"]', 0.00, 0, 'approved', '2026-03-19 10:23:05', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 5, '2026-03-19 12:21:11', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL),
('495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Compact 1BHK Service Apartment - Andheri East', 'Cozy 1BHK service apartment near Andheri East metro station, perfect for solo professionals.', '789 Chakala Road, Andheri East', 'Andheri East', 'Maharashtra', '400093', 1, 1, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li><li><strong>Reception Desk:</strong> For immediate assistance</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Metro/bus station within walking distance</li><li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li><li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li><li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li><li><strong>ATM:</strong> Banking services available nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Extinguisher:</strong> Located near main entrance</li><li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li><li><strong>Emergency Exits:</strong> Clearly marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel on premises</li><li><strong>CCTV:</strong> Common areas under surveillance</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li><li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li><li><strong>Laundry:</strong> Washing machine available in unit or common area</li><li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li><li><strong>TV &amp; Entertainment:</strong> Smart TV with streaming services</li><li><strong>Housekeeping:</strong> Regular cleaning service included</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>No loud music or parties</li><li>Maximum guests as per booking confirmation</li><li>Pets not allowed unless specified</li><li>Visitors allowed between 9:00 AM - 9:00 PM only</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li><li><strong>Key Collection:</strong> Keys available at reception with valid ID</li><li><strong>Parking:</strong> Designated parking slots available</li></ul>', '[\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 3, 180, 'weekly', 'weekly', 1, 0, 8, 100, 'Hathway Broadband', 'fully_furnished', 1, 2, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.1136,72.8697', 'none', 'none', 0, 0, NULL),
('495cf369-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Premium 2BHK Service Apartment - BKC', 'Luxury 2BHK in Bandra Kurla Complex with stunning city views. Perfect for corporate executives.', '101 Peninsula Tower, BKC', 'BKC', 'Maharashtra', '400051', 2, 2, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li><li><strong>Reception Desk:</strong> For immediate assistance</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Metro/bus station within walking distance</li><li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li><li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li><li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li><li><strong>ATM:</strong> Banking services available nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Extinguisher:</strong> Located near main entrance</li><li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li><li><strong>Emergency Exits:</strong> Clearly marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel on premises</li><li><strong>CCTV:</strong> Common areas under surveillance</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li><li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li><li><strong>Laundry:</strong> Washing machine available in unit or common area</li><li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li><li><strong>TV &amp; Entertainment:</strong> Smart TV with streaming services</li><li><strong>Housekeeping:</strong> Regular cleaning service included</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>No loud music or parties</li><li>Maximum guests as per booking confirmation</li><li>Pets not allowed unless specified</li><li>Visitors allowed between 9:00 AM - 9:00 PM only</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li><li><strong>Key Collection:</strong> Keys available at reception with valid ID</li><li><strong>Parking:</strong> Designated parking slots available</li></ul>', '[\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185127-6a4e3ab5c2e1?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687664-6bece1f7a565?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 18, 200, 'Jio Fiber', 'fully_furnished', 1, 1, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.0596,72.8656', 'none', 'none', 0, 0, NULL),
('6976d478-d48f-4f32-814a-3a14b86f6dab', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'TEST Vendor Villa 1775292205841', 'Test vendor property', '456 Vendor St', NULL, NULL, NULL, 2, 1, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 08:43:25', '2026-04-04 08:43:25', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('83feec7d-16d8-4d83-931d-290b0f729a02', NULL, NULL, NULL, 'TEST Admin EDITED', NULL, NULL, NULL, NULL, NULL, 0, 0, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '', '', '', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 08:44:08', '2026-04-04 08:44:08', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('ad4a2bea-3e21-4761-abc6-520846aba0ab', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa 1774160542970', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-22 06:22:22', '2026-03-29 14:25:24', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Beach Villa - Goa', 'Stunning 4BHK beachfront villa with private pool, modern amenities, breathtaking ocean views, and newly added jacuzzi. Perfect for families and groups.', 'Candolim Beach Road', 'Candolim', 'Goa', '403515', 4, 4, 1, 10, 0, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Please remove shoes inside the villa\", \"Maintain cleanliness in pool area\", \"No loud music after 10 PM\"]}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Service fees are refundable if cancelled within 48 hours of booking\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200\",\r\n\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200\",\r\n\"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 3, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5183,73.7615', 'none', 'none', 0, 0, NULL),
('bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Hill View Villa with Hot Tub - Lonavala', 'Beautiful 3BHK villa with valley views, private garden, and bonfire area. Close to major attractions like Tiger Point and Bhushi Dam.', 'Tiger Point Road', 'Tiger Point', 'Maharashtra', '410401', 3, 3, 1, 8, 1, 45, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":true,\"pets_approval_required\":true,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li><li><strong>On-site Caretaker:</strong> For immediate assistance</li><li><strong>Security:</strong> 24/7 monitoring service</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li><li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li></ul>', '<h3>Local Area &amp; Attractions</h3><ul><li><strong>Nearest Town:</strong> 10-15 minutes drive</li><li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li><li><strong>Dining:</strong> Fine dining and local restaurants nearby</li><li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li><li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li><li><strong>Activities:</strong> Contact property manager for local experiences and tours</li></ul>', '<h3>Safety &amp; Security</h3><ul><li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li><li><strong>Secure Gates:</strong> Auto-lock gates with security code</li><li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li><li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li><li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li><li><strong>Emergency Lighting:</strong> Backup power for essential lights</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li><li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li><li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li><li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li><li><strong>WiFi:</strong> High-speed internet throughout the property</li><li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li><li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li><li><strong>Laundry:</strong> Washer and dryer available</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the villa (outdoor areas designated)</li><li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li><li>Maximum guest capacity strictly enforced</li><li>Events or parties require prior written approval</li><li>Pets allowed only with prior approval and additional deposit</li><li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li><li>BBQ area usage requires permission</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Property manager will meet you at the villa</li><li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li><li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li><li><strong>Parking:</strong> Private parking available on premises</li><li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li></ul>', '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-b63059eb-fc58-4a5f-b8a5-efe284e96679.webp\"]', 4.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 4, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=18.7533,73.4069', 'none', 'none', 0, 0, NULL),
('c1330aa4-9670-4988-8b88-8b69e0c15af0', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', NULL, NULL, 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-19 10:18:05', '2026-03-19 10:25:28', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL),
('e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa UPDATED 1774156120081', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-22 05:08:39', '2026-03-22 05:08:40', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL),
('f5669fb7-392a-414e-b24c-6865dea64def', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', NULL, NULL, 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-19 10:18:33', '2026-03-19 10:25:22', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `properties_with_pricing`
-- (See below for the actual view)
--
CREATE TABLE `properties_with_pricing` (
`id` char(36)
,`vendor_id` char(36)
,`title` varchar(200)
,`description` text
,`address` varchar(255)
,`city` varchar(100)
,`area` varchar(100)
,`state` varchar(100)
,`pincode` varchar(10)
,`bedrooms` int(11)
,`bathrooms` int(11)
,`max_guests` int(11)
,`check_in_time` varchar(50)
,`check_out_time` varchar(50)
,`min_stay_days` int(11)
,`max_stay_days` int(11)
,`photos` text
,`rating` decimal(3,2)
,`reviews_count` int(11)
,`status` enum('draft','pending_approval','approved','inactive')
,`created_at` timestamp
,`city_id` char(36)
,`property_type_id` char(36)
,`property_type` varchar(100)
,`stay_type` enum('short_term','long_term','hybrid')
,`price_per_night` decimal(12,2)
,`gst_percentage` decimal(5,2)
,`pricing_min_guests` int(10) unsigned
,`extra_guest_charge` decimal(10,2)
,`weekly_discount_percent` decimal(5,2)
,`monthly_discount_percent` decimal(5,2)
,`quarterly_discount_percent` decimal(5,2)
,`long_term_discount_percent` decimal(5,2)
,`allow_corporate_booking` tinyint(1)
,`corporate_discount_percent` int(11)
,`deposit_amount` decimal(12,2)
,`maintenance_charges` decimal(10,2)
,`amenities_list` mediumtext
,`amenity_ids` mediumtext
,`features_list` mediumtext
,`feature_ids` mediumtext
);

-- --------------------------------------------------------

--
-- Table structure for table `property_amenities`
--

CREATE TABLE `property_amenities` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `amenity_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_amenities`
--

INSERT INTO `property_amenities` (`id`, `property_id`, `amenity_id`, `created_at`, `updated_at`) VALUES
('086cc381-4687-4cf5-b813-f8eb0d60a3fa', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:16:35', '2026-03-28 10:16:35'),
('2d50ecef-8ca2-40df-b809-dd5442c79219', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:16:35', '2026-03-28 10:16:35'),
('32f46f7f-50f7-4715-96fb-9a3a4ff99365', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('45d1de94-1fcc-43f6-a097-447f01b65e7a', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:47:21', '2026-03-28 15:47:21'),
('5904de5a-fea7-4bce-8b51-811a4433d50b', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('60f1c168-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 15:23:10', '2026-03-12 15:23:10'),
('60f21989-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 15:23:10', '2026-03-12 15:23:10'),
('60f2681d-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 15:23:10', '2026-03-12 15:23:10'),
('60f2c058-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 15:23:10', '2026-03-12 15:23:10'),
('649ea06f-e01e-49a4-b9df-612b7ab4122e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:47:21', '2026-03-28 15:47:21'),
('86c9ccd1-63a4-426e-b25c-67c7233bc470', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('908f29e9-0371-475c-b018-075e61eba2b0', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('b19ea256-0637-4f9d-af5d-13b5d044f822', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('b2d08b8b-c570-4937-9f2c-0723888ff9bf', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('b74e417c-965c-4e6e-b9a1-bd8b33919e1d', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('d4470d90-c5a3-4a76-9d39-7b040bbc35fb', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:16:35', '2026-03-28 10:16:35'),
('d82b42ab-8b72-4e5e-bc5b-48513c35c7b9', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:16:35', '2026-03-28 10:16:35'),
('da5dd951-282f-4474-90de-0549480a78da', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:47:21', '2026-03-28 15:47:21'),
('db356b0c-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 16:09:32', '2026-03-12 16:09:32'),
('db35c56d-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 16:09:32', '2026-03-12 16:09:32'),
('db3629e8-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 16:09:32', '2026-03-12 16:09:32'),
('db36ee9d-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 16:09:32', '2026-03-12 16:09:32'),
('e4ffa366-c8e1-45e6-8765-1da0c276aff3', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:47:21', '2026-03-28 15:47:21'),
('f61ed349-613d-44c5-b793-d886719e0def', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:47:21', '2026-03-28 15:47:21'),
('f656215b-3bcd-4468-b6f4-0cf67385df7e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 15:55:39', '2026-03-28 15:55:39'),
('fbdcb2ae-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdd0c0d-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdd5655-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbddadb5-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbde4295-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdebc79-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bba14-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdf26c3-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdf84c6-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbdfe89c-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbe03a45-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22'),
('fbe081a9-2381-11f1-9397-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-19 10:54:22', '2026-03-19 10:54:22');

-- --------------------------------------------------------

--
-- Table structure for table `property_blackout_dates`
--

CREATE TABLE `property_blackout_dates` (
  `id` char(36) NOT NULL,
  `property_id` char(36) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `created_by` enum('admin','vendor') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_blackout_dates`
--

INSERT INTO `property_blackout_dates` (`id`, `property_id`, `start_date`, `end_date`, `reason`, `created_by`, `created_at`) VALUES
('a0f4199a-c5f4-4038-8253-d5b9704a7051', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-27', '2026-03-28', NULL, 'vendor', '2026-03-19 15:21:09'),
('blackout-002', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-05-10', '2026-05-15', 'Owner personal use', 'vendor', '2026-01-07 05:30:00'),
('blackout-003', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-07-01', '2026-07-10', 'Monsoon maintenance', 'admin', '2026-01-08 03:30:00'),
('f6d4c7cc-2784-4960-ba75-cfe4cf125b25', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-30', '2026-03-31', NULL, 'vendor', '2026-03-19 15:21:02');

-- --------------------------------------------------------

--
-- Table structure for table `property_calendar_pricing`
--

CREATE TABLE `property_calendar_pricing` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `price_date` date NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL COMMENT 'admin or vendor id who set the price',
  `created_by_role` enum('admin','vendor') DEFAULT 'vendor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_calendar_pricing`
--

INSERT INTO `property_calendar_pricing` (`id`, `property_id`, `price_date`, `price`, `note`, `created_by`, `created_by_role`, `created_at`, `updated_at`) VALUES
('12a3476f-4c9e-4724-a2c3-65c516d8641b', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-21', 10000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 10:23:10', '2026-03-19 10:23:10'),
('398c4c80-51bd-4494-8f16-6e7e5d8fffc6', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '2026-03-28', 12000.00, NULL, 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-03-28 15:55:41', '2026-03-28 15:55:41'),
('483e9266-8488-4445-91bc-aa40557404e7', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-31', 8000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 10:23:10', '2026-03-19 10:23:10'),
('853bff19-98d6-43e8-953d-5263cb64ad71', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-22', 11000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 10:23:10', '2026-03-19 10:23:10'),
('9bcd3e72-c3a5-41a8-9174-436091efbcef', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-05', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15'),
('be0b7fa4-b2d4-45d9-aed2-e564911468e1', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-23', 12000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 10:23:10', '2026-03-19 10:23:10'),
('c164bfeb-3d34-4095-b621-aad13b801526', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-03', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15'),
('cf91fa22-85e0-485f-aa42-c6a861a353f4', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15'),
('f6d89c92-1ab3-44eb-beaa-876cfe03b942', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '2026-03-31', 14000.00, NULL, 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-03-28 15:55:41', '2026-03-28 15:55:41');

-- --------------------------------------------------------

--
-- Table structure for table `property_change_requests`
--

CREATE TABLE `property_change_requests` (
  `id` char(36) NOT NULL,
  `property_id` char(36) DEFAULT NULL,
  `requested_changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requested_changes`)),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_change_requests`
--

INSERT INTO `property_change_requests` (`id`, `property_id`, `requested_changes`, `status`, `reviewed_by`, `created_at`, `reviewed_at`) VALUES
('0552ba50-d498-45b2-9380-eaba9376aec9', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\":13000,\"amenities\":[\"5c1b9238-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb300-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bc112-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb716-f3e6-11f0-8f27-00410e2b5e6e\"]}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-03-28 15:19:39', '2026-03-28 15:47:21');

-- --------------------------------------------------------

--
-- Table structure for table `property_contacts`
--

CREATE TABLE `property_contacts` (
  `id` int(11) NOT NULL,
  `property_id` char(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `contact_type_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `alt_contact` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_contacts`
--

INSERT INTO `property_contacts` (`id`, `property_id`, `contact_type_id`, `name`, `phone`, `email`, `whatsapp`, `alt_contact`, `is_active`, `created_at`, `updated_at`) VALUES
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Ranjith (Property Owner)', '+919945554414', 'ranjithgopafy@gmail.com', '+919945554414', NULL, 1, '2026-01-18 10:33:42', '2026-03-05 16:48:34'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(7, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 1, 'Rajesh Kumar', '+919876543210', 'rajesh.kumar@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(8, 'bb929607-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(9, 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(11, 'bb974859-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(12, 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(13, 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(14, 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(15, 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(16, 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(17, 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(32, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(33, 'bb929607-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(34, 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(35, 'bb974859-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(36, 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(37, 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(38, 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(39, 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(40, 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(41, 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(43, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, 'Ranjith (Property Owner)', '+919945554414', 'ranjithgopafy@gmail.com', '+919945554414', NULL, 1, '2026-03-05 16:48:34', '2026-03-05 16:48:34'),
(44, 'c1330aa4-9670-4988-8b88-8b69e0c15af0', 1, 'Zevio', NULL, 'zevio@z.com', '9876543210', NULL, 1, '2026-03-19 10:18:05', '2026-03-19 10:18:05'),
(45, 'f5669fb7-392a-414e-b24c-6865dea64def', 1, 'Zevio', NULL, 'zevio@z.com', '9876543210', NULL, 1, '2026-03-19 10:18:33', '2026-03-19 10:18:33'),
(47, 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 1, 'Test Host', '9876543210', 'host@test.com', NULL, NULL, 1, '2026-03-22 05:08:39', '2026-03-22 05:08:39'),
(48, '085785eb-9d0e-45e9-b5ed-a333a67cfe20', 1, 'Test Host', '9876543210', 'host@test.com', '9876543210', NULL, 1, '2026-03-22 05:17:20', '2026-03-22 05:17:20'),
(49, 'ad4a2bea-3e21-4761-abc6-520846aba0ab', 1, 'Test Host', '9876543210', 'host@test.com', '9876543210', NULL, 1, '2026-03-22 06:22:22', '2026-03-22 06:22:22'),
(50, '40bb16f7-bba7-4b3d-88c6-932bdebfd384', 1, 'Zevio', '9876543210', 'zevio@z.com', NULL, NULL, 1, '2026-03-28 15:55:39', '2026-03-28 15:55:39');

-- --------------------------------------------------------

--
-- Table structure for table `property_features`
--

CREATE TABLE `property_features` (
  `id` int(11) NOT NULL,
  `property_id` char(36) NOT NULL,
  `feature_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_features`
--

INSERT INTO `property_features` (`id`, `property_id`, `feature_id`, `created_at`, `updated_at`) VALUES
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(9, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 2, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(13, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(14, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(20, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(27, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(34, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(35, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(41, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(42, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(48, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(49, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16');

-- --------------------------------------------------------

--
-- Table structure for table `property_guidelines`
--

CREATE TABLE `property_guidelines` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `check_in_guidelines` text DEFAULT NULL,
  `house_rules_text` text DEFAULT NULL,
  `amenities_guide` text DEFAULT NULL,
  `safety_information` text DEFAULT NULL,
  `local_area_info` text DEFAULT NULL,
  `emergency_contacts` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_guidelines`
--

INSERT INTO `property_guidelines` (`id`, `property_id`, `check_in_guidelines`, `house_rules_text`, `amenities_guide`, `safety_information`, `local_area_info`, `emergency_contacts`, `created_at`, `updated_at`) VALUES
('6e9b75d9-d51b-460b-91ab-75b922d61d32', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '<h3>Check-In Guidelines</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Keys will be handed over by our property manager at the villa</li><li><strong>ID Proof:</strong> Please carry a valid government-issued ID</li><li><strong>Parking:</strong> Designated parking available on premises</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the villa</li><li>Parties and events require prior approval</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>Please respect the neighbors</li><li>Maximum occupancy must be maintained</li><li>Pets allowed with prior approval</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> Network name and password will be provided at check-in</li><li><strong>Air Conditioning:</strong> Remote controls available in all bedrooms</li><li><strong>Kitchen:</strong> Fully equipped with basic utensils, gas stove, microwave, and refrigerator</li><li><strong>Swimming Pool:</strong> Pool usage hours 7:00 AM - 8:00 PM. Children must be supervised</li><li><strong>TV:</strong> Smart TV with streaming services access</li><li><strong>Washing Machine:</strong> Available in utility area</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '2026-03-19 10:23:05', '2026-03-19 10:23:05'),
('c2a5dce2-8168-41c9-8b7a-77bb14a99579', '3a2534cc-ffe4-414e-a761-764fce5be3bb', NULL, NULL, NULL, '', '', '', '2026-04-04 08:43:25', '2026-04-04 08:43:25'),
('e7afe123-e295-4d31-90bd-7edf5f53cfc2', '83feec7d-16d8-4d83-931d-290b0f729a02', NULL, NULL, NULL, '', '', '', '2026-04-04 08:44:08', '2026-04-04 08:44:08');

-- --------------------------------------------------------

--
-- Table structure for table `property_guides`
--

CREATE TABLE `property_guides` (
  `id` int(11) NOT NULL,
  `property_id` char(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `guide_type_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `language` varchar(5) DEFAULT 'en',
  `version` int(11) DEFAULT 1,
  `is_default_template` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_guides`
--

INSERT INTO `property_guides` (`id`, `property_id`, `guide_type_id`, `title`, `content`, `language`, `version`, `is_default_template`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, NULL, 1, 'Check-in Guidelines', '**Check-in Time:** As per property details\n**Check-out Time:** As per property details\n\n**Steps:**\n1. Contact property manager 1 hour before arrival\n2. Verify booking confirmation\n3. Complete check-in formalities\n4. Receive keys and property tour\n\n**Documents Required:**\n- Valid Government ID\n- Booking confirmation\n- Security deposit (if applicable)', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(2, NULL, 2, 'House Rules', '**General Rules:**\n- No smoking inside the property\n- No pets allowed (unless specified)\n- No parties or loud music after 10 PM\n- Maintain cleanliness\n\n**Guest Policy:**\n- Visitors allowed only with prior permission\n- Maximum occupancy as per booking\n\n**Damage Policy:**\n- Report any damages immediately\n- Charges apply for unreported damages', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(3, NULL, 3, 'Amenities Guide', '**How to Use Amenities:**\n\n**WiFi:**\n- Network name and password provided at check-in\n\n**Kitchen:**\n- Basic utensils provided\n- Please clean after use\n\n**Laundry:**\n- Washing machine available (if applicable)\n- Detergent may not be provided\n\n**Parking:**\n- Designated parking area\n- Register vehicle details at reception', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(4, NULL, 4, 'Safety Information', '**Safety Measures:**\n\n**Fire Safety:**\n- Fire extinguisher location: [To be specified]\n- Emergency exits clearly marked\n\n**Security:**\n- Keep doors locked at all times\n- Do not share keys or access codes\n- Security cameras in common areas\n\n**First Aid:**\n- First aid kit available at reception\n- Emergency medical services: 108', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(5, NULL, 5, 'Local Area Information', '**Nearby Services:**\n\n**Restaurants:**\n- Multiple dining options within 1-2 km\n\n**Grocery Stores:**\n- Supermarket nearby\n\n**Transportation:**\n- Metro/Bus station accessible\n- Cab services: Uber, Ola available\n\n**ATMs:**\n- ATMs available within walking distance\n\n**Pharmacies:**\n- Medical stores nearby', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(6, NULL, 6, 'Emergency Contacts', '**Emergency Numbers:**\n\n**National Emergency:**\n- Police: 100\n- Ambulance: 108\n- Fire: 101\n\n**Property Emergency Contacts:**\n- Property Manager: [Contact from property_contacts table]\n- Security: [If available]\n\n**Utilities:**\n- Electricity Board: [Local number]\n- Water Supply: [Local number]\n\n**24/7 Support:**\n- Zevio Support: [Your support number]', 'en', 1, 1, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(7, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 1, 'Check-in Guidelines', '<h3>Check-In Process</h3><ul><li><strong>Time:</strong> 2:00 PM onwards</li><li><strong>Key Collection:</strong> Meet property manager at gate</li><li><strong>ID Proof:</strong> Carry valid government ID (Aadhar/Passport)</li><li><strong>Parking:</strong> Free covered parking available for 2 vehicles</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(8, 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 1, 'Check-in Guidelines', '<h3>Check-In Process</h3><ul><li><strong>Time:</strong> 12:00 PM onwards</li><li><strong>Key Collection:</strong> Self check-in via digital lock (code sent 24h before)</li><li><strong>Parking:</strong> Free parking for 3 vehicles</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(10, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 2, 'House Rules', '<h3>House Rules</h3><ul><li>? No smoking inside the property</li><li>? No loud parties after 10 PM</li><li>? Pets not allowed</li><li>? Maximum guests: As per booking</li><li>? Quiet hours: 10 PM - 8 AM</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(11, 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 2, 'House Rules', '<h3>House Rules</h3><ul><li>? No smoking</li><li>? No parties</li><li>? Pets allowed (small dogs only)</li><li>? Quiet hours: 11 PM - 7 AM</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(13, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 3, 'Amenities Guide', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> Password - ZevioVilla@123</li><li><strong>AC:</strong> Remote controls in all bedrooms</li><li><strong>Kitchen:</strong> Fully equipped - gas stove, microwave, refrigerator</li><li><strong>TV:</strong> Smart TV with Netflix, Prime Video</li><li><strong>Washing Machine:</strong> Available in utility area</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(14, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 4, 'Safety Information', '<h3>Safety Information</h3><ul><li>? Fire extinguisher: Near main entrance</li><li>? First aid kit: Under kitchen sink</li><li>? Emergency exits: Main door + balcony door</li><li>? Power backup: Available during outages</li><li>? Security: CCTV cameras in common areas</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(15, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 5, 'Local Area Information', '<h3>Nearby Places</h3><ul><li>?? <strong>Restaurants:</strong> Beach Shack (500m), Taj Restaurant (1km)</li><li>? <strong>Grocery:</strong> D-Mart (2km), Local Market (800m)</li><li>? <strong>Hospital:</strong> Apollo Clinic (3km)</li><li>?? <strong>Beach:</strong> Baga Beach (1.5km), Calangute Beach (2km)</li><li>? <strong>ATM:</strong> HDFC ATM (500m)</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL),
(16, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 6, 'Emergency Contacts', '<h3>Emergency Contacts</h3><ul><li>? <strong>Police:</strong> 100</li><li>? <strong>Ambulance:</strong> 108</li><li>? <strong>Fire Brigade:</strong> 101</li><li>? <strong>Property Manager:</strong> +919876543210 (Rajesh)</li><li>? <strong>Nearest Hospital:</strong> Apollo Clinic - +918322123456</li></ul>', 'en', 1, 0, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `property_images`
--

CREATE TABLE `property_images` (
  `id` char(36) NOT NULL,
  `property_id` char(36) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_images`
--

INSERT INTO `property_images` (`id`, `property_id`, `image_url`, `sort_order`) VALUES
('bbb54782-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800', 1),
('bbb5647f-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 2),
('bbb5666e-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 3),
('fa88e95a-6a29-429c-b15d-b51b1d95498c', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', 'https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-4183852f-cd6a-4f98-9e01-8111072a9b50.webp', 1);

-- --------------------------------------------------------

--
-- Table structure for table `property_locations`
--

CREATE TABLE `property_locations` (
  `id` int(11) NOT NULL,
  `property_id` char(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `location_type_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `distance_km` decimal(5,2) DEFAULT NULL,
  `travel_time_mins` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_locations`
--

INSERT INTO `property_locations` (`id`, `property_id`, `location_type_id`, `name`, `distance_km`, `travel_time_mins`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, 'Forum Mall Metro', 2.50, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Baiyappanahalli Metro', 5.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, 'Andheri East Metro', 0.50, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, 'BKC Metro', 1.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, 'Rajiv Chowk Metro', 0.30, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, 'Cyber City Metro', 1.20, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(8, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (8.50 km)', 8.50, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(9, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (15.00 km)', 15.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(10, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (2.00 km)', 2.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(11, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (5.00 km)', 5.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(12, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (18.00 km)', 18.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(13, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (12.00 km)', 12.00, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(15, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 5, 'Koramangala IT Parks', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(16, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 5, 'Prestige Tech Park, ITPL', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(17, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 5, 'BKC, Powai IT Parks', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(18, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 5, 'BKC Business District', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(19, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 5, 'Connaught Place Business District', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(20, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 5, 'DLF Cyber City, Udyog Vihar', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `property_pricing`
--

CREATE TABLE `property_pricing` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `price_per_night` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gst_percentage` decimal(5,2) DEFAULT 18.00,
  `min_guests` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `extra_guest_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `min_children` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `max_children` int(10) UNSIGNED NOT NULL DEFAULT 5,
  `extra_child_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `weekly_discount_percent` decimal(5,2) DEFAULT 15.00,
  `monthly_discount_percent` decimal(5,2) DEFAULT 25.00,
  `quarterly_discount_percent` decimal(5,2) DEFAULT 30.00,
  `long_term_discount_percent` decimal(5,2) DEFAULT 35.00,
  `allow_corporate_booking` tinyint(1) DEFAULT 0,
  `corporate_discount_percent` int(11) DEFAULT 20,
  `deposit_amount` decimal(12,2) DEFAULT NULL,
  `maintenance_charges` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `discount_3_5_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 3-5 night bookings',
  `discount_6_14_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 6-14 night bookings',
  `discount_15_plus_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 15+ night bookings'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_pricing`
--

INSERT INTO `property_pricing` (`id`, `property_id`, `price_per_night`, `gst_percentage`, `min_guests`, `extra_guest_charge`, `min_children`, `max_children`, `extra_child_charge`, `weekly_discount_percent`, `monthly_discount_percent`, `quarterly_discount_percent`, `long_term_discount_percent`, `allow_corporate_booking`, `corporate_discount_percent`, `deposit_amount`, `maintenance_charges`, `created_at`, `updated_at`, `discount_3_5_days`, `discount_6_14_days`, `discount_15_plus_days`) VALUES
('1f632c81-f19e-4f6c-9d51-8501da0ca091', '085785eb-9d0e-45e9-b5ed-a333a67cfe20', 12000.00, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-22 05:17:20', '2026-03-22 05:17:20', 0.00, 0.00, 0.00),
('2eb9f260-1a1b-4071-a7b6-47398401b862', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', 10000.00, 18.00, 2, 6.00, 2, 5, 3000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, '2026-03-28 15:55:39', '2026-03-28 15:55:39', 0.00, 0.00, 0.00),
('4c66165f-08f0-4daa-a7a6-e375a5d1be0b', 'ad4a2bea-3e21-4761-abc6-520846aba0ab', 12000.00, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-22 06:22:22', '2026-03-22 06:22:22', 0.00, 0.00, 0.00),
('5a0ab12a-e92f-40b6-b22e-57e75ed97985', '14821022-3028-4e3e-aa5e-3e5116ff9e36', 3500.00, 18.00, 1, 300.00, 0, 2, 100.00, 8.00, 15.00, 20.00, 25.00, 0, 0, NULL, 500.00, '2026-04-04 08:44:08', '2026-04-04 08:44:08', 0.00, 0.00, 0.00),
('874e1b76-1df5-4de0-a943-d14eb2aface4', 'c1330aa4-9670-4988-8b88-8b69e0c15af0', 9000.00, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 10:18:05', '2026-03-19 10:18:05', 10.00, 20.00, 30.00),
('aef29fdf-7800-431a-a900-1d640a905624', '43fbca17-da17-419f-b72a-f2d44d1caf5f', 9000.00, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 10:23:05', '2026-03-19 10:23:05', 10.00, 20.00, 30.00),
('d3662465-127f-489a-a3a7-e21bc5a63f84', '83feec7d-16d8-4d83-931d-290b0f729a02', 6000.00, 18.00, 1, 0.00, 0, 5, 0.00, 12.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-04 08:44:08', '2026-04-04 08:44:08', 0.00, 0.00, 0.00),
('e0794143-2d1e-4d1e-b0f6-f0a7e825b9dc', 'f5669fb7-392a-414e-b24c-6865dea64def', 9000.00, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 10:18:33', '2026-03-19 10:18:33', 10.00, 20.00, 30.00),
('e15f93c0-1d7a-4384-ad17-7cefbc4fe6cc', '6976d478-d48f-4f32-814a-3a14b86f6dab', 3000.00, 18.00, 1, 300.00, 0, 2, 100.00, 8.00, 15.00, 20.00, 25.00, 0, 0, NULL, 500.00, '2026-04-04 08:43:25', '2026-04-04 08:43:25', 0.00, 0.00, 0.00),
('ed2eaf23-f3e4-11f0-8f27-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2800.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 18, 8000.00, 0.00, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb07c-f3e4-11f0-8f27-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 22, 25000.00, 0.00, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb451-f3e4-11f0-8f27-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 16000.00, 18.00, 4, 1500.00, 0, 4, 800.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, '2025-12-28 18:12:12', '2026-03-28 10:16:35', 0.00, 0.00, 0.00),
('ed2eb8bc-f3e4-11f0-8f27-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 13000.00, 18.00, 6, 1200.00, 0, 6, 600.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2025-12-28 18:12:12', '2026-03-28 15:47:21', 0.00, 0.00, 0.00),
('f3423988-806b-46de-bf78-f7d8d94e5016', 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 12000.00, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-22 05:08:39', '2026-03-22 05:08:39', 0.00, 0.00, 0.00),
('faff2b11-71bf-459b-9773-8507b864fde7', '3a2534cc-ffe4-414e-a761-764fce5be3bb', 6000.00, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-04 08:43:25', '2026-04-04 08:43:25', 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `property_types`
--

CREATE TABLE `property_types` (
  `id` char(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Display name: Villa, Service Apartment, Cottage, etc.',
  `slug` varchar(100) NOT NULL COMMENT 'URL-friendly slug: villa, service-apartment, cottage',
  `stay_type` enum('short_term','long_term','hybrid') NOT NULL COMMENT 'Primary stay duration type',
  `icon` varchar(50) DEFAULT NULL COMMENT 'Icon name for UI: FiHome, FiBuilding, etc.',
  `description` text DEFAULT NULL COMMENT 'Property type description',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Active status',
  `sort_order` int(11) DEFAULT 0 COMMENT 'Display order (lower = first)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_types`
--

INSERT INTO `property_types` (`id`, `name`, `slug`, `stay_type`, `icon`, `description`, `is_active`, `sort_order`, `created_at`) VALUES
('pt-001', 'Villa', 'villa', 'short_term', 'FiHome', 'Luxury vacation villas for short-term stays', 1, 1, '2026-01-16 20:55:59'),
('pt-002', 'Service Apartment', 'service-apartment', 'long_term', 'FiBuilding', 'Fully serviced apartments for extended stays (7-180 days)', 1, 2, '2026-01-16 20:55:59');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_table` varchar(20) NOT NULL,
  `token_hash` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `user_table`, `token_hash`, `expires_at`, `created_at`) VALUES
('05e3b3e4-c829-4364-8d20-b6fa25f78691', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '72f8131f7edfbeb3f600148d09b9334f90d949d3cb8af91d555150012b69adca', '2026-04-11 13:14:38', '2026-04-04 07:44:38'),
('072dc1e7-6b64-4c49-8006-21c6c1af04d8', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'd87cd89e2529df545162278fafa49f44160c13b66b9d6de596d54a938e25f805', '2026-04-11 14:11:41', '2026-04-04 08:41:41'),
('10d5cc52-8fc8-4b2f-ab0b-d354d2e75325', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6e62b0631ab7435f0f272df6ad46fba273fe27de8123e07543ed86c87fd9d8d1', '2026-04-11 14:11:18', '2026-04-04 08:41:18'),
('231a98c2-4abb-4891-b341-400329f74b37', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2ee6e3b31ec2f3d08ff436b17b5d4502b3120aa65a3a73ba5eb859c52623a520', '2026-04-11 14:12:31', '2026-04-04 08:42:31'),
('23e8ba96-3524-447a-a417-6fca5a29b979', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '7ccfd1ad913c3ccafc946d235dd8e9cfe1233e626bde905d79111f5f2b18d56b', '2026-04-11 13:10:28', '2026-04-04 07:40:28'),
('2a7d01f0-5e87-4c9e-8564-df481f3edbce', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0b2b26558d8969dfce0e2dec1e395ae4c34a899cf1959b60f03dddb496ce8ae2', '2026-04-10 23:06:15', '2026-04-03 17:36:15'),
('34dead54-5fe5-4c85-a0ab-9a3af1af98be', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'e3a2dd4abf3e6f40e07d3ed74be2bef5a1f484666c1cf04931880ca007ef9e57', '2026-04-13 00:02:33', '2026-04-05 18:32:33'),
('34fca948-3414-428f-a8bf-04f0c23d803b', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '8a3bad7d01497f620bd43915193cec0a9ce733e6d1cf7ffb64ef3c958e50f7ac', '2026-04-11 13:09:02', '2026-04-04 07:39:02'),
('3d209357-07b2-4c8b-b1b9-876803f35b75', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'ce729b72451e57ec86c881c078fe8e23b8f4c85d429fd73e56b9e799279a3779', '2026-04-11 13:14:00', '2026-04-04 07:44:00'),
('5227895a-5012-48f9-a111-edfae6a788bd', '043ef643-2e5b-4358-a651-9d1764511169', 'users', 'bbca4ea4082d6469b9712807b8fd5e828d2dee6192463c7c5f0712a6c25fd84b', '2026-04-13 01:09:19', '2026-04-05 19:39:19'),
('58a5cb7c-0f28-4863-9925-8a698cd9de96', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '910d8ffe31774a9641cb9fbd51c47dadbe4b71ae72751822969ed106fd789b0a', '2026-04-11 13:16:42', '2026-04-04 07:46:42'),
('5dc3f72b-4a31-4d6e-863c-f929f861cdb9', '043ef643-2e5b-4358-a651-9d1764511169', 'users', '947010d55d979318843f0efe06ed371b3a8e7f349026ef80b92c86f1091c9afe', '2026-04-13 01:03:25', '2026-04-05 19:33:25'),
('61bf47ce-a980-41a0-b4aa-fff725d5863f', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'b1a7c322063bbe1b7d0b9288467b101160fcc728347f32910d89f29cfd653c62', '2026-04-10 23:05:55', '2026-04-03 17:35:55'),
('78986112-9a7e-4d33-8cc2-403baa39d045', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b7118e6156ad15fb6135dd98edb3ffc1fc798e071aac05e33176cd5b5ab86137', '2026-04-11 14:14:08', '2026-04-04 08:44:08'),
('871b400d-c8f9-4adc-a920-da029f0a639a', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '31382ad0ae2932a3826fee83577cb79c996a046dd77b18804ab6c2b1fd251c98', '2026-04-11 13:13:59', '2026-04-04 07:43:59'),
('8f46b386-64f2-4362-9632-4f30a598983d', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '61ecfb83c6186de836de2aee149952a7060a50a562fbc01badfccf555abc3ab4', '2026-04-11 14:13:25', '2026-04-04 08:43:25'),
('a0138df8-9f3f-4927-8988-a92a2ad79e7c', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '76678d5ab266af0802aa646487e7b632c4084d3683f72432e75a41bbef8e0dcc', '2026-04-11 14:14:08', '2026-04-04 08:44:08'),
('af0231c7-e02d-415c-9ea5-86c9a6e83b05', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '597f0dddb87446471bf6229fb372113f5240508d2f371aae2448ad4a4fb5f86c', '2026-04-11 14:11:41', '2026-04-04 08:41:41'),
('b16bb600-b0bb-4930-8fb4-80d1970da6f9', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8d5470c6145a803da3b80cd77cf3674f6810c5f2a9f325ad63a9c94baa4af9de', '2026-04-11 14:12:09', '2026-04-04 08:42:09'),
('b220422b-a0cb-4945-84e4-a67072797863', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'a4801c344fdd2c5a2b2e803f17a6ebc0784ec29caf115424c9ef0baca73f36a0', '2026-04-11 16:32:55', '2026-04-04 11:02:55'),
('b3af4d7c-73cb-4041-beda-3293b4ee7f5b', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', '5589fc2e9aaf637dd1a45d30851bb2add339dcee5349774f6a2926d6233d8cac', '2026-04-12 23:32:00', '2026-04-05 18:02:00'),
('bdc041d5-c8bc-4970-835a-ae7e14a7fba5', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '5dabef61f6d8da4abc4e7ae471595dd160b45c14de2dcb0919e92ffd8da87325', '2026-04-11 21:32:59', '2026-04-04 16:02:59'),
('c0dafbd2-2c10-42b3-bbb6-7636b086a5e6', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '165bc80ec415571eed98e28ba27c132d966340e628b2abff38bdcb60169bfe5e', '2026-04-11 14:13:25', '2026-04-04 08:43:25'),
('d18a8868-12ea-4f8a-b81d-99c82c34f4db', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'a29ec92bc26fe33f2270dde1660ff3ae747120264bac0c166288196ce42ced09', '2026-04-13 01:53:23', '2026-04-05 20:23:23'),
('d1a23945-12dd-4969-ae58-0f1bd9dc1464', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '17089f34cab91fbf27f89f938fd8fac3b8a19b9c9a576b637fa283d9eb001c94', '2026-04-13 02:12:27', '2026-04-05 20:42:27'),
('d7615930-aa23-4069-9493-54bbca5be793', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '398dcccf5950e12bcc4cdcb4e8162e24c2c680db7745a1a68c2c7a52c4a18f2a', '2026-04-11 14:14:22', '2026-04-04 08:44:22'),
('d789ff57-83f2-4b73-b3c2-6fbcee2aab02', '043ef643-2e5b-4358-a651-9d1764511169', 'users', '445353cbfff9c417a0163c3afc0c76e63b47d9397e8ef058147b657981abde2e', '2026-04-13 01:34:02', '2026-04-05 20:04:02'),
('d925caa3-9cf4-4a7b-b544-f036774c034a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6d407e6d745c91dd32972478ea9bd089df047e5692c996b08f1a334d4f3b7c90', '2026-04-11 14:11:55', '2026-04-04 08:41:55'),
('db426c70-6a15-44af-8d16-f5c1a7a36840', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '0af1efc0e82b169a9ec2ffce3e935b2d4f21c71fda3826ffc34ab7058fe8ba65', '2026-04-11 14:12:31', '2026-04-04 08:42:31'),
('ef1c442d-18df-4cdf-b36e-c2a72b7e12eb', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'f02d8b2cfcd9290917e116dcccd5b6ce05185cce3215572d8548fd7e1ee52af3', '2026-04-13 00:47:44', '2026-04-05 19:17:44'),
('f0b12758-4a48-4cd9-a0b2-c0f4a34ec58a', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '36d8dc791587ce130532ffae0310fac28ba86a8aac8021c9e33ba6d4a4960bed', '2026-04-11 13:16:42', '2026-04-04 07:46:42');

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` char(36) NOT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `payment_id` char(36) DEFAULT NULL,
  `refund_percentage` decimal(5,2) DEFAULT NULL,
  `refund_amount` decimal(12,2) DEFAULT NULL,
  `gateway_refund_id` varchar(150) DEFAULT NULL,
  `status` enum('initiated','completed','failed') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL,
  `review_text` text DEFAULT NULL,
  `guest_name` varchar(150) DEFAULT NULL,
  `cleanliness_rating` int(11) DEFAULT NULL,
  `accuracy_rating` int(11) DEFAULT NULL,
  `communication_rating` int(11) DEFAULT NULL,
  `location_rating` int(11) DEFAULT NULL,
  `check_in_rating` int(11) DEFAULT NULL,
  `value_rating` int(11) DEFAULT NULL,
  `overall_rating` decimal(2,1) NOT NULL DEFAULT 0.0,
  `status` enum('pending','published','flagged','removed') DEFAULT 'pending',
  `is_visible` tinyint(1) DEFAULT 0,
  `is_edited_by_admin` tinyint(1) DEFAULT 0,
  `admin_edit_reason` varchar(500) DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `property_id`, `user_id`, `booking_id`, `rating`, `review_text`, `guest_name`, `cleanliness_rating`, `accuracy_rating`, `communication_rating`, `location_rating`, `check_in_rating`, `value_rating`, `overall_rating`, `status`, `is_visible`, `is_edited_by_admin`, `admin_edit_reason`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
('3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 5.00, 'Absolutely stunning beachfront villa! The infinity pool was incredible and the staff were very attentive. Perfect for a family vacation. The rooms were spacious and clean.', NULL, 5, 5, 5, 5, 5, 5, 5.0, 'published', 0, 1, 'Edited by Admin', NULL, NULL, '2025-12-19 12:17:54', '2026-04-04 07:46:37', NULL),
('3b7e499b-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', NULL, 5.00, 'Best vacation rental we have ever stayed at! Everything was exactly as described. The view from the master bedroom was breathtaking. Highly recommend for anyone visiting Goa!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-26 12:17:54', NULL, NULL),
('3b7e4ed5-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', NULL, 4.70, 'Amazing property with great amenities. The beach access was convenient and the kitchen was well-equipped. Would definitely stay again!', NULL, 5, 4, 5, 5, 4, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-31 12:17:54', NULL, NULL),
('review-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'user-test-008', 'booking-test-008', 5.00, 'Absolutely Perfect Villa! This villa exceeded all our expectations. The beach view was stunning, the pool was pristine, and the staff was incredibly helpful. Highly recommend for families!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-29 04:30:00', NULL, NULL),
('review-test-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-002', 4.50, 'Beautiful Valley Views - The villa has stunning valley views and the bonfire area was amazing. Kitchen was well-equipped. Only minor issue was the hot water took some time in the mornings.', NULL, 4, 4, 5, 5, 5, 4, 4.5, 'published', 0, 1, 'Rating', NULL, NULL, '2026-01-05 03:30:00', '2026-02-15 13:44:44', NULL),
('review-test-008', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-002', 'booking-test-012', 2.00, 'This review contains inappropriate content and has been flagged.', NULL, 2, 3, 2, 3, 2, 2, 0.0, 'flagged', 0, 0, NULL, NULL, NULL, '2025-11-19 01:00:00', '2025-11-19 22:30:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reviews_backup_20260110`
--

CREATE TABLE `reviews_backup_20260110` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL,
  `review_text` text DEFAULT NULL,
  `cleanliness_rating` int(11) DEFAULT NULL,
  `accuracy_rating` int(11) DEFAULT NULL,
  `communication_rating` int(11) DEFAULT NULL,
  `location_rating` int(11) DEFAULT NULL,
  `check_in_rating` int(11) DEFAULT NULL,
  `value_rating` int(11) DEFAULT NULL,
  `status` enum('pending','published','flagged','removed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `reviews_backup_20260110`
--

INSERT INTO `reviews_backup_20260110` (`id`, `property_id`, `user_id`, `booking_id`, `rating`, `review_text`, `cleanliness_rating`, `accuracy_rating`, `communication_rating`, `location_rating`, `check_in_rating`, `value_rating`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 4.80, 'Absolutely stunning beachfront villa! The infinity pool was incredible and the staff were very attentive. Perfect for a family vacation. The rooms were spacious and clean.', 5, 5, 5, 5, 4, 5, 'published', '2025-12-19 12:17:54', NULL, NULL),
('3b7e499b-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', NULL, 5.00, 'Best vacation rental we have ever stayed at! Everything was exactly as described. The view from the master bedroom was breathtaking. Highly recommend for anyone visiting Goa!', 5, 5, 5, 5, 5, 5, 'published', '2025-12-26 12:17:54', NULL, NULL),
('3b7e4bbb-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 4.50, 'Cozy and peaceful cottage. Great location near Anjuna Beach. The garden was beautiful and we loved the BBQ area. Perfect for a romantic getaway.', 4, 5, 4, 5, 4, 5, 'published', '2025-12-14 12:17:54', NULL, NULL),
('3b7e4dc8-e89e-11f0-a597-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbd09930-e418-11f0-9f30-00410e2b5e6e', 4.90, 'Luxury at its finest! The jacuzzi, infinity pool, and panoramic views made this stay unforgettable. Highly recommend for special occasions and celebrations.', 5, 5, 5, 5, 5, 4, 'published', '2025-12-29 12:17:54', NULL, NULL),
('3b7e4ed5-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', NULL, 4.70, 'Amazing property with great amenities. The beach access was convenient and the kitchen was well-equipped. Would definitely stay again!', 5, 4, 5, 5, 4, 5, 'published', '2025-12-31 12:17:54', NULL, NULL),
('3b7e4fc9-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553ab0-e418-11f0-9f30-00410e2b5e6e', NULL, 4.60, 'Very nice cottage, perfect for couples. The only downside was the wifi was a bit slow, but overall great experience.', 4, 5, 4, 5, 5, 4, 'published', '2025-12-22 12:17:54', NULL, NULL),
('review-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'user-test-008', 'booking-test-008', 5.00, 'Absolutely Perfect Villa! This villa exceeded all our expectations. The beach view was stunning, the pool was pristine, and the staff was incredibly helpful. Highly recommend for families!', 5, 5, 5, 5, 5, 5, 'published', '2025-12-29 04:30:00', NULL, NULL),
('review-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 4.00, 'Great Location, Peaceful Stay - Lovely cottage in a quiet area. Perfect for couples. WiFi was a bit slow but overall great experience.', 4, 5, 4, 5, 4, 4, 'published', '2025-12-30 05:30:00', NULL, NULL),
('review-test-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bbd09930-e418-11f0-9f30-00410e2b5e6e', 5.00, 'Luxury Redefined - Perfect for Celebrations. We celebrated my parents anniversary here. The infinity pool, jacuzzi, and sea views were absolutely breathtaking. The property manager arranged a beautiful cake and decorations. Will definitely return!', 5, 5, 5, 4, 5, 5, 'published', '2025-12-31 06:30:00', NULL, NULL),
('review-test-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-002', 4.00, 'Beautiful Valley Views - The villa has stunning valley views and the bonfire area was amazing. Kitchen was well-equipped. Only minor issue was the hot water took some time in the mornings.', 4, 4, 5, 5, 5, 4, 'published', '2026-01-05 03:30:00', NULL, NULL),
('review-test-005', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 'user-test-004', 'booking-test-005', 5.00, 'Direct Beach Access - Amazing! Direct beach access was the highlight! The cook prepared delicious meals and the caretaker was very attentive. Perfect weekend getaway.', 5, 5, 5, 5, 5, 5, 'published', '2026-01-04 08:30:00', NULL, NULL),
('review-test-006', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 4.00, 'Royal Experience in Jaipur - Authentic Rajasthani architecture with modern amenities. Loved the courtyard and rooftop dining area. Great for experiencing local culture.', 4, 5, 4, 5, 4, 4, 'pending', '2026-01-09 04:30:00', NULL, NULL),
('review-test-007', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-011', 4.50, 'Nice cottage with good amenities. Peaceful location perfect for relaxation.', 4, 5, 4, 5, 4, 5, 'pending', '2025-12-05 00:00:00', NULL, NULL),
('review-test-008', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-002', 'booking-test-012', 2.00, 'This review contains inappropriate content and has been flagged.', 2, 3, 2, 3, 2, 2, 'flagged', '2025-11-19 01:00:00', '2025-11-19 22:30:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `review_email_log`
--

CREATE TABLE `review_email_log` (
  `id` char(36) NOT NULL,
  `booking_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email_type` enum('initial','reminder_7d','reminder_14d','manual') NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_by` char(36) DEFAULT NULL,
  `custom_message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_photos`
--

CREATE TABLE `review_photos` (
  `id` char(36) NOT NULL,
  `review_id` char(36) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 1,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_replies`
--

CREATE TABLE `review_replies` (
  `id` char(36) NOT NULL,
  `review_id` char(36) NOT NULL,
  `replied_by` char(36) NOT NULL,
  `replied_by_role` enum('vendor','admin') NOT NULL,
  `reply_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `review_replies`
--

INSERT INTO `review_replies` (`id`, `review_id`, `replied_by`, `replied_by_role`, `reply_text`, `created_at`, `updated_at`, `deleted_at`) VALUES
('reply-test-001', 'review-test-001', '', 'vendor', 'Thank you so much for the wonderful review! We are thrilled you enjoyed your stay. Hope to welcome you back soon!', '2025-12-29 09:30:00', '2026-01-18 11:10:50', NULL),
('reply-test-002', 'review-test-003', '', 'vendor', 'It was our pleasure to host your parents anniversary celebration. Thank you for choosing our property for such a special occasion!', '2025-12-31 10:30:00', '2026-01-18 11:10:50', NULL),
('reply-test-003', 'review-test-004', '', 'vendor', 'Thank you for your valuable feedback! We have fixed the hot water issue. Looking forward to hosting you again!', '2026-01-05 06:30:00', '2026-01-18 11:10:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `status` enum('active','inactive','blocked') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bank_details`)),
  `reset_token` varchar(64) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `is_corporate_user` tinyint(1) DEFAULT 0 COMMENT 'User booking for company',
  `company_name` varchar(255) DEFAULT NULL COMMENT 'Company name',
  `company_gst` varchar(15) DEFAULT NULL COMMENT 'Company GST number',
  `company_email_verified` tinyint(1) DEFAULT 0 COMMENT 'Company email verified',
  `email_verification_token` varchar(255) DEFAULT NULL COMMENT 'Email verification token',
  `email_verification_token_expiry` datetime DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL COMMENT 'Email verification timestamp',
  `is_temporary_password` tinyint(1) DEFAULT 0,
  `password_change_required` tinyint(1) DEFAULT 0,
  `created_by` char(36) DEFAULT NULL COMMENT 'Admin who created this user',
  `profile_completed` tinyint(1) DEFAULT 0,
  `last_password_change` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `status`, `created_at`, `deleted_at`, `avatar`, `address`, `bio`, `bank_details`, `reset_token`, `reset_token_expiry`, `is_corporate_user`, `company_name`, `company_gst`, `company_email_verified`, `email_verification_token`, `email_verification_token_expiry`, `email_verified_at`, `is_temporary_password`, `password_change_required`, `created_by`, `profile_completed`, `last_password_change`) VALUES
('043ef643-2e5b-4358-a651-9d1764511169', 'Ranjith Gopafy', 'ranjithgopafy@gmail.com', '9876543210', '$2a$10$FBW4jUOIoaT00HTf9EyYv.mnkrPZR0ojQncZf5ibpux3SRk7yufJu', 'active', '2026-04-05 19:33:25', NULL, NULL, '', '', NULL, '06293a8d456498a82aee7f0452f0086c566e19d30dcd1b312165f5e3dde5e2f7', '2026-04-06 02:36:48', 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('1dee3043-ff2a-4712-8e9e-a46ee3024845', 'Shashank', 'shashankzevio@gmail.com', NULL, '$2a$10$0dOYIAPiTDKOdtvUPaQNW.jBRNLlzV0VfyMCUcYPvMRgKeAyl9DmS', 'active', '2026-03-29 17:01:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 1, 1, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 'Test User', 'test_1767631087306@test.com', '1234567890', '$2a$10$IFE7cN/VckZtwgbSnVMimOD9EgQrjyTm38mVumUfQ9xXVpIkuRSJi', 'active', '2026-01-05 16:38:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('244c2909-85ef-4d38-8a0a-2723ff145942', 'Test User', 'testuser@zevio.in', '9999999999', '$2a$10$xPefuZECysURprHDo7i6lOIKmTbVoEY.w7IFEcpFQ7K3p5unFze0m', 'active', '2026-02-21 14:05:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'Test Booker B', 'testbooker_b@zevio.test', '9000000002', '$2a$10$WunCdjKZCiqJlHp7gUS2nu9IA9gpUu0j75/adT4Dm7IuUgjTM/I1G', 'active', '2026-03-02 16:53:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('4df955f5-45e7-4844-a832-9ec9e5649f5c', 'Test User', 'test_1767630472022@test.com', '1234567890', '$2a$10$KXETuyYNN8uo1XUBxA9JQu03zPLX/gnEGGJZRqwidjQMGiiuaoQya', 'active', '2026-01-05 16:27:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('88f47b63-ef0c-4726-9fdf-c976759d7da6', 'Ranjith', 'ranjith@thinktreemedia.in', '9945554414', '$2a$10$NxZ5D/oq9vJHaf..yN4BJOJlvLS13OrOHlSNbxiw8K7pdVvuqExe6', 'active', '2026-03-01 18:05:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'Gopafy', NULL, 1, NULL, NULL, '2026-03-01 18:56:37', 0, 0, NULL, 0, '2026-03-01 18:59:54'),
('a85b436f-dde2-4b06-ae86-aca64e6b222c', 'Vinod', 'gopafyvinod@gmail.com', '7811720071', '$2a$10$2qHb5erxwyOIHHcN1ELc2eK/RWgLM/sl7GVnv2zOHd9W1LQ.wRETu', 'active', '2026-03-04 08:18:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-03-04 11:39:28'),
('a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'Test Booker A', 'testbooker_a@zevio.test', '9000000001', '$2a$10$iaHQ5ZsALhDCyyasG1Mq9OuiAwcadihRH9PgXH91sXNZMKsO5paOa', 'active', '2026-03-02 16:53:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('ae1a695c-6724-4098-bd50-73a2cf569779', 'Test User', 'test_1767631229011@test.com', '1234567890', '$2a$10$mcTBWcR5QPiIMxXEWNCApeMchTQFiWI7qWlAkbif.COPYjv9EcXI6', 'active', '2026-01-05 16:40:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb551978-e418-11f0-9f30-00410e2b5e6e', 'Amit Kumar', 'rajesh@example.com', '9876543210', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'Priya Sharma', 'priya@example.com', '9876543211', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553a04-e418-11f0-9f30-00410e2b5e6e', 'Ravi Singh', 'amit@example.com', '9876543212', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553ab0-e418-11f0-9f30-00410e2b5e6e', 'Sneha Reddy', 'sneha@example.com', '9876543213', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553b3e-e418-11f0-9f30-00410e2b5e6e', 'Vikram Singh', 'vikram@example.com', '9876543214', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 'Test User', 'test_1767631377325@test.com', '1234567890', '$2a$10$K5A5Z/1KuUBCry3p742ykOEFd5/7WuSph7XZ78a1oGobwDDOvtupC', 'active', '2026-01-05 16:42:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 'Test User', 'test_1767631170547@test.com', '1234567890', '$2a$10$OXFoboJiCN87YHVowsO7IunlcokOE1YbCThiNmBGWKLfTsx2/UifG', 'active', '2026-01-05 16:39:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-001', 'Rajesh Mehta', 'rajesh.mehta@test.com', '9123456780', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 04:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-002', 'Sneha Patel', 'sneha.patel@test.com', '9123456781', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 05:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-003', 'Vikram Rao', 'vikram.rao@test.com', '9123456782', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 06:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-004', 'Anjali Desai', 'anjali.desai@test.com', '9123456783', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 03:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-005', 'Karan Shah', 'karan.shah@test.com', '9123456784', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 04:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-006', 'Neha Gupta', 'neha.gupta@test.com', '9123456785', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'blocked', '2025-12-30 05:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-007', 'Arjun Nair', 'arjun.nair@test.com', '9123456786', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 02:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-008', 'Pooja Kapoor', 'pooja.kapoor@test.com', '9123456787', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 03:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email_notifications` tinyint(1) DEFAULT 1 COMMENT 'Email notifications for bookings and updates',
  `email_promotions` tinyint(1) DEFAULT 1 COMMENT 'Promotional emails and newsletters',
  `email_reminders` tinyint(1) DEFAULT 1 COMMENT 'Booking reminders and check-in alerts',
  `sms_notifications` tinyint(1) DEFAULT 0 COMMENT 'SMS notifications for urgent updates',
  `sms_reminders` tinyint(1) DEFAULT 0 COMMENT 'SMS reminders for bookings',
  `push_notifications` tinyint(1) DEFAULT 1 COMMENT 'Browser/mobile push notifications',
  `profile_visibility` enum('public','private') DEFAULT 'private' COMMENT 'Profile visibility to other users',
  `show_wishlist` tinyint(1) DEFAULT 0 COMMENT 'Show wishlist publicly',
  `share_activity` tinyint(1) DEFAULT 0 COMMENT 'Share booking activity with friends',
  `newsletter_subscription` tinyint(1) DEFAULT 1 COMMENT 'Subscribe to newsletter',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `user_settings`
--

INSERT INTO `user_settings` (`id`, `user_id`, `email_notifications`, `email_promotions`, `email_reminders`, `sms_notifications`, `sms_reminders`, `push_notifications`, `profile_visibility`, `show_wishlist`, `share_activity`, `newsletter_subscription`, `created_at`, `updated_at`) VALUES
('26523f3a-0c46-4ea5-b715-74996830dcca', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-04 11:41:32', '2026-03-04 11:41:32'),
('422c6ed9-25ae-11f1-9f44-00410e2b5e6e', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-22 05:16:10', '2026-03-22 05:16:10'),
('422c6fae-25ae-11f1-9f44-00410e2b5e6e', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-22 05:16:10', '2026-03-22 05:16:10'),
('422c72c6-25ae-11f1-9f44-00410e2b5e6e', '88f47b63-ef0c-4726-9fdf-c976759d7da6', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-22 05:16:10', '2026-03-22 05:16:10'),
('af3aa059-8353-443b-b386-d164b6694b87', '244c2909-85ef-4d38-8a0a-2723ff145942', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-02-22 05:29:10', '2026-02-22 05:29:10'),
('d4d8ac23-ee5e-11f0-8497-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8acbb-ee5e-11f0-8497-00410e2b5e6e', 'user-test-004', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8acf9-ee5e-11f0-8497-00410e2b5e6e', 'user-test-007', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ad26-ee5e-11f0-8497-00410e2b5e6e', 'user-test-005', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ad50-ee5e-11f0-8497-00410e2b5e6e', 'user-test-006', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ad79-ee5e-11f0-8497-00410e2b5e6e', 'user-test-008', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ada4-ee5e-11f0-8497-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8adcd-ee5e-11f0-8497-00410e2b5e6e', 'user-test-001', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8adf8-ee5e-11f0-8497-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ae20-ee5e-11f0-8497-00410e2b5e6e', 'user-test-002', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ae4b-ee5e-11f0-8497-00410e2b5e6e', 'bb553ab0-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8ae76-ee5e-11f0-8497-00410e2b5e6e', '4df955f5-45e7-4844-a832-9ec9e5649f5c', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8aea0-ee5e-11f0-8497-00410e2b5e6e', '2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8aec9-ee5e-11f0-8497-00410e2b5e6e', 'c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8aef4-ee5e-11f0-8497-00410e2b5e6e', 'ae1a695c-6724-4098-bd50-73a2cf569779', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8af1f-ee5e-11f0-8497-00410e2b5e6e', 'c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8af4b-ee5e-11f0-8497-00410e2b5e6e', 'user-test-003', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03'),
('d4d8af77-ee5e-11f0-8497-00410e2b5e6e', 'bb553b3e-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 19:59:03', '2026-01-10 19:59:03');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `is_gst_registered` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether vendor is GST registered',
  `company_name` varchar(150) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bank_details`)),
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_temporary_password` tinyint(1) DEFAULT 0,
  `password_change_required` tinyint(1) DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `profile_completed` tinyint(1) DEFAULT 0,
  `last_password_change` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `email`, `password_hash`, `phone`, `gst_number`, `is_gst_registered`, `company_name`, `pan_number`, `address`, `city`, `state`, `pincode`, `bank_details`, `status`, `created_at`, `deleted_at`, `avatar`, `is_temporary_password`, `password_change_required`, `created_by`, `profile_completed`, `last_password_change`, `reset_token`, `reset_token_expiry`) VALUES
('bb60817d-e418-11f0-9f30-00410e2b5e6e', 'Vendor Test Updated', 'vendor1@example.com', '$2a$12$l3GSSxyncIVIwvVuJam90eDwdJgqwPCpddSBWJkqLBVkyonS9M/wW', '9999988888', 'TEST123', 1, 'Test Corp', NULL, '123 Street', NULL, NULL, NULL, '{\"bank_name\":null,\"account_holder_name\":\"Test\",\"account_number\":\"123456789\",\"ifsc_code\":\"HDFCDROPTAB\",\"branch_name\":null}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL),
('bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'Beach Resorts Group', 'vendor2@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543231', '27AABCB1234C1Z5', 1, NULL, NULL, NULL, NULL, NULL, NULL, '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"56789012345678\", \"ifsc\": \"ICIC0005678\", \"account_holder\": \"Beach Resorts Group\"}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL),
('bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'Mountain Retreats', 'vendor3@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543232', '07AABCM9876K1Z8', 1, NULL, NULL, NULL, NULL, NULL, NULL, '{\"bank_name\": \"SBI\", \"account_number\": \"98765432109876\", \"ifsc\": \"SBIN0009876\", \"account_holder\": \"Mountain Retreats\"}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL),
('dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'Mithun', 'mithunmanju77@gmail.com', '$2a$10$2WlOb1OXeJtmNhgSxmHBdOJgT28tIN7s1Gi0wtJMj3nlciVQ9hCPC', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-03-29 17:04:50', NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-03-29 17:06:51', NULL, NULL),
('f10abec0-bc8b-4688-9b73-11eef686b9f3', 'Ranjith', 'ranjithgopafy@gmail.com', '$2a$10$eGNQQgntPBCG4SgNznM8eOfQBD7Xu6jiddGU15vPEuREWKPg7wBl.', '9945554414', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-15 04:42:01', NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-02-15 04:43:40', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendor_settlements`
--

CREATE TABLE `vendor_settlements` (
  `id` char(36) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `booking_base_amount` decimal(12,2) DEFAULT NULL COMMENT 'Booking base amount',
  `booking_gst_amount` decimal(12,2) DEFAULT NULL COMMENT 'GST from booking',
  `booking_service_charge` decimal(12,2) DEFAULT NULL COMMENT 'Service charge from booking',
  `booking_total_amount` decimal(12,2) DEFAULT NULL COMMENT 'Total guest paid',
  `vendor_gross_amount` decimal(12,2) DEFAULT NULL COMMENT 'Vendor gross amount',
  `platform_fee` decimal(12,2) DEFAULT NULL COMMENT '3% of vendor gross',
  `platform_fee_gst` decimal(12,2) DEFAULT NULL COMMENT '18% GST on platform fee',
  `total_deduction` decimal(12,2) DEFAULT NULL COMMENT 'platform_fee + platform_fee_gst',
  `is_vendor_gst` tinyint(1) DEFAULT 0 COMMENT 'Vendor GST status at settlement time',
  `amount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT NULL,
  `payment_proof` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_terms_conditions`
--

CREATE TABLE `vendor_terms_conditions` (
  `id` int(11) NOT NULL,
  `content` longtext NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `updated_by` char(36) DEFAULT NULL COMMENT 'Admin user ID who last updated',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendor_terms_conditions`
--

INSERT INTO `vendor_terms_conditions` (`id`, `content`, `version`, `updated_by`, `updated_at`, `created_at`) VALUES
(1, '<h2>Vendor Terms and Conditions</h2>\n<p>By listing your property on Zevio and clicking \"Submit for Approval\", you agree to the following terms and conditions. Please read them carefully before proceeding.</p>\n<h3>1. Property Listing</h3>\n<p>You agree to provide accurate, complete, and up-to-date information about your property, including descriptions, photos, pricing, and availability.</p>\n<h3>2. Commission and Payments</h3>\n<p>Zevio charges a platform commission on each confirmed booking. Settlement will be processed within the agreed timeline after guest check-out, minus applicable deductions.</p>\n<h3>3. Cancellation Policy</h3>\n<p>You must honour the cancellation policy associated with your property type. Frequent cancellations may result in suspension or removal of your listing.</p>\n<h3>4. Property Standards</h3>\n<p>Your property must meet Zevio\'s quality and safety standards. Zevio reserves the right to remove listings that do not comply with these standards.</p>\n<h3>5. Guest Conduct</h3>\n<p>You agree to treat all guests with respect and professionalism. Any discrimination or misconduct may result in immediate account suspension.</p>\n<h3>6. Legal Compliance</h3>\n<p>You are solely responsible for ensuring your property listing complies with all applicable local laws, regulations, and licensing requirements.</p>\n<h3>7. Amendments</h3>\n<p>Zevio reserves the right to update these Terms and Conditions at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>', 1, NULL, '2026-03-28 17:17:50', '2026-03-28 17:17:50');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`id`, `user_id`, `property_id`, `created_at`, `deleted_at`) VALUES
('1fe5ab66-9509-456d-8bd9-5d5522cf74ab', '043ef643-2e5b-4358-a651-9d1764511169', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-05 19:34:37', NULL),
('239254ba-d885-4eda-a516-c6d5dcdaad1d', '88f47b63-ef0c-4726-9fdf-c976759d7da6', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-03-12 15:41:13', NULL),
('3b79bb2b-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79c8ec-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79ca44-e89e-11f0-a597-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79cb7b-e89e-11f0-a597-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3c03a911-bab3-4adc-8f13-96b516d9fa64', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-03-04 12:17:12', NULL),
('52b704a4-4e6d-4852-a20d-2d94273a4259', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04 12:45:07', NULL),
('70b9abac-fa96-4d8d-aa9a-9a9b10aadd00', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-10 08:59:59', NULL),
('c5470d3d-e369-41d5-9fac-86131838f556', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-05 16:33:51', NULL),
('cbb10d02-c02e-4a10-af1e-edc0430ceba6', '244c2909-85ef-4d38-8a0a-2723ff145942', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-28 12:25:53', NULL),
('wishlist-test-003', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-01-06 03:30:00', NULL),
('wishlist-test-004', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 05:30:00', NULL),
('wishlist-test-005', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 08:30:00', NULL),
('wishlist-test-007', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:30:00', NULL),
('wishlist-test-008', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '2026-01-06 04:30:00', NULL),
('wishlist-test-009', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 04:30:00', NULL),
('wishlist-test-010', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '2026-01-04 04:30:00', NULL),
('wishlist-test-011', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:30:00', NULL),
('wishlist-test-013', 'user-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 03:30:00', NULL),
('wishlist-test-014', 'user-test-001', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 04:00:00', NULL),
('wishlist-test-015', 'user-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 04:30:00', NULL),
('wishlist-test-016', 'user-test-003', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 05:30:00', NULL),
('wishlist-test-017', 'user-test-004', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 01:00:00', NULL),
('wishlist-test-018', 'user-test-004', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 02:00:00', NULL),
('wishlist-test-019', 'user-test-005', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 23:00:00', NULL),
('wishlist-test-020', 'user-test-007', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-10 00:00:00', NULL);

-- --------------------------------------------------------

--
-- Structure for view `properties_with_pricing`
--
DROP TABLE IF EXISTS `properties_with_pricing`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `properties_with_pricing`  AS SELECT `p`.`id` AS `id`, `p`.`vendor_id` AS `vendor_id`, `p`.`title` AS `title`, `p`.`description` AS `description`, `p`.`address` AS `address`, `c`.`name` AS `city`, `p`.`area` AS `area`, `p`.`state` AS `state`, `p`.`pincode` AS `pincode`, `p`.`bedrooms` AS `bedrooms`, `p`.`bathrooms` AS `bathrooms`, `p`.`max_guests` AS `max_guests`, `p`.`check_in_time` AS `check_in_time`, `p`.`check_out_time` AS `check_out_time`, `p`.`min_stay_days` AS `min_stay_days`, `p`.`max_stay_days` AS `max_stay_days`, `p`.`photos` AS `photos`, `p`.`rating` AS `rating`, `p`.`reviews_count` AS `reviews_count`, `p`.`status` AS `status`, `p`.`created_at` AS `created_at`, `p`.`city_id` AS `city_id`, `p`.`property_type_id` AS `property_type_id`, `pt`.`name` AS `property_type`, `pt`.`stay_type` AS `stay_type`, `pr`.`price_per_night` AS `price_per_night`, `pr`.`gst_percentage` AS `gst_percentage`, `pr`.`min_guests` AS `pricing_min_guests`, `pr`.`extra_guest_charge` AS `extra_guest_charge`, `pr`.`weekly_discount_percent` AS `weekly_discount_percent`, `pr`.`monthly_discount_percent` AS `monthly_discount_percent`, `pr`.`quarterly_discount_percent` AS `quarterly_discount_percent`, `pr`.`long_term_discount_percent` AS `long_term_discount_percent`, `pr`.`allow_corporate_booking` AS `allow_corporate_booking`, `pr`.`corporate_discount_percent` AS `corporate_discount_percent`, `pr`.`deposit_amount` AS `deposit_amount`, `pr`.`maintenance_charges` AS `maintenance_charges`, group_concat(distinct `a`.`name` order by `a`.`display_order` ASC,`a`.`name` ASC separator ', ') AS `amenities_list`, group_concat(distinct `a`.`id` order by `a`.`display_order` ASC,`a`.`name` ASC separator ',') AS `amenity_ids`, group_concat(distinct `f`.`name` order by `f`.`display_order` ASC separator ', ') AS `features_list`, group_concat(distinct `f`.`id` order by `f`.`display_order` ASC separator ',') AS `feature_ids` FROM (((((((`properties` `p` join `property_pricing` `pr` on(`p`.`id` = `pr`.`property_id`)) left join `cities` `c` on(`p`.`city_id` = `c`.`id`)) left join `property_types` `pt` on(`p`.`property_type_id` = `pt`.`id`)) left join `property_amenities` `pa` on(`p`.`id` = `pa`.`property_id`)) left join `amenities` `a` on(`pa`.`amenity_id` = `a`.`id` and `a`.`is_active` = 1)) left join `property_features` `pf` on(`p`.`id` = `pf`.`property_id`)) left join `features` `f` on(`pf`.`feature_id` = `f`.`id` and `f`.`is_active` = 1)) WHERE `p`.`deleted_at` is null GROUP BY `p`.`id`, `pr`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `amenities`
--
ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_order` (`display_order`),
  ADD KEY `idx_amenity_display` (`is_active`,`display_order`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_dates_status` (`property_id`,`check_in`,`check_out`,`status`),
  ADD KEY `idx_user_history` (`user_id`,`created_at`),
  ADD KEY `idx_payment_expiry` (`status`,`payment_status`,`payment_expires_at`);

--
-- Indexes for table `cancellation_policies`
--
ALTER TABLE `cancellation_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cancel_policy_type` (`property_type_id`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_types`
--
ALTER TABLE `contact_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_contact_type_active` (`is_active`,`display_order`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_coupon_code` (`code`),
  ADD KEY `idx_coupon_type` (`type`),
  ADD KEY `idx_coupon_active` (`is_active`),
  ADD KEY `fk_coupons_admin` (`created_by`);

--
-- Indexes for table `coupon_usages`
--
ALTER TABLE `coupon_usages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cron_jobs_log`
--
ALTER TABLE `cron_jobs_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `features`
--
ALTER TABLE `features`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_feature_key` (`key_name`),
  ADD KEY `idx_feature_active` (`is_active`),
  ADD KEY `idx_feature_category` (`category`);

--
-- Indexes for table `guide_types`
--
ALTER TABLE `guide_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_guide_type_active` (`is_active`,`display_order`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `location_types`
--
ALTER TABLE `location_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_location_type_active` (`is_active`,`display_order`),
  ADD KEY `idx_location_category` (`category`,`is_active`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recipient_read` (`recipient_id`,`is_read`,`created_at`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_payment` (`booking_id`,`status`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_search_filters` (`city_id`,`status`,`rating`),
  ADD KEY `idx_property_type` (`property_type_id`),
  ADD KEY `idx_min_stay` (`min_stay_days`,`status`),
  ADD KEY `idx_properties_area` (`area`),
  ADD KEY `idx_search_optimization` (`status`,`deleted_at`,`city_id`,`rating`),
  ADD KEY `idx_deleted_status` (`deleted_at`,`status`),
  ADD KEY `idx_recommended` (`is_recommended`,`recommended_priority`,`property_type_id`,`status`),
  ADD KEY `fk_properties_recommended_by` (`recommended_by`),
  ADD KEY `idx_properties_maps_location` (`maps_location`(100));

--
-- Indexes for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_property_amenity` (`property_id`,`amenity_id`),
  ADD KEY `idx_property` (`property_id`),
  ADD KEY `idx_amenity` (`amenity_id`);

--
-- Indexes for table `property_blackout_dates`
--
ALTER TABLE `property_blackout_dates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_calendar_pricing`
--
ALTER TABLE `property_calendar_pricing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_property_date` (`property_id`,`price_date`),
  ADD KEY `idx_calendar_property` (`property_id`),
  ADD KEY `idx_calendar_date` (`price_date`);

--
-- Indexes for table `property_change_requests`
--
ALTER TABLE `property_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `property_contacts`
--
ALTER TABLE `property_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contact_type_id` (`contact_type_id`),
  ADD KEY `idx_property_contact` (`property_id`,`contact_type_id`),
  ADD KEY `idx_contact_active` (`is_active`);

--
-- Indexes for table `property_features`
--
ALTER TABLE `property_features`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_property_feature_unique` (`property_id`,`feature_id`),
  ADD KEY `idx_pf_property` (`property_id`),
  ADD KEY `idx_pf_feature` (`feature_id`);

--
-- Indexes for table `property_guidelines`
--
ALTER TABLE `property_guidelines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_id` (`property_id`);

--
-- Indexes for table `property_guides`
--
ALTER TABLE `property_guides`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_property_guide` (`property_id`,`guide_type_id`,`language`),
  ADD KEY `guide_type_id` (`guide_type_id`),
  ADD KEY `idx_property_guide` (`property_id`,`guide_type_id`,`is_active`),
  ADD KEY `idx_default_template` (`is_default_template`,`guide_type_id`,`is_active`),
  ADD KEY `idx_guide_language` (`language`,`is_active`);

--
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_locations`
--
ALTER TABLE `property_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_location` (`property_id`,`location_type_id`),
  ADD KEY `idx_distance` (`location_type_id`,`distance_km`),
  ADD KEY `idx_location_active` (`is_active`);

--
-- Indexes for table `property_pricing`
--
ALTER TABLE `property_pricing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_pricing_property` (`property_id`),
  ADD KEY `idx_property_pricing_price_range` (`price_per_night`),
  ADD KEY `idx_property_pricing_corporate` (`allow_corporate_booking`),
  ADD KEY `idx_price_range` (`price_per_night`,`property_id`);

--
-- Indexes for table `property_types`
--
ALTER TABLE `property_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_refresh_user` (`user_id`),
  ADD KEY `idx_refresh_hash` (`token_hash`),
  ADD KEY `idx_refresh_expires` (`expires_at`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_id` (`property_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_property_status` (`property_id`,`status`);

--
-- Indexes for table `review_email_log`
--
ALTER TABLE `review_email_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_email_booking` (`booking_id`),
  ADD KEY `idx_review_email_type` (`email_type`);

--
-- Indexes for table `review_photos`
--
ALTER TABLE `review_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_photos_review` (`review_id`);

--
-- Indexes for table `review_replies`
--
ALTER TABLE `review_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_id` (`review_id`),
  ADD KEY `idx_replied_by` (`replied_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_reset_token` (`reset_token`),
  ADD KEY `idx_corporate_users` (`is_corporate_user`,`company_email_verified`),
  ADD KEY `idx_email_verification` (`email_verification_token`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_settings_user_id` (`user_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vendor_settlements`
--
ALTER TABLE `vendor_settlements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `vendor_terms_conditions`
--
ALTER TABLE `vendor_terms_conditions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_property` (`user_id`,`property_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_property_id` (`property_id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `contact_types`
--
ALTER TABLE `contact_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `features`
--
ALTER TABLE `features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `guide_types`
--
ALTER TABLE `guide_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_number` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100017;

--
-- AUTO_INCREMENT for table `location_types`
--
ALTER TABLE `location_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `property_contacts`
--
ALTER TABLE `property_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `property_features`
--
ALTER TABLE `property_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `property_guides`
--
ALTER TABLE `property_guides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `property_locations`
--
ALTER TABLE `property_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `vendor_terms_conditions`
--
ALTER TABLE `vendor_terms_conditions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `cancellation_policies`
--
ALTER TABLE `cancellation_policies`
  ADD CONSTRAINT `fk_cancel_policy_type` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `fk_coupons_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `coupon_usages`
--
ALTER TABLE `coupon_usages`
  ADD CONSTRAINT `coupon_usages_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  ADD CONSTRAINT `coupon_usages_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `coupon_usages_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_properties_property_type` FOREIGN KEY (`property_type_id`) REFERENCES `property_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_properties_recommended_by` FOREIGN KEY (`recommended_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  ADD CONSTRAINT `properties_ibfk_3` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`);

--
-- Constraints for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD CONSTRAINT `fk_property_amenities_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_property_amenities_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `property_blackout_dates`
--
ALTER TABLE `property_blackout_dates`
  ADD CONSTRAINT `property_blackout_dates_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `property_calendar_pricing`
--
ALTER TABLE `property_calendar_pricing`
  ADD CONSTRAINT `fk_calendar_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `property_change_requests`
--
ALTER TABLE `property_change_requests`
  ADD CONSTRAINT `property_change_requests_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `property_change_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `admins` (`id`);

--
-- Constraints for table `property_contacts`
--
ALTER TABLE `property_contacts`
  ADD CONSTRAINT `property_contacts_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_contacts_ibfk_2` FOREIGN KEY (`contact_type_id`) REFERENCES `contact_types` (`id`);

--
-- Constraints for table `property_features`
--
ALTER TABLE `property_features`
  ADD CONSTRAINT `fk_property_features_feature` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_guidelines`
--
ALTER TABLE `property_guidelines`
  ADD CONSTRAINT `fk_property_guidelines_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `property_guides`
--
ALTER TABLE `property_guides`
  ADD CONSTRAINT `property_guides_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_guides_ibfk_2` FOREIGN KEY (`guide_type_id`) REFERENCES `guide_types` (`id`);

--
-- Constraints for table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `property_locations`
--
ALTER TABLE `property_locations`
  ADD CONSTRAINT `property_locations_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_locations_ibfk_2` FOREIGN KEY (`location_type_id`) REFERENCES `location_types` (`id`);

--
-- Constraints for table `property_pricing`
--
ALTER TABLE `property_pricing`
  ADD CONSTRAINT `fk_property_pricing_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_booking_fk` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reviews_property_fk` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `review_replies`
--
ALTER TABLE `review_replies`
  ADD CONSTRAINT `review_replies_review_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_settlements`
--
ALTER TABLE `vendor_settlements`
  ADD CONSTRAINT `vendor_settlements_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  ADD CONSTRAINT `vendor_settlements_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `fk_wishlist_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
