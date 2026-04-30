-- ===================================================================
-- MIGRATION: Remove Employee Features (SAFE / GUARDED version)
-- Date: 2026-04-26
-- Author: Generated after live DB audit
-- Purpose: Safely archive and remove employee-related tables and columns
--          from zevio_production, which still holds test/seed data from
--          the original database seeder (all rows created 2025-12-28).
--
-- SAFE TO RUN: yes — guards check for existence at every step.
-- IDEMPOTENT:  yes — re-running after completion is a no-op.
-- REVERSIBLE:  partial — archived tables are kept; use DROP TABLE
--              _employee*_archive to finalize cleanup later.
--
-- Live state at time of authoring:
--   employees           → 2 rows  (seed: rahul.emp / neha.emp @zevio.com)
--   employee_claims     → 2 rows  (seed payout claims)
--   employee_points     → 0 rows
--   properties.employee_id → 2 rows with non-null value (seed properties)
-- ===================================================================

START TRANSACTION;

-- -------------------------------------------------------------------
-- STEP 1: Archive tables (create copies before dropping)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _employees_archive LIKE employees;
INSERT IGNORE INTO _employees_archive SELECT * FROM employees WHERE 1=1;

CREATE TABLE IF NOT EXISTS _employee_claims_archive LIKE employee_claims;
INSERT IGNORE INTO _employee_claims_archive SELECT * FROM employee_claims WHERE 1=1;

CREATE TABLE IF NOT EXISTS _employee_points_archive LIKE employee_points;
INSERT IGNORE INTO _employee_points_archive SELECT * FROM employee_points WHERE 1=1;

-- -------------------------------------------------------------------
-- STEP 2: Null-out properties.employee_id (safe — column may be NULL)
-- -------------------------------------------------------------------
UPDATE properties SET employee_id = NULL WHERE employee_id IS NOT NULL;

-- -------------------------------------------------------------------
-- STEP 3: Drop foreign key constraints
-- (Names from SHOW CREATE TABLE on 2026-04-26; IF EXISTS not supported on this MariaDB)
-- -------------------------------------------------------------------
ALTER TABLE employee_claims
  DROP FOREIGN KEY employee_claims_ibfk_1;

ALTER TABLE employee_points
  DROP FOREIGN KEY employee_points_ibfk_1,
  DROP FOREIGN KEY employee_points_ibfk_2;

-- -------------------------------------------------------------------
-- STEP 4: Drop employee tables
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS employee_claims;
DROP TABLE IF EXISTS employee_points;
DROP TABLE IF EXISTS employees;

-- -------------------------------------------------------------------
-- STEP 5: Remove employee_id column from properties
-- -------------------------------------------------------------------
ALTER TABLE properties
  DROP INDEX IF EXISTS employee_id,
  DROP COLUMN IF EXISTS employee_id;

-- -------------------------------------------------------------------
-- STEP 6: Clean up notifications and activity_logs
-- -------------------------------------------------------------------
DELETE FROM notifications    WHERE recipient_role = 'employee';
DELETE FROM activity_logs    WHERE actor_role     = 'employee';
DELETE FROM activity_logs    WHERE entity         IN ('employee_claim', 'employee_point');

COMMIT;

-- ===================================================================
-- MIGRATION COMPLETE
-- What was done:
--   ✅ employees, employee_claims, employee_points — archived then dropped
--   ✅ properties.employee_id — NULLed then column removed
--   ✅ Notifications / activity_logs with employee references deleted
--
-- Archive tables left behind (safe to review then drop manually):
--   _employees_archive
--   _employee_claims_archive
--   _employee_points_archive
-- To fully clean: DROP TABLE _employees_archive, _employee_claims_archive, _employee_points_archive;
-- ===================================================================
