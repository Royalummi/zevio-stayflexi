# StayFlexi XML Integration Master Plan

### Zevio x StayFlexi - XML Integration Only

> Document Date: April 23, 2026
> Status: Active Planning - XML Only
> Primary Source: StayflexiXMLIntegration - OTA (5).md
> Supersedes: STAYFLEXI_INTEGRATION_PLAN.md

---

## Scope

This is the only planning document to use going forward.

Integration scope is strictly XML:

1. StayFlexi calls Zevio XML endpoints for inventory, rates, restrictions, and property details.
2. Zevio calls StayFlexi XML PushBooking endpoint for booking confirmations and cancellations.
3. REST JSON webhook, bookinglist, and bookingdetail are out of scope.

---

## Architecture Summary

```
Vendor updates in StayFlexi dashboard
          |
          v
StayFlexi -> Zevio XML endpoints (real-time push)
          |
          v
Zevio DB updates availability/rates/restrictions
          |
          v
Zevio.in reflects current state

Guest books on Zevio.in
          |
          v
Zevio -> StayFlexi PushBooking XML
          |
          v
StayFlexi updates OTA availability
```

---

## XML API Direction Map

StayFlexi -> Zevio (inbound XML):

- UpdateRoomInventory
- UpdateRoomRates
- UpdateRestriction
- GetRoomInventory
- GetRoomRates
- GetRestriction
- GetHotelDetail

Zevio -> StayFlexi (outbound XML):

- PushBooking

Total XML APIs in this implementation: 8 (7 inbound + 1 outbound).

---

## Endpoint List

### Zevio Hosted Endpoints

Base path:
`https://api.zevio.in/api/stayflexi/xml/`

1. POST /update-inventory
2. POST /update-rates
3. POST /update-restriction
4. POST /get-inventory
5. POST /get-rates
6. POST /get-restriction
7. POST /hotel-detail

### StayFlexi Hosted Endpoint (called by Zevio)

8. PushBooking XML URL per mapped property (stored in DB as sf_push_booking_url)

---

## Database Changes

### 1) stayflexi_property_mapping

Purpose:

- Map Zevio property to StayFlexi HotelCode/RoomTypeCode/RatePlanCode.
- Store sf_push_booking_url.

Core fields:

- zevio_property_id
- sf_hotel_code
- sf_room_type_code
- sf_rate_plan_code
- sf_push_booking_url
- is_active

### 2) stayflexi_bookings

Purpose:

- Store StayFlexi-related booking linkage and payload references for XML workflow.

Core fields:

- zevio_booking_id
- zevio_property_id
- sf_hotel_code
- sf_booking_id
- channel_booking_id
- channel_name
- booking_status (CREATED, MODIFIED, CANCELLED)
- check_in, check_out, num_nights
- guest details and pricing snapshot
- raw_xml

### 3) stayflexi_sync_log

Purpose:

- Audit trail for every XML request/response (inbound and outbound).

Core fields:

- property_id
- operation
- direction (inbound/outbound)
- request_xml
- response_xml
- status
- error_message

### 4) stayflexi_restrictions

Purpose:

- Store per-date restrictions received from StayFlexi.

Core fields:

- property_id
- restriction_date
- stop_sell
- min_los
- max_los
- closed_on_arrival
- closed_on_departure

### 5) Alter bookings table

Add:

- booking_source enum('zevio','stayflexi_ota') default 'zevio'
- sf_push_booking_id varchar(100)

---

## XML Endpoint Behavior

### 1. update-inventory

Input:

- HotelCode, RoomTypeCode, StartDate, EndDate, Count

Behavior:

- Count=0: create blackout records for date range.
- Count>=1: remove blackout records for date range.
- Log in stayflexi_sync_log.
- Return SuccessRS.

### 2. update-rates

Input:

- HotelCode, RoomTypeCode, RatePlanCode, StartDate, EndDate
- Single, Double, Triple, ExtraAdult, ExtraChild

Behavior:

- Map property from mapping table.
- Upsert property_calendar_pricing per date.
- Use Double as base nightly price.
- Use ExtraAdult and ExtraChild for extra guest/child charges.
- Log and return SuccessRS.

### 3. update-restriction

Input:

