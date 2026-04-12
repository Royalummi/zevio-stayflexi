-- SESSION 70+: Banner image layout fields
-- Adds admin-configurable image ratio/orientation and fit mode for banners

ALTER TABLE banners
  ADD COLUMN image_aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9' AFTER image_url,
  ADD COLUMN image_fit_mode ENUM('contain', 'cover') NOT NULL DEFAULT 'contain' AFTER image_aspect_ratio;
