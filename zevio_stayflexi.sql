-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2026 at 09:00 PM
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
-- Database: `zevio_stayflexi`
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
('12fd76e6-3370-11f1-9870-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '2026-04-08 11:56:27'),
('1ced775a-4cff-480e-8877-e42bb278d35a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Created coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-28 05:49:07'),
('330e609f-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '026c1c8a-48bf-4503-987a-71e1da681ea5', '2026-04-15 13:36:23'),
('33135156-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '026c1c8a-48bf-4503-987a-71e1da681ea5', '2026-04-15 13:36:24'),
('331e1a10-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '026c1c8a-48bf-4503-987a-71e1da681ea5', '2026-04-15 13:36:24'),
('3323ca69-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '026c1c8a-48bf-4503-987a-71e1da681ea5', '2026-04-15 13:36:24'),
('334b20a5-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776279984236@test.com)', 'customer', '351ee21b-d6db-4579-953a-87185e9f287b', '2026-04-15 13:36:24'),
('34b5a30f-7018-4fd8-b2af-249faa415bf0', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-29 10:58:51'),
('359ce914-25ad-11f1-9f44-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', '2026-03-21 23:38:40'),
('36659c02-ec61-4f62-8f96-9d863ff9d5fd', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', 'da184f4f-1f3f-4164-b5f7-cc9d053a04be', '2026-03-29 10:58:47'),
('52eabeaa-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:26'),
('52ee99e4-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:26'),
('52f78821-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:27'),
('52fb0089-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:27'),
('53025ee3-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:27'),
('5305b485-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', '2026-04-15 13:44:27'),
('53216aa4-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280467165@test.com)', 'customer', '95da3eb7-aaf3-4bee-bc1e-9044c72e573d', '2026-04-15 13:44:27'),
('5ed9bd7b-be7b-46d1-8f9d-a0efa4cb4f4c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'DELETE_REVIEW', 'reviews', 'review-test-008', '2026-04-08 12:00:57'),
('628d53e7-25ad-11f1-9f44-00410e2b5e6e', 'test-admin-id-00000000', 'admin', 'test action', 'property', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-21 23:39:55'),
('65f6dc6c-2b91-11f1-9fb9-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new vendor account: Mithun (mithunmanju77@gmail.com)', 'vendor', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', '2026-03-29 11:34:50'),
('68755cc2-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('6879250a-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('688315d9-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('6886d6e6-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('688fa25e-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('68935649-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '1db47368-708b-433a-a112-459894f9a5f5', '2026-04-15 13:37:53'),
('68b4310d-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280073836@test.com)', 'customer', '2cc91896-89fe-46b4-a665-b4ce6f355f29', '2026-04-15 13:37:54'),
('6bddac24-25ae-11f1-9f44-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '085785eb-9d0e-45e9-b5ed-a333a67cfe20', '2026-03-21 23:47:20'),
('7f5a1b29-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f5e3616-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f68ba37-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f6cbf18-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f769d57-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f7a7714-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '9adf50b7-182b-484b-8d17-775f202e6993', '2026-04-15 13:45:41'),
('7f9a084b-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280541757@test.com)', 'customer', '3ae6732c-3757-433d-bb15-c9c5b9752853', '2026-04-15 13:45:41'),
('802d9ca1-8214-4a65-9a01-9206e3eaf3cf', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Created coupon', 'coupon', '449d8969-e84e-407d-a23b-0005654d47ef', '2026-04-08 10:28:59'),
('8a917014-3365-11f1-9870-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-08 10:41:03'),
('9bdc26df-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9be0e62c-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9bea347a-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9beebe43-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9bf72d2e-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9bfac5bf-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'f745a6c6-24ed-4986-9212-c4e3c7161950', '2026-04-15 13:46:29'),
('9c192f9c-38ff-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280589568@test.com)', 'customer', '7e971129-45b8-4c67-8b50-cdb1e9cbe6a6', '2026-04-15 13:46:29'),
('b10975ab-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b10dbc80-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b1179a32-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b11beb25-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b1266ef4-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b12a671b-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '75ab208f-d5bd-4a8c-83be-02355a5abfac', '2026-04-15 13:39:55'),
('b1492e6c-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280195624@test.com)', 'customer', '1cc890fb-7ccc-489d-8ddc-fe7de669441f', '2026-04-15 13:39:55'),
('b2085aac-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Reset password for vendor: Beach Resorts Group (vendor2@example.com)', 'vendor', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', '2026-04-15 13:39:57'),
('caed3483-3208-4cbe-9dc2-e6ace145d20d', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', '449d8969-e84e-407d-a23b-0005654d47ef', '2026-04-08 10:53:45'),
('d20d4d0d-883b-4de4-9cf1-6c8a79db2ccb', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', '3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', '2026-04-04 02:16:37'),
('da5215b5-fbbf-4e76-8aa6-c424e32cccc4', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Marked settlement as paid', 'vendor_settlement', '44fdb2dd-85a1-49e0-9593-fc70367a0e81', '2026-04-16 14:14:45'),
('dc22734c-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc265e84-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc300584-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc3379a9-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc3b5f42-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc3f5c4b-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', 'cad80b80-bb08-4fcb-8342-d354cf902df3', '2026-04-15 13:41:07'),
('dc5beef6-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280267896@test.com)', 'customer', 'f78bf67b-a002-4398-a8e6-868550880cb9', '2026-04-15 13:41:08'),
('e07db2a2-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:14'),
('e081498b-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:14'),
('e089ad88-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:15'),
('e08d5e9b-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:15'),
('e094fb09-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to approved', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:15'),
('e0986bcb-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Property status changed to draft', 'property', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-04-15 13:41:15'),
('e0b56f33-38fe-11f1-8e17-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Test User Auto (testuser1776280275192@test.com)', 'customer', 'e7edc5e8-44ca-4ee6-bc08-3114dabe041e', '2026-04-15 13:41:15'),
('f219ad9d-b51d-4a4b-9c91-e488fad34c43', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'EDIT_REVIEW', 'reviews', 'review-test-008', '2026-04-08 11:59:36'),
('f5825cfd-9b6f-4cbb-8cec-f6c91e3c06ca', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', 'Updated coupon', 'coupon', '449d8969-e84e-407d-a23b-0005654d47ef', '2026-04-08 10:51:46'),
('f98e09fa-2b90-11f1-9fb9-00410e2b5e6e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'super_admin', 'Created new customer account: Shashank (shashankzevio@gmail.com)', 'customer', '1dee3043-ff2a-4712-8e9e-a46ee3024845', '2026-03-29 11:31:48');

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
('6796b798-fbcb-4511-8a24-e8429263f0e7', 'Ranjith', 'ranjith@gopafy.com', '$2a$10$f8Z3iAPlBCScxo68vvFCr.O1.DczlQ2d58W5ePQwqdueFsfCqb9Hq', 'super_admin', 'active', '2026-06-17 18:13:08', NULL, NULL, NULL, NULL),
('bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'Super Admin', 'admin@zevio.com', '$2a$10$nOsbi7ZKDC4fAyuc/geSk.3bksszLqnoWsqbulOpqK4o3yKowBfHG', 'super_admin', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL),
('bb58b3c4-e418-11f0-9f30-00410e2b5e6e', 'John Admin', 'john.admin@zevio.com', '$2a$10$9g7.OhgqaB0fKSsXR.dS/OOsFufK/b25zJlyU2jwHbwVaPxEAEb7O', 'admin', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL);

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
('207aabd6-2aca-11f1-902c-00410e2b5e6e', 'Private Pool', 'facility', 'private-pool', NULL, 17, 1, 0, '2026-03-28 11:48:20', '2026-03-28 11:48:20'),
('207b3749-2aca-11f1-902c-00410e2b5e6e', 'Jacuzzi', 'facility', 'jacuzzi', NULL, 18, 1, 0, '2026-03-28 11:48:20', '2026-03-28 11:48:20'),
('207c0a7a-2aca-11f1-902c-00410e2b5e6e', 'Mountain View', 'feature', 'mountain', NULL, 5, 1, 0, '2026-03-28 11:48:20', '2026-03-28 11:48:20'),
('207c6c25-2aca-11f1-902c-00410e2b5e6e', 'Smoke Alarms', 'safety', 'smoke-alarm', NULL, 16, 1, 0, '2026-03-28 11:48:20', '2026-03-28 11:48:20'),
('5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', 'WiFi', 'connectivity', 'wifi', NULL, 19, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', 'Workspace', 'workspace', 'desk', NULL, 20, 1, 0, '2026-01-17 15:21:38', '2026-01-17 15:21:38'),
('5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', 'AC', 'comfort', 'snowflake', NULL, 1, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', 'Parking', 'facility', 'car', NULL, 11, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', 'Kitchen', 'facility', 'utensils', NULL, 1, 1, 0, '2026-01-17 15:21:38', '2026-03-28 11:48:20'),
('5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', 'TV', 'entertainment', 'tv', NULL, 17, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb510-f3e6-11f0-8f27-00410e2b5e6e', 'Washing Machine', 'appliance', 'washing-machine', NULL, 18, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb610-f3e6-11f0-8f27-00410e2b5e6e', 'Refrigerator', 'appliance', 'refrigerator', NULL, 14, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', 'Microwave', 'appliance', 'microwave', NULL, 10, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb817-f3e6-11f0-8f27-00410e2b5e6e', 'Geyser', 'comfort', 'hot-tub', NULL, 5, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', 'Gym', 'facility', 'dumbbell', NULL, 6, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bba14-f3e6-11f0-8f27-00410e2b5e6e', 'Swimming Pool', 'facility', 'swimming-pool', NULL, 16, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', 'Security', 'safety', 'shield', NULL, 15, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bbc07-f3e6-11f0-8f27-00410e2b5e6e', 'Power Backup', 'facility', 'battery', NULL, 13, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bbd10-f3e6-11f0-8f27-00410e2b5e6e', 'Elevator', 'facility', 'elevator', NULL, 3, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', 'Housekeeping', 'service', 'broom', NULL, 7, 1, 1, '2026-01-17 15:21:38', '2026-03-28 11:48:20'),
('5c1bbf0b-f3e6-11f0-8f27-00410e2b5e6e', 'Laundry', 'service', 'laundry', NULL, 9, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', 'Balcony', 'feature', 'balcony', NULL, 2, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', 'Garden', 'feature', 'tree', NULL, 4, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16'),
('5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', 'Pet Friendly', 'policy', 'paw', NULL, 12, 1, 0, '2026-01-17 15:21:38', '2026-01-18 00:46:16');

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_link` varchar(500) DEFAULT NULL,
  `inline_link_text` varchar(150) DEFAULT NULL,
  `inline_link_url` varchar(500) DEFAULT NULL,
  `property_id` char(36) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image_aspect_ratio` varchar(10) NOT NULL DEFAULT '16:9',
  `image_fit_mode` enum('contain','cover') NOT NULL DEFAULT 'contain',
  `banner_size` enum('normal','large') NOT NULL DEFAULT 'normal',
  `background_color` varchar(30) NOT NULL DEFAULT '#1F3A5F',
  `text_color` varchar(30) NOT NULL DEFAULT '#FFFFFF',
  `banner_type` enum('popup','top_bar','slide_in') NOT NULL DEFAULT 'popup',
  `show_once` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `button_text`, `button_link`, `inline_link_text`, `inline_link_url`, `property_id`, `image_url`, `image_aspect_ratio`, `image_fit_mode`, `banner_size`, `background_color`, `text_color`, `banner_type`, `show_once`, `is_active`, `valid_from`, `valid_until`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
('c0d0cead-83d6-4f7a-af4a-551af85bbeb7', 'Summar Sale', 'This is a summer sale', 'Book Now', 'www.google.com', 'Reserve', 'www.gopafy.com', NULL, 'https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/banners/banners-f70f77b7-44fb-482b-945c-706543982c41.jpeg', '16:9', 'contain', 'normal', '#2D2D2D', '#FFFFFF', 'popup', 0, 1, NULL, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-12 21:31:55', '2026-04-12 22:33:08', NULL),
('cd5f29ec-8e72-465c-b301-55dd0400d510', 'Banner LargeSize E2E 1776013040795', 'scenario test', NULL, NULL, NULL, NULL, NULL, NULL, '16:9', 'contain', 'large', '#111111', '#FFFFFF', 'top_bar', 0, 0, NULL, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-12 22:27:20', '2026-04-12 22:27:20', '2026-04-12 22:27:20'),
('e5a78854-650e-4193-a2c8-bc1a13dca416', 'UI Large Persist Check 177601', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '16:9', 'contain', 'normal', '#1F3A5F', '#FFFFFF', 'popup', 0, 0, NULL, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-12 22:33:38', '2026-04-12 22:34:42', '2026-04-12 22:34:42');

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
  `booking_source` enum('direct','channel_manager') NOT NULL DEFAULT 'direct',
  `source_provider_key` varchar(50) DEFAULT NULL,
  `source_reference_id` varchar(120) DEFAULT NULL,
  `source_payload` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `payment_expires_at` datetime DEFAULT NULL COMMENT '15-minute payment window: auto-cancel if payment not received by this time',
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `property_id`, `check_in`, `check_out`, `nights`, `guest_count`, `children_count`, `infants_count`, `base_amount`, `extra_guest_charges`, `extra_children_charges`, `gst_amount`, `service_charge`, `coupon_id`, `coupon_code`, `coupon_discount`, `discount_amount`, `total_amount`, `status`, `payment_status`, `booking_source`, `source_provider_key`, `source_reference_id`, `source_payload`, `created_at`, `expires_at`, `payment_expires_at`, `deleted_at`) VALUES
('14628672-565d-4fe8-a538-586c7612069e', '244c2909-85ef-4d38-8a0a-2723ff145942', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-05-24', '2026-05-25', 1, 2, 0, 0, 7000.00, 0.00, 0.00, 350.00, 350.00, NULL, NULL, 0.00, 0.00, 7700.00, 'cancelled', 'failed', 'direct', NULL, NULL, NULL, '2026-05-21 20:08:52', '2026-05-22 02:06:57', '2026-05-22 02:06:57', NULL),
('95f0abbe-fb09-4f6f-b571-c8640620addc', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-04-15', '2026-04-16', 1, 2, 0, 0, 9000.00, 0.00, 0.00, 1620.00, 450.00, NULL, NULL, 0.00, 0.00, 11070.00, 'completed', 'pending', 'direct', NULL, NULL, NULL, '2026-04-08 16:26:09', '2026-04-08 22:11:09', '2026-04-08 22:11:09', NULL),
('9673c92b-116b-4b80-a669-d40bc50f03fe', '7e971129-45b8-4c67-8b50-cdb1e9cbe6a6', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-13', '2026-06-15', 2, 2, 0, 0, 5200.00, 0.00, 0.00, 936.00, 0.00, NULL, NULL, 0.00, 0.00, 6136.00, 'cancelled', 'refunded', 'direct', NULL, NULL, NULL, '2026-06-09 12:57:47', NULL, NULL, NULL),
('9f2b6833-22b8-4cb4-a5a7-def23be0300f', '7e971129-45b8-4c67-8b50-cdb1e9cbe6a6', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-10', '2026-06-12', 2, 2, 0, 0, 5000.00, 0.00, 0.00, 900.00, 0.00, NULL, NULL, 0.00, 0.00, 5900.00, 'confirmed', 'completed', 'direct', NULL, NULL, NULL, '2026-06-09 12:57:47', NULL, NULL, NULL),
('b52e0912-4644-41dc-b638-2b9d9dd471f7', '244c2909-85ef-4d38-8a0a-2723ff145942', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-05-29', '2026-05-31', 2, 2, 0, 0, 14000.00, 0.00, 0.00, 2520.00, 700.00, NULL, NULL, 0.00, 0.00, 17220.00, 'cancelled', 'failed', 'direct', NULL, NULL, NULL, '2026-05-21 19:05:40', '2026-05-22 01:23:22', '2026-05-22 01:23:22', NULL),
('d5133df0-cec7-48eb-9eb0-af30118d3001', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-05-11', '2026-05-12', 1, 2, 0, 0, 16000.00, 0.00, 0.00, 2880.00, 800.00, NULL, NULL, 0.00, 0.00, 19680.00, 'cancelled', 'failed', 'direct', NULL, NULL, NULL, '2026-04-05 18:02:00', '2026-04-06 00:14:26', '2026-04-06 00:14:26', NULL),
('f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-10', '2026-04-16', 6, 4, 0, 0, 96000.00, 0.00, 0.00, 17280.00, 4800.00, NULL, NULL, 0.00, 0.00, 118080.00, 'completed', 'pending', 'direct', NULL, NULL, NULL, '2026-04-05 20:23:23', '2026-04-06 02:11:25', '2026-04-06 02:11:25', NULL);

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
('d76be101-0e85-11f1-9f1f-00410e2b5e6e', 'pt-001', 'Villa Standard Cancellation', 'Applies to all villa bookings. Refunds are processed within 5-7 business days after cancellation.', '[{\"label\":\"Full Refund\",\"days_before_checkin\":7,\"refund_percent\":100},{\"label\":\"Partial Refund\",\"days_before_checkin\":3,\"refund_percent\":50},{\"label\":\"No Refund\",\"days_before_checkin\":0,\"refund_percent\":0}]', 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-02-20 12:28:47', '2026-04-08 10:26:19'),
('d76bf370-0e85-11f1-9f1f-00410e2b5e6e', 'pt-002', 'Service Apartment Standard Cancellation', 'Applies to all service apartment bookings. Refunds are processed within 5-7 business days after cancellation.', '[{\"label\":\"Full Refund\",\"days_before_checkin\":14,\"refund_percent\":100},{\"label\":\"Partial Refund\",\"days_before_checkin\":7,\"refund_percent\":50},{\"label\":\"No Refund\",\"days_before_checkin\":0,\"refund_percent\":0}]', 1, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-02-20 12:28:47', '2026-02-20 12:28:47'),
('e24d83c5-921d-421a-84aa-1d5e5f238288', 'pt-001', 'Standard Villa Policy', 'Standard refund tiers for villa bookings', '[{\"label\":\"Full Refund\",\"days_before_checkin\":30,\"refund_percent\":100},{\"label\":\"Partial Refund\",\"days_before_checkin\":7,\"refund_percent\":50},{\"label\":\"No Refund\",\"days_before_checkin\":0,\"refund_percent\":0}]', 1, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-08 10:26:19', '2026-04-08 10:26:19');

-- --------------------------------------------------------

--
-- Table structure for table `channel_manager_daily_controls`
--

CREATE TABLE `channel_manager_daily_controls` (
  `id` char(36) NOT NULL,
  `integration_id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `provider_key` varchar(50) NOT NULL,
  `external_room_type_id` varchar(120) NOT NULL,
  `external_rate_plan_id` varchar(120) NOT NULL,
  `control_date` date NOT NULL,
  `single_rate` decimal(12,2) DEFAULT NULL,
  `double_rate` decimal(12,2) DEFAULT NULL,
  `triple_rate` decimal(12,2) DEFAULT NULL,
  `extra_adult_rate` decimal(12,2) DEFAULT NULL,
  `extra_child_rate` decimal(12,2) DEFAULT NULL,
  `stop_sell` tinyint(1) NOT NULL DEFAULT 0,
  `closed_on_arrival` tinyint(1) NOT NULL DEFAULT 0,
  `closed_on_departure` tinyint(1) NOT NULL DEFAULT 0,
  `min_los` int(10) UNSIGNED DEFAULT NULL,
  `max_los` int(10) UNSIGNED DEFAULT NULL,
  `source_reference_id` varchar(160) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `channel_manager_daily_controls`
--

INSERT INTO `channel_manager_daily_controls` (`id`, `integration_id`, `property_id`, `provider_key`, `external_room_type_id`, `external_rate_plan_id`, `control_date`, `single_rate`, `double_rate`, `triple_rate`, `extra_adult_rate`, `extra_child_rate`, `stop_sell`, `closed_on_arrival`, `closed_on_departure`, `min_los`, `max_los`, `source_reference_id`, `created_at`, `updated_at`) VALUES
('27bd7d09-724d-4e61-b025-564f9177a06e', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'stayflexi', 'GOA_VILLA_01', 'RP01', '2026-06-22', 2500.00, 3000.00, 3500.00, 500.00, 300.00, 0, 0, 0, 1, 30, 'ZEVIO_GOA_001:GOA_VILLA_01:restriction:RP01:2026-06-22', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('2c8932b3-acc7-428e-afe5-d2941a42cd6c', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'stayflexi', 'GOA_VILLA_01', 'RP01', '2026-06-20', 2500.00, 3000.00, 3500.00, 500.00, 300.00, 0, 0, 0, 1, 30, 'ZEVIO_GOA_001:GOA_VILLA_01:restriction:RP01:2026-06-20', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('9a85dd22-94e1-4a5d-a711-0086454b188a', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'stayflexi', 'GOA_VILLA_01', 'RP01', '2026-06-21', 2500.00, 3000.00, 3500.00, 500.00, 300.00, 0, 0, 0, 1, 30, 'ZEVIO_GOA_001:GOA_VILLA_01:restriction:RP01:2026-06-21', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('9de853b2-5683-44b6-baf4-2844e82cae1e', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'stayflexi', 'GOA_VILLA_01', 'RP01', '2026-06-23', 2600.00, 3100.00, 3100.00, 0.00, 0.00, 0, 0, 0, 2, 31, 'ZEVIO_GOA_001:GOA_VILLA_01:restriction:RP01:2026-06-23', '2026-06-17 17:56:14', '2026-06-17 17:56:14');

-- --------------------------------------------------------

--
-- Table structure for table `channel_manager_integrations`
--

CREATE TABLE `channel_manager_integrations` (
  `id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `provider_key` varchar(50) NOT NULL,
  `external_hotel_id` varchar(120) NOT NULL,
  `credentials_json` longtext DEFAULT NULL,
  `sync_mode` enum('pull','push','bi_directional') NOT NULL DEFAULT 'bi_directional',
  `status` enum('active','inactive','test') NOT NULL DEFAULT 'test',
  `last_successful_sync_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `channel_manager_integrations`
--

INSERT INTO `channel_manager_integrations` (`id`, `vendor_id`, `provider_key`, `external_hotel_id`, `credentials_json`, `sync_mode`, `status`, `last_successful_sync_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
('986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'stayflexi', 'ZEVIO_GOA_001', NULL, 'bi_directional', 'test', NULL, '2026-06-17 17:47:33', '2026-06-17 17:47:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `channel_manager_property_mappings`
--

CREATE TABLE `channel_manager_property_mappings` (
  `id` char(36) NOT NULL,
  `integration_id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `external_property_id` varchar(120) NOT NULL,
  `external_room_type_id` varchar(120) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `channel_manager_property_mappings`
--

INSERT INTO `channel_manager_property_mappings` (`id`, `integration_id`, `property_id`, `external_property_id`, `external_room_type_id`, `is_active`, `created_at`, `updated_at`) VALUES
('f11fad47-c51e-4d74-920f-6b74c438fddd', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'GOA_VILLA_01', 1, '2026-06-17 17:47:33', '2026-06-17 17:47:33');

-- --------------------------------------------------------

--
-- Table structure for table `channel_manager_webhook_events`
--

CREATE TABLE `channel_manager_webhook_events` (
  `id` char(36) NOT NULL,
  `integration_id` char(36) DEFAULT NULL,
  `provider_key` varchar(50) NOT NULL,
  `external_event_id` varchar(120) DEFAULT NULL,
  `event_type` varchar(120) NOT NULL,
  `xml_payload` longtext NOT NULL,
  `parsed_payload` longtext DEFAULT NULL,
  `processing_status` enum('received','processed','failed','ignored') NOT NULL DEFAULT 'received',
  `error_message` text DEFAULT NULL,
  `received_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `channel_manager_webhook_events`
--

INSERT INTO `channel_manager_webhook_events` (`id`, `integration_id`, `provider_key`, `external_event_id`, `event_type`, `xml_payload`, `parsed_payload`, `processing_status`, `error_message`, `received_at`, `processed_at`) VALUES
('00e22308-c56a-4c71-b8d0-90d5f4972aa7', NULL, 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"UNKNOWN_HOTEL_X\" Version=\"1.0\"><RoomType><RoomTypeCode>ROOM_TEST_101</RoomTypeCode><StartDate Format=\"yyyy-MM-dd\">2026-06-19</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-26</EndDate><Count>1</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"ROOM_TEST_101\",\"StartDate\":{\"#text\":\"2026-06-19\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-26\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":1},\"@_HotelCode\":\"UNKNOWN_HOTEL_X\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNKNOWN_HOTEL_X', '2026-06-17 16:46:30', '2026-06-17 22:16:30'),
('05c92f6c-df72-48b5-a8a1-0e718cff93d5', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_inventory', '<GetRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRoomInventoryRQ>', '{\"GetRoomInventoryRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('0850b8a5-a501-4627-a6cb-90d6b584510a', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_restriction', '<GetRestrictionRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\"><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><RatePlanCode>RP01</RatePlanCode><StartDate>21-06-2026</StartDate><EndDate>23-06-2026</EndDate></GetRestrictionRQ>', '{\"GetRestrictionRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"21-06-2026\",\"EndDate\":\"23-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('0ba96c1b-a469-4af8-a719-e1a480c0683a', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_restriction', '<GetRestrictionRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <RatePlanCode>RP01</RatePlanCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRestrictionRQ>', '{\"GetRestrictionRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('10ce3b69-f199-43f1-befe-5b232d067520', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_rates', '<UpdateRoomRatesRQ Currency=\"INR\" HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\"><RatePlan><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><RatePlanCode>RP01</RatePlanCode><StartDate Format=\"yyyy-MM-dd\">2026-06-21</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-23</EndDate><Single>2600</Single><Double>3100</Double></RatePlan></UpdateRoomRatesRQ>', '{\"UpdateRoomRatesRQ\":{\"RatePlan\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-21\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-23\",\"@_Format\":\"yyyy-MM-dd\"},\"Single\":2600,\"Double\":3100},\"@_Currency\":\"INR\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('19f936b5-cc06-4b71-902d-d9ef804d92c9', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\" />', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('257dbced-131e-43ed-bf66-9c318114cee0', NULL, 'stayflexi', NULL, 'update_rates', '<UpdateRoomRatesRQ HotelCode=\"UNMAPPED_HOTEL\" Currency=\"INR\" Version=\"1.0\"><RatePlan><RoomTypeCode>RT1</RoomTypeCode><RatePlanCode>RP1</RatePlanCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate><Single>100</Single></RatePlan></UpdateRoomRatesRQ>', '{\"UpdateRoomRatesRQ\":{\"RatePlan\":{\"RoomTypeCode\":\"RT1\",\"RatePlanCode\":\"RP1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"Single\":100},\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Currency\":\"INR\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('297d5545-391f-4f97-9da7-d1ffbd2e8134', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\" />', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('3c84c44f-8422-455d-b086-549a9ae0e117', NULL, 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"UNMAPPED_HOTEL\" Version=\"1.0\"><RoomType><RoomTypeCode>RT1</RoomTypeCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate><Count>1</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"RT1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"Count\":1},\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('42040f0f-90a4-490f-af58-2d50f984cc0e', NULL, 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"HOTEL_TEST_001\" Version=\"1.0\"/>', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"HOTEL_TEST_001\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code HOTEL_TEST_001', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('4234be00-0b42-49cd-8ae4-f7fa0a47143c', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\"><RoomType><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><StartDate Format=\"yyyy-MM-dd\">2026-06-21</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-23</EndDate><Count>4</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":{\"#text\":\"2026-06-21\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-23\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":4},\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('430e0335-3fe4-4b14-b4f9-75e2970547f0', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_restriction', '<UpdateRestrictionRQ><HotelCode>ZEVIO_GOA_001</HotelCode><Version>1.0</Version><Restriction><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><RatePlanCode>RP01</RatePlanCode><StartDate Format=\"yyyy-MM-dd\">2026-06-21</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-23</EndDate><MinLOS>2</MinLOS></Restriction></UpdateRestrictionRQ>', '{\"UpdateRestrictionRQ\":{\"HotelCode\":\"ZEVIO_GOA_001\",\"Version\":1,\"Restriction\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-21\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-23\",\"@_Format\":\"yyyy-MM-dd\"},\"MinLOS\":2}}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('4b4dbc79-53ba-4685-b222-3eec140326c6', NULL, 'stayflexi', NULL, 'get_restriction', '<GetRestrictionRQ HotelCode=\"UNMAPPED_HOTEL\" Version=\"1.0\"><RoomTypeCode>RT1</RoomTypeCode><RatePlanCode>RP1</RatePlanCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate></GetRestrictionRQ>', '{\"GetRestrictionRQ\":{\"RoomTypeCode\":\"RT1\",\"RatePlanCode\":\"RP1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('4ded5bc9-f7d7-43b5-af26-758d593b1178', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomType>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <Count>3</Count>\n  </RoomType>\n</UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":3},\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('526e6c94-dfef-49de-9b92-fec0e1e79ad0', NULL, 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"UNKNOWN_X\" Version=\"1.0\"/>', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"UNKNOWN_X\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNKNOWN_X', '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('5311f0e7-cccb-42a1-8d66-5209fd954cab', NULL, 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"UNMAPPED_HOTEL\" Version=\"1.0\"/>', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('60642dc0-fd0b-459f-9185-c12b0701024d', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_rates', '<UpdateRoomRatesRQ Currency=\"INR\" HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RatePlan>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <RatePlanCode>RP01</RatePlanCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <Single>2500</Single>\n    <Double>3000</Double>\n    <Triple>3500</Triple>\n    <ExtraAdult>500</ExtraAdult>\n    <ExtraChild>300</ExtraChild>\n  </RatePlan>\n</UpdateRoomRatesRQ>', '{\"UpdateRoomRatesRQ\":{\"RatePlan\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"Single\":2500,\"Double\":3000,\"Triple\":3500,\"ExtraAdult\":500,\"ExtraChild\":300},\"@_Currency\":\"INR\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('69e8194e-6d1d-4620-8f96-aff6c65d0d9a', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_restriction', '<UpdateRestrictionRQ>\n  <HotelCode>ZEVIO_GOA_001</HotelCode>\n  <Version>1.0</Version>\n  <Restriction>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <RatePlanCode>RP01</RatePlanCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <MinLOS>1</MinLOS>\n    <MaxLOS>30</MaxLOS>\n  </Restriction>\n</UpdateRestrictionRQ>', '{\"UpdateRestrictionRQ\":{\"HotelCode\":\"ZEVIO_GOA_001\",\"Version\":1,\"Restriction\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"MinLOS\":1,\"MaxLOS\":30}}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('715284eb-d470-4883-8d0d-46a0fa322fc9', NULL, 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"UNKNOWN_HOTEL_X\" Version=\"1.0\"><RoomType><RoomTypeCode>ROOM_TEST_101</RoomTypeCode><StartDate Format=\"yyyy-MM-dd\">2026-06-17</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-24</EndDate><Count>1</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"ROOM_TEST_101\",\"StartDate\":{\"#text\":\"2026-06-17\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-24\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":1},\"@_HotelCode\":\"UNKNOWN_HOTEL_X\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNKNOWN_HOTEL_X', '2026-06-15 07:22:47', '2026-06-15 12:52:47'),
('79d99ec9-008e-4406-99c1-7f42c98be083', NULL, 'stayflexi', NULL, 'get_inventory', '<GetRoomInventoryRQ HotelCode=\"UNMAPPED_HOTEL\" Version=\"1.0\"><RoomTypeCode>RT1</RoomTypeCode><RatePlanCode>RP1</RatePlanCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate></GetRoomInventoryRQ>', '{\"GetRoomInventoryRQ\":{\"RoomTypeCode\":\"RT1\",\"RatePlanCode\":\"RP1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('96f0d02f-633e-4f65-a05d-20070d77e97d', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_rates', '<GetRoomRateRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <RatePlanCode>RP01</RatePlanCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRoomRateRQ>', '{\"GetRoomRateRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('9f98ae72-5e6b-40ef-807e-da0e23cd2b08', NULL, 'stayflexi', NULL, 'update_restriction', '<UpdateRestrictionRQ><HotelCode>UNMAPPED_HOTEL</HotelCode><Version>1.0</Version><Restriction><RoomTypeCode>RT1</RoomTypeCode><RatePlanCode>RP1</RatePlanCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate><MinLOS>1</MinLOS></Restriction></UpdateRestrictionRQ>', '{\"UpdateRestrictionRQ\":{\"HotelCode\":\"UNMAPPED_HOTEL\",\"Version\":1,\"Restriction\":{\"RoomTypeCode\":\"RT1\",\"RatePlanCode\":\"RP1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"MinLOS\":1}}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29'),
('a84ea3b1-6e1b-4296-b9a7-be56e29a6b04', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_inventory', '<GetRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRoomInventoryRQ>', '{\"GetRoomInventoryRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('aa11bf1b-2a64-444a-91b5-734404e6ebf7', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_rates', '<GetRoomRateRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <RatePlanCode>RP01</RatePlanCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRoomRateRQ>', '{\"GetRoomRateRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('b1e9f2c7-9a36-4800-8263-e804601dc40e', NULL, 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"UNKNOWN_HOTEL_X\" Version=\"1.0\"><RoomType><RoomTypeCode>ROOM_TEST_101</RoomTypeCode><StartDate Format=\"yyyy-MM-dd\">2026-06-19</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-26</EndDate><Count>1</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"ROOM_TEST_101\",\"StartDate\":{\"#text\":\"2026-06-19\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-26\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":1},\"@_HotelCode\":\"UNKNOWN_HOTEL_X\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNKNOWN_HOTEL_X', '2026-06-17 17:02:50', '2026-06-17 22:32:50'),
('b97eedf2-8049-46d6-9135-e4f17d713d9d', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomType>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <Count>3</Count>\n  </RoomType>\n</UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":3},\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:47:33', '2026-06-17 23:17:33'),
('baea7d82-47f8-4b0f-a91f-7848f086d846', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_rates', '<GetRoomRateRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\"><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><RatePlanCode>RP01</RatePlanCode><StartDate>21-06-2026</StartDate><EndDate>23-06-2026</EndDate></GetRoomRateRQ>', '{\"GetRoomRateRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"21-06-2026\",\"EndDate\":\"23-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('c104a6ac-4441-4a69-a0ea-032224a60c7a', NULL, 'stayflexi', NULL, 'update_inventory', '<UpdateRoomInventoryRQ HotelCode=\"UNKNOWN_HOTEL_X\" Version=\"1.0\"><RoomType><RoomTypeCode>ROOM_TEST_101</RoomTypeCode><StartDate Format=\"yyyy-MM-dd\">2026-06-19</StartDate><EndDate Format=\"yyyy-MM-dd\">2026-06-26</EndDate><Count>1</Count></RoomType></UpdateRoomInventoryRQ>', '{\"UpdateRoomInventoryRQ\":{\"RoomType\":{\"RoomTypeCode\":\"ROOM_TEST_101\",\"StartDate\":{\"#text\":\"2026-06-19\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-26\",\"@_Format\":\"yyyy-MM-dd\"},\"Count\":1},\"@_HotelCode\":\"UNKNOWN_HOTEL_X\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNKNOWN_HOTEL_X', '2026-06-17 17:01:28', '2026-06-17 22:31:28'),
('c2cf2d81-2879-43d8-b650-3d29fa3a46db', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_rates', '<UpdateRoomRatesRQ Currency=\"INR\" HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RatePlan>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <RatePlanCode>RP01</RatePlanCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <Single>2500</Single>\n    <Double>3000</Double>\n    <Triple>3500</Triple>\n    <ExtraAdult>500</ExtraAdult>\n    <ExtraChild>300</ExtraChild>\n  </RatePlan>\n</UpdateRoomRatesRQ>', '{\"UpdateRoomRatesRQ\":{\"RatePlan\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"Single\":2500,\"Double\":3000,\"Triple\":3500,\"ExtraAdult\":500,\"ExtraChild\":300},\"@_Currency\":\"INR\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('d0fd5923-fed0-47ec-a678-99cad4438ea6', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_hotel_detail', '<HotelDetailRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\" />', '{\"HotelDetailRQ\":{\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('d7d5311f-1fd6-409c-9170-ed9e77b66b4a', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_restriction', '<GetRestrictionRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\">\n  <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n  <RatePlanCode>RP01</RatePlanCode>\n  <StartDate>20-06-2026</StartDate>\n  <EndDate>22-06-2026</EndDate>\n</GetRestrictionRQ>', '{\"GetRestrictionRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":\"20-06-2026\",\"EndDate\":\"22-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('e3d7d17f-43ee-4cae-9bf1-5d5000f93304', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'update_restriction', '<UpdateRestrictionRQ>\n  <HotelCode>ZEVIO_GOA_001</HotelCode>\n  <Version>1.0</Version>\n  <Restriction>\n    <RoomTypeCode>GOA_VILLA_01</RoomTypeCode>\n    <RatePlanCode>RP01</RatePlanCode>\n    <StartDate Format=\"yyyy-MM-dd\">2026-06-20</StartDate>\n    <EndDate Format=\"yyyy-MM-dd\">2026-06-22</EndDate>\n    <MinLOS>1</MinLOS>\n    <MaxLOS>30</MaxLOS>\n  </Restriction>\n</UpdateRestrictionRQ>', '{\"UpdateRestrictionRQ\":{\"HotelCode\":\"ZEVIO_GOA_001\",\"Version\":1,\"Restriction\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"RatePlanCode\":\"RP01\",\"StartDate\":{\"#text\":\"2026-06-20\",\"@_Format\":\"yyyy-MM-dd\"},\"EndDate\":{\"#text\":\"2026-06-22\",\"@_Format\":\"yyyy-MM-dd\"},\"MinLOS\":1,\"MaxLOS\":30}}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('f24f4661-17df-4f11-b451-256fdfba7be5', '986d39b8-f2cf-494e-b3c9-866b6d5ada0a', 'stayflexi', NULL, 'get_inventory', '<GetRoomInventoryRQ HotelCode=\"ZEVIO_GOA_001\" Version=\"1.0\"><RoomTypeCode>GOA_VILLA_01</RoomTypeCode><StartDate>21-06-2026</StartDate><EndDate>23-06-2026</EndDate></GetRoomInventoryRQ>', '{\"GetRoomInventoryRQ\":{\"RoomTypeCode\":\"GOA_VILLA_01\",\"StartDate\":\"21-06-2026\",\"EndDate\":\"23-06-2026\",\"@_HotelCode\":\"ZEVIO_GOA_001\",\"@_Version\":1}}', 'processed', NULL, '2026-06-17 17:56:14', '2026-06-17 23:26:14'),
('f47dfb7d-1338-44fe-bbbf-41b0f81251df', NULL, 'stayflexi', NULL, 'get_rates', '<GetRoomRateRQ HotelCode=\"UNMAPPED_HOTEL\" Version=\"1.0\"><RoomTypeCode>RT1</RoomTypeCode><RatePlanCode>RP1</RatePlanCode><StartDate>22-06-2026</StartDate><EndDate>24-06-2026</EndDate></GetRoomRateRQ>', '{\"GetRoomRateRQ\":{\"RoomTypeCode\":\"RT1\",\"RatePlanCode\":\"RP1\",\"StartDate\":\"22-06-2026\",\"EndDate\":\"24-06-2026\",\"@_HotelCode\":\"UNMAPPED_HOTEL\",\"@_Version\":1}}', 'failed', 'No integration found for hotel code UNMAPPED_HOTEL', '2026-06-17 17:19:29', '2026-06-17 22:49:29');

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
(1, 'primary', 'Primary point of contact', 1, 1, '2026-01-18 05:03:07'),
(2, 'secondary', 'Secondary contact person', 2, 1, '2026-01-18 05:03:07'),
(3, 'emergency', 'Emergency contact', 3, 1, '2026-01-18 05:03:07'),
(4, 'maintenance', 'Maintenance contact', 4, 1, '2026-01-18 05:03:07'),
(5, 'vendor', 'Vendor/owner contact', 5, 1, '2026-01-18 05:03:07');

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
('449d8969-e84e-407d-a23b-0005654d47ef', 'TESTZEVIO10', 'percentage', 10.00, NULL, NULL, NULL, NULL, 1000.00, '2026-04-08', '2027-04-08', 100, 0, 1, NULL, '10% off for end-to-end testing', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-08 10:28:59', '2026-04-08 10:53:45', NULL, 1),
('da184f4f-1f3f-4164-b5f7-cc9d053a04be', 'SUMMER1250', 'flat', NULL, 1000.00, NULL, NULL, NULL, 10000.00, '2026-03-27', '2026-04-01', 1, 0, 1, NULL, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-03-28 05:49:07', '2026-03-29 10:58:51', NULL, 1);

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
('20cb7b74-cc53-4bff-b941-ab0812712c3f', '449d8969-e84e-407d-a23b-0005654d47ef', '95f0abbe-fb09-4f6f-b571-c8640620addc', 0.00, 'reserved', '2026-04-08 10:56:09', NULL, NULL, 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', '2026-04-08 10:56:09');

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
('02812b4d-fd8d-4e91-82ce-306c3edd90ac', 'daily_booking_processor', '2026-04-16', 'success', 'Processed 0 settlements'),
('06f73ace-aa03-469f-b6e3-e253204473bd', 'check_out_reminder', '2026-05-22', 'success', 'Sent 0 reminders, 0 failed'),
('0916d3db-78be-4cd2-bba6-bedeaa2ba859', 'check_in_reminder_24h', '2026-01-10', 'success', 'Sent 0 reminders, 0 failed'),
('0b28c8cb-f910-4b88-a2fc-d912400b6e4a', 'daily_cleanup', '2026-02-14', 'success', 'Cancelled 0 expired bookings'),
('0fbfdcc5-d87d-4542-b33d-3ced967abded', 'check_out_reminder', '2026-01-24', 'success', 'Sent 0 reminders, 0 failed'),
('1048eca0-bd8d-4f6a-83f4-e2cd154046a4', 'check_in_reminder_24h', '2026-02-25', 'success', 'Sent 0 reminders, 0 failed'),
('17238fd2-2866-43b3-b1ac-8b934debf94f', 'daily_booking_processor', '2026-05-21', 'success', 'Processed 0 settlements'),
('21379069-b132-414b-a7cb-c5c7935b9734', 'check_in_reminder_24h', '2026-04-04', 'success', 'Sent 0 reminders, 0 failed'),
('257cb39d-f83d-452b-8dd3-5d760b012632', 'check_out_reminder', '2026-06-10', 'success', 'Sent 0 reminders, 0 failed'),
('2bcd0a3c-a8af-424c-bb44-f95f1ccd0d0d', 'check_in_reminder_24h', '2026-02-22', 'success', 'Sent 0 reminders, 0 failed'),
('31fb7be5-ded2-4527-8891-c4da7ba0811f', 'daily_booking_processor', '2026-03-17', 'success', 'Processed 0 settlements'),
('393ab217-4124-4485-b450-61eb13473535', 'daily_booking_processor', '2026-03-04', 'success', 'Processed 0 settlements'),
('3a359083-c8c2-4656-b59d-a15764489aab', 'daily_booking_processor', '2026-04-05', 'success', 'Processed 0 settlements'),
('3e2e27ab-923d-4a80-a3c8-dc22537cc210', 'review_request', '2026-02-15', 'success', 'Sent 0 review requests, 0 failed'),
('41380528-58cf-439e-bd65-03e5e4e655db', 'check_in_reminder_24h', '2026-03-03', 'success', 'Sent 0 reminders, 0 failed'),
('4a5d0560-6174-405d-9e46-5a66e7c5c94d', 'check_in_reminder_24h', '2026-04-30', 'success', 'Sent 0 reminders, 0 failed'),
('4dce21fa-cb8a-479d-b61c-a5b5283d0ff0', 'daily_booking_processor', '2026-04-15', 'success', 'Processed 0 settlements'),
('4e4f6494-4b55-4a62-8c18-2fdca9d49b5c', 'daily_booking_processor', '2026-01-19', 'success', 'Processed 0 settlements'),
('4e68e9c8-374b-4375-a000-9b0f7d21990f', 'daily_booking_processor', '2026-04-08', 'success', 'Processed 0 settlements'),
('4eee4cab-7f09-4fde-bad2-c049d800b1c6', 'daily_booking_processor', '2026-02-14', 'success', 'Processed 0 settlements'),
('50f3f5a8-349a-4856-8712-1bd64b78bb53', 'daily_cleanup', '2026-01-19', 'success', 'Cancelled 0 expired bookings'),
('533977e8-da56-43ad-9c8b-f3aa053c5f64', 'check_out_reminder', '2026-03-04', 'success', 'Sent 0 reminders, 0 failed'),
('576a9bc9-593b-4f50-9d31-83d60edd0c5a', 'check_out_reminder', '2026-01-17', 'success', 'Sent 0 reminders, 0 failed'),
('5c92b807-9412-4751-bf8d-ae5e4703317b', 'check_out_reminder', '2026-04-12', 'success', 'Sent 0 reminders, 0 failed'),
('5cb8a248-3de5-41c6-8c0c-ec278b1f56a4', 'check_in_reminder_24h', '2026-06-17', 'success', 'Sent 0 reminders, 0 failed'),
('5db7de52-6030-4f9a-a88b-db1de31500e1', 'check_in_reminder_24h', '2026-05-16', 'success', 'Sent 0 reminders, 0 failed'),
('66099496-635c-4727-9f2f-53845aef19d1', 'daily_cleanup', '2026-04-08', 'success', 'Cancelled 0 expired bookings'),
('6a87defb-247c-42df-ae4c-7b4b92cc19d2', 'check_in_reminder_24h', '2026-02-15', 'success', 'Sent 0 reminders, 0 failed'),
('6d6ba5b9-e24d-45ff-a09e-346a3180580c', 'daily_booking_processor', '2026-01-17', 'success', 'Processed 0 settlements'),
('6e4ae502-4c96-47a0-8a00-2392d88e0a05', 'check_in_reminder_24h', '2026-04-12', 'success', 'Sent 0 reminders, 0 failed'),
('701443ad-55d0-4041-b9f7-4361cc64bad1', 'daily_booking_processor', '2026-05-24', 'success', 'Processed 0 settlements'),
('7c6fe817-663e-4be6-9e8b-00ac32f4d1b9', 'check_in_reminder_24h', '2026-06-17', 'success', 'Sent 0 reminders, 0 failed'),
('8128c684-8420-4a35-86d7-097ee60fd371', 'check_in_reminder_24h', '2026-01-31', 'success', 'Sent 0 reminders, 0 failed'),
('84729866-fe54-44c0-8921-abd38bc8fee5', 'check_out_reminder', '2026-02-03', 'success', 'Sent 0 reminders, 0 failed'),
('849b75d5-e306-4b55-8443-f2871fe54266', 'daily_booking_processor', '2026-01-18', 'success', 'Processed 0 settlements'),
('883ee335-a6d4-4bb5-a41a-78eeb53ce2df', 'daily_cleanup', '2026-01-18', 'success', 'Cancelled 1 expired bookings'),
('89355d86-1c25-4374-b61d-86431e1f7180', 'check_in_reminder_24h', '2026-03-04', 'success', 'Sent 0 reminders, 0 failed'),
('91733ac3-7564-4901-8e31-31e7e78caa36', 'check_in_reminder_24h', '2026-02-17', 'success', 'Sent 0 reminders, 0 failed'),
('93506e2d-40ac-41b4-b135-97e60ef0197e', 'check_in_reminder_24h', '2026-04-08', 'success', 'Sent 0 reminders, 0 failed'),
('949f6a44-4398-44bc-87a3-f2870721b0f7', 'review_request', '2026-04-08', 'success', 'Sent 0 review requests (multi-day), 0 failed'),
('96a21ca2-4310-4684-ae62-b91d34fa4168', 'check_in_reminder_24h', '2026-01-25', 'success', 'Sent 0 reminders, 0 failed'),
('a3a20225-ddd1-44da-9f28-8587a5e500b4', 'check_in_reminder_24h', '2026-01-21', 'success', 'Sent 0 reminders, 0 failed'),
('a6bea39c-534a-475c-bf33-881348ae70dc', 'check_in_reminder_24h', '2026-03-17', 'success', 'Sent 0 reminders, 0 failed'),
('afa328e3-7777-49cc-ab14-c4a7905c743d', 'check_in_reminder_24h', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('b8a071e9-9d55-4e11-b6b7-854b9b00d0b4', 'check_in_reminder_24h', '2026-04-03', 'success', 'Sent 0 reminders, 0 failed'),
('bcf69c72-aaf8-49aa-8eed-8f62ffa4c172', 'check_in_reminder_24h', '2026-02-14', 'success', 'Sent 0 reminders, 1 failed'),
('c28af235-772e-4f61-a247-7f37c46f292f', 'check_out_reminder', '2026-05-24', 'success', 'Sent 0 reminders, 0 failed'),
('c61102c8-aa6b-47b7-a00e-e4f1cac88fc6', 'check_in_reminder_24h', '2026-05-21', 'success', 'Sent 0 reminders, 0 failed'),
('cb1b166c-4bdd-4f9c-9280-fdc110a53529', 'daily_booking_processor', '2026-02-20', 'success', 'Processed 0 settlements'),
('ccdbfb8d-4881-4415-a178-5f3d99e1ad0f', 'check_in_reminder_24h', '2026-03-01', 'success', 'Sent 0 reminders, 0 failed'),
('ccf3d069-5135-4556-93b8-73b8e64e2ced', 'check_out_reminder', '2026-02-15', 'success', 'Sent 0 reminders, 0 failed'),
('ccfe878e-4c7c-4098-875a-ffeec4a38cfd', 'review_request', '2026-01-24', 'success', 'Sent 0 review requests, 0 failed'),
('d4640745-cea1-4aca-a923-9111e6b73baf', 'check_in_reminder_24h', '2026-05-19', 'success', 'Sent 0 reminders, 0 failed'),
('d653fc40-9707-41d0-85a6-b08efe8e75da', 'review_request', '2026-03-22', 'success', 'Sent 0 review requests (multi-day), 0 failed'),
('d71183e4-bae3-47db-bc70-805a4704fff1', 'check_out_reminder', '2026-01-18', 'success', 'Sent 0 reminders, 0 failed'),
('d929f8cc-8995-4008-b945-483a3e21aabe', 'check_in_reminder_24h', '2026-02-20', 'success', 'Sent 0 reminders, 0 failed'),
('e30b9d96-f4c0-4534-a315-5a9f8a5bed3e', 'check_in_reminder_24h', '2026-04-07', 'success', 'Sent 0 reminders, 0 failed'),
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
(1, 'Elevator', 'elevator', 'Building has elevator/lift facility', 'elevator', 'facility', 1, 1, '2026-01-18 00:30:08'),
(2, 'Gym', 'gym', 'On-site gym or fitness center', 'dumbbell', 'facility', 1, 2, '2026-01-18 00:30:08'),
(3, 'Housekeeping', 'housekeeping', 'Regular housekeeping service', 'broom', 'service', 1, 3, '2026-01-18 00:30:08'),
(4, 'Laundry', 'laundry', 'Laundry service or facilities', 'washing-machine', 'service', 1, 4, '2026-01-18 00:30:08'),
(5, 'Parking', 'parking', 'Dedicated parking space', 'car', 'facility', 1, 5, '2026-01-18 00:30:08'),
(6, 'Power Backup', 'power_backup', 'Power backup generator', 'battery', 'utility', 1, 6, '2026-01-18 00:30:08'),
(7, 'Security', 'security', '24/7 security service', 'shield', 'security', 1, 7, '2026-01-18 00:30:08'),
(8, 'Workspace', 'workspace', 'Dedicated workspace area', 'desk', 'facility', 1, 8, '2026-01-18 00:30:08');

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
(1, 'check_in', 'Check-in guidelines and procedures', 1, 1, '2026-01-18 05:03:42'),
(2, 'house_rules', 'House rules and regulations', 2, 1, '2026-01-18 05:03:42'),
(3, 'amenities', 'Amenities usage guide', 3, 1, '2026-01-18 05:03:42'),
(4, 'safety', 'Safety and security information', 4, 1, '2026-01-18 05:03:42'),
(5, 'local_area', 'Local area information and recommendations', 5, 1, '2026-01-18 05:03:42'),
(6, 'emergency', 'Emergency contacts and procedures', 6, 1, '2026-01-18 05:03:42');

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
('3ed7a7cc-d180-4c81-bfd5-c9a2f519c49d', 100012, '3c5e8c53-794f-4820-a5ac-ee46aa587004', '244c2909-85ef-4d38-8a0a-2723ff145942', 45000.00, 8100.00, 55350.00, 'invoice', '2026-02-21 21:54:20'),
('416c53a3-d48e-4b71-91f4-3b96bd33718f', 100017, '95f0abbe-fb09-4f6f-b571-c8640620addc', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 9000.00, 1620.00, 11070.00, 'invoice', '2026-04-08 10:56:34'),
('f2a18607-7858-4d55-8367-54891b1d4484', 100016, 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 96000.00, 17280.00, 118080.00, 'invoice', '2026-04-05 14:57:24'),
('fcba624e-8264-43e6-b0be-e3f3bb20474f', 100011, '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', '244c2909-85ef-4d38-8a0a-2723ff145942', 45000.00, 8100.00, 55350.00, 'invoice', '2026-02-21 21:47:41'),
('invoice-001', 100001, 'booking-test-001', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 51600.00, 9468.00, 61068.00, 'invoice', '2026-01-07 23:35:00'),
('invoice-002', 100002, 'booking-test-002', 'user-test-001', 21200.00, 3816.00, 25016.00, 'invoice', '2026-01-09 00:05:00'),
('invoice-003', 100003, 'booking-test-004', 'user-test-003', 95000.00, 18000.00, 113000.00, 'invoice', '2026-01-09 23:05:00'),
('invoice-004', 100004, 'booking-test-005', 'user-test-004', 36000.00, 6480.00, 42480.00, 'invoice', '2026-01-10 00:05:00'),
('invoice-005', 100005, 'booking-test-008', 'user-test-008', 46000.00, 8640.00, 54640.00, 'invoice', '2025-12-19 23:10:00'),
('invoice-007', 100007, 'booking-test-011', 'user-test-001', 16000.00, 2880.00, 18880.00, 'invoice', '2025-11-24 17:35:00'),
('invoice-008', 100008, 'booking-test-012', 'user-test-002', 20000.00, 3600.00, 23600.00, 'invoice', '2025-11-09 18:35:00'),
('invoice-009', 100009, 'booking-test-013', 'user-test-003', 42500.00, 7650.00, 50150.00, 'invoice', '2025-10-14 19:35:00'),
('invoice-010', 100010, 'booking-test-014', 'user-test-005', 69000.00, 12420.00, 81420.00, 'invoice', '2025-09-19 16:35:00');

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
(1, 'metro', 'train', 'transport', 1, 1, '2026-01-18 05:03:42'),
(2, 'airport', 'flight', 'transport', 2, 1, '2026-01-18 05:03:42'),
(3, 'hospital', 'medical', 'healthcare', 3, 1, '2026-01-18 05:03:42'),
(4, 'mall', 'shopping', 'commercial', 4, 1, '2026-01-18 05:03:42'),
(5, 'it_park', 'business', 'tech', 5, 1, '2026-01-18 05:03:42'),
(6, 'school', 'school', 'education', 6, 1, '2026-01-18 05:03:42'),
(7, 'restaurant', 'restaurant', 'commercial', 7, 1, '2026-01-18 05:03:42'),
(8, 'gym', 'fitness', 'other', 8, 1, '2026-01-18 05:03:42');

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
('admin@zevio.in', 2, NULL, '2026-04-15 13:05:46'),
('hello@zevio.in', 4, NULL, '2026-04-15 13:05:46'),
('john.admin@zevio.com', 1, NULL, '2026-06-17 18:13:38'),
('mithunmanju77@gmail.com', 2, NULL, '2026-04-08 11:38:49'),
('nobody@nobody.com', 5, '2026-04-16 00:56:14', '2026-04-15 13:41:14'),
('priya@example.com', 4, NULL, '2026-05-21 12:00:09'),
('ranjithgopafy@gmail.com', 1, NULL, '2026-04-08 11:38:59'),
('superadmin@zevio.in', 1, NULL, '2026-04-15 13:05:46'),
('wrong@email.com', 2, NULL, '2026-04-08 11:08:02');

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
('07a95efd-8331-4509-af51-45093dd64a9a', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 'cashfree', '5114926894326', 118080.00, 'success', '2026-04-05 14:53:23'),
('24c40d7b-aa56-4297-ae59-90fc6774b3b5', 'b52e0912-4644-41dc-b638-2b9d9dd471f7', 'cashfree', 'b52e0912-4644-41dc-b638-2b9d9dd471f7_1779390930581', 17220.00, 'pending', '2026-05-21 13:45:30'),
('29789049-a094-4de6-a595-566d00ebad7e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413384097', 19680.00, 'pending', '2026-04-05 12:53:04'),
('8d849a61-53cb-48b5-9f72-3fddb36fd172', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413101902', 19680.00, 'pending', '2026-04-05 12:48:22'),
('8e595c87-4258-4abd-974a-c65833be2338', '3c5e8c53-794f-4820-a5ac-ee46aa587004', 'cashfree', '3c5e8c53-794f-4820-a5ac-ee46aa587004_1771730659999', 55350.00, 'success', '2026-02-21 21:54:20'),
('a3db1c2e-a4cd-4fa4-982a-72e451174bbd', '95f0abbe-fb09-4f6f-b571-c8640620addc', 'cashfree', '5114926993004', 11070.00, 'success', '2026-04-08 10:56:09'),
('b0dd0063-8775-452d-a69d-9ca3373feab4', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413497024', 19680.00, 'pending', '2026-04-05 12:54:57'),
('bbd7cb58-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 'razorpay', 'pay_test_123456789', 53100.00, 'success', '2025-12-28 12:42:13'),
('d085b227-f211-414b-aaf7-75cc41d906c1', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775412120276', 137760.00, 'pending', '2026-04-05 12:32:00'),
('dafc1185-b8bc-43c1-bf4a-a20866f47139', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413599327', 19680.00, 'pending', '2026-04-05 12:56:39'),
('e93f51b7-4be7-442e-bf96-307a0e704af9', 'b52e0912-4644-41dc-b638-2b9d9dd471f7', 'cashfree', 'b52e0912-4644-41dc-b638-2b9d9dd471f7_1779392302350', 17220.00, 'pending', '2026-05-21 14:08:22'),
('f44aef42-809f-4d64-a731-6cccbb88428c', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775413248705', 19680.00, 'pending', '2026-04-05 12:50:48'),
('f4bbfda3-f7aa-4e51-823d-2bae6ae4801c', '3bb8abff-d1f9-4b6d-9a60-ce158e3f9a20', 'cashfree', '3bb8abff-d1f9-4b6d-9a60-ce158e3f9a20_1773333917176', 36900.00, 'pending', '2026-03-12 11:15:17'),
('fca89534-33b6-4966-81b8-1d06adc56857', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 'cashfree', 'd5133df0-cec7-48eb-9eb0-af30118d3001_1775412952556', 157440.00, 'pending', '2026-04-05 12:45:52'),
('fe71da5f-0315-4524-b584-ec6bbde9c6a5', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e', 'cashfree', '82b4cf48-b0bd-49e8-acfb-4ff3d2c3507e_1771730095281', 55350.00, 'success', '2026-02-21 21:44:55'),
('payment-test-001', 'booking-test-001', 'razorpay', 'pay_rzp_test_001', 61068.00, 'success', '2026-01-07 23:35:00'),
('payment-test-002', 'booking-test-002', 'razorpay', 'pay_rzp_test_002', 25016.00, 'success', '2026-01-09 00:05:00'),
('payment-test-004', 'booking-test-004', 'razorpay', 'pay_rzp_test_004', 113000.00, 'success', '2026-01-09 23:05:00'),
('payment-test-005', 'booking-test-005', 'razorpay', 'pay_rzp_test_005', 42480.00, 'success', '2026-01-10 00:05:00'),
('payment-test-008', 'booking-test-008', 'razorpay', 'pay_rzp_test_008', 54640.00, 'success', '2025-12-19 23:10:00'),
('payment-test-009', 'booking-test-009', 'razorpay', 'pay_rzp_test_009', 82600.00, 'success', '2026-01-10 02:05:00'),
('payment-test-010', 'booking-test-010', 'razorpay', 'pay_rzp_test_010', 28320.00, 'success', '2026-01-09 21:05:00'),
('payment-test-011', 'booking-test-011', 'razorpay', 'pay_rzp_test_011', 18880.00, 'success', '2025-11-24 17:35:00'),
('payment-test-012', 'booking-test-012', 'razorpay', 'pay_rzp_test_012', 23600.00, 'success', '2025-11-09 18:35:00'),
('payment-test-013', 'booking-test-013', 'razorpay', 'pay_rzp_test_013', 50150.00, 'success', '2025-10-14 19:35:00'),
('payment-test-014', 'booking-test-014', 'razorpay', 'pay_rzp_test_014', 81420.00, 'success', '2025-09-19 16:35:00');

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
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `priority_order` int(11) NOT NULL DEFAULT 0,
  `featured_at` datetime DEFAULT NULL,
  `featured_by` varchar(36) DEFAULT NULL,
  `recommended_priority` int(11) DEFAULT 0 COMMENT 'Display order priority (higher = shown first, 1-12 range)',
  `recommended_at` timestamp NULL DEFAULT NULL COMMENT 'When property was marked as recommended',
  `recommended_by` char(36) DEFAULT NULL COMMENT 'Admin ID who marked it as recommended',
  `maps_location` varchar(500) DEFAULT NULL COMMENT 'Google Maps URL or coordinates for property location',
  `pool_type` enum('none','private','shared') NOT NULL DEFAULT 'none',
  `garden_type` enum('none','private','shared','terrace') NOT NULL DEFAULT 'none',
  `pets_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `events_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `event_capacity` int(11) DEFAULT NULL,
  `primary_incharge_name` varchar(150) DEFAULT NULL,
  `primary_incharge_phone` varchar(20) DEFAULT NULL,
  `primary_incharge_email` varchar(150) DEFAULT NULL,
  `primary_incharge_whatsapp` varchar(20) DEFAULT NULL,
  `primary_incharge_alt_contact` varchar(20) DEFAULT NULL,
  `secondary_incharge_name` varchar(150) DEFAULT NULL,
  `secondary_incharge_phone` varchar(20) DEFAULT NULL,
  `secondary_incharge_email` varchar(150) DEFAULT NULL,
  `secondary_incharge_whatsapp` varchar(20) DEFAULT NULL,
  `secondaryincharge_alt_contact` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `vendor_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `living_area`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `emergency_contacts`, `local_area_info`, `safety_information`, `amenities_guide`, `house_rules_text`, `check_in_guidelines`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`, `is_recommended`, `is_featured`, `priority_order`, `featured_at`, `featured_by`, `recommended_priority`, `recommended_at`, `recommended_by`, `maps_location`, `pool_type`, `garden_type`, `pets_allowed`, `events_allowed`, `event_capacity`, `primary_incharge_name`, `primary_incharge_phone`, `primary_incharge_email`, `primary_incharge_whatsapp`, `primary_incharge_alt_contact`, `secondary_incharge_name`, `secondary_incharge_phone`, `secondary_incharge_email`, `secondary_incharge_whatsapp`, `secondaryincharge_alt_contact`) VALUES
('026c1c8a-48bf-4503-987a-71e1da681ea5', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:36:23', '2026-04-15 13:36:26', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('085785eb-9d0e-45e9-b5ed-a333a67cfe20', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa UPDATED 1774156640583', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-21 23:47:20', '2026-03-21 23:47:20', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('0c354b38-a36f-4036-aea2-111542bf7d5a', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:41:14', NULL, 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('0ec3937c-ae69-4bfa-92c4-fb2a9cc2f516', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'EDITED TITLE - 1776279575735', 'Updated description from modal edit', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 4, 3, 2500, 8, 0, NULL, '2:00 PM', '10:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"quiet_hours\":\"10 PM - 8 AM\"}', '{\"policy_type\":\"moderate\",\"refund_days\":5}', 'Police: 100, Fire: 101', 'Near beach and market', 'Fire extinguisher on each floor', NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-04-15 13:29:35', '2026-04-15 13:29:35', 2, 30, 'daily', 'weekly', 1, 2, NULL, 100, 'JioFiber', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'private', 'none', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('0fe5bba3-a6cd-4770-a0a8-4bf6391d6f5d', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'EDITED TITLE - 1776278412964', 'Updated description from modal edit', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 4, 3, 2500, 8, 0, NULL, '2:00 PM', '10:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"quiet_hours\":\"10 PM - 8 AM\"}', '{\"policy_type\":\"moderate\",\"refund_days\":5}', 'Police: 100, Fire: 101', 'Near beach and market', 'Fire extinguisher on each floor', NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-04-15 13:10:12', '2026-04-15 13:10:13', 2, 30, 'daily', 'weekly', 1, 2, NULL, 100, 'JioFiber', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'private', 'none', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('14821022-3028-4e3e-aa5e-3e5116ff9e36', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'TEST Vendor Villa EDITED', 'Updated by vendor', '456 Vendor St', NULL, NULL, NULL, 2, 1, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 03:14:08', '2026-04-04 03:14:08', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('154f2940-ce9f-45f8-b9b4-c11207d1d694', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'VENDOR UPDATED PROPERTY', 'Vendor automated test', '789 Vendor Street', 'Vendor Area', 'Vendor State', '600001', 3, 1, 1, 4, 1, NULL, '1:00 PM', '11:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"11:00 PM - 7:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<p>Vendor emergency</p>', '<p>Vendor local</p>', '<p>Vendor safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:46:31', '2026-04-15 13:46:31', 1, NULL, 'weekly', 'weekly', 0, 1, NULL, 50, 'BSNL', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('1db47368-708b-433a-a112-459894f9a5f5', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:37:53', '2026-04-15 13:37:55', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('242cedda-a5d9-4b2a-80b4-f6a0e60c4a53', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'VENDOR UPDATED PROPERTY', 'Vendor automated test', '789 Vendor Street', 'Vendor Area', 'Vendor State', '600001', 3, 1, 1, 4, 1, NULL, '1:00 PM', '11:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"11:00 PM - 7:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<p>Vendor emergency</p>', '<p>Vendor local</p>', '<p>Vendor safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:36:26', '2026-04-15 13:36:26', 1, NULL, 'weekly', 'weekly', 0, 1, NULL, 50, 'BSNL', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3a2534cc-ffe4-414e-a761-764fce5be3bb', NULL, NULL, NULL, 'TEST Admin Villa EDITED', 'Updated by admin', NULL, NULL, NULL, NULL, 0, 0, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '', '', '', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 03:13:25', '2026-04-04 03:13:25', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('3d540e5d-c1df-4f37-887f-75eed9608663', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'EDITED TITLE - 1776278276005', 'Updated description from modal edit', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 4, 3, 2500, 8, 0, NULL, '2:00 PM', '10:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"quiet_hours\":\"10 PM - 8 AM\"}', '{\"policy_type\":\"moderate\",\"refund_days\":5}', 'Police: 100, Fire: 101', 'Near beach and market', 'Fire extinguisher on each floor', NULL, NULL, NULL, '[]', 0.00, 0, 'approved', '2026-04-15 13:07:55', '2026-04-15 13:07:56', 2, 30, 'daily', 'weekly', 1, 2, NULL, 100, 'JioFiber', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'private', 'none', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('40bb16f7-bba7-4b3d-88c6-932bdebfd384', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'New Lake Villa', 'This is a new beach villa', 'Bangalore', 'Bangalore', 'Karnataka', '560085', 1, 1, 1, 2, 1, NULL, '2:00 PM', '11:00 AM', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"c\",\"3\":\"h\",\"4\":\"e\",\"5\":\"c\",\"6\":\"k\",\"7\":\"_\",\"8\":\"i\",\"9\":\"n\",\"10\":\"_\",\"11\":\"a\",\"12\":\"f\",\"13\":\"t\",\"14\":\"e\",\"15\":\"r\",\"16\":\"\\\"\",\"17\":\":\",\"18\":\"\\\"\",\"19\":\"2\",\"20\":\":\",\"21\":\"0\",\"22\":\"0\",\"23\":\" \",\"24\":\"P\",\"25\":\"M\",\"26\":\"\\\"\",\"27\":\",\",\"28\":\"\\\"\",\"29\":\"c\",\"30\":\"h\",\"31\":\"e\",\"32\":\"c\",\"33\":\"k\",\"34\":\"_\",\"35\":\"o\",\"36\":\"u\",\"37\":\"t\",\"38\":\"_\",\"39\":\"b\",\"40\":\"e\",\"41\":\"f\",\"42\":\"o\",\"43\":\"r\",\"44\":\"e\",\"45\":\"\\\"\",\"46\":\":\",\"47\":\"\\\"\",\"48\":\"1\",\"49\":\"1\",\"50\":\":\",\"51\":\"0\",\"52\":\"0\",\"53\":\" \",\"54\":\"A\",\"55\":\"M\",\"56\":\"\\\"\",\"57\":\",\",\"58\":\"\\\"\",\"59\":\"n\",\"60\":\"o\",\"61\":\"_\",\"62\":\"s\",\"63\":\"m\",\"64\":\"o\",\"65\":\"k\",\"66\":\"i\",\"67\":\"n\",\"68\":\"g\",\"69\":\"\\\"\",\"70\":\":\",\"71\":\"t\",\"72\":\"r\",\"73\":\"u\",\"74\":\"e\",\"75\":\",\",\"76\":\"\\\"\",\"77\":\"n\",\"78\":\"o\",\"79\":\"_\",\"80\":\"p\",\"81\":\"a\",\"82\":\"r\",\"83\":\"t\",\"84\":\"i\",\"85\":\"e\",\"86\":\"s\",\"87\":\"\\\"\",\"88\":\":\",\"89\":\"t\",\"90\":\"r\",\"91\":\"u\",\"92\":\"e\",\"93\":\",\",\"94\":\"\\\"\",\"95\":\"n\",\"96\":\"o\",\"97\":\"_\",\"98\":\"e\",\"99\":\"v\",\"100\":\"e\",\"101\":\"n\",\"102\":\"t\",\"103\":\"s\",\"104\":\"\\\"\",\"105\":\":\",\"106\":\"f\",\"107\":\"a\",\"108\":\"l\",\"109\":\"s\",\"110\":\"e\",\"111\":\",\",\"112\":\"\\\"\",\"113\":\"p\",\"114\":\"e\",\"115\":\"t\",\"116\":\"s\",\"117\":\"_\",\"118\":\"a\",\"119\":\"l\",\"120\":\"l\",\"121\":\"o\",\"122\":\"w\",\"123\":\"e\",\"124\":\"d\",\"125\":\"\\\"\",\"126\":\":\",\"127\":\"t\",\"128\":\"r\",\"129\":\"u\",\"130\":\"e\",\"131\":\",\",\"132\":\"\\\"\",\"133\":\"p\",\"134\":\"e\",\"135\":\"t\",\"136\":\"s\",\"137\":\"_\",\"138\":\"a\",\"139\":\"p\",\"140\":\"p\",\"141\":\"r\",\"142\":\"o\",\"143\":\"v\",\"144\":\"a\",\"145\":\"l\",\"146\":\"_\",\"147\":\"r\",\"148\":\"e\",\"149\":\"q\",\"150\":\"u\",\"151\":\"i\",\"152\":\"r\",\"153\":\"e\",\"154\":\"d\",\"155\":\"\\\"\",\"156\":\":\",\"157\":\"f\",\"158\":\"a\",\"159\":\"l\",\"160\":\"s\",\"161\":\"e\",\"162\":\",\",\"163\":\"\\\"\",\"164\":\"q\",\"165\":\"u\",\"166\":\"i\",\"167\":\"e\",\"168\":\"t\",\"169\":\"_\",\"170\":\"h\",\"171\":\"o\",\"172\":\"u\",\"173\":\"r\",\"174\":\"s\",\"175\":\"\\\"\",\"176\":\":\",\"177\":\"\\\"\",\"178\":\"1\",\"179\":\"0\",\"180\":\":\",\"181\":\"0\",\"182\":\"0\",\"183\":\" \",\"184\":\"P\",\"185\":\"M\",\"186\":\" \",\"187\":\"-\",\"188\":\" \",\"189\":\"8\",\"190\":\":\",\"191\":\"0\",\"192\":\"0\",\"193\":\" \",\"194\":\"A\",\"195\":\"M\",\"196\":\"\\\"\",\"197\":\",\",\"198\":\"\\\"\",\"199\":\"a\",\"200\":\"d\",\"201\":\"d\",\"202\":\"i\",\"203\":\"t\",\"204\":\"i\",\"205\":\"o\",\"206\":\"n\",\"207\":\"a\",\"208\":\"l\",\"209\":\"_\",\"210\":\"r\",\"211\":\"u\",\"212\":\"l\",\"213\":\"e\",\"214\":\"s\",\"215\":\"\\\"\",\"216\":\":\",\"217\":\"[\",\"218\":\"]\",\"219\":\"}\",\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"12:00 PM - 6:00 AM\",\"additional_rules\":[]}', '\"{\\\"policy_type\\\":\\\"Flexible\\\",\\\"free_cancellation_hours\\\":48,\\\"free_cancellation_text\\\":\\\"Free cancellation for 48 hours after booking\\\",\\\"partial_refund_days\\\":7,\\\"partial_refund_percentage\\\":50,\\\"partial_refund_text\\\":\\\"Cancel up to 7 days before check-in for a 50% refund\\\",\\\"no_refund_text\\\":\\\"Cancellations within 7 days are non-refundable\\\",\\\"cleaning_fee_refundable\\\":true,\\\"service_fee_refundable_hours\\\":48,\\\"notes\\\":\\\"\\\"}\"', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', NULL, NULL, NULL, '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-4183852f-cd6a-4f98-9e01-8111072a9b50.webp\"]', 0.00, 0, 'approved', '2026-03-28 10:25:39', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, 'https://www.google.com/maps?q=18.7533,73.4069', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('43fbca17-da17-419f-b72a-f2d44d1caf5f', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', 'Karnataka', '560085', 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[],\"no_events\":false,\"pets_approval_required\":false}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', '', '', '', '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-2f442099-c9cc-4d22-93ba-c021ee67e08f.webp\",\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-434c0d40-8547-451b-b78e-1e634d37ae1c.webp\"]', 0.00, 0, 'approved', '2026-03-19 04:53:05', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 0, 0, NULL, NULL, 5, '2026-03-19 06:51:11', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL, 'Suresh Kumar', '+91 98765 43210', 'suresh@zevio.in', '+91 98765 43210', '+91 98765 11111', 'Anita Sharma', '+91 91234 56789', 'anita@zevio.in', '+91 91234 56789', NULL),
('495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Compact 1BHK Service Apartment - Andheri East', 'Cozy 1BHK service apartment near Andheri East metro station, perfect for solo professionals.', '789 Chakala Road, Andheri East', 'Andheri East', 'Maharashtra', '400093', 1, 1, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li><li><strong>Reception Desk:</strong> For immediate assistance</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Metro/bus station within walking distance</li><li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li><li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li><li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li><li><strong>ATM:</strong> Banking services available nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Extinguisher:</strong> Located near main entrance</li><li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li><li><strong>Emergency Exits:</strong> Clearly marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel on premises</li><li><strong>CCTV:</strong> Common areas under surveillance</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li><li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li><li><strong>Laundry:</strong> Washing machine available in unit or common area</li><li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li><li><strong>TV &amp; Entertainment:</strong> Smart TV with streaming services</li><li><strong>Housekeeping:</strong> Regular cleaning service included</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>No loud music or parties</li><li>Maximum guests as per booking confirmation</li><li>Pets not allowed unless specified</li><li>Visitors allowed between 9:00 AM - 9:00 PM only</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li><li><strong>Key Collection:</strong> Keys available at reception with valid ID</li><li><strong>Parking:</strong> Designated parking slots available</li></ul>', '[\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\",\r\n\"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200\",\r\n\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200\",\r\n\"https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=1200\",\r\n\"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 15:36:52', NULL, 3, 180, 'weekly', 'weekly', 1, 0, 8, 100, 'Hathway Broadband', 'fully_furnished', 1, 0, 0, NULL, NULL, 2, '2026-01-31 14:10:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.1136,72.8697', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('495cf369-f31f-11f0-8f27-00410e2b5e6e', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', 'bb65409d-e418-11f0-9f30-00410e2b5e6e', 'pt-002', 'Premium 2BHK Service Apartment - BKC', 'Luxury 2BHK in Bandra Kurla Complex with stunning city views. Perfect for corporate executives.', '101 Peninsula Tower, BKC', 'BKC', 'Maharashtra', '400051', 2, 2, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (contact details provided at check-in)</li><li><strong>Reception Desk:</strong> For immediate assistance</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Metro/bus station within walking distance</li><li><strong>Restaurants:</strong> Multiple dining options within 1km radius</li><li><strong>Shopping:</strong> Supermarket and convenience stores nearby</li><li><strong>Healthcare:</strong> Hospital and pharmacy within 2km</li><li><strong>ATM:</strong> Banking services available nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Extinguisher:</strong> Located near main entrance</li><li><strong>First Aid Kit:</strong> Available in kitchen cabinet</li><li><strong>Emergency Exits:</strong> Clearly marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel on premises</li><li><strong>CCTV:</strong> Common areas under surveillance</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed internet available (credentials in welcome packet)</li><li><strong>Kitchen:</strong> Fully equipped with appliances, cookware, and utensils</li><li><strong>Laundry:</strong> Washing machine available in unit or common area</li><li><strong>Air Conditioning:</strong> Individual AC controls in all rooms</li><li><strong>TV &amp; Entertainment:</strong> Smart TV with streaming services</li><li><strong>Housekeeping:</strong> Regular cleaning service included</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>No loud music or parties</li><li>Maximum guests as per booking confirmation</li><li>Pets not allowed unless specified</li><li>Visitors allowed between 9:00 AM - 9:00 PM only</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>ID Proof Required:</strong> Government-issued photo ID at check-in</li><li><strong>Key Collection:</strong> Keys available at reception with valid ID</li><li><strong>Parking:</strong> Designated parking slots available</li></ul>', '[\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185127-6a4e3ab5c2e1?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687664-6bece1f7a565?w=1200\"]', 0.00, 0, 'approved', '2026-01-16 15:36:52', NULL, 7, 365, 'daily', 'weekly', 1, 2, 18, 200, 'Jio Fiber', 'fully_furnished', 1, 0, 0, NULL, NULL, 1, '2026-01-31 14:10:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=19.0596,72.8656', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('65ee5e0d-85e0-47fc-be08-b78fd36e484d', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:44:26', '2026-04-15 13:44:28', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('6976d478-d48f-4f32-814a-3a14b86f6dab', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'TEST Vendor Villa 1775292205841', 'Test vendor property', '456 Vendor St', NULL, NULL, NULL, 2, 1, 1, 4, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 03:13:25', '2026-04-04 03:13:25', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('75ab208f-d5bd-4a8c-83be-02355a5abfac', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:39:55', '2026-04-15 13:39:58', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('7a4b6219-dd54-4084-b343-ce65c24176df', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Sunrise Villa Goa', 'A beautiful beachside villa in North Goa with private pool, 4 bedrooms, and stunning sunset views. Ideal for family getaways and celebrations.', '45, Beach Road, Calangute, Goa 403516', 'Calangute', 'Goa', '403516', 4, 4, 1, 8, 1, NULL, '2:00 PM', '11:00 AM', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"c\",\"3\":\"h\",\"4\":\"e\",\"5\":\"c\",\"6\":\"k\",\"7\":\"_\",\"8\":\"i\",\"9\":\"n\",\"10\":\"_\",\"11\":\"a\",\"12\":\"f\",\"13\":\"t\",\"14\":\"e\",\"15\":\"r\",\"16\":\"\\\"\",\"17\":\":\",\"18\":\"\\\"\",\"19\":\"2\",\"20\":\":\",\"21\":\"0\",\"22\":\"0\",\"23\":\" \",\"24\":\"P\",\"25\":\"M\",\"26\":\"\\\"\",\"27\":\",\",\"28\":\"\\\"\",\"29\":\"c\",\"30\":\"h\",\"31\":\"e\",\"32\":\"c\",\"33\":\"k\",\"34\":\"_\",\"35\":\"o\",\"36\":\"u\",\"37\":\"t\",\"38\":\"_\",\"39\":\"b\",\"40\":\"e\",\"41\":\"f\",\"42\":\"o\",\"43\":\"r\",\"44\":\"e\",\"45\":\"\\\"\",\"46\":\":\",\"47\":\"\\\"\",\"48\":\"1\",\"49\":\"1\",\"50\":\":\",\"51\":\"0\",\"52\":\"0\",\"53\":\" \",\"54\":\"A\",\"55\":\"M\",\"56\":\"\\\"\",\"57\":\",\",\"58\":\"\\\"\",\"59\":\"n\",\"60\":\"o\",\"61\":\"_\",\"62\":\"s\",\"63\":\"m\",\"64\":\"o\",\"65\":\"k\",\"66\":\"i\",\"67\":\"n\",\"68\":\"g\",\"69\":\"\\\"\",\"70\":\":\",\"71\":\"t\",\"72\":\"r\",\"73\":\"u\",\"74\":\"e\",\"75\":\",\",\"76\":\"\\\"\",\"77\":\"n\",\"78\":\"o\",\"79\":\"_\",\"80\":\"p\",\"81\":\"a\",\"82\":\"r\",\"83\":\"t\",\"84\":\"i\",\"85\":\"e\",\"86\":\"s\",\"87\":\"\\\"\",\"88\":\":\",\"89\":\"t\",\"90\":\"r\",\"91\":\"u\",\"92\":\"e\",\"93\":\",\",\"94\":\"\\\"\",\"95\":\"p\",\"96\":\"e\",\"97\":\"t\",\"98\":\"s\",\"99\":\"_\",\"100\":\"a\",\"101\":\"l\",\"102\":\"l\",\"103\":\"o\",\"104\":\"w\",\"105\":\"e\",\"106\":\"d\",\"107\":\"\\\"\",\"108\":\":\",\"109\":\"f\",\"110\":\"a\",\"111\":\"l\",\"112\":\"s\",\"113\":\"e\",\"114\":\",\",\"115\":\"\\\"\",\"116\":\"q\",\"117\":\"u\",\"118\":\"i\",\"119\":\"e\",\"120\":\"t\",\"121\":\"_\",\"122\":\"h\",\"123\":\"o\",\"124\":\"u\",\"125\":\"r\",\"126\":\"s\",\"127\":\"\\\"\",\"128\":\":\",\"129\":\"\\\"\",\"130\":\"1\",\"131\":\"2\",\"132\":\":\",\"133\":\"0\",\"134\":\"0\",\"135\":\" \",\"136\":\"P\",\"137\":\"M\",\"138\":\" \",\"139\":\"-\",\"140\":\" \",\"141\":\"6\",\"142\":\":\",\"143\":\"0\",\"144\":\"0\",\"145\":\" \",\"146\":\"A\",\"147\":\"M\",\"148\":\"\\\"\",\"149\":\",\",\"150\":\"\\\"\",\"151\":\"a\",\"152\":\"d\",\"153\":\"d\",\"154\":\"i\",\"155\":\"t\",\"156\":\"i\",\"157\":\"o\",\"158\":\"n\",\"159\":\"a\",\"160\":\"l\",\"161\":\"_\",\"162\":\"r\",\"163\":\"u\",\"164\":\"l\",\"165\":\"e\",\"166\":\"s\",\"167\":\"\\\"\",\"168\":\":\",\"169\":\"[\",\"170\":\"]\",\"171\":\"}\",\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"12:00 PM - 6:00 AM\",\"additional_rules\":[]}', '\"{\\\"policy_type\\\":\\\"Flexible\\\",\\\"free_cancellation_hours\\\":48,\\\"free_cancellation_text\\\":\\\"Free cancellation for 48 hours after booking\\\",\\\"partial_refund_days\\\":7,\\\"partial_refund_percentage\\\":50,\\\"partial_refund_text\\\":\\\"Cancel up to 7 days before check-in for a 50% refund\\\",\\\"no_refund_text\\\":\\\"Cancellations within 7 days are non-refundable\\\",\\\"cleaning_fee_refundable\\\":true,\\\"service_fee_refundable_hours\\\":48,\\\"notes\\\":\\\"\\\"}\"', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', NULL, NULL, NULL, '\"[]\"', 0.00, 0, 'approved', '2026-04-08 10:36:47', '2026-04-12 11:34:05', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 0, 0, NULL, NULL, 6, '2026-04-08 10:41:36', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5449,73.7513', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('83feec7d-16d8-4d83-931d-290b0f729a02', NULL, NULL, NULL, 'TEST Admin EDITED', NULL, NULL, NULL, NULL, NULL, 0, 0, 1, 2, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', '', '', '', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-04 03:14:08', '2026-04-04 03:14:08', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('9adf50b7-182b-484b-8d17-775f202e6993', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:45:41', '2026-04-15 13:45:43', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('a4465384-6fa3-4be4-be6c-8ec5c8764003', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'CAL TEST', 'x', 'x', 'x', 'x', '400001', 1, 1, 1, 2, 0, NULL, '1:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:36:49', '2026-04-15 13:36:49', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('ad4a2bea-3e21-4761-abc6-520846aba0ab', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa 1774160542970', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-22 00:52:22', '2026-03-29 08:55:24', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'bb655349-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Luxury Beach Villa - Goa', 'Stunning 4BHK beachfront villa with private pool, modern amenities, breathtaking ocean views, and newly added jacuzzi. Perfect for families and groups.', 'Candolim Beach Road', 'Candolim', 'Goa', '403515', 4, 4, 1, 10, 0, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\": \"2:00 PM\", \"check_out_before\": \"11:00 AM\", \"no_smoking\": true, \"no_parties\": true, \"no_events\": false, \"pets_allowed\": true, \"pets_approval_required\": true, \"quiet_hours\": \"10:00 PM - 8:00 AM\", \"additional_rules\": [\"Please remove shoes inside the villa\", \"Maintain cleanliness in pool area\", \"No loud music after 10 PM\"]}', '{\"policy_type\": \"Flexible\", \"free_cancellation_hours\": 48, \"free_cancellation_text\": \"Free cancellation for 48 hours after booking\", \"partial_refund_days\": 7, \"partial_refund_percentage\": 50, \"partial_refund_text\": \"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\", \"no_refund_text\": \"Cancellations within 7 days are non-refundable\", \"cleaning_fee_refundable\": true, \"service_fee_refundable_hours\": 48, \"notes\": \"Service fees are refundable if cancelled within 48 hours of booking\"}', '<h3>Emergency Contacts</h3>\n<ul>\n<li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li>\n<li><strong>On-site Caretaker:</strong> For immediate assistance</li>\n<li><strong>Security:</strong> 24/7 monitoring service</li>\n<li><strong>Police Emergency:</strong> 100</li>\n<li><strong>Fire Service:</strong> 101</li>\n<li><strong>Ambulance:</strong> 102</li>\n<li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li>\n</ul>', '<h3>Local Area & Attractions</h3>\n<ul>\n<li><strong>Nearest Town:</strong> 10-15 minutes drive</li>\n<li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li>\n<li><strong>Dining:</strong> Fine dining and local restaurants nearby</li>\n<li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li>\n<li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li>\n<li><strong>Activities:</strong> Contact property manager for local experiences and tours</li>\n</ul>', '<h3>Safety & Security</h3>\n<ul>\n<li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li>\n<li><strong>Secure Gates:</strong> Auto-lock gates with security code</li>\n<li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li>\n<li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li>\n<li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li>\n<li><strong>Emergency Lighting:</strong> Backup power for essential lights</li>\n</ul>', '<h3>Amenities Guide</h3>\n<ul>\n<li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li>\n<li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li>\n<li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li>\n<li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li>\n<li><strong>WiFi:</strong> High-speed internet throughout the property</li>\n<li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li>\n<li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li>\n<li><strong>Laundry:</strong> Washer and dryer available</li>\n</ul>', '<h3>House Rules</h3>\n<ul>\n<li>No smoking inside the villa (outdoor areas designated)</li>\n<li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li>\n<li>Maximum guest capacity strictly enforced</li>\n<li>Events or parties require prior written approval</li>\n<li>Pets allowed only with prior approval and additional deposit</li>\n<li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li>\n<li>BBQ area usage requires permission</li>\n</ul>', '<h3>Check-In Instructions</h3>\n<ul>\n<li><strong>Check-in Time:</strong> 2:00 PM onwards</li>\n<li><strong>Check-out Time:</strong> 11:00 AM</li>\n<li><strong>Key Collection:</strong> Property manager will meet you at the villa</li>\n<li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li>\n<li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li>\n<li><strong>Parking:</strong> Private parking available on premises</li>\n<li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li>\n</ul>', '[\"https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200\",\r\n\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200\",\r\n\"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200\",\r\n\"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200\",\r\n\"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200\",\r\n\"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200\",\r\n\"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200\",\r\n\"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200\",\r\n\"https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200\",\r\n\"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200\"]', 5.00, 1, 'approved', '2025-12-28 12:42:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 0, 0, NULL, NULL, 3, '2026-01-31 14:10:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=15.5183,73.7615', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb655492-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'Hill View Villa with Hot Tub - Lonavala', 'Beautiful 3BHK villa with valley views, private garden, and bonfire area. Close to major attractions like Tiger Point and Bhushi Dam.', 'Tiger Point Road', 'Tiger Point', 'Maharashtra', '410401', 3, 3, 1, 8, 1, 45, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":true,\"pets_approval_required\":true,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund of the nightly rate\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"Standard flexible cancellation policy\"}', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> Available 24/7 (number provided in welcome book)</li><li><strong>On-site Caretaker:</strong> For immediate assistance</li><li><strong>Security:</strong> 24/7 monitoring service</li><li><strong>Police Emergency:</strong> 100</li><li><strong>Fire Service:</strong> 101</li><li><strong>Ambulance:</strong> 102</li><li><strong>Nearest Hospital:</strong> Contact details in welcome folder</li></ul>', '<h3>Local Area &amp; Attractions</h3><ul><li><strong>Nearest Town:</strong> 10-15 minutes drive</li><li><strong>Shopping:</strong> Shopping mall and local markets within 20 minutes</li><li><strong>Dining:</strong> Fine dining and local restaurants nearby</li><li><strong>Medical Facilities:</strong> Multi-specialty hospital 15 minutes away</li><li><strong>Tourist Attractions:</strong> Popular sightseeing spots easily accessible</li><li><strong>Activities:</strong> Contact property manager for local experiences and tours</li></ul>', '<h3>Safety &amp; Security</h3><ul><li><strong>24/7 CCTV:</strong> Surveillance at entry points and common areas</li><li><strong>Secure Gates:</strong> Auto-lock gates with security code</li><li><strong>Pool Safety:</strong> Life vests and floaters available, adult supervision required for children</li><li><strong>Fire Safety:</strong> Smoke detectors and fire extinguishers in kitchen and all bedrooms</li><li><strong>First Aid:</strong> Comprehensive first aid kit located in master bedroom</li><li><strong>Emergency Lighting:</strong> Backup power for essential lights</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>Private Pool:</strong> Cleaned daily, depth 4-5 feet, pool toys available</li><li><strong>Garden:</strong> Landscaped garden for outdoor relaxation</li><li><strong>Kitchen:</strong> Fully equipped with modern appliances and cookware</li><li><strong>BBQ Area:</strong> Outdoor grill available (inform staff before use)</li><li><strong>WiFi:</strong> High-speed internet throughout the property</li><li><strong>Smart Home:</strong> Voice-controlled lighting and temperature control</li><li><strong>Entertainment:</strong> Smart TVs in living area and bedrooms</li><li><strong>Laundry:</strong> Washer and dryer available</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the villa (outdoor areas designated)</li><li>Quiet hours: 10:00 PM - 8:00 AM (respect neighborhood)</li><li>Maximum guest capacity strictly enforced</li><li>Events or parties require prior written approval</li><li>Pets allowed only with prior approval and additional deposit</li><li>Pool usage: 7:00 AM - 9:00 PM (children must be supervised)</li><li>BBQ area usage requires permission</li></ul>', '<h3>Check-In Instructions</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Property manager will meet you at the villa</li><li><strong>ID Proof:</strong> Valid government-issued ID required for all guests</li><li><strong>Security Deposit:</strong> Refundable deposit collected at check-in</li><li><strong>Parking:</strong> Private parking available on premises</li><li><strong>Property Overview:</strong> Manager will provide a complete villa tour</li></ul>', '[\"https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-b63059eb-fc58-4a5f-b8a5-efe284e96679.webp\"]', 4.00, 1, 'approved', '2025-12-28 12:42:12', NULL, 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 1, 0, 0, NULL, NULL, 4, '2026-01-31 14:10:31', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'https://www.google.com/maps?q=18.7533,73.4069', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `properties` (`id`, `vendor_id`, `city_id`, `property_type_id`, `title`, `description`, `address`, `area`, `state`, `pincode`, `bedrooms`, `bathrooms`, `living_area`, `max_guests`, `same_day_booking_allowed`, `max_booking_days`, `check_in_time`, `check_out_time`, `house_rules`, `cancellation_policy`, `emergency_contacts`, `local_area_info`, `safety_information`, `amenities_guide`, `house_rules_text`, `check_in_guidelines`, `photos`, `rating`, `reviews_count`, `status`, `created_at`, `deleted_at`, `min_stay_days`, `max_stay_days`, `housekeeping_frequency`, `laundry_frequency`, `utilities_included`, `parking_slots`, `floor_number`, `wifi_speed_mbps`, `wifi_provider`, `furnishing_type`, `is_recommended`, `is_featured`, `priority_order`, `featured_at`, `featured_by`, `recommended_priority`, `recommended_at`, `recommended_by`, `maps_location`, `pool_type`, `garden_type`, `pets_allowed`, `events_allowed`, `event_capacity`, `primary_incharge_name`, `primary_incharge_phone`, `primary_incharge_email`, `primary_incharge_whatsapp`, `primary_incharge_alt_contact`, `secondary_incharge_name`, `secondary_incharge_phone`, `secondary_incharge_email`, `secondary_incharge_whatsapp`, `secondaryincharge_alt_contact`) VALUES
('bf05c16a-e142-4e44-9f4a-a07525b4db50', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'VENDOR UPDATED PROPERTY', 'Vendor automated test', '789 Vendor Street', 'Vendor Area', 'Vendor State', '600001', 3, 1, 1, 4, 1, NULL, '1:00 PM', '11:00 AM', '{\"check_in_after\":\"1:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"pets_allowed\":false,\"quiet_hours\":\"11:00 PM - 7:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', '<p>Vendor emergency</p>', '<p>Vendor local</p>', '<p>Vendor safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:45:43', '2026-04-15 13:45:43', 1, NULL, 'weekly', 'weekly', 0, 1, NULL, 50, 'BSNL', 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('c1330aa4-9670-4988-8b88-8b69e0c15af0', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', NULL, NULL, 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-19 04:48:05', '2026-03-19 04:55:28', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cad80b80-bb08-4fcb-8342-d354cf902df3', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:41:07', NULL, 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('db97f77f-508b-4ea9-bf3a-ffd9f94dfc61', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'CAL2', 'x', 'x', 'x', 'x', '400001', 1, 1, 1, 2, 0, NULL, '1:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:37:10', '2026-04-15 13:37:10', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'TEST Villa UPDATED 1774156120081', 'Automated test property – will be cleaned up', '123 Test Street', 'Test Area', 'Maharashtra', '400001', 3, 2, 1, 6, 0, NULL, '2:00 PM', '11:00 AM', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-21 23:38:39', '2026-03-21 23:38:40', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('f5669fb7-392a-414e-b24c-6865dea64def', 'f10abec0-bc8b-4688-9b73-11eef686b9f3', '0d28b18d-960f-46a9-a12d-25bff6ad9f71', 'pt-001', 'Ranjith Villa', 'This is a dummy villa', 'Sector 12 Vashi Industrial Estate', 'Banashakari', NULL, NULL, 1, 1, 1, 2, 1, 30, '2:00 PM', '11:00 AM', '{\"check_in_after\":\"2:00 PM\",\"check_out_before\":\"11:00 AM\",\"no_smoking\":true,\"no_parties\":true,\"no_events\":false,\"pets_allowed\":false,\"pets_approval_required\":false,\"quiet_hours\":\"10:00 PM - 8:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Flexible\",\"free_cancellation_hours\":48,\"free_cancellation_text\":\"Free cancellation for 48 hours after booking\",\"partial_refund_days\":7,\"partial_refund_percentage\":50,\"partial_refund_text\":\"Cancel up to 7 days before check-in for a 50% refund\",\"no_refund_text\":\"Cancellations within 7 days are non-refundable\",\"cleaning_fee_refundable\":true,\"service_fee_refundable_hours\":48,\"notes\":\"\"}', NULL, NULL, NULL, NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-03-19 04:48:33', '2026-03-19 04:55:22', 1, NULL, 'weekly', 'weekly', 0, 0, NULL, NULL, NULL, 'fully_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, 'https://maps.app.goo.gl/WLSYN4URoBF1KG2h9', 'none', 'none', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('f745a6c6-24ed-4986-9212-c4e3c7161950', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'bb6554fa-e418-11f0-9f30-00410e2b5e6e', 'pt-001', 'UPDATED TEST PROPERTY', 'Updated description', '456 Updated Street', 'Updated Area', 'Updated State', '500001', 4, 3, 3, 8, 0, 60, '3:00 PM', '10:00 AM', '{\"check_in_after\":\"3:00 PM\",\"check_out_before\":\"10:00 AM\",\"no_smoking\":false,\"no_parties\":false,\"pets_allowed\":true,\"quiet_hours\":\"10:00 PM - 6:00 AM\",\"additional_rules\":[]}', '{\"policy_type\":\"Strict\",\"free_cancellation_hours\":24,\"free_cancellation_text\":\"\",\"partial_refund_days\":3,\"partial_refund_percentage\":30,\"partial_refund_text\":\"\",\"no_refund_text\":\"\",\"cleaning_fee_refundable\":false,\"service_fee_refundable_hours\":24,\"notes\":\"\"}', '<p>Updated emergency</p>', '<p>Updated local</p>', '<p>Updated safety</p>', NULL, NULL, NULL, '[]', 0.00, 0, 'draft', '2026-04-15 13:46:29', '2026-04-15 13:46:31', 2, 60, 'daily', '', 0, 3, 2, 200, 'Airtel', 'semi_furnished', 0, 0, 0, NULL, NULL, 0, NULL, NULL, NULL, 'shared', 'shared', 1, 1, 50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
('086cc381-4687-4cf5-b813-f8eb0d60a3fa', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 04:46:35', '2026-03-28 04:46:35'),
('1de7f504-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1de91d4b-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1de9a5a6-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1dea3c5e-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1deaa770-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1deb0b81-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1deb6354-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('1debda75-32ab-11f1-879e-00410e2b5e6e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('2d50ecef-8ca2-40df-b809-dd5442c79219', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 04:46:35', '2026-03-28 04:46:35'),
('45d1de94-1fcc-43f6-a097-447f01b65e7a', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:17:21', '2026-03-28 10:17:21'),
('60f1c168-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 09:53:10', '2026-03-12 09:53:10'),
('60f21989-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 09:53:10', '2026-03-12 09:53:10'),
('60f2681d-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 09:53:10', '2026-03-12 09:53:10'),
('60f2c058-1e27-11f1-b1bd-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 09:53:10', '2026-03-12 09:53:10'),
('649ea06f-e01e-49a4-b9df-612b7ab4122e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:17:21', '2026-03-28 10:17:21'),
('714915fd-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('7149d38a-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('714a3eb7-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('714aa3f2-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('714b03e8-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('714b7194-3366-11f1-9870-00410e2b5e6e', '7a4b6219-dd54-4084-b343-ce65c24176df', '207aabd6-2aca-11f1-902c-00410e2b5e6e', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('7680b4bd-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7681a743-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('76822535-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7682ba63-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb411-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('76834249-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7683cee7-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bba14-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('768453c8-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bc009-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7684df81-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bc1ff-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7685592e-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bbb15-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('7685d6a0-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('76865362-5532-11f1-9cce-00410e2b5e6e', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
('d4470d90-c5a3-4a76-9d39-7b040bbc35fb', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 04:46:35', '2026-03-28 04:46:35'),
('d82b42ab-8b72-4e5e-bc5b-48513c35c7b9', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '5c1bb300-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 04:46:35', '2026-03-28 04:46:35'),
('da5dd951-282f-4474-90de-0549480a78da', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:17:21', '2026-03-28 10:17:21'),
('db356b0c-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1b9238-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 10:39:32', '2026-03-12 10:39:32'),
('db35c56d-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bb90e-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 10:39:32', '2026-03-12 10:39:32'),
('db3629e8-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1bbe0c-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 10:39:32', '2026-03-12 10:39:32'),
('db36ee9d-1e2d-11f1-b1bd-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', '5c1baec3-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-12 10:39:32', '2026-03-12 10:39:32'),
('e4ffa366-c8e1-45e6-8765-1da0c276aff3', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bc112-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:17:21', '2026-03-28 10:17:21'),
('f61ed349-613d-44c5-b793-d886719e0def', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '5c1bb716-f3e6-11f0-8f27-00410e2b5e6e', '2026-03-28 10:17:21', '2026-03-28 10:17:21');

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
  `blackout_source` enum('manual','channel_manager') NOT NULL DEFAULT 'manual',
  `source_provider_key` varchar(50) DEFAULT NULL,
  `source_reference_id` varchar(120) DEFAULT NULL,
  `created_by` enum('admin','vendor') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `property_blackout_dates`
--

INSERT INTO `property_blackout_dates` (`id`, `property_id`, `start_date`, `end_date`, `reason`, `blackout_source`, `source_provider_key`, `source_reference_id`, `created_by`, `created_at`) VALUES
('316b1512-c2fc-4a55-8fd7-2d78539b5a47', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-23', '2026-04-25', 'Maintenance', 'manual', NULL, NULL, 'admin', '2026-04-08 17:27:03'),
('a0f4199a-c5f4-4038-8253-d5b9704a7051', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-27', '2026-03-28', NULL, 'manual', NULL, NULL, 'vendor', '2026-03-19 15:21:09'),
('blackout-002', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-05-10', '2026-05-15', 'Owner personal use', 'manual', NULL, NULL, 'vendor', '2026-01-07 05:30:00'),
('blackout-003', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-07-01', '2026-07-10', 'Monsoon maintenance', 'manual', NULL, NULL, 'admin', '2026-01-08 03:30:00'),
('f6d4c7cc-2784-4960-ba75-cfe4cf125b25', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-03-30', '2026-03-31', NULL, 'manual', NULL, NULL, 'vendor', '2026-03-19 15:21:02');

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
('0646566d-c248-4128-ac23-4cccf3eb051c', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-23', 18000.00, NULL, 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-04-08 10:38:06', '2026-04-08 10:38:06'),
('083e1932-70ef-45e7-aac5-ffd23d7217c2', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-26', 18000.00, NULL, 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-04-08 10:38:06', '2026-04-08 10:38:06'),
('0eff86d0-0e4f-4543-bb7d-b9183c34c8ce', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-21', 5000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:51'),
('12a3476f-4c9e-4724-a2c3-65c516d8641b', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-21', 10000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 04:53:10', '2026-03-19 04:53:10'),
('1e5b86c2-43f1-48dd-b7ff-b31211e76fbc', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-11', 3000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-09 14:23:37', '2026-06-09 14:23:37'),
('202560d4-fce4-4594-8208-1b28e208ec11', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-23', 3100.00, 'Managed by stayflexi (RP01)', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-06-17 17:56:14', '2026-06-17 17:56:14'),
('2a33d52e-e500-4218-9bdd-c61cbd196dd7', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-26', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-17 16:46:30', '2026-06-17 17:02:50'),
('398c4c80-51bd-4494-8f16-6e7e5d8fffc6', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '2026-03-28', 12000.00, NULL, 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-03-28 10:25:41', '2026-03-28 10:25:41'),
('483e9266-8488-4445-91bc-aa40557404e7', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-31', 8000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 04:53:10', '2026-03-19 04:53:10'),
('48a56db7-dbf0-4e97-9890-0c979479d615', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-05-08', 20000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-04-08 10:42:36', '2026-04-08 10:42:36'),
('519daa33-e43f-4446-94eb-10ef942e6c80', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-20', 5000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:51'),
('549bd6dd-8adf-4ba9-a3ca-ad487fa1c0f4', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-10', 3000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-09 14:23:37', '2026-06-09 14:23:37'),
('5e08dff7-f6bf-46a1-9ad5-1094949d3a56', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-18', 3000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:06:52', '2026-06-17 17:02:49'),
('70b85728-8e48-4b14-a7c1-26abc1260b92', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-24', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:50'),
('744de60a-69b0-415f-83aa-47ef9a08cfa0', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-25', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-17 16:46:30', '2026-06-17 17:02:50'),
('80407868-4a11-4a0a-97cb-c3fcddea4499', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-20', 3000.00, 'Managed by stayflexi (RP01)', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('853bff19-98d6-43e8-953d-5263cb64ad71', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-22', 11000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 04:53:10', '2026-03-19 04:53:10'),
('93f2205c-ebb7-413a-82bb-91ea2bbef719', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-22', 5000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:51'),
('99184566-9153-4a18-9603-3b3e061b51e2', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-17', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:06:52', '2026-06-15 07:22:47'),
('9bcd3e72-c3a5-41a8-9174-436091efbcef', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-05', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 13:08:15', '2026-02-20 13:08:15'),
('9d2623fe-dbf1-4835-99fe-1b0d13f5e7ac', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-22', 3000.00, 'Managed by stayflexi (RP01)', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('a4b3e61b-ed99-47c2-a154-eb26770890d4', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-19', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:50'),
('aa8bcb7c-ae47-4651-9f6f-5db7e79c7f59', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-06-21', 3000.00, 'Managed by stayflexi (RP01)', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-06-17 17:47:33', '2026-06-17 17:56:14'),
('bcca3de6-c799-4c61-a5b6-ffd7f5de21d5', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-12', 3000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-09 14:23:37', '2026-06-09 14:23:37'),
('be0b7fa4-b2d4-45d9-aed2-e564911468e1', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-23', 12000.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-03-19 04:53:10', '2026-03-19 04:53:10'),
('c164bfeb-3d34-4095-b621-aad13b801526', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-03', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 13:08:15', '2026-02-20 13:08:15'),
('ce80f81c-638f-4397-94c7-c0c3b98edf2e', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-25', 18000.00, NULL, 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-04-08 10:38:06', '2026-04-08 10:38:06'),
('cf91fa22-85e0-485f-aa42-c6a861a353f4', '495ba81d-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04', 5500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-02-20 13:08:15', '2026-02-20 13:08:15'),
('d98ad9b3-4eae-4129-83fe-f7b540550261', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-23', 2155.00, 'Managed by stayflexi (RP02)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:22:47', '2026-06-17 17:02:50'),
('dadfcec2-28ea-4dbb-b39c-68ce9c2fe5dd', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-24', 18000.00, NULL, 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-04-08 10:38:06', '2026-04-08 10:38:06'),
('e023567f-5c71-46b7-9db2-030672c168d7', '7a4b6219-dd54-4084-b343-ce65c24176df', '2026-04-22', 18000.00, NULL, 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-04-08 10:38:06', '2026-04-08 10:38:06'),
('e77d92cb-365c-48cd-9d53-0be09cb9b37d', '0c354b38-a36f-4036-aea2-111542bf7d5a', '2026-06-16', 3000.00, 'Managed by stayflexi (RP01)', 'dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'admin', '2026-06-15 07:06:52', '2026-06-15 07:22:46'),
('e898706b-fff5-46b5-96da-74bd60dbf00a', 'db97f77f-508b-4ea9-bf3a-ffd9f94dfc61', '2026-05-25', 7500.00, NULL, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admin', '2026-04-15 13:37:10', '2026-04-15 13:37:10'),
('f6d89c92-1ab3-44eb-beaa-876cfe03b942', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', '2026-03-31', 14000.00, NULL, 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendor', '2026-03-28 10:25:41', '2026-03-28 10:25:41');

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
('0552ba50-d498-45b2-9380-eaba9376aec9', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '{\"price_per_night\":13000,\"amenities\":[\"5c1b9238-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb300-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bc112-f3e6-11f0-8f27-00410e2b5e6e\",\"5c1bb716-f3e6-11f0-8f27-00410e2b5e6e\"]}', 'approved', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-03-28 09:49:39', '2026-03-28 10:17:21');

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
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Ranjith (Property Owner)', '+919945554414', 'ranjithgopafy@gmail.com', '+919945554414', NULL, 1, '2026-01-18 05:03:42', '2026-03-05 11:18:34'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, 'Zevio Support', '+919876543210', 'support@zevio.com', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(7, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 1, 'Rajesh Kumar', '+919876543210', 'rajesh.kumar@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(8, 'bb929607-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(9, 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(11, 'bb974859-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(12, 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(13, 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(14, 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(15, 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(16, 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(17, 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 1, 'Ramesh Verma', '+919876543210', 'ramesh.verma@zevio.com', '+919876543210', '+918765432109', 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(32, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(33, 'bb929607-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(34, 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(35, 'bb974859-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(36, 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(37, 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(38, 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(39, 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(40, 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(41, 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', 2, 'Priya Sharma', '+919988776655', 'priya.sharma@zevio.com', '+919988776655', NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(43, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, 'Ranjith (Property Owner)', '+919945554414', 'ranjithgopafy@gmail.com', '+919945554414', NULL, 1, '2026-03-05 11:18:34', '2026-03-05 11:18:34'),
(44, 'c1330aa4-9670-4988-8b88-8b69e0c15af0', 1, 'Zevio', NULL, 'zevio@z.com', '9876543210', NULL, 1, '2026-03-19 04:48:05', '2026-03-19 04:48:05'),
(45, 'f5669fb7-392a-414e-b24c-6865dea64def', 1, 'Zevio', NULL, 'zevio@z.com', '9876543210', NULL, 1, '2026-03-19 04:48:33', '2026-03-19 04:48:33'),
(47, 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 1, 'Test Host', '9876543210', 'host@test.com', NULL, NULL, 1, '2026-03-21 23:38:39', '2026-03-21 23:38:39'),
(48, '085785eb-9d0e-45e9-b5ed-a333a67cfe20', 1, 'Test Host', '9876543210', 'host@test.com', '9876543210', NULL, 1, '2026-03-21 23:47:20', '2026-03-21 23:47:20'),
(49, 'ad4a2bea-3e21-4761-abc6-520846aba0ab', 1, 'Test Host', '9876543210', 'host@test.com', '9876543210', NULL, 1, '2026-03-22 00:52:22', '2026-03-22 00:52:22'),
(55, '3d540e5d-c1df-4f37-887f-75eed9608663', 1, 'John Doe', '9876543210', 'john@test.com', '9876543210', NULL, 1, '2026-04-15 13:07:56', '2026-04-15 13:07:56'),
(56, '3d540e5d-c1df-4f37-887f-75eed9608663', 2, 'Jane Doe', '9876543211', 'jane@test.com', NULL, NULL, 1, '2026-04-15 13:07:56', '2026-04-15 13:07:56'),
(59, '0fe5bba3-a6cd-4770-a0a8-4bf6391d6f5d', 1, 'John Doe', '9876543210', 'john@test.com', '9876543210', NULL, 1, '2026-04-15 13:10:12', '2026-04-15 13:10:12'),
(60, '0fe5bba3-a6cd-4770-a0a8-4bf6391d6f5d', 2, 'Jane Doe', '9876543211', 'jane@test.com', NULL, NULL, 1, '2026-04-15 13:10:13', '2026-04-15 13:10:13'),
(63, '0ec3937c-ae69-4bfa-92c4-fb2a9cc2f516', 1, 'John Doe', '9876543210', 'john@test.com', '9876543210', NULL, 1, '2026-04-15 13:29:35', '2026-04-15 13:29:35'),
(64, '0ec3937c-ae69-4bfa-92c4-fb2a9cc2f516', 2, 'Jane Doe', '9876543211', 'jane@test.com', NULL, NULL, 1, '2026-04-15 13:29:35', '2026-04-15 13:29:35'),
(66, '026c1c8a-48bf-4503-987a-71e1da681ea5', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:36:23', '2026-04-15 13:36:23'),
(67, '026c1c8a-48bf-4503-987a-71e1da681ea5', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:36:23', '2026-04-15 13:36:23'),
(68, '242cedda-a5d9-4b2a-80b4-f6a0e60c4a53', 1, 'Vendor Manager', '9887766554', 'vmanager@test.com', '9887766554', NULL, 1, '2026-04-15 13:36:26', '2026-04-15 13:36:26'),
(70, '1db47368-708b-433a-a112-459894f9a5f5', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:37:53', '2026-04-15 13:37:53'),
(71, '1db47368-708b-433a-a112-459894f9a5f5', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:37:53', '2026-04-15 13:37:53'),
(73, '75ab208f-d5bd-4a8c-83be-02355a5abfac', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:39:55', '2026-04-15 13:39:55'),
(74, '75ab208f-d5bd-4a8c-83be-02355a5abfac', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:39:55', '2026-04-15 13:39:55'),
(76, 'cad80b80-bb08-4fcb-8342-d354cf902df3', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:41:07', '2026-04-15 13:41:07'),
(77, 'cad80b80-bb08-4fcb-8342-d354cf902df3', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:41:07', '2026-04-15 13:41:07'),
(79, '0c354b38-a36f-4036-aea2-111542bf7d5a', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:41:14', '2026-04-15 13:41:14'),
(80, '0c354b38-a36f-4036-aea2-111542bf7d5a', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:41:14', '2026-04-15 13:41:14'),
(82, '65ee5e0d-85e0-47fc-be08-b78fd36e484d', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:44:26', '2026-04-15 13:44:26'),
(83, '65ee5e0d-85e0-47fc-be08-b78fd36e484d', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:44:26', '2026-04-15 13:44:26'),
(85, '9adf50b7-182b-484b-8d17-775f202e6993', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:45:41', '2026-04-15 13:45:41'),
(86, '9adf50b7-182b-484b-8d17-775f202e6993', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:45:41', '2026-04-15 13:45:41'),
(87, 'bf05c16a-e142-4e44-9f4a-a07525b4db50', 1, 'Vendor Manager', '9887766554', 'vmanager@test.com', '9887766554', NULL, 1, '2026-04-15 13:45:43', '2026-04-15 13:45:43'),
(89, 'f745a6c6-24ed-4986-9212-c4e3c7161950', 1, 'Updated Manager', '9112233445', 'updated@test.com', '9112233445', NULL, 1, '2026-04-15 13:46:29', '2026-04-15 13:46:29'),
(90, 'f745a6c6-24ed-4986-9212-c4e3c7161950', 2, 'Second Manager', '9223344556', 'second@test.com', '9223344556', NULL, 1, '2026-04-15 13:46:29', '2026-04-15 13:46:29'),
(91, '154f2940-ce9f-45f8-b9b4-c11207d1d694', 1, 'Vendor Manager', '9887766554', 'vmanager@test.com', '9887766554', NULL, 1, '2026-04-15 13:46:31', '2026-04-15 13:46:31'),
(92, '43fbca17-da17-419f-b72a-f2d44d1caf5f', 1, 'Suresh Kumar', '+91 98765 43210', 'suresh@zevio.in', '+91 98765 43210', '+91 98765 11111', 1, '2026-05-21 11:00:56', '2026-05-21 11:00:56'),
(93, '43fbca17-da17-419f-b72a-f2d44d1caf5f', 2, 'Anita Sharma', '+91 91234 56789', 'anita@zevio.in', '+91 91234 56789', NULL, 1, '2026-05-21 11:00:56', '2026-05-21 11:00:56');

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
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(9, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 2, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(13, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(14, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 3, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(20, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 4, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(27, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 5, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(34, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(35, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(41, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(42, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 7, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(48, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 00:30:54', '2026-01-18 00:46:16'),
(49, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 8, '2026-01-18 00:30:54', '2026-01-18 00:46:16');

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
('01dcad10-1dff-43c4-af06-a79d289887b9', '1db47368-708b-433a-a112-459894f9a5f5', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:37:53', '2026-04-15 13:37:53'),
('079b1d3f-cb0a-4623-b9da-821128b876a9', 'f745a6c6-24ed-4986-9212-c4e3c7161950', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:46:29', '2026-04-15 13:46:29'),
('0bb12d80-a4ad-44a7-ad5d-9adada1733e1', '026c1c8a-48bf-4503-987a-71e1da681ea5', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:36:23', '2026-04-15 13:36:23'),
('12b23664-82d3-4c39-a9f0-2cdb51492a92', '0ec3937c-ae69-4bfa-92c4-fb2a9cc2f516', NULL, NULL, NULL, 'Fire extinguisher on each floor', 'Near beach and market', 'Police: 100, Fire: 101', '2026-04-15 13:29:35', '2026-04-15 13:29:35'),
('12f91482-00d0-4c6e-8b7b-10c06569bfe0', '9adf50b7-182b-484b-8d17-775f202e6993', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:45:41', '2026-04-15 13:45:41'),
('13b98be0-44ae-400c-9c8b-f75727c63fa8', '75ab208f-d5bd-4a8c-83be-02355a5abfac', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:39:55', '2026-04-15 13:39:55'),
('159db1db-5677-4c75-a3d5-e801ccc153c3', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:44:26', '2026-04-15 13:44:26'),
('2e667a22-781e-4770-9232-e7e78810998f', '3d540e5d-c1df-4f37-887f-75eed9608663', NULL, NULL, NULL, 'Fire extinguisher on each floor', 'Near beach and market', 'Police: 100, Fire: 101', '2026-04-15 13:07:55', '2026-04-15 13:07:55'),
('51fe25d5-7f2f-47d4-bd42-4988fc743904', '7a4b6219-dd54-4084-b343-ce65c24176df', NULL, NULL, NULL, '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '2026-04-08 10:47:30', '2026-04-08 10:47:30'),
('5d6dbc8f-b828-41e5-abe3-be059047ea7e', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', NULL, NULL, NULL, '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '2026-04-07 12:26:06', '2026-04-07 12:26:06'),
('6e9b75d9-d51b-460b-91ab-75b922d61d32', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '<h3>Check-In Guidelines</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Keys will be handed over by our property manager at the villa</li><li><strong>ID Proof:</strong> Please carry a valid government-issued ID</li><li><strong>Parking:</strong> Designated parking available on premises</li></ul>', '<h3>House Rules</h3><ul><li>No smoking inside the villa</li><li>Parties and events require prior approval</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>Please respect the neighbors</li><li>Maximum occupancy must be maintained</li><li>Pets allowed with prior approval</li></ul>', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> Network name and password will be provided at check-in</li><li><strong>Air Conditioning:</strong> Remote controls available in all bedrooms</li><li><strong>Kitchen:</strong> Fully equipped with basic utensils, gas stove, microwave, and refrigerator</li><li><strong>Swimming Pool:</strong> Pool usage hours 7:00 AM - 8:00 PM. Children must be supervised</li><li><strong>TV:</strong> Smart TV with streaming services access</li><li><strong>Washing Machine:</strong> Available in utility area</li></ul>', '<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>', '<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>', '<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>', '2026-03-19 04:53:05', '2026-03-19 04:53:05'),
('be78de62-4b06-4c7f-acd6-966371f34b17', 'cad80b80-bb08-4fcb-8342-d354cf902df3', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:41:07', '2026-04-15 13:41:07'),
('bf4ea3c5-a8dd-4dc7-8396-57d99ec114f0', '0fe5bba3-a6cd-4770-a0a8-4bf6391d6f5d', NULL, NULL, NULL, 'Fire extinguisher on each floor', 'Near beach and market', 'Police: 100, Fire: 101', '2026-04-15 13:10:12', '2026-04-15 13:10:12'),
('c2a5dce2-8168-41c9-8b7a-77bb14a99579', '3a2534cc-ffe4-414e-a761-764fce5be3bb', NULL, NULL, NULL, '', '', '', '2026-04-04 03:13:25', '2026-04-04 03:13:25'),
('dbe8288e-48a7-461c-9ceb-2205813f50d4', '0c354b38-a36f-4036-aea2-111542bf7d5a', NULL, NULL, NULL, '<p>Updated safety</p>', '<p>Updated local</p>', '<p>Updated emergency</p>', '2026-04-15 13:41:14', '2026-04-15 13:41:14'),
('e7afe123-e295-4d31-90bd-7edf5f53cfc2', '83feec7d-16d8-4d83-931d-290b0f729a02', NULL, NULL, NULL, '', '', '', '2026-04-04 03:14:08', '2026-04-04 03:14:08');

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
(1, NULL, 1, 'Check-in Guidelines', '**Check-in Time:** As per property details\n**Check-out Time:** As per property details\n\n**Steps:**\n1. Contact property manager 1 hour before arrival\n2. Verify booking confirmation\n3. Complete check-in formalities\n4. Receive keys and property tour\n\n**Documents Required:**\n- Valid Government ID\n- Booking confirmation\n- Security deposit (if applicable)', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(2, NULL, 2, 'House Rules', '**General Rules:**\n- No smoking inside the property\n- No pets allowed (unless specified)\n- No parties or loud music after 10 PM\n- Maintain cleanliness\n\n**Guest Policy:**\n- Visitors allowed only with prior permission\n- Maximum occupancy as per booking\n\n**Damage Policy:**\n- Report any damages immediately\n- Charges apply for unreported damages', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(3, NULL, 3, 'Amenities Guide', '**How to Use Amenities:**\n\n**WiFi:**\n- Network name and password provided at check-in\n\n**Kitchen:**\n- Basic utensils provided\n- Please clean after use\n\n**Laundry:**\n- Washing machine available (if applicable)\n- Detergent may not be provided\n\n**Parking:**\n- Designated parking area\n- Register vehicle details at reception', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(4, NULL, 4, 'Safety Information', '**Safety Measures:**\n\n**Fire Safety:**\n- Fire extinguisher location: [To be specified]\n- Emergency exits clearly marked\n\n**Security:**\n- Keep doors locked at all times\n- Do not share keys or access codes\n- Security cameras in common areas\n\n**First Aid:**\n- First aid kit available at reception\n- Emergency medical services: 108', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(5, NULL, 5, 'Local Area Information', '**Nearby Services:**\n\n**Restaurants:**\n- Multiple dining options within 1-2 km\n\n**Grocery Stores:**\n- Supermarket nearby\n\n**Transportation:**\n- Metro/Bus station accessible\n- Cab services: Uber, Ola available\n\n**ATMs:**\n- ATMs available within walking distance\n\n**Pharmacies:**\n- Medical stores nearby', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(6, NULL, 6, 'Emergency Contacts', '**Emergency Numbers:**\n\n**National Emergency:**\n- Police: 100\n- Ambulance: 108\n- Fire: 101\n\n**Property Emergency Contacts:**\n- Property Manager: [Contact from property_contacts table]\n- Security: [If available]\n\n**Utilities:**\n- Electricity Board: [Local number]\n- Water Supply: [Local number]\n\n**24/7 Support:**\n- Zevio Support: [Your support number]', 'en', 1, 1, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(7, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 1, 'Check-in Guidelines', '<h3>Check-In Process</h3><ul><li><strong>Time:</strong> 2:00 PM onwards</li><li><strong>Key Collection:</strong> Meet property manager at gate</li><li><strong>ID Proof:</strong> Carry valid government ID (Aadhar/Passport)</li><li><strong>Parking:</strong> Free covered parking available for 2 vehicles</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(8, 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 1, 'Check-in Guidelines', '<h3>Check-In Process</h3><ul><li><strong>Time:</strong> 12:00 PM onwards</li><li><strong>Key Collection:</strong> Self check-in via digital lock (code sent 24h before)</li><li><strong>Parking:</strong> Free parking for 3 vehicles</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(10, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 2, 'House Rules', '<h3>House Rules</h3><ul><li>? No smoking inside the property</li><li>? No loud parties after 10 PM</li><li>? Pets not allowed</li><li>? Maximum guests: As per booking</li><li>? Quiet hours: 10 PM - 8 AM</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(11, 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 2, 'House Rules', '<h3>House Rules</h3><ul><li>? No smoking</li><li>? No parties</li><li>? Pets allowed (small dogs only)</li><li>? Quiet hours: 11 PM - 7 AM</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(13, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 3, 'Amenities Guide', '<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> Password - ZevioVilla@123</li><li><strong>AC:</strong> Remote controls in all bedrooms</li><li><strong>Kitchen:</strong> Fully equipped - gas stove, microwave, refrigerator</li><li><strong>TV:</strong> Smart TV with Netflix, Prime Video</li><li><strong>Washing Machine:</strong> Available in utility area</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(14, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 4, 'Safety Information', '<h3>Safety Information</h3><ul><li>? Fire extinguisher: Near main entrance</li><li>? First aid kit: Under kitchen sink</li><li>? Emergency exits: Main door + balcony door</li><li>? Power backup: Available during outages</li><li>? Security: CCTV cameras in common areas</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(15, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 5, 'Local Area Information', '<h3>Nearby Places</h3><ul><li>?? <strong>Restaurants:</strong> Beach Shack (500m), Taj Restaurant (1km)</li><li>? <strong>Grocery:</strong> D-Mart (2km), Local Market (800m)</li><li>? <strong>Hospital:</strong> Apollo Clinic (3km)</li><li>?? <strong>Beach:</strong> Baga Beach (1.5km), Calangute Beach (2km)</li><li>? <strong>ATM:</strong> HDFC ATM (500m)</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL),
(16, 'bb927936-e418-11f0-9f30-00410e2b5e6e', 6, 'Emergency Contacts', '<h3>Emergency Contacts</h3><ul><li>? <strong>Police:</strong> 100</li><li>? <strong>Ambulance:</strong> 108</li><li>? <strong>Fire Brigade:</strong> 101</li><li>? <strong>Property Manager:</strong> +919876543210 (Rajesh)</li><li>? <strong>Nearest Hospital:</strong> Apollo Clinic - +918322123456</li></ul>', 'en', 1, 0, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42', NULL, NULL);

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
(1, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 1, 'Forum Mall Metro', 2.50, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(2, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 1, 'Baiyappanahalli Metro', 5.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(3, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 1, 'Andheri East Metro', 0.50, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(4, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 1, 'BKC Metro', 1.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(5, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 1, 'Rajiv Chowk Metro', 0.30, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(6, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 1, 'Cyber City Metro', 1.20, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(8, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (8.50 km)', 8.50, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(9, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (15.00 km)', 15.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(10, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (2.00 km)', 2.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(11, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (5.00 km)', 5.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(12, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (18.00 km)', 18.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(13, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 2, 'Airport (12.00 km)', 12.00, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(15, '27c960ac-f31f-11f0-8f27-00410e2b5e6e', 5, 'Koramangala IT Parks', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(16, '495ba81d-f31f-11f0-8f27-00410e2b5e6e', 5, 'Prestige Tech Park, ITPL', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(17, '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 5, 'BKC, Powai IT Parks', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(18, '495cf369-f31f-11f0-8f27-00410e2b5e6e', 5, 'BKC Business District', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(19, '495d4419-f31f-11f0-8f27-00410e2b5e6e', 5, 'Connaught Place Business District', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42'),
(20, '495d9161-f31f-11f0-8f27-00410e2b5e6e', 5, 'DLF Cyber City, Udyog Vihar', NULL, NULL, 1, '2026-01-18 05:03:42', '2026-01-18 05:03:42');

-- --------------------------------------------------------

--
-- Table structure for table `property_pricing`
--

CREATE TABLE `property_pricing` (
  `id` char(36) NOT NULL,
  `property_id` char(36) NOT NULL,
  `price_per_night` decimal(12,2) NOT NULL DEFAULT 0.00,
  `original_price` decimal(12,2) DEFAULT NULL COMMENT 'Original rack rate before discount (displayed crossed-out); NULL = no discount',
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

INSERT INTO `property_pricing` (`id`, `property_id`, `price_per_night`, `original_price`, `gst_percentage`, `min_guests`, `extra_guest_charge`, `min_children`, `max_children`, `extra_child_charge`, `weekly_discount_percent`, `monthly_discount_percent`, `quarterly_discount_percent`, `long_term_discount_percent`, `allow_corporate_booking`, `corporate_discount_percent`, `deposit_amount`, `maintenance_charges`, `created_at`, `updated_at`, `discount_3_5_days`, `discount_6_14_days`, `discount_15_plus_days`) VALUES
('01b0a246-fa7b-40cf-81f4-93aaace2e9ef', '0fe5bba3-a6cd-4770-a0a8-4bf6391d6f5d', 7500.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-15 13:10:12', '2026-04-15 13:10:12', 0.00, 0.00, 0.00),
('1c5397c1-9c48-41f4-8963-af3307791dff', '9adf50b7-182b-484b-8d17-775f202e6993', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:45:41', '2026-04-15 13:45:41', 7.00, 12.00, 18.00),
('1f632c81-f19e-4f6c-9d51-8501da0ca091', '085785eb-9d0e-45e9-b5ed-a333a67cfe20', 12000.00, NULL, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-21 23:47:20', '2026-03-21 23:47:20', 0.00, 0.00, 0.00),
('2eb9f260-1a1b-4071-a7b6-47398401b862', '40bb16f7-bba7-4b3d-88c6-932bdebfd384', 10000.00, 20000.00, 18.00, 2, 6.00, 2, 5, 3000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, '2026-03-28 10:25:39', '2026-04-07 12:26:06', 0.00, 0.00, 0.00),
('3f0c979b-4691-41aa-930e-cd8479929410', '0ec3937c-ae69-4bfa-92c4-fb2a9cc2f516', 7500.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-15 13:29:35', '2026-04-15 13:29:35', 0.00, 0.00, 0.00),
('4c66165f-08f0-4daa-a7a6-e375a5d1be0b', 'ad4a2bea-3e21-4761-abc6-520846aba0ab', 12000.00, NULL, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-22 00:52:22', '2026-03-22 00:52:22', 0.00, 0.00, 0.00),
('52d2a04c-c925-42ca-93bb-607b9750579a', '1db47368-708b-433a-a112-459894f9a5f5', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:37:53', '2026-04-15 13:37:53', 7.00, 12.00, 18.00),
('5a0ab12a-e92f-40b6-b22e-57e75ed97985', '14821022-3028-4e3e-aa5e-3e5116ff9e36', 3500.00, NULL, 18.00, 1, 300.00, 0, 2, 100.00, 8.00, 15.00, 20.00, 25.00, 0, 0, NULL, 500.00, '2026-04-04 03:14:08', '2026-04-04 03:14:08', 0.00, 0.00, 0.00),
('5f85f439-fdad-4f48-95f7-fa47368b8f6e', '242cedda-a5d9-4b2a-80b4-f6a0e60c4a53', 3500.00, 3500.00, 18.00, 1, 400.00, 0, 2, 150.00, 5.00, 10.00, 15.00, 20.00, 0, 0, NULL, 0.00, '2026-04-15 13:36:26', '2026-04-15 13:36:26', 0.00, 0.00, 0.00),
('62188469-e7a7-4cd4-8a26-a9b9da05dd34', '154f2940-ce9f-45f8-b9b4-c11207d1d694', 3500.00, 3500.00, 18.00, 1, 400.00, 0, 2, 150.00, 5.00, 10.00, 15.00, 20.00, 0, 0, NULL, 0.00, '2026-04-15 13:46:31', '2026-04-15 13:46:31', 0.00, 0.00, 0.00),
('6ffa4baf-2a76-4a4a-abf0-6fb947b5a5f1', '026c1c8a-48bf-4503-987a-71e1da681ea5', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:36:23', '2026-04-15 13:36:23', 7.00, 12.00, 18.00),
('769a6b4b-1222-4b01-8e2b-8e0355ed1532', 'bf05c16a-e142-4e44-9f4a-a07525b4db50', 3500.00, 3500.00, 18.00, 1, 400.00, 0, 2, 150.00, 5.00, 10.00, 15.00, 20.00, 0, 0, NULL, 0.00, '2026-04-15 13:45:43', '2026-04-15 13:45:43', 0.00, 0.00, 0.00),
('874e1b76-1df5-4de0-a943-d14eb2aface4', 'c1330aa4-9670-4988-8b88-8b69e0c15af0', 9000.00, NULL, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 04:48:05', '2026-03-19 04:48:05', 10.00, 20.00, 30.00),
('904f5543-0902-4653-bda0-62f9baaaae73', 'cad80b80-bb08-4fcb-8342-d354cf902df3', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:41:07', '2026-04-15 13:41:07', 7.00, 12.00, 18.00),
('9f54647a-0f4b-44e4-8d05-76e046fef69d', 'a4465384-6fa3-4be4-be6c-8ec5c8764003', 1000.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-15 13:36:49', '2026-04-15 13:36:49', 0.00, 0.00, 0.00),
('aa2f6496-7ffc-4f9d-b508-7176bd37c416', '3d540e5d-c1df-4f37-887f-75eed9608663', 7500.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-15 13:07:55', '2026-04-15 13:07:56', 0.00, 0.00, 0.00),
('ac67038d-05ff-471a-b06a-d40764df68f1', 'f745a6c6-24ed-4986-9212-c4e3c7161950', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:46:29', '2026-04-15 13:46:29', 7.00, 12.00, 18.00),
('aef29fdf-7800-431a-a900-1d640a905624', '43fbca17-da17-419f-b72a-f2d44d1caf5f', 7000.00, 15000.00, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 04:53:05', '2026-05-21 11:00:56', 10.00, 20.00, 30.00),
('c362fae2-312f-45a1-a978-20542c6400dd', '75ab208f-d5bd-4a8c-83be-02355a5abfac', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:39:55', '2026-04-15 13:39:55', 7.00, 12.00, 18.00),
('c8ad801b-f17d-4457-be9b-76be500a2b47', '7a4b6219-dd54-4084-b343-ce65c24176df', 15000.00, NULL, 18.00, 1, 1500.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, '2026-04-08 10:36:47', '2026-04-08 10:36:47', 0.00, 0.00, 0.00),
('cb0da811-ece5-492b-a146-4ee38733dbbe', '65ee5e0d-85e0-47fc-be08-b78fd36e484d', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:44:26', '2026-04-15 13:44:26', 7.00, 12.00, 18.00),
('d3662465-127f-489a-a3a7-e21bc5a63f84', '83feec7d-16d8-4d83-931d-290b0f729a02', 6000.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 12.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-04 03:14:08', '2026-04-04 03:14:08', 0.00, 0.00, 0.00),
('e0794143-2d1e-4d1e-b0f6-f0a7e825b9dc', 'f5669fb7-392a-414e-b24c-6865dea64def', 9000.00, NULL, 18.00, 2, 4500.00, 2, 5, 2000.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2026-03-19 04:48:33', '2026-03-19 04:48:33', 10.00, 20.00, 30.00),
('e15f93c0-1d7a-4384-ad17-7cefbc4fe6cc', '6976d478-d48f-4f32-814a-3a14b86f6dab', 3000.00, NULL, 18.00, 1, 300.00, 0, 2, 100.00, 8.00, 15.00, 20.00, 25.00, 0, 0, NULL, 500.00, '2026-04-04 03:13:25', '2026-04-04 03:13:25', 0.00, 0.00, 0.00),
('ea3de2bc-0640-4859-8661-81808b0e446b', '0c354b38-a36f-4036-aea2-111542bf7d5a', 6000.00, 7000.00, 18.00, 2, 800.00, 0, 4, 300.00, 12.00, 22.00, 27.00, 32.00, 1, 15, NULL, 500.00, '2026-04-15 13:41:14', '2026-04-15 13:41:14', 7.00, 12.00, 18.00),
('ed2eaf23-f3e4-11f0-8f27-00410e2b5e6e', '495ca2b2-f31f-11f0-8f27-00410e2b5e6e', 2800.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 18, 8000.00, 0.00, '2026-01-16 15:36:52', '2026-01-17 15:11:23', 0.00, 0.00, 0.00),
('ed2eb07c-f3e4-11f0-8f27-00410e2b5e6e', '495cf369-f31f-11f0-8f27-00410e2b5e6e', 6500.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 15.00, 25.00, 30.00, 35.00, 1, 22, 25000.00, 0.00, '2026-01-16 15:36:52', '2026-01-17 15:11:23', 0.00, 0.00, 0.00),
('ed2eb451-f3e4-11f0-8f27-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 16000.00, NULL, 18.00, 4, 1500.00, 0, 4, 800.00, 15.00, 25.00, 30.00, 35.00, 0, 20, NULL, 0.00, '2025-12-28 12:42:12', '2026-03-28 04:46:35', 0.00, 0.00, 0.00),
('ed2eb8bc-f3e4-11f0-8f27-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 13000.00, NULL, 18.00, 6, 1200.00, 0, 6, 600.00, 15.00, 25.00, 30.00, 35.00, 0, 20, 0.00, 0.00, '2025-12-28 12:42:12', '2026-03-28 10:17:21', 0.00, 0.00, 0.00),
('f08623cd-718d-40a1-b62a-3a21b660f467', 'db97f77f-508b-4ea9-bf3a-ffd9f94dfc61', 1000.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-15 13:37:10', '2026-04-15 13:37:10', 0.00, 0.00, 0.00),
('f3423988-806b-46de-bf78-f7d8d94e5016', 'e2dd168d-5452-48e8-b8cb-3d40f5d7873d', 12000.00, NULL, 12.00, 2, 1000.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, 0.00, 0.00, '2026-03-21 23:38:39', '2026-03-21 23:38:39', 0.00, 0.00, 0.00),
('faff2b11-71bf-459b-9773-8507b864fde7', '3a2534cc-ffe4-414e-a761-764fce5be3bb', 6000.00, NULL, 18.00, 1, 0.00, 0, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, 0.00, '2026-04-04 03:13:25', '2026-04-04 03:13:25', 0.00, 0.00, 0.00);

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
('pt-001', 'Villa', 'villa', 'short_term', 'FiHome', 'Luxury vacation villas for short-term stays', 1, 1, '2026-01-16 15:25:59'),
('pt-002', 'Service Apartment', 'service-apartment', 'long_term', 'FiBuilding', 'Fully serviced apartments for extended stays (7-180 days)', 1, 2, '2026-01-16 15:25:59');

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
('025ac500-b14c-4eac-8d7c-f84e138b756e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2460beb01af795be8481d20feac5ae841e1cef3c61c0d1ad2ae4e5255695843d', '2026-04-24 00:24:30', '2026-04-16 13:24:30'),
('04fa05a9-25ea-4cfb-8c95-f2f759dfd02f', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bad4d31d6205e07390fd86c8e7a373549b55ff061f9adf8acf7984c0729ba1dd', '2026-04-24 00:06:24', '2026-04-16 13:06:24'),
('05cba544-9f92-4875-8cd8-08c9a2880ae0', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '4e14cc6856a472a093aefe952b79fcbbea5b14e7f3acfe7fc54ff58f1f13d4e4', '2026-04-24 00:52:24', '2026-04-16 13:52:24'),
('05e3b3e4-c829-4364-8d20-b6fa25f78691', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '72f8131f7edfbeb3f600148d09b9334f90d949d3cb8af91d555150012b69adca', '2026-04-11 13:14:38', '2026-04-04 02:14:38'),
('06728e9f-7e4a-4a08-adf9-4776b986af83', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'a14e6b8607a5d0e86abb0077f23eb886a213cfa782985ff10ec95923e799e1e6', '2026-04-24 01:20:21', '2026-04-16 14:20:21'),
('072dc1e7-6b64-4c49-8006-21c6c1af04d8', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'd87cd89e2529df545162278fafa49f44160c13b66b9d6de596d54a938e25f805', '2026-04-11 14:11:41', '2026-04-04 03:11:41'),
('07be16c9-fc22-443d-ad53-a1ec25fb5a6b', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '5fe439a34e664537f07c0ff4d681b43f17dc0a293f229a3773ba1471983992aa', '2026-06-01 02:25:26', '2026-05-24 15:25:26'),
('0a17cb27-da38-4301-bf25-57e2e79915f2', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'f05e380bf43e6e3e07c50e6f3b1557318258868848d490b69ee03438985f700a', '2026-04-24 01:24:09', '2026-04-16 14:24:09'),
('0a53ab58-7556-49cd-b0e2-e000f274b798', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '26d0716c8ba43ac53ebdd9b30bdfa1d4c950b1c755b8285af9c073621de71b28', '2026-04-23 00:46:28', '2026-04-15 13:46:28'),
('0b6528bf-256e-40f3-a677-e23c72f1b293', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '9583167f8b600e9009adacf49367281fcef3280ed904aefbf6ab99cfd12d7538', '2026-04-24 00:06:40', '2026-04-16 13:06:40'),
('0c8a67a7-e05c-4a39-9f22-179be5ec30ec', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '434b55194cc32fecfae8d52dfb3a92570fa144a83a4c027b2352d7743f34afe3', '2026-04-24 00:24:11', '2026-04-16 13:24:11'),
('0e82adff-a231-4f7d-87e0-195ff3207dad', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '386e1bd35f5d20b5f83a460f8416bfab0e2307cf7912beb1f94a2132b37dd54c', '2026-04-24 00:57:40', '2026-04-16 13:57:40'),
('0ecbb02c-ef88-448b-839b-6c84a4ffa140', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '107aa2282d74cd4baa2dbbf86f06da3ae32d32a09d05f3e601aba1a957391139', '2026-04-24 00:40:44', '2026-04-16 13:40:44'),
('10d5cc52-8fc8-4b2f-ab0b-d354d2e75325', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6e62b0631ab7435f0f272df6ad46fba273fe27de8123e07543ed86c87fd9d8d1', '2026-04-11 14:11:18', '2026-04-04 03:11:18'),
('13ef3d49-03a3-4171-9c01-ca96746ba95a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b49067a14e4f8fda702971359d74c1ebc902af8900211756dd4f0bd8b152d31d', '2026-04-24 00:06:37', '2026-04-16 13:06:37'),
('1989b3da-778d-42ce-8ea1-59f0a6bac109', '6796b798-fbcb-4511-8a24-e8429263f0e7', 'admins', 'b5e01f7db1b7fd3f780c9cf1da5aa6168e203a7e1dab9d58e3b861192a798fc1', '2026-06-24 23:51:11', '2026-06-17 18:21:11'),
('1e2a9f87-73e1-48bf-b8ba-4331acecb868', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'a8f34019e474b4ee91bc5fac857c423f5c479fa0d1b5c6987d0882f1570ebce9', '2026-04-24 00:24:33', '2026-04-16 13:24:33'),
('1e721a6e-6c50-4f81-aa76-d87567f5bf60', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2758647b25891860b4056d67a4a767faf0cc481681d652e73a5a99c72e71a01e', '2026-04-15 20:35:58', '2026-04-08 09:35:58'),
('1ec53ca2-cf57-4aaf-89aa-880d44cab2e2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '53e62843f4e85d89ab0536e710cb8afd02cdc1f0cc34bc60154683575fb5a941', '2026-04-24 00:05:38', '2026-04-16 13:05:38'),
('231a98c2-4abb-4891-b341-400329f74b37', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2ee6e3b31ec2f3d08ff436b17b5d4502b3120aa65a3a73ba5eb859c52623a520', '2026-04-11 14:12:31', '2026-04-04 03:12:31'),
('23e8ba96-3524-447a-a417-6fca5a29b979', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '7ccfd1ad913c3ccafc946d235dd8e9cfe1233e626bde905d79111f5f2b18d56b', '2026-04-11 13:10:28', '2026-04-04 02:10:28'),
('24a98fa2-9b9b-41e7-9f3f-5df10fdb3809', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '760c6b85bb2a751f1a1bbb6e5c2b91b2142adc473079c3df058b4dc78360adf7', '2026-04-24 00:07:17', '2026-04-16 13:07:17'),
('24b7a59c-9992-42c8-be30-d77cd7874203', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '60d5069a9206760beb685157f61d2d573be65493bdfc747dec0018d26f6360ed', '2026-04-15 21:30:29', '2026-04-08 10:30:29'),
('28a9b067-813a-4c15-a374-28e2c14304ac', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '33e6aebdf4ff6fef0de064d9bfaeab3a0ab7c07ab2c31812708e0d59aab2e094', '2026-04-23 00:07:41', '2026-04-15 13:07:41'),
('2a288ec6-d6b9-48f3-af1c-88e7065e666a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '32de570c35996dd3279e36c33d5c3a80d95501fc4d5e46d3d15fe38c63ac4387', '2026-04-24 00:53:33', '2026-04-16 13:53:33'),
('2a7d01f0-5e87-4c9e-8564-df481f3edbce', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0b2b26558d8969dfce0e2dec1e395ae4c34a899cf1959b60f03dddb496ce8ae2', '2026-04-10 23:06:15', '2026-04-03 12:06:15'),
('2df3e8fd-dc50-4e37-a263-25e55d656e46', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '7460057fa299588770b25fb84ba964cbaf820dee9c576d3db77bbb51bd6553ab', '2026-04-24 00:06:47', '2026-04-16 13:06:47'),
('2e419fcf-0595-402e-9900-306e17cb100a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'c01c6eedd4b5c7139530e445386889443e936a41b6d9f4ff078380e1bacabe4e', '2026-04-24 00:58:19', '2026-04-16 13:58:19'),
('2e5ba4ee-d8d9-4271-a545-4e93f9475b18', 'a1336f20-f05e-4142-a10e-4c7f7be3c295', 'users', '19f54f98d62f6d4e657063aa3568ef10bd10e2aae36ca99fbd77db86ef79be77', '2026-04-15 22:37:00', '2026-04-08 11:37:00'),
('33bd1bc9-c3b3-40c9-861f-2c5ca07cc3a8', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '046415e1402b1c3eaf3b4de4d80ea2b0be794df5068c74c722b436468f07b0cc', '2026-04-24 00:20:43', '2026-04-16 13:20:43'),
('34dead54-5fe5-4c85-a0ab-9a3af1af98be', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'e3a2dd4abf3e6f40e07d3ed74be2bef5a1f484666c1cf04931880ca007ef9e57', '2026-04-13 00:02:33', '2026-04-05 13:02:33'),
('34fca948-3414-428f-a8bf-04f0c23d803b', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '8a3bad7d01497f620bd43915193cec0a9ce733e6d1cf7ffb64ef3c958e50f7ac', '2026-04-11 13:09:02', '2026-04-04 02:09:02'),
('3954ee42-77c3-4a1d-b974-fd3782a79a49', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8f1f32bae5b0f37d1449feee96cfe19988f845c289e6356f3a7e18edcd645f48', '2026-04-23 00:07:55', '2026-04-15 13:07:55'),
('3d209357-07b2-4c8b-b1b9-876803f35b75', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'ce729b72451e57ec86c881c078fe8e23b8f4c85d429fd73e56b9e799279a3779', '2026-04-11 13:14:00', '2026-04-04 02:14:00'),
('3d787573-913c-4652-9d0f-5317998f7808', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '729b2ec770bf51ac799d6ef38a913917c47f88dc156c1696364154fb4c94f6dd', '2026-04-24 00:23:50', '2026-04-16 13:23:50'),
('41514b4e-e348-44a1-83de-c56ca2c5079e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '5bb2470383861145dd436855120dc188a52b6ed82973cd50bffbc30e7e6163c8', '2026-06-24 23:59:17', '2026-06-17 18:29:17'),
('44315311-166c-47ca-b930-0b771855b3bc', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6ff96fae2e59b96b87538d5432ce2ef31980abdcdd9d5b6ce97b75707961113a', '2026-04-24 00:07:20', '2026-04-16 13:07:20'),
('489f024c-db38-4f4e-88e0-a94b59b8cde7', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '959da309b7bb81d3a6d93b1bf37c49f5ee936c37c90790ebb5ef4b990dba28fd', '2026-04-24 00:23:47', '2026-04-16 13:23:47'),
('4fbb5da3-031e-4c6a-9204-bd15f5e374bd', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '15528de212babdc35bb497697b22dd2da2dcb48722ba7407ff6c7f35319c1b50', '2026-04-24 00:06:54', '2026-04-16 13:06:54'),
('570a8536-6f8c-4b9a-98c4-f66824e64590', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '3c3cf77a4de0c239013b774a6f9b7e7fb5e5f6684fdfc8abbf7883a27b29f723', '2026-04-24 00:06:22', '2026-04-16 13:06:22'),
('57460984-3817-4837-a408-33700cfbc091', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '5c178addc31357248eec981b1cd9639ade8b32e224c43978eef6087db30fb539', '2026-04-15 21:24:56', '2026-04-08 10:24:56'),
('5855b7dc-2191-45f6-bee8-87957ec132bd', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b1f63e19f4892deddfb9cbda4dd0132bb1f5533743d52e60c367498363157938', '2026-04-24 00:07:14', '2026-04-16 13:07:14'),
('58a5cb7c-0f28-4863-9925-8a698cd9de96', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '910d8ffe31774a9641cb9fbd51c47dadbe4b71ae72751822969ed106fd789b0a', '2026-04-11 13:16:42', '2026-04-04 02:16:42'),
('58b98003-072d-41b2-8711-c0698952912a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'c163450dc87ee64f0e82995b4eef8a2fb21eae386552582eefae6a516ea90024', '2026-04-24 00:24:26', '2026-04-16 13:24:26'),
('5b4845a5-5ebe-4b48-8cbf-10782d525162', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'ecc85724253657dd7e41dbe0aa0e7390bc1df51972929f76ffe448e26965a244', '2026-04-23 00:37:26', '2026-04-15 13:37:26'),
('5c2d4010-6160-4f87-b403-bbe8d808dfe4', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bc87f91be6495c047c24b2d3a7f8b409109daf2b64d77754ff3786c39cfae957', '2026-04-24 00:58:09', '2026-04-16 13:58:09'),
('5ebcbc24-8570-4314-8118-e23d74ef28c0', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bc414d592a108fc093718192ee798c05b5c84e543adfc0b7451914f0c82119e8', '2026-04-23 00:10:12', '2026-04-15 13:10:12'),
('6028ac37-5b1f-47ff-8c85-9e393ae20add', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '3b0d3b2fb4450680e11d038b6f05876795d2db276235c6ca48d26669225c070b', '2026-04-24 00:43:26', '2026-04-16 13:43:26'),
('612379b9-e6f0-4bf6-8fdf-fad62e3ad278', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b60992f5a48b8da3a5f6343663c234245583d72d0ce7e9f19cf8d2d83e253291', '2026-04-24 00:24:17', '2026-04-16 13:24:17'),
('61bf47ce-a980-41a0-b4aa-fff725d5863f', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', 'b1a7c322063bbe1b7d0b9288467b101160fcc728347f32910d89f29cfd653c62', '2026-04-10 23:05:55', '2026-04-03 12:05:55'),
('6435f6d2-02aa-4f05-873c-cd8fbf6cd8e2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6deaa1249fa429c325a632f36cf59748a2807ed65aa63dec886e748eeea24452', '2026-04-24 00:24:23', '2026-04-16 13:24:23'),
('64d87d90-df9a-47e3-8ec2-1e6d1496159f', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '63afded6c6129939c7d3cd0b38d165d073b1a63ea73bb7268a3a686d42241f7c', '2026-04-23 00:36:26', '2026-04-15 13:36:26'),
('698f6f05-0f9e-4f4c-b89e-1a914abd481c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8a8e8caf181e13790da14e067e07b8709198e4b36262fdfdacf893c08c5494ee', '2026-04-24 00:24:54', '2026-04-16 13:24:54'),
('6b486331-801f-49bb-a400-7ebdbcfd0051', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '8eaf05b980d8e4bfa52c5e9ef694478b9f03c93243271eaee6487a9b97e9ac4e', '2026-04-24 01:22:01', '2026-04-16 14:22:01'),
('70bc7657-647f-4259-975a-f2ac833116d8', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8b6d4d640fc59e4365f7aa820bf4c576ca81328a70fcca133b66976c70f596ee', '2026-04-23 00:41:07', '2026-04-15 13:41:07'),
('712f4d1e-efe4-4e72-a346-25cd1e857b52', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '292f4d119e91fb73a365df2494e5edfd7597c2390996d3b7be62baaf935621be', '2026-04-24 00:58:47', '2026-04-16 13:58:47'),
('71e9c9fd-b0e5-4a30-8a39-5d3788fb9ff1', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '1f02091a54f90d935decdb0b7d059a083208552403bbecad86ce235fbfb5f3a4', '2026-04-24 00:24:14', '2026-04-16 13:24:14'),
('7267edc0-2f54-4110-8714-c530035753a2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'ad8c10aa7494965f2801e7697d09308c5ef9ef2f94baa837602ac7fa3759adf9', '2026-04-24 00:57:39', '2026-04-16 13:57:39'),
('735af55d-f4a3-4eab-97e4-d86040bb459a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '9c2f9cfb77458f2b62dd6a1d281a918b316aa5043328d33480c19ac2c941eb0a', '2026-04-24 00:20:47', '2026-04-16 13:20:47'),
('739b265b-6f15-4f0d-a2dd-d46ec968c8a8', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '5b45438a090fa0cf6ca843fcd75cd793b5466d09ba790d270b0da3fb5ed5b808', '2026-04-24 00:24:19', '2026-04-16 13:24:19'),
('742b31a7-e6ec-4385-b782-096c557bc9ed', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '98ae9a6ea5e11a13fe729df15ea2ae3daaac009ce822adf52b63db40c4e964a2', '2026-04-24 00:53:21', '2026-04-16 13:53:21'),
('77efe263-783a-4b79-a02b-e4fe652a87c1', 'a1336f20-f05e-4142-a10e-4c7f7be3c295', 'users', '7cc6e999d4b9ff8cd9041cbff1b84bd0b7cfd265fb1d7275a68f7a5d2319fddc', '2026-04-15 22:47:59', '2026-04-08 11:47:59'),
('78986112-9a7e-4d33-8cc2-403baa39d045', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b7118e6156ad15fb6135dd98edb3ffc1fc798e071aac05e33176cd5b5ab86137', '2026-04-11 14:14:08', '2026-04-04 03:14:08'),
('7998f0dd-21c6-45f0-a0fd-c8e16ef297a2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0b4f932b985c1c1b1f166dd90fe6940082d3b8646b05e966c6bfe38de43264e2', '2026-04-19 22:26:04', '2026-04-12 11:26:04'),
('82a1b35f-2ca0-448c-a50c-c1bb73936309', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '813e482823d6884f12d1ef2bb05b7f30d39610c4d6fee7d116aafc82b0e3950a', '2026-04-24 00:24:09', '2026-04-16 13:24:09'),
('85f54e09-d711-49b9-befb-67bf0c020cd9', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bcd7e7af27ebca2f43a02eba895c7d8a10ae96c6e0537e0d360f118d6d2572ba', '2026-04-23 00:45:41', '2026-04-15 13:45:41'),
('871b400d-c8f9-4adc-a920-da029f0a639a', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '31382ad0ae2932a3826fee83577cb79c996a046dd77b18804ab6c2b1fd251c98', '2026-04-11 13:13:59', '2026-04-04 02:13:59'),
('877b6316-9a15-4ec2-b4e6-c6ce8ec3ef9b', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2c0d017ed037f1e7e399cec4043485eef54b6ab8347eacbbff6655b8f715eb32', '2026-04-16 04:14:05', '2026-04-08 17:14:05'),
('892ea5de-0b23-4ae3-9acf-08131f77e2f7', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '9bb58b752362e03de15990dcddfa13d4d88a14d7d5cb1d18cb63a15fa325bcf2', '2026-04-24 01:04:16', '2026-04-16 14:04:16'),
('8f46b386-64f2-4362-9632-4f30a598983d', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '61ecfb83c6186de836de2aee149952a7060a50a562fbc01badfccf555abc3ab4', '2026-04-11 14:13:25', '2026-04-04 03:13:25'),
('90942af3-3a6c-41ec-ab3f-b83a2187504c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'c4aefc1f4269d0ac6787b8952ad272d7fab849efdc21ed03cacea0026d2f5035', '2026-04-24 01:11:17', '2026-04-16 14:11:17'),
('90b383e8-ee84-47f1-94cc-00a9377c617e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '4d9212b34e9f683c01a80776bfc99a212e7a18858df40fd2c3484bc5db0b19f9', '2026-04-24 00:39:50', '2026-04-16 13:39:50'),
('90da016c-7843-4fc4-bcea-33944456d80a', '244c2909-85ef-4d38-8a0a-2723ff145942', 'users', 'e6f701a15d829d8695e9775198aeff2ec2c572f0998ed0f5e2b4f11f70c174d7', '2026-05-29 01:09:58', '2026-05-21 14:09:58'),
('923068b8-b80d-46dc-ad73-bf1d0fe556cd', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '7443ca048b50e5e47d5cd680e3894347f5db8e966b5192b69c15c5833af0218a', '2026-04-23 00:36:23', '2026-04-15 13:36:23'),
('935c00c0-df3c-4c8c-9655-9f71c66fcd71', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '81497a79c978548bd51fb63db54dbf4e837dcf2fc95dc635502971a2e9d1b245', '2026-04-24 00:07:07', '2026-04-16 13:07:07'),
('9579a39d-2388-40ff-9ade-24c8905c2785', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '4c57a284886b66adb909f605c5cb261fde785d30216830ce69d10496aec68eef', '2026-04-23 00:07:35', '2026-04-15 13:07:35'),
('997a26ee-0f25-43ad-9064-a14cff907f0b', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8ce73405791c920cd4d42cb6ce2969a4e51c57871286498b9d06c92977a0b36d', '2026-04-23 00:29:35', '2026-04-15 13:29:35'),
('9a4e4ecc-af84-47d1-8d57-f86f99014e02', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '20575c0237143a45217f903c30ea0d8551b088349b9db7263776719ca43fc992', '2026-04-24 00:05:41', '2026-04-16 13:05:41'),
('9b3760cd-3808-45c6-ab30-daef1fcfe275', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0040c1ebc8c4da326643b6e74f0991e102c198bf02083aeee4acc2ad49f54664', '2026-04-24 00:52:11', '2026-04-16 13:52:11'),
('9ce87b6c-2077-4fac-a95a-9d6dd267d4ec', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'ed1fe30b40f8086a9838cc41462844de6d403a8a551c5e4c9d2e1ae6e2155e55', '2026-04-24 00:07:58', '2026-04-16 13:07:58'),
('9d51574a-ca58-4d27-9ab1-3881f53f27dc', '244c2909-85ef-4d38-8a0a-2723ff145942', 'users', 'db697531d5a18d872a8ecd1b36faedfbfb58ce57861fc505a86d4d7b688d7e27', '2026-05-29 01:13:23', '2026-05-21 14:13:23'),
('9e0e521f-7b66-44b7-9891-77d04ceb926f', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0ff85bcd01781ff8f24ab19d087ebc07b4241958eb6df739158a52142e66eb6c', '2026-04-24 00:24:45', '2026-04-16 13:24:45'),
('a0138df8-9f3f-4927-8988-a92a2ad79e7c', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '76678d5ab266af0802aa646487e7b632c4084d3683f72432e75a41bbef8e0dcc', '2026-04-11 14:14:08', '2026-04-04 03:14:08'),
('a1ee5cfc-bf7a-4c81-965e-58f01ac42b02', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '186a1081f577c271627f22d6f6228f55c9913b90d403b09ba3a227abac78a8c9', '2026-04-24 00:07:10', '2026-04-16 13:07:10'),
('aa5223cc-2ade-41da-a7f1-7c5d752fe72d', 'a1336f20-f05e-4142-a10e-4c7f7be3c295', 'users', 'df081755a92a16c91c3f88c71e3f4735b4c0235438921962c6ea3686e1347848', '2026-04-15 22:07:32', '2026-04-08 11:07:32'),
('ab328e31-8cda-4c4d-a1dd-6ce1810e51b1', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'aa698269af774e861c3248dafe19c9f4c053fc516e681e73f01629e887450a6d', '2026-04-23 00:37:10', '2026-04-15 13:37:10'),
('abada85c-cfe1-4e88-9bfd-bfb861f28537', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'acb7c60f08aec98b227e15b1356b91087ee8801f33970f857c539eacc2f67b5b', '2026-04-23 22:22:24', '2026-04-16 11:22:24'),
('ad199fc0-6213-468e-bedb-8539a14c83db', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'b3b32f0727219f50fbfd83f4a3d7278afe0a13d5dc0ce87a82bc34031c0648da', '2026-04-23 01:04:43', '2026-04-15 14:04:43'),
('af0231c7-e02d-415c-9ea5-86c9a6e83b05', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '597f0dddb87446471bf6229fb372113f5240508d2f371aae2448ad4a4fb5f86c', '2026-04-11 14:11:41', '2026-04-04 03:11:41'),
('af0b40be-421d-47c0-aec7-c06fba77e460', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'd95a9e4083ba0ac2bc9c4bb7e1b1f3ecdaea276b9c1e18f54a54a4539edeee1b', '2026-04-23 00:37:53', '2026-04-15 13:37:53'),
('af49b2dc-657b-424f-a6e6-bf9bf29b3621', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '90e27e43276dc8a7fe7476b4e2e21add55766a8a042dc20668be71a99313e3dd', '2026-04-24 01:27:57', '2026-04-16 14:27:57'),
('afed641b-bceb-4fdb-92c4-153f35e8fec4', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'dac0240606cb35124c2611f402556eba17d247ff8d637fea12cd22c04fe6a284', '2026-04-24 00:06:58', '2026-04-16 13:06:58'),
('b0e0f967-e205-4e6a-8697-9752cb5f5705', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '50a268265d05b1d84d42226f71e0a137d4e26a17121a7e8a2d2fcb5038dcc98e', '2026-04-23 00:44:26', '2026-04-15 13:44:26'),
('b169f925-d46b-47d0-8585-72073691121c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '920152270d2ca2dbc3a17df6b7cb62fb30e8009ad4911a4aa6a0ba7223116bd4', '2026-04-24 00:24:48', '2026-04-16 13:24:48'),
('b16bb600-b0bb-4930-8fb4-80d1970da6f9', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8d5470c6145a803da3b80cd77cf3674f6810c5f2a9f325ad63a9c94baa4af9de', '2026-04-11 14:12:09', '2026-04-04 03:12:09'),
('b220422b-a0cb-4945-84e4-a67072797863', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'a4801c344fdd2c5a2b2e803f17a6ebc0784ec29caf115424c9ef0baca73f36a0', '2026-04-11 16:32:55', '2026-04-04 05:32:55'),
('b3af4d7c-73cb-4041-beda-3293b4ee7f5b', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', '5589fc2e9aaf637dd1a45d30851bb2add339dcee5349774f6a2926d6233d8cac', '2026-04-12 23:32:00', '2026-04-05 12:32:00'),
('b40365e4-05a7-4e9f-9128-e83b3a30f981', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '11179fb60186420364cbce8534171721fe90e22934c232d04dd23b08bc27601d', '2026-04-24 00:24:51', '2026-04-16 13:24:51'),
('b54fa6fc-2eaa-460b-b588-9eb8efe95d9e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '4079fc1fbe691c05ee36c925896957c5055d4c8d71dd0cee445c984db84a7b95', '2026-04-24 00:24:42', '2026-04-16 13:24:42'),
('ba85de7b-083b-4124-81b2-aeb3f61fd6be', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '1e81b2169e3fdda07308728667c8cec77ae4559bea8faa3d6e1a16cabcb90f55', '2026-04-24 00:06:43', '2026-04-16 13:06:43'),
('bbe55c6a-c597-4266-b7d0-be6bf2f297f6', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'e4b2dcc71b318cf8e9fb455200b74797332296b70a0289de2b0d32230dc42cee', '2026-04-15 21:55:09', '2026-04-08 10:55:09'),
('bd5e41f9-fd14-4fa8-bcac-c70894ef2f8e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'a680aaa746621d634f678d03323b28f1bec30d8e044201a35ea9ad2f710e65be', '2026-04-23 00:36:49', '2026-04-15 13:36:49'),
('bdc041d5-c8bc-4970-835a-ae7e14a7fba5', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '5dabef61f6d8da4abc4e7ae471595dd160b45c14de2dcb0919e92ffd8da87325', '2026-04-11 21:32:59', '2026-04-04 10:32:59'),
('bee69846-f5d7-46bc-b4b3-d89118c1cc17', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6fccee58893503a7c66169ac45bb9aa7debdf3f8d08eb479383a19017e391152', '2026-04-20 00:08:46', '2026-04-12 13:08:46'),
('c0a22920-f7df-4f6e-8dbd-43240002a0d4', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '248eee89b8c36fb1ee436fdf974235ef7eb163baa3b42dd6c0f3cfd0caf66227', '2026-04-23 21:46:24', '2026-04-16 10:46:24'),
('c0b68948-8de8-4190-90af-44e82d61342e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'cdcc84889d2331e9af494ed916fdb4e23ff6e9705d34c16b07650bf19cd3f2dc', '2026-04-24 01:03:35', '2026-04-16 14:03:35'),
('c0d1a4d2-a1e3-48d3-9fba-a999690478e8', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '8a5c4577a586290714cb450661d2dae3d4ff91a31338daf58bc63993f1049690', '2026-04-23 22:37:24', '2026-04-16 11:37:24'),
('c0dafbd2-2c10-42b3-bbb6-7636b086a5e6', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '165bc80ec415571eed98e28ba27c132d966340e628b2abff38bdcb60169bfe5e', '2026-04-11 14:13:25', '2026-04-04 03:13:25'),
('c36dd41b-099e-4bb1-ac58-71c15c2c177e', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '005313fcc0d1e037fc24f339021e81e4d084c1ae4684108a1606b47519771412', '2026-04-24 00:24:35', '2026-04-16 13:24:35'),
('c8c5b5be-27a9-42ee-a06f-705402c305b5', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '77e592249d0127e50f4c02de81d1708618aeba76e51963a566692388c17a53c8', '2026-04-24 00:53:08', '2026-04-16 13:53:08'),
('c9795c1b-89e8-4ffc-b221-26c3d5ccfad5', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'c42badd10247aba18cfa3fb394c461324b05ae1b276b410ca9a0e4c068927664', '2026-04-24 00:05:24', '2026-04-16 13:05:24'),
('cb301fe1-7b7e-4041-9c1f-f058e9c4e265', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bcae1023ae8044324b4777bcc697edeb644bca864aa006a36c5d7589377bcbfd', '2026-04-23 00:39:54', '2026-04-15 13:39:54'),
('cc7c17f3-9a4c-453b-91b1-e37b1dbc1667', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '0ce14d14cae31d632e281fef655bc761679321aedc2f1f673b56983edb5a339c', '2026-04-23 22:07:24', '2026-04-16 11:07:24'),
('cc9143bf-66a2-436a-9af2-dbe84a410c54', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'e143b3707399be606c2395ba52902b935ed7351687a9ca98517d8d6d3b82cf25', '2026-04-24 00:40:09', '2026-04-16 13:40:09'),
('ce12cbfd-777e-4a6f-b7fc-8ce1b92297c4', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '35413b88e7d20d958496662fa4b4277a84152a39359aa41b786462dee0913958', '2026-04-24 01:12:07', '2026-04-16 14:12:07'),
('d18a8868-12ea-4f8a-b81d-99c82c34f4db', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'a29ec92bc26fe33f2270dde1660ff3ae747120264bac0c166288196ce42ced09', '2026-04-13 01:53:23', '2026-04-05 14:53:23'),
('d191923a-8012-43fc-80bc-4178c7aaf8f0', '244c2909-85ef-4d38-8a0a-2723ff145942', 'users', '3a1f073a4e8eea981d0ee5897035b942018e3be47cd343ed17db918c830bc076', '2026-05-29 01:12:48', '2026-05-21 14:12:48'),
('d1a23945-12dd-4969-ae58-0f1bd9dc1464', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '17089f34cab91fbf27f89f938fd8fac3b8a19b9c9a576b637fa283d9eb001c94', '2026-04-13 02:12:27', '2026-04-05 15:12:27'),
('d2222665-9363-47bb-9e3f-cf326e93bef2', '244c2909-85ef-4d38-8a0a-2723ff145942', 'users', '80b46d5f15f86078bb450f7ae1995d7ed6cd508e8639e33250851c2c4e6a0a33', '2026-05-29 01:38:52', '2026-05-21 14:38:52'),
('d55957da-af48-4b8a-bef5-4573436f1865', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '34507bd48b68020edb4d7cdadc8a60348cbab98aee277d3a762d062f7dbb72aa', '2026-04-23 00:46:31', '2026-04-15 13:46:31'),
('d684b41c-df87-4d3f-a398-4d9b0c23401b', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'f513fc7ff7863283f38df324fe847708c103bd464a035e6c2f50b26ab0c93fe7', '2026-04-24 00:57:02', '2026-04-16 13:57:02'),
('d7615930-aa23-4069-9493-54bbca5be793', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '398dcccf5950e12bcc4cdcb4e8162e24c2c680db7745a1a68c2c7a52c4a18f2a', '2026-04-11 14:14:22', '2026-04-04 03:14:22'),
('d8b99715-a616-4cd4-b3a1-12827e403e80', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '682a0fb6269fe478bb29dedfd9d4a1e7fe454580555bad2374591181a1a3969b', '2026-04-24 00:07:03', '2026-04-16 13:07:03'),
('d925caa3-9cf4-4a7b-b544-f036774c034a', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6d407e6d745c91dd32972478ea9bd089df047e5692c996b08f1a334d4f3b7c90', '2026-04-11 14:11:55', '2026-04-04 03:11:55'),
('d956471a-6fe8-49d1-b06e-8dcb26fcc74d', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'bef8493320434dfba6de641525181f90091db10cc4e8cb577c2a5285ce1e287f', '2026-04-24 00:52:55', '2026-04-16 13:52:55'),
('db426c70-6a15-44af-8d16-f5c1a7a36840', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '0af1efc0e82b169a9ec2ffce3e935b2d4f21c71fda3826ffc34ab7058fe8ba65', '2026-04-11 14:12:31', '2026-04-04 03:12:31'),
('db644e40-3ffb-4160-bcac-ff04de33e0ec', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'fa762be9c6546eb7ea7a0c978067a33150cea00e01ed0ec8073be20324652c59', '2026-04-23 00:37:26', '2026-04-15 13:37:26'),
('dc538a5a-1aa4-4bae-ad31-2c9bbeaca0bd', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '1f0a80a8f7f96070d8aff6e5c5051eb6c073a1c1b0ebaf87a6420c89335a9fed', '2026-04-24 01:22:16', '2026-04-16 14:22:16'),
('dea5d8e0-9ef8-4230-93f2-11f21a11b5bf', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'd97d10ee198dee9d26a7cc52d59682f7a8eb75ff31e21eb05af2cb5a17262d1d', '2026-04-24 01:14:00', '2026-04-16 14:14:00'),
('df7586b4-9a29-4539-afa3-3977e269f6a2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '6606754d25d31c95cfbef95b34b84eabee4aa90b741696fd12fbde308c2125f4', '2026-06-25 00:15:09', '2026-06-17 18:45:09'),
('dff44e9b-7b71-4828-85ab-6799da5a9c72', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '89edd337a4be0853a09b2834b63d287de17c3aaa92a72779942508aa80b9107b', '2026-04-24 01:04:33', '2026-04-16 14:04:33'),
('e7a8be8a-4148-4a80-8218-7e9b1c9e0ab6', '6796b798-fbcb-4511-8a24-e8429263f0e7', 'admins', '58246e2b102c288ba22e9df1b26a3e69588fb161ad582b50a2773f1dbd65e71e', '2026-06-24 23:43:36', '2026-06-17 18:13:36'),
('eb5eb768-541a-48bd-982c-b8071af7817d', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '7e0804f33ddcdf781db1a564abfd8b8b804b8818c41b02b0fef52ec71a1506af', '2026-04-23 00:45:43', '2026-04-15 13:45:43'),
('eb7fcbeb-e1d9-4644-a391-d5151deb9b9b', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '16e8c995a294d6cdd7b3dc583150da40d38b78c63c6e0981c43b8973c32d4290', '2026-04-24 00:07:00', '2026-04-16 13:07:00'),
('ed98a1ef-bb2a-4fb3-add8-2713eb6e7560', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'ad82e15bfcbd5a9443d5c25c062edda180eb973607754f5401d36db317be276d', '2026-04-24 00:24:39', '2026-04-16 13:24:39'),
('eed0ec41-05d7-4521-8129-4ad47426c1b5', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'fca3ffe4c4907cf100f0e0462e0ab8d76f8ea2d4dac2776be655d709384d6d51', '2026-04-24 00:40:23', '2026-04-16 13:40:23'),
('ef1c442d-18df-4cdf-b36e-c2a72b7e12eb', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'users', 'f02d8b2cfcd9290917e116dcccd5b6ce05185cce3215572d8548fd7e1ee52af3', '2026-04-13 00:47:44', '2026-04-05 13:47:44'),
('efa568d9-67b4-47c2-859f-cbddbe7746c2', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'b6e52d4b89d5cf229e0d9017c19a266933b8bd08a5a2a4df70f73a5773457ddd', '2026-04-24 00:06:50', '2026-04-16 13:06:50'),
('f0b12758-4a48-4cd9-a0b2-c0f4a34ec58a', 'bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'vendors', '36d8dc791587ce130532ffae0310fac28ba86a8aac8021c9e33ba6d4a4960bed', '2026-04-11 13:16:42', '2026-04-04 02:16:42'),
('f8cf9a1f-34e8-44f3-91a3-2a844fa7b763', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', 'e7c2af68ae95a21dd4756f6871bc3e59247a1b77c2770dcf20162d772f9064f5', '2026-04-23 00:41:14', '2026-04-15 13:41:14'),
('fa852a25-856c-41f6-93d9-988789e2781c', 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 'admins', '2d98131267a7cef1b3b9263be247279791e70d227e1edf8b3cb9f4a51824829a', '2026-04-24 00:53:46', '2026-04-16 13:53:46'),
('faebedb2-cca5-47a4-b66d-cfd9656523ba', '244c2909-85ef-4d38-8a0a-2723ff145942', 'users', '2df725c3314a097df842905f431bb9903d8570b6dcc3ca3860f8f124e1773c03', '2026-05-29 01:12:43', '2026-05-21 14:12:43'),
('fdec6e22-fe3f-4ff7-9895-b6e2886a7755', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'vendors', '4922932be0d272eb2ea2f7f2dc66fd037c36d37344f145e0150fc0bc012ee2c3', '2026-04-15 21:14:05', '2026-04-08 10:14:05');

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
('3b7e3a9d-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bbc94743-e418-11f0-9f30-00410e2b5e6e', 5.00, 'Absolutely stunning beachfront villa! The infinity pool was incredible and the staff were very attentive. Perfect for a family vacation. The rooms were spacious and clean.', NULL, 5, 5, 5, 5, 5, 5, 5.0, 'published', 0, 1, 'Edited by Admin', NULL, NULL, '2025-12-19 06:47:54', '2026-04-04 02:16:37', NULL),
('3b7e499b-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', NULL, 5.00, 'Best vacation rental we have ever stayed at! Everything was exactly as described. The view from the master bedroom was breathtaking. Highly recommend for anyone visiting Goa!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-26 06:47:54', NULL, NULL),
('3b7e4ed5-e89e-11f0-a597-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', NULL, 4.70, 'Amazing property with great amenities. The beach access was convenient and the kitchen was well-equipped. Would definitely stay again!', NULL, 5, 4, 5, 5, 4, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-31 06:47:54', NULL, NULL),
('review-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', 'user-test-008', 'booking-test-008', 5.00, 'Absolutely Perfect Villa! This villa exceeded all our expectations. The beach view was stunning, the pool was pristine, and the staff was incredibly helpful. Highly recommend for families!', NULL, 5, 5, 5, 5, 5, 5, 0.0, 'published', 0, 0, NULL, NULL, NULL, '2025-12-28 23:00:00', NULL, NULL),
('review-test-004', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-001', 'booking-test-002', 4.50, 'Beautiful Valley Views - The villa has stunning valley views and the bonfire area was amazing. Kitchen was well-equipped. Only minor issue was the hot water took some time in the mornings.', NULL, 4, 4, 5, 5, 5, 4, 4.5, 'published', 0, 1, 'Rating', NULL, NULL, '2026-01-04 22:00:00', '2026-02-15 08:14:44', NULL),
('review-test-008', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', 'user-test-002', 'booking-test-012', 2.70, 'Good property with decent amenities. Some areas could be improved.', NULL, 4, 3, 2, 3, 2, 2, 2.7, 'flagged', 0, 1, 'Removed inappropriate content per platform policy.', NULL, NULL, '2025-11-18 19:30:00', '2026-04-08 12:00:57', '2026-04-08 12:00:57');

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
('reply-test-001', 'review-test-001', '', 'vendor', 'Thank you so much for the wonderful review! We are thrilled you enjoyed your stay. Hope to welcome you back soon!', '2025-12-29 04:00:00', '2026-01-18 05:40:50', NULL),
('reply-test-002', 'review-test-003', '', 'vendor', 'It was our pleasure to host your parents anniversary celebration. Thank you for choosing our property for such a special occasion!', '2025-12-31 05:00:00', '2026-01-18 05:40:50', NULL),
('reply-test-003', 'review-test-004', '', 'vendor', 'Thank you for your valuable feedback! We have fixed the hot water issue. Looking forward to hosting you again!', '2026-01-05 01:00:00', '2026-01-18 05:40:50', NULL);

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
('043ef643-2e5b-4358-a651-9d1764511169', 'Ranjith Gopafy', 'ranjithgopafy@gmail.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-05 14:03:25', '2026-04-08 09:31:16', NULL, '', '', NULL, '06293a8d456498a82aee7f0452f0086c566e19d30dcd1b312165f5e3dde5e2f7', '2026-04-06 02:36:48', 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('1cc890fb-7ccc-489d-8ddc-fe7de669441f', 'Test User Auto', 'testuser1776280195624@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:39:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('1dee3043-ff2a-4712-8e9e-a46ee3024845', 'Shashank', 'shashankzevio@gmail.com', NULL, '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-03-29 11:31:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 'Test User', 'test_1767631087306@test.com', '1234567890', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-01-05 11:08:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('244c2909-85ef-4d38-8a0a-2723ff145942', 'Test User', 'testuser@zevio.in', '9999999999', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-02-21 08:35:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('2cc91896-89fe-46b4-a665-b4ce6f355f29', 'Test User Auto', 'testuser1776280073836@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:37:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 'Test Booker B', 'testbooker_b@zevio.test', '9000000002', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-03-02 11:23:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('351ee21b-d6db-4579-953a-87185e9f287b', 'Test User Auto', 'testuser1776279984236@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:36:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('3ae6732c-3757-433d-bb15-c9c5b9752853', 'Test User Auto', 'testuser1776280541757@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:45:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('4df955f5-45e7-4844-a832-9ec9e5649f5c', 'Test User', 'test_1767630472022@test.com', '1234567890', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-01-05 10:57:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('7e971129-45b8-4c67-8b50-cdb1e9cbe6a6', 'Test User Auto', 'testuser1776280589568@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:46:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('88f47b63-ef0c-4726-9fdf-c976759d7da6', 'Ranjith', 'ranjith@thinktreemedia.in', '9945554414', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-03-01 12:35:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'Gopafy', NULL, 1, NULL, NULL, '2026-03-01 13:26:37', 0, 0, NULL, 0, '2026-03-01 13:29:54'),
('95da3eb7-aaf3-4bee-bc1e-9044c72e573d', 'Test User Auto', 'testuser1776280467165@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:44:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('a1336f20-f05e-4142-a10e-4c7f7be3c295', 'Test User Updated', 'testuser@zevio.com', '9876500000', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-08 11:07:32', NULL, NULL, '123, Test Street, Bengaluru', 'Testing the bio field — added during platform testing.', NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('a85b436f-dde2-4b06-ae86-aca64e6b222c', 'Vinod', 'gopafyvinod@gmail.com', '7811720071', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-03-04 02:48:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-03-04 06:09:28'),
('a9fb0aae-b803-427e-8540-e44bfe29e9a6', 'Test Booker A', 'testbooker_a@zevio.test', '9000000001', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-03-02 11:23:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('ae1a695c-6724-4098-bd50-73a2cf569779', 'Test User', 'test_1767631229011@test.com', '1234567890', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-01-05 11:10:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb551978-e418-11f0-9f30-00410e2b5e6e', 'Amit Kumar', 'rajesh@example.com', '9876543210', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'Priya Sharma', 'priya@example.com', '9876543211', '$2a$10$gui.vHTx6R8XjrdoznshdO9tv.Hqeu6lv6gY09s6q.P.iYv1.VfzS', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL, NULL, 'c4485bb49b24e29f9f815e64353776d9ea64a9a5a0d85940322810b1104a72aa', '2026-04-08 23:08:16', 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553a04-e418-11f0-9f30-00410e2b5e6e', 'Ravi Singh', 'amit@example.com', '9876543212', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553ab0-e418-11f0-9f30-00410e2b5e6e', 'Sneha Reddy', 'sneha@example.com', '9876543213', '$2a$10$yOC.Vpu6kJrpjz4KSW6saeD/sw7BObnKzK09TUCt1fKFKDgyoSEA.', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('bb553b3e-e418-11f0-9f30-00410e2b5e6e', 'Vikram Singh', 'vikram@example.com', '9876543214', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-28 12:42:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 'Test User', 'test_1767631377325@test.com', '1234567890', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-01-05 11:12:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 'Test User', 'test_1767631170547@test.com', '1234567890', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-01-05 11:09:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('e7edc5e8-44ca-4ee6-bc08-3114dabe041e', 'Test User Auto', 'testuser1776280275192@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:41:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('f78bf67b-a002-4398-a8e6-868550880cb9', 'Test User Auto', 'testuser1776280267896@test.com', '9876543210', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2026-04-15 13:41:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, NULL),
('user-test-001', 'Rajesh Mehta', 'rajesh.mehta@test.com', '9123456780', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-28 23:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-002', 'Sneha Patel', 'sneha.patel@test.com', '9123456781', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-29 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-003', 'Vikram Rao', 'vikram.rao@test.com', '9123456782', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-29 01:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-004', 'Anjali Desai', 'anjali.desai@test.com', '9123456783', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-29 22:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-005', 'Karan Shah', 'karan.shah@test.com', '9123456784', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-29 23:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-006', 'Neha Gupta', 'neha.gupta@test.com', '9123456785', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'blocked', '2025-12-30 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-007', 'Arjun Nair', 'arjun.nair@test.com', '9123456786', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-30 21:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL),
('user-test-008', 'Pooja Kapoor', 'pooja.kapoor@test.com', '9123456787', '$2a$10$3J0Rc1sCWhp3/ixDzToaAuTqsP2meWDzq847ybcorGvV7wQFaPDsS', 'active', '2025-12-30 22:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0, 0, NULL, 0, NULL);

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
('26523f3a-0c46-4ea5-b715-74996830dcca', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-04 06:11:32', '2026-03-04 06:11:32'),
('422c6ed9-25ae-11f1-9f44-00410e2b5e6e', '32d3b01b-2452-431e-aeff-b3a1fe3ea69d', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-21 23:46:10', '2026-03-21 23:46:10'),
('422c6fae-25ae-11f1-9f44-00410e2b5e6e', 'a9fb0aae-b803-427e-8540-e44bfe29e9a6', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-21 23:46:10', '2026-03-21 23:46:10'),
('422c72c6-25ae-11f1-9f44-00410e2b5e6e', '88f47b63-ef0c-4726-9fdf-c976759d7da6', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-03-21 23:46:10', '2026-03-21 23:46:10'),
('af3aa059-8353-443b-b386-d164b6694b87', '244c2909-85ef-4d38-8a0a-2723ff145942', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-02-21 23:59:10', '2026-02-21 23:59:10'),
('b614154f-050c-48e0-ab2b-5013a1147304', 'a1336f20-f05e-4142-a10e-4c7f7be3c295', 1, 1, 1, 1, 0, 1, 'public', 1, 0, 1, '2026-04-08 11:52:42', '2026-04-08 11:53:22'),
('d4d8ac23-ee5e-11f0-8497-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8acbb-ee5e-11f0-8497-00410e2b5e6e', 'user-test-004', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8acf9-ee5e-11f0-8497-00410e2b5e6e', 'user-test-007', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ad26-ee5e-11f0-8497-00410e2b5e6e', 'user-test-005', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ad50-ee5e-11f0-8497-00410e2b5e6e', 'user-test-006', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ad79-ee5e-11f0-8497-00410e2b5e6e', 'user-test-008', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ada4-ee5e-11f0-8497-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8adcd-ee5e-11f0-8497-00410e2b5e6e', 'user-test-001', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8adf8-ee5e-11f0-8497-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ae20-ee5e-11f0-8497-00410e2b5e6e', 'user-test-002', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ae4b-ee5e-11f0-8497-00410e2b5e6e', 'bb553ab0-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8ae76-ee5e-11f0-8497-00410e2b5e6e', '4df955f5-45e7-4844-a832-9ec9e5649f5c', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8aea0-ee5e-11f0-8497-00410e2b5e6e', '2311bd48-54ff-469e-8a7c-9ff89ee7fb78', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8aec9-ee5e-11f0-8497-00410e2b5e6e', 'c5c35ba5-8d7c-43ed-9eb6-fe1a19fe6f94', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8aef4-ee5e-11f0-8497-00410e2b5e6e', 'ae1a695c-6724-4098-bd50-73a2cf569779', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8af1f-ee5e-11f0-8497-00410e2b5e6e', 'c25ee6dc-46b9-4c05-9ed1-82a3b3e5732d', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8af4b-ee5e-11f0-8497-00410e2b5e6e', 'user-test-003', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03'),
('d4d8af77-ee5e-11f0-8497-00410e2b5e6e', 'bb553b3e-e418-11f0-9f30-00410e2b5e6e', 1, 1, 1, 0, 0, 1, 'private', 0, 0, 1, '2026-01-10 14:29:03', '2026-01-10 14:29:03');

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
('bb60817d-e418-11f0-9f30-00410e2b5e6e', 'Vendor Test Updated', 'vendor1@example.com', '$2a$12$l3GSSxyncIVIwvVuJam90eDwdJgqwPCpddSBWJkqLBVkyonS9M/wW', '9999988888', 'TEST123', 1, 'Test Corp', '', '12, MG Road, Bengaluru, Karnataka', '', '', '', '{\"bank_name\":null,\"account_holder_name\":\"Test\",\"account_number\":\"123456789\",\"ifsc_code\":\"HDFCDROPTAB\",\"branch_name\":null}', 'active', '2025-12-28 12:42:12', NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL),
('bb6097e5-e418-11f0-9f30-00410e2b5e6e', 'Beach Resorts Group', 'vendor2@example.com', '$2a$10$IiSSHr7DN.zmhttjrTkNoON2BJot2uG859DfB996J74AyEoLEAWqu', '9876543231', '27AABCB1234C1Z5', 1, NULL, NULL, NULL, NULL, NULL, NULL, '{\"bank_name\": \"ICICI Bank\", \"account_number\": \"56789012345678\", \"ifsc\": \"ICIC0005678\", \"account_holder\": \"Beach Resorts Group\"}', 'active', '2025-12-28 12:42:12', NULL, NULL, 0, 0, NULL, 0, '2026-04-15 13:39:57', NULL, NULL),
('bb6099c9-e418-11f0-9f30-00410e2b5e6e', 'Mountain Retreats', 'vendor3@example.com', '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW', '9876543232', '07AABCM9876K1Z8', 1, NULL, NULL, NULL, NULL, NULL, NULL, '{\"bank_name\": \"SBI\", \"account_number\": \"98765432109876\", \"ifsc\": \"SBIN0009876\", \"account_holder\": \"Mountain Retreats\"}', 'active', '2025-12-28 12:42:12', NULL, NULL, 0, 0, NULL, 0, NULL, NULL, NULL),
('dbf6a3f2-c630-4329-a455-caa1dd3943e6', 'Mithun', 'mithunmanju77@gmail.com', '$2a$10$2WlOb1OXeJtmNhgSxmHBdOJgT28tIN7s1Gi0wtJMj3nlciVQ9hCPC', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-03-29 11:34:50', NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-03-29 11:36:51', NULL, NULL),
('f10abec0-bc8b-4688-9b73-11eef686b9f3', 'Ranjith', 'ranjithgopafy@gmail.com', '$2a$10$eGNQQgntPBCG4SgNznM8eOfQBD7Xu6jiddGU15vPEuREWKPg7wBl.', '9945554414', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', '2026-02-14 23:12:01', NULL, NULL, 0, 0, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', 0, '2026-02-14 23:13:40', NULL, NULL);

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
  `booking_discount_amount` decimal(12,2) DEFAULT 0.00,
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

--
-- Dumping data for table `vendor_settlements`
--

INSERT INTO `vendor_settlements` (`id`, `vendor_id`, `booking_id`, `booking_base_amount`, `booking_gst_amount`, `booking_service_charge`, `booking_total_amount`, `booking_discount_amount`, `vendor_gross_amount`, `platform_fee`, `platform_fee_gst`, `total_deduction`, `is_vendor_gst`, `amount`, `status`, `payment_proof`, `created_at`) VALUES
('01abe6ea-1f27-444c-a2c2-24fae5400425', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'E2E-TEST-1776368068423', '2026-04-16 14:03:20'),
('17a7edb8-4c9b-476f-b538-d796680f7858', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'E2E-TEST-1776367672932', '2026-04-16 13:56:46'),
('2a7ef041-b4ab-4576-8697-171e7315c0b6', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5000.00, 900.00, 200.00, 6100.00, 0.00, 5800.00, 580.00, 104.40, 684.40, 1, 5115.60, 'pending', NULL, '2026-04-16 14:27:05'),
('419ee33b-f7b7-489d-8aa1-ae143db089ed', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 100368.00, 10627.20, 7084.80, 118080.00, 0.00, 97356.96, 3011.04, 541.99, 3553.03, 1, 93803.93, 'paid', 'TEST-PROOF', '2026-04-16 13:51:53'),
('44fdb2dd-85a1-49e0-9593-fc70367a0e81', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'E2E-TEST-1776368685339', '2026-04-16 14:13:46'),
('4624f6de-6a14-4d5a-a91d-e32eccf09484', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 14:13:46'),
('5b8b9093-0a90-4451-9398-d4bdeb44df4a', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'TEST-PROOF', '2026-04-16 14:03:20'),
('6c1f9c1f-80b7-4346-88e7-6a16df3aab85', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'E2E-TEST-1776367711971', '2026-04-16 13:56:46'),
('76c9869b-41db-461e-ad02-edfe2c75bcfa', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'd5133df0-cec7-48eb-9eb0-af30118d3001', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'paid', 'E2E-TEST-1776368522364', '2026-04-16 14:11:03'),
('968bf43e-d5a8-4b3f-bc76-a27fa2c33dfc', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5000.00, 900.00, 200.00, 6100.00, 0.00, 5800.00, 580.00, 104.40, 684.40, 1, 5115.60, 'pending', NULL, '2026-04-16 14:27:05'),
('990aca9e-6360-4b6f-983a-f9ee419932fa', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '95f0abbe-fb09-4f6f-b571-c8640620addc', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 14:11:03'),
('a17f9f01-3a33-486d-8d1b-3d54267c4463', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5000.00, 900.00, 200.00, 6100.00, 0.00, 5800.00, 580.00, 104.40, 684.40, 1, 5115.60, 'pending', NULL, '2026-04-16 14:27:05'),
('bd106270-b0eb-4347-a422-895a49a674ff', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '95f0abbe-fb09-4f6f-b571-c8640620addc', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 14:03:20'),
('c11dc120-629a-4f8c-affb-37d4f2c797ac', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5000.00, 900.00, 200.00, 6100.00, 0.00, 5800.00, 580.00, 104.40, 684.40, 1, 5115.60, 'paid', 'https://example.com/proof.pdf', '2026-04-16 14:27:05'),
('d7935a48-f3a7-4b86-9baa-b36424f0d131', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '95f0abbe-fb09-4f6f-b571-c8640620addc', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 13:56:46'),
('e1df7030-794d-4d5c-be5b-e4e92645482a', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '95f0abbe-fb09-4f6f-b571-c8640620addc', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 14:13:46'),
('e7e9a0c1-fb2b-43eb-83cb-d3c29ca6c605', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', '95f0abbe-fb09-4f6f-b571-c8640620addc', 9409.50, 996.30, 664.20, 11070.00, 0.00, 9127.22, 282.28, 50.81, 333.09, 1, 8794.13, 'pending', NULL, '2026-04-16 13:51:53'),
('f800863e-03d1-479f-a017-f8a27503202e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5000.00, 900.00, 200.00, 6100.00, 0.00, 5800.00, 580.00, 104.40, 684.40, 1, 5115.60, 'paid', 'https://example.com/proof.pdf', '2026-04-16 14:27:05'),
('fcce06f7-b036-44cf-9f86-bef054b60f1e', 'bb60817d-e418-11f0-9f30-00410e2b5e6e', 'f17ef3fd-7ed9-432a-9912-a03a4c84889c', 5100.00, 540.00, 360.00, 6000.00, 0.00, 4947.00, 153.00, 27.54, 180.54, 1, 4766.46, 'pending', NULL, '2026-04-16 14:11:03');

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
(1, '<h2>Vendor Terms and Conditions</h2><p>By listing your property on Zevio and clicking \"Submit for Approval\", you agree to the following terms and conditions. Please read them carefully before proceeding.</p><h3>1. Property Listing</h3><p>You agree to provide accurate, complete, and up-to-date information about your property, including descriptions, photos, pricing, and availability.</p><h3>2. Commission and Payments</h3><p>Zevio charges a platform commission on each confirmed booking. Settlement will be processed within the agreed timeline after guest check-out, minus applicable deductions.</p><h3>3. Cancellation Policy</h3><p>You must honour the cancellation policy associated with your property type. Frequent cancellations may result in suspension or removal of your listing.</p><h3>4. Property Standards</h3><p>Your property must meet Zevio\'s quality and safety standards. Zevio reserves the right to remove listings that do not comply with these standards.</p><h3>5. Guest Conduct</h3><p>You agree to treat all guests with respect and professionalism. Any discrimination or misconduct may result in immediate account suspension.</p><h3>6. Legal Compliance</h3><p>You are solely responsible for ensuring your property listing complies with all applicable local laws, regulations, and licensing requirements.</p><h3>7. Amendments</h3><p>Zevio reserves the right to update these Terms and Conditions at any time. Continued use of the platform constitutes acceptance of the revised terms.</p><p><br></p><p>Vendors must comply with Zevio platform policies. Properties must be accurately listed with real photos and correct pricing. Platform commission: 10% per confirmed booking. Payouts are processed within 7 working days after</p><p>checkout.</p>', 4, 'bb5898f8-e418-11f0-9f30-00410e2b5e6e', '2026-04-08 11:43:53', '2026-03-28 11:47:50');

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
('1fe5ab66-9509-456d-8bd9-5d5522cf74ab', '043ef643-2e5b-4358-a651-9d1764511169', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-05 14:04:37', NULL),
('239254ba-d885-4eda-a516-c6d5dcdaad1d', '88f47b63-ef0c-4726-9fdf-c976759d7da6', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-03-12 10:11:13', NULL),
('3b79bb2b-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 06:47:54', NULL),
('3b79c8ec-e89e-11f0-a597-00410e2b5e6e', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 06:47:54', NULL),
('3b79ca44-e89e-11f0-a597-00410e2b5e6e', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 06:47:54', NULL),
('3b79cb7b-e89e-11f0-a597-00410e2b5e6e', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 06:47:54', NULL),
('3c03a911-bab3-4adc-8f13-96b516d9fa64', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-03-04 06:47:12', NULL),
('52b704a4-4e6d-4852-a20d-2d94273a4259', 'a85b436f-dde2-4b06-ae86-aca64e6b222c', '495d4419-f31f-11f0-8f27-00410e2b5e6e', '2026-03-04 07:15:07', NULL),
('70b9abac-fa96-4d8d-aa9a-9a9b10aadd00', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-10 03:29:59', NULL),
('bd3bc323-8ccd-43c1-80c3-5baa6b55187b', 'a1336f20-f05e-4142-a10e-4c7f7be3c295', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-08 11:12:52', NULL),
('c5470d3d-e369-41d5-9fac-86131838f556', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-04-05 11:03:51', NULL),
('cbb10d02-c02e-4a10-af1e-edc0430ceba6', '244c2909-85ef-4d38-8a0a-2723ff145942', '43fbca17-da17-419f-b72a-f2d44d1caf5f', '2026-03-28 06:55:53', NULL),
('wishlist-test-003', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 22:00:00', NULL),
('wishlist-test-004', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 00:00:00', NULL),
('wishlist-test-005', 'bb551978-e418-11f0-9f30-00410e2b5e6e', 'bba49bf2-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 03:00:00', NULL),
('wishlist-test-007', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-01-04 23:00:00', NULL),
('wishlist-test-008', 'bb5538d1-e418-11f0-9f30-00410e2b5e6e', 'bba4ada9-e418-11f0-9f30-00410e2b5e6e', '2026-01-05 23:00:00', NULL),
('wishlist-test-009', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb974859-e418-11f0-9f30-00410e2b5e6e', '2026-01-02 23:00:00', NULL),
('wishlist-test-010', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9b3625-e418-11f0-9f30-00410e2b5e6e', '2026-01-03 23:00:00', NULL),
('wishlist-test-011', 'bb553a04-e418-11f0-9f30-00410e2b5e6e', 'bb9fca40-e418-11f0-9f30-00410e2b5e6e', '2026-01-04 23:00:00', NULL),
('wishlist-test-013', 'user-test-001', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 22:00:00', NULL),
('wishlist-test-014', 'user-test-001', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-07 22:30:00', NULL),
('wishlist-test-015', 'user-test-002', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 23:00:00', NULL),
('wishlist-test-016', 'user-test-003', 'bb9739d5-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 00:00:00', NULL),
('wishlist-test-017', 'user-test-004', 'bb927936-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 19:30:00', NULL),
('wishlist-test-018', 'user-test-004', 'bb9b250d-e418-11f0-9f30-00410e2b5e6e', '2026-01-08 20:30:00', NULL),
('wishlist-test-019', 'user-test-005', 'bb929607-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 17:30:00', NULL),
('wishlist-test-020', 'user-test-007', 'bb9298e7-e418-11f0-9f30-00410e2b5e6e', '2026-01-09 18:30:00', NULL);

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
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_banners_property` (`property_id`),
  ADD KEY `idx_banners_active` (`is_active`,`deleted_at`,`valid_from`,`valid_until`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_booking_provider_reference` (`source_provider_key`,`source_reference_id`),
  ADD KEY `idx_property_dates_status` (`property_id`,`check_in`,`check_out`,`status`),
  ADD KEY `idx_user_history` (`user_id`,`created_at`),
  ADD KEY `idx_payment_expiry` (`status`,`payment_status`,`payment_expires_at`),
  ADD KEY `idx_bookings_source` (`booking_source`,`source_provider_key`);

--
-- Indexes for table `cancellation_policies`
--
ALTER TABLE `cancellation_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cancel_policy_type` (`property_type_id`);

--
-- Indexes for table `channel_manager_daily_controls`
--
ALTER TABLE `channel_manager_daily_controls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cm_daily_control` (`integration_id`,`external_room_type_id`,`external_rate_plan_id`,`control_date`),
  ADD KEY `idx_cm_daily_property_date` (`property_id`,`control_date`),
  ADD KEY `idx_cm_daily_provider_date` (`provider_key`,`control_date`);

--
-- Indexes for table `channel_manager_integrations`
--
ALTER TABLE `channel_manager_integrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cm_provider_hotel` (`provider_key`,`external_hotel_id`),
  ADD KEY `idx_cm_vendor` (`vendor_id`),
  ADD KEY `idx_cm_provider_status` (`provider_key`,`status`);

--
-- Indexes for table `channel_manager_property_mappings`
--
ALTER TABLE `channel_manager_property_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cm_mapping_integration_property` (`integration_id`,`property_id`),
  ADD UNIQUE KEY `uq_cm_mapping_integration_external` (`integration_id`,`external_property_id`),
  ADD KEY `idx_cm_mapping_property` (`property_id`);

--
-- Indexes for table `channel_manager_webhook_events`
--
ALTER TABLE `channel_manager_webhook_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cm_external_event` (`provider_key`,`external_event_id`),
  ADD KEY `idx_cm_event_status` (`processing_status`,`received_at`),
  ADD KEY `idx_cm_event_provider` (`provider_key`),
  ADD KEY `idx_cm_event_integration` (`integration_id`);

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
  ADD UNIQUE KEY `uq_blackout_provider_reference` (`source_provider_key`,`source_reference_id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `idx_blackout_source_provider` (`blackout_source`,`source_provider_key`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `invoice_number` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100018;

--
-- AUTO_INCREMENT for table `location_types`
--
ALTER TABLE `location_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `property_contacts`
--
ALTER TABLE `property_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `property_features`
--
ALTER TABLE `property_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

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
-- Constraints for table `banners`
--
ALTER TABLE `banners`
  ADD CONSTRAINT `fk_banners_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `channel_manager_daily_controls`
--
ALTER TABLE `channel_manager_daily_controls`
  ADD CONSTRAINT `fk_cm_daily_integration` FOREIGN KEY (`integration_id`) REFERENCES `channel_manager_integrations` (`id`),
  ADD CONSTRAINT `fk_cm_daily_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `channel_manager_integrations`
--
ALTER TABLE `channel_manager_integrations`
  ADD CONSTRAINT `fk_cm_integration_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`);

--
-- Constraints for table `channel_manager_property_mappings`
--
ALTER TABLE `channel_manager_property_mappings`
  ADD CONSTRAINT `fk_cm_mapping_integration` FOREIGN KEY (`integration_id`) REFERENCES `channel_manager_integrations` (`id`),
  ADD CONSTRAINT `fk_cm_mapping_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`);

--
-- Constraints for table `channel_manager_webhook_events`
--
ALTER TABLE `channel_manager_webhook_events`
  ADD CONSTRAINT `fk_cm_event_integration` FOREIGN KEY (`integration_id`) REFERENCES `channel_manager_integrations` (`id`);

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
