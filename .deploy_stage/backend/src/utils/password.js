import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate secure temporary password
 * @param {number} length - Length of password (default: 8)
 * @returns {string} - Alphanumeric password (e.g., "Xy7zPq2M")
 */
export const generateSecurePassword = (length = 8) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const allChars = uppercase + lowercase + numbers;

  let password = "";

  // Ensure at least one uppercase, one lowercase, and one number
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];

  // Fill remaining characters randomly
  for (let i = 3; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle password to randomize character positions
  return password
    .split("")
    .sort(() => crypto.randomInt(-1, 2))
    .join("");
};

/**
 * Validate password strength for user-created passwords
 * @param {string} password - Password to validate
 * @returns {object} - {isValid: boolean, errors: string[]}
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*...)",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
