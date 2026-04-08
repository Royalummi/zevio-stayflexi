#!/bin/bash
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, title, status, JSON_LENGTH(photos) as photo_count, created_at 
FROM properties 
WHERE vendor_id = 'bb6097e5-e418-11f0-9f30-00410e2b5e6e' 
ORDER BY created_at DESC LIMIT 10;
SQL

echo ""
echo "=== Check property_pricing for latest drafts ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT p.id, p.title, p.status, pp.id as pricing_id, pp.price_per_night, pp.original_price
FROM properties p 
LEFT JOIN property_pricing pp ON p.id = pp.property_id
WHERE p.vendor_id = 'bb6097e5-e418-11f0-9f30-00410e2b5e6e' 
ORDER BY p.created_at DESC LIMIT 10;
SQL

echo ""
echo "=== Check photos column for latest property ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, title, status, LEFT(photos, 200) as photos_preview, LENGTH(photos) as photos_json_len
FROM properties 
WHERE vendor_id = 'bb6097e5-e418-11f0-9f30-00410e2b5e6e' 
ORDER BY created_at DESC LIMIT 5;
SQL
