#!/bin/bash
# Test script for API endpoints

API="https://api.zevio.in"

echo "=== 1. ADMIN LOGIN ==="
ADMIN_RESP=$(curl -s -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zevio.com","password":"admin123"}')

echo "$ADMIN_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    print('SUCCESS - role:', d['data']['user']['role'])
    at = d['data']['accessToken']
    rt = d['data']['refreshToken']
    open('/tmp/admin_at.txt','w').write(at)
    open('/tmp/admin_rt.txt','w').write(rt)
    print('accessToken saved (', len(at), 'chars)')
    print('refreshToken saved (', len(rt), 'chars)')
else:
    print('FAILED:', d.get('message'))
"

echo ""
echo "=== 2. REFRESH TOKEN TEST ==="
ADMIN_RT=$(cat /tmp/admin_rt.txt 2>/dev/null)
if [ -n "$ADMIN_RT" ]; then
    REFRESH_RESP=$(curl -s -X POST "$API/api/auth/refresh" \
      -H 'Content-Type: application/json' \
      -d "{\"refreshToken\":\"$ADMIN_RT\"}")
    
    echo "$REFRESH_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    new_at = d['data']['accessToken']
    new_rt = d['data'].get('refreshToken', '')
    print('REFRESH SUCCESS')
    print('New accessToken:', len(new_at), 'chars')
    print('New refreshToken:', len(new_rt), 'chars' if new_rt else 'NOT RETURNED!')
    open('/tmp/admin_at.txt','w').write(new_at)
    if new_rt:
        open('/tmp/admin_rt.txt','w').write(new_rt)
else:
    print('REFRESH FAILED:', d.get('message'))
"
    
    echo ""
    echo "=== 3. DOUBLE REFRESH (old token should be revoked) ==="
    OLD_RT_RESP=$(curl -s -X POST "$API/api/auth/refresh" \
      -H 'Content-Type: application/json' \
      -d "{\"refreshToken\":\"$ADMIN_RT\"}")
    echo "$OLD_RT_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    print('WARNING: Old token still works (rotation NOT working)')
else:
    print('CORRECT: Old token revoked -', d.get('message'))
"
    
    echo ""
    echo "=== 4. USE NEW TOKEN FOR REFRESH ==="
    NEW_RT=$(cat /tmp/admin_rt.txt 2>/dev/null)
    NEW_REFRESH_RESP=$(curl -s -X POST "$API/api/auth/refresh" \
      -H 'Content-Type: application/json' \
      -d "{\"refreshToken\":\"$NEW_RT\"}")
    echo "$NEW_REFRESH_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    print('SUCCESS: New refresh token works correctly')
    open('/tmp/admin_at.txt','w').write(d['data']['accessToken'])
    if d['data'].get('refreshToken'):
        open('/tmp/admin_rt.txt','w').write(d['data']['refreshToken'])
else:
    print('FAILED:', d.get('message'))
"
fi

echo ""
echo "=== 5. VENDOR LOGIN ==="
VENDOR_RESP=$(curl -s -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"kruthiksatish9@gmail.com","password":"vendor123"}')

echo "$VENDOR_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    print('VENDOR LOGIN SUCCESS - role:', d['data']['user']['role'])
    open('/tmp/vendor_at.txt','w').write(d['data']['accessToken'])
    open('/tmp/vendor_rt.txt','w').write(d['data']['refreshToken'])
else:
    print('VENDOR LOGIN FAILED:', d.get('message'))
"

echo ""
echo "=== 6. TEST ADMIN AUTHENTICATED ENDPOINTS ==="
ADMIN_AT=$(cat /tmp/admin_at.txt 2>/dev/null)
if [ -n "$ADMIN_AT" ]; then
    echo "--- Admin Properties ---"
    curl -s -o /dev/null -w "GET /api/admin/properties: %{http_code}\n" \
      "$API/api/admin/properties" \
      -H "Authorization: Bearer $ADMIN_AT"
    
    echo "--- Admin Banners ---"
    curl -s -o /dev/null -w "GET /api/admin/banners: %{http_code}\n" \
      "$API/api/admin/banners" \
      -H "Authorization: Bearer $ADMIN_AT"
    
    echo "--- Admin Reviews ---"
    curl -s -o /dev/null -w "GET /api/admin/reviews: %{http_code}\n" \
      "$API/api/admin/reviews" \
      -H "Authorization: Bearer $ADMIN_AT"
    
    echo "--- Admin Coupons ---"
    curl -s -o /dev/null -w "GET /api/admin/coupons: %{http_code}\n" \
      "$API/api/admin/coupons" \
      -H "Authorization: Bearer $ADMIN_AT"
fi

echo ""
echo "=== 7. TEST VENDOR AUTHENTICATED ENDPOINTS ==="
VENDOR_AT=$(cat /tmp/vendor_at.txt 2>/dev/null)
if [ -n "$VENDOR_AT" ]; then
    echo "--- Vendor Properties ---"
    curl -s -o /dev/null -w "GET /api/vendor/properties: %{http_code}\n" \
      "$API/api/vendor/properties" \
      -H "Authorization: Bearer $VENDOR_AT"
fi

echo ""
echo "=== 8. ADMIN GET PROPERTY DETAILS (check original_price) ==="
if [ -n "$ADMIN_AT" ]; then
    PROP_RESP=$(curl -s "$API/api/admin/properties" \
      -H "Authorization: Bearer $ADMIN_AT")
    
    echo "$PROP_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    props = d['data']['properties'] if isinstance(d['data'], dict) else d['data']
    print('Total properties loaded:', len(props))
    for p in props[:3]:
        print(f\"  {p['title']}: price={p.get('price_per_night')}, original_price={p.get('original_price')}, status={p.get('status')}\")
else:
    print('FAILED:', d.get('message'))
" 2>&1
fi

echo ""
echo "=== 9. DB REFRESH TOKEN COUNT ==="
mysql -u zevio_app -p'ZevioDb@2026!' zevio_production -e "SELECT COUNT(*) as active_tokens FROM refresh_tokens WHERE expires_at > NOW();" 2>&1 | grep -v Warning

echo ""
echo "=== TESTS COMPLETE ==="
