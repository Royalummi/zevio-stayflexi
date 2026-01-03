import db from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateTokens, verifyRefreshToken } from "../config/jwt.js";
import { generateUUID } from "../utils/helpers.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";

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
      [email]
    );

    if (rows.length > 0) {
      user = rows[0];

      // Verify password
      const isPasswordValid = await comparePassword(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return sendError(res, "Invalid email or password", 401);
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
    200
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
    [email]
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
    [userId, full_name, email, phone || null, password_hash]
  );

  // Fetch created user
  const [rows] = await db.query(
    "SELECT id, full_name, email, phone, status, created_at FROM users WHERE id = ?",
    [userId]
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
    201
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
    [id]
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
      400
    );
  }

  if (newPassword.length < 6) {
    return sendError(res, "New password must be at least 6 characters", 400);
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
    [id]
  );

  if (rows.length === 0) {
    return sendError(res, "User not found", 404);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(
    currentPassword,
    rows[0].password_hash
  );

  if (!isPasswordValid) {
    return sendError(res, "Current password is incorrect", 400);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db.query(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`, [
    newPasswordHash,
    id,
  ]);

  sendSuccess(res, null, "Password changed successfully", 200);
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
