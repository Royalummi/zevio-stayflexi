# **Zevio Platform \- Channel Manager Integration**

## **Quotation & Project Proposal**

---

**Document Date:** April 25, 2026   
**Prepared by:** Gopafy 

**IMPORTANT DISCLAIMER** This is an **estimated quotation** based on our current understanding of the project requirements and the StayFlexi integration specification. This is **not a final quotation**.

Technology integrations can sometimes present unexpected challenges \- whether from the channel manager''s side (StayFlexi or any future channel manager), changes in their API specifications, new requirements discovered during development, or technical complexity that cannot be fully foreseen at this stage.

**If new challenges arise during development, the timeline and cost may be revised.** Any such changes will be communicated in advance with full explanation before any additional work is undertaken.

## **Section 1 \- How We Will Work (Parallel Approach)**

We recommend \- and this quotation is built around \- a **parallel launch strategy:**

**Day 1**   \-  Zevio goes live to the market

* Vendors onboard and list their properties  
* Guests can search and book immediately  
* All of this happens with zero dependency on channel manager

**Week 1-8**   \-  Channel manager integration is built in the background

* Zero impact on the live platform  
* Zero impact on existing vendors or bookings

**Week 8**     \-  Channel manager is deployed and ready

* Vendors who want StayFlexi integration can be activated one by one  
* Existing vendors and bookings are may disturbed in some way

This means your **business starts earning from Day 1, while the integration is built in parallel.**

## **Section 2 \- How the StayFlexi Integration Works (Simple Explanation)**

When a vendor''s property is activated on StayFlexi through Zevio, the following happens automatically:

### **Step 1: StayFlexi Asks Zevio for Information**

StayFlexi will regularly contact Zevio to ask:

- "What rooms are available on these dates" \- Zevio answers with current availability  
- "What are the rates for these dates" \- Zevio answers with current pricing  
- "What restrictions are active" \- Zevio answers (minimum stay, no-arrival days, etc.)  
- "What is the hotel structure" \- Zevio answers with property types and rate plans

### **Step 2: StayFlexi Updates Zevio**

When a booking comes in through any platform connected to StayFlexi, StayFlexi immediately tells Zevio:

- Block these dates (Update Inventory)  
- Update rates for these dates (Update Rates)  
- Apply these restrictions (Update Restrictions)

Zevio processes all of these updates automatically and keeps its own calendar in sync.

### **Step 3: Zevio Sends Booking Confirmations to StayFlexi**

When a booking is made through Zevio''s own website, Zevio automatically sends a notification to StayFlexi with full booking details (guest name, dates, room, payment). StayFlexi then updates all connected platforms so the dates are blocked everywhere.

### 

### **What This Means for Vendors**

Once activated, a vendor does **not** need to manually update their calendar on StayFlexi or any other platform. Everything is automatic and real-time.

## **Section 3 \- Property Onboarding to StayFlexi**

This is a one-time setup step required **for each vendor** who wants to use the StayFlexi integration.

### **Onboarding Steps**

| Step | Who Does It | What Happens |
| :---- | :---- | :---- |
| 1 | Vendor requests StayFlexi activation from Zevio admin | Vendor raise a request to the admin |
| 2 | Zevio admin requests to registers the property on StayFlexi''s platform | Property is created in StayFlexi, which assigns unique Hotel ID, Room Type IDs, and Rate Plan IDs |
| 3 | Admin runs a pre-activation checklist | Verifies no upcoming booking conflicts, confirms all mapping is complete |
| 4 | Admin activates the property | StayFlexi integration goes live for that property. Sync begins. |

### 

### **Important Notes on Property Onboarding**

- Each property requires a **separate registration** on StayFlexi''s side  
- The Hotel ID, Room Type IDs, and Rate Plan IDs are provided by StayFlexi after registration \- they are required before activation can happen in Zevio  
- Onboarding is done **one vendor at a time** for safety \- never a bulk activation  
- If a vendor was already taking bookings manually on Zevio, we run a conflict check before activation to ensure no double-booking risk.

