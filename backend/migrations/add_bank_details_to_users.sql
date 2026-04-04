-- Add bank_details column to users table for storing customer refund/settlement bank info
ALTER TABLE users ADD COLUMN bank_details JSON DEFAULT NULL AFTER bio;
