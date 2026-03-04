-- Migration: Add address and bio columns to users table
-- Date: 2026-03-04
-- Needed by: nextjs/app/dashboard/profile/page.tsx (profile update form)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER avatar,
  ADD COLUMN IF NOT EXISTS bio TEXT NULL AFTER address;
