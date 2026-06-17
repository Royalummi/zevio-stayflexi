# StayFlexi Pilot Deployment Checklist (H3/H4)

> Use this document when you are ready to activate the first live vendor property on the StayFlexi channel manager in production.

---

## Pre-Requisites (must be complete before any of the steps below)

| #   | Item                                                                                                                               | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | All DB migrations applied on production (run `node scripts/safe-migrate-channel-manager.mjs`)                                      | ☐      |
| 2   | `CHANNEL_MANAGER_PROVIDER_STAYFLEXI_SHARED_SECRET` set in production `.env`                                                        | ☐      |
| 3   | `CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENDPOINT` set in production `.env` (real StayFlexi push URL)                                   | ☐      |
| 4   | `CHANNEL_MANAGER_ALLOWED_IPS` set in production `.env` (StayFlexi egress IP range)                                                 | ☐      |
| 5   | Nginx IP allowlist for `/api/channel-manager/` uncommented and StayFlexi IPs added (`nginx/zevio.conf`)                            | ☐      |
| 6   | PM2 restarted after env changes (`pm2 restart all`)                                                                                | ☐      |
| 7   | StayFlexi technical team has been given the `STAYFLEXI_API_INTEGRATION_GUIDE.md`                                                   | ☐      |
| 8   | StayFlexi team has confirmed their inbound webhook URL is pointing to `https://api.zevio.in/api/channel-manager/stayflexi/webhook` | ☐      |

---

## H3 — Pilot Rollout (First Property)

### Step 1 — Create the Integration Record

1. Log into the Zevio admin panel.
2. Navigate to **CM Integrations** in the sidebar.
3. Click **New Integration** and fill in:
   - Vendor: select the pilot vendor
   - Provider: `stayflexi`
   - Hotel Code: (from StayFlexi — the `HotelCode` for this property)
   - Status: `test` (leave as test until mapping is confirmed working)
4. Save.

### Step 2 — Create the Property Mapping

1. Expand the integration row → click **Add Mapping**.
2. Fill in:
   - Property: select the pilot property
   - External Room Type Code: (from StayFlexi — `RoomTypeCode`)
   - External Rate Plan Code: (optional but recommended — `RatePlanCode`)
3. Leave `is_active = false` for now.
4. Save.

### Step 3 — Run Pre-Activation Dry Run

1. In the mapping row, click **Activate (Dry Run)**.
2. Review the output:
   - Upcoming confirmed bookings on this property (inform StayFlexi of these — they should not be re-created as StayFlexi bookings)
   - Mapping completeness check (must show no missing required fields)
3. If any issues are flagged, resolve them before proceeding.

### Step 4 — Confirm Activation

1. After reviewing the dry run, click **Activate** (confirms the activation).
2. Integration status should be updated to `active`.
3. The vendor's calendar pricing page will now show the StayFlexi rate lock notice.

### Step 5 — Trigger a Test PushBooking

Use the G2 integration test script to verify inbound operations work:

```bash
cd backend
TEST_CM_HOTEL_CODE="<hotel_code>" \
TEST_CM_ROOM_TYPE_CODE="<room_type_code>" \
TEST_CM_RATE_PLAN_CODE="<rate_plan_code>" \
npm run test:cm-inbound
```

Expected: all inbound tests pass (SuccessRS responses).

### Step 6 — Create a Test Booking and Push It

1. Create a test booking (or use an existing confirmed booking) for the pilot property.
2. In the admin panel, go to **Manage Bookings**, find the booking, click **View**.
3. In the booking detail modal, scroll down to **StayFlexi Channel Manager** section.
4. Click **Push to StayFlexi**.
5. Expected: "Push sent successfully" message.

Alternatively, use the API directly:

```bash
curl -X POST https://api.zevio.in/api/admin/channel-manager/push-booking/<bookingId> \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### Step 7 — Monitor Sync Logs for 24h

1. Navigate to **Stayflexi Sync Logs** in the admin sidebar.
2. Monitor for 24 hours:
   - Inbound inventory/rate/restriction updates from StayFlexi should appear as `processed`
   - Outbound PushBooking events should appear as `processed`
   - No `failed` events should persist (retries are automatic, check after 15 minutes)
3. If any events are stuck as `failed`, check the error message in the sync log detail panel.

**Success criteria for H3:**

- At least one inbound rate/inventory sync received from StayFlexi: ✓
- At least one PushBooking sent and acknowledged (HTTP 200 + SuccessRS): ✓
- Zero persistent `failed` events after the retry window: ✓

---

## H4 — Full Rollout

Once H3 pilot is confirmed clean:

### For each additional vendor property:

1. Repeat Steps 1–6 from H3 (create integration + mapping + activate + test push).
2. Notify the StayFlexi team of the new `HotelCode` being activated so they can initialise their side.
3. Monitor sync logs for the first 24h per property.

### Handover Checklist

| #   | Item                                                                           | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 1   | All active vendor properties have `is_active = true` mappings                  | ☐      |
| 2   | All PushBooking retry failures are zero                                        | ☐      |
| 3   | StayFlexi team has confirmed they are receiving inventory/rate updates         | ☐      |
| 4   | Admin team knows how to use the "Push to StayFlexi" button for troubleshooting | ☐      |
| 5   | Admin team knows how to use the Deactivate button for emergency rollback       | ☐      |
| 6   | `STAYFLEXI_API_INTEGRATION_GUIDE.md` delivered to StayFlexi technical team     | ☐      |
| 7   | Pilot monitoring log archived (copy sync log export for first 7 days)          | ☐      |

---

## Emergency Rollback (any time)

If something goes wrong for a property:

1. Admin panel → **CM Integrations** → find the property mapping → click **Deactivate**.
2. This immediately sets `is_active = false` and removes all StayFlexi-sourced blackouts.
3. The property reverts to Zevio-native mode. No guest-facing impact.
4. Contact StayFlexi technical team to pause their sync for this property.

---

## Useful Commands

```bash
# Check outbound readiness before going live
npm run check:cm-outbound-readiness

# Run full inbound integration test
npm run test:cm-inbound

# Run sync log smoke tests
npm run test:cm-sync-logs

# Run booking regression test (verifies existing Zevio booking flow unaffected)
npm run test:booking-regression

# Trigger retry worker once (for stuck failed events)
npm run retry:cm-outbound

# Run outbound validation with mock endpoint
npm run run:cm-outbound-validation:mock
```

---

## Contacts

| Role                     | Contact              |
| ------------------------ | -------------------- |
| StayFlexi technical team | _(add contact here)_ |
| Zevio lead developer     | _(add contact here)_ |
| Zevio admin ops          | _(add contact here)_ |
