/**
 * One-time helper: upsert a super_admin row in `admins`.
 * Usage:
 *   SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... SUPER_ADMIN_NAME=... node scripts/upsert-super-admin.mjs
 */
import { randomUUID } from "crypto";
import db from "../src/config/database.js";
import { hashPassword } from "../src/utils/password.js";

const email = process.env.SUPER_ADMIN_EMAIL?.trim();
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";

if (!email || !password) {
  console.error(
    "Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD environment variables.",
  );
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const [existing] = await db.query(
  "SELECT id, role, status FROM admins WHERE email = ? AND deleted_at IS NULL LIMIT 1",
  [email],
);

if (existing.length > 0) {
  await db.query(
    `UPDATE admins
     SET name = ?, password_hash = ?, role = 'super_admin', status = 'active'
     WHERE id = ?`,
    [name, passwordHash, existing[0].id],
  );
  console.log(`Updated super_admin: ${email} (id: ${existing[0].id})`);
} else {
  const id = randomUUID();
  await db.query(
    `INSERT INTO admins (id, name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'super_admin', 'active')`,
    [id, name, email, passwordHash],
  );
  console.log(`Created super_admin: ${email} (id: ${id})`);
}

process.exit(0);
