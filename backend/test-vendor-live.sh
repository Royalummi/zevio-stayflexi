#!/bin/bash
set -e

API="https://api.zevio.in/api"

echo "=== 1. Vendor Login ==="
LOGIN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"email":"vendor2@example.com","password":"Test@1234"}')
TOKEN=$(echo "$LOGIN" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("data",{}).get("accessToken",""))')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "None" ]; then
  echo "FAIL: No token"
  echo "$LOGIN"
  exit 1
fi
echo "PASS: Login OK (token length: ${#TOKEN})"

echo ""
echo "=== 2. Get Vendor Properties ==="
PROPS=$(curl -s "$API/vendor/properties" -H "Authorization: Bearer $TOKEN")
echo "$PROPS" | python3 -c '
import json,sys
d=json.load(sys.stdin)
props=d.get("data",{}).get("properties",[])
print("Found %d properties" % len(props))
for p in props:
    pid=p.get("id","")[:8]
    st=p.get("status")
    pr=p.get("price_per_night")
    op=p.get("original_price")
    print("  - %s.. status=%s price=%s original_price=%s" % (pid,st,pr,op))
'

echo ""
echo "=== 3. Test Image Route Exists ==="
FIRST_ID=$(echo "$PROPS" | python3 -c 'import json,sys; d=json.load(sys.stdin); ps=d.get("data",{}).get("properties",[]); print(ps[0]["id"] if ps else "")')
if [ -n "$FIRST_ID" ]; then
  IMG=$(curl -s "$API/vendor/properties/$FIRST_ID/images" -H "Authorization: Bearer $TOKEN")
  echo "$IMG" | python3 -c '
import json,sys
d=json.load(sys.stdin)
if d.get("success"):
    data=d.get("data",d)
    if isinstance(data, list):
        print("PASS: Image route works, %d images found" % len(data))
    elif isinstance(data, dict) and "images" in data:
        print("PASS: Image route works, %d images found" % len(data["images"]))
    else:
        print("PASS: Image route works, response: %s" % str(d)[:200])
else:
    print("Image route response: %s" % json.dumps(d)[:200])
'
else
  echo "No properties to test images on"
fi

echo ""
echo "=== 4. Test Submit Route ==="
if [ -n "$FIRST_ID" ]; then
  SUB=$(curl -s -X POST "$API/vendor/properties/$FIRST_ID/submit" -H "Authorization: Bearer $TOKEN")
  echo "$SUB" | python3 -c '
import json,sys
d=json.load(sys.stdin)
print("Submit result: success=%s message=%s" % (d.get("success"), d.get("message")))
'
fi

echo ""
echo "=== ALL TESTS COMPLETE ==="