### 

### 

### **Deactivation (If Needed)**

If a vendor wants to disconnect from StayFlexi:

- Admin clicks "Deactivate" for that property  
- StayFlexi-managed dates are cleared from Zevio''s calendar  
- The vendor's manually set dates and rates remain untouched  
- The vendor continues on Zevio as normal, managing availability manually

## **Section 4 \- Conflict Prevention (Why This Is Safe)**

A key concern with any channel manager integration is: **what happens if StayFlexi tries to delete a date that the vendor blocked manually.**

We have built explicit safety rules for this:

### **Blackout Date Protection**

- Every date that is blocked has a tag: **"blocked by StayFlexi"**  
- StayFlexi can only ever clear dates that it itself blocked

### 

### **Rate Control Lock**

- When a property is active on StayFlexi, the vendor''s **manual rate editing is locked**  
- The vendor sees a clear notice: "Rates for this property are currently managed by StayFlexi"  
- This prevents rate conflicts between what Zevio shows and what StayFlexi pushes  
- Rates are unlocked immediately if the vendor deactivates StayFlexi for that property

## **Section 5 \- Testing (Important \- How Testing Works)**

Unlike typical software integrations, **StayFlexi does not provide a sandbox or test environment** to us.

Instead, **we build the integration endpoints** and provide the URLs to StayFlexi. StayFlexi calls our system.

This means our testing approach is

1. **We build a testing environment on our own server** \- simulating StayFlexi calls internally to verify all our endpoints work correctly  
2. **We test every possible scenario** \- valid requests, invalid requests, error codes, edge cases  
3. **We test with sample data** that matches the exact format StayFlexi uses  
4. **Once we are confident everything is working**, we register our endpoints with StayFlexi for their testing and validation  
5. **StayFlexi does a final verification** by calling our live endpoints with their own test data

This approach requires more thorough preparation on our side, which is reflected in the testing time allocated in both plans below.

## **Section 6 \- What We Are NOT Changing**

To be completely clear, the following parts of the Zevio platform are **not touched at all** in this project:

- The guest-facing booking website (`zevio.in`) \- no changes  
- The existing guest booking flow \- no changes  
- Existing vendor rates and availability \- not affected unless a vendor explicitly activates StayFlexi  
- Existing bookings already in the system \- fully protected  
- The vendor dashboard experience \- unchanged except for the rate lock notice (only visible if StayFlexi is active for that property)

# **PLAN A \- StayFlexi Integration Only**

## **Plan A Overview**

This plan integrates StayFlexi as the **only channel manager** for Zevio. The system is built specifically for StayFlexi''s protocol. If a second channel manager is ever needed in the future, a larger rework will be required at that time.

**This is the right choice if you are certain StayFlexi will be the only channel manager.**

## **Plan A \- What Gets Built**

### **Backend (Server-Side)**

- All 7 endpoints that StayFlexi will call (availability, rates, restrictions, hotel detail, etc.)  
- The outbound booking notification that Zevio sends to StayFlexi on every new, modified, or cancelled booking  
- A security layer that validates every incoming request is genuinely from StayFlexi  
- Full audit logging of every single request and response between Zevio and StayFlexi  
- Automatic retry logic \- if a booking notification fails to reach StayFlexi, the system retries without affecting the guest or vendor

### **Admin Panel (New Screens)**

- **Property Mapping Screen** \- Admin Runs activation checklist. Activates or deactivates with one click. Gets the property details.  
- **Sync Log Viewer** \- Admin can see every single communication between Zevio and StayFlexi, with status (success/failure), direction, and full details. Useful for debugging any issue.

### 

### **Vendor Dashboard (Minor Update)**

- Rate editing screen shows a lock notice if that property is active on StayFlexi

### 

### **Server Configuration** 

