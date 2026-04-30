-- ===================================================================
-- MIGRATION: Remove Employee Features
-- Date: 2026-01-22
-- Description: Remove all employee-related tables, fields, and constraints
-- ===================================================================

-- Drop foreign key constraints first
ALTER TABLE employee_claims DROP FOREIGN KEY IF EXISTS fk_employee_claims_employee;
ALTER TABLE employee_points DROP FOREIGN KEY IF EXISTS fk_employee_points_employee;
ALTER TABLE employee_points DROP FOREIGN KEY IF EXISTS fk_employee_points_booking;

-- Drop employee-related tables
DROP TABLE IF EXISTS employee_claims;
DROP TABLE IF EXISTS employee_points;
DROP TABLE IF EXISTS employees;

-- Remove employee_id column from properties table if it exists
ALTER TABLE properties DROP COLUMN IF EXISTS employee_id;

-- Update notifications table to remove employee role references
-- Note: Keeping the ENUM for backward compatibility, but employee notifications will be ignored
-- If you want to remove the enum value completely, you'll need to recreate the column

-- Clean up any remaining employee notifications
DELETE FROM notifications WHERE recipient_role = 'employee';

-- Clean up activity logs related to employees
DELETE FROM activity_logs WHERE actor_role = 'employee';
DELETE FROM activity_logs WHERE entity = 'employee_claim';
DELETE FROM activity_logs WHERE entity = 'employee_point';

-- ===================================================================
-- MIGRATION COMPLETE
-- ===================================================================
-- The following has been removed:
-- 1. employees table (employee data)
-- 2. employee_points table (points tracking)
-- 3. employee_claims table (claims management)
-- 4. employee_id foreign key from properties
-- 5. Employee-related notifications and activity logs
-- ===================================================================
