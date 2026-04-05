import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import db from "./src/config/database.js";
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

// REMOVED: Rate limiting for public and authenticated routes
// Startup mode: Users can browse and use platform freely without restrictions
// Only keeping rate limits on auth endpoints (brute force protection)

// Rate limiting for authentication endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes per IP
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers

// CORS Configuration - Allow all local development ports
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.VITE_FRONTEND_URL || "http://localhost:5173", // Vite React frontend
    process.env.ASTRO_URL || "http://localhost:4321",
    process.env.NEXTJS_URL || "http://localhost:8000",
    "http://localhost:5173", // Vite dev server (hardcoded for safety)
    "http://localhost:3000", // React dev server
    "http://localhost:8000", // Next.js
    "http://localhost:4321", // Astro
    "https://zevio.in",
    "https://www.zevio.in",
    "https://api.zevio.in",
    "https://admin.zevio.in",
    "https://zevio.cloud",
    "https://www.zevio.cloud",
    "https://api.zevio.cloud",
    "https://admin.zevio.cloud",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  exposedHeaders: ["Content-Length", "Content-Type"],
};

app.use(cors(corsOptions));
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// REMOVED: Global rate limiting to allow free platform usage

// Serve static files (uploads) with explicit CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers explicitly for static files
    const origin = req.headers.origin;
    if (corsOptions.origin.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static("uploads"),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Compatibility shim: rewrite /api/v1/* → /api/* so any tool or client
// using a versioned URL prefix still works without 404 spam.
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/v1/")) {
    req.url = req.url.replace("/api/v1/", "/api/");
  }
  next();
});
// Stub for refurbishment alerts — endpoint not yet built; prevents 404 log noise
app.get("/api/admin/refurbishment/alerts", (_req, res) => {
  res.json({ success: true, data: { alerts: [], total: 0 } });
});
app.use("/api/auth", authLimiter, authRoutes); // Keep rate limiting on auth to prevent brute force
app.use("/api/public", publicRoutes); // No rate limit
app.use("/api/service-apartments", serviceApartmentsRoutes); // No rate limit
app.use("/api/bookings", bookingRoutes); // No rate limit - let users book freely
app.use("/api/payments", paymentRoutes); // No rate limit
app.use("/api/notifications", notificationsRoutes); // No rate limit
app.use("/api/wishlist", wishlistRoutes); // No rate limit
app.use("/api", reviewsRoutes); // SESSION 64: Includes /properties/:id/reviews, /bookings/:id/reviews, /admin/reviews
app.use("/api", couponsRoutes); // SESSION 64: Includes /admin/coupons and /coupons/validate
app.use("/api", changeRequestsRoutes); // No rate limit
app.use("/api/admin/activity-logs", activityLogsRoutes); // No rate limit
app.use("/api/admin", adminRoutes); // No rate limit
app.use("/api/vendor", vendorRoutes); // No rate limit
app.use("/api/vendor/properties", propertyImagesRoutes); // No rate limit
app.use("/api/corporate", corporateRoutes); // No rate limit

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
