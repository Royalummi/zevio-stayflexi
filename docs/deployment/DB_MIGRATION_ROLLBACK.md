# H2 — Database Migration Rollback Plan

## Overview

The StayFlexi channel manager integration introduced two numbered migrations:

| #    | File                                             | Changes                                                                                  |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 0054 | `0054_add_channel_manager_foundation.sql`        | New tables (×3); ALTER bookings (×4 columns); ALTER property_blackout_dates (×3 columns) |
| 0055 | `0055_create_channel_manager_daily_controls.sql` | New table (×1)                                                                           |

All rollback steps are **destructive** — they delete tables and columns. Run them only if you need to fully undo the integration. Read each step carefully before executing.

---

## Pre-rollback checklist

Before running any rollback SQL:

- [ ] Take a full database dump: `mysqldump -u root -p zevio_db > /tmp/pre-rollback-$(date +%Y%m%d%H%M%S).sql`
- [ ] Stop the backend process: `pm2 stop backend`
- [ ] Confirm no active bookings came from a channel manager (`SELECT COUNT(*) FROM bookings WHERE booking_source = 'channel_manager'`). Decide whether to convert them to `direct` first.
- [ ] Confirm no channel manager blackout dates remain active (`SELECT COUNT(*) FROM property_blackout_dates WHERE blackout_source = 'channel_manager'`). Decide whether to delete or convert them first.

---

## Step 1 — Roll back migration 0055

```sql
-- 0055 rollback: drop channel_manager_daily_controls
-- No foreign keys reference this table, so it can be dropped safely.

DROP TABLE IF EXISTS channel_manager_daily_controls;
```

---

## Step 2 — Roll back migration 0054

The tables must be dropped in reverse dependency order (child → parent) because of foreign keys.

```sql
-- ── 2a. Drop tables added in 0054 (child tables first) ──────────────────────

-- channel_manager_webhook_events references channel_manager_integrations
DROP TABLE IF EXISTS channel_manager_webhook_events;

-- channel_manager_property_mappings references channel_manager_integrations
DROP TABLE IF EXISTS channel_manager_property_mappings;

-- channel_manager_integrations has no dependencies on other new tables
DROP TABLE IF EXISTS channel_manager_integrations;


-- ── 2b. Remove columns added to property_blackout_dates ─────────────────────
-- Safe to run even if rows with blackout_source='channel_manager' still exist,
-- but see pre-rollback checklist above.

ALTER TABLE property_blackout_dates
  DROP KEY IF EXISTS idx_blackout_source_provider,
  DROP KEY IF EXISTS uq_blackout_provider_reference;

ALTER TABLE property_blackout_dates
  DROP COLUMN IF EXISTS source_reference_id,
  DROP COLUMN IF EXISTS source_provider_key,
  DROP COLUMN IF EXISTS blackout_source;


-- ── 2c. Remove columns added to bookings ────────────────────────────────────
-- Convert any channel_manager bookings to 'direct' first if needed:
--   UPDATE bookings SET booking_source = 'direct' WHERE booking_source = 'channel_manager';

ALTER TABLE bookings
  DROP KEY IF EXISTS idx_bookings_source,
  DROP KEY IF EXISTS uq_booking_provider_reference;

ALTER TABLE bookings
  DROP COLUMN IF EXISTS source_payload,
  DROP COLUMN IF EXISTS source_reference_id,
  DROP COLUMN IF EXISTS source_provider_key,
  DROP COLUMN IF EXISTS booking_source;
```

---

## Partial rollback — disable without dropping

If you want to temporarily disable the channel manager without touching the database schema, set the following env vars in `ecosystem.config.cjs` (or the VPS `.env`) and reload PM2:

```env
CHANNEL_MANAGER_ENABLED=false
CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENABLED=false
CHANNEL_MANAGER_PROVIDER_STAYFLEXI_OUTBOUND_ENABLED=false
```

Then reload: `pm2 reload backend --update-env`

This stops all inbound webhook processing and outbound PushBooking pushes without modifying the schema.

---

## Re-applying the migrations

To re-apply after rollback, run the migration files in order:

```bash
mysql -u root -p zevio_db < backend/migrations/0054_add_channel_manager_foundation.sql
mysql -u root -p zevio_db < backend/migrations/0055_create_channel_manager_daily_controls.sql
```

---

## Notes

- The `channel_manager_outbound_sync_logs` table (used internally by the outbound service) is created lazily at runtime via `CREATE TABLE IF NOT EXISTS` in `channelManagerOutboundService.js`. Its rollback SQL is:
  ```sql
  DROP TABLE IF EXISTS channel_manager_outbound_sync_logs;
  ```
- Retry worker state is stored in the `channel_manager_outbound_sync_logs` table; dropping it also removes all retry history.
