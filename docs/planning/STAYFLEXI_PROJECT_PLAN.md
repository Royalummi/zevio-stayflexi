# StayFlexi XML Integration — Project Plan & Timeline

### Zevio x StayFlexi | Client Quotation Document

> Prepared: April 23, 2026
> Updated: April 24, 2026
> Version: 3.0
> Scope: XML-Only Integration (7 Inbound + 1 Outbound API) + Parallel Launch Strategy
> Based On: STAYFLEXI_XML_INTEGRATION_PLAN.md

---

## Executive Summary

This document outlines the full scope of work, phase-by-phase breakdown, time estimates, and delivery timeline for the StayFlexi XML integration into Zevio. The integration enables real-time two-way synchronization of room inventory, rates, and restrictions between Zevio and the StayFlexi OTA channel manager.

**Recommended Strategy: Parallel Launch**
Zevio goes to market and onboards vendors immediately. StayFlexi XML integration is built in parallel and activated per vendor only when ready. These are two independent tracks — market launch does not depend on StayFlexi, and StayFlexi integration does not block the market launch.

**Total Estimated Effort: 40.5 working days** (includes 5.5 additional days for transition safeguards)
**Total Calendar Duration: 8 weeks** (one developer, running parallel to market activity)

---

## Scope Summary

| Category                           | Count                       |
| ---------------------------------- | --------------------------- |
| New XML API Endpoints (inbound)    | 7                           |
| New XML API Calls (outbound)       | 1                           |
| New Database Tables                | 4                           |
| Existing Tables Modified           | 1 (bookings)                |
| New Backend Source Files           | 6                           |
| Existing Backend Files Modified    | 2                           |
| New Admin UI Screens               | 2                           |
| Existing Frontend Screens Modified | 1 (vendor calendar pricing) |
| Test Suites                        | 3                           |

---

## Work Breakdown by Category

### A) Database Layer

| Task      | Description                                                                                                                                                                      | Days         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| A1        | Create `stayflexi_property_mapping` table (includes `is_active` flag to control per-vendor activation)                                                                           | 0.5          |
| A2        | Create `stayflexi_bookings` table                                                                                                                                                | 0.5          |
| A3        | Create `stayflexi_sync_log` table                                                                                                                                                | 0.5          |
| A4        | Create `stayflexi_restrictions` table                                                                                                                                            | 0.5          |
| A5        | Alter `bookings` table — add `booking_source` ENUM('zevio','stayflexi_ota') DEFAULT 'zevio' and `sf_push_booking_id`. All existing records automatically default to 'zevio'.     | 0.5          |
| A6        | Alter `property_blackout_dates` — add `blackout_source` ENUM('vendor','admin','stayflexi') DEFAULT 'vendor'. Required to prevent StayFlexi from clearing vendor/admin blackouts. | 0.5          |
| A7        | Write and test SQL migration script (rollback-safe, all changes additive — zero downtime)                                                                                        | 0.5          |
| **Total** |                                                                                                                                                                                  | **3.5 days** |

---

### B) Backend Infrastructure (New Files)

| Task      | Description                                                                               | Days         |
| --------- | ----------------------------------------------------------------------------------------- | ------------ |
| B0        | Install `fast-xml-parser` npm package — not currently in `backend/package.json`           | 0.5          |
| B1        | `xmlParser.js` — ESM-compatible XML-to-object parser using fast-xml-parser                | 0.5          |
| B2        | `xmlBuilder.js` — Object-to-XML response builder for all 8 operations                     | 1.0          |
| B3        | `stayflexiAuth.js` — X-SF-SHARED-SECRET header validation middleware + IP allowlist check | 0.5          |
| B4        | `stayflexiXmlRoutes.js` — Register all 7 inbound POST routes                              | 0.5          |
| B5        | Wire routes into `server.js`                                                              | 0.5          |
| **Total** |                                                                                           | **3.5 days** |

---

### C) Inbound XML Endpoints (StayFlexi → Zevio)

All 7 endpoints live in `stayflexiXmlService.js` and `stayflexiXmlController.js`.

