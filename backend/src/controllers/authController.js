import crypto from "crypto";
import db from "../config/database.js";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/password.js";
import { generateTokens, verifyRefreshToken } from "../config/jwt.js";
import { generateUUID } from "../utils/helpers.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import {
  sendForgotPasswordLinkEmail,
  sendSelfSignupWelcomeEmail,
} from "../services/emailService.js";
import {
  uploadToR2,
  isR2Configured,
  ensureR2Folder,
} from "../utils/r2Storage.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Helper: hash a token with SHA-256
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const normalizeAvatarUrl = (avatar, req) => {
  if (!avatar) return avatar;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  if (avatar.startsWith("/")) {
    return `${req.protocol}://${req.get("host")}${avatar}`;
  }
  return avatar;
};

// Helper: store refresh token in DB
const storeRefreshToken = async (userId, userTable, refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const id = generateUUID();
  await db.query(
    "INSERT INTO refresh_tokens (id, user_id, user_table, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)",
    [id, userId, userTable, tokenHash, expiresAt],
  );
};

// Helper: check & update login attempts (account lockout)
const checkLoginAttempts = async (email) => {
  const [rows] = await db.query(
    "SELECT attempts, locked_until FROM login_attempts WHERE email = ?",
    [email],
  );
  if (rows.length === 0) return { locked: false };
  const { attempts, locked_until } = rows[0];
  if (locked_until && new Date(locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(locked_until) - new Date()) / 60000,
    );
    return { locked: true, minutesLeft };
  }
  // If lock expired, reset
  if (locked_until && new Date(locked_until) <= new Date()) {
    await db.query(
      "UPDATE login_attempts SET attempts = 0, locked_until = NULL WHERE email = ?",
      [email],
    );
    return { locked: false };
  }
  return { locked: false, attempts };
};

const recordFailedAttempt = async (email) => {
  const [rows] = await db.query(
    "SELECT attempts FROM login_attempts WHERE email = ?",
    [email],
  );
  if (rows.length === 0) {
    await db.query(
      "INSERT INTO login_attempts (email, attempts) VALUES (?, 1)",
      [email],
    );
    return 1;
  }
  const newAttempts = rows[0].attempts + 1;
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await db.query(
      "UPDATE login_attempts SET attempts = ?, locked_until = ? WHERE email = ?",
      [newAttempts, lockedUntil, email],
    );
  } else {
    await db.query("UPDATE login_attempts SET attempts = ? WHERE email = ?", [
      newAttempts,
      email,
    ]);
  }
  return newAttempts;
};

const clearLoginAttempts = async (email) => {
  await db.query("DELETE FROM login_attempts WHERE email = ?", [email]);
};

