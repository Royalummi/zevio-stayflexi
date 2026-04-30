-- Mark sample properties as recommended for testing
-- 4 Villas (pt-001) and 4 Service Apartments (pt-002)

USE zevio;

-- VILLAS (pt-001) - 4 properties with priorities 4, 3, 2, 1 (higher first)
UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 4,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = 'bb927936-e418-11f0-9f30-00410e2b5e6e' AND property_type_id = 'pt-001';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 3,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = 'bb929607-e418-11f0-9f30-00410e2b5e6e' AND property_type_id = 'pt-001';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 2,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = 'bb9298e7-e418-11f0-9f30-00410e2b5e6e' AND property_type_id = 'pt-001';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 1,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = 'bb9739d5-e418-11f0-9f30-00410e2b5e6e' AND property_type_id = 'pt-001';

-- SERVICE APARTMENTS (pt-002) - 4 properties with priorities 4, 3, 2, 1
UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 4,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = '27c960ac-f31f-11f0-8f27-00410e2b5e6e' AND property_type_id = 'pt-002';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 3,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = '495ba81d-f31f-11f0-8f27-00410e2b5e6e' AND property_type_id = 'pt-002';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 2,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = '495ca2b2-f31f-11f0-8f27-00410e2b5e6e' AND property_type_id = 'pt-002';

UPDATE properties 
SET is_recommended = 1,
    recommended_priority = 1,
    recommended_at = NOW(),
    recommended_by = 'bb5898f8-e418-11f0-9f30-00410e2b5e6e'
WHERE id = '495cf369-f31f-11f0-8f27-00410e2b5e6e' AND property_type_id = 'pt-002';

-- Verify the updates
SELECT 
    p.id,
    p.title,
    pt.name as property_type,
    p.is_recommended,
    p.recommended_priority,
    a.name as recommended_by_name
FROM properties p
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN admins a ON p.recommended_by = a.id
WHERE p.is_recommended = 1
ORDER BY p.property_type_id, p.recommended_priority DESC;
