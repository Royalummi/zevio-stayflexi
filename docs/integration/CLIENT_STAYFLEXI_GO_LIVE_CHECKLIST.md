# What We Need From the Client — Stayflexi Go-Live

> **Who is “the client”?**  
> The **vendor / property owner** on Zevio (your customer who lists properties).

> **When to ask?**  
> Before you link their first property to Stayflexi. Keep it short — we only need a few things from them.

---

## Short summary (30 seconds)

**From the client we mainly need:**

1. **Which property** is the first pilot (Stayflexi-linked property)
2. **Which vendor / company** it belongs to in Zevio admin
3. **Any confirmed future bookings** on that property (so we do not double-send to Stayflexi)

**We do NOT need from the client:**

- Go-live date/time → **Zevio team decides**
- Stayflexi hotel/room/rate codes → **Stayflexi sends these after we give them our API URLs**
- Written approval email → **not required**
- Stayflexi technical support contact → **Zevio emails Stayflexi directly**

---

## How rates and bookings work (tell the client once)

| Property type | Who manages rates & availability | Who handles cancellations/refunds |
|---------------|----------------------------------|-----------------------------------|
| **Linked to Stayflexi** | **Stayflexi** (not Zevio calendar) | **Client** (vendor on Zevio) |
| **Not linked to Stayflexi** | **Zevio** admin as normal | **Client** (vendor on Zevio) |

Simple rule for the client:

> “If your property is connected to Stayflexi, change prices and availability in **Stayflexi only**. Other properties stay on **Zevio** as usual. **You** still handle guest cancellations and refunds on Zevio.”

---

## What we need from the client — checklist

| # | Ask the client? | What | Why |
|---|-----------------|------|-----|
| 1 | **Yes** | **Pilot property name** (exact name in Zevio admin) | First go-live is one property only |
| 2 | **Yes** | **Vendor / company name** in Zevio | Correct integration owner in admin |
| 3 | **Yes** | **Confirmed future bookings** on that property (dates if any) | Avoid double-creating on Stayflexi |
| 4 | **No** | Go-live date & time | **Zevio team** picks the schedule |
| 5 | **No** | Stayflexi Hotel / Room / Rate plan codes | **Stayflexi** sends after we share webhook & API details |
| 6 | **No** | Written approval | **Not required** |
| 7 | **No** | Stayflexi technical contact | **Zevio** contacts Stayflexi by email |
| 8 | **Inform only** | Rates on Stayflexi-linked properties | Must use Stayflexi, not Zevio calendar |
| 9 | **Inform only** | Cancellations & refunds | **Client (vendor)** handles on Zevio |

---

## Questions to ask the client (copy and send)

Short email — only what we actually need.

---

**Subject:** Stayflexi connection for [Property Name] — quick info needed

Hi,

We are connecting **[Property Name]** to **Stayflexi**. Please reply with:

1. **Confirm pilot property:** Is **[Property Name]** the first property for Stayflexi?  
   - Yes / No (if no, which property: _______________)

2. **Vendor name in Zevio:** _______________

3. **Confirmed future bookings** on this property in Zevio?  
   - Yes / No  
   - If yes, list check-in dates: _______________

**Please note (no action needed from you for these):**

- **Go-live timing** — our Zevio team will schedule this.
- **Stayflexi codes** (hotel, room, rate plans) — Stayflexi will send to us after we share our API details with them.
- **Rates & availability** — for this Stayflexi-linked property, you will manage them in **Stayflexi**, not in Zevio calendar. Your other properties (not on Stayflexi) stay on Zevio as normal.
- **Cancellations & refunds** — you continue to handle these on Zevio as you do today.
- If anything breaks on the technical sync side, **our team contacts Stayflexi** — you do not need to call Stayflexi yourself.

Thank you,  
[Your name]  
Zevio Team

---

## What Zevio team does (not the client)

| Step | Who | Action |
|------|-----|--------|
| 1 | Zevio | Share webhook URL + API details with **Stayflexi** (email) |
| 2 | Stayflexi | Send back **Hotel Code, Room Type Code, Rate plan codes** |
| 3 | Zevio | Create integration + mapping in admin using Stayflexi’s codes |
| 4 | Zevio | Pick **go-live date & time** |
| 5 | Zevio | Run **dry run** in admin (check upcoming bookings) |
| 6 | Zevio | Activate mapping when ready |
| 7 | Zevio | Run **test booking** (create + cancel) and check Sync Logs |
| 8 | Zevio | Email **Stayflexi** if any sync errors |
| 9 | Client | Use Stayflexi for rates on linked property; handle refunds on Zevio |

---

## What comes from Stayflexi (not the client)

After Zevio gives Stayflexi our URLs, Stayflexi should send:

| Item | Used for |
|------|----------|
| Hotel Code | Integration record |
| Room Type Code | Property mapping |
| Rate plan code(s) | Rates & restrictions sync |
| Shared secret | Webhook security |
| PushBooking URL | Outbound booking push |
| Server IPs | Firewall allowlist |

---

## What the client does NOT need to give us

| Not from client | Who provides |
|-----------------|--------------|
| Webhook URL | Zevio → Stayflexi |
| API / webhook details | Zevio → Stayflexi |
| Hotel / room / rate codes | Stayflexi → Zevio |
| Go-live schedule | Zevio team |
| Written approval | Not required |
| Stayflexi tech support | Zevio emails Stayflexi |
| Database or passwords | Never |

---

## Common client questions (simple answers)

**Q: Do I need to get codes from Stayflexi?**  
A: No. Zevio shares our API with Stayflexi; **Stayflexi sends codes to us**. You only confirm which property is the pilot.

**Q: Can I edit prices in Zevio for a Stayflexi property?**  
A: **No** — for properties linked to Stayflexi, use **Stayflexi**. Other properties use Zevio as normal.

**Q: Who cancels a booking or gives a refund?**  
A: **You (the vendor)** on Zevio — same as today.

**Q: Who do I call if sync fails?**  
A: **Zevio support**. We contact Stayflexi by email on the technical side.

**Q: Will old bookings go to Stayflexi?**  
A: No. Only **new** bookings after go-live are pushed. We check existing bookings before activation.

---

## Our test environment (internal only)

| Item | Test value |
|------|------------|
| Hotel code | `HOTEL_TEST_001` |
| Room code | `ROOM_TEST_101` |
| Rate plans | `RP01`, `RP02` |

Real production codes come from **Stayflexi**, not the client.

---

## Related documents

| Document | Purpose |
|----------|---------|
| `docs/integration/ota_request_response_logs.rtf.md` | Stayflexi sample XML |
| `docs/deployment/PILOT_DEPLOYMENT_CHECKLIST.md` | Technical pilot steps |
| Stayflexi go-live email (separate) | What to ask **Stayflexi team** |

---

## One-line reminder

**Ask the client only: pilot property, vendor name, and any upcoming confirmed bookings. Everything else is Zevio + Stayflexi.**
