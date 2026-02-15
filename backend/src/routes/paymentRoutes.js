import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getInvoice,
} from "../controllers/paymentController.js";

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  validate,
];

const verifyPaymentValidation = [
  body("order_id").notEmpty().withMessage("Order ID is required"),
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  validate,
];

// Webhook (no authentication)
router.post("/webhook", handleWebhook);

// Protected routes
router.post(
  "/create-order",
  authenticate,
  authorize("user"),
  createOrderValidation,
  createPaymentOrder,
);
router.post(
  "/verify",
  authenticate,
  authorize("user"),
  verifyPaymentValidation,
  verifyPayment,
);

// Admin routes
router.get(
  "/history",
  authenticate,
  authorize("admin", "super_admin"),
  getPaymentHistory,
);

// Invoice route (user can access their own, admin can access all)
router.get(
  "/invoice/:bookingId",
  authenticate,
  authorize("user", "admin", "super_admin"),
  getInvoice,
);

export default router;
