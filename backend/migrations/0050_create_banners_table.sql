-- SESSION 70: POP-BANNER SYSTEM
-- Admin-managed promotional banners displayed on the Next.js user site
-- Supports: popup, top_bar, slide_in banner types
-- Features: title, description, CTA button, inline link, optional property deep-link

CREATE TABLE IF NOT EXISTS banners (
  id              VARCHAR(36)   NOT NULL PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NULL,
  button_text     VARCHAR(100)  NULL,
  button_link     VARCHAR(500)  NULL,
  inline_link_text VARCHAR(150) NULL,
  inline_link_url VARCHAR(500)  NULL,
  property_id     CHAR(36)      NULL,         -- optional direct property deep-link
  background_color VARCHAR(30)  NOT NULL DEFAULT '#1F3A5F',
  text_color      VARCHAR(30)   NOT NULL DEFAULT '#FFFFFF',
  banner_type     ENUM('popup', 'top_bar', 'slide_in') NOT NULL DEFAULT 'popup',
  show_once       TINYINT(1)    NOT NULL DEFAULT 0,   -- 1 = dismiss stored in localStorage
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  valid_from      DATETIME      NULL,
  valid_until     DATETIME      NULL,
  created_by      VARCHAR(36)   NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME      NULL,
  CONSTRAINT fk_banners_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE INDEX idx_banners_active ON banners (is_active, deleted_at, valid_from, valid_until);
