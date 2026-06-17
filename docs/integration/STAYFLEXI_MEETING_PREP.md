# Stayflexi Meeting Prep — Tomorrow Morning

> **Situation:** We emailed Stayflexi with technical + XML questions.  
> **They replied with:** `ota_request_response_logs.rtf.md` only (sample request/response XML logs).  
> **Meeting:** Tomorrow morning with Stayflexi (and/or client).  
> **Goal:** Leave the meeting with everything needed to go live on **zevio.cloud**.

---

## What their document already answered ✅

Stayflexi’s log file confirms **XML shape** — our Zevio build already matches and tests pass.

| Topic | What their logs show | Zevio status |
|-------|----------------------|--------------|
| Inventory | `<RoomType>` blocks + `<Count>` + `<DaysOfWeek>` + dates | ✅ Built & tested |
| Rates | `<RatePlan>` + occupancy prices (Single, Double, Triple, etc.) | ✅ Built & tested |
| Restrictions | `<Restriction>` + MinLOS, MaxLOS, StopSell, ClosedOnArrival/Departure | ✅ Built & tested |
| Restriction format | `<HotelCode>` as child element + `<Version>1.0</Version>` | ✅ Supported |
| Room StopSell without RatePlanCode | Their system returns **ErrorRS 405** | ✅ We match this |
| Success response | `<SuccessRS />` | ✅ We return this |

**You can tell Stayflexi in the meeting:**

> “We implemented and tested against your sample XML logs. Inbound tests: **40/40 pass** (23 inbound + 17 scenario tests). Outbound booking push tested with mock endpoint.”

---

## What their document did NOT include ❌ (still need tomorrow)

| # | Still missing | Why we need it |
|---|---------------|----------------|
| 1 | **Production shared secret** | Webhook security (`x-channel-secret`) |
| 2 | **PushBooking URL** | Where Zevio sends confirm/cancel XML |
| 3 | **Outbound auth** (username/password?) | If required on push |
| 4 | **Stayflexi server IP addresses** | Firewall / nginx allowlist |
| 5 | **Real pilot Hotel Code** | Not `hotelCode` placeholder |
| 6 | **Real Room Type Code** | Not `hotelCode1` placeholder |
| 7 | **Real Rate plan codes** | Not `hotelCode11` / `hotelCode12` |
| 8 | **Confirmation they will call our webhook URL** | They must point to Zevio |
| 9 | **Test vs production environment** | Which URL/codes for zevio.cloud testing |
| 10 | **Technical contact email** | For post-go-live sync issues |
| 11 | **PushBooking sample** | Inbound logs only — no outbound booking XML sample |
| 12 | **Error code list** | Beyond 405 we already saw |

---

## Email to send Stayflexi (copy and paste)

Send this **tonight or early tomorrow morning** before the meeting.  
Replace `[Your Name]`, `[Your Email]`, and `[Your Phone]` before sending.

---

**To:** Stayflexi technical / integration team  
**Subject:** Zevio × Stayflexi — meeting follow-up & items needed for zevio.cloud go-live

---

Hi Stayflexi Team,

Thank you for sharing the **OTA request/response log** document. It was very helpful.

We have reviewed it and **implemented our Zevio integration** to match your XML format for:

- UpdateRoomInventoryRQ (inventory)
- UpdateRoomRatesRQ (rates)
- UpdateRestrictionRQ (restrictions)
- Get operations and HotelDetail

We have also run automated tests on our side using the same XML structure as in your document. **All inbound tests are passing**, and outbound booking push (confirm + cancel) has been tested successfully on our end.

We have a **meeting scheduled tomorrow morning** to complete the connection and move to live testing on **zevio.cloud**.

To make the meeting productive, please come prepared with the details below.

---

### Our platform URLs (zevio.cloud — testing environment)

| Purpose | URL |
|---------|-----|
| Guest website | https://zevio.cloud |
| Admin / vendor panel | https://admin.zevio.cloud |
| Backend API | https://api.zevio.cloud |
| **Inbound webhook (Stayflexi → Zevio)** | **https://api.zevio.cloud/api/channel-manager/stayflexi/webhook** |

