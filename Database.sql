-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 04, 2026 at 06:30 PM
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
('1b96c2ff-0d66-4e4c-8a88-2b087bc0237d', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Marked settlement as paid', 'vendor_settlement', 'settlement-005', '2026-01-16 14:57:18'),
('22666076-17ba-11f1-8916-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Reset password for customer: Vinod (gopafyvinod@gmail.com)', 'customer', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', '2026-03-04 11:05:54'),
('364f7eb9-143e-40b0-90c2-7dfa3ffbbb13', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', 'review-test-004', '2026-02-15 13:44:44'),
('5cc8fe4d-5514-43d9-bde5-3980a6fe0bab', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', '2026-02-15 14:43:48'),
('7725d7f9-44c6-4870-96bf-af39ab216084', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', 'review-test-007', '2026-02-15 13:39:08'),
('7753e114-9014-4543-9db7-20c5788327c1', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', 'review-test-005', '2026-02-15 13:44:57'),
('77633330-743b-486a-95a5-a8da445d727a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', '2026-02-15 14:43:45'),
('9c02a39a-54c8-4fdf-bb77-16c741f95e8c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', 'review-test-007', '2026-02-15 13:38:44'),
('ae24b51c-0a28-11f1-8b48-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new vendor account: Ranjith (ranjithgopafy@gmail.com)', 'vendor', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '2026-02-15 04:42:01'),
('bdde76dc-17a2-11f1-8916-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Vinod (gopafyvinod@gmail.com)', 'customer', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', '2026-03-04 08:18:27'),
('log-001', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Approved property', 'property', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2025-12-28 12:45:00'),
('log-002', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Processed refund', 'refund', 'refund-test-001', '2026-01-09 10:30:00'),
('log-003', 'bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Approved review', 'review', 'review-test-001', '2025-12-29 05:30:00'),
('log-004', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Blocked user', 'user', 'user-test-006', '2025-12-30 06:30:00'),
('log-005', 'bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Created blackout date', 'property_blackout', 'blackout-003', '2026-01-08 03:35:00');

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
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`, `deleted_at`, `avatar`) VALUES
('bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'Super Admin', 'admin@zevio.com', '$2a$10$nOsbi7ZKDC4fAyuc/geSk.3bksszLqnoWsqbulOpqK4o3yKowBfHG', 'super_admin', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'John Admin', 'john.admin@zevio.com', '$2a$10$9g7.OhgqaB0fKSsXR.dS/OOsFufK/b25zJlyU2jwHbwVaPxEAEb7O', 'admin', 'active', '2025-12-28 18:12:12', NULL, NULL);

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `name`, `category`, `icon`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
('5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', 'WiFi', 'connectivity', 'wifi', NULL, 19, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', 'Workspace', 'workspace', 'desk', NULL, 20, 1, '2026-01-17 20:51:38', '2026-01-17 20:51:38'),
('5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', 'AC', 'comfort', 'snowflake', NULL, 1, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', 'Parking', 'facility', 'car', NULL, 11, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', 'Kitchen', 'facility', 'utensils', NULL, 8, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', 'TV', 'entertainment', 'tv', NULL, 17, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb510-f3e6-11f0-8f27-00410e2b5e6e', 'Washing Machine', 'appliance', 'washing-machine', NULL, 18, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb610-f3e6-11f0-8f27-00410e2b5e6e', 'Refrigerator', 'appliance', 'refrigerator', NULL, 14, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', 'Microwave', 'appliance', 'microwave', NULL, 10, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb817-f3e6-11f0-8f27-00410e2b5e6e', 'Geyser', 'comfort', 'hot-tub', NULL, 5, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', 'Gym', 'facility', 'dumbbell', NULL, 6, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bba14-f3e6-11f0-8f27-00410e2b5e6e', 'Swimming Pool', 'facility', 'swimming-pool', NULL, 16, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', 'Security', 'safety', 'shield', NULL, 15, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbc07-f3e6-11f0-8f27-00410e2b5e6e', 'Power Backup', 'facility', 'battery', NULL, 13, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbd10-f3e6-11f0-8f27-00410e2b5e6e', 'Elevator', 'facility', 'elevator', NULL, 3, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', 'Housekeeping', 'service', 'broom', NULL, 7, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bbf0b-f3e6-11f0-8f27-00410e2b5e6e', 'Laundry', 'service', 'laundry', NULL, 9, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', 'Balcony', 'feature', 'balcony', NULL, 2, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', 'Garden', 'feature', 'tree', NULL, 4, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16'),
('5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', 'Pet Friendly', 'policy', 'paw', NULL, 12, 1, '2026-01-17 20:51:38', '2026-01-18 06:16:16');

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
('04d469a5-cfff-43db-a1aa-8b69b4fc89f2', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-25', '2026-06-28', 3, 1, 0, 0, 45000.00, 0.00, 0.00, 8100.00, 2250.00, NULL, NULL, 0.00, 0.00, 55350.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('0b3e982b-0ef5-4727-944b-950bff982996', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2027-01-16', '2027-01-21', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:25', '2026-03-02 22:46:25', '2026-03-02 22:46:25', NULL),
('1b73aa2f-bd80-4313-accf-96ed1f8c61ed', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 4, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, NULL, NULL, 0.00, 0.00, 19588.00, 'cancelled', 'failed', '2026-01-16 10:07:40', NULL, NULL, '2026-02-03 17:17:02'),
('20004d4c-c85e-4c5d-a359-a8e6f77d796b', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-30', '2026-07-05', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:41', '2026-03-02 22:38:41', '2026-03-02 22:38:41', NULL),
('23051548-964f-4dab-851a-0763ce72948c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '2026-02-01', '2026-02-04', 3, 2, 0, 0, 8400.00, 0.00, 0.00, 1512.00, 0.00, NULL, NULL, 0.00, 0.00, 9912.00, '', 'pending', '2026-01-29 16:06:36', '2026-01-29 21:51:36', NULL, '2026-02-03 17:17:02'),
('2cdd4906-531a-49d9-a13c-398fc57fe546', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-10-18', '2026-10-23', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('33435cd3-c31f-45c5-b440-ce19e7083727', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-05-01', '2026-05-06', 5, 1, 0, 0, 40000.00, 0.00, 0.00, 7200.00, 2000.00, NULL, NULL, 0.00, 0.00, 49200.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('3c5e8c53-794f-4820-a5ac-ee46aa587004', '244c2909-85ef-4d38-8a0a-2723ff145942', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-04', '2026-03-07', 3, 2, 0, 0, 45000.00, 0.00, 0.00, 8100.00, 2250.00, NULL, NULL, 0.00, 0.00, 55350.00, 'cancel_requested', 'pending', '2026-02-22 03:24:19', '2026-02-22 09:09:19', '2026-02-22 09:09:19', NULL),
('40b35828-fb3c-4069-8f95-0593a164e36d', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 4, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, NULL, NULL, 0.00, 0.00, 19588.00, 'cancelled', 'failed', '2026-01-16 13:27:48', '2026-01-17 07:41:53', NULL, '2026-02-03 17:17:02'),
('44fb4258-b0cd-4a21-a85e-bf6859700bc5', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-11', '2026-05-16', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('457c530b-4e62-4daa-b0ae-c2632c1b6a1c', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2027-01-16', '2027-01-21', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:25', '2026-03-02 22:46:25', '2026-03-02 22:46:25', NULL),
('55b16f5d-8777-4801-a484-3ff64f5dffc6', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-16', '2026-04-21', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('5d0e628a-f343-4d59-9c7a-7a7730a51a22', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-31', '2026-02-03', 3, 7, 0, 0, 45000.00, 13500.00, 0.00, 10530.00, 0.00, NULL, NULL, 0.00, 0.00, 69030.00, '', 'pending', '2026-01-29 16:44:05', '2026-01-29 22:37:39', NULL, '2026-02-03 17:17:02'),
('638f490b-8436-48f6-bbf8-b95defeb81f1', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-09-20', '2026-09-24', 4, 2, 0, 0, 60000.00, 0.00, 0.00, 10800.00, 3000.00, NULL, NULL, 0.00, 0.00, 73800.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('6fe75a9c-1a14-4f69-a438-677ae090a5eb', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-10-08', '2026-10-13', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', '244c2909-85ef-4d38-8a0a-2723ff145942', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-04', '2026-03-07', 3, 2, 0, 0, 45000.00, 0.00, 0.00, 8100.00, 2250.00, NULL, NULL, 0.00, 0.00, 55350.00, 'cancel_requested', 'pending', '2026-02-22 03:14:38', '2026-02-22 09:02:41', '2026-02-22 09:02:41', NULL),
('830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-19', '2026-01-21', 2, 4, 1, 0, 16000.00, 4000.00, 0.00, 3600.00, 0.00, NULL, NULL, 0.00, 0.00, 23600.00, 'cancelled', 'failed', '2026-01-16 14:29:17', '2026-01-17 08:02:31', NULL, '2026-02-03 17:17:02'),
('8959feac-09e7-44a6-830a-160dea03c2d0', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-10-28', '2026-11-02', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('8e6cf054-3d23-4657-9a42-c61290a20a0f', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-30', '2026-07-05', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:41', '2026-03-02 22:38:41', '2026-03-02 22:38:41', NULL),
('9587718f-d491-4171-b268-79558bf3a3c2', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-10-28', '2026-11-02', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('9aba3632-ead7-425b-896e-c86bbdb23769', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-01', '2026-05-06', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('9e286f12-a07a-42bf-9b17-a461ed11e653', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-11', '2026-04-16', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('9fb7b17c-5c1a-4d82-9a85-404f58cf12c5', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-11', '2026-05-16', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('bbc94743-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2025-02-15', '2025-02-18', 3, 5, 2, 1, 45000.00, 1500.00, 1600.00, 8100.00, 0.00, NULL, NULL, 0.00, 0.00, 53100.00, 'completed', 'completed', '2025-12-28 18:12:12', NULL, NULL, NULL),
('bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2025-03-10', '2025-03-12', 2, 4, 1, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, NULL, NULL, 0.00, 0.00, 18880.00, 'cancelled', 'failed', '2025-12-28 18:12:12', NULL, NULL, '2026-02-03 17:17:02'),
('bbd09930-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2024-12-20', '2024-12-23', 3, 8, 3, 1, 75000.00, 0.00, 3000.00, 13500.00, 0.00, NULL, NULL, 0.00, 7500.00, 81000.00, 'completed', 'completed', '2025-12-28 18:12:12', NULL, NULL, NULL),
('bd23f401-2dfe-4525-bbba-215535b2e769', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-10-03', '2026-10-08', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('bdc6afdb-307d-4292-afea-ff782f2cfd7e', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-21', '2026-04-26', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('beb0274a-e8e1-4d35-a70e-b035cb8332e0', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-18', '2026-01-20', 2, 5, 2, 0, 30000.00, 3000.00, 3200.00, 6516.00, 0.00, NULL, NULL, 0.00, 0.00, 42716.00, '', 'pending', '2026-01-16 19:11:31', '2026-01-17 00:56:31', NULL, '2026-02-03 17:17:02'),
('booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-02-15', '2026-02-18', 3, 6, 2, 1, 45000.00, 6000.00, 1600.00, 9468.00, 0.00, NULL, NULL, 0.00, 0.00, 61068.00, 'completed', 'completed', '2026-01-08 05:00:00', NULL, NULL, NULL),
('booking-test-002', 'user-test-001', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-03-01', '2026-03-03', 2, 6, 4, 0, 20000.00, 0.00, 1200.00, 3816.00, 0.00, NULL, NULL, 0.00, 0.00, 25016.00, 'confirmed', 'completed', '2026-01-09 05:30:00', NULL, NULL, NULL),
('booking-test-003', 'user-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-02-20', '2026-02-22', 2, 2, 1, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, NULL, NULL, 0.00, 0.00, 18880.00, 'cancelled', 'failed', '2026-01-10 03:30:00', NULL, NULL, '2026-02-03 17:17:02'),
('booking-test-004', 'user-test-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-04-10', '2026-04-14', 4, 10, 5, 2, 100000.00, 0.00, 0.00, 18000.00, 0.00, NULL, NULL, 0.00, 5000.00, 113000.00, 'confirmed', 'completed', '2026-01-10 04:30:00', NULL, NULL, NULL),
('booking-test-005', 'user-test-004', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-02-28', '2026-03-02', 2, 4, 2, 1, 36000.00, 0.00, 0.00, 6480.00, 0.00, NULL, NULL, 0.00, 0.00, 42480.00, 'confirmed', 'completed', '2026-01-10 05:30:00', NULL, NULL, NULL),
('booking-test-006', 'user-test-005', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '2026-03-15', '2026-03-18', 3, 5, 1, 0, 36000.00, 0.00, 0.00, 6480.00, 0.00, NULL, NULL, 0.00, 0.00, 42480.00, 'cancelled', 'failed', '2026-01-09 08:30:00', NULL, NULL, '2026-02-03 17:17:02'),
('booking-test-007', 'user-test-007', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '2026-05-01', '2026-05-05', 4, 8, 3, 1, 80000.00, 0.00, 0.00, 14400.00, 0.00, NULL, NULL, 0.00, 0.00, 94400.00, 'cancel_requested', 'pending', '2026-01-10 06:30:00', NULL, NULL, '2026-02-03 17:17:02'),
('booking-test-008', 'user-test-008', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '2025-12-25', '2025-12-28', 3, 6, 2, 0, 48000.00, 0.00, 0.00, 8640.00, 0.00, NULL, NULL, 0.00, 2000.00, 54640.00, 'completed', 'completed', '2025-12-20 04:30:00', NULL, NULL, NULL),
('booking-test-009', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '2026-06-15', '2026-06-20', 5, 8, 3, 1, 70000.00, 0.00, 0.00, 12600.00, 0.00, NULL, NULL, 0.00, 0.00, 82600.00, 'confirmed', 'completed', '2026-01-10 07:30:00', NULL, NULL, NULL),
('booking-test-010', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '2026-01-10', '2026-01-12', 2, 4, 1, 0, 24000.00, 0.00, 0.00, 4320.00, 0.00, NULL, NULL, 0.00, 0.00, 28320.00, 'completed', 'completed', '2026-01-10 02:30:00', NULL, NULL, NULL),
('booking-test-011', 'user-test-001', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2025-12-01', '2025-12-03', 2, 2, 0, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, NULL, NULL, 0.00, 0.00, 18880.00, 'completed', 'completed', '2025-11-24 23:00:00', NULL, NULL, NULL),
('booking-test-012', 'user-test-002', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2025-11-15', '2025-11-17', 2, 6, 0, 0, 20000.00, 0.00, 0.00, 3600.00, 0.00, NULL, NULL, 0.00, 0.00, 23600.00, 'completed', 'completed', '2025-11-10 00:00:00', NULL, NULL, NULL),
('booking-test-013', 'user-test-003', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2025-10-20', '2025-10-22', 2, 8, 2, 0, 36000.00, 6000.00, 500.00, 7650.00, 0.00, NULL, NULL, 0.00, 0.00, 50150.00, 'completed', 'completed', '2025-10-15 01:00:00', NULL, NULL, NULL),
('booking-test-014', 'user-test-005', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '2025-09-25', '2025-09-27', 2, 10, 3, 1, 60000.00, 8000.00, 1000.00, 12420.00, 0.00, NULL, NULL, 0.00, 0.00, 81420.00, 'completed', 'completed', '2025-09-19 22:00:00', NULL, NULL, NULL),
('c999b850-de48-4a4a-954f-25e8a3d8f589', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2027-01-11', '2027-01-14', 3, 1, 0, 0, 45000.00, 0.00, 0.00, 8100.00, 2250.00, NULL, NULL, 0.00, 0.00, 55350.00, 'cancelled', 'pending', '2026-03-02 17:01:25', '2026-03-02 22:46:25', '2026-03-02 22:46:25', NULL),
('cff2a0a7-c904-442c-9154-6a37a60ac054', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-23', '2026-06-22', 30, 1, 0, 0, 450000.00, 0.00, 0.00, 81000.00, 22500.00, NULL, NULL, 0.00, 0.00, 553500.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('dfc79b3b-f859-4a20-a3b0-26d023e3d1ae', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-09-28', '2026-10-03', 5, 1, 0, 0, 75000.00, 0.00, 0.00, 13500.00, 3750.00, NULL, NULL, 0.00, 0.00, 92250.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('e121073a-b74c-48f2-870d-9f501f29648a', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 2, 2, 0, 8000.00, 0.00, 500.00, 1530.00, 0.00, NULL, NULL, 0.00, 0.00, 10030.00, '', 'pending', '2026-01-16 18:00:27', '2026-01-16 23:45:27', NULL, '2026-02-03 17:17:02'),
('e997f4c8-3796-4ed7-aa76-07dc51c9d0f3', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-11-09', '2026-12-09', 30, 1, 0, 0, 450000.00, 0.00, 0.00, 81000.00, 22500.00, NULL, NULL, 0.00, 0.00, 553500.00, 'cancelled', 'pending', '2026-03-02 17:01:25', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('f4a30a70-b5a1-49c6-8ff9-aa709edb64ac', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-21', '2026-05-22', 1, 1, 0, 0, 15000.00, 0.00, 0.00, 2700.00, 750.00, NULL, NULL, 0.00, 0.00, 18450.00, 'cancelled', 'pending', '2026-03-02 16:53:40', '2026-03-02 22:38:40', '2026-03-02 22:38:40', NULL),
('f706b324-0fb7-4967-849b-d7932420dc60', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-10-18', '2026-10-23', 5, 1, 0, 0, 40000.00, 0.00, 0.00, 7200.00, 2000.00, NULL, NULL, 0.00, 0.00, 49200.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL),
('fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 3, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, NULL, NULL, 0.00, 0.00, 19588.00, 'cancelled', 'failed', '2026-01-16 14:13:31', '2026-01-17 07:45:37', NULL, '2026-02-03 17:17:02'),
('fcbb4174-93b5-45d7-91d8-57be02869420', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-11-07', '2026-11-08', 1, 1, 0, 0, 15000.00, 0.00, 0.00, 2700.00, 750.00, NULL, NULL, 0.00, 0.00, 18450.00, 'cancelled', 'pending', '2026-03-02 17:01:24', '2026-03-02 22:46:24', '2026-03-02 22:46:24', NULL);

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
('bb6556e0-e418-11f0-9f30-00410e2b5e6e', 'Ooty', 'Tamil Nadu', 'active');

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
('bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'WELCOME10', 'percentage', NULL, NULL, NULL, 10.00, 2000.00, 5000.00, '2025-01-01', '2025-12-31', 1000, 0, 1, NULL, NULL, NULL, '2026-02-15 08:25:04', '2026-02-15 14:43:48', NULL, 1),
('bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'SAVE500', 'flat', NULL, NULL, NULL, 500.00, 500.00, 3000.00, '2025-01-01', '2025-12-31', 500, 0, 1, NULL, NULL, NULL, '2026-02-15 08:25:04', '2026-02-15 08:25:04', NULL, 1),
('bbb9d565-e418-11f0-9f30-00410e2b5e6e', 'NEWYEAR25', 'percentage', NULL, NULL, NULL, 25.00, 5000.00, 10000.00, '2025-01-01', '2025-01-10', 100, 0, 1, NULL, NULL, NULL, '2026-02-15 08:25:04', '2026-02-15 08:25:04', NULL, 1),
('bbb9d600-e418-11f0-9f30-00410e2b5e6e', 'WEEKEND15', 'percentage', NULL, NULL, NULL, 15.00, 3000.00, 8000.00, '2025-01-01', '2025-12-31', 500, 0, 1, NULL, NULL, NULL, '2026-02-15 08:25:04', '2026-02-15 08:25:04', NULL, 1);

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

--
-- Dumping data for table `coupon_usages`
--

INSERT INTO `coupon_usages` (`id`, `coupon_id`, `booking_id`, `discount_applied`, `status`, `reserved_at`, `completed_at`, `cancelled_at`, `user_id`, `used_at`) VALUES
('coupon-usage-001', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-001', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'bb551978-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 23:30:00'),
('coupon-usage-002', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-002', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'user-test-001', '2026-01-09 00:00:00'),
('coupon-usage-003', 'bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'user-test-003', '2026-01-09 23:00:00'),
('coupon-usage-004', 'bbb9d565-e418-11f0-9f30-00410e2b5e6e', 'booking-test-005', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'user-test-004', '2026-01-10 00:00:00'),
('coupon-usage-005', 'bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'booking-test-008', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'user-test-008', '2025-12-19 23:05:00'),
('coupon-usage-006', 'bbb9d600-e418-11f0-9f30-00410e2b5e6e', 'booking-test-009', 0.00, 'reserved', '2026-02-15 08:25:04', NULL, NULL, 'user-test-007', '2026-01-10 02:00:00');

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
('2bcd0a3c-a8af-424c-bb44-f95f1ccd0d0d', 'check_in_reminder_24h', '2026-02-22', 'success', 'Sent 0 reminders, 0 failed'),
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
('91733ac3-7564-4901-8e31-31e7e78caa36', 'check_in_reminder_24h', '2026-02-17', 'success', 'Sent 0 reminders, 0 failed'),
('96a21ca2-4310-4684-ae62-b91d34fa4168', 'check_in_reminder_24h', '2026-01-25', 'success', 'Sent 0 reminders, 0 failed'),
('a3a20225-ddd1-44da-9f28-8587a5e500b4', 'check_in_reminder_24h', '2026-01-21', 'success', 'Sent 0 reminders, 0 failed'),
('afa328e3-7777-49cc-ab14-c4a7905c743d', 'check_in_reminder_24h', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('bcf69c72-aaf8-49aa-8eed-8f62ffa4c172', 'check_in_reminder_24h', '2026-02-14', 'success', 'Sent 0 reminders, 1 failed'),
('cb1b166c-4bdd-4f9c-9280-fdc110a53529', 'daily_booking_processor', '2026-02-20', 'success', 'Processed 0 settlements'),
('ccdbfb8d-4881-4415-a178-5f3d99e1ad0f', 'check_in_reminder_24h', '2026-03-01', 'success', 'Sent 0 reminders, 0 failed'),
('ccf3d069-5135-4556-93b8-73b8e64e2ced', 'check_out_reminder', '2026-02-15', 'success', 'Sent 0 reminders, 0 failed'),
('ccfe878e-4c7c-4098-875a-ffeec4a38cfd', 'review_request', '2026-01-24', 'success', 'Sent 0 review requests, 0 failed'),
('d71183e4-bae3-47db-bc70-805a4704fff1', 'check_out_reminder', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('d929f8cc-8995-4008-b945-483a3e21aabe', 'check_in_reminder_24h', '2026-02-20', 'success', 'Sent 0 reminders, 0 failed'),
('e59c888e-1c81-43cc-841c-c0f7cad833e2', 'check_out_reminder', '2026-02-14', 'success', 'Sent 0 reminders, 0 failed'),
('e9cfbfc4-b67e-4cc9-b23b-7747e38bdd7e', 'check_in_reminder_24h', '2026-01-16', 'success', 'Sent 0 reminders, 0 failed'),
('ee0a50ca-95dc-4163-b146-983df8ce3db8', 'check_in_reminder_24h', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
('f0ad2938-2014-42d6-833e-26591a07fd34', 'check_in_reminder_24h', '2026-01-19', 'success', 'Sent 0 reminders, 0 failed'),
('f20afc7d-858c-4cd9-b891-1cb73082f62d', 'check_out_reminder', '2026-02-20', 'success', 'Sent 0 reminders, 0 failed'),
('feafbaa6-7e6a-4325-8266-90e2ff47c804', 'review_request', '2026-01-17', 'success', 'Sent 0 review requests, 0 failed');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` char(36) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `incentive_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `name`, `email`, `phone`, `password_hash`, `incentive_percentage`, `status`, `created_at`, `deleted_at`, `avatar`) VALUES
('bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'Rahul Employee', 'rahul.emp@zevio.com', '9876543220', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 5.00, 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'Neha Employee', 'neha.emp@zevio.com', '9876543221', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 4.50, 'active', '2025-12-28 18:12:12', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_claims`
--

CREATE TABLE `employee_claims` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `points_claimed` decimal(12,2) DEFAULT NULL,
  `payout_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payout_details`)),
  `status` enum('pending','approved','paid','rejected') DEFAULT NULL,
  `payment_proof` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `employee_claims`
--

INSERT INTO `employee_claims` (`id`, `employee_id`, `points_claimed`, `payout_details`, `status`, `payment_proof`, `created_at`, `processed_at`) VALUES
('emp-claim-001', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 4304.20, '{\"bank_name\": \"HDFC Bank\", \"account_number\": \"12345678901\", \"ifsc_code\": \"HDFC0001234\", \"account_holder\": \"Rahul Employee\"}', 'paid', 'utr_hdfc_test_001', '2026-01-08 09:30:00', '2026-01-09 04:30:00'),
('emp-claim-002', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 5085.00, '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"98765432101\", \"ifsc_code\": \"ICIC0009876\", \"account_holder\": \"Neha Employee\"}', 'pending', NULL, '2026-01-10 08:30:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_points`
--

CREATE TABLE `employee_points` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `points` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','confirmed','redeemed') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `employee_points`
--

INSERT INTO `employee_points` (`id`, `employee_id`, `booking_id`, `points`, `status`, `created_at`) VALUES
('00fcd4db-7526-4dc6-a593-27589b7bc3b4', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'c999b850-de48-4a4a-954f-25e8a3d8f589', 2250.00, 'pending', '2026-03-02 17:01:25'),
('0ba14594-4f93-4241-b2e1-9002839ee551', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '638f490b-8436-48f6-bbf8-b95defeb81f1', 2250.00, 'pending', '2026-03-02 17:01:24'),
('157a75c7-45be-49e6-8528-496bfb8bfc4e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '8e6cf054-3d23-4657-9a42-c61290a20a0f', 3750.00, 'pending', '2026-03-02 16:53:41'),
('16ecc876-7b20-4438-bedc-bb1556b66b74', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '44fb4258-b0cd-4a21-a85e-bf6859700bc5', 3750.00, 'pending', '2026-03-02 16:53:40'),
('1799c46d-25a3-470c-a5ee-d88df742d9a5', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '9fb7b17c-5c1a-4d82-9a85-404f58cf12c5', 3750.00, 'pending', '2026-03-02 16:53:40'),
('2f62c327-9bd2-4b74-9d1e-22eec95b2ce6', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'cff2a0a7-c904-442c-9154-6a37a60ac054', 22500.00, 'pending', '2026-03-02 16:53:40'),
('30c28a4c-1ed4-4aa9-884e-5f9a5edb5e13', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'dfc79b3b-f859-4a20-a3b0-26d023e3d1ae', 3750.00, 'pending', '2026-03-02 17:01:24'),
('35b6323c-5103-420d-b290-6be748d6122b', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'f4a30a70-b5a1-49c6-8ff9-aa709edb64ac', 750.00, 'pending', '2026-03-02 16:53:40'),
('39bf3451-54ab-4675-a980-663c56595e7a', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '8959feac-09e7-44a6-830a-160dea03c2d0', 3750.00, 'pending', '2026-03-02 17:01:24'),
('497a460b-88d1-4542-bc9c-364bca1d85d3', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bd23f401-2dfe-4525-bbba-215535b2e769', 3750.00, 'pending', '2026-03-02 17:01:24'),
('66dbfa65-73b5-4249-951f-2bd0c99ece55', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '457c530b-4e62-4daa-b0ae-c2632c1b6a1c', 3750.00, 'pending', '2026-03-02 17:01:25'),
('68b166e4-a63e-4e5a-9c20-0c8c5c619c5d', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '638f490b-8436-48f6-bbf8-b95defeb81f1', 2250.00, 'pending', '2026-03-02 17:01:24'),
('759503ce-5cc0-4b8d-a43f-e43b762e3b61', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '04d469a5-cfff-43db-a1aa-8b69b4fc89f2', 2250.00, 'pending', '2026-03-02 16:53:40'),
('75c4f474-a2da-4c2b-8850-2e4f78eda1ac', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'f706b324-0fb7-4967-849b-d7932420dc60', 2000.00, 'pending', '2026-03-02 17:01:24'),
('789a71b9-4fc0-4ef1-9848-24ee7dbcffec', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '9587718f-d491-4171-b268-79558bf3a3c2', 3750.00, 'pending', '2026-03-02 17:01:24'),
('7dafe6db-e8c7-4d3a-a602-b1c016798a86', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '0b3e982b-0ef5-4727-944b-950bff982996', 3750.00, 'pending', '2026-03-02 17:01:25'),
('808a3445-4ed2-4b18-937b-905e483d7be4', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '9aba3632-ead7-425b-896e-c86bbdb23769', 3750.00, 'pending', '2026-03-02 16:53:40'),
('94ae5f5f-a4b8-46e8-8d06-79b760866ac8', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bdc6afdb-307d-4292-afea-ff782f2cfd7e', 3750.00, 'pending', '2026-03-02 16:53:40'),
('94c6192a-d367-4767-ad88-17df175daa77', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '55b16f5d-8777-4801-a484-3ff64f5dffc6', 3750.00, 'pending', '2026-03-02 16:53:40'),
('9a4850ef-a10a-4c8c-be3e-18f8a38553ea', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '33435cd3-c31f-45c5-b440-ce19e7083727', 2000.00, 'pending', '2026-03-02 16:53:40'),
('9b942c41-d888-4a9d-8c2c-944af8dee17f', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '2cdd4906-531a-49d9-a13c-398fc57fe546', 3750.00, 'pending', '2026-03-02 17:01:24'),
('ac0974e9-cd35-4fac-9dfe-519028196355', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '9e286f12-a07a-42bf-9b17-a461ed11e653', 3750.00, 'pending', '2026-03-02 16:53:40'),
('aed55a3e-7db7-4363-bbeb-bb1907f63fe8', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '3c5e8c53-794f-4820-a5ac-ee46aa587004', 2250.00, 'pending', '2026-02-22 03:24:19'),
('bf5d2dc4-71f7-4bda-a1ae-2fe1a99a99be', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', 2250.00, 'pending', '2026-02-22 03:17:41'),
('c1b630ab-051c-4a84-947e-a90aeff8b5aa', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '20004d4c-c85e-4c5d-a359-a8e6f77d796b', 3750.00, 'pending', '2026-03-02 16:53:41'),
('e617a7df-ab56-46f2-86ca-f1d5f94987f1', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '6fe75a9c-1a14-4f69-a438-677ae090a5eb', 3750.00, 'pending', '2026-03-02 17:01:24'),
('ebdccc3f-2127-459b-a5d0-e715e73ab47f', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', 2250.00, 'pending', '2026-02-22 03:14:38'),
('emp-points-001', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-001', 3053.40, 'confirmed', '2026-01-08 05:05:00'),
('emp-points-002', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-002', 1250.80, 'confirmed', '2026-01-09 05:35:00'),
('emp-points-003', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 5085.00, 'confirmed', '2026-01-10 04:35:00'),
('emp-points-004', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-010', 1416.00, 'confirmed', '2026-01-10 02:35:00'),
('emp-points-005', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-008', 2418.40, 'confirmed', '2025-12-19 23:15:00'),
('emp-points-006', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-009', 3650.00, 'confirmed', '2026-01-10 02:10:00'),
('emp-points-007', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-011', 833.28, 'confirmed', '2025-11-24 23:10:00'),
('f01c874b-bc68-485b-84cd-6c60112d85ca', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'e997f4c8-3796-4ed7-aa76-07dc51c9d0f3', 22500.00, 'pending', '2026-03-02 17:01:25'),
('f0e1f138-b7b5-4318-94aa-fd158df69de3', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'fcbb4174-93b5-45d7-91d8-57be02869420', 750.00, 'pending', '2026-03-02 17:01:24');

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
('51402de2-bcda-4f86-a2b7-0c071211d164', '244c2909-85ef-4d38-8a0a-2723ff145942', 'user', 'Booking Confirmed', 'Your booking has been confirmed. Booking ID: 3c5e8c53-794f-4820-a5ac-ee46aa587004', 0, '2026-02-22 03:24:20'),
('67f742a3-79a4-4807-9d1f-8cab1a0c76f7', '244c2909-85ef-4d38-8a0a-2723ff145942', 'user', 'Booking Confirmed', 'Your booking has been confirmed. Booking ID: 82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', 0, '2026-02-22 03:17:41'),
('71e83126-6219-46bb-9a2c-85df7627d541', NULL, 'admin', 'Cancellation Request', 'Booking 82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e cancellation requested by user', 0, '2026-02-22 03:17:43'),
('99448f86-3b48-48e5-bf93-fc41ee7ff8dc', NULL, 'admin', 'Cancellation Request', 'Booking 3c5e8c53-794f-4820-a5ac-ee46aa587004 cancellation requested by user', 0, '2026-02-22 03:24:26'),
('notif-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'user', 'Booking Confirmed', 'Your booking for Luxury Beach Villa - Goa has been confirmed. Check-in: Feb 15, 2026', 1, '2026-01-08 05:05:00'),
('notif-test-002', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'user', 'Review Reminder', 'How was your stay at Luxury Beach Villa? Please leave a review to help other travelers.', 0, '2026-02-19 04:30:00'),
('notif-test-003', 'user-test-001', 'user', 'Payment Successful', 'Payment of ?25,016 received for Hill View Villa - Lonavala booking.', 1, '2026-01-09 05:35:00'),
('notif-test-004', 'user-test-002', 'user', 'Payment Pending', 'Your payment for Cozy Cottage - North Goa is pending. Please complete payment.', 0, '2026-01-10 03:45:00');

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
('8e595c87-4258-4abd-974a-c65833be2338', '3c5e8c53-794f-4820-a5ac-ee46aa587004', 'cashfree', '3c5e8c53-794f-4820-a5ac-ee46aa587004_1771730659999', 55350.00, 'success', '2026-02-22 03:24:20'),
('bbd7cb58-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 'razorpay', 'pay_test_123456789', 53100.00, 'success', '2025-12-28 18:12:13'),
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
  `employee_id` char(36) DEFAULT NULL,
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
  `maps_location` varchar(500) DEFAULT NULL COMMENT 'Google Maps URL or coordinates for property location'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `employee_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `emergency_contacts`, `local_area_info`, `safety_information`, `amenities_guide`, `house_rules_text`, `check_in_guidelines`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`, `is_recommended`, `recommended_priority`, `recommended_at`, `recommended_by`, `maps_location`) VALUES
('27c960ac-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', NULL, '0d28b18d-960f-46a9-a12d-25bff6ad9f71', NULL, 'Modern 2BHK Service Apartment - Koramangala', 'test', '123 test', NULL, NULL, NULL, 0, 0, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '', '', '', '', '', '', '[\"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200\",\r\n\"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200\",\r\n\"https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200\",\r\n\"https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200\",\r\n\"https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200\",\r\n\"https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=1200\",\r\n\"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200\",\r\n\"https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:05:55', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', NULL),
('2a13f54c-0d3b-44d0-819a-cc66bacf7884', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'S69 Test Service Apt Bangalore', 'Modern 2BHK service apartment in Indiranagar with daily housekeeping', '45 MG Road, Indiranagar', 'Indiranagar', 'Karnataka', '560038', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"12:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_pets\":true,\"no_smoking\":true}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":48}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:50:55', '2026-02-20 16:50:55', 7, 90, 'daily', '', 1, 1, NULL, 100, 'Airtel', 'fully_furnished', 0, 0, NULL, NULL, NULL),
('3a49b46a-3439-4b48-86af-be81b6fdc570', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, '49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'pt-001', 'Backend Test Villa', 'UPDATED: Backend test property with changes', '123 Test Address', 'Test Area', 'Karnataka', '560001', 4, 3, 10, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-02-15 05:16:13', '2026-02-15 07:23:46', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('433758a4-1198-4b6a-ba02-7ea6619491e0', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, NULL, 'pt-001', 'Test Villa CRUD S69 - UPDATED', 'Test villa for session 69 CRUD', '123 Beach Road, Calangute', 'Calangute', 'Goa', '403515', 4, 2, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":24}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:49:46', '2026-02-20 16:49:46', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('495ba81d-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li><li><strong>Reception Desk:</strong> For immediate assistance</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Metro/bus station within walking distance</li><li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li><li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li><li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li><li><strong>ATM:</strong> Banking services available nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Extinguisher:</strong> Located near main entrance</li><li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li><li><strong>Emergency Exits:</strong> Clearly marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel on premises</li><li><strong>CCTV:</strong> Common areas under surveillance</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li><li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li><li><strong>Laundry:</strong> Washing machine available in unit or common area</li><li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li><li><strong>TV &amp; Entertainment:</strong> Smart TV with streaming services</li><li><strong>Housekeeping:</strong> Regular cleaning service included</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>No loud music or parties</li><li>Maximum guests as per booking confirmation</li><li>Pets not allowed unless specified</li><li>Visitors allowed between 9:00 AM - 9:00 PM only</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li><li><strong>Key Collection:</strong> Keys available at reception with valid ID</li><li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li><li><strong>Parking:</strong> Designated parking slots available</li></ul>', '[\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566752229-250ed79c5150?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687930-00e0f13a3dbe?w=1200\",\r\n\"https://images.unsplash.com/photo-1615875474908-f403163f34ea?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607686440-7edc5c2f7f5f?w=1200\"]', 0.00, 0, 'draft', '2026-01-16 21:06:52', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', NULL),
('495ca2b2-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Compact 1BHK Service Apartment - Andheri East', 'Cozy 1BHK service apartment near Andheri East metro station, perfect for solo professionals.', '789 Chakala Road, Andheri East', 'Andheri East', 'Maharashtra', '400093', 1, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li>\n<li><strong>Reception Desk:</strong> For immediate assistance</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n</ul>', '<h3>Local Area Information</h3>\n<ul>\n<li><strong>Public Transport:</strong> Metro/bus station within walking distance</li>\n<li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li>\n<li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li>\n<li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li>\n<li><strong>ATM:</strong> Banking services available nearby</li>\n</ul>', '<h3>Safety Information</h3>\n<ul>\n<li><strong>Fire Extinguisher:</strong> Located near main entrance</li>\n<li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li>\n<li><strong>Emergency Exits:</strong> Clearly marked on each floor</li>\n<li><strong>Security:</strong> 24/7 security personnel on premises</li>\n<li><strong>CCTV:</strong> Common areas under surveillance</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li>\n<li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li>\n<li><strong>Laundry:</strong> Washing machine available in unit or common area</li>\n<li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li>\n<li><strong>TV & Entertainment:</strong> Smart TV with streaming services</li>\n<li><strong>Housekeeping:</strong> Regular cleaning service included</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the apartment</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM</li>\n<li>No loud music or parties</li>\n<li>Maximum guests as per booking confirmation</li>\n<li>Pets not allowed unless specified</li>\n<li>Visitors allowed between 9:00 AM - 9:00 PM only</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li>\n<li><strong>Key Collection:</strong> Keys available at reception with valid ID</li>\n<li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li>\n<li><strong>Parking:</strong> Designated parking slots available</li>\n</ul>', '[\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 3, 180, 'weekly', 'weekly', 1, 0, 8, 100, 'Hathway Broadband', 'fully_furnished', 1, 2, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.1136,72.8697'),
('495cf369-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Premium 2BHK Service Apartment - BKC', 'Luxury 2BHK in Bandra Kurla Complex with stunning city views. Perfect for corporate executives.', '101 Peninsula Tower, BKC', 'BKC', 'Maharashtra', '400051', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li>\n<li><strong>Reception Desk:</strong> For immediate assistance</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n</ul>', '<h3>Local Area Information</h3>\n<ul>\n<li><strong>Public Transport:</strong> Metro/bus station within walking distance</li>\n<li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li>\n<li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li>\n<li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li>\n<li><strong>ATM:</strong> Banking services available nearby</li>\n</ul>', '<h3>Safety Information</h3>\n<ul>\n<li><strong>Fire Extinguisher:</strong> Located near main entrance</li>\n<li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li>\n<li><strong>Emergency Exits:</strong> Clearly marked on each floor</li>\n<li><strong>Security:</strong> 24/7 security personnel on premises</li>\n<li><strong>CCTV:</strong> Common areas under surveillance</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li>\n<li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li>\n<li><strong>Laundry:</strong> Washing machine available in unit or common area</li>\n<li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li>\n<li><strong>TV & Entertainment:</strong> Smart TV with streaming services</li>\n<li><strong>Housekeeping:</strong> Regular cleaning service included</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the apartment</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM</li>\n<li>No loud music or parties</li>\n<li>Maximum guests as per booking confirmation</li>\n<li>Pets not allowed unless specified</li>\n<li>Visitors allowed between 9:00 AM - 9:00 PM only</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li>\n<li><strong>Key Collection:</strong> Keys available at reception with valid ID</li>\n<li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li>\n<li><strong>Parking:</strong> Designated parking slots available</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185127-6a4e3ab5c2e1?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687664-6bece1f7a565?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 18, 200, 'Jio Fiber', 'fully_furnished', 1, 1, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.0596,72.8656'),
('495d4419-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49ab220d-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Corporate 2BHK Service Apartment - Connaught Place', 'Professional 2BHK in central Delhi, ideal for government and corporate bookings.', '234 Barakhamba Road, Connaught Place', 'Connaught Place', 'Delhi', '110001', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li>\n<li><strong>Reception Desk:</strong> For immediate assistance</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n</ul>', '<h3>Local Area Information</h3>\n<ul>\n<li><strong>Public Transport:</strong> Metro/bus station within walking distance</li>\n<li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li>\n<li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li>\n<li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li>\n<li><strong>ATM:</strong> Banking services available nearby</li>\n</ul>', '<h3>Safety Information</h3>\n<ul>\n<li><strong>Fire Extinguisher:</strong> Located near main entrance</li>\n<li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li>\n<li><strong>Emergency Exits:</strong> Clearly marked on each floor</li>\n<li><strong>Security:</strong> 24/7 security personnel on premises</li>\n<li><strong>CCTV:</strong> Common areas under surveillance</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li>\n<li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li>\n<li><strong>Laundry:</strong> Washing machine available in unit or common area</li>\n<li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li>\n<li><strong>TV & Entertainment:</strong> Smart TV with streaming services</li>\n<li><strong>Housekeeping:</strong> Regular cleaning service included</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the apartment</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM</li>\n<li>No loud music or parties</li>\n<li>Maximum guests as per booking confirmation</li>\n<li>Pets not allowed unless specified</li>\n<li>Visitors allowed between 9:00 AM - 9:00 PM only</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li>\n<li><strong>Key Collection:</strong> Keys available at reception with valid ID</li>\n<li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li>\n<li><strong>Parking:</strong> Designated parking slots available</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200\",\r\n\"https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200\",\r\n\"https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200\",\r\n\"https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 3, 180, 'daily', 'weekly', 1, 2, 5, 100, 'Excitel Broadband', 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=28.6304,77.2177'),
('495d9161-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49ab220d-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Luxury 3BHK Service Apartment - Cyber City Gurgaon', 'Premium 3BHK in Cyber City with smart home features. Perfect for corporate teams.', '567 DLF Cyber City, Gurgaon', 'Cyber City', 'Haryana', '122002', 3, 3, 6, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li>\n<li><strong>Reception Desk:</strong> For immediate assistance</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n</ul>', '<h3>Local Area Information</h3>\n<ul>\n<li><strong>Public Transport:</strong> Metro/bus station within walking distance</li>\n<li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li>\n<li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li>\n<li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li>\n<li><strong>ATM:</strong> Banking services available nearby</li>\n</ul>', '<h3>Safety Information</h3>\n<ul>\n<li><strong>Fire Extinguisher:</strong> Located near main entrance</li>\n<li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li>\n<li><strong>Emergency Exits:</strong> Clearly marked on each floor</li>\n<li><strong>Security:</strong> 24/7 security personnel on premises</li>\n<li><strong>CCTV:</strong> Common areas under surveillance</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li>\n<li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li>\n<li><strong>Laundry:</strong> Washing machine available in unit or common area</li>\n<li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li>\n<li><strong>TV & Entertainment:</strong> Smart TV with streaming services</li>\n<li><strong>Housekeeping:</strong> Regular cleaning service included</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the apartment</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM</li>\n<li>No loud music or parties</li>\n<li>Maximum guests as per booking confirmation</li>\n<li>Pets not allowed unless specified</li>\n<li>Visitors allowed between 9:00 AM - 9:00 PM only</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li>\n<li><strong>Key Collection:</strong> Keys available at reception with valid ID</li>\n<li><strong>Security Deposit:</strong> Refundable deposit required at check-in</li>\n<li><strong>Parking:</strong> Designated parking slots available</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\",\r\n\"https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200\",\r\n\"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200\",\r\n\"https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 15, 200, 'Airtel Xstream', 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=28.4950,77.0890'),
('5560b34a-7399-447c-be37-e2eb5e837cb7', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, '49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'pt-001', 'Test Villa - Automated Test', 'Updated description for test villa', '123 Test Street', 'Test Area', 'Karnataka', '560001', 3, 2, 8, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-02-15 05:09:54', '2026-02-15 07:24:01', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('63bd1e87-56d0-439b-9b54-780021f18053', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'S69 Service Apt UPDATED', 'Modern service apt Bangalore', '45 MG Road', 'Indiranagar', 'Karnataka', '560038', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"12:00 PM\",\"no_pets\":true}', '{\"policy_type\":\"Strict\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:53:36', '2026-02-20 16:53:36', 7, 180, 'daily', '', 1, 1, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('6cf2e865-5d22-4660-9bcc-b147e791e0c4', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, NULL, NULL, 'Test Minimal Villa S69', NULL, NULL, NULL, NULL, NULL, 0, 0, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:49:21', '2026-02-20 16:56:16', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('6ea37a0d-b334-47cd-8e83-aaa7aedfb827', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'S69 Test Villa Goa', 'Beautiful 3BHK villa near Calangute beach with private pool', '123 Beach Road, Calangute', 'Calangute', 'Goa', '403515', 3, 2, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":24,\"partial_refund_days\":7,\"partial_refund_percentage\":50}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:50:55', '2026-02-20 16:50:55', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('7a90fef9-5a90-4f25-9c0b-b6d90f606bed', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, NULL, 'pt-001', 'Test Read S69', NULL, NULL, NULL, NULL, NULL, 0, 0, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:50:11', '2026-02-20 16:50:11', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('90d7f0a5-fd6b-4da2-b749-558ecb278ab8', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'S69 Villa Test UPDATED', 'Beach villa in Goa', '123 Beach Road', 'Calangute', 'Goa', '403515', 4, 2, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"no_smoking\":true}', '{\"policy_type\":\"Flexible\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:53:36', '2026-02-20 16:53:36', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('97050874-2602-44e5-9ac9-2f0133c73bd4', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, NULL, 'pt-001', 'T', NULL, NULL, NULL, NULL, NULL, 0, 0, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:50:24', '2026-02-20 16:50:24', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Beach Villa - Goa', 'Stunning 4BHK beachfront villa with private pool, modern amenities, and breathtaking ocean views. Perfect for families and groups. Includes housekeeping, wifi, and fully equipped kitchen.', 'Candolim Beach Road', 'Candolim', 'Goa', '403515', 4, 4, 10, 0, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Please remove shoes inside the villa\", \"Maintain cleanliness in pool area\", \"No loud music after 10 PM\"]}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Service fees are refundable if cancelled within 48 hours of booking\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200\",\r\n\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200\",\r\n\"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 3, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5183,73.7615'),
('bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Cozy Cottage - North Goa', 'Charming 2BHK cottage nestled in lush greenery, 5 minutes from Anjuna Beach. Ideal for couples seeking privacy and peace. Features garden, BBQ area, and parking.', 'Anjuna Village Road', 'Anjuna', 'Goa', '403509', 2, 2, 6, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200\",\r\n\"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200\",\r\n\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200\"]', 4.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 1, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5739,73.7400'),
('bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Premium Villa with Pool - Candolim', 'Spacious 5BHK villa with infinity pool, jacuzzi, and panoramic sea views. Walking distance to beach. Perfect for celebrations and luxury stays.', 'Candolim Beach', 'Candolim', 'Goa', '403515', 5, 5, 12, 0, NULL, '3:00 PM', '11:00 AM', '{\"check_in_after\": \"3:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": false, \"no_events\": false, \"pets_allowed\": false, \"pets_approval_required\": false, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Events and parties allowed with prior notice\", \"Professional event staff can be arranged\", \"Security deposit required for events\", \"Maximum 12 guests including event attendees\"]}', '{\"policy_type\": \"Moderate\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 14, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 14 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 14 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Premium properties require longer cancellation notice\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200\",\r\n\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200\",\r\n\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200\",\r\n\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200\",\r\n\"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 2, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5183,73.7615'),
('bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Hill View Villa - Lonavala', 'Beautiful 3BHK villa with valley views, private garden, and bonfire area. Close to major attractions like Tiger Point and Bhushi Dam.', 'Tiger Point Road', 'Tiger Point', 'Maharashtra', '410401', 3, 3, 8, 1, 45, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":true,\"pets_approval_required\":true,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li><li><strong>On-site Caretaker:</strong> For immediate assistance</li><li><strong>Security:</strong> 24/7 monitoring service</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li><li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li></ul>', '<h3>Local Area &amp; Attractions</h3><ul><li><strong>Nearest Town:</strong> 10-15 minutes drive</li><li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li><li><strong>Dining:</strong> Fine dining and local restaurants nearby</li><li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li><li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li><li><strong>Activities:</strong> Contact property manager for local experiences and tours</li></ul>', '<h3>Safety &amp; Security</h3><ul><li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li><li><strong>Secure Gates:</strong> Auto-lock gates with security code</li><li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li><li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li><li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li><li><strong>Emergency Lighting:</strong> Backup power for essential lights</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li><li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li><li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li><li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li><li><strong>WiFi:</strong> High-speed internet throughout the property</li><li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li><li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li><li><strong>Laundry:</strong> Washer and dryer available</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the villa (outdoor areas designated)</li><li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li><li>Maximum guest capacity strictly enforced</li><li>Events or parties require prior written approval</li><li>Pets allowed only with prior approval and additional deposit</li><li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li><li>BBQ area usage requires permission</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Property manager will meet you at the villa</li><li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li><li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li><li><strong>Parking:</strong> Private parking available on premises</li><li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li></ul>', '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-b63059eb-fc58-4a5f-b8a5-efe284e96679.webp\"]', 4.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 4, '2026-01-31 19:40:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=18.7533,73.4069');
INSERT INTO `properties` (`id`, `vendor_id`, `employee_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `emergency_contacts`, `local_area_info`, `safety_information`, `amenities_guide`, `house_rules_text`, `check_in_guidelines`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`, `is_recommended`, `recommended_priority`, `recommended_at`, `recommended_by`, `maps_location`) VALUES
('bb974859-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Farm Villa - Khandala', 'Exclusive 6BHK farmhouse with swimming pool, indoor games, and sprawling lawns. Perfect for large groups and events.', 'Khandala Main Road', 'Khandala', 'Maharashtra', '410301', 6, 6, 15, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 5, '2026-02-13 15:31:19', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=18.7519,73.3831'),
('bb9b250d-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Beach Villa - Alibaug', '4BHK beach-facing villa with direct beach access. Includes cook, caretaker, and all modern amenities. Great for weekend getaways.', 'Alibaug Beach Road', 'Alibaug Beach', 'Maharashtra', '402201', 4, 4, 10, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\",\r\n\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200\",\r\n\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 6, '2026-02-13 15:31:23', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=18.6414,72.8722'),
('bb9b3625-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Riverside Cottage - Alibaug', 'Peaceful 3BHK cottage by the river with fishing facilities, outdoor dining, and nature trails.', 'Riverside Lane', 'Varsoli', 'Maharashtra', '402201', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200\",\r\n\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200\",\r\n\"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=18.6500,72.8800'),
('bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Heritage Haveli - Jaipur', 'Traditional Rajasthani haveli converted into luxury 5BHK villa. Features ethnic decor, courtyard, and rooftop dining area.', 'Heritage Street', 'Heritage Street', 'Rajasthan', '302001', 5, 5, 12, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=26.9240,75.8267'),
('bb9fca40-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Royal Villa - Pink City', '3BHK villa with royal architecture, private pool, and butler service. Near major tourist attractions.', 'Pink City Road', 'Pink City', 'Rajasthan', '302002', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=26.9124,75.7873'),
('bba49bf2-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Mountain View Villa - Manali', 'Cozy 4BHK wooden villa with snow-capped mountain views, fireplace, and modern heating. Perfect for winter holidays.', 'Old Manali Road', 'Old Manali', 'Himachal Pradesh', '175131', 4, 4, 10, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200\",\r\n\"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200\",\r\n\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=32.2432,77.1892'),
('bba4ada9-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Alpine Retreat - Old Manali', 'Luxury 3BHK villa in Old Manali with apple orchard, valley views, and adventure activity arrangements.', 'Apple Orchard Lane', 'Old Manali', 'Himachal Pradesh', '175131', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200\",\r\n\"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200\",\r\n\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, 'https://www.google.com/maps?q=32.2432,77.1892'),
('be779cf5-c791-4e0e-8243-e1e17dc5a3bf', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, NULL, 'pt-002', 'Test Service Apt CRUD S69 - UPDATED', 'Test service apartment for session 69 CRUD', '45 MG Road, Indiranagar', 'Indiranagar', 'Karnataka', '560038', 2, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"12:00 PM\",\"no_pets\":true}', '{\"policy_type\":\"Strict\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-02-20 16:49:46', '2026-02-20 16:49:46', 7, 180, 'daily', '', 1, 1, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL),
('ca44b348-e9a9-4156-aadb-fd6914970cde', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', NULL, '49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'pt-001', 'Backend Test Villa', 'Complete backend workflow test property', '123 Test Address', 'Test Area', 'Karnataka', '560001', 4, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-02-15 05:15:30', '2026-02-15 07:23:56', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, NULL, NULL, NULL);

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
('0e3807f2-17dd-464d-9534-a3a04572a7ea', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('1678fd41-4021-44cb-9f16-6c0eaeaf72bc', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('1a91706e-964a-4a54-8ee3-f227971903c1', '5560b34a-7399-447c-be37-e2eb5e837cb7', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-02-15 05:09:54', '2026-02-15 05:09:54'),
('1d8db0a2-2c46-4a6c-9be5-3bae69b2e0cd', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('224bebe8-88c2-4629-a53c-cca680f57a77', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('23554c2a-10b5-4b93-8a9a-a6b0fa49c6cd', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('292d1676-0d66-4a3c-b9a0-c788f80f6bce', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('349a72d5-b963-4bec-be66-4e3e391ad48d', '5560b34a-7399-447c-be37-e2eb5e837cb7', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-02-15 05:09:54', '2026-02-15 05:09:54'),
('34c315c4-15e8-4e07-9d31-016285c8f747', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('34c34db1-6991-45e6-bc7c-1be0cd7dbdb0', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('40ace98d-31e4-4580-843b-a5898fb02466', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('44af4ff6-87be-4f84-a141-e072fdb75cfa', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4810f9ea-7351-440a-8f02-7068d070400d', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4a3d2669-ad34-4c70-9459-b3b1a580b6b5', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4a926daa-25ea-4c27-863b-66f8b6c38770', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('50eec975-02a6-4b7f-b908-a0ace824f22e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('51d3a0f4-7c8c-4505-b4d0-38f2d1a7324b', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('5e72baf4-7567-4382-a8b2-76fd12fd6bdc', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('68832012-5089-4a3c-aebe-39de77bbaccd', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('6f5a5863-ae43-4697-a1dc-075341fd2015', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('6fd990ba-9a47-41b9-8d18-7c67b2f307c6', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('718a8b53-0bc9-486d-818b-1add6f6f4ab3', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('743abd87-7da9-4aa0-946b-b6dc0a996c48', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('74e2d8d1-b5bd-4cbc-97f5-b92cc06712b9', 'ca44b348-e9a9-4156-aadb-fd6914970cde', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-02-15 05:15:30', '2026-02-15 05:15:30'),
('7996f132-3333-458e-86f6-332d6364d5b5', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('7a6e1ed6-ae8c-45b9-9158-1c992fec5676', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('8385ccd9-6fb8-4736-babe-c4740225279f', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('84916f46-6f32-432a-ae64-a699911b504e', '495d9161-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('8a02a96a-7e11-418a-b18c-7aa32c9d3b30', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('8eec9a7d-5a27-4c3c-8bf5-71a1b94da72d', '495d9161-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('92fff70b-615e-4efc-a533-6785bec440e9', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('984c29b8-5ec7-490b-8452-a57b2bdcd9b4', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('99d8075e-de50-424e-8a5a-efb4b04c9af9', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('9c3bf9f5-db71-4997-9747-6588946d8bc2', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('a0402fb8-f752-4cde-998f-71261c7d9e6b', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('b4a7043a-944f-4c27-95d3-52616a720d28', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('bbf837fa-3045-4cd1-8159-6c5c1160bc5b', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('bf569d79-171b-4cc5-858a-e026843a25b0', '495d9161-f31f-11f0-8f27-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c001d9d2-ff35-428b-8a9a-ae867885a38f', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c2735dc3-0e8d-11f1-9f1f-00410e2b5e6e', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-02-20 18:55:27', '2026-02-20 18:55:27'),
('c334ddb5-6e75-454e-b2fb-102569eca5bc', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c3a8fb4e-3821-4a0c-bd23-df0b91d678d8', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c7e68b69-5e58-41db-9823-693ac4785f90', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c7f8f421-92ff-4418-ac0e-bc5a989eb75d', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('caa211a1-8a72-43ae-88e6-b606e1169e08', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('cab93c82-ba4a-4f3e-923b-26f587ec0d11', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('cdd6bf31-fff9-425e-8970-c8db0b08a6e1', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('d8c8c0c6-147b-4037-aadd-652c78ffb521', 'ca44b348-e9a9-4156-aadb-fd6914970cde', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-02-15 05:15:30', '2026-02-15 05:15:30'),
('e12ef651-68d6-4872-afe1-e9a6f9ecec03', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('e2567e36-be27-4c8f-8d01-41316779ac02', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('e4292000-a734-415a-84b0-28c7c30f9edb', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('ea50d43c-3412-4ed8-8cb2-acc213072ae4', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('ee11ec45-d20e-4fb0-a2ee-fadbb6547312', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('efb5113e-5009-439a-bcbc-85b60f6c295d', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('f1c17683-db85-4770-a389-9fe7c4967da0', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('f605cc86-61e1-442f-9bd0-9e2dfdddcb5e', '495d9161-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('f8c5886f-b18e-4931-9cf0-4ac4e2f4a3f8', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('ffcdc051-e55b-4ec3-affa-154e4da1ccbf', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16');

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
('blackout-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-25', '2026-04-05', 'Property maintenance and deep cleaning', 'vendor', '2026-01-05 04:30:00'),
('blackout-002', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-05-10', '2026-05-15', 'Owner personal use', 'vendor', '2026-01-07 05:30:00'),
('blackout-003', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-07-01', '2026-07-10', 'Monsoon maintenance', 'admin', '2026-01-08 03:30:00');

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
('9bcd3e72-c3a5-41a8-9174-436091efbcef', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-05', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15'),
('c164bfeb-3d34-4095-b621-aad13b801526', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-03', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15'),
('cf91fa22-85e0-485f-aa42-c6a861a353f4', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 18:38:15', '2026-02-20 18:38:15');

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
('7a1644c8-8ca2-424b-9e62-885c1b2ec470', '3a49b46a-3439-4b48-86af-be81b6fdc570', '{\"max_guests\":10,\"price_per_night\":12000,\"gst_percentage\":12,\"description\":\"UPDATED: Backend test property with changes\",\"amenities\":[\"5c1b9238-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1c29d1-f3e6-11f0-8f27-00410e2b5e6e\"]}', 'pending', NULL, '2026-02-15 05:16:13', NULL),
('a85c0773-0fcf-497d-a4a6-ce0613d03cc9', '5560b34a-7399-447c-be37-e2eb5e837cb7', '{\"max_guests\":10,\"description\":\"UPDATED: This is a change request test for approved property\",\"price_per_night\":6000}', 'pending', NULL, '2026-02-15 05:10:40', NULL),
('change-req-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\": 16000, \"description\": \"Stunning 4BHK beachfront villa with private pool, modern amenities, breathtaking ocean views, and newly added jacuzzi. Perfect for families and groups.\", \"amenities\": [\"WiFi\", \"Pool\", \"Kitchen\", \"AC\", \"Parking\", \"Beach Access\", \"Jacuzzi\"], \"reason\": \"Added jacuzzi facility and updated pricing accordingly\"}', 'pending', NULL, '2026-01-10 03:30:00', NULL),
('change-req-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '{\"max_guests\": 8, \"bedrooms\": 3, \"bathrooms\": 3, \"reason\": \"Converted study room to additional bedroom with attached bathroom\"}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 04:30:00', '2026-01-09 08:30:00'),
('change-req-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\": 30000, \"reason\": \"Increased price due to high demand season\"}', 'rejected', 'bb58b3c4-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 05:30:00', '2026-01-08 09:30:00'),
('change-req-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '{\"title\": \"Hill View Villa with Hot Tub - Lonavala\", \"amenities\": [\"WiFi\", \"Garden\", \"Kitchen\", \"AC\", \"Valley View\", \"Bonfire\", \"Hot Tub\"], \"reason\": \"Added hot tub facility to enhance guest experience\"}', 'pending', NULL, '2026-01-10 02:30:00', NULL),
('change-req-005', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '{\"check_in_time\": \"1:00 PM\", \"check_out_time\": \"12:00 PM\", \"reason\": \"Updated check-in/out times for better guest convenience\"}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 04:30:00', '2026-01-07 10:30:00'),
('fc1e88c7-7dc4-45db-9128-1aaff613b916', 'ca44b348-e9a9-4156-aadb-fd6914970cde', '{\"max_guests\":10,\"price_per_night\":12000,\"gst_percentage\":12,\"description\":\"UPDATED: Backend test property with changes\",\"amenities\":[\"5c1b9238-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1c29d1-f3e6-11f0-8f27-00410e2b5e6e\"]}', 'pending', NULL, '2026-02-15 05:15:30', NULL);

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
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
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
(41, 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42');

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
(1, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(8, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 2, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(9, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 2, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(10, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 2, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(11, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(12, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(13, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(14, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(15, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(16, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(18, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(19, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(20, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(21, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(22, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(25, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(26, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(27, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(28, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(29, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(32, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(33, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(34, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(35, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(36, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(37, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(39, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(40, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(41, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(42, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(43, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(44, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(46, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(47, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(48, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(49, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(50, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16'),
(51, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 06:00:54', '2026-01-18 06:16:16');

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
('bbb56741-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 1),
('bbb567ff-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800', 2),
('bbb568ba-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', 1),
('bbb5696f-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800', 2),
('bbb56a1b-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 3);

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
  `notice_period_days` int(11) DEFAULT 30,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `discount_3_5_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 3-5 night bookings',
  `discount_6_14_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 6-14 night bookings',
  `discount_15_plus_days` decimal(5,2) DEFAULT 0.00 COMMENT 'Villa: % discount for 15+ night bookings'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_pricing`
--

INSERT INTO `property_pricing` (`id`, `property_id`, `price_per_night`, `gst_percentage`, `min_guests`, `extra_guest_charge`, `min_children`, `max_children`, `extra_child_charge`, `weekly_discount_percent`, `monthly_discount_percent`, `quarterly_discount_percent`, `long_term_discount_percent`, `allow_corporate_booking`, `corporate_discount_percent`, `deposit_amount`, `maintenance_charges`, `notice_period_days`, `created_at`, `updated_at`, `discount_3_5_days`, `discount_6_14_days`, `discount_15_plus_days`) VALUES
('0b1b82e2-b1c6-4172-b4b8-abca578adf0b', '90d7f0a5-fd6b-4da2-b749-558ecb278ab8', 18000.00, 18.00, 1, 0.00, 0, 0, 0.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:53:36', '2026-02-20 16:53:36', 0.00, 0.00, 0.00),
('0edbc1b1-4d9e-4921-9d14-238ed6c1024b', '63bd1e87-56d0-439b-9b54-780021f18053', 5500.00, 12.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:53:36', '2026-02-20 16:53:36', 0.00, 0.00, 0.00),
('2fee3377-bc4a-4428-a27d-e923797993e6', '2a13f54c-0d3b-44d0-819a-cc66bacf7884', 5000.00, 12.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:50:55', '2026-02-20 16:50:55', 0.00, 0.00, 0.00),
('534a7264-3e53-4892-8d8c-a3a9b3190684', '5560b34a-7399-447c-be37-e2eb5e837cb7', 5000.00, 18.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-15 05:09:54', '2026-02-15 05:09:54', 0.00, 0.00, 0.00),
('583e8315-161c-4dd9-8e8d-d44aafa7f74f', 'ca44b348-e9a9-4156-aadb-fd6914970cde', 10000.00, 18.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-15 05:15:30', '2026-02-15 05:15:30', 0.00, 0.00, 0.00),
('861ca4a7-317a-48a5-9191-94c1cadca563', '6ea37a0d-b334-47cd-8e83-aaa7aedfb827', 15000.00, 18.00, 1, 0.00, 0, 0, 0.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:50:55', '2026-02-20 16:50:55', 0.00, 0.00, 0.00),
('a3fbd01e-0f07-4056-b43c-fc15b0193eb4', '3a49b46a-3439-4b48-86af-be81b6fdc570', 12000.00, 12.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-15 05:16:13', '2026-02-15 05:16:13', 0.00, 0.00, 0.00),
('bf0ada60-9f0f-4cf9-9c0c-53b61564077f', 'be779cf5-c791-4e0e-8243-e1e17dc5a3bf', 5000.00, 12.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:49:46', '2026-02-20 16:49:46', 0.00, 0.00, 0.00),
('d1a10f9e-5028-4e8d-b51c-4f0c2050208f', '433758a4-1198-4b6a-ba02-7ea6619491e0', 15000.00, 18.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:49:46', '2026-02-20 16:49:46', 0.00, 0.00, 0.00),
('d8ee8407-eca5-4e3c-93f3-706ff89a0e0b', '7a90fef9-5a90-4f25-9c0b-b6d90f606bed', 10000.00, 18.00, 1, 0.00, 0, 0, 0.00, 0.00, 0.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2026-02-20 16:50:11', '2026-02-20 16:50:11', 0.00, 0.00, 0.00),
('ed2e9ce0-f3e4-11f0-8f27-00410e2b5e6e', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 3500.00, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, 30, '2026-01-16 21:05:55', '2026-02-20 18:55:27', 0.00, 0.00, 0.00),
('ed2eac68-f3e4-11f0-8f27-00410e2b5e6e', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 5000.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 25, 20000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eaf23-f3e4-11f0-8f27-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2800.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 18, 8000.00, 0.00, 7, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb07c-f3e4-11f0-8f27-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 22, 25000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb1df-f3e4-11f0-8f27-00410e2b5e6e', '495d4419-f31f-11f0-8f27-00410e2b5e6e', 4000.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 20, 12000.00, 0.00, 7, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb317-f3e4-11f0-8f27-00410e2b5e6e', '495d9161-f31f-11f0-8f27-00410e2b5e6e', 5500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 25, 20000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb451-f3e4-11f0-8f27-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 15000.00, 18.00, 4, 1500.00, 0, 4, 800.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb584-f3e4-11f0-8f27-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 8000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb6b5-f3e4-11f0-8f27-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 25000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2eb8bc-f3e4-11f0-8f27-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 12000.00, 18.00, 6, 1200.00, 0, 6, 600.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, 30, '2025-12-28 18:12:12', '2026-02-14 18:13:31', 0.00, 0.00, 0.00),
('ed2eba14-f3e4-11f0-8f27-00410e2b5e6e', 'bb974859-e418-11f0-9f30-00410e2b5e6e', 30000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ebb84-f3e4-11f0-8f27-00410e2b5e6e', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 18000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ebcf2-f3e4-11f0-8f27-00410e2b5e6e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 12000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ebe3d-f3e4-11f0-8f27-00410e2b5e6e', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 20000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ebf9c-f3e4-11f0-8f27-00410e2b5e6e', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 16000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ec0f1-f3e4-11f0-8f27-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 14000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00),
('ed2ec260-f3e4-11f0-8f27-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 12000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23', 0.00, 0.00, 0.00);

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
('3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 4.80, 'Absolutely stunning beachfront villa! The infinity pool was incredible and the staff were very attentive. Perfect for a family vacation. The rooms were spacious and clean.', NULL, 5, 5, 5, 5, 4, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-19 12:17:54', NULL, NULL),
('3b7e499b-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', NULL, 5.00, 'Best vacation rental we have ever stayed at! Everything was exactly as described. The view from the master bedroom was breathtaking. Highly recommend for anyone visiting Goa!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-26 12:17:54', NULL, NULL),
('3b7e4bbb-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 4.50, 'Cozy and peaceful cottage. Great location near Anjuna Beach. The garden was beautiful and we loved the BBQ area. Perfect for a romantic getaway.', NULL, 4, 5, 4, 5, 4, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-14 12:17:54', NULL, NULL),
('3b7e4dc8-e89e-11f0-a597-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbd09930-e418-11f0-9f30-00410e2b5e6e', 4.90, 'Luxury at its finest! The jacuzzi, infinity pool, and panoramic views made this stay unforgettable. Highly recommend for special occasions and celebrations.', NULL, 5, 5, 5, 5, 5, 4, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-29 12:17:54', NULL, NULL),
('3b7e4ed5-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', NULL, 4.70, 'Amazing property with great amenities. The beach access was convenient and the kitchen was well-equipped. Would definitely stay again!', NULL, 5, 4, 5, 5, 4, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-31 12:17:54', NULL, NULL),
('3b7e4fc9-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553ab0-e418-11f0-9f30-00410e2b5e6e', NULL, 4.60, 'Very nice cottage, perfect for couples. The only downside was the wifi was a bit slow, but overall great experience.', NULL, 4, 5, 4, 5, 5, 4, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-22 12:17:54', NULL, NULL),
('review-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'user-test-008', 'booking-test-008', 5.00, 'Absolutely Perfect Villa! This villa exceeded all our expectations. The beach view was stunning, the pool was pristine, and the staff was incredibly helpful. Highly recommend for families!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-29 04:30:00', NULL, NULL),
('review-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 4.00, 'Great Location, Peaceful Stay - Lovely cottage in a quiet area. Perfect for couples. WiFi was a bit slow but overall great experience.', NULL, 4, 5, 4, 5, 4, 4, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-30 05:30:00', NULL, NULL),
('review-test-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bbd09930-e418-11f0-9f30-00410e2b5e6e', 5.00, 'Luxury Redefined - Perfect for Celebrations. We celebrated my parents anniversary here. The infinity pool, jacuzzi, and sea views were absolutely breathtaking. The property manager arranged a beautiful cake and decorations. Will definitely return!', NULL, 5, 5, 5, 4, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-31 06:30:00', NULL, NULL),
('review-test-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-002', 4.50, 'Beautiful Valley Views - The villa has stunning valley views and the bonfire area was amazing. Kitchen was well-equipped. Only minor issue was the hot water took some time in the mornings.', NULL, 4, 4, 5, 5, 5, 4, 4.5, 'published', 0, 1, 'Rating', NULL, NULL, '2026-01-05 03:30:00', '2026-02-15 13:44:44', NULL),
('review-test-005', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 'user-test-004', 'booking-test-005', 4.00, 'Direct Beach Access - Amazing! Direct beach access was the highlight! The cook prepared delicious meals and the caretaker was very attentive. Perfect weekend getaway.', NULL, 5, 5, 3, 5, 3, 3, 4.0, 'published', 0, 1, 'Ratings', NULL, NULL, '2026-01-04 08:30:00', '2026-02-15 13:44:57', NULL),
('review-test-006', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 4.00, 'Royal Experience in Jaipur - Authentic Rajasthani architecture with modern amenities. Loved the courtyard and rooftop dining area. Great for experiencing local culture.', NULL, 4, 5, 4, 5, 4, 4, 0.0, 'pending', 0, 0, NULL, NULL, NULL, '2026-01-09 04:30:00', NULL, NULL),
('review-test-007', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-011', 4.70, 'Nice cottage with good amenities. Peaceful location perfect for relaxation.', NULL, 5, 5, 5, 3, 5, 5, 4.7, 'published', 1, 1, 'CLient', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-02-15 13:45:04', '2025-12-05 00:00:00', '2026-02-15 13:45:04', NULL),
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
  `reset_token` varchar(10) DEFAULT NULL,
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

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `status`, `created_at`, `deleted_at`, `avatar`, `address`, `bio`, `reset_token`, `reset_token_expiry`, `is_corporate_user`, `company_name`, `company_gst`, `company_email_verified`, `email_verification_token`, `email_verification_token_expiry`, `email_verified_at`, `is_temporary_password`, `password_change_required`, `created_by`, `profile_completed`, `last_password_change`) VALUES
('2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 'Test User', 'test_1767631087306@test.com', '1234567890', '$2a$10$IFE7cN/VckZtwgbSnVMimOD9EgQrjyTm38mVumUfQ9xXVpIkuRSJi', 'active', '2026-01-05 16:38:07', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('244c2909-85ef-4d38-8a0a-2723ff145942', 'Test User', 'testuser@zevio.in', '9999999999', '$2a$10$xPefuZECysURprHDo7i6lOIKmTbVoEY.w7IFEcpFQ7K3p5unFze0m', 'active', '2026-02-21 14:05:13', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'Test Booker B', 'testbooker_b@zevio.test', '9000000002', '$2a$10$WunCdjKZCiqJlHp7gUS2nu9IA9gpUu0j75/adT4Dm7IuUgjTM/I1G', 'active', '2026-03-02 16:53:39', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('4df955f5-45e7-4844-a832-9ec9e5649f5c', 'Test User', 'test_1767630472022@test.com', '1234567890', '$2a$10$KXETuyYNN8uo1XUBxA9JQu03zPLX/gnEGGJZRqwidjQMGiiuaoQya', 'active', '2026-01-05 16:27:52', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('88f47b63-ef0c-4726-9fdf-c976759d7da6', 'Ranjith', 'ranjith@thinktreemedia.in', '9945554414', '$2a$10$KoekUVESQ/.z4QNhNtAsfOqYIK/LSI319UjIXfo2ACzUuczIDYU5K', 'active', '2026-03-01 18:05:00', NULL, NULL, NULL, NULL, NULL, NULL, 1, 'Gopafy', NULL, 1, NULL, NULL, '2026-03-01 18:56:37', 0, 0, NULL, 0, '2026-03-01 18:59:54'),
('a85b436f-dde2-4b06-ae86-aca64e6b222c', 'Vinod', 'gopafyvinod@gmail.com', '7811720071', '$2a$10$2qHb5erxwyOIHHcN1ELc2eK/RWgLM/sl7GVnv2zOHd9W1LQ.wRETu', 'active', '2026-03-04 08:18:27', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-03-04 11:39:28'),
('a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'Test Booker A', 'testbooker_a@zevio.test', '9000000001', '$2a$10$iaHQ5ZsALhDCyyasG1Mq9OuiAwcadihRH9PgXH91sXNZMKsO5paOa', 'active', '2026-03-02 16:53:39', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('ae1a695c-6724-4098-bd50-73a2cf569779', 'Test User', 'test_1767631229011@test.com', '1234567890', '$2a$10$mcTBWcR5QPiIMxXEWNCApeMchTQFiWI7qWlAkbif.COPYjv9EcXI6', 'active', '2026-01-05 16:40:29', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb551978-e418-11f0-9f30-00410e2b5e6e', 'Amit Kumar', 'rajesh@example.com', '9876543210', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'Priya Sharma', 'priya@example.com', '9876543211', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553a04-e418-11f0-9f30-00410e2b5e6e', 'Ravi Singh', 'amit@example.com', '9876543212', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553ab0-e418-11f0-9f30-00410e2b5e6e', 'Sneha Reddy', 'sneha@example.com', '9876543213', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553b3e-e418-11f0-9f30-00410e2b5e6e', 'Vikram Singh', 'vikram@example.com', '9876543214', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 'Test User', 'test_1767631377325@test.com', '1234567890', '$2a$10$K5A5Z/1KuUBCry3p742ykOEFd5/7WuSph7XZ78a1oGobwDDOvtupC', 'active', '2026-01-05 16:42:57', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 'Test User', 'test_1767631170547@test.com', '1234567890', '$2a$10$OXFoboJiCN87YHVowsO7IunlcokOE1YbCThiNmBGWKLfTsx2/UifG', 'active', '2026-01-05 16:39:30', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-001', 'Rajesh Mehta', 'rajesh.mehta@test.com', '9123456780', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 04:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-002', 'Sneha Patel', 'sneha.patel@test.com', '9123456781', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 05:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-003', 'Vikram Rao', 'vikram.rao@test.com', '9123456782', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 06:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-004', 'Anjali Desai', 'anjali.desai@test.com', '9123456783', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 03:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-005', 'Karan Shah', 'karan.shah@test.com', '9123456784', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 04:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-006', 'Neha Gupta', 'neha.gupta@test.com', '9123456785', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'blocked', '2025-12-30 05:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-007', 'Arjun Nair', 'arjun.nair@test.com', '9123456786', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 02:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-008', 'Pooja Kapoor', 'pooja.kapoor@test.com', '9123456787', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 03:30:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL);

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
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bank_details`)),
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_temporary_password` tinyint(1) DEFAULT 0,
  `password_change_required` tinyint(1) DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `profile_completed` tinyint(1) DEFAULT 0,
  `last_password_change` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `email`, `password_hash`, `phone`, `gst_number`, `bank_details`, `status`, `created_at`, `deleted_at`, `avatar`, `is_temporary_password`, `password_change_required`, `created_by`, `profile_completed`, `last_password_change`) VALUES
('bb60817d-e418-11f0-9f30-00410e2b5e6e', 'Luxury Villas Pvt Ltd', 'vendor1@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543230', '29AABCU9603R1ZM', '{\"bank_name\": \"HDFC Bank\", \"account_number\": \"12345678901234\", \"ifsc\": \"HDFC0001234\", \"account_holder\": \"Luxury Villas Pvt Ltd\"}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL),
('bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'Beach Resorts Group', 'vendor2@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543231', '27AABCB1234C1Z5', '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"56789012345678\", \"ifsc\": \"ICIC0005678\", \"account_holder\": \"Beach Resorts Group\"}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL),
('bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'Mountain Retreats', 'vendor3@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543232', '07AABCM9876K1Z8', '{\"bank_name\": \"SBI\", \"account_number\": \"98765432109876\", \"ifsc\": \"SBIN0009876\", \"account_holder\": \"Mountain Retreats\"}', 'active', '2025-12-28 18:12:12', NULL, NULL, 0, 0, NULL, 0, NULL),
('f10abec0-bc8b-4688-9b73-11eef686b9f3', 'Ranjith', 'ranjithgopafy@gmail.com', '$2a$10$eGNQQgntPBCG4SgNznM8eOfQBD7Xu6jiddGU15vPEuREWKPg7wBl.', '9945554414', NULL, NULL, 'active', '2026-02-15 04:42:01', NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-02-15 04:43:40');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_settlements`
--

CREATE TABLE `vendor_settlements` (
  `id` char(36) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT NULL,
  `payment_proof` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vendor_settlements`
--

INSERT INTO `vendor_settlements` (`id`, `vendor_id`, `booking_id`, `amount`, `status`, `payment_proof`, `created_at`) VALUES
('settlement-001', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-001', 53861.98, 'paid', 'utr_vendor_test_001', '2026-01-08 05:30:00'),
('settlement-002', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'booking-test-002', 22064.11, 'paid', 'utr_vendor_test_002', '2026-01-09 06:30:00'),
('settlement-003', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 99666.00, 'paid', 'ABC', '2026-01-10 05:30:00'),
('settlement-004', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-008', 48208.64, 'paid', 'utr_vendor_test_004', '2025-12-20 00:00:00'),
('settlement-005', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'booking-test-009', 72849.00, 'paid', '51661', '2026-01-10 03:00:00'),
('settlement-006', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'booking-test-010', 24982.08, 'paid', 'utr_vendor_test_005', '2026-01-09 22:00:00');

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
('3b79bb2b-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79c8ec-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79ca44-e89e-11f0-a597-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3b79cb7b-e89e-11f0-a597-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL),
('3c03a911-bab3-4adc-8f13-96b516d9fa64', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-03-04 12:17:12', NULL),
('52b704a4-4e6d-4852-a20d-2d94273a4259', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04 12:45:07', NULL),
('70b9abac-fa96-4d8d-aa9a-9a9b10aadd00', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-10 08:59:59', NULL),
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
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `employee_claims`
--
ALTER TABLE `employee_claims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_points`
--
ALTER TABLE `employee_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `booking_id` (`booking_id`);

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
  ADD KEY `employee_id` (`employee_id`),
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
  MODIFY `invoice_number` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100013;

--
-- AUTO_INCREMENT for table `location_types`
--
ALTER TABLE `location_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `property_contacts`
--
ALTER TABLE `property_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

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
-- Constraints for table `employee_claims`
--
ALTER TABLE `employee_claims`
  ADD CONSTRAINT `employee_claims_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `employee_points`
--
ALTER TABLE `employee_points`
  ADD CONSTRAINT `employee_points_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `employee_points_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

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
  ADD CONSTRAINT `properties_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
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