| Task      | Endpoint                   | Logic                                                                                                                                                                  | Days       |
| --------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| C1        | `POST /update-inventory`   | Parse HotelCode + date range + Count. Count=0: create blackout records. Count≥1: clear blackouts. Log to sync_log. Return SuccessRS.                                   | 1.0        |
| C2        | `POST /update-rates`       | Parse rate fields. Upsert `property_calendar_pricing` per date using Double as base price, ExtraAdult and ExtraChild as guest/child charges. Log and return SuccessRS. | 1.5        |
| C3        | `POST /update-restriction` | Parse restriction flags per date range. Upsert `stayflexi_restrictions`. Apply or clear StopSell-based blackouts. Log and return SuccessRS.                            | 1.5        |
| C4        | `POST /get-inventory`      | For each date in range, check bookings and blackouts. Return GetRoomInventoryRS with Count=0 or Count=1 per date.                                                      | 1.0        |
| C5        | `POST /get-rates`          | Read `property_calendar_pricing` with fallback to base pricing. Map Zevio fields to Single/Double/Triple/ExtraAdult/ExtraChild. Return GetRoomRateRS.                  | 1.0        |
| C6        | `POST /get-restriction`    | Read `stayflexi_restrictions` for date range. Return GetRestrictionRS.                                                                                                 | 0.5        |
| C7        | `POST /hotel-detail`       | Return property structure: room types and rate plan codes from mapping table. Return HotelDetailRS.                                                                    | 0.5        |
| **Total** |                            |                                                                                                                                                                        | **7 days** |

---

### D) Outbound PushBooking (Zevio → StayFlexi)

| Task      | Description                                                                                   | Days       |
| --------- | --------------------------------------------------------------------------------------------- | ---------- |
| D1        | Build `PushBookingRQ` XML for booking confirmed, cancelled, and modified states               | 1.5        |
| D2        | HTTP client call to `sf_push_booking_url` per property mapping                                | 0.5        |
| D3        | Async retry mechanism — non-blocking on booking failure (log and retry queue)                 | 1.0        |
| D4        | Hook into `bookingController.js` — trigger PushBooking on confirmed/cancelled/modified events | 1.0        |
| D5        | Store `sf_push_booking_id` response back to `bookings` table                                  | 0.5        |
| D6        | Log full request/response to `stayflexi_sync_log`                                             | 0.5        |
| **Total** |                                                                                               | **5 days** |

---

### E) Admin Panel — New UI Screens (React — Vite)

New screens go into `frontend/src/pages/admin/`. Both screens follow the existing admin page pattern (shadcn/ui components, Radix UI, lucide-react icons, `api` axios instance).

| Task      | Description                                                                                                                                                                                    | Days         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| E1        | **`StayflexiPropertyMapping.jsx`** — Admin screen to connect a Zevio property to StayFlexi: enter HotelCode, RoomTypeCode, RatePlanCode, PushBooking URL. Toggle active/inactive per property. | 2.0          |
| E2        | **`StayflexiSyncLog.jsx`** — Admin screen to view all inbound/outbound XML operations. Filter by property, operation, date, direction, status. Expandable request/response XML panel.          | 2.0          |
| E3        | Register both screens as routes in `frontend/src/App.jsx` (admin-only `ProtectedRoute`). Add nav entries in `DashboardLayout` sidebar under a new "StayFlexi" section.                         | 0.5          |
| **Total** |                                                                                                                                                                                                | **4.5 days** |

---

### F) Security Hardening

| Task      | Description                                                                   | Days       |
| --------- | ----------------------------------------------------------------------------- | ---------- |
| F1        | Nginx IP allowlist configuration for StayFlexi source IPs                     | 0.5        |
| F2        | Input validation for all XML fields: date ranges, numeric rates, count values | 0.5        |
| F3        | Guest PII masking in sync_log before DB write                                 | 0.5        |
| F4        | Environment variable setup for shared secret (no hardcoding)                  | 0.5        |
| **Total** |                                                                               | **2 days** |

---

### I) Conflict Prevention — Blackout Source Tagging

This prevents StayFlexi from accidentally clearing blackouts created by vendors or admins. All blackouts are now tagged with their origin using the `blackout_source` column added in A6.

