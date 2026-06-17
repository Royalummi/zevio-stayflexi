import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [tables] = await connection.query(
  "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('channel_manager_integrations','channel_manager_property_mappings','channel_manager_webhook_events') ORDER BY TABLE_NAME",
  [process.env.DB_NAME],
);
console.log("TABLES:", tables.map((x) => x.TABLE_NAME).join(","));

const [bookingColumns] = await connection.query(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME IN ('booking_source','source_provider_key','source_reference_id','source_payload') ORDER BY ORDINAL_POSITION",
  [process.env.DB_NAME],
);
console.log(
  "BOOKINGS_COLS:",
  bookingColumns.map((x) => x.COLUMN_NAME).join(","),
);

const [blackoutColumns] = await connection.query(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'property_blackout_dates' AND COLUMN_NAME IN ('blackout_source','source_provider_key','source_reference_id') ORDER BY ORDINAL_POSITION",
  [process.env.DB_NAME],
);
console.log(
  "BLACKOUT_COLS:",
  blackoutColumns.map((x) => x.COLUMN_NAME).join(","),
);

const [indexes] = await connection.query(
  "SELECT TABLE_NAME, INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND ((TABLE_NAME = 'bookings' AND INDEX_NAME IN ('idx_bookings_source','uq_booking_provider_reference')) OR (TABLE_NAME = 'property_blackout_dates' AND INDEX_NAME IN ('idx_blackout_source_provider','uq_blackout_provider_reference'))) ORDER BY TABLE_NAME, INDEX_NAME",
  [process.env.DB_NAME],
);
console.log(
  "INDEXES:",
  indexes.map((x) => `${x.TABLE_NAME}.${x.INDEX_NAME}`).join(","),
);

await connection.end();