- Server is updated to allow StayFlexi''s servers to call our endpoints securely  
- All secret keys and credentials are stored securely in environment variables, never in code  
- A full production deployment with smoke testing

## **Plan A \- StayFlexi API Coverage**

As per the StayFlexi XML Integration documentation, the following 8 operations are fully covered:

| \# | Operation | Direction | What It Does |
| :---- | :---- | :---- | :---- |
| 1 | Update Room Inventory | StayFlexi \- Zevio | StayFlexi updates availability (block or open dates) |
| 2 | Update Room Rates | StayFlexi \- Zevio | StayFlexi pushes rate changes per room type and rate plan |
| 3 | Update Room Restrictions | StayFlexi \- Zevio | StayFlexi applies StopSell, MinLOS, MaxLOS, ClosedOnArrival, ClosedOnDeparture |
| 4 | Get Room Inventory | StayFlexi \- Zevio | StayFlexi queries current availability per date |
| 5 | Get Room Rates | StayFlexi \- Zevio | StayFlexi queries current rates per date |
| 6 | Get Room Restrictions | StayFlexi \- Zevio | StayFlexi queries current restrictions per date |
| 7 | Get Hotel Detail | StayFlexi \- Zevio | StayFlexi retrieves full property structure (rooms and rate plans) |
| 8 | Push Booking Notification | Zevio \- StayFlexi | Zevio notifies StayFlexi of every confirmed, modified, or cancelled booking |

## 

## **Plan A \- Timeline**

| Phase | What Happens | Duration |
| :---- | :---- | :---- |
| **Day 1** | Zevio platform goes live. Vendors onboard. Bookings begin. | (Existing platform) |
| **Week 1** | Database setup \+ core utilities \+ security layer | 1 week |
| **Week 2** | 4 inbound StayFlexi endpoints built and tested | 1 week |
| **Week 3** | Remaining 3 endpoints \+ security hardening | 1 week |
| **Week 4** | Outbound booking notification \+ booking system hook | 1 week |
| **Week 5** | Admin mapping screen \+ sync log viewer \+ vendor rate lock | 1 week |
| **Week 6** | Full internal testing \- all scenarios, error cases, edge cases | 1 week |
| **Week 7** | Bug fixes \+ pilot test on 1 property \+ monitoring | 1 week |
| **Week 8** | Server setup \+ production deployment \+ final smoke test \+ handover | 1 week |
| **Total** |  | **8 working weeks** |

## **Plan A \- Pricing**

| Item | Cost |
| :---- | :---- |
| StayFlexi Integration \- Full Development, and Deployment | **35,000/-** |
| **Total** | **35,000/-** |

### 

### **Payment Terms**

| When | Amount |
| :---- | :---- |
| Before development begins | **35,000/- (Full Payment)** |

# 

# **PLAN B \- Multi-Channel Manager Foundation**

## **Plan B Overview**

This plan builds a **future-proof architecture** from day one. StayFlexi is integrated as the first channel manager, but the entire system is designed so that any additional channel manager (SiteMinder, RateTiger, Staah, Wubook, etc.) can be added in the future with the following:

- **No database redesign**  
- **No architectural changes**  
- **No impact on existing channel manager connections**  
- Only the new channel manager''s specific implementation needs to be built

**This is the right choice if there is any chance of adding a second channel manager in the future.**

The difference is 20,000/- more upfront. But if a second channel manager is ever added after choosing Plan A, a major rework costing significantly more will be required. Plan B eliminates that risk entirely.

## **Plan B \- Long-Term Cost Comparison**

| Scenario | Plan A Path | Plan B Path |
| :---- | :---- | :---- |
| Initial Integration | 35,000/- | 50,000/- |
| Adding a 2nd Channel Manager | \~ 35,000 \+ (major rework required) | \~ 15,000 \- 20,000 (new adapter only) |
| Adding a 3rd Channel Manager | \~-35,000+ (more rework) | \~ 15,000 \- 20,000 (new adapter only) |
| **Total if 3 channel managers needed** | **\~ 1,05,000 \+** | **\~ 80,000 \- 90,000/-** |