// Login (Multi-role) - Auto-detect user type
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  // Check account lockout
  const lockStatus = await checkLoginAttempts(email);
  if (lockStatus.locked) {
    return sendError(
      res,
      `Account temporarily locked. Try again in ${lockStatus.minutesLeft} minute(s).`,
      429,
    );
  }

  let user = null;
  let roleValue = null;
  let tableName = null;

  // Check in all user tables to auto-detect role.
  // Order matters: admins first (highest privilege), then vendors, then users.
  // If the same email exists in multiple tables (e.g. users + vendors),
  // the first match wins — so vendors must come before users.
  const tables = [
    { name: "admins", roleField: "role" }, // admin or super_admin
    { name: "vendors", roleField: null, defaultRole: "vendor" },
    { name: "users", roleField: null, defaultRole: "user" },
  ];

  for (const table of tables) {
    const [rows] = await db.query(
      `SELECT * FROM ${table.name} WHERE email = ? AND status = 'active' AND deleted_at IS NULL`,
      [email],
    );

    if (rows.length > 0) {
      user = rows[0];
      tableName = table.name;

      // Verify password
      const isPasswordValid = await comparePassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        const attempts = await recordFailedAttempt(email);
        const remaining = MAX_LOGIN_ATTEMPTS - attempts;
        if (remaining <= 0) {
          return sendError(
            res,
            "Account locked due to too many failed attempts. Try again in 15 minutes.",
            429,
          );
        }
        return sendError(
          res,
          `Invalid email or password. ${remaining} attempt(s) remaining.`,
          401,
        );
      }

      // Block unverified corporate users from logging in
      if (
        table.name === "users" &&
        user.is_corporate_user === 1 &&
        user.company_email_verified !== 1
      ) {
        return res.status(403).json({
          success: false,
          corporate_unverified: true,
          email: user.email,
          message:
            "Please verify your corporate email before logging in. Check your inbox or request a new link.",
        });
      }

      // Set role based on table
      if (table.roleField) {
        roleValue = user[table.roleField]; // For admins: 'admin' or 'super_admin'
      } else {
        roleValue = table.defaultRole;
      }

      break; // Found user, exit loop
    }
  }

  // If no user found in any table
  if (!user) {
    await recordFailedAttempt(email);
    return sendError(res, "Invalid email or password", 401);
  }

  // Clear failed attempts on successful login
  await clearLoginAttempts(email);

  // Check if password change is required (for temp passwords)
  if (user.password_change_required === 1) {
    // Generate temporary token valid for 15 minutes
    const tempToken = generateTokens({
      id: user.id,
      role: roleValue,
      isTemporary: true,
    });

    return sendSuccess(
      res,
      {
        requirePasswordChange: true,
        tempToken: tempToken.accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.full_name,
          role: roleValue,
        },
      },
      "Password change required. Please set a new password to continue.",
      200,
    );
  }

  // Generate tokens
  const tokens = generateTokens({
    id: user.id,
    role: roleValue,
  });

  // Store refresh token hash in DB
  await storeRefreshToken(user.id, tableName, tokens.refreshToken);

  // Remove sensitive data
  delete user.password_hash;
  delete user.reset_token;
  delete user.reset_token_expiry;

  sendSuccess(
    res,
    {
      user: {
        ...user,
        role: roleValue,
      },
      ...tokens,
    },
    "Login successful",
    200,
  );
});

// Register (User only)
export const register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, "Full name, email, and password are required", 400);
  }

  // Check if email already exists in ANY table (users, vendors, admins)
  // to prevent duplicate accounts that cause role-mismatch issues on login
  const [existingUsers] = await db.query(
    "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL",
    [email],
  );
  const [existingVendors] = await db.query(
    "SELECT id FROM vendors WHERE email = ? AND deleted_at IS NULL",
    [email],
  );
  const [existingAdmins] = await db.query(
    "SELECT id FROM admins WHERE email = ? AND deleted_at IS NULL",
    [email],
  );

  if (
    existingUsers.length > 0 ||
    existingVendors.length > 0 ||
    existingAdmins.length > 0
  ) {
    return sendError(res, "An account with this email already exists", 409);
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const userId = generateUUID();
  await db.query(
    "INSERT INTO users (id, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)",
    [userId, full_name, email, phone || null, password_hash],
  );

  // Fetch created user
  const [rows] = await db.query(
    "SELECT id, full_name, email, phone, status, created_at FROM users WHERE id = ?",
    [userId],
  );

  const user = rows[0];

  // Generate tokens
  const tokens = generateTokens({
    id: user.id,
    role: "user",
  });

  // Store refresh token in DB
  await storeRefreshToken(user.id, "users", tokens.refreshToken);

  // Send welcome email after successful self-signup.
  // Do not block registration if email delivery fails.
  try {
    await sendSelfSignupWelcomeEmail(user.email, user.full_name);
  } catch (emailError) {
    console.error("Failed to send self-signup welcome email:", emailError);
  }

  sendSuccess(
    res,
    {
      user: {
        ...user,
        role: "user",
      },
      ...tokens,
    },
    "Registration successful",
    201,
  );
});

