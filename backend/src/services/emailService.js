import nodemailer from "nodemailer";
import db from "../config/database.js";
import dotenv from "dotenv";
import { generateInvoicePDF } from "./invoiceService.js";

dotenv.config();

// ─── Brevo SMTP Transporter ────────────────────────────────────────
// Single transporter; the "from" address is chosen per-email based on purpose.
let transporter = null;

if (process.env.BREVO_SMTP_SERVER && process.env.BREVO_SMTP_KEY) {
  // Preferred: Brevo SMTP relay
  transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER,
    port: parseInt(process.env.BREVO_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.BREVO_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
} else if (
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.EMAIL_USER !== "your_email@gmail.com"
) {
  // Fallback: legacy Gmail config
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

// ─── Sender Addresses (purpose-based) ──────────────────────────────
export const SENDERS = {
  SYSTEM: `"Zevio" <${process.env.SENDER_SYSTEM || "noreply@notify.zevio.in"}>`,
  BOOKINGS: `"Zevio Bookings" <${process.env.SENDER_BOOKINGS || "bookings@notify.zevio.in"}>`,
  ALERTS: `"Zevio Alerts" <${process.env.SENDER_ALERTS || "alerts@notify.zevio.in"}>`,
};

// Admin inbox — all admin notifications go here
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@zevio.in";

// ─── Brand / Design Helpers ────────────────────────────────────────────────

// Load logo once at module init
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __dirEmail = path.dirname(fileURLToPath(import.meta.url));
let _logoBase64 = null;
try {
  _logoBase64 = readFileSync(
    path.join(__dirEmail, "../../public/logo.png"),
  ).toString("base64");
} catch (_) {}

/** Logo text fallback for email clients that strip data URIs */
export const _logoImg = `<span style="font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;font-size:28px;font-weight:800;letter-spacing:3px;color:#ffffff;">ZEVIO</span>`;

/** Branded footer table */
export const _brandFooter = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:#1F3A5F;">
    <tr><td style="padding:24px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="65%" style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:11px;color:#E6E9EE;line-height:1.7;">
            <strong style="color:#2FA4A9;">ZEVIO</strong> &nbsp;·&nbsp; Premium Villa Stays<br>
            Navarathna Agrahara, Bettahalasur Post, Bangalore North – 562157<br>
            <a href="mailto:support@zevio.in" style="color:#2FA4A9;text-decoration:none;">support@zevio.in</a>
            &nbsp;·&nbsp;
            <a href="https://zevio.in" style="color:#2FA4A9;text-decoration:none;">www.zevio.in</a>
          </td>
          <td width="35%" align="right" style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:10px;color:#E6E9EE;vertical-align:bottom;">
            © ${new Date().getFullYear()} Zevio. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;

// Shared design tokens
const _F = `'Inter','Segoe UI',Arial,sans-serif`; // body
const _FH = `'Poppins','Inter','Segoe UI',Arial,sans-serif`; // headings
const _GF = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap`;

/** Open full HTML email shell (bg:#f2f4f7, card 16px radius + shadow) */
const _emailOpen = (title = "Zevio") =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>` +
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${_GF}" rel="stylesheet">` +
  `<style>@import url('${_GF}');*{box-sizing:border-box;}body{margin:0;padding:0;font-family:${_F};background:#f2f4f7;}</style></head>` +
  `<body><table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:32px 16px;">` +
  `<tr><td align="center"><table cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(31,58,95,0.08);">`;

/** Close the email shell */
const _emailClose = () => `</table></td></tr></table></body></html>`;

/** Navy header row with logo + teal label */
const _emailHeader = (label = "") =>
  `<tr><td style="background:#1F3A5F;padding:32px 36px;text-align:center;">` +
  `${_logoImg}` +
  (label
    ? `<div style="margin-top:14px;font-family:${_FH};font-size:11px;font-weight:700;color:#2FA4A9;letter-spacing:2.5px;text-transform:uppercase;">${label}</div>`
    : ``) +
  `</td></tr>`;

/** Teal section title */
const _st = (text) =>
  `<p style="font-family:${_FH};font-size:11px;font-weight:700;color:#2FA4A9;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #E6E9EE;">${text}</p>`;

/** Detail row (two cells) */
const _dr = (label, val, last = false) =>
  `<tr><td style="font-family:${_F};padding:10px 0;font-size:13px;font-weight:600;color:#1F3A5F;width:42%;vertical-align:top;${last ? "" : "border-bottom:1px solid #E6E9EE;"}">${label}</td>` +
  `<td style="font-family:${_F};padding:10px 0 10px 12px;font-size:13px;color:#4a5666;${last ? "" : "border-bottom:1px solid #E6E9EE;"}">${val}</td></tr>`;

/** Info box (light bg) */
const _box = (content) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;"><tr><td style="background:#f2f4f7;border-radius:12px;padding:16px 20px;font-family:${_F};font-size:13px;color:#4a5666;line-height:1.7;">${content}</td></tr></table>`;

/** Teal notice box */
const _notice = (content) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr><td style="background:#e6f7f8;border-radius:10px;border:1px solid #b8e8ea;padding:16px 20px;font-family:${_F};font-size:13px;color:#1F3A5F;line-height:1.6;">${content}</td></tr></table>`;

/** CTA button */
const _btn = (url, text, bg = "#2FA4A9") =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td align="center">` +
  `<a href="${url}" style="display:inline-block;padding:14px 40px;background:${bg};color:#ffffff !important;text-decoration:none;border-radius:8px;font-family:${_FH};font-weight:700;font-size:15px;line-height:1.2;mso-padding-alt:0;">${text}</a>` +
  `</td></tr></table>`;

/** Status badge pill */
const _badge = (text, bg = "#2FA4A9", fg = "#fff") =>
  `<span style="display:inline-block;padding:4px 14px;background:${bg};color:${fg};border-radius:9999px;font-family:${_FH};font-size:11px;font-weight:700;letter-spacing:0.5px;">${text}</span>`;

// Verify transporter
export const verifyEmailConfig = async () => {
  if (!transporter) {
    console.log("⚠️  Email service not configured (using default credentials)");
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration failed:", error.message);
    return false;
  }
};

// Send booking confirmation email with PDF invoice attachment
export const sendBookingConfirmationEmail = async (bookingId) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    // Get booking details
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.title as property_title,
        p.area as property_area,
        c.name as city_name,
        c.state as city_state
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN cities c ON p.city_id = c.id
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const formatDate = (d) => {
      if (!d) return "N/A";
      // mysql2 returns DATE columns as JS Date at midnight IST (= 18:30 UTC prev day).
      // Add IST offset (+05:30) so the date displays correctly on a UTC server.
      return new Date(new Date(d).getTime() + 19800000).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
    };
    const formatCurrency = (amt) =>
      `₹${parseFloat(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Generate PDF invoice
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoicePDF(bookingId);
      console.log(`✅ Invoice PDF generated for booking ${bookingId}`);
    } catch (pdfErr) {
      console.error(
        "⚠️  PDF generation failed, sending email without attachment:",
        pdfErr.message,
      );
    }

    const locationParts = [
      booking.property_area,
      booking.city_name,
      booking.city_state,
    ].filter(Boolean);

    const mailOptions = {
      from: SENDERS.BOOKINGS,
      to: booking.email,
      subject: `Booking Confirmed - ${booking.property_title} | Zevio`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f2f4f7; color: #1a1a1a; }
            .wrapper { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(31,58,95,0.08); }
            .header { background: #1F3A5F; padding: 32px 36px; text-align: center; }
            .header-label { color: #2FA4A9; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 14px; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .banner { background: #2FA4A9; padding: 18px 36px; }
            .banner h2 { margin: 0; color: #fff; font-size: 18px; font-weight: 700; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .banner p { margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
            .body-content { padding: 32px 36px 28px; }
            .greeting { font-size: 15px; color: #5F6B7A; margin: 0 0 20px; line-height: 1.6; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
            .section-title { font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #2FA4A9; text-transform: uppercase; letter-spacing: 1.5px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #E6E9EE; }
            .detail-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .detail-grid td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #E6E9EE; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; vertical-align: top; }
            .detail-grid tr:last-child td { border-bottom: none; }
            .detail-label { font-weight: 600; color: #1F3A5F; width: 42%; }
            .detail-value { color: #4a5666; padding-left: 12px; }
            .total-row td { background: #1F3A5F; color: #ffffff !important; font-weight: 700; font-size: 15px; border: none !important; padding: 14px 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
            .discount-row td { color: #16a34a !important; }
            .badge { display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; letter-spacing: 0.5px; }
            .badge-paid { background: #16a34a; color: #fff; }
            .badge-pending { background: #dc2626; color: #fff; }
            .cta-btn { display: inline-block; padding: 14px 40px; background: #2FA4A9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .note { background: #f2f4f7; padding: 14px 18px; border-radius: 12px; font-size: 12px; color: #5F6B7A; margin: 20px 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
          </style>
        </head>
        <body>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:32px 16px;">
            <tr><td align="center">
              <div class="wrapper">
                <div class="header">
                  ${_logoImg}
                  <div class="header-label">BOOKING INVOICE</div>
                </div>

                <div class="banner">
                  <h2>✅ Booking Confirmed!</h2>
                  <p>Your reservation has been confirmed successfully.</p>
                </div>

                <div class="body-content">
                  <p class="greeting">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>

                  <div class="section-title">Stay Details</div>
                  <table class="detail-grid">
                    <tr><td class="detail-label">Property</td><td class="detail-value"><strong style="color:#1F3A5F;">${booking.property_title}</strong></td></tr>
                    <tr><td class="detail-label">Location</td><td class="detail-value">${locationParts.join(", ")}</td></tr>
                    <tr><td class="detail-label">Check-in</td><td class="detail-value">${formatDate(booking.check_in)}</td></tr>
                    <tr><td class="detail-label">Check-out</td><td class="detail-value">${formatDate(booking.check_out)}</td></tr>
                    <tr><td class="detail-label">Duration</td><td class="detail-value">${booking.nights} Night${booking.nights !== 1 ? "s" : ""}</td></tr>
                    <tr><td class="detail-label">Guests</td><td class="detail-value">${booking.guest_count || 0} Adult${(booking.guest_count || 0) !== 1 ? "s" : ""}${booking.children_count > 0 ? `, ${booking.children_count} Children` : ""}${booking.infants_count > 0 ? `, ${booking.infants_count} Infant${booking.infants_count !== 1 ? "s" : ""}` : ""}</td></tr>
                    <tr><td class="detail-label">Booking ID</td><td class="detail-value" style="font-family:'Courier New',monospace;font-size:12px;color:#1F3A5F;font-weight:700;">${booking.id.substring(0, 8).toUpperCase()}</td></tr>
                  </table>

                  <div class="section-title">Price Breakdown</div>
                  <table class="detail-grid">
                    <tr><td class="detail-label">Base Amount (${booking.nights} night${booking.nights !== 1 ? "s" : ""})</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.base_amount)}</td></tr>
                    ${parseFloat(booking.extra_guest_charges || 0) > 0 ? `<tr><td class="detail-label">Extra Guest Charges</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.extra_guest_charges)}</td></tr>` : ""}
                    ${parseFloat(booking.extra_children_charges || 0) > 0 ? `<tr><td class="detail-label">Extra Children Charges</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.extra_children_charges)}</td></tr>` : ""}
                    ${parseFloat(booking.service_charge || 0) > 0 ? `<tr><td class="detail-label">Service Charge (5%)</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.service_charge)}</td></tr>` : ""}
                    <tr><td class="detail-label">GST</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.gst_amount)}</td></tr>
                    ${parseFloat(booking.coupon_discount || 0) > 0 ? `<tr class="discount-row"><td class="detail-label">Coupon Discount${booking.coupon_code ? ` (${booking.coupon_code})` : ""}</td><td class="detail-value" style="text-align:right;color:#16a34a;">-${formatCurrency(booking.coupon_discount)}</td></tr>` : ""}
                    ${parseFloat(booking.discount_amount || 0) > 0 && parseFloat(booking.coupon_discount || 0) === 0 ? `<tr class="discount-row"><td class="detail-label">Discount</td><td class="detail-value" style="text-align:right;color:#16a34a;">-${formatCurrency(booking.discount_amount)}</td></tr>` : ""}
                    <tr class="total-row"><td style="padding-left:0;">TOTAL AMOUNT</td><td style="text-align:right;">${formatCurrency(booking.total_amount)}</td></tr>
                  </table>

                  <p style="margin:12px 0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:13px;">
                    Payment Status: <span class="badge ${booking.payment_status === "completed" ? "badge-paid" : "badge-pending"}">${booking.payment_status === "completed" ? "PAID" : "PENDING"}</span>
                  </p>

                  <div class="note">
                    📄 Your detailed booking invoice is attached as a PDF. Please save it for your records.
                  </div>

                  <center>
                    <a href="${process.env.FRONTEND_URL || "https://zevio.in"}/dashboard/bookings/${booking.id}" class="cta-btn">View Booking Details</a>
                  </center>

                  <p style="font-size:13px;color:#5F6B7A;margin-top:20px;font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.6;">
                    We look forward to hosting you!<br>
                    — Team Zevio
                  </p>
                </div>

                ${_brandFooter()}
              </div>
            </td></tr>
          </table>
        </body>
        </html>
      `,
      attachments: pdfBuffer
        ? [
            {
              filename: `Zevio_Invoice_${booking.id.substring(0, 8).toUpperCase()}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    throw error;
  }
};

// Send booking notification email to the vendor
export const sendVendorBookingNotification = async (bookingId) => {
  if (!transporter) {
    console.log(
      "⚠️  Vendor notification not sent: Email service not configured",
    );
    return false;
  }

  try {
    const [rows] = await db.query(
      `SELECT
         b.id,
         DATE_FORMAT(b.check_in,  '%Y-%m-%d') AS check_in,
         DATE_FORMAT(b.check_out, '%Y-%m-%d') AS check_out,
         b.nights,
         b.guest_count,
         b.children_count,
         b.infants_count,
         u.full_name  AS guest_name,
         p.title      AS property_title,
         v.name       AS vendor_name,
         v.email      AS vendor_email
       FROM bookings b
       INNER JOIN users       u ON b.user_id      = u.id
       INNER JOIN properties  p ON b.property_id  = p.id
       INNER JOIN vendors     v ON p.vendor_id     = v.id
       WHERE b.id = ?`,
      [bookingId],
    );

    if (rows.length === 0) {
      console.warn(
        `⚠️  Vendor notification skipped: booking ${bookingId} not found`,
      );
      return false;
    }

    const b = rows[0];

    if (!b.vendor_email) {
      console.warn(
        `⚠️  Vendor notification skipped: no email for vendor of booking ${bookingId}`,
      );
      return false;
    }

    const formatDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";

    const guestStr = [
      `${b.guest_count || 0} Adult${(b.guest_count || 0) !== 1 ? "s" : ""}`,
      b.children_count > 0 ? `${b.children_count} Children` : null,
      b.infants_count > 0
        ? `${b.infants_count} Infant${b.infants_count !== 1 ? "s" : ""}`
        : null,
    ]
      .filter(Boolean)
      .join(", ");

    const bookingRef = b.id.substring(0, 8).toUpperCase();

    const html =
      _emailOpen("New Booking – Zevio") +
      _emailHeader("NEW BOOKING") +
      `<tr><td style="background:#2FA4A9;padding:18px 36px;">
         <h2 style="margin:0;font-family:'Poppins','Inter','Segoe UI',Arial,sans-serif;font-size:18px;font-weight:700;color:#fff;">🎉 You have a new booking!</h2>
         <p style="margin:4px 0 0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.9);">
           A guest has confirmed a stay at your property.
         </p>
       </td></tr>` +
      `<tr><td style="padding:32px 36px 28px;">` +
      `<p style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;color:#5F6B7A;margin:0 0 20px;line-height:1.6;">
         Dear <strong style="color:#1F3A5F;">${b.vendor_name}</strong>,<br>
         A new booking has been confirmed for your property. Here are the details:
       </p>` +
      _st("Booking Details") +
      `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">` +
      _dr(
        "Booking ID",
        `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#1F3A5F;">${bookingRef}</span>`,
      ) +
      _dr(
        "Guest Name",
        `<strong style="color:#1F3A5F;">${b.guest_name}</strong>`,
      ) +
      _dr("Property", b.property_title) +
      _dr("Check-in", formatDate(b.check_in)) +
      _dr("Check-out", formatDate(b.check_out)) +
      _dr("Duration", `${b.nights} Night${b.nights !== 1 ? "s" : ""}`) +
      _dr("Guests", guestStr, true) +
      `</table>` +
      _notice(`Please ensure the property is ready before the guest's check-in date.
               If you have any questions, contact us at
               <a href="mailto:support@zevio.in" style="color:#1F3A5F;font-weight:600;">support@zevio.in</a>.`) +
      `<p style="font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:13px;color:#5F6B7A;margin-top:20px;line-height:1.6;">
         Thank you for being a part of Zevio!<br>— Team Zevio
       </p>` +
      `</td></tr>` +
      `<tr><td style="padding:0;">${_brandFooter()}</td></tr>` +
      _emailClose();

    await transporter.sendMail({
      from: SENDERS.BOOKINGS,
      to: b.vendor_email,
      subject: `New Booking Confirmed – ${b.property_title} | Zevio`,
      html,
    });

    console.log(`✅ Vendor booking notification sent to ${b.vendor_email}`);
    return true;
  } catch (error) {
    console.error("Failed to send vendor booking notification:", error);
    return false;
  }
};

