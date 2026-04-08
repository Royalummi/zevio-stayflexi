#!/bin/bash
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production <<'SQL'
SELECT pp.original_price, pp.price_per_night 
FROM property_pricing pp 
WHERE pp.property_id = '70a16431-3efa-42e0-9baf-c7b73798b09c';
SQL