// Refresh Token (with rotation)
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, "Refresh token is required", 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify refresh token exists in DB
    const tokenHash = hashToken(refreshToken);
    const [tokenRows] = await db.query(
      "SELECT id, user_table FROM refresh_tokens WHERE token_hash = ? AND user_id = ? AND expires_at > NOW()",
      [tokenHash, decoded.id],
    );

    if (tokenRows.length === 0) {
      return sendError(res, "Refresh token has been revoked", 401);
    }

    // Delete the used refresh token (rotation: one-time use)
    await db.query("DELETE FROM refresh_tokens WHERE id = ?", [
      tokenRows[0].id,
    ]);

    // Generate new token pair
    const tokens = generateTokens({
      id: decoded.id,
      role: decoded.role,
    });

    // Store new refresh token in DB
    await storeRefreshToken(
      decoded.id,
      tokenRows[0].user_table,
      tokens.refreshToken,
    );

    sendSuccess(res, tokens, "Token refreshed successfully", 200);
  } catch (error) {
    return sendError(res, "Invalid or expired refresh token", 401);
  }
});

// Logout - Invalidate refresh token
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Delete the specific refresh token from DB
    const tokenHash = hashToken(refreshToken);
    await db.query("DELETE FROM refresh_tokens WHERE token_hash = ?", [
      tokenHash,
    ]);
  }

  // Also clean up expired tokens for this user
  if (req.user?.id) {
    await db.query(
      "DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()",
      [req.user.id],
    );
  }

  sendSuccess(res, null, "Logout successful", 200);
});