// Send cancellation email
export const sendCancellationEmail = async (bookingId) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.title as property_title
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: "Booking Cancelled - Zevio Villa Booking",
      html:
        _emailOpen("Booking Cancelled") +
        _emailHeader("BOOKING CANCELLED") +
        `<tr><td style="padding:36px 36px 28px;">
          <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
            We're sorry to inform you that your booking has been cancelled.
          </p>
          ${_st("Cancelled Booking")}
          ${_box(
            `<strong style="font-family:${_F};color:#1F3A5F;display:block;margin-bottom:8px;">${booking.property_title}</strong>` +
              `<span style="font-family:${_F};">Booking ID: <strong>${booking.id}</strong></span>`,
          )}
          ${_notice(
            "If you are entitled to a refund, the amount will be processed within 5–7 business days. " +
              `For any questions, reach us at <a href="mailto:support@zevio.in" style="color:#2FA4A9;">support@zevio.in</a>.`,
          )}
          <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
        </td></tr>` +
        `<tr><td>${_brandFooter()}</td></tr>` +
        _emailClose(),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    throw error;
  }
};

// Send refund processed email
export const sendRefundEmail = async (bookingId, refundAmount) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.title as property_title
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: "Refund Processed - Zevio Villa Booking",
      html:
        _emailOpen("Refund Processed") +
        _emailHeader("REFUND PROCESSED") +
        `<tr><td style="padding:36px 36px 28px;">
          <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
            Great news — your refund has been processed successfully.
          </p>
          ${_st("Refund Details")}
          <table width="100%" cellpadding="0" cellspacing="0">
            ${_dr("Property", booking.property_title)}
            ${_dr("Booking ID", `<span style="font-family:'Courier New',monospace;font-size:12px;">${booking.id}</span>`)}
            ${_dr("Refund Amount", `<strong style="color:#16a34a;font-size:15px;">₹${refundAmount.toFixed(2)}</strong>`, true)}
          </table>
          ${_notice(
            "⏱️ The amount will be credited to your original payment method within <strong>5–7 business days</strong>. " +
              `For queries, contact <a href="mailto:support@zevio.in" style="color:#2FA4A9;">support@zevio.in</a>.`,
          )}
          <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
        </td></tr>` +
        `<tr><td>${_brandFooter()}</td></tr>` +
        _emailClose(),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Refund email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send refund email:", error);
    throw error;
  }
};

