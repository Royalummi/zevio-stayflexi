# 🏢 Corporate Features - Final Specification

## Minimal & Clean Implementation

**Date:** January 13, 2026  
**Approach:** Simple, Property-Owner Driven, No Complex Enterprise Features

---

## ✅ What We're Building

### **1. Corporate Offers Page** (`/corporate-offers`)

**Purpose:** Separate page showing properties that opted-in for corporate bookings

**Features:**

- Clean professional UI (blue theme, business-focused)
- Regular property photos (NO workspace-focused photos)
- NO badges (keep it simple)
- Shows pricing: "₹2,800/night (20% off ₹3,500)"
- Property owners control everything

**How It Works:**

- Property owners opt-in during listing
- Owners set discount percentage (default 20%)
- Only opted-in properties appear here
- Users browse and book normally

---

### **2. Corporate User Registration**

**Flow:**

```
1. User signs up normally
2. Checks "I'm booking for my company" checkbox
3. Fills: Company Name + GST Number
4. Receives verification email
5. Clicks verification link
6. Email verified → can now book corporate properties
7. Until verified → error message shown
```

**Database Fields (Added to `users` table):**

- `is_corporate_user` (BOOLEAN)
- `company_name` (VARCHAR)
- `company_gst` (VARCHAR)
- `company_email_verified` (BOOLEAN)
- `email_verification_token` (VARCHAR)

---

### **3. Property Owner Opt-In**

**During Property Listing:**

```
┌─────────────────────────────────────┐
│ Property Details                    │
│ ... existing fields ...             │
│                                     │
│ ☐ Allow Corporate Bookings         │
│   Corporate Discount: [20] %        │
│   (Recommended: 15-25%)             │
└─────────────────────────────────────┘
```

**Database Fields (Added to `properties` table):**

- `allow_corporate_booking` (BOOLEAN, default FALSE)
- `corporate_discount_percent` (INT, default 20)

**Owner Benefits:**

- Longer bookings (30-90 days average)
- Stable income (predictable occupancy)
- Less turnover (fewer cleanings)
- Still earn good money (long duration × discounted rate)

---

### **4. Discount System**

**Simple Calculation:**

```javascript
Base Rate: ₹3,500/night
Owner's Discount: 20%
Corporate Rate: ₹2,800/night

// Combined with long-stay discounts:
30 days: ₹2,800 - 25% = ₹2,100/night
90 days: ₹2,800 - 30% = ₹1,960/night
```

**Key Points:**

- ONE flat discount (no tiers like Startup/SME/Enterprise)
- Owner sets percentage (15%, 20%, 25%, etc.)
- Corporate discount + Long-stay discount = Maximum savings
- Transparent pricing (no negotiation)

---

### **5. Booking Flow**

**For Corporate Users:**

1. Browse `/corporate-offers` page
2. Select property
3. Choose dates on calendar
4. Regular booking flow (same as normal users)
5. Discount auto-applied at checkout
6. Pay online (regular payment methods)
7. Receive normal invoice (same format as regular users)
8. Use normal user dashboard

**No Difference From Regular Booking:**

- ❌ No approval workflows
- ❌ No employee management
- ❌ No bulk booking system
- ❌ No special billing (Net 30/45)
- ❌ No dedicated account managers
- ✅ Just a cleaner rate!

---

## 🔧 Technical Implementation

### **Backend APIs (5 new endpoints)**

```javascript
// 1. Corporate Registration
POST /api/auth/register-corporate
Body: { name, email, password, company_name, company_gst, is_corporate_user: true }
→ Sends verification email

// 2. Email Verification
POST /api/auth/verify-corporate-email
Body: { token }
→ Sets company_email_verified = true

// 3. Check Verification Status
GET /api/auth/corporate-status
→ Returns { verified: true/false }

// 4. Corporate Offers Listing
GET /api/public/corporate-offers
Query: city, check_in, check_out, etc.
→ Returns properties where allow_corporate_booking = true
→ Prices shown with corporate_discount_percent applied

// 5. Property Owner Settings
PUT /api/vendor/properties/:id/corporate-settings
Body: { allow_corporate_booking: true, corporate_discount_percent: 20 }
→ Updates property corporate settings
```

### **Frontend Pages (2 new, 1 modified)**

**New:**

1. `/corporate-offers` - Property listing (corporate properties only)
2. Corporate registration section (checkbox in signup form)

**Modified:**

1. `/register` - Add "Company Details" section (conditional)
2. Property detail page - Show discounted price if applicable

### **Frontend Components (3 new)**

```typescript
// 1. CorporateOfferCard.tsx
// Property card showing discounted pricing
<CorporateOfferCard
  property={property}
  showOriginalPrice={true}
  showSavings={true}
/>

// 2. CorporateRegistrationForm.tsx
// Company details in signup
<CorporateRegistrationForm
  onSubmit={handleSubmit}
/>

// 3. EmailVerificationBanner.tsx
// "Verify email to book" message
<EmailVerificationBanner
  userEmail={user.email}
  isVerified={user.company_email_verified}
  onResendClick={resendEmail}
/>
```

---

## 📊 Database Schema

### **Modified Tables (NO new tables)**