// Get Current User Profile
export const getProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  let tableName;
  switch (role) {
    case "user":
      tableName = "users";
      break;
    case "admin":
    case "super_admin":
      tableName = "admins";
      break;
    case "vendor":
      tableName = "vendors";
      break;
    default:
      return sendError(res, "Invalid role", 400);
  }

  const [rows] = await db.query(
    `SELECT * FROM ${tableName} WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  if (rows.length === 0) {
    return sendError(res, "User not found", 404);
  }

  const user = rows[0];
  delete user.password_hash;
  delete user.reset_token;
  delete user.reset_token_expiry;

  // Parse bank_details JSON if present
  if (user.bank_details) {
    try {
      user.bank_details =
        typeof user.bank_details === "string"
          ? JSON.parse(user.bank_details)
          : user.bank_details;
    } catch (_) {
      user.bank_details = null;
    }
  }

  user.avatar = normalizeAvatarUrl(user.avatar, req);

  sendSuccess(res, { ...user, role }, "Profile fetched successfully", 200);
});

// Update Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  // Per-role whitelist of updatable columns
  const ALLOWED_FIELDS = {
    vendor: [
      "name",
      "phone",
      "gst_number",
      "is_gst_registered",
      "company_name",
      "pan_number",
      "address",
      "city",
      "state",
      "pincode",
      "bank_details",
    ],
    user: ["full_name", "phone", "address", "bio", "bank_details"],
    admin: ["name", "phone"],
    super_admin: ["name", "phone"],
  };

  const allowed = ALLOWED_FIELDS[role] || [];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      // Serialize JSON fields
      if (key === "bank_details") {
        updates[key] = req.body[key] ? JSON.stringify(req.body[key]) : null;
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, "No valid fields to update", 400);
  }

  let tableName;
  switch (role) {
    case "user":
      tableName = "users";
      break;
    case "admin":
    case "super_admin":
      tableName = "admins";
      break;
    case "vendor":
      tableName = "vendors";
      break;
    default:
      return sendError(res, "Invalid role", 400);
  }

  // Build update query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  await db.query(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  // Fetch updated user
  const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [
    id,
  ]);

  const user = rows[0];
  delete user.password_hash;

  // Parse bank_details JSON if present
  if (user.bank_details) {
    try {
      user.bank_details =
        typeof user.bank_details === "string"
          ? JSON.parse(user.bank_details)
          : user.bank_details;
    } catch (_) {
      user.bank_details = null;
    }
  }

  user.avatar = normalizeAvatarUrl(user.avatar, req);

  sendSuccess(res, { ...user, role }, "Profile updated successfully", 200);
});

// Change Password
export const changePassword = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(
      res,
      "Current password and new password are required",
      400,
    );
  }

  if (newPassword.length < 8) {
    return sendError(res, "New password must be at least 8 characters", 400);
  }

  let tableName;
  switch (role) {
    case "user":
      tableName = "users";
      break;
    case "admin":
    case "super_admin":
      tableName = "admins";
      break;
    case "vendor":
      tableName = "vendors";
      break;
    default:
      return sendError(res, "Invalid role", 400);
  }

  // Fetch current user
  const [rows] = await db.query(
    `SELECT password_hash FROM ${tableName} WHERE id = ?`,
    [id],
  );

  if (rows.length === 0) {
    return sendError(res, "User not found", 404);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(
    currentPassword,
    rows[0].password_hash,
  );

  if (!isPasswordValid) {
    return sendError(res, "Current password is incorrect", 400);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db.query(
    `UPDATE ${tableName} SET password_hash = ?, last_password_change = NOW() WHERE id = ?`,
    [newPasswordHash, id],
  );

  sendSuccess(res, null, "Password changed successfully", 200);
});

// Force reset password (for first-time login with temporary password)
export const forceResetPassword = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!email || !currentPassword || !newPassword) {
    return sendError(
      res,
      "Email, current password, and new password are required",
      400,
    );
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return sendError(res, passwordValidation.errors.join(", "), 400);
  }

  // Find user in users or vendors table
  let user = null;
  let tableName = null;
  let role = null;

  // Check users table
  const [users] = await db.query(
    "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
    [email],
  );

  if (users.length > 0) {
    user = users[0];
    tableName = "users";
    role = "user";
  }

  // Check vendors table if not found in users
  if (!user) {
    const [vendors] = await db.query(
      "SELECT * FROM vendors WHERE email = ? AND deleted_at IS NULL",
      [email],
    );

    if (vendors.length > 0) {
      user = vendors[0];
      tableName = "vendors";
      role = "vendor";
    }
  }

  // User not found
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  // Verify current (temporary) password
  const isPasswordValid = await comparePassword(
    currentPassword,
    user.password_hash,
  );

  if (!isPasswordValid) {
    return sendError(res, "Current password is incorrect", 400);
  }

  // Check if password change is actually required
  if (user.password_change_required !== 1) {
    return sendError(
      res,
      "Password change not required. Please use the normal login flow.",
      400,
    );
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password and clear temp password flags
  await db.query(
    `UPDATE ${tableName} 
     SET password_hash = ?, 
         is_temporary_password = 0, 
         password_change_required = 0,
         last_password_change = NOW()
     WHERE id = ?`,
    [newPasswordHash, user.id],
  );

  // Generate regular tokens
  const tokens = generateTokens({
    id: user.id,
    role: role,
  });

  // Store refresh token in DB
  await storeRefreshToken(user.id, tableName, tokens.refreshToken);

  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        email: user.email,
        // Use full_name to match the User interface expected by the frontend
        full_name: user.full_name || user.name,
        role: role,
      },
      ...tokens,
    },
    "Password changed successfully. You can now login.",
    200,
  );
});

// Upload Avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  if (!req.file) {
    return sendError(res, "Please upload an image file", 400);
  }

  // Determine table based on role
  let tableName;
  switch (role) {
    case "user":
      tableName = "users";
      break;
    case "admin":
    case "super_admin":
      tableName = "admins";
      break;
    case "vendor":
      tableName = "vendors";
      break;
    default:
      return sendError(res, "Invalid role", 400);
  }

  let avatarUrl;
  if (isR2Configured()) {
    if (!req.file.buffer) {
      return sendError(res, "Avatar file buffer missing", 400);
    }

    await ensureR2Folder("profiles");
    const ext = req.file.originalname?.split(".").pop() || "webp";
    avatarUrl = await uploadToR2(req.file.buffer, "profiles", null, {
      ext,
      maxWidth: 512,
      maxHeight: 512,
      quality: 82,
    });
  } else {
    if (!req.file.filename) {
      return sendError(res, "Avatar filename missing", 400);
    }

    const localPath = `/uploads/avatars/${req.file.filename}`;
    avatarUrl = `${req.protocol}://${req.get("host")}${localPath}`;
  }

  // Update user avatar in database
  await db.query(`UPDATE ${tableName} SET avatar = ? WHERE id = ?`, [
    avatarUrl,
    id,
  ]);

  // Fetch updated user
  const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [
    id,
  ]);

  if (rows.length === 0) {
    return sendError(res, "User not found", 404);
  }

  const user = rows[0];
  delete user.password_hash; // Don't send password hash
  user.avatar = normalizeAvatarUrl(user.avatar, req);

  sendSuccess(res, { user }, "Avatar uploaded successfully", 200);
});

