-- =====================================================
-- SESSION 35: SERVICE APARTMENTS EXPANSION - MIGRATION 4/4
-- Add corporate user fields to users table (minimal implementation)
-- Date: January 17, 2026
-- =====================================================

USE zevio;

-- Add corporate user fields to existing users table
ALTER TABLE `users`
  ADD COLUMN `is_corporate_user` BOOLEAN DEFAULT FALSE COMMENT 'User booking for company',
  ADD COLUMN `company_name` VARCHAR(255) DEFAULT NULL COMMENT 'Company name',
  ADD COLUMN `company_gst` VARCHAR(15) DEFAULT NULL COMMENT 'Company GST number',
  ADD COLUMN `company_email_verified` BOOLEAN DEFAULT FALSE COMMENT 'Company email verified',
  ADD COLUMN `email_verification_token` VARCHAR(255) DEFAULT NULL COMMENT 'Email verification token',
  ADD COLUMN `email_verified_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Email verification timestamp';

-- Create indexes for performance
CREATE INDEX `idx_corporate_users` ON `users`(`is_corporate_user`, `company_email_verified`);
CREATE INDEX `idx_email_verification` ON `users`(`email_verification_token`);

-- =====================================================
-- MIGRATION COMPLETE: Corporate user fields added
-- Total new columns: 6
-- Indexes created: 2
-- 
-- All 4 migrations completed successfully!
-- Database ready for service apartments + corporate features
-- =====================================================