- HotelCode, RoomTypeCode, RatePlanCode, StartDate, EndDate
- StopSell, ClosedOnArrival, ClosedOnDeparture, MinLOS, MaxLOS

Behavior:

- Upsert stayflexi_restrictions per date.
- If StopSell=True, apply blackout.
- If StopSell=False, clear StayFlexi-created blackout.
- Log and return SuccessRS.

### 4. get-inventory

Behavior:

- For each date in range:
  - booked or blackout => Count=0
  - otherwise Count=1
- Build and return GetRoomInventoryRS XML.

### 5. get-rates

Behavior:

- Resolve date rate from property_calendar_pricing, fallback to base pricing.
- Build XML fields:
  - Single and Double = base
  - Triple = base + ExtraAdult
  - ExtraAdult from extra_guest_charge
  - ExtraChild from extra_child_charge
- Return GetRoomRateRS XML.

### 6. get-restriction

Behavior:

- Read stayflexi_restrictions by date range.
- Return GetRestrictionRS XML.

### 7. hotel-detail

Behavior:

- Return property room type and rate plan structure from mapped data.
- Return HotelDetailRS XML.

---

## Outbound PushBooking (Zevio -> StayFlexi)

Trigger points:

1. Booking confirmed on Zevio.in.
2. Booking cancelled on Zevio.in.
3. Booking modified (if modification flow exists).

PushBooking logic:

1. Find mapping by property_id.
2. Build PushBookingRQ XML.
3. Send to sf_push_booking_url.
4. Save outbound reference in bookings.sf_push_booking_id.
5. Log request/response in stayflexi_sync_log.

Rule:

- Do not fail customer booking flow if PushBooking call fails. Log and retry separately.

---

## Rate Conversion Rules

Zevio -> XML:

- price_per_night -> Single and Double
- price_per_night + extra_guest_charge -> Triple
- extra_guest_charge -> ExtraAdult
- extra_child_charge -> ExtraChild

XML -> Zevio:

- Double -> property_calendar_pricing.price
- ExtraAdult -> property_pricing.extra_guest_charge
- ExtraChild -> property_pricing.extra_child_charge

---

## Error Code Handling

Use StayFlexi XML error codes where applicable:

- 101 HotelCode not found
- 102 RoomTypeCode not found
- 103 RatePlanCode not found
- 104 Unauthorized
- 110 Invalid start date
- 111 Invalid end date
- 112 End date before start date
- 114 Date range beyond allowed limit
- 115 Invalid count
- 116 Invalid StopSell value
- 117 Internal DB error
- 118 Invalid BookingStatus
- 119 Currency mismatch
- 120 Invalid rate value

---

## Backend File Plan

### New files

- backend/src/utils/xmlParser.js
- backend/src/utils/xmlBuilder.js
- backend/src/services/stayflexiXmlService.js
- backend/src/controllers/stayflexiXmlController.js
- backend/src/routes/stayflexiXmlRoutes.js
- backend/src/middlewares/stayflexiAuth.js

### Existing files to modify

- backend/server.js
- backend/src/controllers/bookingController.js

---

## Security Plan

1. Validate X-SF-SHARED-SECRET on all inbound XML calls.
2. Add Nginx IP whitelist for StayFlexi source IPs.
3. Validate date ranges and numeric rate/count values.
4. Use safe XML parsing with fast-xml-parser.
5. Mask guest PII before storing detailed logs.
6. Keep secrets in env config, never hardcoded.

---

## Phased Delivery Timeline (XML Only)

### Phase 1 (Week 1)

- DB migration
- XML parser/builder utilities
- Auth middleware

### Phase 2 (Week 2)

- Build and wire all 7 inbound XML endpoints

### Phase 3 (Week 3)

- Implement outbound PushBooking and booking controller hooks

### Phase 4 (Week 4)

- Admin property mapping controls + sync log visibility

### Phase 5 (Week 5)

- End-to-end XML tests + pilot rollout on one property

### Phase 6 (Week 6)

- Production rollout and monitoring

Estimated total: 5-6 weeks.

---

## Questions for StayFlexi (XML Only)

1. Confirm exact PushBooking endpoint URL format.
2. Confirm mandatory auth mechanism (shared secret, IP whitelist, or both).
3. Share production and sandbox source IP ranges.
4. Provide sandbox HotelCode/RoomTypeCode/RatePlanCode for testing.
5. Confirm timeout and retry expectations for XML responses.
6. Confirm supported BookingStatus values in PushBooking.