// Get user settings
export const getSettings = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  // Admins and vendors are not in the users table,
  // so user_settings FK would fail. Return defaults for them.
  const nonUserRoles = ["super_admin", "admin", "vendor"];
  if (nonUserRoles.includes(role)) {
    return sendSuccess(
      res,
      {
        settings: {
          email_notifications: true,
          email_promotions: true,
          email_reminders: true,
          sms_notifications: false,
          sms_reminders: false,
          push_notifications: true,
          profile_visibility: "private",
          show_wishlist: false,
          share_activity: false,
          newsletter_subscription: true,
        },
      },
      "Settings retrieved successfully",
      200,
    );
  }

  const [settings] = await db.query(
    "SELECT * FROM user_settings WHERE user_id = ?",
    [id],
  );

  if (settings.length === 0) {
    // Create default settings if they don't exist
    const settingsId = generateUUID();
    await db.query(
      `INSERT INTO user_settings (id, user_id, email_notifications, email_promotions, email_reminders, 
       sms_notifications, sms_reminders, push_notifications, profile_visibility, show_wishlist, 
       share_activity, newsletter_subscription) 
       VALUES (?, ?, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, 'private', FALSE, FALSE, TRUE)`,
      [settingsId, id],
    );

    const [newSettings] = await db.query(
      "SELECT * FROM user_settings WHERE id = ?",
      [settingsId],
    );
    return sendSuccess(
      res,
      { settings: newSettings[0] },
      "Default settings created",
      200,
    );
  }

  sendSuccess(
    res,
    { settings: settings[0] },
    "Settings retrieved successfully",
    200,
  );
});

