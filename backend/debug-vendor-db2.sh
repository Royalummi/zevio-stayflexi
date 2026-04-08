#!/bin/bash
echo "=== Property 53e1a8dd check ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, title, status, JSON_LENGTH(photos) as photo_count, LENGTH(photos) as photos_bytes, created_at 
FROM properties WHERE id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL

echo ""
echo "=== ALL vendor properties (newest first) ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, SUBSTRING(title,1,40) as title, status, JSON_LENGTH(photos) as photo_count, created_at 
FROM properties 
WHERE vendor_id = 'bb6097e5-e418-11f0-9f30-00410e2b5e6e' AND deleted_at IS NULL
ORDER BY created_at DESC LIMIT 10;
SQL

echo ""
echo "=== Photos preview for 53e1a8dd ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT LEFT(photos, 300) as photos_preview FROM properties WHERE id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL

echo ""
echo "=== Pricing for 53e1a8dd ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, price_per_night, original_price FROM property_pricing WHERE property_id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL

echo ""
echo "=== Check frontend build timestamp ==="
ls -la /var/www/zevio/frontend/dist/assets/index-*.js | head -3