| Task      | Description                                                                                                                                                  | Days         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| I1        | Update `update-restriction` endpoint — StopSell=True inserts blackout with `blackout_source = 'stayflexi'`                                                   | 0.5          |
| I2        | Update `update-restriction` endpoint — StopSell=False only deletes rows where `blackout_source = 'stayflexi'`. Vendor and admin blackouts are never touched. | 0.5          |
| I3        | Update `update-inventory` endpoint — Count=0 inserts with `blackout_source = 'stayflexi'`. Count≥1 only clears `blackout_source = 'stayflexi'` rows.         | 0.5          |
| **Total** |                                                                                                                                                              | **1.5 days** |

---

### J) Conflict Prevention — Rate Authority Lock

Once StayFlexi is active for a property, rates are owned by StayFlexi. Vendors must not update rates from Zevio's vendor panel or their changes will be overwritten on the next StayFlexi push.

| Task      | Description                                                                                                                                                                                                                                   | Days         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| J1        | Backend: Add `GET /api/vendor/properties/:id/stayflexi-status` — returns `{ is_stayflexi_active: true/false }` by reading `stayflexi_property_mapping.is_active`                                                                              | 0.5          |
| J2        | Frontend (React): Update `VendorCalendarPricing.jsx` — on load, call J1. If active: disable all calendar pricing inputs and show notice: "Rate management for this property is handled via StayFlexi. Changes made here will be overwritten." | 1.0          |
| **Total** |                                                                                                                                                                                                                                               | **1.5 days** |

---

### K) Vendor Transition Tooling (Admin)

Admin needs a safe, guided flow to activate existing Zevio vendors on StayFlexi without manual errors or double-booking risk.

| Task      | Description                                                                                                                                                                                                                               | Days         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| K1        | Extend `StayflexiPropertyMapping.jsx` (E1) with Activate flow — before setting `is_active=true`, show admin a pre-activation summary: existing upcoming bookings on that property, mapping completeness check, and a confirmation prompt. | 1.0          |
| K2        | Backend: `POST /api/admin/stayflexi/activate/:propertyId` — validates mapping completeness, returns upcoming bookings list, sets `is_active = true` only after admin confirmation                                                         | 1.0          |
| K3        | Backend: `POST /api/admin/stayflexi/deactivate/:propertyId` — sets `is_active = false`, deletes StayFlexi-sourced blackouts, logs deactivation event in sync_log. Full rollback in one click.                                             | 0.5          |
| **Total** |                                                                                                                                                                                                                                           | **2.5 days** |

---

### G) Testing

| Task      | Description                                                                                                                                                              | Days       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| G1        | **Unit Tests** — XML parser, XML builder, auth middleware, rate conversion logic                                                                                         | 2.0        |
| G2        | **Integration Tests** — All 7 inbound endpoints with mock StayFlexi requests. Validation of DB writes, response XML format, and error codes 101–120.                     | 2.0        |
| G3        | **End-to-End Sandbox Tests** — Live test with StayFlexi sandbox credentials across all 8 operations. Confirm round-trip inventory, rates, restrictions, and PushBooking. | 2.5        |
| G4        | **Regression Tests** — Verify existing Zevio booking flow is unaffected by bookingController changes                                                                     | 1.0        |
| G5        | Bug fixes from test cycles                                                                                                                                               | 1.5        |
| **Total** |                                                                                                                                                                          | **9 days** |

---

### H) Deployment & Go-Live

| Task      | Description                                                        | Days         |
| --------- | ------------------------------------------------------------------ | ------------ |
| H1        | Production environment setup — secrets, Nginx config, PM2 config   | 0.5          |
| H2        | DB migration execution on production (with rollback plan)          | 0.5          |
| H3        | Pilot rollout — go live on one property, monitor sync logs for 24h | 1.0          |
| H4        | Full rollout and handover                                          | 0.5          |
| **Total** |                                                                    | **2.5 days** |

---

## Parallel Launch Strategy

### Track A — Market Launch (Starts Immediately, No Dev Work Needed)

Zevio launches to market and onboards vendors using the existing platform. StayFlexi integration is built in the background and has zero impact on this track.

