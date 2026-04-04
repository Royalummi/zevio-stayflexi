-- Security Enhancement Migration
-- Adds refresh_tokens table, login_attempts table, and reset_token columns to admins/vendors

-- Refresh tokens table (for server-side token management + rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  user_table VARCHAR(20) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_hash (token_hash),
  INDEX idx_refresh_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login attempts table (for account lockout)
CREATE TABLE IF NOT EXISTS login_attempts (
  email VARCHAR(255) PRIMARY KEY,
  attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add reset_token columns to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128) NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME NULL;

-- Add reset_token columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128) NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME NULL;