// Update user settings
export const updateSettings = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  // Admins and vendors are not in the users table
  const nonUserRoles = ["super_admin", "admin", "vendor"];
  if (nonUserRoles.includes(role)) {
    return sendSuccess(res, {}, "Settings updated successfully", 200);
  }

  const {
    email_notifications,
    email_promotions,
    email_reminders,
    sms_notifications,
    sms_reminders,
    push_notifications,
    profile_visibility,
    show_wishlist,
    share_activity,
    newsletter_subscription,
  } = req.body;

  // Check if settings exist
  const [existing] = await db.query(
    "SELECT id FROM user_settings WHERE user_id = ?",
    [id],
  );

  if (existing.length === 0) {
    // Create settings if they don't exist
    const settingsId = generateUUID();
    await db.query(
      `INSERT INTO user_settings (id, user_id, email_notifications, email_promotions, email_reminders, 
       sms_notifications, sms_reminders, push_notifications, profile_visibility, show_wishlist, 
       share_activity, newsletter_subscription) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settingsId,
        id,
        email_notifications ?? true,
        email_promotions ?? true,
        email_reminders ?? true,
        sms_notifications ?? false,
        sms_reminders ?? false,
        push_notifications ?? true,
        profile_visibility ?? "private",
        show_wishlist ?? false,
        share_activity ?? false,
        newsletter_subscription ?? true,
      ],
    );
  } else {
    // Update existing settings
    await db.query(
      `UPDATE user_settings SET 
       email_notifications = ?, email_promotions = ?, email_reminders = ?, 
       sms_notifications = ?, sms_reminders = ?, push_notifications = ?, 
       profile_visibility = ?, show_wishlist = ?, share_activity = ?, newsletter_subscription = ?
       WHERE user_id = ?`,
      [
        email_notifications,
        email_promotions,
        email_reminders,
        sms_notifications,
        sms_reminders,
        push_notifications,
        profile_visibility,
        show_wishlist,
        share_activity,
        newsletter_subscription,
        id,
      ],
    );
  }

  // Fetch updated settings
  const [updated] = await db.query(
    "SELECT * FROM user_settings WHERE user_id = ?",
    [id],
  );

  sendSuccess(
    res,
    { settings: updated[0] },
    "Settings updated successfully",
    200,
  );
});

// Get user activity log
export const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  const [activities] = await db.query(
    `SELECT * FROM activity_logs 
     WHERE actor_id = ? AND actor_role = 'user' 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [id, parseInt(limit), parseInt(offset)],
  );

  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) as total FROM activity_logs WHERE actor_id = ? AND actor_role = 'user'",
    [id],
  );

  sendSuccess(
    res,
    {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    "Activity log retrieved successfully",
    200,
  );
});

// Forgot password - Generate reset token and send email
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, "Email is required", 400);
  }

  // Check all user tables for this email (admins first, then vendors, then users)
  const tablesToCheck = [
    { name: "admins", nameField: "name" },
    { name: "vendors", nameField: "name" },
    { name: "users", nameField: "full_name" },
  ];

  let foundUser = null;
  let foundTable = null;

  for (const table of tablesToCheck) {
    const [rows] = await db.query(
      `SELECT id, ${table.nameField} as display_name, email FROM ${table.name} WHERE email = ? AND status = 'active' AND deleted_at IS NULL`,
      [email],
    );
    if (rows.length > 0) {
      foundUser = rows[0];
      foundTable = table.name;
      break;
    }
  }

  if (!foundUser) {
    // Don't reveal if email exists or not for security
    return sendSuccess(
      res,
      {},
      "If the email exists, a reset link has been sent",
      200,
    );
  }

  // Generate a cryptographically secure reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  // Store HASHED token in database (so DB leak doesn't expose tokens)
  const hashedToken = hashToken(resetToken);
  await db.query(
    `UPDATE ${foundTable} SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
    [hashedToken, resetTokenExpiry, foundUser.id],
  );

  // Send reset link via email (send the RAW token — user will present it back)
  await sendForgotPasswordLinkEmail(
    foundUser.email,
    foundUser.display_name,
    resetToken,
  );

  sendSuccess(res, {}, "If the email exists, a reset link has been sent", 200);
});

// Reset password with token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return sendError(res, "Token and new password are required", 400);
  }

  if (newPassword.length < 6) {
    return sendError(res, "Password must be at least 6 characters", 400);
  }

  // Hash the presented token and look it up in all tables
  const hashedToken = hashToken(token);

  const tablesToCheck = ["admins", "vendors", "users"];
  let foundUser = null;
  let foundTable = null;

  for (const table of tablesToCheck) {
    const [rows] = await db.query(
      `SELECT id, email FROM ${table} WHERE reset_token = ? AND reset_token_expiry > NOW() AND deleted_at IS NULL`,
      [hashedToken],
    );
    if (rows.length > 0) {
      foundUser = rows[0];
      foundTable = table;
      break;
    }
  }

  if (!foundUser) {
    return sendError(res, "Invalid or expired reset token", 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset token
  await db.query(
    `UPDATE ${foundTable} SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
    [hashedPassword, foundUser.id],
  );

  sendSuccess(
    res,
    {},
    "Password reset successful. You can now login with your new password.",
    200,
  );
});