```
Day 1  →  Zevio goes to market
           Vendors register and list properties
           Guests browse and book via Zevio native flow
           All data (bookings, pricing, blackouts) stored in Zevio DB
           StayFlexi has zero interaction — no mapping records active
```

### Track B — StayFlexi Integration (Runs in Parallel, Weeks 1–8)

Development happens in the background. StayFlexi is activated per-vendor only after both sides are ready.

```
Week 1–2  →  DB migration + XML utilities + auth (zero impact on live data)
Week 3–4  →  All 7 inbound endpoints + PushBooking + conflict prevention (sandbox only)
Week 5    →  Admin UI + rate lock + activate/deactivate tooling
Week 6–7  →  Testing + sandbox E2E validation
Week 8    →  Production deploy + per-vendor activation begins
```

### Why This Is Safe

Every vendor on Zevio starts with either no `stayflexi_property_mapping` record or `is_active = false`. They are fully invisible to StayFlexi until explicitly activated by admin.

All DB changes in Phase 1 are additive:

- New tables have no effect on existing queries
- `booking_source` defaults to `'zevio'` — all existing bookings automatically safe
- `blackout_source` defaults to `'vendor'` — all existing blackout records automatically safe
- Zero downtime required for migration

### Per-Vendor Activation Flow

```
Step 1  Admin creates mapping record in StayflexiPropertyMapping.jsx:
        → Enter HotelCode, RoomTypeCode, RatePlanCode, PushBooking URL
        → is_active = false  (not live yet — StayFlexi cannot reach this property)

Step 2  Admin runs pre-activation checklist (K1 / K2 backend):
        → Mapping completeness validated
        → Upcoming Zevio bookings shown (awareness check for double-booking window)
        → StayFlexi team confirms they will pull GetRoomInventory on their side before going live

Step 3  Admin confirms → is_active = true:
        → StayFlexi can now call all 7 inbound endpoints for this property
        → PushBooking fires for all new confirmed bookings
        → Vendor calendar pricing screen locked with notice (J2)

Step 4  Monitor sync log for 24h via StayflexiSyncLog.jsx:
        → Confirm inventory sync calls received
        → Confirm first PushBooking sent and acknowledged

Step 5  If any issue: Admin hits Deactivate (K3):
        → is_active = false instantly
        → StayFlexi-created blackouts cleared automatically
        → Property reverts to Zevio-native mode — full rollback in one click
```

### Impact on Existing Vendors During Integration Build

| Concern                                   | Answer                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Existing vendor bookings affected?        | No — `booking_source` defaults to 'zevio', zero behavior change                      |
| Existing vendor rates affected?           | No — `property_calendar_pricing` untouched until StayFlexi is activated per property |
| Existing vendor blackouts affected?       | No — `blackout_source` defaults to 'vendor', all existing rows are protected         |
| Guest booking flow affected?              | No — Next.js user site and booking controller logic are unchanged                    |
| Any downtime required?                    | No — all DB changes are additive (new tables + default columns)                      |
| What if a vendor is NOT yet on StayFlexi? | They are ignored completely — no mapping record = no StayFlexi interaction           |

---

## Phase-by-Phase Delivery Timeline

### Phase 0 — Market Launch (Day 1, Parallel Track)

**Duration: 0 days of dev work — platform is already production-ready**

Zevio's existing platform launches to market. Vendor onboarding starts immediately. No StayFlexi work is required for this phase.

| Deliverable                              | Status |
| ---------------------------------------- | ------ |
| Vendor registration and property listing | Live   |
| Guest booking flow (Next.js)             | Live   |
| Admin property management (React)        | Live   |
| Vendor calendar pricing (React)          | Live   |
| Payment and settlement flow              | Live   |

**Exit Criteria:** Vendors are onboarded, properties are listed, bookings are flowing. StayFlexi integration has zero dependency on this.

---

### Phase 1 — Foundation (Week 1)

**Duration: 5.5 days**

