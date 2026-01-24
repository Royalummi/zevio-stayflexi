import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { testConnection } from "./src/config/database.js";
import { verifyEmailConfig } from "./src/services/emailService.js";
import { startCronJobs } from "./src/cron/jobs.js";
import { errorHandler, notFound } from "./src/middlewares/errorHandler.js";

// Import routes
import authRoutes from "./src/routes/authRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import notificationsRoutes from "./src/routes/notificationsRoutes.js";
import wishlistRoutes from "./src/routes/wishlistRoutes.js";
import reviewsRoutes from "./src/routes/reviewsRoutes.js";
import couponsRoutes from "./src/routes/couponsRoutes.js";
import changeRequestsRoutes from "./src/routes/changeRequestsRoutes.js";
import activityLogsRoutes from "./src/routes/activityLogsRoutes.js";
import propertyImagesRoutes from "./src/routes/propertyImagesRoutes.js";
import serviceApartmentsRoutes from "./src/routes/serviceApartmentsRoutes.js";
import corporateRoutes from "./src/routes/corporateRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100 to 1000 for development
});

// More lenient rate limiting for public read-only endpoints
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 30, // 30 requests per minute per IP (allows multiple page loads)
  message: {
    success: false,
    message: "Too many requests. Please try again in a moment.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip for health checks
    if (req.path === "/api/health") return true;
    return false;
  },
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.ASTRO_URL || "http://localhost:4321",
      process.env.NEXTJS_URL || "http://localhost:8000",
      "https://zevio.cloud",
      "https://www.zevio.cloud",
      "https://api.zevio.cloud",
    ],
    credentials: true,
  }),
);
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use("/api/", limiter); // Apply rate limiting to API routes

// Serve static files (uploads)
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes); // Apply strict rate limiting to auth routes
app.use("/api/public", publicLimiter, publicRoutes); // Apply lenient rate limiting to public routes
app.use("/api/service-apartments", publicLimiter, serviceApartmentsRoutes); // Apply lenient rate limiting
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin/coupons", couponsRoutes);
app.use("/api", changeRequestsRoutes);
app.use("/api/admin/activity-logs", activityLogsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/vendor/properties", propertyImagesRoutes);
app.use("/api/corporate", corporateRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Verify email configuration (optional - don't fail if not configured)
    await verifyEmailConfig();

    // Start cron jobs
    startCronJobs();

    // Start listening
    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(50));
      console.log("🚀 Zevio Backend Server Started Successfully!");
      console.log("=".repeat(50));
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("🔴 Unhandled Promise Rejection:");
  console.error("Error:", err);
  console.error("Stack:", err.stack);
  // Keep server running in development for debugging
});

// Start the server
startServer();
