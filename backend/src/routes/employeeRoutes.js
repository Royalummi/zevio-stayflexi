import express from "express";
import employeeController from "../controllers/employeeController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All routes require employee authentication
router.use(authenticate);
router.use(authorize(["employee"]));

// Dashboard
router.get("/dashboard", employeeController.getDashboardStats);

// Points
router.get("/points", employeeController.getPoints);

// Claims
router.get("/claims", employeeController.getClaims);
router.post("/claims", employeeController.createClaim);

// Properties
router.get("/properties", employeeController.getProperties);

export default router;
