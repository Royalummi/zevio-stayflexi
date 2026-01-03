import nodemailer from "nodemailer";
import db from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration failed:", error.message);
    return false;
  }
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (bookingId) => {
  try {
    // Get booking details
    const [bookings] = await db.query(
      `SELECT 
        b.*,
        u.full_name, u.email,
        p.title as property_title,
        c.name as city_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN cities c ON p.city_id = c.id
      WHERE b.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.email,
      subject: "Booking Confirmation - Zevio Villa Booking",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${booking.full_name},</p>
              <p>Your booking has been confirmed successfully. Here are your booking details:</p>
              
              <div class="booking-details">
                <h3>${booking.property_title}</h3>
                <p><strong>Location:</strong> ${booking.city_name}</p>
                
                <div class="detail-row">
                  <span><strong>Booking ID:</strong></span>
                  <span>${booking.id}</span>
                </div>
                
                <div class="detail-row">
                  <span><strong>Check-in:</strong></span>
                  <span>${new Date(booking.check_in).toLocaleDateString(
                    "en-IN"
                  )}</span>
                </div>
                
                <div class="detail-row">
                  <span><strong>Check-out:</strong></span>
                  <span>${new Date(booking.check_out).toLocaleDateString(
                    "en-IN"
                  )}</span>
                </div>
                
                <div class="detail-row">
                  <span><strong>Nights:</strong></span>
                  <span>${booking.nights}</span>
                </div>
                
                <div class="detail-row">
                  <span><strong>Base Amount:</strong></span>
                  <span>₹${booking.base_amount.toFixed(2)}</span>
                </div>
                
                <div class="detail-row">
                  <span><strong>GST:</strong></span>
                  <span>₹${booking.gst_amount.toFixed(2)}</span>
                </div>
                
                ${
                  booking.discount_amount > 0
                    ? `
                <div class="detail-row">
                  <span><strong>Discount:</strong></span>
                  <span>-₹${booking.discount_amount.toFixed(2)}</span>
                </div>
                `
                    : ""
                }
                
                <div class="detail-row" style="border-bottom: none; font-size: 18px; color: #4F46E5;">
                  <span><strong>Total Amount:</strong></span>
                  <span><strong>₹${booking.total_amount.toFixed(
                    2
                  )}</strong></span>
                </div>
              </div>
              
              <p>We look forward to hosting you!</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL}/bookings/${
        booking.id
      }" class="button">View Booking Details</a>
              </center>
            </div>
            <div class="footer">
              <p>Need help? Contact us at ${
                process.env.COMPANY_EMAIL || "support@zevio.com"
              }</p>
              <p>© 2025 Zevio Villa Booking. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
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
      [bookingId]
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
      [bookingId]
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