| Deliverable                                                                                                    | Category | Days |
| -------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| DB migration (4 new tables + `bookings` column alters + `blackout_source` column on `property_blackout_dates`) | A1–A7    | 3.5  |
| Install `fast-xml-parser` in backend                                                                           | B0       | 0.5  |
| XML parser and builder utilities                                                                               | B1, B2   | 1.5  |
| Auth middleware                                                                                                | B3       | 0.5  |

**Exit Criteria:** DB live with zero downtime. `fast-xml-parser` installed. `blackout_source` column protecting existing blackouts. XML utilities and auth middleware functional.

---

### Phase 2 — Inbound Endpoints + Conflict Prevention (Weeks 2–3)

**Duration: 12 days**

| Deliverable                                                            | Category   | Days |
| ---------------------------------------------------------------------- | ---------- | ---- |
| Route setup and server.js wiring                                       | B4, B5     | 1.0  |
| All 7 inbound XML endpoints built and wired                            | C1–C7      | 7.0  |
| Blackout source tagging — StayFlexi blackouts tagged, safe clear logic | I1, I2, I3 | 1.5  |
| Security hardening (input validation, PII masking, env secrets)        | F2, F3, F4 | 1.5  |
| Unit tests for XML utilities + blackout isolation logic                | G1         | 1.0  |

**Exit Criteria:** All 7 inbound endpoints return correct XML. StayFlexi blackouts tagged and cleared independently of vendor/admin blackouts. Unit tests pass.

---

### Phase 3 — Outbound PushBooking (Week 4)

**Duration: 5 days**

| Deliverable                                            | Category | Days |
| ------------------------------------------------------ | -------- | ---- |
| PushBooking XML builder                                | D1       | 1.5  |
| HTTP client + retry mechanism                          | D2, D3   | 1.5  |
| bookingController hooks (confirmed/cancelled/modified) | D4       | 1.0  |
| PushBooking ID storage + sync log                      | D5, D6   | 1.0  |

**Exit Criteria:** Booking confirmed on Zevio triggers PushBooking to StayFlexi. Cancellation sends correct XML. Existing booking flow unaffected if PushBooking fails.

---

### Phase 4 — Admin UI + Rate Authority Lock + Activation Tooling (Week 5)

**Duration: 8 days**

| Deliverable                                                                                        | Category   | Days |
| -------------------------------------------------------------------------------------------------- | ---------- | ---- |
| `StayflexiPropertyMapping.jsx` — map property, activate/deactivate, pre-activation checklist       | E1, K1     | 3.0  |
| `StayflexiSyncLog.jsx` — sync log viewer per property, expandable XML panel                        | E2         | 2.0  |
| App.jsx routes + DashboardLayout nav entry (StayFlexi section, admin-only)                         | E3         | 0.5  |
| Backend: StayFlexi status API + activate/deactivate endpoints                                      | J1, K2, K3 | 1.5  |
| `VendorCalendarPricing.jsx` rate lock — disable form + show notice when `is_stayflexi_active=true` | J2         | 1.0  |

**Exit Criteria:** Admin can map, activate, and deactivate any vendor property on StayFlexi via UI with a safe pre-activation checklist. Vendor calendar pricing is locked for StayFlexi-active properties.

---

### Phase 5 — Testing & QA (Weeks 6–7)

**Duration: 9 days**

| Deliverable                                                               | Category | Days |
| ------------------------------------------------------------------------- | -------- | ---- |
| Integration tests for all 7 inbound endpoints                             | G2       | 2.0  |
| End-to-end sandbox tests with StayFlexi (all 8 XML operations)            | G3       | 2.5  |
| Regression tests — existing Zevio booking flow unaffected                 | G4       | 1.0  |
| Test blackout source isolation — vendor blackouts survive StayFlexi calls | G2 ext.  | 0.5  |
| Test rate lock — vendor cannot edit rates when StayFlexi active           | G2 ext.  | 0.5  |
| Test activate/deactivate flow end-to-end                                  | G2 ext.  | 0.5  |
| Nginx IP allowlist configuration                                          | F1       | 0.5  |
| Bug fixes                                                                 | G5       | 1.5  |
| Pilot rollout on 1 property — monitor for 24h                             | H3       | 0.5  |

**Exit Criteria:** All 8 XML operations verified on StayFlexi sandbox. Zero regression. Blackout isolation confirmed. Rate lock confirmed. Pilot property live and syncing cleanly.

