/**
 * Re-apply Stayflexi CM hooks after Zevio code sync.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SNAP = path.join(ROOT, "db", "backups", "cm-code-snapshot");

const copyFromSnapshot = (rel) => {
  const src = path.join(SNAP, rel);
  const dst = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.warn(`SKIP missing snapshot: ${rel}`);
    return false;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`RESTORE ${rel}`);
  return true;
};

[
  "backend/server.js",
  "backend/package.json",
  "backend/src/routes/adminRoutes.js",
  "backend/src/routes/vendorRoutes.js",
  "backend/src/controllers/paymentController.js",
  "backend/src/cron/jobs.js",
  "frontend/src/App.jsx",
  "frontend/src/components/layout/DashboardLayout.jsx",
  "frontend/src/lib/utils.js",
].forEach(copyFromSnapshot);

const adminPath = path.join(ROOT, "backend/src/controllers/adminController.js");
let admin = fs.readFileSync(adminPath, "utf8");

if (!admin.includes("channelManagerOutboundService")) {
  admin = admin.replace(
    `import { generateSecurePassword, hashPassword } from "../utils/password.js";`,
    `import { generateSecurePassword, hashPassword } from "../utils/password.js";\nimport { triggerPushBookingForBooking } from "../services/channelManagerOutboundService.js";`,
  );
  console.log("PATCH adminController: CM import");
}

if (!admin.includes("booking_source,")) {
  admin = admin.replace(
    `    search,
    page = 1,
    limit = 20,
  } = req.query;`,
    `    search,
    booking_source,
    page = 1,
    limit = 20,
  } = req.query;`,
  );
}

if (!admin.includes('VALID_BOOKING_SOURCES = ["direct", "channel_manager"]')) {
  admin = admin.replace(
    `  if (search) {
    query += \` AND (b.id LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)\`;
    const searchTerm = \`%\${search}%\`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Count total`,
    `  if (search) {
    query += \` AND (b.id LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)\`;
    const searchTerm = \`%\${search}%\`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const VALID_BOOKING_SOURCES = ["direct", "channel_manager"];
  if (booking_source && VALID_BOOKING_SOURCES.includes(booking_source)) {
    query += \` AND b.booking_source = ?\`;
    params.push(booking_source);
  }

  // Count total`,
  );
  console.log("PATCH adminController: booking_source filter");
}

if (!admin.includes("channel_manager_revenue")) {
  admin = admin.replace(
    `      SUM(CASE WHEN status = 'confirmed' OR status = 'completed' THEN total_amount ELSE 0 END) as total_revenue
    FROM bookings
    WHERE deleted_at IS NULL
  \`);

  sendSuccess(res, stats[0], "Booking statistics fetched successfully", 200);`,
    `      SUM(CASE WHEN status = 'confirmed' OR status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN booking_source = 'channel_manager' THEN 1 ELSE 0 END) as channel_manager_bookings,
      SUM(CASE WHEN booking_source = 'direct' OR booking_source IS NULL THEN 1 ELSE 0 END) as direct_bookings,
      SUM(CASE WHEN booking_source = 'channel_manager' AND (status = 'confirmed' OR status = 'completed') THEN total_amount ELSE 0 END) as channel_manager_revenue
    FROM bookings
    WHERE deleted_at IS NULL
  \`);

  sendSuccess(res, stats[0], "Booking statistics fetched successfully", 200);`,
  );
  console.log("PATCH adminController: getBookingStats CM fields");
}

if (!admin.includes("pending_cancellations,\n      SUM(CASE WHEN booking_source")) {
  admin = admin.replace(
    `      SUM(CASE WHEN status = 'cancel_requested' THEN 1 ELSE 0 END) as pending_cancellations
    FROM bookings
    WHERE deleted_at IS NULL
  \`);

  // Property counts`,
    `      SUM(CASE WHEN status = 'cancel_requested' THEN 1 ELSE 0 END) as pending_cancellations,
      SUM(CASE WHEN booking_source = 'channel_manager' THEN 1 ELSE 0 END) as channel_manager_bookings,
      SUM(CASE WHEN booking_source = 'direct' OR booking_source IS NULL THEN 1 ELSE 0 END) as direct_bookings
    FROM bookings
    WHERE deleted_at IS NULL
  \`);

  // Property counts`,
  );
  console.log("PATCH adminController: dashboard booking CM fields");
}

if (!admin.includes("cm_active_integrations")) {
  admin = admin.replace(
    `  sendSuccess(
    res,
    {
      revenue: revenue[0].total_revenue,
      ...bookingCounts[0],
      ...propertyCounts[0],
      ...userCount[0],
      ...settlementStats[0],
    },
    "Dashboard statistics fetched successfully",
    200,
  );`,
    `  const [cmHealth] = await db.query(\`
    SELECT
      SUM(CASE WHEN deleted_at IS NULL AND status IN ('active','test') THEN 1 ELSE 0 END) as active_integrations,
      SUM(CASE WHEN deleted_at IS NULL AND status = 'inactive' THEN 1 ELSE 0 END) as inactive_integrations
    FROM channel_manager_integrations
  \`);
  const [cmMappings] = await db.query(\`
    SELECT COUNT(*) as active_mappings
    FROM channel_manager_property_mappings cpm
    JOIN channel_manager_integrations ci ON cpm.integration_id = ci.id
    WHERE cpm.is_active = 1
      AND ci.deleted_at IS NULL
      AND ci.status IN ('active','test')
  \`);
  const [cmFailed] = await db.query(\`
    SELECT COUNT(*) as failed_outbound_24h
    FROM channel_manager_webhook_events
    WHERE event_type LIKE 'push_booking_%'
      AND processing_status = 'failed'
      AND received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  \`);
  const [cmLastSync] = await db.query(\`
    SELECT MAX(processed_at) as last_sync_at
    FROM channel_manager_webhook_events
    WHERE event_type LIKE 'push_booking_%'
      AND processing_status = 'processed'
  \`);

  sendSuccess(
    res,
    {
      revenue: revenue[0].total_revenue,
      ...bookingCounts[0],
      ...propertyCounts[0],
      ...userCount[0],
      ...settlementStats[0],
      cm_active_integrations: parseInt(cmHealth[0].active_integrations || 0),
      cm_inactive_integrations: parseInt(cmHealth[0].inactive_integrations || 0),
      cm_active_mappings: parseInt(cmMappings[0].active_mappings || 0),
      cm_failed_outbound_24h: parseInt(cmFailed[0].failed_outbound_24h || 0),
      cm_last_sync_at: cmLastSync[0].last_sync_at || null,
    },
    "Dashboard statistics fetched successfully",
    200,
  );`,
  );
  console.log("PATCH adminController: dashboard CM health");
}

if (!admin.includes("is_stayflexi_active")) {
  admin = admin.replace(
    `        pr.discount_15_plus_days
      FROM properties p`,
    `        pr.discount_15_plus_days,
        EXISTS (
          SELECT 1 FROM channel_manager_property_mappings cpm
          JOIN channel_manager_integrations ci ON cpm.integration_id = ci.id
          WHERE cpm.property_id = p.id
            AND cpm.is_active = 1
            AND ci.deleted_at IS NULL
            AND ci.provider_key = 'stayflexi'
            AND ci.status IN ('active', 'test')
        ) as is_stayflexi_active
      FROM properties p`,
  );
  console.log("PATCH adminController: is_stayflexi_active");
}

if (!admin.includes('bookingStatus: "CANCELLED"')) {
  admin = admin.replace(
    `  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [
    booking_id,
  ]);

  // Phase 1: Manual refund`,
    `  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [
    booking_id,
  ]);

  triggerPushBookingForBooking({
    bookingId: booking_id,
    bookingStatus: "CANCELLED",
  }).catch((error) => {
    console.error(
      "Channel manager outbound push failed (processRefund):",
      error,
    );
  });

  // Phase 1: Manual refund`,
  );
  console.log("PATCH adminController: processRefund outbound hook");
}

fs.writeFileSync(adminPath, admin);

const vendorPath = path.join(ROOT, "backend/src/controllers/vendorController.js");
const vendor = fs.readFileSync(vendorPath, "utf8");
if (!vendor.includes("is_stayflexi_active")) {
  copyFromSnapshot("backend/src/controllers/vendorController.js");
}

console.log("CM hooks restore complete.");
