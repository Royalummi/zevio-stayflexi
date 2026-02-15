-- Migration: Add incharge contact fields to properties table
-- Date: 2026-02-15
-- Session: 56.7 Bug Fixes - Property Update Issue Resolution

USE zevio;

-- Add primary incharge contact fields
ALTER TABLE properties
ADD COLUMN primary_incharge_name VARCHAR(150) NULL AFTER employee_id,
ADD COLUMN primary_incharge_phone VARCHAR(20) NULL AFTER primary_incharge_name,
ADD COLUMN primary_incharge_email VARCHAR(150) NULL AFTER primary_incharge_phone,
ADD COLUMN primary_incharge_whatsapp VARCHAR(20) NULL AFTER primary_incharge_email,
ADD COLUMN primary_incharge_alt_contact VARCHAR(20) NULL AFTER primary_incharge_whatsapp;

-- Add secondary incharge contact fields
ALTER TABLE properties
ADD COLUMN secondary_incharge_name VARCHAR(150) NULL AFTER primary_incharge_alt_contact,
ADD COLUMN secondary_incharge_phone VARCHAR(20) NULL AFTER secondary_incharge_name,
ADD COLUMN secondary_incharge_email VARCHAR(150) NULL AFTER secondary_incharge_phone,
ADD COLUMN secondary_incharge_whatsapp VARCHAR(20) NULL AFTER secondary_incharge_email,
ADD COLUMN secondaryincharge_alt_contact VARCHAR(20) NULL AFTER secondary_incharge_whatsapp;

 -- Verify changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zevio' 
AND TABLE_NAME = 'properties' 
AND COLUMN_NAME LIKE '%incharge%'
ORDER BY ORDINAL_POSITION;

