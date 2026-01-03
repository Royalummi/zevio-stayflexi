-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 03, 2026 at 01:18 PM
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
('bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'Super Admin', 'admin@zevio.com', '$2a$10$9g7.OhgqaB0fKSsXR.dS/OOsFufK/b25zJlyU2jwHbwVaPxEAEb7O', 'super_admin', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'John Admin', 'john.admin@zevio.com', '$2a$10$9g7.OhgqaB0fKSsXR.dS/OOsFufK/b25zJlyU2jwHbwVaPxEAEb7O', 'admin', 'active', '2025-12-28 18:12:12', NULL, NULL);

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
  `base_amount` decimal(12,2) DEFAULT NULL,
  `gst_amount` decimal(12,2) DEFAULT NULL,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `status` enum('pending_payment','confirmed','cancel_requested','cancelled','completed') DEFAULT 'pending_payment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `property_id`, `check_in`, `check_out`, `nights`, `base_amount`, `gst_amount`, `discount_amount`, `total_amount`, `status`, `created_at`, `deleted_at`) VALUES
('bbc94743-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2025-02-15', '2025-02-18', 3, 45000.00, 8100.00, 0.00, 53100.00, 'confirmed', '2025-12-28 18:12:12', NULL),
('bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2025-03-10', '2025-03-12', 2, 16000.00, 2880.00, 0.00, 18880.00, 'pending_payment', '2025-12-28 18:12:12', NULL),
('bbd09930-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2024-12-20', '2024-12-23', 3, 75000.00, 13500.00, 7500.00, 81000.00, 'completed', '2025-12-28 18:12:12', NULL);

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
('bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'Rahul Employee', 'rahul.emp@zevio.com', '9876543220', '$2a$10$I0E5YY7gZF/n9YKX/b3AN./Dc4gVuXqBd/jopfuOvqjDVbdrqvMse', 5.00, 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'Neha Employee', 'neha.emp@zevio.com', '9876543221', '$2a$10$I0E5YY7gZF/n9YKX/b3AN./Dc4gVuXqBd/jopfuOvqjDVbdrqvMse', 4.50, 'active', '2025-12-28 18:12:12', NULL, NULL);

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
('bbd7cb58-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 'razorpay', 'pay_test_123456789', 53100.00, 'success', '2025-12-28 18:12:13');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` char(36) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `city_id` char(36) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `max_guests` int(11) DEFAULT 2,
  `amenities` text DEFAULT NULL,
  `photos` text DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `reviews_count` int(11) DEFAULT 0,
  `price_per_night` decimal(12,2) DEFAULT NULL,
  `gst_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','inactive') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `employee_id`, `city_id`, `title`, `description`, `address`, `city`, `state`, `pincode`, `bedrooms`, `bathrooms`, `max_guests`, `amenities`, `photos`, `rating`, `reviews_count`, `price_per_night`, `gst_percentage`, `status`, `created_at`, `deleted_at`) VALUES
('bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'Luxury Beach Villa - Goa', 'Stunning 4BHK beachfront villa with private pool, modern amenities, and breathtaking ocean views. Perfect for families and groups. Includes housekeeping, wifi, and fully equipped kitchen.', 'Candolim Beach Road', 'Goa', 'Goa', '403515', 4, 4, 10, '[\"WiFi\", \"Pool\", \"Kitchen\", \"AC\", \"Parking\", \"Beach Access\"]', '[\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800\", \"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800\", \"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800\"]', 4.83, 3, 15000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'Cozy Cottage - North Goa', 'Charming 2BHK cottage nestled in lush greenery, 5 minutes from Anjuna Beach. Ideal for couples seeking privacy and peace. Features garden, BBQ area, and parking.', 'Anjuna Village Road', 'Goa', 'Goa', '403509', 2, 2, 6, '[\"WiFi\", \"Garden\", \"Kitchen\", \"AC\", \"BBQ Area\"]', '[\"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800\", \"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800\"]', 4.55, 2, 8000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'Premium Villa with Pool - Candolim', 'Spacious 5BHK villa with infinity pool, jacuzzi, and panoramic sea views. Walking distance to beach. Perfect for celebrations and luxury stays.', 'Candolim Beach', 'Goa', 'Goa', '403515', 5, 5, 12, '[\"WiFi\", \"Infinity Pool\", \"Jacuzzi\", \"Kitchen\", \"AC\", \"Sea View\", \"Gym\"]', '[\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800\", \"https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800\", \"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800\"]', 4.90, 1, 25000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'Hill View Villa - Lonavala', 'Beautiful 3BHK villa with valley views, private garden, and bonfire area. Close to major attractions like Tiger Point and Bhushi Dam.', 'Tiger Point Road', 'Lonavala', 'Maharashtra', '410401', 3, 3, 8, '[\"WiFi\", \"Garden\", \"Kitchen\", \"AC\", \"Valley View\", \"Bonfire\"]', '[\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800\"]', 0.00, 0, 10000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb974859-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'Luxury Farm Villa - Khandala', 'Exclusive 6BHK farmhouse with swimming pool, indoor games, and sprawling lawns. Perfect for large groups and events.', 'Khandala Main Road', 'Lonavala', 'Maharashtra', '410301', 6, 6, 15, '[\"WiFi\", \"Pool\", \"Kitchen\", \"AC\", \"Lawn\", \"Indoor Games\"]', '[\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800\"]', 0.00, 0, 30000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9b250d-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'Beach Villa - Alibaug', '4BHK beach-facing villa with direct beach access. Includes cook, caretaker, and all modern amenities. Great for weekend getaways.', 'Alibaug Beach Road', 'Alibaug', 'Maharashtra', '402201', 4, 4, 10, '[\"WiFi\", \"Beach Access\", \"Kitchen\", \"AC\", \"Cook\", \"Caretaker\"]', '[\"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800\"]', 0.00, 0, 18000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9b3625-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'Riverside Cottage - Alibaug', 'Peaceful 3BHK cottage by the river with fishing facilities, outdoor dining, and nature trails.', 'Riverside Lane', 'Alibaug', 'Maharashtra', '402201', 3, 3, 8, '[\"WiFi\", \"River View\", \"Kitchen\", \"AC\", \"Fishing\", \"Outdoor Dining\"]', '[\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800\"]', 0.00, 0, 12000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'Heritage Haveli - Jaipur', 'Traditional Rajasthani haveli converted into luxury 5BHK villa. Features ethnic decor, courtyard, and rooftop dining area.', 'Heritage Street', 'Jaipur', 'Rajasthan', '302001', 5, 5, 12, '[\"WiFi\", \"Courtyard\", \"Kitchen\", \"AC\", \"Traditional Decor\", \"Rooftop Dining\"]', '[\"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800\"]', 0.00, 0, 20000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bb9fca40-e418-11f0-9f30-00410e2b5e6e', 'bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb65554a-e418-11f0-9f30-00410e2b5e6e', 'Royal Villa - Pink City', '3BHK villa with royal architecture, private pool, and butler service. Near major tourist attractions.', 'Pink City Road', 'Jaipur', 'Rajasthan', '302002', 3, 3, 8, '[\"WiFi\", \"Pool\", \"Kitchen\", \"AC\", \"Butler Service\"]', '[\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800\"]', 0.00, 0, 16000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bba49bf2-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb5c7d89-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'Mountain View Villa - Manali', 'Cozy 4BHK wooden villa with snow-capped mountain views, fireplace, and modern heating. Perfect for winter holidays.', 'Old Manali Road', 'Manali', 'Himachal Pradesh', '175131', 4, 4, 10, '[\"WiFi\", \"Mountain View\", \"Kitchen\", \"Fireplace\", \"Heating\"]', '[\"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800\"]', 0.00, 0, 14000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL),
('bba4ada9-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb5c91ad-e418-11f0-9f30-00410e2b5e6e', 'bb6555e0-e418-11f0-9f30-00410e2b5e6e', 'Alpine Retreat - Old Manali', 'Luxury 3BHK villa in Old Manali with apple orchard, valley views, and adventure activity arrangements.', 'Apple Orchard Lane', 'Manali', 'Himachal Pradesh', '175131', 3, 3, 8, '[\"WiFi\", \"Valley View\", \"Kitchen\", \"Fireplace\", \"Orchard\"]', '[\"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800\"]', 0.00, 0, 12000.00, 18.00, 'approved', '2025-12-28 18:12:12', NULL);

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
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `property_id`, `user_id`, `booking_id`, `rating`, `review_text`, `cleanliness_rating`, `accuracy_rating`, `communication_rating`, `location_rating`, `check_in_rating`, `value_rating`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 4.80, 'Absolutely stunning beachfront villa! The infinity pool was incredible and the staff were very attentive. Perfect for a family vacation. The rooms were spacious and clean.', 5, 5, 5, 5, 4, 5, 'published', '2025-12-19 12:17:54', NULL, NULL),
('3b7e499b-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', NULL, 5.00, 'Best vacation rental we have ever stayed at! Everything was exactly as described. The view from the master bedroom was breathtaking. Highly recommend for anyone visiting Goa!', 5, 5, 5, 5, 5, 5, 'published', '2025-12-26 12:17:54', NULL, NULL),
('3b7e4bbb-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bbcd0c8e-e418-11f0-9f30-00410e2b5e6e', 4.50, 'Cozy and peaceful cottage. Great location near Anjuna Beach. The garden was beautiful and we loved the BBQ area. Perfect for a romantic getaway.', 4, 5, 4, 5, 4, 5, 'published', '2025-12-14 12:17:54', NULL, NULL),
('3b7e4dc8-e89e-11f0-a597-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbd09930-e418-11f0-9f30-00410e2b5e6e', 4.90, 'Luxury at its finest! The jacuzzi, infinity pool, and panoramic views made this stay unforgettable. Highly recommend for special occasions and celebrations.', 5, 5, 5, 5, 5, 4, 'published', '2025-12-29 12:17:54', NULL, NULL),
('3b7e4ed5-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', NULL, 4.70, 'Amazing property with great amenities. The beach access was convenient and the kitchen was well-equipped. Would definitely stay again!', 5, 4, 5, 5, 4, 5, 'published', '2025-12-31 12:17:54', NULL, NULL),
('3b7e4fc9-e89e-11f0-a597-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', 'bb553ab0-e418-11f0-9f30-00410e2b5e6e', NULL, 4.60, 'Very nice cottage, perfect for couples. The only downside was the wifi was a bit slow, but overall great experience.', 4, 5, 4, 5, 5, 4, 'published', '2025-12-22 12:17:54', NULL, NULL);

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
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `status`, `created_at`, `deleted_at`, `avatar`) VALUES
('bb551978-e418-11f0-9f30-00410e2b5e6e', 'Rajesh Kumar', 'rajesh@example.com', '9876543210', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'Priya Sharma', 'priya@example.com', '9876543211', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb553a04-e418-11f0-9f30-00410e2b5e6e', 'Amit Patel', 'amit@example.com', '9876543212', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb553ab0-e418-11f0-9f30-00410e2b5e6e', 'Sneha Reddy', 'sneha@example.com', '9876543213', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb553b3e-e418-11f0-9f30-00410e2b5e6e', 'Vikram Singh', 'vikram@example.com', '9876543214', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 18:12:12', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
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

INSERT INTO `vendors` (`id`, `name`, `email`, `phone`, `gst_number`, `bank_details`, `status`, `created_at`, `deleted_at`, `avatar`) VALUES
('bb60817d-e418-11f0-9f30-00410e2b5e6e', 'Luxury Villas Pvt Ltd', 'vendor1@example.com', '9876543230', '29AABCU9603R1ZM', '{\"bank_name\": \"HDFC Bank\", \"account_number\": \"12345678901234\", \"ifsc\": \"HDFC0001234\", \"account_holder\": \"Luxury Villas Pvt Ltd\"}', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'Beach Resorts Group', 'vendor2@example.com', '9876543231', '27AABCB1234C1Z5', '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"56789012345678\", \"ifsc\": \"ICIC0005678\", \"account_holder\": \"Beach Resorts Group\"}', 'active', '2025-12-28 18:12:12', NULL, NULL),
('bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'Mountain Retreats', 'vendor3@example.com', '9876543232', '07AABCM9876K1Z8', '{\"bank_name\": \"SBI\", \"account_number\": \"98765432109876\", \"ifsc\": \"SBIN0009876\", \"account_holder\": \"Mountain Retreats\"}', 'active', '2025-12-28 18:12:12', NULL, NULL);

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
('3b79cb7b-e89e-11f0-a597-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 12:17:54', NULL);

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
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `city_id` (`city_id`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_price` (`price_per_night`);

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
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

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
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_number` bigint(20) NOT NULL AUTO_INCREMENT;

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
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  ADD CONSTRAINT `properties_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `properties_ibfk_3` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`);

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
-- Constraints for table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

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
-- Constraints for table `vendor_settlements`
--
ALTER TABLE `vendor_settlements`
  ADD CONSTRAINT `vendor_settlements_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  ADD CONSTRAINT `vendor_settlements_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_property_fk` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
