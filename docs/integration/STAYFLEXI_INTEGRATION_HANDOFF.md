# Stayflexi ↔ Zevio — Integration Handoff

Hi Stayflexi team,

This is a short summary of how we will connect. Zevio hosts the XML APIs on our side. You call us when inventory, rates, or restrictions change. We push bookings to you when a guest books or cancels on Zevio.

Everything below follows your OTA XML documentation and the sample request/response logs you shared.

---

## Where to connect

**Testing (pilot):** `https://api.zevio.cloud`  
**Production (later):** `https://api.zevio.in`

---

## API key

Send this header on every request:

```
x-channel-secret: <key shared by Zevio>
```

You can also use: `Authorization: Bearer <same key>`

Zevio will share the actual key separately.

---

## How to call us

- Method: **POST**
- Content-Type: **application/xml**
- XML format: as per your OTA spec (`Version="1.0"`)
- Dates: `dd-mm-YYYY` or `yyyy-MM-dd` both work
- Optional `DaysOfWeek` tags: updates apply only on those days

**Success:**

```xml
<SuccessRS />
```

**Error:**

```xml
<ErrorRS Code="101">
  <Description>The given hotel does not exist</Description>
</ErrorRS>
```

Each API has its **own URL**. If you post the wrong XML type to a URL, you will get error code **405**.

---

## Property codes

For each hotel we onboard, Zevio will give you three codes. Use them exactly in your XML:

- **HotelCode** — the property
- **RoomTypeCode** — the room type
- **RatePlanCode** — the rate plan (e.g. Room Only, Free Breakfast)

Your sample logs use names like `hotelCode`, `hotelCode1`, `hotelCode11`, `hotelCode12`. We will map those to the real codes when we set up each property.

---

## Your APIs on Zevio (Stayflexi → Zevio)

Use these URLs on **api.zevio.cloud** for testing:

| What | URL | XML root |
|------|-----|----------|
| Update inventory | `POST /api/channel-manager/stayflexi/inventory/update` | `UpdateRoomInventoryRQ` |
| Get inventory | `POST /api/channel-manager/stayflexi/inventory/get` | `GetRoomInventoryRQ` |
| Update rates | `POST /api/channel-manager/stayflexi/rates/update` | `UpdateRoomRatesRQ` |
| Get rates | `POST /api/channel-manager/stayflexi/rates/get` | `GetRoomRateRQ` |
| Update restrictions | `POST /api/channel-manager/stayflexi/restrictions/update` | `UpdateRestrictionRQ` |
| Get restrictions | `POST /api/channel-manager/stayflexi/restrictions/get` | `GetRestrictionRQ` |
| Get hotel detail | `POST /api/channel-manager/stayflexi/hotel/detail` | `HotelDetailRQ` |

Full URLs for testing:

```
https://api.zevio.cloud/api/channel-manager/stayflexi/inventory/update
https://api.zevio.cloud/api/channel-manager/stayflexi/inventory/get
https://api.zevio.cloud/api/channel-manager/stayflexi/rates/update
https://api.zevio.cloud/api/channel-manager/stayflexi/rates/get
https://api.zevio.cloud/api/channel-manager/stayflexi/restrictions/update
https://api.zevio.cloud/api/channel-manager/stayflexi/restrictions/get
https://api.zevio.cloud/api/channel-manager/stayflexi/hotel/detail
```

### Quick notes per API

**Inventory update** — needs `HotelCode`, `RoomTypeCode`, `StartDate`, `EndDate`, `Count`. One hotel per request; multiple room types and date ranges are fine.

**Inventory get** — returns `GetRoomInventoryRS` with availability per date.

**Rates update** — needs `Currency`, room, rate plan, dates, and rate fields (`Single`, `Double`, `Triple`, `ExtraAdult`, `ExtraChild`, etc.) as in your logs.

**Rates get** — returns `GetRoomRateRS` with rates per date.

**Restrictions update** — needs room, dates, and the restriction fields (`MinLOS`, `MaxLOS`, `StopSell`, `ClosedOnArrival`, `ClosedOnDeparture`). For rate-plan rules, include `RatePlanCode`. For room-level stop-sell, send `StopSell` without `RatePlanCode` (per your OTA doc). `HotelCode` can be on the root or as a child element — both work.

**Restrictions get** — returns `GetRestrictionRS` per date.

**Hotel detail** — returns `HotelDetailRS` with room list and rate plan list.

---

## Bookings (Zevio → Stayflexi)

Per your OTA doc **Push Notification**, when a guest confirms or cancels on Zevio we will POST `PushBookingRQ` XML to an endpoint **you provide**.

Please share:

1. Your **Push Booking URL**
2. Any **auth** needed on that URL (username/password, API key, etc.)

Booking status values we send: **CONFIRMED**, **MODIFIED**, **CANCELLED**.

---

## Common error codes

| Code | Meaning |
|------|---------|
| 101 | Hotel not found / not mapped on Zevio |
| 102 | Room type not found |
| 103 | Rate plan not found |
| 104 | Not authorized |
| 105 | Invalid credentials |
| 106 | Not registered |
| 107 | Booking does not exist |
| 109–120 | Date, rate, currency, or validation errors (see OTA doc) |
| 405 | Wrong API URL for that XML type |

---

## What we need from Stayflexi to go live

1. Confirm the 7 URLs above are configured on your side  
2. API key exchange (you use ours; we use yours if needed for push)  
3. **HotelCode**, **RoomTypeCode**, **RatePlanCode** for the pilot property — or confirm you will use the codes Zevio sends  
4. **Push Booking URL** + auth for outbound bookings  
5. Your server IPs if you want IP allowlisting (optional)

---

## Contact

Technical questions: Zevio engineering ↔ Stayflexi tech team directly.

Property onboarding (which hotel, vendor, existing bookings): handled by Zevio with the property client.

---

*June 2026 — based on Stayflexi OTA XML Integration documentation and sample logs.*
