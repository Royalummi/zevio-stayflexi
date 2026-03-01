/**
 * ============================================================================
 * CORPORATE CONTROLLER
 * ============================================================================
 * Handles corporate user registration and email verification
 *
 * Author: Senior Full-Stack Developer
 * Date: January 17, 2026
 * Session: 35 - Service Apartments Expansion
 * ============================================================================
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../config/database.js";
import { sendEmail } from "../services/emailService.js";
import { generateTokens } from "../config/jwt.js";

const TOKEN_EXPIRY_HOURS = 24;

/**
 * POST /api/auth/register-corporate
 * Register a new corporate user
 */
export const registerCorporate = async (req, res) => {
  try {
    const {
      full_name,
      name: _name,
      email,
      password,
      phone,
      company_name,
    } = req.body;
    // Accept either full_name (frontend) or name (legacy)
    const name = full_name || _name;

    // Validate required fields
    if (!name || !email || !password || !phone || !company_name) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, phone, and company_name are required",
      });
    }

    // Validate corporate email — reject free/personal email providers
    const FREE_EMAIL_DOMAINS = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "live.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
      "mail.com",
      "ymail.com",
      "rediffmail.com",
      "zoho.com",
      "inbox.com",
      "gmx.com",
      "fastmail.com",
      "me.com",
      "mac.com",
      "msn.com",
      "yahoo.in",
      "yahoo.co.in",
    ];
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || FREE_EMAIL_DOMAINS.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message:
          "Corporate registration requires a company email address. Free email providers are not accepted.",
      });
    }

    // Check if user already exists
    const [existingUser] = await db.query(
      "SELECT id, email, is_corporate_user, company_email_verified FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      const existing = existingUser[0];

      // Corporate account exists but email not yet verified → resend the link
      if (existing.is_corporate_user && !existing.company_email_verified) {
        const newToken = crypto.randomBytes(32).toString("hex");
        const newExpiry = new Date(
          Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
        );
        await db.query(
          "UPDATE users SET email_verification_token = ?, email_verification_token_expiry = ?, company_name = ?, full_name = ? WHERE id = ?",
          [newToken, newExpiry, company_name, name, existing.id],
        );
        const verificationLink = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/verify-email?token=${newToken}`;
        try {
          await sendEmail({
            to: email,
            subject: "Verify Your Corporate Account - Zevio",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Email Verification</h2>
                <p>Hello ${name},</p>
                <p>Here is a fresh verification link for your corporate account at <strong>${company_name}</strong>:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}"
                     style="background-color: #2563eb; color: white; padding: 12px 30px;
                            text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Error resending verification email:", emailError);
        }
        return res.status(200).json({
          success: true,
          resent: true,
          message:
            "A new verification link has been sent to your email. Please check your inbox.",
          data: {
            email,
            company_name,
            verification_required: true,
          },
        });
      }

      // Corporate account already verified
      if (existing.is_corporate_user && existing.company_email_verified) {
        return res.status(409).json({
          success: false,
          message:
            "This email is already registered and verified. Please log in.",
        });
      }

      // Regular (non-corporate) account with same email
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in instead.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token + expiry
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // Insert user
    const userId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (
        id, full_name, email, password_hash, phone,
        is_corporate_user, company_name,
        email_verification_token, email_verification_token_expiry, company_email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email,
        hashedPassword,
        phone,
        true,
        company_name,
        verificationToken,
        tokenExpiry,
        false,
      ],
    );

    // Send verification email
    const verificationLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email?token=${verificationToken}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify Your Corporate Account - Zevio",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Zevio Corporate!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering your company <strong>${company_name}</strong> with Zevio.</p>
            <p>Please verify your corporate email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              This link will expire in 24 hours. If you didn't create this account, please ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              © 2026 Zevio. All rights reserved.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails - user can resend later
    }

    res.status(201).json({
      success: true,
      message:
        "Corporate account created successfully. Please check your email to verify your account.",
      data: {
        user_id: userId,
        email: email,
        company_name: company_name,
        verification_required: true,
      },
    });
  } catch (error) {
    console.error("Error registering corporate user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register corporate user",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/verify-corporate-email
 * Verify corporate email address
 */
export const verifyCorporateEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find user with this token
    const [user] = await db.query(
      `SELECT id, full_name, email, company_name, company_email_verified, email_verification_token_expiry
       FROM users 
       WHERE email_verification_token = ? AND is_corporate_user = TRUE`,
      [token],
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const userData = user[0];

    // Check token expiry
    if (
      userData.email_verification_token_expiry &&
      new Date() > new Date(userData.email_verification_token_expiry)
    ) {
      // Clear expired token
      await db.query(
        "UPDATE users SET email_verification_token = NULL, email_verification_token_expiry = NULL WHERE id = ?",
        [userData.id],
      );
      return res.status(410).json({
        success: false,
        expired: true,
        message:
          "This verification link has expired. Please request a new one.",
      });
    }

    // Check if already verified
    if (userData.company_email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified. You can log in.",
      });
    }

    // Mark email as verified
    await db.query(
      `UPDATE users 
       SET company_email_verified = TRUE,
           email_verified_at = NOW(),
           email_verification_token = NULL,
           email_verification_token_expiry = NULL
       WHERE id = ?`,
      [userData.id],
    );

    // Generate login tokens so user is auto-logged in after verification
    const tokens = generateTokens({
      id: userData.id,
      email: userData.email,
      role: "user",
      name: userData.full_name,
    });

    res.json({
      success: true,
      message: "Corporate email verified successfully! Logging you in…",
      data: {
        user_id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        company_name: userData.company_name,
        verified: true,
        ...tokens,
      },
    });
  } catch (error) {
    console.error("Error verifying corporate email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify email",
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/corporate-status
 * Check corporate verification status
 */
export const getCorporateStatus = async (req, res) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [user] = await db.query(
      `SELECT 
        id,
        name,
        email,
        is_corporate_user,
        company_name,
        company_email_verified,
        email_verified_at
       FROM users 
       WHERE id = ?`,
      [userId],
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = user[0];

    res.json({
      success: true,
      data: {
        is_corporate: Boolean(userData.is_corporate_user),
        company_name: userData.company_name,
        email_verified: Boolean(userData.company_email_verified),
        verified_at: userData.email_verified_at,
        can_access_corporate_offers: Boolean(
          userData.is_corporate_user && userData.company_email_verified,
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching corporate status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch corporate status",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/resend-corporate-verification
 * Resend corporate email verification
 */
export const resendCorporateVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const [user] = await db.query(
      `SELECT id, full_name, email, company_name, is_corporate_user, company_email_verified
       FROM users 
       WHERE email = ?`,
      [email],
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = user[0];

    if (!userData.is_corporate_user) {
      return res.status(400).json({
        success: false,
        message: "Not a corporate account",
      });
    }

    if (userData.company_email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Generate new verification token + expiry
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // Update token in database
    await db.query(
      "UPDATE users SET email_verification_token = ?, email_verification_token_expiry = ? WHERE id = ?",
      [verificationToken, tokenExpiry, userData.id],
    );

    // Send verification email
    const verificationLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify Your Corporate Account - Zevio",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>Hello ${userData.full_name},</p>
          <p>Please verify your corporate email address for <strong>${userData.company_name}</strong>:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link:</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
};