// Send contact form enquiry to support@zevio.in
export const sendContactEmail = async ({
  name,
  email,
  phone,
  subject,
  message,
}) => {
  if (!transporter) {
    console.log("⚠️  Contact email not sent: Email service not configured");
    return false;
  }

  const subjectLabels = {
    general: "General Inquiry",
    booking: "Booking Support",
    property: "Property Listing",
    payment: "Payment Issue",
    feedback: "Feedback",
    other: "Other",
  };
  const subjectLabel = subjectLabels[subject] || subject || "Contact Form";

  const mailOptions = {
    from: SENDERS.SYSTEM,
    to: "support@zevio.in",
    replyTo: `"${name}" <${email}>`,
    subject: `[Contact] ${subjectLabel} — ${name}`,
    html:
      _emailOpen("Contact Form Submission") +
      _emailHeader("CONTACT FORM") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          A new contact form submission has been received.
        </p>
        ${_st("Sender Details")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${_dr("Name", name)}
          ${_dr("Email", `<a href="mailto:${email}" style="color:#2FA4A9;text-decoration:none;">${email}</a>`)}
          ${phone ? _dr("Phone", phone) : ""}
          ${_dr("Subject", subjectLabel, true)}
        </table>
        ${_st("Message")}
        ${_box(`<span style="white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`)}
        ${_notice("Reply directly to this email to respond to the sender.")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Zevio Website</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose(),
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `✅ Contact form email forwarded to support@zevio.in (from: ${email})`,
  );
  return true;
};

export default transporter;

// Send check-in reminder email (24h or 6h before check-in)
// Shows property incharge details and guidelines
export const sendCheckInReminderEmail = async (
  bookingId,
  hoursBeforeCheckIn = 24,
) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    // Get booking with property incharge details and guidelines
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        DATE_FORMAT(b.check_in,  '%Y-%m-%d') AS check_in_date,
        DATE_FORMAT(b.check_out, '%Y-%m-%d') AS check_out_date,
        u.full_name, u.email, u.phone,
        p.title as property_title,
        p.address, c.name as city, c.state as state, p.pincode,
        p.maps_location,
        p.check_in_time, p.check_out_time,
        pc1.name  AS primary_incharge_name,
        pc1.phone AS primary_incharge_phone,
        pc1.email AS primary_incharge_email,
        pc1.whatsapp AS primary_incharge_whatsapp,
        pc1.alt_contact AS primary_incharge_alt_contact,
        pc2.name  AS secondary_incharge_name,
        pc2.phone AS secondary_incharge_phone,
        pc2.email AS secondary_incharge_email,
        pc2.whatsapp AS secondary_incharge_whatsapp,
        p.safety_information, p.local_area_info, p.emergency_contacts,
        c.name as city_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_contacts pc1 ON pc1.property_id = p.id AND pc1.contact_type_id = 1 AND pc1.is_active = 1
      LEFT JOIN property_contacts pc2 ON pc2.property_id = p.id AND pc2.contact_type_id = 2 AND pc2.is_active = 1
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];
    const reminderType =
      hoursBeforeCheckIn === 24
        ? "24 hours"
        : hoursBeforeCheckIn === 6
          ? "6 hours"
          : `${hoursBeforeCheckIn} hour${hoursBeforeCheckIn !== 1 ? "s" : ""}`;

    // Parse YYYY-MM-DD string into a local Date (no UTC drift)
    const fmtDate = (s) => {
      if (!s) return "N/A";
      const [y, m, d] = String(s).split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const mailOptions = {
      from: SENDERS.BOOKINGS,
      to: booking.email,
      subject: `Check-in Reminder (${reminderType}) - ${booking.property_title}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f2f4f7; }
            .card { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(31,58,95,0.08); }
            .header { background: #1F3A5F; padding: 32px 36px; text-align: center; }
            .header-label { color: #2FA4A9; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 14px; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .urgency-bar { padding: 14px 36px; }
            .urgency-h24 { background: #e6f7f8; border-bottom: 2px solid #2FA4A9; }
            .urgency-h6  { background: #1F3A5F; }
            .urgency-text { font-size: 14px; font-weight: 600; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .urgency-h24 .urgency-text { color: #1F3A5F; }
            .urgency-h6  .urgency-text { color: #ffffff; }
            .content { padding: 36px 36px 28px; }
            .greeting { font-size: 15px; color: #5F6B7A; margin: 0 0 4px; line-height: 1.6; }
            .st { font-size: 11px; font-weight: 700; color: #2FA4A9; text-transform: uppercase; letter-spacing: 1.5px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #E6E9EE; }
            .dt { width: 100%; border-collapse: collapse; }
            .dt td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #E6E9EE; vertical-align: top; }
            .dt .lbl { font-weight: 600; color: #1F3A5F; width: 42%; }
            .dt .val { color: #4a5666; padding-left: 12px; }
            .dt tr:last-child td { border-bottom: none; }
            .contact-card { background: #f2f4f7; border-radius: 12px; padding: 18px 20px; margin: 12px 0; }
            .contact-card h4 { margin: 0 0 12px; color: #1F3A5F; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif; }
            .contact-row { display: flex; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #E6E9EE; }
            .contact-row:last-child { border-bottom: none; }
            .contact-lbl { font-weight: 600; color: #1F3A5F; min-width: 110px; }
            .contact-row a { color: #2FA4A9; text-decoration: none; }
            .guide-box { background: #f2f4f7; border-radius: 12px; padding: 16px 20px; margin: 12px 0; font-size: 13px; color: #4a5666; line-height: 1.7; }
            .reminder-box { background: #e6f7f8; border-radius: 10px; border: 1px solid #b8e8ea; padding: 16px 20px; margin: 20px 0; }
            .reminder-box p { margin: 0 0 8px; font-size: 13px; color: #1F3A5F; font-weight: 700; }
            .reminder-box ul { margin: 0; padding-left: 18px; }
            .reminder-box li { font-size: 13px; color: #4a5666; padding: 4px 0; }
          </style>
        </head>
        <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:32px 16px;">
          <tr><td align="center">
            <div class="card">
              <div class="header">
                ${_logoImg}
                <div class="header-label">CHECK-IN REMINDER</div>
              </div>

              <div class="urgency-bar ${hoursBeforeCheckIn >= 20 ? "urgency-h24" : "urgency-h6"}">
                <span class="urgency-text">⏰ &nbsp;Your stay begins ${hoursBeforeCheckIn === 24 ? "tomorrow" : hoursBeforeCheckIn === 6 ? "in just 6 hours" : `in approximately ${hoursBeforeCheckIn} hour${hoursBeforeCheckIn !== 1 ? "s" : ""}`}! We look forward to welcoming you.</span>
              </div>

              <div class="content">
                <p class="greeting">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
                <p style="font-size:14px;color:#4a5666;margin:4px 0 0;line-height:1.6;">Here's everything you need for your upcoming stay at <strong style="color:#1F3A5F;">${booking.property_title}</strong>.</p>

                <p class="st">📋 Stay Details</p>
                <table class="dt">
                  <tr><td class="lbl">Booking ID</td><td class="val" style="font-family:'Courier New',monospace;font-size:12px;color:#1F3A5F;font-weight:700;">${booking.id}</td></tr>
                  <tr><td class="lbl">Property</td><td class="val"><strong style="color:#1F3A5F;">${booking.property_title}</strong></td></tr>
                  <tr><td class="lbl">Address</td><td class="val">${booking.address}, ${booking.city}, ${booking.state} − ${booking.pincode}</td></tr>
                  ${booking.maps_location ? `<tr><td class="lbl">Google Maps</td><td class="val"><a href="${booking.maps_location}" style="color:#2FA4A9;font-weight:600;text-decoration:none;">📍 Open in Google Maps</a></td></tr>` : ""}
                  <tr><td class="lbl">Check-in</td><td class="val"><strong>${fmtDate(booking.check_in_date)}</strong></td></tr>
                  <tr><td class="lbl">Check-in Time</td><td class="val">${booking.check_in_time || "2:00 PM"} onwards</td></tr>
                  <tr><td class="lbl">Check-out</td><td class="val">${fmtDate(booking.check_out_date)}</td></tr>
                  <tr><td class="lbl">Check-out Time</td><td class="val">${booking.check_out_time || "11:00 AM"}</td></tr>
                  <tr><td class="lbl">Guests</td><td class="val">${booking.guest_count || 1} Adults${booking.children_count > 0 ? `, ${booking.children_count} Children` : ""}${booking.infants_count > 0 ? `, ${booking.infants_count} Infants` : ""}</td></tr>
                  <tr><td class="lbl">Total Nights</td><td class="val">${booking.nights}</td></tr>
                </table>

                <p class="st">👤 Property Incharge</p>
                <div class="contact-card">
                  <h4>Primary Contact</h4>
                  <div class="contact-row"><span class="contact-lbl">Name</span><span>${booking.primary_incharge_name || "N/A"}</span></div>
                  <div class="contact-row"><span class="contact-lbl">Phone</span><span><a href="tel:${booking.primary_incharge_phone}">${booking.primary_incharge_phone || "N/A"}</a></span></div>
                  <div class="contact-row"><span class="contact-lbl">Email</span><span><a href="mailto:${booking.primary_incharge_email}">${booking.primary_incharge_email || "N/A"}</a></span></div>
                  ${booking.primary_incharge_whatsapp ? `<div class="contact-row"><span class="contact-lbl">WhatsApp</span><span><a href="https://wa.me/${booking.primary_incharge_whatsapp.replace(/[^0-9]/g, "")}">${booking.primary_incharge_whatsapp}</a></span></div>` : ""}
                  ${booking.primary_incharge_alt_contact ? `<div class="contact-row"><span class="contact-lbl">Alt. Contact</span><span><a href="tel:${booking.primary_incharge_alt_contact}">${booking.primary_incharge_alt_contact}</a></span></div>` : ""}
                </div>

                ${
                  booking.secondary_incharge_name
                    ? `
                <div class="contact-card secondary">
                  <h4>Secondary Contact (Backup)</h4>
                  <div class="contact-row"><span class="contact-lbl">Name</span><span>${booking.secondary_incharge_name}</span></div>
                  ${booking.secondary_incharge_phone ? `<div class="contact-row"><span class="contact-lbl">Phone</span><span><a href="tel:${booking.secondary_incharge_phone}">${booking.secondary_incharge_phone}</a></span></div>` : ""}
                  ${booking.secondary_incharge_email ? `<div class="contact-row"><span class="contact-lbl">Email</span><span><a href="mailto:${booking.secondary_incharge_email}">${booking.secondary_incharge_email}</a></span></div>` : ""}
                  ${booking.secondary_incharge_whatsapp ? `<div class="contact-row"><span class="contact-lbl">WhatsApp</span><span><a href="https://wa.me/${booking.secondary_incharge_whatsapp.replace(/[^0-9]/g, "")}">${booking.secondary_incharge_whatsapp}</a></span></div>` : ""}
                </div>`
                    : ""
                }

                ${booking.safety_information ? `<p class="st">🛡️ Safety Information</p><div class="guide-box">${booking.safety_information}</div>` : ""}
                ${booking.local_area_info ? `<p class="st">📍 Local Area Information</p><div class="guide-box">${booking.local_area_info}</div>` : ""}
                ${booking.emergency_contacts ? `<p class="st">🚨 Emergency Contacts</p><div class="guide-box">${booking.emergency_contacts}</div>` : ""}

                <div class="reminder-box">
                  <p>🌟 Important Reminders</p>
                  <ul>
                    <li>Carry valid government ID proof (Aadhar / Passport)</li>
                    <li>Reach out to property incharge for any assistance</li>
                    <li>Follow house rules for a pleasant stay</li>
                    <li>Have a wonderful time at ${booking.property_title}! 🎉</li>
                  </ul>
                </div>
              </div>

              ${_brandFooter()}
            </div>
          </td></tr>
        </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Check-in reminder (${reminderType}) email sent to ${booking.email}`,
    );
  } catch (error) {
    console.error(`Failed to send check-in reminder email:`, error);
    throw error;
  }
};

