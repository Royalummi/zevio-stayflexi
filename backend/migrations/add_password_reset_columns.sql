-- Add password reset columns to users table
-- Run this in phpMyAdmin or MySQL client

ALTER TABLE users
ADD COLUMN reset_token VARCHAR(10) DEFAULT NULL,
ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL;

-- Add index for faster token lookups
CREATE INDEX idx_reset_token ON users(reset_token);
