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
import employeeRoutes from "./src/routes/employeeRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";
import notificationsRoutes from "./src/routes/notificationsRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.ASTRO_URL || "http://localhost:4321",
      process.env.NEXTJS_URL || "http://localhost:8000",
    ],
    credentials: true,
  })
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
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/vendor", vendorRoutes);

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
  console.error("🔴 Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();
