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

    const formatDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";
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
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #1a1a1a; }
            .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #1F3A5F; padding: 28px 32px; }
            .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 2px; }
            .header-sub { color: #2FA4A9; font-size: 11px; letter-spacing: 1px; margin-top: 4px; }
            .banner { background: #2FA4A9; padding: 16px 32px; }
            .banner h2 { margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; }
            .banner p { margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; }
            .body-content { padding: 28px 32px; }
            .greeting { font-size: 15px; color: #5F6B7A; margin-bottom: 20px; }
            .detail-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .detail-grid td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #E6E9EE; }
            .detail-label { color: #5F6B7A; font-weight: 600; width: 40%; }
            .detail-value { color: #1a1a1a; }
            .section-title { font-size: 13px; font-weight: 700; color: #1F3A5F; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #2FA4A9; }
            .total-row td { background: #1F3A5F; color: #ffffff !important; font-weight: 700; font-size: 15px; border: none; padding: 14px; }
            .discount-row td { color: #16a34a !important; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; }
            .badge-paid { background: #16a34a; color: #fff; }
            .badge-pending { background: #dc2626; color: #fff; }
            .cta-btn { display: inline-block; padding: 12px 32px; background: #2FA4A9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0; }
            .note { background: #E6E9EE; padding: 14px 18px; border-radius: 6px; font-size: 12px; color: #5F6B7A; margin: 20px 0; }
            .footer { background: #1F3A5F; padding: 20px 32px; }
            .footer p { margin: 4px 0; font-size: 11px; color: #E6E9EE; }
            .footer a { color: #2FA4A9; text-decoration: none; }
            .footer .copy { color: #5F6B7A; font-size: 10px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>ZEVIO</h1>
              <div class="header-sub">BOOKING INVOICE</div>
            </div>

            <div class="banner">
              <h2>Booking Confirmed!</h2>
              <p>Your reservation has been confirmed successfully.</p>
            </div>

            <div class="body-content">
              <p class="greeting">Dear ${booking.full_name},</p>

              <div class="section-title">Stay Details</div>
              <table class="detail-grid">
                <tr>
                  <td class="detail-label">Property</td>
                  <td class="detail-value"><strong>${booking.property_title}</strong></td>
                </tr>
                <tr>
                  <td class="detail-label">Location</td>
                  <td class="detail-value">${locationParts.join(", ")}</td>
                </tr>
                <tr>
                  <td class="detail-label">Check-in</td>
                  <td class="detail-value">${formatDate(booking.check_in)}</td>
                </tr>
                <tr>
                  <td class="detail-label">Check-out</td>
                  <td class="detail-value">${formatDate(booking.check_out)}</td>
                </tr>
                <tr>
                  <td class="detail-label">Duration</td>
                  <td class="detail-value">${booking.nights} Night${booking.nights !== 1 ? "s" : ""}</td>
                </tr>
                <tr>
                  <td class="detail-label">Guests</td>
                  <td class="detail-value">${booking.guest_count || 0} Adult${(booking.guest_count || 0) !== 1 ? "s" : ""}${booking.children_count > 0 ? `, ${booking.children_count} Children` : ""}${booking.infants_count > 0 ? `, ${booking.infants_count} Infant${booking.infants_count !== 1 ? "s" : ""}` : ""}</td>
                </tr>
                <tr>
                  <td class="detail-label">Booking ID</td>
                  <td class="detail-value" style="font-family: monospace; font-size: 12px;">${booking.id.substring(0, 8).toUpperCase()}</td>
                </tr>
              </table>

              <div class="section-title">Price Breakdown</div>
              <table class="detail-grid">
                <tr>
                  <td class="detail-label">Base Amount (${booking.nights} night${booking.nights !== 1 ? "s" : ""})</td>
                  <td class="detail-value" style="text-align:right;">${formatCurrency(booking.base_amount)}</td>
                </tr>
                ${parseFloat(booking.extra_guest_charges || 0) > 0 ? `<tr><td class="detail-label">Extra Guest Charges</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.extra_guest_charges)}</td></tr>` : ""}
                ${parseFloat(booking.extra_children_charges || 0) > 0 ? `<tr><td class="detail-label">Extra Children Charges</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.extra_children_charges)}</td></tr>` : ""}
                ${parseFloat(booking.service_charge || 0) > 0 ? `<tr><td class="detail-label">Service Charge (5%)</td><td class="detail-value" style="text-align:right;">${formatCurrency(booking.service_charge)}</td></tr>` : ""}
                <tr>
                  <td class="detail-label">GST</td>
                  <td class="detail-value" style="text-align:right;">${formatCurrency(booking.gst_amount)}</td>
                </tr>
                ${parseFloat(booking.coupon_discount || 0) > 0 ? `<tr class="discount-row"><td class="detail-label">Coupon Discount${booking.coupon_code ? ` (${booking.coupon_code})` : ""}</td><td class="detail-value" style="text-align:right; color:#16a34a;">-${formatCurrency(booking.coupon_discount)}</td></tr>` : ""}
                ${parseFloat(booking.discount_amount || 0) > 0 && parseFloat(booking.coupon_discount || 0) === 0 ? `<tr class="discount-row"><td class="detail-label">Discount</td><td class="detail-value" style="text-align:right; color:#16a34a;">-${formatCurrency(booking.discount_amount)}</td></tr>` : ""}
                <tr class="total-row">
                  <td>TOTAL AMOUNT</td>
                  <td style="text-align:right;">${formatCurrency(booking.total_amount)}</td>
                </tr>
              </table>

              <p style="margin: 12px 0;">
                Payment Status: <span class="badge ${booking.payment_status === "completed" ? "badge-paid" : "badge-pending"}">${booking.payment_status === "completed" ? "PAID" : "PENDING"}</span>
              </p>

              <div class="note">
                📎 Your detailed booking invoice is attached as a PDF. Please save it for your records.
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || "https://zevio.in"}/bookings/${booking.id}" class="cta-btn">View Booking Details</a>
              </center>

              <p style="font-size: 13px; color: #5F6B7A; margin-top: 20px;">
                We look forward to hosting you!<br>
                — Team Zevio
              </p>
            </div>

            <div class="footer">
              <p><strong>Company Address:</strong> Navarathna Agrahara, Bettahalasur Post, Bangalore North - 562157</p>
              <p><strong>Support:</strong> <a href="mailto:support@zevio.com">support@zevio.com</a> &nbsp;|&nbsp; <a href="https://zevio.in">www.zevio.in</a></p>
              <p class="copy">© ${new Date().getFullYear()} Zevio. All rights reserved. This is a computer-generated email.</p>
            </div>
          </div>
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              <p>Your booking for <strong>${booking.property_title}</strong> has been cancelled.</p>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Processed</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              <p>Your refund for booking <strong>${
                booking.id
              }</strong> has been processed successfully.</p>
              <p><strong>Property:</strong> ${booking.property_title}</p>
              <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
              <p>The amount will be credited to your original payment method within 5-7 business days.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Refund email sent to ${booking.email}`);
  } catch (error) {
    console.error("Failed to send refund email:", error);
    throw error;
  }
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
        u.full_name, u.email, u.phone,
        p.title as property_title,
        p.address, c.name as city, c.state as state, p.pincode,
        p.check_in_time, p.check_out_time,
        p.primary_incharge_name, p.primary_incharge_phone, 
        p.primary_incharge_email, p.primary_incharge_whatsapp, p.primary_incharge_alt_contact,
        p.secondary_incharge_name, p.secondary_incharge_phone,
        p.secondary_incharge_email, p.secondary_incharge_whatsapp,
        p.safety_information, p.local_area_info, p.emergency_contacts,
        c.name as city_name
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
    const reminderType = hoursBeforeCheckIn === 24 ? "24 hours" : "6 hours";

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: `Check-in Reminder (${reminderType}) - ${booking.property_title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #1F3A5F 0%, #2FA4A9 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .booking-info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2FA4A9; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: 600; color: #1F3A5F; }
            .info-value { color: #555; text-align: right; }
            .section-title { color: #1F3A5F; font-size: 20px; margin: 25px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #2FA4A9; }
            .incharge-card { background: #fff; border: 2px solid #2FA4A9; padding: 20px; margin: 15px 0; border-radius: 8px; }
            .incharge-card h4 { margin: 0 0 15px 0; color: #1F3A5F; font-size: 18px; }
            .contact-item { padding: 8px 0; display: flex; align-items: center; }
            .contact-item strong { min-width: 120px; color: #1F3A5F; }
            .contact-item a { color: #2FA4A9; text-decoration: none; }
            .contact-item a:hover { text-decoration: underline; }
            .guidelines { background: #fffbf0; border: 1px solid #ffd700; padding: 20px; margin: 15px 0; border-radius: 8px; }
            .guidelines-content { margin-top: 10px; }
            .guidelines-content ul { margin: 10px 0; padding-left: 20px; }
            .guidelines-content li { padding: 5px 0; }
            .guidelines-content h3 { color: #1F3A5F; font-size: 16px; margin: 15px 0 10px 0; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 20px; color: #666; font-size: 13px; }
            .footer p { margin: 5px 0; }
            .highlight { background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
            .emoji { font-size: 20px; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>⏰ Check-in Reminder</h1>
              <p>Your booking is in ${reminderType}!</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              
              <div class="highlight">
                <strong>🎉 Your check-in is ${
                  reminderType === "24 hours" ? "tomorrow" : "in just 6 hours"
                }!</strong>
                <p style="margin: 10px 0 0 0;">We're excited to welcome you to ${
                  booking.property_title
                }.</p>
              </div>

              <!-- Booking Details -->
              <h2 class="section-title">📋 Booking Details</h2>
              <div class="booking-info">
                <div class="info-row">
                  <span class="info-label">Booking ID:</span>
                  <span class="info-value">${booking.id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Property:</span>
                  <span class="info-value">${booking.property_title}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${booking.address}, ${
                    booking.city
                  }, ${booking.state} - ${booking.pincode}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-in Date:</span>
                  <span class="info-value">${new Date(
                    booking.check_in,
                  ).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-in Time:</span>
                  <span class="info-value">${
                    booking.check_in_time || "2:00 PM"
                  } onwards</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-out Date:</span>
                  <span class="info-value">${new Date(
                    booking.check_out,
                  ).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-out Time:</span>
                  <span class="info-value">${
                    booking.check_out_time || "11:00 AM"
                  }</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Guests:</span>
                  <span class="info-value">${
                    booking.guest_count || 1
                  } Adults, ${booking.children_count || 0} Children, ${
                    booking.infants_count || 0
                  } Infants</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Nights:</span>
                  <span class="info-value">${booking.nights}</span>
                </div>
              </div>

              <!-- Primary Property Incharge -->
              <h2 class="section-title">👤 Property Incharge Contact</h2>
              <div class="incharge-card">
                <h4>Primary Contact</h4>
                <div class="contact-item">
                  <strong>Name:</strong>
                  <span>${booking.primary_incharge_name || "N/A"}</span>
                </div>
                <div class="contact-item">
                  <strong>Phone:</strong>
                  <span><a href="tel:${booking.primary_incharge_phone}">${
                    booking.primary_incharge_phone || "N/A"
                  }</a></span>
                </div>
                <div class="contact-item">
                  <strong>Email:</strong>
                  <span><a href="mailto:${booking.primary_incharge_email}">${
                    booking.primary_incharge_email || "N/A"
                  }</a></span>
                </div>
                ${
                  booking.primary_incharge_whatsapp
                    ? `
                <div class="contact-item">
                  <strong>WhatsApp:</strong>
                  <span><a href="https://wa.me/${booking.primary_incharge_whatsapp.replace(
                    /[^0-9]/g,
                    "",
                  )}" target="_blank">${
                    booking.primary_incharge_whatsapp
                  }</a></span>
                </div>
                `
                    : ""
                }
                ${
                  booking.primary_incharge_alt_contact
                    ? `
                <div class="contact-item">
                  <strong>Alt. Contact:</strong>
                  <span><a href="tel:${booking.primary_incharge_alt_contact}">${booking.primary_incharge_alt_contact}</a></span>
                </div>
                `
                    : ""
                }
              </div>

              ${
                booking.secondary_incharge_name
                  ? `
              <!-- Secondary Property Incharge -->
              <div class="incharge-card">
                <h4>Secondary Contact (Backup)</h4>
                <div class="contact-item">
                  <strong>Name:</strong>
                  <span>${booking.secondary_incharge_name}</span>
                </div>
                ${
                  booking.secondary_incharge_phone
                    ? `
                <div class="contact-item">
                  <strong>Phone:</strong>
                  <span><a href="tel:${booking.secondary_incharge_phone}">${booking.secondary_incharge_phone}</a></span>
                </div>
                `
                    : ""
                }
                ${
                  booking.secondary_incharge_email
                    ? `
                <div class="contact-item">
                  <strong>Email:</strong>
                  <span><a href="mailto:${booking.secondary_incharge_email}">${booking.secondary_incharge_email}</a></span>
                </div>
                `
                    : ""
                }
                ${
                  booking.secondary_incharge_whatsapp
                    ? `
                <div class="contact-item">
                  <strong>WhatsApp:</strong>
                  <span><a href="https://wa.me/${booking.secondary_incharge_whatsapp.replace(
                    /[^0-9]/g,
                    "",
                  )}" target="_blank">${
                    booking.secondary_incharge_whatsapp
                  }</a></span>
                </div>
                `
                    : ""
                }
              </div>
              `
                  : ""
              }

              <!-- Safety Information -->
              ${
                booking.safety_information
                  ? `
              <h2 class="section-title">🛡️ Safety Information</h2>
              <div class="guidelines">
                <div class="guidelines-content">${booking.safety_information}</div>
              </div>
              `
                  : ""
              }

              <!-- Local Area Info -->
              ${
                booking.local_area_info
                  ? `
              <h2 class="section-title">📍 Local Area Information</h2>
              <div class="guidelines">
                <div class="guidelines-content">${booking.local_area_info}</div>
              </div>
              `
                  : ""
              }

              <!-- Emergency Contacts -->
              ${
                booking.emergency_contacts
                  ? `
              <h2 class="section-title">🚨 Emergency Contacts</h2>
              <div class="guidelines">
                <div class="guidelines-content">${booking.emergency_contacts}</div>
              </div>
              `
                  : ""
              }

              <div class="highlight" style="margin-top: 30px;">
                <p style="margin: 0;"><strong>🌟 Important Reminders:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Carry valid government ID proof (Aadhar/Passport)</li>
                  <li>Reach out to property incharge if you need any assistance</li>
                  <li>Follow house rules for a pleasant stay</li>
                  <li>Have a wonderful time at ${
                    booking.property_title
                  }! 🎉</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Need help? Contact us at ${
                process.env.COMPANY_EMAIL || "support@zevio.com"
              }</p>
              <p>Or call us at ${
                process.env.COMPANY_PHONE || "+91-1234567890"
              }</p>
              <p style="margin-top: 15px;">© 2025 Zevio Villa Booking. All rights reserved.</p>
            </div>
          </div>
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #1F3A5F 0%, #2FA4A9 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .highlight { background: #fff3cd; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
            .checklist { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .checklist h3 { color: #1F3A5F; margin-top: 0; }
            .checklist ul { margin: 10px 0; padding-left: 20px; }
            .checklist li { padding: 8px 0; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 20px; color: #666; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Check-out Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              
              <div class="highlight">
                <strong>🕐 Check-out is tomorrow at ${
                  booking.check_out_time || "11:00 AM"
                }</strong>
                <p style="margin: 10px 0 0 0;">We hope you had a wonderful stay at ${
                  booking.property_title
                }!</p>
              </div>

              <div class="checklist">
                <h3>✅ Check-out Checklist</h3>
                <ul>
                  <li>✓ Please vacate the property by ${
                    booking.check_out_time || "11:00 AM"
                  }</li>
                  <li>✓ Turn off all lights, fans, and AC</li>
                  <li>✓ Lock all doors and windows</li>
                  <li>✓ Return keys to property manager</li>
                  <li>✓ Take all your belongings with you</li>
                  <li>✓ Leave the property as you found it</li>
                </ul>
              </div>

              <p>Thank you for choosing Zevio Villa Booking! We would love to hear about your experience. You'll receive a feedback request shortly.</p>
            </div>
            <div class="footer">
              <p>© 2025 Zevio Villa Booking. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #1F3A5F 0%, #2FA4A9 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; text-align: center; }
            .property-card { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .property-card h3 { color: #1F3A5F; margin-top: 0; }
            .rating-section { margin: 30px 0; }
            .star-rating { font-size: 40px; letter-spacing: 10px; }
            .button { display: inline-block; padding: 15px 40px; background: #2FA4A9; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #1F3A5F; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 20px; color: #666; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 How was your stay?</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              
              <p>Thank you for choosing Zevio Villa Booking! We hope you had a wonderful experience at:</p>

              <div class="property-card">
                <h3>${booking.property_title}</h3>
                <p>${booking.city_name || ""}</p>
                <p><strong>Check-in:</strong> ${new Date(
                  booking.check_in,
                ).toLocaleDateString("en-IN")}</p>
                <p><strong>Check-out:</strong> ${new Date(
                  booking.check_out,
                ).toLocaleDateString("en-IN")}</p>
              </div>

              <div class="rating-section">
                <h3>Rate Your Experience</h3>
                <div class="star-rating">⭐⭐⭐⭐⭐</div>
                <p>Your feedback helps us improve and helps other travelers make better decisions.</p>
              </div>

              <a href="${
                process.env.FRONTEND_URL || process.env.NEXTJS_URL
              }/properties/${booking.property_id}?review=true&booking=${
                booking.id
              }" class="button">Leave a Review</a>

              <p style="margin-top: 30px; color: #666;">We'd love to host you again soon!</p>
            </div>
            <div class="footer">
              <p>© 2025 Zevio Villa Booking. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
        u.first_name,
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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">⏰ Booking Expired</h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px;">Hi <strong>${booking.first_name}</strong>,</p>
              
              <p style="color: #dc2626; font-size: 16px; margin-top: 20px;">
                <strong>Your pending booking has expired.</strong>
              </p>

              <div style="background: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Property:</strong> ${booking.property_name}<br>
                  <strong>Booking Amount:</strong> ₹${parseFloat(booking.total_amount || 0).toLocaleString()}<br>
                  <strong>Status:</strong> <span style="color: #dc2626;">Expired</span>
                </p>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                <strong>What happened?</strong><br>
                Your booking was pending payment and automatically expired after 15 minutes without completion.
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                <strong>No worries!</strong> You can create a new booking anytime. The property may still be available for your preferred dates.
              </p>

              <!-- CTA -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXTJS_URL || "http://localhost:8000"}/properties/${booking.property_id}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Browse Property Again
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #999;">
                If you have any questions, please contact our support team.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>© 2026 Zevio Villa Booking. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Zevio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with logo placeholder -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <!-- Logo placeholder - replace with <img> when logo available -->
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; font-weight: bold; color: #ffffff;">Z</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Zevio</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Hello ${name}! 👋</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Your <strong>${roleLabel}</strong> account has been successfully created by our admin team. You can now login and start using Zevio Villa Booking Platform.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; color: #1a1a1a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
                    
                    <p style="margin: 0 0 10px; color: #4a4a4a; font-size: 15px;">
                      <strong style="color: #1a1a1a;">Email:</strong><br>
                      <span style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">${email}</span>
                    </p>
                    
                    <p style="margin: 0; color: #4a4a4a; font-size: 15px;">
                      <strong style="color: #1a1a1a;">Temporary Password:</strong><br>
                      <span style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: 600; color: #667eea;">${tempPassword}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      <strong style="display: block; margin-bottom: 5px;">🔒 Security Notice</strong>
                      For your security, you'll be required to change this temporary password on your first login. Please choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Login to Your Account</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                If you didn't expect this email or have any questions, please contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                © ${new Date().getFullYear()} Zevio Villa Booking. All rights reserved.
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Zevio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; font-weight: bold; color: #ffffff;">Z</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Hello ${name}! 👋</h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Your <strong>${roleLabel}</strong> account password has been <strong>reset by an administrator</strong>. Use the temporary password below to sign in.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; color: #1a1a1a; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your New Login Credentials</p>

                    <p style="margin: 0 0 10px; color: #4a4a4a; font-size: 15px;">
                      <strong style="color: #1a1a1a;">Email:</strong><br>
                      <span style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">${email}</span>
                    </p>

                    <p style="margin: 0; color: #4a4a4a; font-size: 15px;">
                      <strong style="color: #1a1a1a;">Temporary Password:</strong><br>
                      <span style="font-family: 'Courier New', monospace; background-color: #ffffff; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: 600; color: #d97706;">${tempPassword}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      <strong style="display: block; margin-bottom: 5px;">🔒 Security Notice</strong>
                      You will be prompted to set a new permanent password when you log in. Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">Login &amp; Set New Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                If you didn't request this reset or have any questions, please contact our support team immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                © ${new Date().getFullYear()} Zevio Villa Booking. All rights reserved.
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Zevio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; font-weight: bold; color: #ffffff;">Z</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Hello ${name}! 👋</h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your Zevio account. Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">Reset Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #d97706; word-break: break-all;">${resetUrl}</a>
              </p>

              <!-- Security notice -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      <strong style="display: block; margin-bottom: 5px;">🔒 Security Notice</strong>
                      This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                © ${new Date().getFullYear()} Zevio Villa Booking. All rights reserved.
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

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
