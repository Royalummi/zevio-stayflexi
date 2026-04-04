-- Delta Migration 5: Security tables, bank details, vendor GST, settlement breakdown
-- Date: 2026-04-04
-- For: MySQL 8.0 (no IF NOT EXISTS on ADD COLUMN)

-- ============================================================
-- 1. Create security tables
-- ============================================================

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `user_table` VARCHAR(20) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_refresh_user` (`user_id`),
  INDEX `idx_refresh_hash` (`token_hash`),
  INDEX `idx_refresh_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `email` VARCHAR(255) PRIMARY KEY,
  `attempts` INT DEFAULT 0,
  `locked_until` DATETIME NULL,
  `last_attempt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. Safe ADD COLUMN helper (MySQL 8.0 compatible)
-- ============================================================

DROP PROCEDURE IF EXISTS safe_add_column;
DELIMITER //
CREATE PROCEDURE safe_add_column(
  IN tbl VARCHAR(64),
  IN col VARCHAR(64),
  IN col_def VARCHAR(512)
)
BEGIN
  SET @exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  );
  IF @exists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 3. Admin reset_token columns
-- ============================================================

CALL safe_add_column('admins', 'reset_token', 'VARCHAR(128) NULL');
CALL safe_add_column('admins', 'reset_token_expiry', 'DATETIME NULL');

-- ============================================================
-- 4. Vendor reset_token + is_gst_registered columns
-- ============================================================

CALL safe_add_column('vendors', 'reset_token', 'VARCHAR(128) NULL');
CALL safe_add_column('vendors', 'reset_token_expiry', 'DATETIME NULL');
CALL safe_add_column('vendors', 'is_gst_registered', "TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether vendor is GST registered'");

-- Set is_gst_registered=1 for vendors that already have a GST number
UPDATE `vendors` SET `is_gst_registered` = 1
WHERE `gst_number` IS NOT NULL AND `gst_number` != '';

-- ============================================================
-- 5. Users bank_details column
-- ============================================================

CALL safe_add_column('users', 'bank_details', 'JSON DEFAULT NULL');

-- ============================================================
-- 6. Vendor settlements breakdown columns
-- ============================================================

CALL safe_add_column('vendor_settlements', 'booking_base_amount', "DECIMAL(12,2) DEFAULT NULL COMMENT 'Booking base amount (before GST/service charge)'");
CALL safe_add_column('vendor_settlements', 'booking_gst_amount', "DECIMAL(12,2) DEFAULT NULL COMMENT 'GST amount from booking'");
CALL safe_add_column('vendor_settlements', 'booking_service_charge', "DECIMAL(12,2) DEFAULT NULL COMMENT 'Service charge from booking'");
CALL safe_add_column('vendor_settlements', 'booking_total_amount', "DECIMAL(12,2) DEFAULT NULL COMMENT 'Total amount guest paid'");
CALL safe_add_column('vendor_settlements', 'vendor_gross_amount', "DECIMAL(12,2) DEFAULT NULL COMMENT 'Vendor gross (base+GST for GST vendor, base only for non-GST)'");
CALL safe_add_column('vendor_settlements', 'platform_fee', "DECIMAL(12,2) DEFAULT NULL COMMENT '3% of vendor gross amount'");
CALL safe_add_column('vendor_settlements', 'platform_fee_gst', "DECIMAL(12,2) DEFAULT NULL COMMENT '18% GST on platform fee'");
CALL safe_add_column('vendor_settlements', 'total_deduction', "DECIMAL(12,2) DEFAULT NULL COMMENT 'platform_fee + platform_fee_gst'");
CALL safe_add_column('vendor_settlements', 'is_vendor_gst', "TINYINT(1) DEFAULT 0 COMMENT 'Was vendor GST registered at time of settlement'");

-- ============================================================
-- 7. Cleanup
-- ============================================================

DROP PROCEDURE IF EXISTS safe_add_column;

-- Done!
SELECT 'Delta migration 5 complete' AS status;