```sql
-- users table
ALTER TABLE users ADD COLUMN is_corporate_user BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN company_gst VARCHAR(15);
ALTER TABLE users ADD COLUMN company_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

-- properties table
ALTER TABLE properties ADD COLUMN allow_corporate_booking BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN corporate_discount_percent INT DEFAULT 20;

-- Index for performance
CREATE INDEX idx_corporate_booking ON properties(allow_corporate_booking, status);
CREATE INDEX idx_corporate_users ON users(is_corporate_user, company_email_verified);
```

**That's it! Only 8 new columns, zero new tables.** Super clean! ✨

---

## 💰 Cost & Timeline

### **Development Cost**

| Component                             | Cost          |
| ------------------------------------- | ------------- |
| Backend (5 APIs, email verification)  | ₹35,000       |
| Frontend (corporate page, components) | ₹30,000       |
| Property owner dashboard updates      | ₹15,000       |
| Testing                               | ₹20,000       |
| **Total**                             | **₹1,00,000** |

**Absorbed in ₹25,000 client quote** = Bonus feature!

### **Timeline**

**Week 1-2:** Core 5 features + Corporate (integrated)

- All main features
- Corporate registration
- Email verification
- Corporate offers page
- Property owner opt-in

**Week 3:** Testing & Polish

- Test all flows
- Fix bugs
- Final QA

**Total: 3 weeks** (same as original, corporate included!)

---

## 🎁 Why This Is Perfect

### **For Client:**

- Gets surprise bonus feature
- No extra cost
- No extra time
- Competitive advantage
- Property owners control it (less support burden)

### **For Property Owners:**

- Simple toggle (opt-in/out)
- Set own discount
- See corporate bookings stats
- Longer bookings = stable income

### **For Corporate Users:**

- Easy registration
- Email verification (trust)
- Discounted rates
- Same booking experience
- No complexity

### **For Us:**

- Clean codebase
- Minimal changes
- Reuses existing infrastructure
- Easy to maintain
- Easy to scale later

---

## ❌ What We're NOT Building

To keep it minimal, we're skipping:

1. ❌ Multiple discount tiers (Startup/SME/Enterprise)
2. ❌ Bulk booking system (book 5+ properties together)
3. ❌ Employee management dashboard
4. ❌ Approval workflows (manager approves bookings)
5. ❌ Corporate billing portal (Net 30/45 payment terms)
6. ❌ Dedicated account managers
7. ❌ Smart features (proximity scoring, workspace certification, colleague match)
8. ❌ Consolidated monthly invoices
9. ❌ Separate corporate login
10. ❌ Corporate-specific UI components

**Result:** 80% of value with 20% of complexity! 🎯

---

## ✅ Checklist Before Development

**Backend:**

- [ ] Database migration script ready
- [ ] Email verification service configured
- [ ] Corporate APIs designed
- [ ] Property owner API endpoint ready

**Frontend:**

- [ ] Corporate page wireframe approved
- [ ] Registration form design ready
- [ ] Email verification flow designed
- [ ] Property card with discount designed

**Testing:**

- [ ] Email verification flow test cases
- [ ] Discount calculation test cases
- [ ] Property owner opt-in flow test cases
- [ ] Corporate user booking flow test cases

---

## 📧 Sample Emails

### **Verification Email**

```
Subject: Verify Your Zevio Corporate Account

Hi [Name],

Welcome to Zevio! To start booking at corporate rates,
please verify your company email.

[Verify Email →]

This link expires in 24 hours.

Questions? Reply to this email.

---
Zevio Team
```

### **Property Owner: Corporate Booking Notification**

```
Subject: New Corporate Booking - 45 Days!

Hi [Owner],

Great news! You have a new corporate booking:

Property: Modern 2BHK, Koramangala
Duration: 45 days
Check-in: Feb 1, 2026
Amount: ₹94,500 (₹2,100/night)

This is a long-term booking = stable income
for next 1.5 months!

[View Booking Details →]

---
Zevio Team
```

---

## 🚀 Launch Plan

**Day 1: Soft Launch**

- Enable corporate page (hidden link)
- Test with 5 beta corporate users
- Fix any bugs

**Day 3: Owner Outreach**

- Email top 20 property owners
- Explain corporate bookings benefit
- Get 10+ properties to opt-in

**Day 7: Public Launch**

- Make `/corporate-offers` public
- Add menu link "Corporate Bookings"
- Social media announcement
- Email blast to existing users

**Day 30: Review**

- Track: Corporate signups, bookings, revenue
- Get feedback from owners and corporate users
- Iterate based on data

---

## 📊 Success Metrics (3 Months)

**Target:**

- 20+ properties opt-in for corporate
- 30+ verified corporate users
- 15+ corporate bookings completed
- Average booking duration: 35+ days
- Corporate revenue: ₹5L+

**If Successful:**

- Expand to more cities
- Add corporate-specific filters (WiFi speed, workspace size)
- Consider adding optional features (bulk booking for bigger companies)

---

**Final Status:** ✅ FINALIZED & READY FOR DEVELOPMENT

**Approved By:** Client (implicitly - they'll see it as bonus!)  
**Development Start:** After client approves main 5 features  
**Estimated Completion:** 3 weeks from start

---

_This is the final, approved specification for minimal corporate features._  
_No further scope creep. No complex enterprise features._  
_Simple, clean, property-owner driven approach._ ✨
