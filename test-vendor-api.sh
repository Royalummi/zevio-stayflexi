#!/bin/bash
# Test vendor property creation API
LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"harsha718gowda@gmail.com","password":"Test@1234","role":"vendor"}')

echo "LOGIN RESPONSE: $LOGIN"

TOKEN=$(echo $LOGIN | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("data",{}).get("accessToken",""))')
echo "TOKEN (first 40): ${TOKEN:0:40}"

if [ -z "$TOKEN" ]; then
  echo "LOGIN FAILED - trying isak simpson"
  LOGIN2=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' \
    --data-raw '{"email":"isaksimpson@gmail.com","password":"Test@1234","role":"vendor"}')
  echo "LOGIN2: $LOGIN2"
  TOKEN=$(echo $LOGIN2 | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("data",{}).get("accessToken",""))')
  echo "TOKEN2 (first 40): ${TOKEN:0:40}"
fi

if [ -z "$TOKEN" ]; then
  echo "CANNOT GET TOKEN - exiting"
  exit 1
fi

echo ""
echo "--- Testing POST /api/vendor/properties ---"
RESULT=$(curl -s -X POST http://localhost:5000/api/vendor/properties \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data-raw '{"city_id":"0d28b18d-960f-46a9-a12d-25bff6ad9f71","property_type_id":"pt-001","title":"Vendor API Test Property","bedrooms":2,"bathrooms":1,"max_guests":4,"price_per_night":3000,"primary_incharge_name":"TestOwner","primary_incharge_phone":"9876543210"}')

echo "RESULT: $RESULT"

PROP_ID=$(echo $RESULT | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("data",{}).get("id",""))' 2>/dev/null)
echo "CREATED PROPERTY ID: $PROP_ID"

if [ -n "$PROP_ID" ]; then
  echo ""
  echo "--- Checking property_contacts for new property ---"
  mysql -uzevio_app '-pZevioDb@2026!' zevio_production -e "SELECT property_id, contact_type_id, name, phone FROM property_contacts WHERE property_id='$PROP_ID'"
fi
