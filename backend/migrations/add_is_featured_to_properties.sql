-- Migration: Add is_featured and related columns to properties table
-- Required by featuredPropertiesController.js

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_recommended,
  ADD COLUMN IF NOT EXISTS priority_order INT NOT NULL DEFAULT 0 AFTER is_featured,
  ADD COLUMN IF NOT EXISTS featured_at DATETIME NULL AFTER priority_order,
  ADD COLUMN IF NOT EXISTS featured_by VARCHAR(36) NULL AFTER featured_at;

-- Index for fast featured property queries
ALTER TABLE properties
  ADD INDEX IF NOT EXISTS idx_is_featured (is_featured, deleted_at);