---

### Phase 6 — Production Deployment & Handover (Week 7)

**Duration: 2 days**

| Deliverable                                 | Category | Days |
| ------------------------------------------- | -------- | ---- |
| Production DB migration + environment setup | H1, H2   | 1.0  |
| Full rollout and 24h monitoring             | H4       | 1.0  |

**Exit Criteria:** All mapped properties live on StayFlexi OTA channel. Sync logs clean. Handover complete.

---

## Timeline Summary

```
Day 1   |  Phase 0: Market Launch — vendor onboarding starts immediately (zero dev work)
        |
        |  ── StayFlexi integration development begins in parallel ──
        |
Week 1  |  Phase 1: Foundation (DB migration + XML utils + auth + blackout_source column)
Week 2  |  Phase 2: Inbound Endpoints Part 1 (routes + 4 endpoints + blackout conflict prevention)
Week 3  |  Phase 2: Inbound Endpoints Part 2 (3 endpoints + security + unit tests)
Week 4  |  Phase 3: Outbound PushBooking
Week 5  |  Phase 4: Admin UI + Rate Lock + Activate/Deactivate tooling
Week 6  |  Phase 5: Testing & QA Part 1 (integration + sandbox + regression + conflict tests)
Week 7  |  Phase 5: Testing & QA Part 2 (per-vendor activation tests + bug fixes + pilot)
Week 8  |  Phase 6: Production Deployment + per-vendor activation begins
```

**Total Calendar Duration: 8 weeks (parallel to ongoing market activity)**
**Market launch is not blocked — vendors can be onboarded from Day 1**

---

## Effort Summary Table

| Phase                          | Category                                                      | Working Days  |
| ------------------------------ | ------------------------------------------------------------- | ------------- |
| Phase 0 — Market Launch        | No dev work — platform already live                           | 0.0           |
| Phase 1 — Foundation           | DB + XML Utilities + Auth + npm install + blackout_source     | 5.5           |
| Phase 2 — Inbound Endpoints    | 7 XML Endpoints + Conflict Prevention + Security + Unit Tests | 12.0          |
| Phase 3 — Outbound PushBooking | PushBooking + Booking Controller                              | 5.0           |
| Phase 4 — Admin UI             | Mapping Screen + Sync Log + Rate Lock + Activate/Deactivate   | 8.0           |
| Phase 5 — Testing & QA         | Integration + Sandbox + Regression + Conflict Tests + Pilot   | 9.0           |
| Phase 6 — Deployment           | Production Rollout + Handover                                 | 2.0           |
| **TOTAL**                      |                                                               | **41.5 days** |

> Billed effort assumes 1 senior full-stack developer (Node.js + React/Vite + MariaDB).
> Parallel team delivery can compress calendar time to 5–6 weeks.
> Market launch (Phase 0) has zero dependency on this timeline.

---

## Dependencies and Blockers

Development cannot start on Phase 3, 5, and 6 until StayFlexi provides the following:

| #   | Blocker                                          | Blocks                     |
| --- | ------------------------------------------------ | -------------------------- |
| 1   | XML schema or field contract for all 8 APIs      | Phase 2 finalization       |
| 2   | Sandbox credentials and sample mapping codes     | Phase 5 sandbox tests      |
| 3   | PushBooking sandbox and production endpoint URLs | Phase 3                    |
| 4   | Auth header key name and shared secret format    | Phase 1 auth middleware    |
| 5   | StayFlexi source IP ranges                       | Phase 5 Nginx config       |
| 6   | Named technical POC for integration              | Phase 5 and 6 coordination |

---

## Assumptions

1. One senior full-stack developer handles backend + frontend.
2. StayFlexi sandbox environment is available before Phase 5 begins.
3. The existing Zevio stack is stable and accessible: backend (Node.js ESM, Express, MariaDB), admin and vendor dashboards (React 18 / Vite — `frontend/`), user-facing site (Next.js 16 — `nextjs/`). New StayFlexi admin screens are added to the React/Vite frontend only. Next.js is not touched.
4. DB migration will be reviewed and approved before executing on production.
5. Property mapping data (HotelCode, RoomTypeCode, RatePlanCode, PushBooking URL) will be provided by the client per property before Phase 6.
6. Timeline does not include StayFlexi onboarding delays or their approval process.

