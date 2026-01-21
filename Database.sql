-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 18, 2026 at 01:29 PM
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
('bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'Super Admin', 'admin@zevio.com', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'super_admin', 'active', '2025-12-28 18:12:12', NULL, NULL),
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
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending_payment','confirmed','cancel_requested','cancelled','completed') DEFAULT 'pending_payment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `property_id`, `check_in`, `check_out`, `nights`, `guest_count`, `children_count`, `infants_count`, `base_amount`, `extra_guest_charges`, `extra_children_charges`, `gst_amount`, `discount_amount`, `total_amount`, `status`, `created_at`, `expires_at`, `deleted_at`) VALUES
('1b73aa2f-bd80-4313-accf-96ed1f8c61ed', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 4, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, 19588.00, 'cancelled', '2026-01-16 10:07:40', NULL, NULL),
('40b35828-fb3c-4069-8f95-0593a164e36d', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 4, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, 19588.00, 'cancelled', '2026-01-16 13:27:48', '2026-01-17 07:41:53', NULL),
('830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-19', '2026-01-21', 2, 4, 1, 0, 16000.00, 4000.00, 0.00, 3600.00, 0.00, 23600.00, 'cancelled', '2026-01-16 14:29:17', '2026-01-17 08:02:31', NULL),
('bbc94743-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2025-02-15', '2025-02-18', 3, 5, 2, 1, 45000.00, 1500.00, 1600.00, 8100.00, 0.00, 53100.00, 'completed', '2025-12-28 18:12:12', NULL, NULL),
('bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2025-03-10', '2025-03-12', 2, 4, 1, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, 18880.00, 'cancelled', '2025-12-28 18:12:12', NULL, NULL),
('bbd09930-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2024-12-20', '2024-12-23', 3, 8, 3, 1, 75000.00, 0.00, 3000.00, 13500.00, 7500.00, 81000.00, 'completed', '2025-12-28 18:12:12', NULL, NULL),
('beb0274a-e8e1-4d35-a70e-b035cb8332e0', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-18', '2026-01-20', 2, 5, 2, 0, 30000.00, 3000.00, 3200.00, 6516.00, 0.00, 42716.00, '', '2026-01-16 19:11:31', '2026-01-17 00:56:31', NULL),
('booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-02-15', '2026-02-18', 3, 6, 2, 1, 45000.00, 6000.00, 1600.00, 9468.00, 0.00, 61068.00, 'confirmed', '2026-01-08 05:00:00', NULL, NULL),
('booking-test-002', 'user-test-001', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-03-01', '2026-03-03', 2, 6, 4, 0, 20000.00, 0.00, 1200.00, 3816.00, 0.00, 25016.00, 'confirmed', '2026-01-09 05:30:00', NULL, NULL),
('booking-test-003', 'user-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-02-20', '2026-02-22', 2, 2, 1, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, 18880.00, 'pending_payment', '2026-01-10 03:30:00', NULL, NULL),
('booking-test-004', 'user-test-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-04-10', '2026-04-14', 4, 10, 5, 2, 100000.00, 0.00, 0.00, 18000.00, 5000.00, 113000.00, 'confirmed', '2026-01-10 04:30:00', NULL, NULL),
('booking-test-005', 'user-test-004', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-02-28', '2026-03-02', 2, 4, 2, 1, 36000.00, 0.00, 0.00, 6480.00, 0.00, 42480.00, 'confirmed', '2026-01-10 05:30:00', NULL, NULL),
('booking-test-006', 'user-test-005', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '2026-03-15', '2026-03-18', 3, 5, 1, 0, 36000.00, 0.00, 0.00, 6480.00, 0.00, 42480.00, 'cancelled', '2026-01-09 08:30:00', NULL, NULL),
('booking-test-007', 'user-test-007', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '2026-05-01', '2026-05-05', 4, 8, 3, 1, 80000.00, 0.00, 0.00, 14400.00, 0.00, 94400.00, 'cancel_requested', '2026-01-10 06:30:00', NULL, NULL),
('booking-test-008', 'user-test-008', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '2025-12-25', '2025-12-28', 3, 6, 2, 0, 48000.00, 0.00, 0.00, 8640.00, 2000.00, 54640.00, 'completed', '2025-12-20 04:30:00', NULL, NULL),
('booking-test-009', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '2026-06-15', '2026-06-20', 5, 8, 3, 1, 70000.00, 0.00, 0.00, 12600.00, 0.00, 82600.00, 'confirmed', '2026-01-10 07:30:00', NULL, NULL),
('booking-test-010', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '2026-01-10', '2026-01-12', 2, 4, 1, 0, 24000.00, 0.00, 0.00, 4320.00, 0.00, 28320.00, 'completed', '2026-01-10 02:30:00', NULL, NULL),
('booking-test-011', 'user-test-001', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2025-12-01', '2025-12-03', 2, 2, 0, 0, 16000.00, 0.00, 0.00, 2880.00, 0.00, 18880.00, 'completed', '2025-11-24 23:00:00', NULL, NULL),
('booking-test-012', 'user-test-002', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2025-11-15', '2025-11-17', 2, 6, 0, 0, 20000.00, 0.00, 0.00, 3600.00, 0.00, 23600.00, 'completed', '2025-11-10 00:00:00', NULL, NULL),
('booking-test-013', 'user-test-003', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2025-10-20', '2025-10-22', 2, 8, 2, 0, 36000.00, 6000.00, 500.00, 7650.00, 0.00, 50150.00, 'completed', '2025-10-15 01:00:00', NULL, NULL),
('booking-test-014', 'user-test-005', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '2025-09-25', '2025-09-27', 2, 10, 3, 1, 60000.00, 8000.00, 1000.00, 12420.00, 0.00, 81420.00, 'completed', '2025-09-19 22:00:00', NULL, NULL),
('e121073a-b74c-48f2-870d-9f501f29648a', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 2, 2, 0, 8000.00, 0.00, 500.00, 1530.00, 0.00, 10030.00, '', '2026-01-16 18:00:27', '2026-01-16 23:45:27', NULL),
('fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-17', '2026-01-18', 1, 3, 2, 0, 15000.00, 0.00, 1600.00, 2988.00, 0.00, 19588.00, 'cancelled', '2026-01-16 14:13:31', '2026-01-17 07:45:37', NULL);

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
  `discount_type` enum('percentage','flat') DEFAULT NULL,
  `discount_value` decimal(12,2) DEFAULT NULL,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `min_booking_amount` decimal(12,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `max_discount`, `min_booking_amount`, `start_date`, `end_date`, `usage_limit`, `status`) VALUES
('bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'WELCOME10', 'percentage', 10.00, 2000.00, 5000.00, '2025-01-01', '2025-12-31', 1000, 'active'),
('bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'SAVE500', 'flat', 500.00, 500.00, 3000.00, '2025-01-01', '2025-12-31', 500, 'active'),
('bbb9d565-e418-11f0-9f30-00410e2b5e6e', 'NEWYEAR25', 'percentage', 25.00, 5000.00, 10000.00, '2025-01-01', '2025-01-10', 100, 'active'),
('bbb9d600-e418-11f0-9f30-00410e2b5e6e', 'WEEKEND15', 'percentage', 15.00, 3000.00, 8000.00, '2025-01-01', '2025-12-31', 500, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usages`
--

CREATE TABLE `coupon_usages` (
  `id` char(36) NOT NULL,
  `coupon_id` char(36) DEFAULT NULL,
  `booking_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `coupon_usages`
--

INSERT INTO `coupon_usages` (`id`, `coupon_id`, `booking_id`, `user_id`, `used_at`) VALUES
('coupon-usage-001', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 23:30:00'),
('coupon-usage-002', 'bbb9c19d-e418-11f0-9f30-00410e2b5e6e', 'booking-test-002', 'user-test-001', '2026-01-09 00:00:00'),
('coupon-usage-003', 'bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 'user-test-003', '2026-01-09 23:00:00'),
('coupon-usage-004', 'bbb9d565-e418-11f0-9f30-00410e2b5e6e', 'booking-test-005', 'user-test-004', '2026-01-10 00:00:00'),
('coupon-usage-005', 'bbb9d3ce-e418-11f0-9f30-00410e2b5e6e', 'booking-test-008', 'user-test-008', '2025-12-19 23:05:00'),
('coupon-usage-006', 'bbb9d600-e418-11f0-9f30-00410e2b5e6e', 'booking-test-009', 'user-test-007', '2026-01-10 02:00:00');

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
('576a9bc9-593b-4f50-9d31-83d60edd0c5a', 'check_out_reminder', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
('6d6ba5b9-e24d-45ff-a09e-346a3180580c', 'daily_booking_processor', '2026-01-17', 'success', 'Processed 0 settlements'),
('d71183e4-bae3-47db-bc70-805a4704fff1', 'check_out_reminder', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('e9cfbfc4-b67e-4cc9-b23b-7747e38bdd7e', 'check_in_reminder_24h', '2026-01-16', 'success', 'Sent 0 reminders, 0 failed'),
('ee0a50ca-95dc-4163-b146-983df8ce3db8', 'check_in_reminder_24h', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
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
('17e48938-22ae-4e63-842f-360c6ff13565', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'e121073a-b74c-48f2-870d-9f501f29648a', 400.00, 'pending', '2026-01-16 18:00:27'),
('2b079235-1c83-479c-845c-ffabb9759f28', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '40b35828-fb3c-4069-8f95-0593a164e36d', 750.00, 'pending', '2026-01-16 14:08:05'),
('70643fc7-1075-4906-9f5b-cb236b66b778', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 750.00, 'pending', '2026-01-16 14:14:17'),
('71e49ef8-05d1-4a56-9b08-cc3d26844b07', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '40b35828-fb3c-4069-8f95-0593a164e36d', 750.00, 'pending', '2026-01-16 13:27:48'),
('784e2af0-1771-4b82-a388-b95bd161b559', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 800.00, 'pending', '2026-01-16 14:29:17'),
('8bb4a3e5-9097-4668-8917-ea4d3aa12136', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 750.00, 'pending', '2026-01-16 14:13:31'),
('8c85c102-9884-451a-8c2d-ac9282ee0928', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '1b73aa2f-bd80-4313-accf-96ed1f8c61ed', 750.00, 'pending', '2026-01-16 10:07:40'),
('93f0c5e6-9ee5-4cf4-9d43-bef427d56a3f', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 750.00, 'pending', '2026-01-16 14:15:37'),
('9705ba68-f345-48b4-acd3-21c7674612a5', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '40b35828-fb3c-4069-8f95-0593a164e36d', 750.00, 'pending', '2026-01-16 14:11:53'),
('dfdb0d55-f039-4d94-8238-4103b8002af3', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'beb0274a-e8e1-4d35-a70e-b035cb8332e0', 1500.00, 'pending', '2026-01-16 19:11:31'),
('e700d524-26d9-40dc-b616-4ff296b46114', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', '830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 800.00, 'pending', '2026-01-16 14:32:31'),
('emp-points-001', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-001', 3053.40, 'confirmed', '2026-01-08 05:05:00'),
('emp-points-002', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-002', 1250.80, 'confirmed', '2026-01-09 05:35:00'),
('emp-points-003', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 5085.00, 'confirmed', '2026-01-10 04:35:00'),
('emp-points-004', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-010', 1416.00, 'confirmed', '2026-01-10 02:35:00'),
('emp-points-005', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-008', 2418.40, 'confirmed', '2025-12-19 23:15:00'),
('emp-points-006', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'booking-test-009', 3650.00, 'confirmed', '2026-01-10 02:10:00'),
('emp-points-007', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'booking-test-011', 833.28, 'confirmed', '2025-11-24 23:10:00');

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
('invoice-001', 100001, 'booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 51600.00, 9468.00, 61068.00, 'invoice', '2026-01-08 05:05:00'),
('invoice-002', 100002, 'booking-test-002', 'user-test-001', 21200.00, 3816.00, 25016.00, 'invoice', '2026-01-09 05:35:00'),
('invoice-003', 100003, 'booking-test-004', 'user-test-003', 95000.00, 18000.00, 113000.00, 'invoice', '2026-01-10 04:35:00'),
('invoice-004', 100004, 'booking-test-005', 'user-test-004', 36000.00, 6480.00, 42480.00, 'invoice', '2026-01-10 05:35:00'),
('invoice-005', 100005, 'booking-test-008', 'user-test-008', 46000.00, 8640.00, 54640.00, 'invoice', '2025-12-20 04:40:00'),
('invoice-006', 100006, 'booking-test-006', 'user-test-005', 21240.00, 0.00, 21240.00, 'credit_note', '2026-01-09 10:30:00'),
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
('04ea0e84-38d9-474e-9ea5-15245f585833', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 'razorpay', 'order_S4ZyBEKuOTLhGi', 19588.00, 'pending', '2026-01-16 14:14:17'),
('09e9b52a-0292-454a-b519-f34b2c9ec24e', 'beb0274a-e8e1-4d35-a70e-b035cb8332e0', 'razorpay', 'order_S4f2BbuU3AwhdE', 42716.00, 'pending', '2026-01-16 19:11:32'),
('0eeee500-e912-43e9-8b90-1d6ff4291449', '830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 'razorpay', 'order_S4aE0y9SAwZ9Ad', 23600.00, 'pending', '2026-01-16 14:29:17'),
('13a2b144-5441-4c4a-92e9-9dbe34c8a0cc', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 'razorpay', 'order_S4ZxN6RXP0Rmc0', 19588.00, 'pending', '2026-01-16 14:13:31'),
('3f6c12ef-5165-4b49-ab1e-c748752678ee', '1b73aa2f-bd80-4313-accf-96ed1f8c61ed', 'razorpay', 'order_S4VlgrDGjqdL3K', 19588.00, 'pending', '2026-01-16 10:07:41'),
('4133135a-f535-422e-ad0a-52a3fb086822', 'fb174d45-d4cc-4ef1-a9ab-7e4c816d9166', 'razorpay', 'order_S4ZzaIA4yhc3Ob', 19588.00, 'pending', '2026-01-16 14:15:37'),
('4743de83-040c-47a1-afca-39816ad59939', '40b35828-fb3c-4069-8f95-0593a164e36d', 'razorpay', 'order_S4Zve4j2CAYa2X', 19588.00, 'pending', '2026-01-16 14:11:53'),
('5cf58a66-cb64-4e5d-a669-f22c37723017', '830cd3d6-0ffb-47dd-b5f0-59611c66b88c', 'razorpay', 'order_S4aHR0U3u6D8BG', 23600.00, 'pending', '2026-01-16 14:32:31'),
('8abe5a9e-acea-4814-a1fe-c2d4f978e223', 'e121073a-b74c-48f2-870d-9f501f29648a', 'razorpay', 'order_S4dp8B8DAbQ5y8', 10030.00, 'pending', '2026-01-16 18:00:29'),
('8d97e859-a2a7-4d45-a791-32006658a7c3', '40b35828-fb3c-4069-8f95-0593a164e36d', 'razorpay', 'order_S4ZB5ujbLuCmsF', 19588.00, 'pending', '2026-01-16 13:27:49'),
('bbd7cb58-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 'razorpay', 'pay_test_123456789', 53100.00, 'success', '2025-12-28 18:12:13'),
('df9858f2-30f3-48e7-a756-d7e75684f29b', '40b35828-fb3c-4069-8f95-0593a164e36d', 'razorpay', 'order_S4ZrdaulDZ18RI', 19588.00, 'pending', '2026-01-16 14:08:06'),
('payment-test-001', 'booking-test-001', 'razorpay', 'pay_rzp_test_001', 61068.00, 'success', '2026-01-08 05:05:00'),
('payment-test-002', 'booking-test-002', 'razorpay', 'pay_rzp_test_002', 25016.00, 'success', '2026-01-09 05:35:00'),
('payment-test-003-fail', 'booking-test-003', 'razorpay', 'pay_rzp_test_003_fail', 18880.00, 'failed', '2026-01-10 03:35:00'),
('payment-test-003-pending', 'booking-test-003', 'razorpay', 'pay_rzp_test_003_pending', 18880.00, 'pending', '2026-01-10 03:40:00'),
('payment-test-004', 'booking-test-004', 'razorpay', 'pay_rzp_test_004', 113000.00, 'success', '2026-01-10 04:35:00'),
('payment-test-005', 'booking-test-005', 'razorpay', 'pay_rzp_test_005', 42480.00, 'success', '2026-01-10 05:35:00'),
('payment-test-006', 'booking-test-006', 'razorpay', 'pay_rzp_test_006', 42480.00, 'success', '2026-01-09 07:30:00'),
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
  `furnishing_type` enum('fully_furnished','semi_furnished','unfurnished') DEFAULT 'fully_furnished' COMMENT 'Furnishing level'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `employee_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`) VALUES
('27c960ac-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Modern 2BHK Service Apartment - Koramangala', 'Fully furnished 2BHK service apartment in the heart of Koramangala', '123 5th Block, Koramangala', 'Koramangala', 'Karnataka', '560095', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:05:55', NULL, 3, 180, 'daily', 'weekly', 1, 2, 3, 100, 'ACT Fibernet', 'fully_furnished'),
('495ba81d-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49a8ed77-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Luxury 3BHK Service Apartment - Whitefield', 'Premium 3BHK service apartment in Whitefield with gym, pool, and concierge services. Ideal for corporate teams and long-term stays.', '456 Prestige Tech Park Road, Whitefield', 'Whitefield', 'Karnataka', '560066', 3, 3, 6, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 12, 200, 'Airtel Xstream', 'fully_furnished'),
('495ca2b2-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Compact 1BHK Service Apartment - Andheri East', 'Cozy 1BHK service apartment near Andheri East metro station, perfect for solo professionals.', '789 Chakala Road, Andheri East', 'Andheri East', 'Maharashtra', '400093', 1, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 3, 180, 'weekly', 'weekly', 1, 0, 8, 100, 'Hathway Broadband', 'fully_furnished'),
('495cf369-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Premium 2BHK Service Apartment - BKC', 'Luxury 2BHK in Bandra Kurla Complex with stunning city views. Perfect for corporate executives.', '101 Peninsula Tower, BKC', 'BKC', 'Maharashtra', '400051', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 18, 200, 'Jio Fiber', 'fully_furnished'),
('495d4419-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49ab220d-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Corporate 2BHK Service Apartment - Connaught Place', 'Professional 2BHK in central Delhi, ideal for government and corporate bookings.', '234 Barakhamba Road, Connaught Place', 'Connaught Place', 'Delhi', '110001', 2, 2, 4, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 3, 180, 'daily', 'weekly', 1, 2, 5, 100, 'Excitel Broadband', 'fully_furnished'),
('495d9161-f31f-11f0-8f27-00410e2b5e6e', NULL, NULL, '49ab220d-f31e-11f0-8f27-00410e2b5e6e', 'pt-002', 'Luxury 3BHK Service Apartment - Cyber City Gurgaon', 'Premium 3BHK in Cyber City with smart home features. Perfect for corporate teams.', '567 DLF Cyber City, Gurgaon', 'Cyber City', 'Haryana', '122002', 3, 3, 6, 0, NULL, '2:00 PM', '11:00 AM', NULL, NULL, '[\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 21:06:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 15, 200, 'Airtel Xstream', 'fully_furnished'),
('bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Beach Villa - Goa', 'Stunning 4BHK beachfront villa with private pool, modern amenities, and breathtaking ocean views. Perfect for families and groups. Includes housekeeping, wifi, and fully equipped kitchen.', 'Candolim Beach Road', NULL, 'Goa', '403515', 4, 4, 10, 0, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Please remove shoes inside the villa\", \"Maintain cleanliness in pool area\", \"No loud music after 10 PM\"]}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Service fees are refundable if cancelled within 48 hours of booking\"}', '[\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800\", \"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800\", \"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Cozy Cottage - North Goa', 'Charming 2BHK cottage nestled in lush greenery, 5 minutes from Anjuna Beach. Ideal for couples seeking privacy and peace. Features garden, BBQ area, and parking.', 'Anjuna Village Road', NULL, 'Goa', '403509', 2, 2, 6, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\", \"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800\"]', 4.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Premium Villa with Pool - Candolim', 'Spacious 5BHK villa with infinity pool, jacuzzi, and panoramic sea views. Walking distance to beach. Perfect for celebrations and luxury stays.', 'Candolim Beach', NULL, 'Goa', '403515', 5, 5, 12, 0, NULL, '3:00 PM', '11:00 AM', '{\"check_in_after\": \"3:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": false, \"no_events\": false, \"pets_allowed\": false, \"pets_approval_required\": false, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Events and parties allowed with prior notice\", \"Professional event staff can be arranged\", \"Security deposit required for events\", \"Maximum 12 guests including event attendees\"]}', '{\"policy_type\": \"Moderate\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 14, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 14 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 14 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Premium properties require longer cancellation notice\"}', '[\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800\", \"https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800\", \"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Hill View Villa - Lonavala', 'Beautiful 3BHK villa with valley views, private garden, and bonfire area. Close to major attractions like Tiger Point and Bhushi Dam.', 'Tiger Point Road', NULL, 'Maharashtra', '410401', 3, 3, 8, 1, 45, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\"]', 4.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb974859-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Farm Villa - Khandala', 'Exclusive 6BHK farmhouse with swimming pool, indoor games, and sprawling lawns. Perfect for large groups and events.', 'Khandala Main Road', NULL, 'Maharashtra', '410301', 6, 6, 15, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9b250d-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Beach Villa - Alibaug', '4BHK beach-facing villa with direct beach access. Includes cook, caretaker, and all modern amenities. Great for weekend getaways.', 'Alibaug Beach Road', NULL, 'Maharashtra', '402201', 4, 4, 10, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\"]', 5.00, 1, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9b3625-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Riverside Cottage - Alibaug', 'Peaceful 3BHK cottage by the river with fishing facilities, outdoor dining, and nature trails.', 'Riverside Lane', NULL, 'Maharashtra', '402201', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Heritage Haveli - Jaipur', 'Traditional Rajasthani haveli converted into luxury 5BHK villa. Features ethnic decor, courtyard, and rooftop dining area.', 'Heritage Street', NULL, 'Rajasthan', '302001', 5, 5, 12, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bb9fca40-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Royal Villa - Pink City', '3BHK villa with royal architecture, private pool, and butler service. Near major tourist attractions.', 'Pink City Road', NULL, 'Rajasthan', '302002', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bba49bf2-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Mountain View Villa - Manali', 'Cozy 4BHK wooden villa with snow-capped mountain views, fireplace, and modern heating. Perfect for winter holidays.', 'Old Manali Road', NULL, 'Himachal Pradesh', '175131', 4, 4, 10, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished'),
('bba4ada9-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Alpine Retreat - Old Manali', 'Luxury 3BHK villa in Old Manali with apple orchard, valley views, and adventure activity arrangements.', 'Apple Orchard Lane', NULL, 'Himachal Pradesh', '175131', 3, 3, 8, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": []}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Standard flexible cancellation policy\"}', '[\"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800\"]', 0.00, 0, 'approved', '2025-12-28 18:12:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished');

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
('1d8db0a2-2c46-4a6c-9be5-3bae69b2e0cd', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('224bebe8-88c2-4629-a53c-cca680f57a77', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('23554c2a-10b5-4b93-8a9a-a6b0fa49c6cd', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('292d1676-0d66-4a3c-b9a0-c788f80f6bce', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('2c3328fc-2648-444b-95f2-6ec5912220f5', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('34c315c4-15e8-4e07-9d31-016285c8f747', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('34c34db1-6991-45e6-bc7c-1be0cd7dbdb0', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('3e734758-7e3d-4585-b108-1910d0da8af3', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('40ace98d-31e4-4580-843b-a5898fb02466', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('44af4ff6-87be-4f84-a141-e072fdb75cfa', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4810f9ea-7351-440a-8f02-7068d070400d', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4a3d2669-ad34-4c70-9459-b3b1a580b6b5', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('4a926daa-25ea-4c27-863b-66f8b6c38770', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('50eec975-02a6-4b7f-b908-a0ace824f22e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('51d3a0f4-7c8c-4505-b4d0-38f2d1a7324b', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('58f64e2c-e9ac-4ca7-9a89-05cf3542058d', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('5e72baf4-7567-4382-a8b2-76fd12fd6bdc', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('632f0251-256e-4c37-941b-c86965605dc7', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('68832012-5089-4a3c-aebe-39de77bbaccd', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('6f5a5863-ae43-4697-a1dc-075341fd2015', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('6fd990ba-9a47-41b9-8d18-7c67b2f307c6', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('718a8b53-0bc9-486d-818b-1add6f6f4ab3', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('743abd87-7da9-4aa0-946b-b6dc0a996c48', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
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
('c334ddb5-6e75-454e-b2fb-102569eca5bc', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c3a8fb4e-3821-4a0c-bd23-df0b91d678d8', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c6ad23b9-dbfd-4ae9-93fe-81a8ceafb78f', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c7e68b69-5e58-41db-9823-693ac4785f90', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('c7f8f421-92ff-4418-ac0e-bc5a989eb75d', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('caa211a1-8a72-43ae-88e6-b606e1169e08', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('cab93c82-ba4a-4f3e-923b-26f587ec0d11', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('cdd6bf31-fff9-425e-8970-c8db0b08a6e1', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('d37b2523-47af-450f-bb2f-337e1500d126', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
('dd0476ac-3ff2-4f62-8740-47fe1ef4901b', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-01-17 20:51:50', '2026-01-18 06:16:16'),
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
('change-req-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\": 16000, \"description\": \"Stunning 4BHK beachfront villa with private pool, modern amenities, breathtaking ocean views, and newly added jacuzzi. Perfect for families and groups.\", \"amenities\": [\"WiFi\", \"Pool\", \"Kitchen\", \"AC\", \"Parking\", \"Beach Access\", \"Jacuzzi\"], \"reason\": \"Added jacuzzi facility and updated pricing accordingly\"}', 'pending', NULL, '2026-01-10 03:30:00', NULL),
('change-req-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '{\"max_guests\": 8, \"bedrooms\": 3, \"bathrooms\": 3, \"reason\": \"Converted study room to additional bedroom with attached bathroom\"}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 04:30:00', '2026-01-09 08:30:00'),
('change-req-003', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\": 30000, \"reason\": \"Increased price due to high demand season\"}', 'rejected', 'bb58b3c4-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 05:30:00', '2026-01-08 09:30:00'),
('change-req-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '{\"title\": \"Hill View Villa with Hot Tub - Lonavala\", \"amenities\": [\"WiFi\", \"Garden\", \"Kitchen\", \"AC\", \"Valley View\", \"Bonfire\", \"Hot Tub\"], \"reason\": \"Added hot tub facility to enhance guest experience\"}', 'pending', NULL, '2026-01-10 02:30:00', NULL),
('change-req-005', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '{\"check_in_time\": \"1:00 PM\", \"check_out_time\": \"12:00 PM\", \"reason\": \"Updated check-in/out times for better guest convenience\"}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 04:30:00', '2026-01-07 10:30:00');

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
(1, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(7, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 1, 'Rajesh Kumar', '+919876543210', 'rajesh.kumar@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(8, 'bb929607-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(9, 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
(10, 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 1, 'Amit Patel', '+919123456789', 'amit.patel@zevio.com', '+919123456789', NULL, 1, '2026-01-18 10:33:42', '2026-01-18 10:33:42'),
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_pricing`
--

INSERT INTO `property_pricing` (`id`, `property_id`, `price_per_night`, `gst_percentage`, `min_guests`, `extra_guest_charge`, `min_children`, `max_children`, `extra_child_charge`, `weekly_discount_percent`, `monthly_discount_percent`, `quarterly_discount_percent`, `long_term_discount_percent`, `allow_corporate_booking`, `corporate_discount_percent`, `deposit_amount`, `maintenance_charges`, `notice_period_days`, `created_at`, `updated_at`) VALUES
('ed2e9ce0-f3e4-11f0-8f27-00410e2b5e6e', '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 3500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 20, 10000.00, 0.00, 7, '2026-01-16 21:05:55', '2026-01-17 20:41:23'),
('ed2eac68-f3e4-11f0-8f27-00410e2b5e6e', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 5000.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 25, 20000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23'),
('ed2eaf23-f3e4-11f0-8f27-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2800.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 18, 8000.00, 0.00, 7, '2026-01-16 21:06:52', '2026-01-17 20:41:23'),
('ed2eb07c-f3e4-11f0-8f27-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 22, 25000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23'),
('ed2eb1df-f3e4-11f0-8f27-00410e2b5e6e', '495d4419-f31f-11f0-8f27-00410e2b5e6e', 4000.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 20, 12000.00, 0.00, 7, '2026-01-16 21:06:52', '2026-01-17 20:41:23'),
('ed2eb317-f3e4-11f0-8f27-00410e2b5e6e', '495d9161-f31f-11f0-8f27-00410e2b5e6e', 5500.00, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 25, 20000.00, 0.00, 14, '2026-01-16 21:06:52', '2026-01-17 20:41:23'),
('ed2eb451-f3e4-11f0-8f27-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 15000.00, 18.00, 4, 1500.00, 0, 4, 800.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2eb584-f3e4-11f0-8f27-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 8000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2eb6b5-f3e4-11f0-8f27-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 25000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2eb8bc-f3e4-11f0-8f27-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 10000.00, 18.00, 6, 1200.00, 0, 6, 600.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2eba14-f3e4-11f0-8f27-00410e2b5e6e', 'bb974859-e418-11f0-9f30-00410e2b5e6e', 30000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ebb84-f3e4-11f0-8f27-00410e2b5e6e', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 18000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ebcf2-f3e4-11f0-8f27-00410e2b5e6e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 12000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ebe3d-f3e4-11f0-8f27-00410e2b5e6e', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 20000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ebf9c-f3e4-11f0-8f27-00410e2b5e6e', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 16000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ec0f1-f3e4-11f0-8f27-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 14000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23'),
('ed2ec260-f3e4-11f0-8f27-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 12000.00, 18.00, 2, 1000.00, 1, 4, 500.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, 30, '2025-12-28 18:12:12', '2026-01-17 20:41:23');

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
('pt-002', 'Service Apartment', 'service-apartment', 'long_term', 'FiBuilding', 'Fully serviced apartments for extended stays (7-180 days)', 1, 2, '2026-01-16 20:55:59'),
('pt-003', 'Cottage', 'cottage', 'short_term', 'FiHome', 'Cozy cottages in nature', 1, 3, '2026-01-16 20:55:59'),
('pt-004', 'Penthouse', 'penthouse', 'hybrid', 'FiTrendingUp', 'Luxury penthouses for short or long stays', 1, 4, '2026-01-16 20:55:59');

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

--
-- Dumping data for table `refunds`
--

INSERT INTO `refunds` (`id`, `booking_id`, `payment_id`, `refund_percentage`, `refund_amount`, `gateway_refund_id`, `status`, `created_at`) VALUES
('refund-test-001', 'booking-test-006', 'payment-test-006', 50.00, 21240.00, 'rfnd_rzp_test_001', 'completed', '2026-01-09 09:00:00');

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
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `property_id`, `user_id`, `booking_id`, `rating`, `review_text`, `cleanliness_rating`, `accuracy_rating`, `communication_rating`, `location_rating`, `check_in_rating`, `value_rating`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
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
  `reset_token` varchar(10) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `is_corporate_user` tinyint(1) DEFAULT 0 COMMENT 'User booking for company',
  `company_name` varchar(255) DEFAULT NULL COMMENT 'Company name',
  `company_gst` varchar(15) DEFAULT NULL COMMENT 'Company GST number',
  `company_email_verified` tinyint(1) DEFAULT 0 COMMENT 'Company email verified',
  `email_verification_token` varchar(255) DEFAULT NULL COMMENT 'Email verification token',
  `email_verified_at` timestamp NULL DEFAULT NULL COMMENT 'Email verification timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `status`, `created_at`, `deleted_at`, `avatar`, `reset_token`, `reset_token_expiry`, `is_corporate_user`, `company_name`, `company_gst`, `company_email_verified`, `email_verification_token`, `email_verified_at`) VALUES
('2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 'Test User', 'test_1767631087306@test.com', '1234567890', '$2a$10$IFE7cN/VckZtwgbSnVMimOD9EgQrjyTm38mVumUfQ9xXVpIkuRSJi', 'active', '2026-01-05 16:38:07', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('4df955f5-45e7-4844-a832-9ec9e5649f5c', 'Test User', 'test_1767630472022@test.com', '1234567890', '$2a$10$KXETuyYNN8uo1XUBxA9JQu03zPLX/gnEGGJZRqwidjQMGiiuaoQya', 'active', '2026-01-05 16:27:52', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('ae1a695c-6724-4098-bd50-73a2cf569779', 'Test User', 'test_1767631229011@test.com', '1234567890', '$2a$10$mcTBWcR5QPiIMxXEWNCApeMchTQFiWI7qWlAkbif.COPYjv9EcXI6', 'active', '2026-01-05 16:40:29', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('bb551978-e418-11f0-9f30-00410e2b5e6e', 'Amit Kumar', 'rajesh@example.com', '9876543210', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'Priya Sharma', 'priya@example.com', '9876543211', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('bb553a04-e418-11f0-9f30-00410e2b5e6e', 'Ravi Singh', 'amit@example.com', '9876543212', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('bb553ab0-e418-11f0-9f30-00410e2b5e6e', 'Sneha Reddy', 'sneha@example.com', '9876543213', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('bb553b3e-e418-11f0-9f30-00410e2b5e6e', 'Vikram Singh', 'vikram@example.com', '9876543214', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 'Test User', 'test_1767631377325@test.com', '1234567890', '$2a$10$K5A5Z/1KuUBCry3p742ykOEFd5/7WuSph7XZ78a1oGobwDDOvtupC', 'active', '2026-01-05 16:42:57', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 'Test User', 'test_1767631170547@test.com', '1234567890', '$2a$10$OXFoboJiCN87YHVowsO7IunlcokOE1YbCThiNmBGWKLfTsx2/UifG', 'active', '2026-01-05 16:39:30', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-001', 'Rajesh Mehta', 'rajesh.mehta@test.com', '9123456780', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 04:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-002', 'Sneha Patel', 'sneha.patel@test.com', '9123456781', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 05:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-003', 'Vikram Rao', 'vikram.rao@test.com', '9123456782', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-29 06:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-004', 'Anjali Desai', 'anjali.desai@test.com', '9123456783', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 03:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-005', 'Karan Shah', 'karan.shah@test.com', '9123456784', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-30 04:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-006', 'Neha Gupta', 'neha.gupta@test.com', '9123456785', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'blocked', '2025-12-30 05:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-007', 'Arjun Nair', 'arjun.nair@test.com', '9123456786', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 02:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL),
('user-test-008', 'Pooja Kapoor', 'pooja.kapoor@test.com', '9123456787', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-31 03:30:00', NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL);

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
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `email`, `password_hash`, `phone`, `gst_number`, `bank_details`, `status`, `created_at`, `deleted_at`, `avatar`) VALUES
('bb60817d-e418-11f0-9f30-00410e2b5e6e', 'Luxury Villas Pvt Ltd', 'vendor1@example.com', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', '9876543230', '29AABCU9603R1ZM', '{\"bank_name\": \"HDFC Bank\", \"account_number\": \"12345678901234\", \"ifsc\": \"HDFC0001234\", \"account_holder\": \"Luxury Villas Pvt Ltd\"}', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'Beach Resorts Group', 'vendor2@example.com', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', '9876543231', '27AABCB1234C1Z5', '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"56789012345678\", \"ifsc\": \"ICIC0005678\", \"account_holder\": \"Beach Resorts Group\"}', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'Mountain Retreats', 'vendor3@example.com', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', '9876543232', '07AABCM9876K1Z8', '{\"bank_name\": \"SBI\", \"account_number\": \"98765432109876\", \"ifsc\": \"SBIN0009876\", \"account_holder\": \"Mountain Retreats\"}', 'active', '2025-12-28 18:12:12', NULL, NULL);

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
('settlement-003', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'booking-test-004', 99666.00, 'pending', NULL, '2026-01-10 05:30:00'),
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
('70b9abac-fa96-4d8d-aa9a-9a9b10aadd00', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-10 08:59:59', NULL),
('wishlist-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:30:00', NULL),
('wishlist-test-002', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:45:00', NULL),
('wishlist-test-003', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-01-06 03:30:00', NULL),
('wishlist-test-004', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 05:30:00', NULL),
('wishlist-test-005', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 08:30:00', NULL),
('wishlist-test-006', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-04 04:30:00', NULL),
('wishlist-test-007', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:30:00', NULL),
('wishlist-test-008', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '2026-01-06 04:30:00', NULL),
('wishlist-test-009', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 04:30:00', NULL),
('wishlist-test-010', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '2026-01-04 04:30:00', NULL),
('wishlist-test-011', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 04:30:00', NULL),
('wishlist-test-012', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 04:30:00', NULL),
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
  ADD KEY `idx_user_history` (`user_id`,`created_at`);

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
  ADD UNIQUE KEY `code` (`code`);

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
  ADD KEY `idx_deleted_status` (`deleted_at`,`status`);

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
  ADD UNIQUE KEY `unique_user_property` (`user_id`,`property_id`,`deleted_at`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `invoice_number` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100011;

--
-- AUTO_INCREMENT for table `location_types`
--
ALTER TABLE `location_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `property_contacts`
--
ALTER TABLE `property_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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
