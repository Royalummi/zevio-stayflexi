#!/bin/bash
echo "=== Fix original_price for property 70a16431 ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
UPDATE property_pricing SET original_price = 18000 
WHERE property_id = '70a16431-3efa-42e0-9baf-c7b73798b09c';
SQL
echo "Updated. Verify:"
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT original_price, price_per_night FROM property_pricing 
WHERE property_id = '70a16431-3efa-42e0-9baf-c7b73798b09c';
SQL
