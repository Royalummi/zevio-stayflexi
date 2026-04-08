#!/bin/bash
echo "=== Properties created after the fix deploy (21:54 Apr 8) ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, LEFT(title,30) as title, status, created_at 
FROM properties 
WHERE created_at > '2026-04-08 21:54:00' 
ORDER BY created_at DESC LIMIT 10;
SQL

echo ""
echo "=== Fix the draft property 53e1a8dd - submit it now ==="
echo "(First check current status)"
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, status, JSON_LENGTH(photos) as photo_count, deleted_at 
FROM properties WHERE id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL

echo ""
echo "=== Clean corrupted photo entries from 53e1a8dd ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
UPDATE properties 
SET photos = (
  SELECT JSON_ARRAYAGG(val) FROM (
    SELECT j.val FROM properties p, 
    JSON_TABLE(p.photos, '$[*]' COLUMNS(val VARCHAR(500) PATH '$')) j
    WHERE p.id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05' 
    AND j.val LIKE 'https://%'
  ) clean
)
WHERE id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL

echo ""
echo "=== After cleanup ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, status, JSON_LENGTH(photos) as photo_count, LEFT(photos, 200) as preview
FROM properties WHERE id = '53e1a8dd-4cd5-4e70-801d-f27ca03c5a05';
SQL
