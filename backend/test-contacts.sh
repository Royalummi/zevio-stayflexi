#!/bin/bash
echo "=== Property Contacts ==="
mysql -uzevio_app -pZevioDb@2026! zevio_production -e "SELECT pc.id, pc.property_id, pc.contact_type_id, pc.name, pc.phone, pc.email, pc.whatsapp, pc.alt_contact, pc.is_active FROM property_contacts pc LIMIT 20;" 2>&1

echo ""
echo "=== Contact Types ==="
mysql -uzevio_app -pZevioDb@2026! zevio_production -e "SELECT * FROM contact_types;" 2>&1

echo ""
echo "=== Properties with contacts ==="
mysql -uzevio_app -pZevioDb@2026! zevio_production -e "SELECT p.id, p.title, COUNT(pc.id) as contact_count FROM properties p LEFT JOIN property_contacts pc ON p.id = pc.property_id GROUP BY p.id HAVING contact_count > 0 LIMIT 10;" 2>&1
