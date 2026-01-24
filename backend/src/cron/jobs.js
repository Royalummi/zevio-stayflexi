import cron from "node-cron";
import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";
import {
  sendCheckInReminderEmail,
  sendCheckOutReminderEmail,
  sendReviewRequestEmail,
} from "../services/emailService.js";

// ==========================================
// SESSION 30: EXPIRED BOOKINGS CRON JOB
// Runs every hour to auto-cancel expired pending bookings
// ==========================================
export const expiredBookingsCleaner = cron.schedule(
  "0 * * * *", // Every hour at minute 0
  async () => {
    console.log("🕒 Running expired bookings cleaner...");

    try {
      const [result] = await db.query(
        `UPDATE bookings 
         SET status = 'expired' 
         WHERE status IN ('pending', 'pending_payment')
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
         AND deleted_at IS NULL`,
      );

      if (result.affectedRows > 0) {
        console.log(`✅ Expired ${result.affectedRows} pending booking(s)`);
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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

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
        b.total_amount,
        p.vendor_id,
        ROUND(b.total_amount * 0.85, 2) as settlement_amount
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
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
        await db.query(
          `INSERT INTO vendor_settlements (id, vendor_id, booking_id, amount, status) 
         VALUES (?, ?, ?, ?, 'pending')`,
          [
            generateUUID(),
            booking.vendor_id,
            booking.booking_id,
            booking.settlement_amount,
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
            `A new settlement of ₹${booking.settlement_amount} is ready for booking ${booking.booking_id}`,
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
      // Get bookings with check-in tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

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
      // Get bookings with check-out tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

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
export const reviewRequestJob = cron.schedule(
  "0 10 * * *",
  async () => {
    console.log("📧 Running post-checkout review request job...");

    const jobId = generateUUID();
    const today = new Date().toISOString().split("T")[0];

    try {
      // Get bookings that checked out yesterday (24h ago)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      const [bookings] = await db.query(
        `SELECT id, user_id, property_id, check_out 
         FROM bookings 
         WHERE status = 'completed'
         AND check_out = ?
         AND deleted_at IS NULL`,
        [yesterdayDate],
      );

      let successCount = 0;
      let failCount = 0;

      for (const booking of bookings) {
        try {
          await sendReviewRequestEmail(booking.id);
          successCount++;
        } catch (error) {
          console.error(
            `Failed to send review request for booking ${booking.id}:`,
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
          "review_request",
          today,
          "success",
          `Sent ${successCount} review requests, ${failCount} failed`,
        ],
      );

      console.log(
        `✅ Review requests sent: ${successCount} success, ${failCount} failed`,
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