// Send check-out reminder email (12h before checkout)
export const sendCheckOutReminderEmail = async (bookingId) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.title as property_title,
        p.check_out_time
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: `Check-out Reminder - ${booking.property_title}`,
      html:
        _emailOpen("Check-out Reminder") +
        _emailHeader("CHECK-OUT REMINDER") +
        `<tr><td style="padding:36px 36px 28px;">
          <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
            We hope you had a wonderful stay at <strong style="color:#1F3A5F;">${booking.property_title}</strong>!<br>
            A gentle reminder — your check-out is <strong>tomorrow at ${booking.check_out_time || "11:00 AM"}</strong>.
          </p>
          ${_st("✅ Check-out Checklist")}
          ${_box(`
            <ul style="margin:0;padding-left:20px;font-family:${_F};">
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Please vacate the property by <strong>${booking.check_out_time || "11:00 AM"}</strong></li>
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Turn off all lights, fans, and AC</li>
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Lock all doors and windows</li>
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Return keys to property incharge</li>
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Take all your belongings with you</li>
              <li style="padding:6px 0;font-size:13px;color:#4a5666;">Leave the property as you found it</li>
            </ul>
          `)}
          ${_notice(`<p style="margin:0;font-size:13px;color:#1F3A5F;font-family:${_F};">🌟 Thank you for choosing Zevio Villa Booking! You'll receive a review request shortly — your feedback means a lot to us.</p>`)}
          <p style="font-size:13px;color:#5F6B7A;margin:20px 0 0;font-family:${_F};">— Team Zevio</p>
        </td></tr>` +
        `<tr><td>${_brandFooter()}</td></tr>` +
        _emailClose(),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Check-out reminder email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send check-out reminder email:", error);
    throw error;
  }
};

// Send post-checkout review request email (24h after checkout)
export const sendReviewRequestEmail = async (bookingId) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.id as property_id, p.title as property_title,
        c.name as city_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: `How was your stay at ${booking.property_title}?`,
      html:
        _emailOpen("Review Request") +
        _emailHeader("SHARE YOUR EXPERIENCE") +
        `<tr><td style="padding:36px 36px 28px;text-align:center;">
          <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;text-align:left;">Dear <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;text-align:left;">
            Thank you for choosing Zevio Villa Booking! We hope you had a wonderful experience at:
          </p>
          ${_box(`
            <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1F3A5F;font-family:${_F};">${booking.property_title}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#5F6B7A;font-family:${_F};">${booking.city_name || ""}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#4a5666;font-family:${_F};">
              Check-in: <strong>${new Date(new Date(booking.check_in).getTime() + 19800000).toLocaleDateString("en-IN")}</strong> &nbsp;|&nbsp;
              Check-out: <strong>${new Date(new Date(booking.check_out).getTime() + 19800000).toLocaleDateString("en-IN")}</strong>
            </p>
          `)}
          <p style="font-size:22px;letter-spacing:8px;margin:24px 0 8px;">⭐⭐⭐⭐⭐</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 24px;font-family:${_F};line-height:1.6;">
            Your feedback helps us improve and helps other travelers make better decisions.
          </p>
          ${_btn(
            `${process.env.FRONTEND_URL || process.env.NEXTJS_URL}/villas/${booking.property_id}?review=true&booking=${booking.id}`,
            "Leave a Review",
          )}
          <p style="font-size:13px;color:#5F6B7A;margin:24px 0 0;font-family:${_F};text-align:left;">We'd love to host you again soon! — Team Zevio</p>
        </td></tr>` +
        `<tr><td>${_brandFooter()}</td></tr>` +
        _emailClose(),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Review request email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send review request email:", error);
    throw error;
  }
};

/**
 * Send booking expiry notification email
 * @param {string} bookingId - Booking ID
 */
export const sendBookingExpiryEmail = async (bookingId) => {
  try {
    const [bookings] = await db.query(
      `SELECT 
        b.id, 
        b.user_id, 
        u.email, 
        u.full_name,
        b.property_id, 
        p.title as property_name,
        b.total_amount,
        b.created_at
       FROM bookings b
       INNER JOIN users u ON b.user_id = u.id
       INNER JOIN properties p ON b.property_id = p.id
       WHERE b.id = ?`,
      [bookingId],
    );

    if (bookings.length === 0) {
      console.warn(`❌ Booking ${bookingId} not found for expiry email`);
      return;
    }

    const booking = bookings[0];

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Zevio"}" <${
        process.env.EMAIL_USER
      }>`,
      to: booking.email,
      subject: "Pending Booking Expired - Zevio Villa Booking",
      html:
        _emailOpen("Booking Expired") +
        _emailHeader("BOOKING EXPIRED") +
        `<tr><td style="padding:36px 36px 28px;">
          <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hi <strong style="color:#1F3A5F;">${booking.full_name}</strong>,</p>
          <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
            Unfortunately, your pending booking has expired because payment was not completed in time.
          </p>
          ${_st("Expired Booking")}
          <table width="100%" cellpadding="0" cellspacing="0">
            ${_dr("Property", booking.property_name)}
            ${_dr("Booking Amount", `₹${parseFloat(booking.total_amount || 0).toLocaleString()}`)}
            ${_dr("Status", _badge("EXPIRED", "#dc2626"), true)}
          </table>
          ${_notice(
            "💡 <strong>No worries!</strong> You can create a new booking anytime — the property may still be available for your preferred dates.",
          )}
          ${_btn(
            `${process.env.NEXTJS_URL || "https://zevio.in"}/villas/${booking.property_id}`,
            "Browse Property Again",
          )}
          <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">— Team Zevio</p>
        </td></tr>` +
        `<tr><td>${_brandFooter()}</td></tr>` +
        _emailClose(),
    };

    if (!transporter) {
      console.log("⚠️  Email not sent: Email service not configured");
      return;
    }

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking expiry email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send booking expiry email:", error);
    throw error;
  }
};

