-- Session 42: Populate all properties with area and maps_location
-- Created: February 2, 2026
-- Purpose: Add realistic area names and Google Maps coordinates for all properties

-- VILLAS (Villa Type Properties)

-- Goa Villas
UPDATE properties 
SET 
  area = 'Candolim',
  maps_location = 'https://www.google.com/maps?q=15.5183,73.7615'
WHERE id = 'bb927936-e418-11f0-9f30-00410e2b5e6e'; -- Luxury Beach Villa - Goa

UPDATE properties 
SET 
  area = 'Anjuna',
  maps_location = 'https://www.google.com/maps?q=15.5739,73.7400'
WHERE id = 'bb929607-e418-11f0-9f30-00410e2b5e6e'; -- Cozy Cottage - North Goa

UPDATE properties 
SET 
  area = 'Candolim',
  maps_location = 'https://www.google.com/maps?q=15.5191,73.7621'
WHERE id = 'bb9298e7-e418-11f0-9f30-00410e2b5e6e'; -- Premium Villa with Pool - Candolim

-- Lonavala/Maharashtra Villas
UPDATE properties 
SET 
  area = 'Tiger Point',
  maps_location = 'https://www.google.com/maps?q=18.7469,73.4088'
WHERE id = 'bb9739d5-e418-11f0-9f30-00410e2b5e6e'; -- Hill View Villa - Lonavala

UPDATE properties 
SET 
  area = 'Khandala',
  maps_location = 'https://www.google.com/maps?q=18.7461,73.3808'
WHERE id = 'bb974859-e418-11f0-9f30-00410e2b5e6e'; -- Luxury Farm Villa - Khandala

-- Alibaug Villas
UPDATE properties 
SET 
  area = 'Alibaug Beach',
  maps_location = 'https://www.google.com/maps?q=18.6414,72.8722'
WHERE id = 'bb9b250d-e418-11f0-9f30-00410e2b5e6e'; -- Beach Villa - Alibaug

UPDATE properties 
SET 
  area = 'Varsoli',
  maps_location = 'https://www.google.com/maps?q=18.6321,72.8901'
WHERE id = 'bb9b3625-e418-11f0-9f30-00410e2b5e6e'; -- Riverside Cottage - Alibaug

-- Jaipur Villas
UPDATE properties 
SET 
  area = 'Heritage Street',
  maps_location = 'https://www.google.com/maps?q=26.9124,75.7873'
WHERE id = 'bb9fb45f-e418-11f0-9f30-00410e2b5e6e'; -- Heritage Haveli - Jaipur

UPDATE properties 
SET 
  area = 'Pink City',
  maps_location = 'https://www.google.com/maps?q=26.9154,75.8189'
WHERE id = 'bb9fca40-e418-11f0-9f30-00410e2b5e6e'; -- Royal Villa - Pink City

-- Manali Villas
UPDATE properties 
SET 
  area = 'Old Manali',
  maps_location = 'https://www.google.com/maps?q=32.2432,77.1892'
WHERE id = 'bba49bf2-e418-11f0-9f30-00410e2b5e6e'; -- Mountain View Villa - Manali

UPDATE properties 
SET 
  area = 'Old Manali',
  maps_location = 'https://www.google.com/maps?q=32.2455,77.1871'
WHERE id = 'bba4ada9-e418-11f0-9f30-00410e2b5e6e'; -- Alpine Retreat - Old Manali

-- SERVICE APARTMENTS (Service Apartment Type Properties)

-- Bangalore Service Apartments
UPDATE properties 
SET 
  area = 'Koramangala',
  maps_location = 'https://www.google.com/maps?q=12.9352,77.6245'
WHERE id = '27c960ac-f31f-11f0-8f27-00410e2b5e6e'; -- Modern 2BHK Service Apartment - Koramangala

UPDATE properties 
SET 
  area = 'Whitefield',
  maps_location = 'https://www.google.com/maps?q=12.9698,77.7499'
WHERE id = '495ba81d-f31f-11f0-8f27-00410e2b5e6e'; -- Luxury 3BHK Service Apartment - Whitefield

-- Mumbai Service Apartments
UPDATE properties 
SET 
  area = 'Andheri East',
  maps_location = 'https://www.google.com/maps?q=19.1136,72.8697'
WHERE id = '495ca2b2-f31f-11f0-8f27-00410e2b5e6e'; -- Compact 1BHK Service Apartment - Andheri East

UPDATE properties 
SET 
  area = 'BKC',
  maps_location = 'https://www.google.com/maps?q=19.0596,72.8656'
WHERE id = '495cf369-f31f-11f0-8f27-00410e2b5e6e'; -- Premium 2BHK Service Apartment - BKC

-- Delhi NCR Service Apartments
UPDATE properties 
SET 
  area = 'Connaught Place',
  maps_location = 'https://www.google.com/maps?q=28.6304,77.2177'
WHERE id = '495d4419-f31f-11f0-8f27-00410e2b5e6e'; -- Corporate 2BHK Service Apartment - Connaught Place

UPDATE properties 
SET 
  area = 'Cyber City',
  maps_location = 'https://www.google.com/maps?q=28.4950,77.0890'
WHERE id = '495d9161-f31f-11f0-8f27-00410e2b5e6e'; -- Luxury 3BHK Service Apartment - Cyber City Gurgaon

-- Verify all updates
SELECT 
  id,
  title,
  COALESCE(area, 'NOT SET') as area,
  COALESCE(maps_location, 'NOT SET') as maps_location,
  status
FROM properties
ORDER BY property_type_id, title;