---

## Integration Readiness and Communication Checklist

Current assessment:

- This document is enough as the base implementation plan.
- Before coding starts, a few integration-critical details must be confirmed by StayFlexi.

Use this checklist in your communication with StayFlexi and mark each item as Done or Pending.

### A) Endpoint and Payload Finalization

1. Inbound endpoint path confirmation

- Confirm exact XML operation names they will call and whether path naming must match operation names.
- Confirm whether all requests are POST only.

2. PushBooking destination details

- Confirm if sf_push_booking_url is property-specific or common across all hotels.
- Confirm if URL differs between sandbox and production.

3. XML schema and required tags

- Request official XSD or strict schema for each of the 8 XML operations.
- Confirm mandatory vs optional fields for all request and response nodes.
- Confirm date format strictly (dd-mm-YYYY or dd-mm-YYYY HH:MM:SS where applicable).

4. BookingStatus contract

- Confirm accepted outbound values for PushBooking (CONFIRMED, MODIFIED, CANCELLED).
- Confirm expected behavior if MODIFIED is not supported for some channels.

### B) Authentication and Network Security

5. Authentication contract

- Confirm exact header key name and expected value format for shared secret.
- Confirm whether they require signature/hash-based auth in addition to shared secret.

6. IP allowlisting

- Collect production source IPs and sandbox source IPs.
- Confirm notification process if their IPs change.

7. TLS and certificate expectations

- Confirm TLS version requirements.
- Confirm whether public CA certificate is sufficient or if mutual TLS is required.

### C) Reliability, Retry, and Error Behavior

8. Timeout and retry policy

- Confirm their HTTP timeout for Zevio endpoint responses.
- Confirm retry count and retry interval per operation.

9. Success and error response contract

- Confirm canonical SuccessRS response they expect for each operation.
- Confirm whether they parse custom ErrorRS descriptions or only code.

10. Idempotency expectations

- Confirm how duplicate Update operations should be treated.
- Confirm uniqueness key for PushBooking on their side (BookingId scope).

### D) Mapping and Business Rules

11. Property and rate-plan cardinality

- Confirm if one hotel can map to multiple room types and multiple rate plans in phase 1.
- Confirm if one Zevio property can map to multiple StayFlexi HotelCode values.

12. Inventory semantics

- Confirm valid Count range (0 or 1 only, or larger counts allowed).
- Confirm behavior expected for partial availability across date ranges.

13. Restriction semantics

- Confirm StopSell source of truth if conflict exists with existing blackout state.
- Confirm precedence rules for ClosedOnArrival and ClosedOnDeparture.

14. Currency and tax assumptions

- Confirm whether currency is fixed per hotel.
- Confirm tax fields expected in PushBooking payload and whether zero values are acceptable.

### E) Environment and Go-Live Process

15. Sandbox package

- Request sandbox credentials, sample HotelCode, sample RoomTypeCode, sample RatePlanCode, and sample PushBooking URL.
- Request sample success and error XML payloads for all operations.

16. UAT test cases

- Agree on minimum UAT scenarios:
  - Update inventory block and unblock
  - Update rates for date range
  - Update restriction with MinLOS and StopSell
  - Get inventory and get rates response validation
  - PushBooking confirmed and cancelled flow

17. Production rollout checklist

- Confirm production credentials handover owner.
- Confirm rollout window and on-call contacts.
- Confirm incident escalation path and support SLA.

### F) Required Outputs from StayFlexi Before Development Start

Development should begin only after these are received:

1. Final XML schema or equivalent field contract for all 8 APIs.
2. Sandbox credentials and sandbox endpoint details.
3. PushBooking endpoint details (sandbox and production).
4. Auth header standard and IP ranges.
5. Retry and timeout policy confirmation.
6. Named technical POC for integration support.

---

## Final Decisions Locked

1. Zevio will use XML integration only.
2. JSON webhook and REST reconciliation are not part of this implementation.
3. This file is the single maintained plan document.

---

Document Version 3.0 - April 2026
Single Source of Truth: STAYFLEXI_XML_INTEGRATION_PLAN.md