/**
 * Generic send email function
 * @param {Object} options - Email options (to, subject, html, text, from)
 */
export const sendEmail = async ({ to, subject, html, text, from }) => {
  if (!transporter) {
    console.log("⚠️  Email not sent: Email service not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: from || SENDERS.SYSTEM,
      to,
      subject,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

/**
 * Send welcome email with temporary password
 * @param {string} email - User's email address
 * @param {string} name - User's full name
 * @param {string} tempPassword - Generated temporary password
 * @param {string} role - User role (customer/vendor)
 */
export const sendWelcomeEmail = async (email, name, tempPassword, role) => {
  if (!transporter) {
    console.log("⚠️  Welcome email not sent: Email service not configured");
    return false;
  }

  try {
    const roleLabel = role === "vendor" ? "Vendor" : "Customer";
    // Users (customers) log in via the Next.js customer app; vendors/admins use the Vite admin panel
    const loginUrl =
      role === "user" || role === "customer"
        ? `${process.env.NEXTJS_URL || "http://localhost:3000"}/login`
        : `${process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

    // Professional email template with inline CSS for email client compatibility
    const html =
      _emailOpen("Welcome to Zevio") +
      _emailHeader("WELCOME TO ZEVIO") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">${name}</strong>! 👋</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your <strong>${roleLabel}</strong> account has been successfully created by our admin team. You can now log in and start using the Zevio Villa Booking Platform.
        </p>
        ${_st("Your Login Credentials")}
        ${_box(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${_dr("Email", `<span style="font-family:'Courier New',monospace;font-size:12px;">${email}</span>`)}
            ${_dr("Temporary Password", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#2FA4A9;">${tempPassword}</span>`, true)}
          </table>
        `)}
        ${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">For your security, you'll be required to change this temporary password on your first login. Please choose a strong password.</span>`)}
        ${_btn(loginUrl, "Login to Your Account")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">If you didn't expect this email or have any questions, please contact our support team.</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose();

    const text = `
Welcome to Zevio, ${name}!

Your ${roleLabel} account has been successfully created.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

For security reasons, you'll be required to change this password on your first login.

Login at: ${loginUrl}

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Zevio Villa Booking
    `;

    await sendEmail({
      to: email,
      subject: `Welcome to Zevio - Your ${roleLabel} Account Created`,
      html,
      text,
    });

    console.log(`✅ Welcome email sent to ${email} (${role})`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
};

/**
 * Send welcome email for self-signup users
 * @param {string} email - User's email address
 * @param {string} name - User's full name
 */
export const sendSelfSignupWelcomeEmail = async (email, name) => {
  if (!transporter) {
    console.log("⚠️  Welcome email not sent: Email service not configured");
    return false;
  }

  try {
    const loginUrl = `${process.env.NEXTJS_URL || "http://localhost:3000"}/login`;

    const html =
      _emailOpen("Welcome to Zevio") +
      _emailHeader("WELCOME TO ZEVIO") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">${name}</strong>!</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your account is ready. You can now sign in and start booking your next stay.
        </p>
        ${_box(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${_dr("Email", `<span style="font-family:'Courier New',monospace;font-size:12px;">${email}</span>`, true)}
          </table>
        `)}
        ${_btn(loginUrl, "Login to Your Account")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">Need help? Reply to this email and our team will assist you.</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose();

    const text = `
Welcome to Zevio, ${name}!

Your account is ready. You can now sign in and start booking your next stay.

Email: ${email}
Login at: ${loginUrl}

© ${new Date().getFullYear()} Zevio Villa Booking
    `;

    await sendEmail({
      to: email,
      subject: "Welcome to Zevio",
      html,
      text,
    });

    console.log(`✅ Self-signup welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send self-signup welcome email:", error);
    throw error;
  }
};

/**
 * Send password-reset email with a new temporary password (admin-triggered)
 * @param {string} email - User's email address
 * @param {string} name  - User's full name
 * @param {string} tempPassword - Newly generated temporary password
 * @param {string} role  - User role (customer/vendor)
 */
export const sendPasswordResetEmail = async (
  email,
  name,
  tempPassword,
  role,
) => {
  if (!transporter) {
    console.log(
      "⚠️  Password reset email not sent: Email service not configured",
    );
    return false;
  }

  try {
    const roleLabel = role === "vendor" ? "Vendor" : "Customer";
    const loginUrl =
      role === "user" || role === "customer"
        ? `${process.env.NEXTJS_URL || "http://localhost:3000"}/login`
        : `${process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

    const html =
      _emailOpen("Password Reset") +
      _emailHeader("PASSWORD RESET") +
      `<tr><td style="padding:36px 36px 28px;">
        <p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">${name}</strong>! 👋</p>
        <p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">
          Your <strong>${roleLabel}</strong> account password has been <strong>reset by an administrator</strong>. Use the temporary password below to sign in.
        </p>
        ${_st("Your New Login Credentials")}
        ${_box(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${_dr("Email", `<span style="font-family:'Courier New',monospace;font-size:12px;">${email}</span>`)}
            ${_dr("Temporary Password", `<span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#2FA4A9;">${tempPassword}</span>`, true)}
          </table>
        `)}
        ${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">You will be prompted to set a new permanent password when you log in. Choose a strong password.</span>`)}
        ${_btn(loginUrl, "Login & Set New Password")}
        <p style="font-size:13px;color:#5F6B7A;margin:16px 0 0;font-family:${_F};">If you didn't request this reset or have any questions, please contact our support team immediately.</p>
      </td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose();

    const text = `
Password Reset - Zevio

Hello ${name},

Your ${roleLabel} account password has been reset by an administrator.

New Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

You will be required to set a new permanent password when you log in.

Login at: ${loginUrl}

If you didn't request this reset, contact support immediately.

© ${new Date().getFullYear()} Zevio Villa Booking
    `;

    await sendEmail({
      to: email,
      subject: `Zevio - Your Password Has Been Reset`,
      html,
      text,
    });

    console.log(`✅ Password reset email sent to ${email} (${role})`);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
};

// Forgot-password reset link email (user-initiated flow)
export const sendForgotPasswordLinkEmail = async (email, name, resetToken) => {
  if (!transporter) {
    console.log(
      "⚠️  Forgot password email not sent: Email service not configured",
    );
    return false;
  }

  try {
    const resetUrl = `${process.env.NEXTJS_URL || process.env.VITE_FRONTEND_URL || "http://localhost:8000"}/reset-password?token=${resetToken}`;

    const html =
      _emailOpen("Reset Your Password") +
      `<tr><td style="background:#1F3A5F;padding:28px 36px;text-align:center;">` +
      `<div style="font-family:${_FH};font-size:28px;font-weight:800;letter-spacing:3px;color:#ffffff;line-height:1;">ZEVIO</div>` +
      `<div style="margin-top:10px;font-family:${_FH};font-size:11px;font-weight:700;color:#2FA4A9;letter-spacing:2.5px;text-transform:uppercase;">RESET YOUR PASSWORD</div>` +
      `</td></tr>` +
      `<tr><td style="padding:36px 36px 28px;background:#ffffff;">` +
      `<p style="font-size:15px;color:#5F6B7A;margin:0 0 6px;font-family:${_F};line-height:1.6;">Hello <strong style="color:#1F3A5F;">${name}</strong>! 👋</p>` +
      `<p style="font-size:14px;color:#4a5666;margin:0 0 20px;font-family:${_F};line-height:1.6;">` +
      `We received a request to reset the password for your Zevio account. Click the button below to set a new password.` +
      `</p>` +
      `${_btn(resetUrl, "Reset Password")}` +
      `<p style="font-size:13px;color:#4a5666;margin:16px 0 0;font-family:${_F};line-height:1.6;">` +
      `Or copy and paste this link into your browser:<br>` +
      `<a href="${resetUrl}" style="color:#2FA4A9;word-break:break-all;">${resetUrl}</a>` +
      `</p>` +
      `${_notice(`<strong style="color:#1F3A5F;">🔒 Security Notice:</strong><br><span style="font-size:13px;color:#4a5666;font-family:${_F};">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</span>`)} ` +
      `</td></tr>` +
      `<tr><td>${_brandFooter()}</td></tr>` +
      _emailClose();

    const text = `
Reset Your Password - Zevio

Hello ${name},

We received a request to reset the password for your Zevio account.

Click the link below to reset your password (expires in 1 hour):
${resetUrl}

If you did not request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Zevio Villa Booking
    `;

    await sendEmail({
      to: email,
      subject: "Reset Your Password - Zevio",
      html,
      text,
    });

    console.log(`✅ Forgot password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send forgot password email:", error);
    throw error;
  }
};
