import cron from "node-cron";
import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";
import { calculateSettlement } from "../utils/settlementCalculator.js";
import {
  sendCheckInReminderEmail,
  sendCheckOutReminderEmail,
  sendReviewRequestEmail,
  sendBookingExpiryEmail,
} from "../services/emailService.js";

// IST is UTC+5:30 (19800 seconds). Compute a YYYY-MM-DD date string relative to
// today in IST, avoiding UTC drift when the cron fires at midnight IST.
function istDateOffset(days = 0) {
  return new Date(Date.now() + 19800000 + days * 86400000)
    .toISOString()
    .split("T")[0];
}

// ==========================================
// SESSION 30 + SESSION 47: EXPIRED BOOKINGS CRON JOB
// Runs every 5 minutes to auto-cancel expired pending bookings (reduced from 1 minute for performance)
// SESSION 47: Now checks payment_expires_at for 15-min payment window
// ==========================================
export const expiredBookingsCleaner = cron.schedule(
  "*/5 * * * *", // Every 5 minutes (changed from every minute)
  async () => {
    try {
      // SESSION 47: Get bookings with expired payment window (15 minutes)
      const [expiredBookings] = await db.query(
        `SELECT 
           b.id, 
           b.user_id,
           b.status,
           b.payment_status,
           b.payment_expires_at,
           p.title as property_title
         FROM bookings b
         LEFT JOIN properties p ON b.property_id = p.id
         WHERE b.status = 'pending_payment'
         AND b.payment_status = 'pending'
         AND b.payment_expires_at IS NOT NULL
         AND b.payment_expires_at < NOW()
         AND b.deleted_at IS NULL`,
      );

      if (expiredBookings.length === 0) {
        console.log("🕒 Expired bookings cleaner: No expired bookings found");
        return; // No expired bookings
      }

      console.log(
        `🕒 Expired bookings cleaner: Found ${expiredBookings.length} expired booking(s)`,
      );

      let cancelledCount = 0;
      let emailFailures = 0;

      for (const booking of expiredBookings) {
        try {
          // Cancel the booking and mark payment as failed
          await db.query(
            `UPDATE bookings 
             SET status = 'cancelled',
                 payment_status = 'failed'
             WHERE id = ?`,
            [booking.id],
          );

          // Send expiry email to user
          try {
            await sendBookingExpiryEmail(booking.id);
          } catch (emailError) {
            console.error(
              `⚠️  Failed to send expiry email for booking ${booking.id}:`,
              emailError.message,
            );
            emailFailures++;
          }

          cancelledCount++;
          console.log(
            `✅ Auto-cancelled booking ${booking.id} (${booking.property_title}) - Payment not received within 15 minutes`,
          );
        } catch (error) {
          console.error(
            `❌ Error cancelling booking ${booking.id}:`,
            error.message,
          );
        }
      }

      if (cancelledCount > 0) {
        console.log(
          `✅ SESSION 47: Cancelled ${cancelledCount} expired pending booking(s), ${emailFailures} email failures`,
        );
      }
    } catch (error) {
      console.error("❌ Error cleaning expired bookings:", error);
    }
  },
  {
    scheduled: false, // Will be started manually
    timezone: "Asia/Kolkata",
  },
);

