/**
 * Email Design Test Script
 * Sends all redesigned email templates to a test inbox using mock data.
 *
 * Usage:
 *   node test-emails.js
 *   node test-emails.js --only=booking,checkin
 *
 * Available filters: booking, cancellation, refund, expiry, checkin, checkout,
 *                    review, welcome, pwdreset, forgotpwd
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const __dir = path.dirname(fileURLToPath(import.meta.url));

// ─── Test recipients ───────────────────────────────────────────────────────
const RECIPIENTS = [
  "ranjith.gopafy@gmail.com",
  "shashankmanjunath13@gmail.com",
  "mithunmanju77@gmail.com",
];

// ─── Transporter ──────────────────────────────────────────────────────────
if (!process.env.BREVO_SMTP_SERVER || !process.env.BREVO_SMTP_KEY) {
  console.error(
    "❌  Brevo credentials missing in .env (BREVO_SMTP_SERVER / BREVO_SMTP_KEY).",
  );
  process.exit(1);
}
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_SERVER,
  port: parseInt(process.env.BREVO_PORT) || 587,
  secure: false,
  auth: { user: process.env.BREVO_LOGIN, pass: process.env.BREVO_SMTP_KEY },
});

// ─── Logo ──────────────────────────────────────────────────────────────────
let _logoBase64 = null;
try {
  _logoBase64 = readFileSync(path.join(__dir, "public/logo.png")).toString(
    "base64",
  );
} catch (_) {}

const _logoImg = _logoBase64
  ? `<img src="data:image/png;base64,${_logoBase64}" alt="Zevio" width="160" style="display:block;max-width:160px;height:auto;" />`
  : `<span style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:28px;font-weight:800;letter-spacing:3px;color:#ffffff;">ZEVIO</span>`;

// ─── Design helpers (mirrors emailService.js) ──────────────────────────────
const _F = `'Inter','Segoe UI',Arial,sans-serif`; // body
const _FH = `'Poppins','Inter','Segoe UI',Arial,sans-serif`; // headings
const _GF = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap`;
const _brandFooter = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:#1F3A5F;">
    <tr><td style="padding:24px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family:${_F};font-size:11px;color:#E6E9EE;line-height:1.7;">
            <strong style="color:#2FA4A9;">ZEVIO</strong> &nbsp;·&nbsp; Premium Villa Stays<br>
            Navarathna Agrahara, Bettahalasur Post, Bangalore North – 562157<br>
            <a href="mailto:support@zevio.in" style="color:#2FA4A9;text-decoration:none;">support@zevio.in</a>
            &nbsp;·&nbsp;
            <a href="https://zevio.in" style="color:#2FA4A9;text-decoration:none;">www.zevio.in</a>
          </td>
          <td align="right" style="font-family:${_F};font-size:10px;color:#5F6B7A;vertical-align:bottom;">
            © ${new Date().getFullYear()} Zevio. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;

const _emailOpen = (title = "Zevio") =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>` +
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${_GF}" rel="stylesheet">` +
  `<style>@import url('${_GF}');*{box-sizing:border-box;}body{margin:0;padding:0;font-family:${_F};background:#f2f4f7;}</style></head>` +
  `<body><table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:32px 16px;">` +
  `<tr><td align="center"><table cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(31,58,95,0.08);">`;
const _emailClose = () => `</table></td></tr></table></body></html>`;
const _emailHeader = (label = "") =>
  `<tr><td style="background:#1F3A5F;padding:32px 36px;text-align:center;">${_logoImg}` +
  (label
    ? `<div style="margin-top:14px;font-family:${_FH};font-size:11px;font-weight:700;color:#2FA4A9;letter-spacing:2.5px;text-transform:uppercase;">${label}</div>`
    : ``) +
  `</td></tr>`;
const _st = (text) =>
  `<p style="font-family:${_FH};font-size:11px;font-weight:700;color:#2FA4A9;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #E6E9EE;">${text}</p>`;
const _dr = (label, val, last = false) =>
  `<tr><td style="font-family:${_F};padding:10px 0;font-size:13px;font-weight:600;color:#1F3A5F;width:42%;vertical-align:top;${last ? "" : "border-bottom:1px solid #E6E9EE;"}">${label}</td>` +
  `<td style="font-family:${_F};padding:10px 0 10px 12px;font-size:13px;color:#4a5666;${last ? "" : "border-bottom:1px solid #E6E9EE;"}">${val}</td></tr>`;
const _box = (content) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;"><tr><td style="background:#f2f4f7;border-radius:12px;padding:16px 20px;font-family:${_F};font-size:13px;color:#4a5666;line-height:1.7;">${content}</td></tr></table>`;
const _notice = (content) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr><td style="background:#e6f7f8;border-radius:10px;border:1px solid #b8e8ea;padding:16px 20px;font-family:${_F};font-size:13px;color:#1F3A5F;line-height:1.6;">${content}</td></tr></table>`;
const _btn = (url, text, bg = "#2FA4A9") =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td align="center">` +
  `<a href="${url}" style="display:inline-block;padding:14px 40px;background:${bg};color:#ffffff;text-decoration:none;border-radius:8px;font-family:${_FH};font-weight:600;font-size:14px;">${text}</a>` +
  `</td></tr></table>`;
const _badge = (text, bg = "#2FA4A9", fg = "#fff") =>
  `<span style="display:inline-block;padding:4px 14px;background:${bg};color:${fg};border-radius:9999px;font-family:${_FH};font-size:11px;font-weight:700;letter-spacing:0.5px;">${text}</span>`;

// ─── Mock data ─────────────────────────────────────────────────────────────
const mockBooking = {
  id: "BK-20250419-TEST",
  full_name: "Ranjith Kumar",
  email: RECIPIENTS[0],
  property_title: "Serene Valley Villa",
  address: "12, Palm Grove Road",
  city: "Coorg",
  state: "Karnataka",
  pincode: "571201",
  check_in: "2025-04-25",
  check_out: "2025-04-28",
  check_in_time: "2:00 PM",
  check_out_time: "11:00 AM",
  nights: 3,
  guest_count: 4,
  children_count: 1,
  infants_count: 0,
  base_amount: "18000.00",
  gst_amount: "3240.00",
  service_charge: "1800.00",
  total_amount: "23040.00",
  razorpay_order_id: "order_TEST123456",
  payment_status: "paid",
  primary_incharge_name: "Suresh Nair",
  primary_incharge_phone: "+91 98765 43210",
  primary_incharge_email: "suresh@zevio.in",
  primary_incharge_whatsapp: "+919876543210",
  primary_incharge_alt_contact: null,
  secondary_incharge_name: "Priya Menon",
  secondary_incharge_phone: "+91 87654 32109",
  secondary_incharge_email: null,
  secondary_incharge_whatsapp: null,
  safety_information:
    "Keep doors locked at night. Swimming pool depth: 5ft max. First aid kit is in the master bedroom cabinet.",
  local_area_info:
    "Nearest hospital: Coorg District Hospital (3km). Petrol bunk: 1km on Madikeri Road. Best local restaurant: Raintree Café (500m).",
  emergency_contacts: null,
  city_name: "Coorg",
  property_id: "prop-test-001",
};

const FRONTEND_URL = process.env.NEXTJS_URL || "https://zevio.in";

// ─── Parse CLI filter ──────────────────────────────────────────────────────
const arg = process.argv.find((a) => a.startsWith("--only="));
const filter = arg ? arg.replace("--only=", "").split(",") : null;
const only = (key) => !filter || filter.includes(key);

// ─── Email definitions ─────────────────────────────────────────────────────
const emails = [];

// 1. Booking Confirmation (inline CSS template — mirrors server template)
if (only("booking")) {
  const b = mockBooking;
  emails.push({
    name: "Booking Confirmation",
    subject: `Booking Confirmed — ${b.property_title} · #${b.id}`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Booking Confirmed</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;}
body{margin:0;padding:0;font-family:'Inter','Segoe UI',Arial,sans-serif;background:#f2f4f7;color:#1a1a1a;}
.outer{background:#f2f4f7;padding:32px 16px;}
.card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(31,58,95,0.08);}
.header{background:#1F3A5F;padding:32px 36px;text-align:center;}
.header-label{color:#2FA4A9;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-top:14px;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
.banner{background:#2FA4A9;padding:14px 36px;}
.banner h2{margin:0;color:#fff;font-size:18px;font-weight:700;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
.banner p{margin:4px 0 0;color:rgba(255,255,255,0.9);font-size:13px;font-family:'Inter','Segoe UI',Arial,sans-serif;}
.content{padding:36px 36px 28px;}
.greeting{font-size:15px;color:#5F6B7A;margin:0 0 20px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;}
.section-title{font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;color:#2FA4A9;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #E6E9EE;}
.detail-grid{width:100%;border-collapse:collapse;}
.detail-grid td{padding:10px 0;font-size:13px;border-bottom:1px solid #E6E9EE;font-family:'Inter','Segoe UI',Arial,sans-serif;vertical-align:top;}
.detail-grid tr:last-child td{border-bottom:none;}
.lbl{font-weight:600;color:#1F3A5F;width:42%;}
.val{color:#4a5666;padding-left:12px;}
.total-row td{background:#1F3A5F;color:#ffffff !important;font-weight:700;font-size:15px;border:none !important;padding:14px 0;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
.badge{display:inline-block;padding:4px 14px;border-radius:9999px;font-size:11px;font-weight:700;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;letter-spacing:0.5px;}
.note{background:#f2f4f7;padding:14px 18px;border-radius:12px;font-size:12px;color:#5F6B7A;margin:20px 0;font-family:'Inter','Segoe UI',Arial,sans-serif;}
.cta-btn{display:inline-block;padding:14px 40px;background:#2FA4A9;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" class="outer"><tr><td align="center">
<div class="card">
  <div class="header">
    ${_logoImg}
    <div class="header-label">BOOKING CONFIRMED</div>
  </div>
  <div class="banner"><h2>🎉 Your booking is confirmed!</h2><p>${b.property_title} · ${b.nights} nights</p></div>
  <div class="content">
    <p class="greeting">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>, your villa booking has been confirmed. Here's your complete booking summary.</p>
    <p class="section-title">📋 Booking Details</p>
    <table class="detail-grid">
      <tr><td class="lbl">Booking ID</td><td class="val" style="font-family:'Courier New',monospace;font-size:12px;color:#1F3A5F;font-weight:700;">${b.id}</td></tr>
      <tr><td class="lbl">Status</td><td class="val"><span class="badge" style="background:#16a34a;color:#fff;">CONFIRMED</span></td></tr>
      <tr><td class="lbl">Property</td><td class="val"><strong style="color:#1F3A5F;">${b.property_title}</strong></td></tr>
      <tr><td class="lbl">Address</td><td class="val">${b.address}, ${b.city}, ${b.state} − ${b.pincode}</td></tr>
      <tr><td class="lbl">Check-in</td><td class="val"><strong>${new Date(b.check_in).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong> at ${b.check_in_time}</td></tr>
      <tr><td class="lbl">Check-out</td><td class="val"><strong>${new Date(b.check_out).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong> at ${b.check_out_time}</td></tr>
      <tr><td class="lbl">Duration</td><td class="val">${b.nights} nights</td></tr>
      <tr><td class="lbl">Guests</td><td class="val">${b.guest_count} Adults, ${b.children_count} Children</td></tr>
    </table>
    <p class="section-title">💳 Payment Summary</p>
    <table class="detail-grid">
      <tr><td class="lbl">Base Amount</td><td class="val">₹${parseFloat(b.base_amount).toLocaleString("en-IN")}</td></tr>
      <tr><td class="lbl">GST (18%)</td><td class="val">₹${parseFloat(b.gst_amount).toLocaleString("en-IN")}</td></tr>
      <tr><td class="lbl">Service Charge</td><td class="val">₹${parseFloat(b.service_charge).toLocaleString("en-IN")}</td></tr>
      <tr class="total-row"><td style="padding:14px 0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">Total Paid</td><td style="padding:14px 0 14px 12px;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;color:#2FA4A9;">₹${parseFloat(b.total_amount).toLocaleString("en-IN")}</td></tr>
    </table>
    <div class="note">📌 <strong>Payment ID:</strong> ${b.razorpay_order_id} &nbsp;|&nbsp; <strong>Status:</strong> Paid ✓</div>
    <p style="margin:12px 0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:13px;"><strong style="color:#1F3A5F;">Check-in time:</strong> ${b.check_in_time} onwards &nbsp;|&nbsp; <strong style="color:#1F3A5F;">Check-out time:</strong> ${b.check_out_time}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center">
      <a href="${FRONTEND_URL}/bookings/${b.id}" class="cta-btn">View Booking Details</a>
    </td></tr></table>
    <p style="font-size:13px;color:#5F6B7A;margin-top:20px;font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.6;">
      You'll receive a check-in reminder 24 hours before your arrival with property incharge contact details. For any assistance, reply to this email or reach us at <a href="mailto:support@zevio.in" style="color:#2FA4A9;">support@zevio.in</a>.
    </p>
  </div>
  ${_brandFooter()}
</div></td></tr></table></body></html>`,
  });
}

// 2. Booking Cancellation
if (only("cancellation")) {
  const b = mockBooking;
  emails.push({
    name: "Booking Cancellation",
    subject: `Booking Cancelled — ${b.property_title}`,
    html:
      _emailOpen("Booking Cancelled") +
      _emailHeader("BOOKING CANCELLED") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>,</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your booking has been cancelled. We're sorry to hear that. Here's a summary:
        </p>
        ${_st("Cancelled Booking")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Booking ID", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#1F3A5F;">${b.id}</span>`)}
          ${_dr("Property", b.property_title)}
          ${_dr("Check-in", new Date(b.check_in).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "long", day: "numeric" }))}
          ${_dr("Check-out", new Date(b.check_out).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "long", day: "numeric" }))}
          ${_dr("Status", _badge("CANCELLED", "#dc2626"), true)}
        </table>
        ${_notice("💡 If you believe this was a mistake or need further assistance, please contact us at <a href='mailto:support@zevio.in' style='color:#2FA4A9;'>support@zevio.in</a> and we'll be happy to help.")}
        ${_btn(`${FRONTEND_URL}/properties`, "Browse Other Villas")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 3. Refund Email
if (only("refund")) {
  const b = mockBooking;
  const refundAmount = 20000;
  emails.push({
    name: "Refund Processed",
    subject: `Refund Processed — ₹${refundAmount.toLocaleString("en-IN")} · Booking #${b.id}`,
    html:
      _emailOpen("Refund Processed") +
      _emailHeader("REFUND PROCESSED") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>,</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Good news! Your refund for the cancelled booking has been processed.
        </p>
        ${_st("Refund Details")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Booking ID", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#1F3A5F;">${b.id}</span>`)}
          ${_dr("Property", b.property_title)}
          ${_dr("Refund Amount", `<span style="font-size:16px;font-weight:700;color:#16a34a;">₹${refundAmount.toLocaleString("en-IN")}</span>`)}
          ${_dr("Refund Status", _badge("PROCESSED", "#16a34a"))}
          ${_dr("Timeline", "3–5 business days to your original payment method", true)}
        </table>
        ${_notice("💡 The refund will be credited to your original payment source within <strong>3–5 business days</strong>. If you don't receive it by then, please contact your bank or reach us at <a href='mailto:support@zevio.in' style='color:#2FA4A9;'>support@zevio.in</a>.")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 4. Booking Expiry
if (only("expiry")) {
  emails.push({
    name: "Booking Expiry",
    subject: "Pending Booking Expired — Zevio Villa Booking",
    html:
      _emailOpen("Booking Expired") +
      _emailHeader("BOOKING EXPIRED") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hi <strong style="color:#1F3A5F;">Ranjith</strong>,</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Unfortunately, your pending booking has expired because payment was not completed in time.
        </p>
        ${_st("Expired Booking")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Property", mockBooking.property_title)}
          ${_dr("Booking Amount", `₹${parseFloat(mockBooking.total_amount).toLocaleString()}`)}
          ${_dr("Status", _badge("EXPIRED", "#dc2626"), true)}
        </table>
        ${_notice("💡 <strong>No worries!</strong> You can create a new booking anytime — the property may still be available for your preferred dates.")}
        ${_btn(`${FRONTEND_URL}/properties/prop-test-001`, "Browse Property Again")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 5. Check-in Reminder (24h)
if (only("checkin")) {
  const b = mockBooking;
  const hoursBeforeCheckIn = 24;
  emails.push({
    name: "Check-in Reminder (24h)",
    subject: `Check-in Reminder (24 hours) — ${b.property_title}`,
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;}body{margin:0;padding:0;font-family:'Inter','Segoe UI',Arial,sans-serif;background:#f2f4f7;}
.card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(31,58,95,0.08);}
.header{background:#1F3A5F;padding:32px 36px;text-align:center;}
.header-label{color:#2FA4A9;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-top:14px;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
.urgency-bar{padding:14px 36px;}
.urgency-h24{background:#e6f7f8;border-bottom:2px solid #2FA4A9;}
.urgency-h6{background:#1F3A5F;}
.urgency-text{font-size:14px;font-weight:600;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;}
.urgency-h24 .urgency-text{color:#1F3A5F;}.urgency-h6 .urgency-text{color:#ffffff;}
.content{padding:36px 36px 28px;}
.st{font-size:11px;font-weight:700;color:#2FA4A9;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #E6E9EE;}
.dt{width:100%;border-collapse:collapse;}
.dt td{padding:10px 0;font-size:13px;border-bottom:1px solid #E6E9EE;vertical-align:top;}
.dt .lbl{font-weight:600;color:#1F3A5F;width:42%;}
.dt .val{color:#4a5666;padding-left:12px;}
.dt tr:last-child td{border-bottom:none;}
.contact-card{background:#f2f4f7;border-radius:12px;padding:18px 20px;margin:12px 0;}
.contact-card.secondary{background:#f2f4f7;}
.contact-card h4{margin:0 0 12px;color:#1F3A5F;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;}
.contact-row{display:flex;padding:7px 0;font-size:13px;border-bottom:1px solid #E6E9EE;}
.contact-row:last-child{border-bottom:none;}
.contact-lbl{font-weight:600;color:#1F3A5F;min-width:110px;}
.contact-row a{color:#2FA4A9;text-decoration:none;}
.guide-box{background:#f2f4f7;border-radius:12px;padding:16px 20px;margin:12px 0;font-size:13px;color:#4a5666;line-height:1.7;}
.reminder-box{background:#e6f7f8;border-radius:10px;border:1px solid #b8e8ea;padding:16px 20px;margin:20px 0;}
.reminder-box p{margin:0 0 8px;font-size:13px;color:#1F3A5F;font-weight:700;}
.reminder-box ul{margin:0;padding-left:18px;}
.reminder-box li{font-size:13px;color:#4a5666;padding:4px 0;}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:32px 16px;"><tr><td align="center">
<div class="card">
  <div class="header">${_logoImg}<div class="header-label">CHECK-IN REMINDER</div></div>
  <div class="urgency-bar urgency-h24">
    <span class="urgency-text">⏰ &nbsp;Your stay begins tomorrow! We look forward to welcoming you.</span>
  </div>
  <div class="content">
    <p style="font-size:15px;color:#5F6B7A;margin:0 0 4px;line-height:1.6;">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>,</p>
    <p style="font-size:14px;color:#4a5666;margin:4px 0 0;line-height:1.6;">Here's everything you need for your upcoming stay at <strong style="color:#1F3A5F;">${b.property_title}</strong>.</p>
    <p class="st">📋 Stay Details</p>
    <table class="dt">
      <tr><td class="lbl">Booking ID</td><td class="val" style="font-family:'Courier New',monospace;font-size:12px;color:#1F3A5F;font-weight:700;">${b.id}</td></tr>
      <tr><td class="lbl">Property</td><td class="val"><strong style="color:#1F3A5F;">${b.property_title}</strong></td></tr>
      <tr><td class="lbl">Address</td><td class="val">${b.address}, ${b.city}, ${b.state} − ${b.pincode}</td></tr>
      <tr><td class="lbl">Check-in</td><td class="val"><strong>${new Date(b.check_in).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong></td></tr>
      <tr><td class="lbl">Check-in Time</td><td class="val">${b.check_in_time} onwards</td></tr>
      <tr><td class="lbl">Check-out</td><td class="val">${new Date(b.check_out).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
      <tr><td class="lbl">Check-out Time</td><td class="val">${b.check_out_time}</td></tr>
      <tr><td class="lbl">Guests</td><td class="val">${b.guest_count} Adults, ${b.children_count} Children</td></tr>
      <tr><td class="lbl">Total Nights</td><td class="val">${b.nights}</td></tr>
    </table>
    <p class="st">👤 Property Incharge</p>
    <div class="contact-card">
      <h4>Primary Contact</h4>
      <div class="contact-row"><span class="contact-lbl">Name</span><span>${b.primary_incharge_name}</span></div>
      <div class="contact-row"><span class="contact-lbl">Phone</span><span><a href="tel:${b.primary_incharge_phone}">${b.primary_incharge_phone}</a></span></div>
      <div class="contact-row"><span class="contact-lbl">Email</span><span><a href="mailto:${b.primary_incharge_email}">${b.primary_incharge_email}</a></span></div>
      <div class="contact-row"><span class="contact-lbl">WhatsApp</span><span><a href="https://wa.me/${b.primary_incharge_whatsapp.replace(/[^0-9]/g, "")}">${b.primary_incharge_whatsapp}</a></span></div>
    </div>
    <div class="contact-card secondary">
      <h4>Secondary Contact (Backup)</h4>
      <div class="contact-row"><span class="contact-lbl">Name</span><span>${b.secondary_incharge_name}</span></div>
      <div class="contact-row"><span class="contact-lbl">Phone</span><span><a href="tel:${b.secondary_incharge_phone}">${b.secondary_incharge_phone}</a></span></div>
    </div>
    <p class="st">🛡️ Safety Information</p>
    <div class="guide-box">${b.safety_information}</div>
    <p class="st">📍 Local Area Information</p>
    <div class="guide-box">${b.local_area_info}</div>
    <div class="reminder-box">
      <p>🌟 Important Reminders</p>
      <ul>
        <li>Carry valid government ID proof (Aadhar / Passport)</li>
        <li>Reach out to property incharge for any assistance</li>
        <li>Follow house rules for a pleasant stay</li>
        <li>Have a wonderful time at ${b.property_title}! 🎉</li>
      </ul>
    </div>
  </div>
  ${_brandFooter()}
</div></td></tr></table></body></html>`,
  });
}

// 6. Check-out Reminder
if (only("checkout")) {
  const b = mockBooking;
  emails.push({
    name: "Check-out Reminder",
    subject: `Check-out Reminder — ${b.property_title}`,
    html:
      _emailOpen("Check-out Reminder") +
      _emailHeader("CHECK-OUT REMINDER") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>,</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          We hope you had a wonderful stay at <strong style="color:#1F3A5F;">${b.property_title}</strong>!<br>
          A gentle reminder — your check-out is <strong>tomorrow at ${b.check_out_time}</strong>.
        </p>
        ${_st("✅ Check-out Checklist")}
        ${_box(`<ul style="margin:0;padding-left:20px;font-family:${_F};">
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Please vacate the property by <strong>${b.check_out_time}</strong></li>
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Turn off all lights, fans, and AC</li>
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Lock all doors and windows</li>
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Return keys to property incharge</li>
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Take all your belongings with you</li>
          <li style="padding:6px 0;font-size:13px;color:#4a5666;">Leave the property as you found it</li>
        </ul>`)}
        ${_notice(`<p style="margin:0;font-size:13px;color:#1F3A5F;font-family:${_F};">🌟 Thank you for choosing Zevio Villa Booking! You'll receive a review request shortly — your feedback means a lot to us.</p>`)}
        <p style="font-size:13px;color:#5F6B7A;margin:20px 0 0;font-family:${_F};">— Team Zevio</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 7. Review Request
if (only("review")) {
  const b = mockBooking;
  emails.push({
    name: "Review Request",
    subject: `How was your stay at ${b.property_title}? ⭐`,
    html:
      _emailOpen("Share Your Experience") +
      _emailHeader("SHARE YOUR EXPERIENCE") +
      `<tr><td style="padding:36px 36px 28px;text-align:center;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;text-align:left;">Dear <strong style="color:#1F3A5F;">${b.full_name}</strong>,</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;text-align:left;">
          Thank you for choosing Zevio Villa Booking! We hope you had a wonderful experience at:
        </p>
        ${_box(`<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1F3A5F;font-family:${_F};">${b.property_title}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#5F6B7A;font-family:${_F};">${b.city_name}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#4a5666;font-family:${_F};">
            Check-in: <strong>${new Date(b.check_in).toLocaleDateString("en-IN")}</strong> &nbsp;|&nbsp;
            Check-out: <strong>${new Date(b.check_out).toLocaleDateString("en-IN")}</strong>
          </p>`)}
        <p style="font-size:22px;letter-spacing:8px;margin:24px 0 8px;">⭐⭐⭐⭐⭐</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 24px;font-family:${_F};line-height:1.6;">
          Your feedback helps us improve and helps other travelers make better decisions.
        </p>
        ${_btn(`${FRONTEND_URL}/properties/${b.property_id}?review=true&booking=${b.id}`, "Leave a Review")}
        <p style="font-size:13px;color:#5F6B7A;margin:24px 0 0;font-family:${_F};text-align:left;">We'd love to host you again soon! — Team Zevio</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 8. Welcome Email
if (only("welcome")) {
  const loginUrl = `${FRONTEND_URL}/login`;
  emails.push({
    name: "Welcome Email",
    subject: "Welcome to Zevio — Your Account is Ready",
    html:
      _emailOpen("Welcome to Zevio") +
      _emailHeader("WELCOME TO ZEVIO") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">Ranjith Kumar</strong>! 👋</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your <strong>Customer</strong> account has been successfully created by our admin team. You can now log in and start using the Zevio Villa Booking Platform.
        </p>
        ${_st("Your Login Credentials")}
        ${_box(`<table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Email", `<span style="font-family:'Courier New',monospace;font-size:12px;">ranjith.gopafy@gmail.com</span>`)}
          ${_dr("Temporary Password", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#2FA4A9;">TempPass@2025!</span>`, true)}
        </table>`)}
        ${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">For your security, you'll be required to change this temporary password on your first login. Please choose a strong password.</span>`)}
        ${_btn(loginUrl, "Login to Your Account")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">If you didn't expect this email, please contact our support team.</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 9. Password Reset (Admin-triggered)
if (only("pwdreset")) {
  const loginUrl = `${FRONTEND_URL}/login`;
  emails.push({
    name: "Password Reset (Admin)",
    subject: "Zevio — Your Password Has Been Reset",
    html:
      _emailOpen("Password Reset") +
      _emailHeader("PASSWORD RESET") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">Ranjith Kumar</strong>! 👋</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your <strong>Customer</strong> account password has been <strong>reset by an administrator</strong>. Use the temporary password below to sign in.
        </p>
        ${_st("Your New Login Credentials")}
        ${_box(`<table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Email", `<span style="font-family:'Courier New',monospace;font-size:12px;">ranjith.gopafy@gmail.com</span>`)}
          ${_dr("Temporary Password", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#2FA4A9;">Reset@Zevio2025!</span>`, true)}
        </table>`)}
        ${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">You will be prompted to set a new permanent password when you log in.</span>`)}
        ${_btn(loginUrl, "Login & Set New Password")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">If you didn't request this reset, contact support immediately.</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// 10. Forgot Password (user-initiated)
if (only("forgotpwd")) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=sample-reset-token-abc123`;
  emails.push({
    name: "Forgot Password",
    subject: "Reset Your Password — Zevio",
    html:
      _emailOpen("Reset Your Password") +
      _emailHeader("RESET YOUR PASSWORD") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">Ranjith Kumar</strong>! 👋</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          We received a request to reset the password for your Zevio account. Click the button below to set a new password.
        </p>
        ${_btn(resetUrl, "Reset Password")}
        <p style="font-size:13px;color:#4a5666;margin:16px 0;font-family:${_F};">
          Or copy and paste this link:<br>
          <a href="${resetUrl}" style="color:#2FA4A9;word-break:break-all;">${resetUrl}</a>
        </p>
        ${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">This link expires in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</span>`)}
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  });
}

// ─── Send all emails ───────────────────────────────────────────────────────
console.log(
  `\n📧 Sending ${emails.length} test email(s) to ${RECIPIENTS.length} recipients\n`,
);

let passed = 0;
let failed = 0;

for (const em of emails) {
  try {
    const senderAddress =
      process.env.SENDER_BOOKINGS ||
      process.env.SENDER_SYSTEM ||
      `noreply@notify.zevio.in`;

    await transporter.sendMail({
      from: `"Zevio Villa Booking" <${senderAddress}>`,
      to: RECIPIENTS.join(", "),
      subject: `[TEST] ${em.subject}`,
      html: em.html,
    });
    console.log(`  ✅  ${em.name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${em.name}: ${err.message}`);
    failed++;
  }
  // small delay between sends to avoid rate-limit
  await new Promise((r) => setTimeout(r, 500));
}

console.log(
  `\n─── Done: ${passed} sent, ${failed} failed ───────────────────\n`,
);
process.exit(failed > 0 ? 1 : 0);
