-- Phase 1 (Plan B): Multi-channel manager foundation (XML-first)
-- Additive migration only: does not remove or rewrite existing flow.

CREATE TABLE IF NOT EXISTS channel_manager_integrations (
  id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  provider_key VARCHAR(50) NOT NULL,
  external_hotel_id VARCHAR(120) NOT NULL,
  credentials_json LONGTEXT DEFAULT NULL,
  sync_mode ENUM('pull','push','bi_directional') NOT NULL DEFAULT 'bi_directional',
  status ENUM('active','inactive','test') NOT NULL DEFAULT 'test',
  last_successful_sync_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cm_provider_hotel (provider_key, external_hotel_id),
  KEY idx_cm_vendor (vendor_id),
  KEY idx_cm_provider_status (provider_key, status),
  CONSTRAINT fk_cm_integration_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS channel_manager_property_mappings (
  id CHAR(36) NOT NULL,
  integration_id CHAR(36) NOT NULL,
  property_id CHAR(36) NOT NULL,
  external_property_id VARCHAR(120) NOT NULL,
  external_room_type_id VARCHAR(120) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cm_mapping_integration_property (integration_id, property_id),
  UNIQUE KEY uq_cm_mapping_integration_external (integration_id, external_property_id),
  KEY idx_cm_mapping_property (property_id),
  CONSTRAINT fk_cm_mapping_integration FOREIGN KEY (integration_id) REFERENCES channel_manager_integrations (id),
  CONSTRAINT fk_cm_mapping_property FOREIGN KEY (property_id) REFERENCES properties (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS channel_manager_webhook_events (
  id CHAR(36) NOT NULL,
  integration_id CHAR(36) DEFAULT NULL,
  provider_key VARCHAR(50) NOT NULL,
  external_event_id VARCHAR(120) DEFAULT NULL,
  event_type VARCHAR(120) NOT NULL,
  xml_payload LONGTEXT NOT NULL,
  parsed_payload LONGTEXT DEFAULT NULL,
  processing_status ENUM('received','processed','failed','ignored') NOT NULL DEFAULT 'received',
  error_message TEXT DEFAULT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cm_external_event (provider_key, external_event_id),
  KEY idx_cm_event_status (processing_status, received_at),
  KEY idx_cm_event_provider (provider_key),
  KEY idx_cm_event_integration (integration_id),
  CONSTRAINT fk_cm_event_integration FOREIGN KEY (integration_id) REFERENCES channel_manager_integrations (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

ALTER TABLE bookings
  ADD COLUMN booking_source ENUM('direct','channel_manager') NOT NULL DEFAULT 'direct' AFTER payment_status,
  ADD COLUMN source_provider_key VARCHAR(50) DEFAULT NULL AFTER booking_source,
  ADD COLUMN source_reference_id VARCHAR(120) DEFAULT NULL AFTER source_provider_key,
  ADD COLUMN source_payload LONGTEXT DEFAULT NULL AFTER source_reference_id,
  ADD KEY idx_bookings_source (booking_source, source_provider_key),
  ADD UNIQUE KEY uq_booking_provider_reference (source_provider_key, source_reference_id);

ALTER TABLE property_blackout_dates
  ADD COLUMN blackout_source ENUM('manual','channel_manager') NOT NULL DEFAULT 'manual' AFTER reason,
  ADD COLUMN source_provider_key VARCHAR(50) DEFAULT NULL AFTER blackout_source,
  ADD COLUMN source_reference_id VARCHAR(120) DEFAULT NULL AFTER source_provider_key,
  ADD KEY idx_blackout_source_provider (blackout_source, source_provider_key),
  ADD UNIQUE KEY uq_blackout_provider_reference (source_provider_key, source_reference_id);