Plan B costs less in the long run if even one additional channel manager is ever needed \- and saves significant time, disruption, and technical risk.

## **Plan B \- What Gets Built**

### **Everything in Plan A, plus:**

**A Universal Connection Layer**

- A central system is built that any channel manager can plug into  
- StayFlexi is the first connection built on top of this layer  
- All database tables are designed generically \- one table stores connections for any channel manager, not just StayFlexi  
- All admin screens work for any channel manager, not just StayFlexi

**Generic Admin Screens**

- **Channel Manager Connections** \- Admin manages connections for any channel manager from one screen. The fields adapt based on which channel manager is selected.  
- **Sync Log (All Channel Managers)** \- One unified view to see all sync activity across every connected channel manager. Filter by channel manager, property, date, operation, or status.

**What Adding a Future Channel Manager Looks Like Under Plan B**

1. Build the new channel manager''s specific connection file (\~8-10 days)  
2. Plug it into the existing universal layer  
3. Done \- no other changes needed anywhere. StayFlexi and all existing connections continue working without interruption.

## **Plan B \- Timeline**

| Phase | What Happens | Duration |
| :---- | :---- | :---- |
| **Day 1** | Zevio platform goes live. Vendors onboard. Bookings begin. | (Existing platform) |
| **Week 1** | Architecture design \+ database setup (generic, future-proof design) | 1 week |
| **Week 2** | Universal connection layer build | 1 week |
| **Week 3** | StayFlexi implementation \- 4 inbound endpoints | 1 week |
| **Week 4** | StayFlexi implementation \- remaining 3 endpoints \+ security | 1 week |
| **Week 5** | Outbound booking notification \+ booking system hook | 1 week |
| **Week 6** | Admin UI \- Channel Connections screen \+ Sync Log \+ vendor rate lock | 1 week |
| **Week 7** | Full internal testing \- all scenarios for StayFlexi | 1 week |
| **Week 8** | Bug fixes \+ pilot test on 1 property \+ monitoring | 1 week |
| **Week 9** | Extended testing \- edge cases \+ regression testing \+ stress testing | 1 week |
| **Week 10** | Server setup \+ production deployment \+ final smoke test \+ handover | 1 week |
| **Total** |  | **10 working weeks** |

**Plan B** requires 2 additional weeks compared to Plan A. This is because the universal architecture requires more careful design and testing to ensure it can correctly support any future channel manager \- not just StayFlexi.

## **Plan B \- Pricing**

| Item | Cost |
| :---- | :---- |
| Multi-Channel Manager Foundation \- Full Development, Testing, and Deployment | **50,000/-** |
| **Total** | **50,000/-** |

### 

### **Payment Terms**

| When | Amount |
| :---- | :---- |
| Before development begins | **50,000/- (Full Payment)** |

# 

# **Plan Comparison Summary**

|  | Plan A \- StayFlexi Only | Plan B \- Multi-Channel Foundation |
| :---- | :---- | :---- |
| **Price** | 35,000/- | 50,000/- |
| **Timeline** | 8 weeks | 10 weeks |
| **Market Launch** | Day 1 \- no dependency | Day 1 \- no dependency |
| **StayFlexi Fully Integrated** | Yes | Yes |
| **Adding a 2nd Channel Manager** | Requires significant rework | 8-10 days, plug-in only |
| **Database Future-Ready** | No | Yes |
| **Admin Screens** | StayFlexi-specific | Works for any channel manager |
| **Impact on Existing Vendors** | None | None |
| **Impact on Existing Bookings** | None | None |

# **Recommendation**

* **We recommend Plan B** if there is any possibility of connecting to a second channel manager in the future.  
* The 20,000/- additional upfront cost prevents a much larger and more expensive rework later. The extra 2 weeks is a one-time investment that pays for itself the first time any new channel manager is requested.  
* **Choose Plan A** only if you are 100% certain StayFlexi will be the only channel manager Zevio ever uses.