**Webhook details:**

- Method: `POST`
- Content-Type: `application/xml` or `text/xml`
- Auth header: `x-channel-secret: <shared secret>`

Please confirm that you will send inventory, rate, and restriction updates to the webhook URL above.

---

### What we still need from Stayflexi

**1) Security & connectivity**

- Shared secret for the inbound webhook (`x-channel-secret` header)
- List of your **server IP addresses** (for our firewall / nginx allowlist)

**2) Outbound booking push (Zevio → Stayflexi)**

When a booking is confirmed, modified, or cancelled on Zevio, we POST XML to Stayflexi. Please share:

- **PushBooking endpoint URL** (for zevio.cloud testing)
- Whether **Basic Auth** (username + password) is required — if yes, please share test credentials
- A sample **PushBooking request XML** for CONFIRMED and CANCELLED (if available)
- Your **retry policy** if a push fails

**3) Pilot property mapping codes**

Your log file used placeholder codes (`hotelCode`, `hotelCode1`, etc.). For our first live property, please share the **real values**:

| Field | Value (please fill) |
|-------|---------------------|
| Hotel Code | |
| Room Type Code | |
| Rate plan code — Room Only | |
| Rate plan code — Free Breakfast (if applicable) | |
| Any other rate plans we should map | |

**4) Environment & support**

- Are zevio.cloud credentials **separate from production** (zevio.in)? When should we switch?
- Technical contact name and email for integration support after go-live
- Short list of common **ErrorRS codes** and meanings (if available)

---

### What we will do after we receive the above

1. Configure our server (`api.zevio.cloud`) with the shared secret and PushBooking URL  
2. Set up IP allowlist for your servers  
3. Create the Stayflexi integration and property mapping in Zevio admin  
4. Run a joint test — you send inventory/rates to our webhook; we send a test booking to your PushBooking URL  
5. Verify results in sync logs on both sides  

---

### Quick confirmation

Could you also confirm:

1. Your XML format in the OTA log document is still the **current production format** — any changes since that file?
2. For `UpdateRoomInventoryRQ`, inventory is sent inside **`<RoomType>`** blocks with **`<Count>`** and **`<DaysOfWeek>`** — correct?
3. For restrictions with **StopSell**, **RatePlanCode is required** (as in your ErrorRS 405 example) — correct?

We have implemented the same behaviour on our side.

---

Looking forward to our meeting tomorrow and to completing the go-live on zevio.cloud.

Thank you,  
[Your Name]  
Zevio Integration Team  
[Your Email]  
[Your Phone]

---

### Shorter version (if you prefer a brief email)

**Subject:** Tomorrow’s meeting — Zevio × Stayflexi follow-up

Hi Stayflexi Team,

Thank you for the OTA request/response log — we implemented and tested against it (all tests passing).

For our meeting tomorrow on **zevio.cloud**, please bring:

1. Shared secret (`x-channel-secret`)  
2. PushBooking URL + outbound auth (if any)  
3. Your server IP addresses  
4. Real Hotel Code, Room Type Code, and Rate plan codes for the pilot property  
5. Confirm webhook URL: `https://api.zevio.cloud/api/channel-manager/stayflexi/webhook`  
6. Test vs production details and technical support contact  

Our URLs: zevio.cloud | admin.zevio.cloud | api.zevio.cloud

Thank you,  
[Your Name]  
Zevio Team

---

**When to send:** Tonight or early tomorrow morning, before the meeting.  
**Tip:** Use the **full email** above for the first follow-up. Use the **shorter version** only if you already sent something similar.

---

## Meeting agenda (30–45 min)

### Part 1 — Confirm XML (5 min) ✅ mostly done

- [ ] “Your log file matches our implementation — any changes since that document?”
- [ ] Confirm **DaysOfWeek** filtering: updates apply only on listed days (we implemented this)

### Part 2 — Credentials & URLs (15 min) 🔴 critical

