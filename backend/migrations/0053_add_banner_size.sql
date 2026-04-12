-- Migration 0053: Add banner_size field to banners table
-- Allows admin to choose between a normal-sized popup and a large (80vw × 80vh) popup

ALTER TABLE banners
  ADD COLUMN banner_size ENUM('normal', 'large') NOT NULL DEFAULT 'normal'
  AFTER image_fit_mode;
