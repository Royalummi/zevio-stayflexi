import cron from "node-cron";
import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";

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
        [yesterdayDate]
      );

      // 2. Confirm employee points for completed bookings
      await db.query(
        `UPDATE employee_points ep
       INNER JOIN bookings b ON ep.booking_id = b.id
       SET ep.status = 'confirmed'
       WHERE b.status = 'completed'
       AND ep.status = 'pending'`
      );

      // 3. Create vendor settlements for completed bookings
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
        [yesterdayDate]
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
          ]
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
          ]
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
        ]
      );

      console.log(
        `✅ Daily booking processor completed. Created ${completedBookings.length} settlements.`
      );
    } catch (error) {
      console.error("❌ Daily booking processor failed:", error);

      // Log failed execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "daily_booking_processor", today, "failed", error.message]
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
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
       AND deleted_at IS NULL`
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
        ]
      );

      console.log(
        `✅ Daily cleanup completed. Cancelled ${result.affectedRows} expired bookings.`
      );
    } catch (error) {
      console.error("❌ Daily cleanup failed:", error);

      // Log failed execution
      await db.query(
        "INSERT INTO cron_jobs_log (id, job_name, run_date, status, remarks) VALUES (?, ?, ?, ?, ?)",
        [jobId, "daily_cleanup", today, "failed", error.message]
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);

// Start all cron jobs
export const startCronJobs = () => {
  if (process.env.ENABLE_CRON_JOBS === "true") {
    dailyBookingProcessor.start();
    dailyCleanupJob.start();
    console.log("✅ Cron jobs started");
  } else {
    console.log("ℹ️  Cron jobs disabled");
  }
};

// Stop all cron jobs
export const stopCronJobs = () => {
  dailyBookingProcessor.stop();
  dailyCleanupJob.stop();
  console.log("⏹️  Cron jobs stopped");
};
