import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  requestPropertyChange,
  getVendorChangeRequests,
  getAllChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
} from "../controllers/changeRequestsController.js";

const router = express.Router();

// Validation schemas
const requestChangeValidation = [
  body("requested_changes")
    .notEmpty()
    .withMessage("Requested changes are required")
    .isObject()
    .withMessage("Requested changes must be an object"),
];

const rejectValidation = [
  body("rejection_reason")
    .optional()
    .isString()
    .withMessage("Rejection reason must be a string"),
];

// Vendor routes
router.post(
  "/vendor/properties/:id/request-change",
  authenticate,
  authorize("vendor"),
  requestChangeValidation,
  validate,
  requestPropertyChange
);

router.get(
  "/vendor/change-requests",
  authenticate,
  authorize("vendor"),
  getVendorChangeRequests
);

// Admin routes
router.get(
  "/admin/change-requests",
  authenticate,
  authorize("admin", "super_admin"),
  getAllChangeRequests
);

router.patch(
  "/admin/change-requests/:id/approve",
  authenticate,
  authorize("admin", "super_admin"),
  approveChangeRequest
);

router.patch(
  "/admin/change-requests/:id/reject",
  authenticate,
  authorize("admin", "super_admin"),
  rejectValidation,
  validate,
  rejectChangeRequest
);

export default router;
