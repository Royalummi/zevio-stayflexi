-- SESSION 70+: ADD IMAGE SUPPORT TO BANNERS
-- Adds optional image_url column to banners table

ALTER TABLE banners
  ADD COLUMN image_url VARCHAR(500) NULL
  AFTER inline_link_url;
