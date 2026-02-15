# 🔐 Vendor Test Credentials

## Test Vendor Accounts

### Vendor 1 - Luxury Villas Pvt Ltd

```
Email: vendor1@example.com
Password: password123
```

### Vendor 2 - Beach Resorts Group

```
Email: vendor2@example.com
Password: password123
```

### Vendor 3 - Mountain Retreats

```
Email: vendor3@example.com
Password: password123
```

---

## How to Login as Vendor

1. **Go to Login Page:** http://localhost:3000/login
2. **Enter credentials:**
   - Email: `vendor1@example.com`
   - Password: `password123`
3. **You'll be redirected to:** `/vendor/dashboard`

---

## Vendor Dashboard Access

After logging in, you can access:

- **Dashboard:** `/vendor/dashboard` - Overview stats
- **Properties:** `/vendor/properties` - Manage properties
- **Bookings:** `/vendor/bookings` - View bookings
- **Settlements:** `/vendor/settlements` - Track payments
- **Analytics:** `/vendor/analytics` - Performance metrics
- **Profile:** `/vendor/profile` - Update profile

---

## Database Update Required

Run this SQL to update vendor passwords:

```sql
UPDATE vendors
SET password_hash = '$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW'
WHERE email IN ('vendor1@example.com', 'vendor2@example.com', 'vendor3@example.com');
```

**Note:** This sets all test vendor passwords to `password123`

---

## Testing Workflow

**1. Login Test:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor1@example.com","password":"password123"}'
```

**2. Dashboard Test (with token from login):**

```bash
curl -X GET http://localhost:5000/api/vendor/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Created:** February 15, 2026  
**Purpose:** Testing vendor authentication and dashboard access