// Daily job: Runs at 2 AM IST every day
export const dailyBookingProcessor = cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("🕒 Running daily booking processor...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // 1. Mark completed bookings (check-out date has passed)
      const yesterdayDate = istDateOffset(-1);

      await db.query(
        `UPDATE bookings 
       SET status = 'completed' 
       WHERE status = 'confirmed' 
       AND check_out <= ? 
       AND deleted_at IS NULL`,
        [yesterdayDate],
      );

      // 2. Create vendor settlements for completed bookings
      const [completedBookings] = await db.query(
        `SELECT 
        b.id as booking_id,
        b.base_amount,
        b.gst_amount,
        b.service_charge,
        b.total_amount,
        COALESCE(b.discount_amount, 0) as discount_amount,
        p.vendor_id,
        v.is_gst_registered
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
       INNER JOIN vendors v ON p.vendor_id = v.id
       WHERE b.status = 'completed'
       AND b.check_out = ?
       AND p.vendor_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM vendor_settlements vs 
         WHERE vs.booking_id = b.id
       )`,
        [yesterdayDate],
      );

      for (const booking of completedBookings) {
        const settlement = calculateSettlement({
          baseAmount: parseFloat(booking.base_amount) || 0,
          gstAmount: parseFloat(booking.gst_amount) || 0,
          serviceCharge: parseFloat(booking.service_charge) || 0,
          totalAmount: parseFloat(booking.total_amount) || 0,
          discountAmount: parseFloat(booking.discount_amount) || 0,
          isVendorGst: !!booking.is_gst_registered,
        });

        await db.query(
          `INSERT INTO vendor_settlements (
            id, vendor_id, booking_id,
            booking_base_amount, booking_gst_amount, booking_service_charge, booking_total_amount,
            booking_discount_amount,
            vendor_gross_amount, platform_fee, platform_fee_gst, total_deduction, is_vendor_gst,
            amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            generateUUID(),
            booking.vendor_id,
            booking.booking_id,
            booking.base_amount,
            booking.gst_amount,
            booking.service_charge,
            booking.total_amount,
            booking.discount_amount,
            settlement.vendorGrossAmount,
            settlement.platformFee,
            settlement.platformFeeGst,
            settlement.totalDeduction,
            settlement.isVendorGst ? 1 : 0,
            settlement.settlementAmount,
          ],
        );

        // Create notification for vendor
        await db.query(
          "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
          [
            generateUUID(),
            booking.vendor_id,
            "vendor",
            "New Settlement",
            `A new settlement of ₹${settlement.settlementAmount} is ready for booking ${booking.booking_id}`,
          ],
        );
      }

      // Log successful execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [
          jobId,
          "daily_booking_processor",
          today,
          "success",
          `Processed ${completedBookings.length} settlements`,
        ],
      );

      console.log(
        `✅ Daily booking processor completed. Created ${completedBookings.length} settlements.`,
      );
    } catch (error) {
      console.error("❌ Daily booking processor failed:", error);

      // Log failed execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "daily_booking_processor", today, "failed", error.message],
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// Cleanup job: Runs at 3 AM IST every day
export const dailyCleanupJob = cron.schedule(
  "0 3 * * *",
  async () => {
    console.log("🧹 Running daily cleanup job...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // Cancel pending_payment bookings older than 24 hours
      const [result] = await db.query(
        `UPDATE bookings 
       SET status = 'cancelled' 
       WHERE status = 'pending_payment' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND deleted_at IS NULL`,
      );

      // Log successful execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [
          jobId,
          "daily_cleanup",
          today,
          "success",
          `Cancelled ${result.affectedRows} expired bookings`,
        ],
      );

      console.log(
        `✅ Daily cleanup completed. Cancelled ${result.affectedRows} expired bookings.`,
      );
    } catch (error) {
      console.error("❌ Daily cleanup failed:", error);

      // Log failed execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "daily_cleanup", today, "failed", error.message],
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// 24-hour check-in reminder: Runs at midnight (00:00) every day
export const checkInReminderJob24h = cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("📧 Running 24-hour check-in reminder job...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // Get bookings with check-in tomorrow (IST)
      const tomorrowDate = istDateOffset(1);

      const [bookings] = await db.query(
        `SELECT id, user_id, property_id, check_in 
         FROM bookings 
         WHERE status = 'confirmed'
         AND check_in = ?
         AND deleted_at IS NULL`,
        [tomorrowDate],
      );

      let successCount = 0;
      let failCount = 0;

      for (const booking of bookings) {
        try {
          await sendCheckInReminderEmail(booking.id, 24);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to send 24h reminder for booking ${booking.id}:`,
            error.message,
          );
          failCount++;
        }
      }

      // Log execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [
          jobId,
          "check_in_reminder_24h",
          today,
          "success",
          `Sent ${successCount} reminders, ${failCount} failed`,
        ],
      );

      console.log(
        `✅ 24h check-in reminders sent: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      console.error("❌ 24h check-in reminder job failed:", error);
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "check_in_reminder_24h", today, "failed", error.message],
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// 6-hour check-in reminder: Runs every hour
export const checkInReminderJob6h = cron.schedule(
  "0 * * * *",
  async () => {
    console.log("📧 Running 6-hour check-in reminder job...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // Get bookings with check-in between 5-6 hours from now
      const sixHoursLater = new Date();
      sixHoursLater.setHours(sixHoursLater.getHours() + 6);

      const fiveHoursLater = new Date();
      fiveHoursLater.setHours(fiveHoursLater.getHours() + 5);

      const [bookings] = await db.query(
        `SELECT id, user_id, property_id, check_in 
         FROM bookings 
         WHERE status = 'confirmed'
         AND check_in BETWEEN ? AND ?
         AND deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM cron_jobs_log 
           WHERE job_name = 'check_in_reminder_6h_sent' 
           AND remarks LIKE CONCAT('%', bookings.id, '%')
         )`,
        [fiveHoursLater.toISOString(), sixHoursLater.toISOString()],
      );

      let successCount = 0;
      let failCount = 0;

      for (const booking of bookings) {
        try {
          await sendCheckInReminderEmail(booking.id, 6);

          // Mark as sent to prevent duplicate sends
          await db.query(
            "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
            [
              generateUUID(),
              "check_in_reminder_6h_sent",
              today,
              "success",
              `Booking: ${booking.id}`,
            ],
          );

          successCount++;
        } catch (error) {
          console.error(
            `Failed to send 6h reminder for booking ${booking.id}:`,
            error.message,
          );
          failCount++;
        }
      }

      console.log(
        `✅ 6h check-in reminders sent: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      console.error("❌ 6h check-in reminder job failed:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// 12-hour check-out reminder: Runs at noon (12:00) every day
export const checkOutReminderJob = cron.schedule(
  "0 12 * * *",
  async () => {
    console.log("📧 Running 12-hour check-out reminder job...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // Get bookings with check-out tomorrow (IST)
      const tomorrowDate = istDateOffset(1);

      const [bookings] = await db.query(
        `SELECT id, user_id, property_id, check_out 
         FROM bookings 
         WHERE status = 'confirmed'
         AND check_out = ?
         AND deleted_at IS NULL`,
        [tomorrowDate],
      );

      let successCount = 0;
      let failCount = 0;

      for (const booking of bookings) {
        try {
          await sendCheckOutReminderEmail(booking.id);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to send checkout reminder for booking ${booking.id}:`,
            error.message,
          );
          failCount++;
        }
      }

      // Log execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [
          jobId,
          "check_out_reminder",
          today,
          "success",
          `Sent ${successCount} reminders, ${failCount} failed`,
        ],
      );

      console.log(
        `✅ Check-out reminders sent: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      console.error("❌ Check-out reminder job failed:", error);
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "check_out_reminder", today, "failed", error.message],
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// Post-checkout review request: Runs at 10 AM every day
// SESSION 64: Enhanced with multi-day reminders (Day 2, 7, 14) and review_email_log tracking
export const reviewRequestJob = cron.schedule(
  "0 10 * * *",
  async () => {
    console.log(
      "📧 Running post-checkout review request job (Day 2, 7, 14)...",
    );

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      const currentDate = new Date();

      // Calculate target dates for Day 2, 7, and 14 reminders
      const day2Date = new Date(currentDate);
      day2Date.setDate(day2Date.getDate() - 2);

      const day7Date = new Date(currentDate);
      day7Date.setDate(day7Date.getDate() - 7);

      const day14Date = new Date(currentDate);
      day14Date.setDate(day14Date.getDate() - 14);

      const targetDates = [
        { date: day2Date.toISOString().split("T")[0], type: "day_2" },
        { date: day7Date.toISOString().split("T")[0], type: "day_7" },
        { date: day14Date.toISOString().split("T")[0], type: "day_14" },
      ];

      let totalSuccess = 0;
      let totalFail = 0;

      for (const target of targetDates) {
        // Get completed bookings that checked out on this target date
        // and don't have a review yet and haven't received this reminder type
        const [bookings] = await db.query(
          `SELECT DISTINCT b.id, b.user_id, b.property_id, b.check_out 
           FROM bookings b
           WHERE b.status = 'completed'
           AND DATE(b.check_out) = ?
           AND b.deleted_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM reviews r WHERE r.booking_id = b.id
           )
           AND NOT EXISTS (
             SELECT 1 FROM review_email_log rel 
             WHERE rel.booking_id = b.id 
             AND rel.email_type = ?
           )`,
          [target.date, target.type],
        );

        console.log(
          `   → Found ${bookings.length} booking(s) eligible for ${target.type} reminder (checkout: ${target.date})`,
        );

        for (const booking of bookings) {
          try {
            await sendReviewRequestEmail(booking.id);

            // Log the email send in review_email_log
            await db.query(
              `INSERT INTO review_email_log (id, booking_id, email_type, sent_at) 
               VALUES (?, ?, ?, NOW())`,
              [generateUUID(), booking.id, target.type],
            );

            totalSuccess++;
          } catch (error) {
            console.error(
              `   Failed to send ${target.type} review request for booking ${booking.id}:`,
              error.message,
            );
            totalFail++;
          }
        }
      }

      // Log execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [
          jobId,
          "review_request",
          today,
          "success",
          `Sent ${totalSuccess} review requests (multi-day), ${totalFail} failed`,
        ],
      );

      console.log(
        `✅ Review requests sent: ${totalSuccess} success, ${totalFail} failed`,
      );
    } catch (error) {
      console.error("❌ Review request job failed:", error);
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "review_request", today, "failed", error.message],
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  },
);

// Start all cron jobs
export const startCronJobs = () => {
  if (process.env.ENABLE_CRON_JOBS === "true") {
    expiredBookingsCleaner.start(); // SESSION 30: Hourly expired bookings cleaner
    dailyBookingProcessor.start();
    dailyCleanupJob.start();
    checkInReminderJob24h.start();
    checkInReminderJob6h.start();
    checkOutReminderJob.start();
    reviewRequestJob.start();
    console.log(
      "✅ All cron jobs started (expired bookings, booking processor, cleanup, email reminders)",
    );
  } else {
    console.log("ℹ️  Cron jobs disabled");
  }
};

// Stop all cron jobs
export const stopCronJobs = () => {
  expiredBookingsCleaner.stop(); // SESSION 30: Stop expired bookings cleaner
  dailyBookingProcessor.stop();
  dailyCleanupJob.stop();
  checkInReminderJob24h.stop();
  checkInReminderJob6h.stop();
  checkOutReminderJob.stop();
  reviewRequestJob.stop();
  console.log("⏹️  All cron jobs stopped");
};
