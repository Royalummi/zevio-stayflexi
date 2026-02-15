import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { isR2Configured } from "../utils/r2Storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if R2 is configured
const useR2 = isR2Configured();
console.log(`📦 Storage Mode: ${useR2 ? "Cloudflare R2" : "Local Disk"}`);

// Ensure uploads directory exists (fallback for local storage)
const uploadsDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage based on R2 availability
const storage = useR2
  ? multer.memoryStorage() // R2 needs file buffer
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        // Generate unique filename: userId-timestamp.extension
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
      },
    });

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Multer upload configuration for avatars
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
  fileFilter: fileFilter,
});

// ========================================
// Property Images Upload Configuration
// ========================================

// Ensure property uploads directory exists (fallback)
const propertyUploadsDir = path.join(__dirname, "../../uploads/properties");
if (!fs.existsSync(propertyUploadsDir)) {
  fs.mkdirSync(propertyUploadsDir, { recursive: true });
}

// Configure storage for property images
const propertyStorage = useR2
  ? multer.memoryStorage() // R2 needs file buffer
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, propertyUploadsDir);
      },
      filename: function (req, file, cb) {
        // Generate unique filename: property-propertyId-timestamp.extension
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const propertyId = req.params.id || "unknown";
        cb(null, `property-${propertyId}-${uniqueSuffix}${ext}`);
      },
    });

// Multer upload configuration for property images (multiple files)
export const uploadPropertyImages = multer({
  storage: propertyStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size per image
  },
  fileFilter: fileFilter,
});
