#!/bin/bash
echo "=== Pending change requests ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT pcr.id, pcr.property_id, pcr.status, pcr.created_at,
       LEFT(pcr.requested_changes, 300) as changes_preview,
       p.title
FROM property_change_requests pcr
LEFT JOIN properties p ON pcr.property_id = p.id
ORDER BY pcr.created_at DESC LIMIT 10;
SQL
