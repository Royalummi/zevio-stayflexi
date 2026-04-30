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
import { sendEmail, _logoImg, _brandFooter } from "../services/emailService.js";
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
            html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email Verification - Zevio</title></head><body style="margin:0;padding:0;font-family:'Inter','Segoe UI',Arial,sans-serif;background-color:#f2f4f7;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f7;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:620px;box-shadow:0 4px 20px rgba(31,58,95,0.08);"><tr><td style="background:#1F3A5F;padding:32px 20px;text-align:center;">${_logoImg}<div style="margin-top:14px;color:#2FA4A9;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:'Inter','Segoe UI',Arial,sans-serif;">EMAIL VERIFICATION</div></td></tr><tr><td style="padding:32px 30px;"><h2 style="margin:0 0 16px;color:#1F3A5F;font-size:20px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Hello ${name}!</h2><p style="margin:0 0 16px;color:#5F6B7A;font-size:15px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Here is a fresh verification link for your corporate account at <strong style="color:#1F3A5F;">${company_name}</strong>:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center"><a href="${verificationLink}" style="display:inline-block;padding:13px 36px;background:#2FA4A9;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Verify Email Address</a></td></tr></table><p style="margin:0;color:#5F6B7A;font-size:13px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Or copy and paste this link:<br><a href="${verificationLink}" style="color:#2FA4A9;word-break:break-all;">${verificationLink}</a></p></td></tr><tr><td>${_brandFooter()}</td></tr></table></td></tr></table></body></html>`,
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
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Zevio Corporate - Verify Email</title></head><body style="margin:0;padding:0;font-family:'Inter','Segoe UI',Arial,sans-serif;background-color:#f2f4f7;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f7;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:620px;box-shadow:0 4px 20px rgba(31,58,95,0.08);"><tr><td style="background:#1F3A5F;padding:32px 20px;text-align:center;">${_logoImg}<div style="margin-top:14px;color:#2FA4A9;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:'Inter','Segoe UI',Arial,sans-serif;">WELCOME TO ZEVIO CORPORATE</div></td></tr><tr><td style="padding:32px 30px;"><h2 style="margin:0 0 16px;color:#1F3A5F;font-size:20px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Hello ${name}!</h2><p style="margin:0 0 16px;color:#5F6B7A;font-size:15px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Thank you for registering your company <strong style="color:#1F3A5F;">${company_name}</strong> with Zevio. Please verify your corporate email address by clicking the button below:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center"><a href="${verificationLink}" style="display:inline-block;padding:13px 36px;background:#2FA4A9;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Verify Email Address</a></td></tr></table><p style="margin:0 0 16px;color:#5F6B7A;font-size:13px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Or copy and paste this link:<br><a href="${verificationLink}" style="color:#2FA4A9;word-break:break-all;">${verificationLink}</a></p><p style="margin:0;color:#5F6B7A;font-size:13px;font-family:'Inter','Segoe UI',Arial,sans-serif;">This link will expire in 24 hours. If you didn't create this account, please ignore this email.</p></td></tr><tr><td>${_brandFooter()}</td></tr></table></td></tr></table></body></html>`,
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
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email Verification - Zevio</title></head><body style="margin:0;padding:0;font-family:'Inter','Segoe UI',Arial,sans-serif;background-color:#f2f4f7;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f7;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:620px;box-shadow:0 4px 20px rgba(31,58,95,0.08);"><tr><td style="background:#1F3A5F;padding:32px 20px;text-align:center;">${_logoImg}<div style="margin-top:14px;color:#2FA4A9;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:'Inter','Segoe UI',Arial,sans-serif;">EMAIL VERIFICATION</div></td></tr><tr><td style="padding:32px 30px;"><h2 style="margin:0 0 16px;color:#1F3A5F;font-size:20px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Hello ${userData.full_name}!</h2><p style="margin:0 0 16px;color:#5F6B7A;font-size:15px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Please verify your corporate email address for <strong style="color:#1F3A5F;">${userData.company_name}</strong>:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center"><a href="${verificationLink}" style="display:inline-block;padding:13px 36px;background:#2FA4A9;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;font-family:'Inter','Segoe UI',Arial,sans-serif;">Verify Email Address</a></td></tr></table><p style="margin:0;color:#5F6B7A;font-size:13px;line-height:1.6;font-family:'Inter','Segoe UI',Arial,sans-serif;">Or copy and paste this link:<br><a href="${verificationLink}" style="color:#2FA4A9;word-break:break-all;">${verificationLink}</a></p></td></tr><tr><td>${_brandFooter()}</td></tr></table></td></tr></table></body></html>`,
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