# 

# **Important Terms, Rules, and Conditions**

## **Scope**

1. This quotation covers **only the work described in the chosen plan.** Any work not described above is a separate project and requires a separate agreement.  
2. If new requirements are discovered during development that were not known at the time of this quotation, those will be explained, estimated, and presented before any additional work begins.  
3. Changes to StayFlexi's API or protocol after development has started are outside our control. If StayFlexi changes their requirements mid-project, additional time and cost may apply.

## 

## **Timeline**

4. The timeline **starts from the date of full payment and confirmation of the chosen plan.**  
5. If any required information from StayFlexi (Hotel IDs, authentication credentials, API confirmation) is delayed, the development timeline pauses and resumes when the information is received. This delay is not counted against the project timeline.  
6. Client review periods (if the client requires time to review deliverables) are not included in the timeline unless specified.

## 

## **Payment**

7. **Full payment is required before development begins.** No work starts until payment is received and confirmed.  
8. Once development has begun, the payment is non-refundable.

## 

## **Testing and Delivery**

9. Testing is included in the timeline as described per plan. This includes internal testing (our team) and final verification with StayFlexi.  
10. After the system is deployed, the client will be asked to review and confirm acceptance.  
11. **30-day bug warranty:** Any bugs found within 30 days of handover that are directly related to the features developed in this project will be fixed at no extra charge. This does not cover new feature requests, changes in requirements, or issues caused by third parties (StayFlexi, server providers, etc.).

## **StayFlexi and Third-Party Responsibility**

12. **Gopafy does not control StayFlexi''s platform.** Any downtime, errors, or delays caused by StayFlexi are not the responsibility of Gopafy team.  
13. The ZEVIO is responsible for **registering each vendor''s property on StayFlexi''s platform** and providing the details for each property before activation.  
14. If StayFlexi changes their integration specification, authentication method, or XML format after our system goes live, updating the integration to match is additional work billed separately.

## 

## **Future Channel Managers (Plan B)**

15. Plan B provides the **foundation architecture** only. The cost to add each additional channel manager is a **separate project**, estimated at \~ 15,000 \- 20,000/- per channel manager depending on their technical complexity.  
16. This estimate for future channel managers is indicative only and may change based on the specific requirements of that channel manager.

## 

## **Final Disclaimer**

17. This is an **estimated quotation, not a final fixed-price contract.** Technology projects, especially third-party integrations, can encounter challenges that were not foreseeable at the time of quoting. If any such challenges arise, the client will be informed immediately, and a revised estimate will be provided for approval before any additional work proceeds. **No additional costs will be incurred without explicit client approval.**

# 

# **Dependencies \- What Is Needed Before Development Starts**

| \# | What Is Needed | Who Provides It |
| :---- | :---- | :---- |
| 1 | Full payment as per chosen plan | Client |
| 2 | Confirmation of chosen plan (Plan A or Plan B) | Client |
| 3 | StayFlexi partnership or account confirmation | ZEVIO / StayFlexi |
| 4 | StayFlexi Hotel ID, Room Type IDs, Rate Plan IDs for the first test property | ZEVIO / StayFlexi |
| 5 | StayFlexi authentication key / shared secret | StayFlexi |

# **What Is Not Included (Both Plans)**

The following are not part of this quotation and require a separate agreement if needed:

- Registering vendor properties on StayFlexi''s platform on behalf of vendors  
- Changes to the existing vendor or admin dashboard beyond what is described above  
- Multi-currency support beyond what Zevio currently supports.  
- Any second or third channel manager implementation (see Plan B Future Cost section)

---

*Document created on April 25, 2026* *Prepared exclusively for Zevio. Confidential.* *All amounts in INR.* *Technical Reference: StayFlexiXMLIntegration.pdf*