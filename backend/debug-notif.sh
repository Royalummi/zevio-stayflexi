#!/bin/bash
echo "=== All admins ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, email, role, status FROM admins WHERE deleted_at IS NULL;
SQL

echo ""
echo "=== All notifications ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT id, recipient_id, recipient_role, title, LEFT(message,80) as message, is_read, created_at 
FROM notifications ORDER BY created_at DESC LIMIT 20;
SQL