---

## Out of Scope

The following are explicitly excluded from this project:

- REST JSON webhook integration
- StayFlexi bookinglist and bookingdetail REST endpoints
- Real-time guest-facing booking flow changes (bookings still work as-is)
- Multi-currency support beyond existing Zevio currency model
- StayFlexi reporting or analytics integration
- Mobile app changes

---

---

## Vendor Transition Checklist

Use this checklist when activating any existing Zevio vendor on StayFlexi. Each vendor is activated independently — no bulk activation.

### Before Activation (Admin + Client tasks)

- [ ] Create `stayflexi_property_mapping` record: HotelCode, RoomTypeCode, RatePlanCode, PushBooking URL entered and confirmed with StayFlexi
- [ ] Review upcoming Zevio bookings on that property (pre-activation summary shown by admin UI K1)
- [ ] Confirm with StayFlexi that they will call `GetRoomInventory` on their side before going live (prevents double-booking window)
- [ ] Brief the vendor: "Rates will now be managed from StayFlexi dashboard — the calendar pricing in your Zevio vendor panel will be locked"

### Activation

- [ ] Admin clicks Activate in `StayflexiPropertyMapping.jsx` — backend K2 runs validation
- [ ] `is_active` set to `true`
- [ ] Vendor calendar pricing screen shows lock notice immediately

### Post-Activation Monitoring (24 hours)

- [ ] Monitor `StayflexiSyncLog.jsx` for inbound calls from StayFlexi
- [ ] Confirm inventory sync calls received and processed correctly
- [ ] Confirm first PushBooking (if a booking occurs) sent and acknowledged by StayFlexi
- [ ] No conflict alerts in admin dashboard

### If Issues Arise — Rollback

- [ ] Admin hits Deactivate in `StayflexiPropertyMapping.jsx` — one click
- [ ] `is_active` set to `false`
- [ ] All StayFlexi-sourced blackouts cleared automatically (vendor/admin blackouts untouched)
- [ ] Property reverts to full Zevio-native mode
- [ ] Diagnose from sync log, fix, and re-activate when ready

---

## Risk Register

| Risk                                               | Likelihood | Impact                               | Mitigation                                                                                                    |
| -------------------------------------------------- | ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Double booking at activation window                | Medium     | High — guest experience              | Pre-activation checklist (K1/K2) shows upcoming bookings; StayFlexi confirms inventory pull before going live |
| StayFlexi sandbox delay                            | Medium     | High — blocks Phase 5                | Start mock-based integration tests in parallel; request sandbox access at project start                       |
| XML schema differs from documentation              | Medium     | Medium — endpoint rework             | Build XML parser as schema-flexible; validate all field names against live sandbox calls in Phase 5           |
| Vendor updates rates in Zevio after StayFlexi live | Medium     | Medium — rates overwritten next push | Rate lock on `VendorCalendarPricing.jsx` (J2) prevents this entirely once `is_active = true`                  |
| StayFlexi clears a vendor/admin blackout           | Low        | High — dates open unexpectedly       | Blackout source tagging (I1–I3) ensures StayFlexi only ever clears its own blackouts                          |
| PushBooking retry creates duplicate on StayFlexi   | Low        | High — duplicate bookings            | Idempotency key per booking implemented before Phase 3 delivery                                               |
| Existing Zevio booking flow regression             | Low        | High                                 | Dedicated regression suite in Phase 5; all bookingController changes are additive                             |
| Nginx IP change from StayFlexi                     | Low        | Low                                  | Confirm IP change notification SLA with StayFlexi during Phase 1 communication                                |

---

Document Version 3.0 — April 24, 2026
Based on: STAYFLEXI_XML_INTEGRATION_PLAN.md
Stack verified against: backend/package.json, frontend/package.json, nextjs/package.json, backend/server.js, frontend/src/App.jsx, backend/src/controllers/blackoutController.js, backend/src/controllers/calendarPricingController.js