- [ ] Shared secret value for zevio.cloud testing
- [ ] PushBooking URL for zevio.cloud testing
- [ ] Outbound auth (yes/no + credentials)
- [ ] Stayflexi egress IPs for allowlist
- [ ] They confirm webhook URL: `https://api.zevio.cloud/api/channel-manager/stayflexi/webhook`

### Part 3 — Pilot property mapping (10 min) 🔴 critical

- [ ] Real **Hotel Code** for pilot property
- [ ] Real **Room Type Code**
- [ ] Real **Rate plan code(s)** (Room Only, Free Breakfast, etc.)
- [ ] Which property/hotel name on Stayflexi side matches our pilot?

### Part 4 — Go-live plan (10 min)

- [ ] Test on zevio.cloud first, then zevio.in production? (confirm order)
- [ ] Who triggers first live inventory/rate push — Stayflexi or Zevio?
- [ ] Test booking flow: Zevio confirms booking → PushBooking → Stayflexi receives?
- [ ] What is their retry policy if push fails?
- [ ] Support email for sync failures

### Part 5 — Next steps (5 min)

- [ ] Stayflexi configures webhook URL on their side — by when?
- [ ] Zevio enters codes in admin + runs dry-run — by when?
- [ ] Joint test date (Zevio decides go-live timing)

---

## What YOU should have ready for the meeting

| Item | Status | Notes |
|------|--------|-------|
| Webhook URL written down | ✅ | `https://api.zevio.cloud/api/channel-manager/stayflexi/webhook` |
| Test results summary | ✅ | 23/23 inbound + 17/17 scenario + outbound mock pass |
| Sample XML doc | ✅ | `docs/integration/ota_request_response_logs.rtf.md` |
| Admin demo (optional) | ☐ | Sync Logs, Integrations, Mappings screens |
| Pilot property name | ☐ | Ask **client** before or during meeting if needed |
| zevio.cloud servers live | ☐ | Confirm `api.zevio.cloud/health` works before meeting |
| `.env` on server | ☐ | CM enabled; room for real secret + push URL after meeting |

**One-liner for the meeting:**

> “XML inbound is done and tested. We need secret, push URL, IPs, and real hotel/room/rate codes to switch from mock testing to live zevio.cloud.”

---

## What to ask the CLIENT (separate — not in Stayflexi meeting)

Only if you don’t already know:

| # | Question |
|---|----------|
| 1 | Which property is the Stayflexi pilot? |
| 2 | Vendor name in Zevio admin? |
| 3 | Any confirmed future bookings on that property? |

Full client doc: `docs/integration/CLIENT_STAYFLEXI_GO_LIVE_CHECKLIST.md`

**Do not ask the client for Stayflexi codes** — Stayflexi gives those in this meeting.

---

## After the meeting — Zevio action list

| Step | Action |
|------|--------|
| 1 | Update `api.zevio.cloud` `.env` with real secret + push URL |
| 2 | Add nginx/firewall IPs from Stayflexi |
| 3 | Create integration in admin with real Hotel Code |
| 4 | Create property mapping with Room + Rate plan codes |
| 5 | Run dry-run in admin |
| 6 | Ask Stayflexi to send test inventory/rate push to webhook |
| 7 | Create test booking → verify PushBooking in Sync Logs |
| 8 | Email Stayflexi with results |

---

## Related files

| File | Purpose |
|------|---------|
| `docs/integration/ota_request_response_logs.rtf.md` | Stayflexi’s reply (XML samples) |
| `docs/integration/CLIENT_STAYFLEXI_GO_LIVE_CHECKLIST.md` | Client questions (3 items) |
| `docs/deployment/PILOT_DEPLOYMENT_CHECKLIST.md` | Technical deployment steps |
| `backend/scripts/test-cm-stayflexi-scenarios.mjs` | Our Stayflexi-shaped tests |

---

## One-line plan

**Their doc answered XML format. Tomorrow’s meeting must get secret, push URL, IPs, and real codes — send the short follow-up email tonight.**
