import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate } from "../middlewares/auth.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../middlewares/upload.js";
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../controllers/authController.js";

const router = express.Router();

// Validation rules
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  // Role is auto-detected by the backend based on email lookup
  validate,
];

const registerValidation = [
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number is required"),
  validate,
];

const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  validate,
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
  validate,
];

// Public routes
router.post("/login", loginValidation, login);
router.post("/register", registerValidation, register);
router.post("/refresh", refreshTokenValidation, refreshToken);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  changePassword
);
router.post(
  "/upload-avatar",
  authenticate,
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);

export default router;
