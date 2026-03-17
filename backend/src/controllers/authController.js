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
import { sendForgotPasswordLinkEmail } from "../services/emailService.js";

// Login (Multi-role) - Auto-detect user type
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  let user = null;
  let roleValue = null;

  // Check in all user tables to auto-detect role
  const tables = [
    { name: "admins", roleField: "role" }, // admin or super_admin
    { name: "users", roleField: null, defaultRole: "user" },
    { name: "employees", roleField: null, defaultRole: "employee" },
    { name: "vendors", roleField: null, defaultRole: "vendor" },
  ];

  for (const table of tables) {
    const [rows] = await db.query(
      `SELECT * FROM ${table.name} WHERE email = ? AND status = 'active' AND deleted_at IS NULL`,
      [email],
    );

    if (rows.length > 0) {
      user = rows[0];

      // Verify password
      const isPasswordValid = await comparePassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        return sendError(res, "Invalid email or password", 401);
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
    return sendError(res, "Invalid email or password", 401);
  }

  // Check if password change is required (for temp passwords)
  if (user.password_change_required === 1) {
    // Generate temporary token valid for 15 minutes
    const tempToken = generateTokens({
      id: user.id,
      email: user.email,
      role: roleValue,
      name: user.name || user.full_name,
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
    email: user.email,
    role: roleValue,
    name: user.name || user.full_name,
  });

  // Remove sensitive data
  delete user.password_hash;

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

  // Check if user already exists
  const [existingUsers] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );

  if (existingUsers.length > 0) {
    return sendError(res, "User with this email already exists", 409);
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
    email: user.email,
    role: "user",
    name: user.full_name,
  });

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

// Refresh Token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, "Refresh token is required", 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = generateTokens({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    });

    sendSuccess(res, tokens, "Token refreshed successfully", 200);
  } catch (error) {
    return sendError(res, "Invalid or expired refresh token", 401);
  }
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just send a success response
  // The client should remove tokens from storage

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
    case "employee":
      tableName = "employees";
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

  sendSuccess(res, { ...user, role }, "Profile fetched successfully", 200);
});

// Update Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const updates = req.body;

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.email;
  delete updates.password_hash;
  delete updates.role;
  delete updates.status;
  delete updates.created_at;
  delete updates.deleted_at;

  if (Object.keys(updates).length === 0) {
    return sendError(res, "No fields to update", 400);
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
    case "employee":
      tableName = "employees";
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
    case "employee":
      tableName = "employees";
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
    email: user.email,
    role: role,
    name: user.name || user.full_name,
  });

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
    case "employee":
      tableName = "employees";
      break;
    case "vendor":
      tableName = "vendors";
      break;
    default:
      return sendError(res, "Invalid role", 400);
  }

  // Avatar URL (relative path from uploads folder)
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

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

  sendSuccess(res, { user }, "Avatar uploaded successfully", 200);
});

// Get user settings
export const getSettings = asyncHandler(async (req, res) => {
  const { id } = req.user;

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
  const { id } = req.user;
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

  // Check if user exists
  const [users] = await db.query(
    "SELECT id, full_name, email FROM users WHERE email = ? AND status = 'active' AND deleted_at IS NULL",
    [email],
  );

  if (users.length === 0) {
    // Don't reveal if email exists or not for security
    return sendSuccess(
      res,
      {},
      "If the email exists, a reset link has been sent",
      200,
    );
  }

  const user = users[0];

  // Generate a cryptographically secure reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  // Store token in database
  await db.query(
    "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
    [resetToken, resetTokenExpiry, user.id],
  );

  // Send reset link via email
  await sendForgotPasswordLinkEmail(user.email, user.full_name, resetToken);

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

  // Find user with valid token
  const [users] = await db.query(
    "SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND deleted_at IS NULL",
    [token],
  );

  if (users.length === 0) {
    return sendError(res, "Invalid or expired reset token", 400);
  }

  const user = users[0];

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset token
  await db.query(
    "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
    [hashedPassword, user.id],
  );

  sendSuccess(
    res,
    {},
    "Password reset successful. You can now login with your new password.",
    200,
  );
});
