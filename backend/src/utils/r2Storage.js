/**
 * Cloudflare R2 Storage Utility
 * S3-compatible object storage with zero egress fees
 *
 * SESSION 56.7: Cloudflare R2 Integration
 * Replaces local uploads/ directory with cloud storage
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization of R2 Client to ensure env vars are loaded
let r2Client = null;

const getR2Client = () => {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto", // Cloudflare uses 'auto'
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
};

const R2_BUCKET = () => process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = () => process.env.R2_PUBLIC_URL;

/**
 * Upload image to R2 with optimization
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Folder path (e.g., 'properties', 'avatars')
 * @param {string} filename - Original filename (optional)
 * @param {Object} options - Optimization options
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadToR2 = async (
  fileBuffer,
  folder = "properties",
  filename = null,
  options = {},
) => {
  try {
    // Generate unique filename
    const ext = options.ext || "webp";
    const uniqueFilename = filename || `${folder}-${uuidv4()}.${ext}`;
    const key = `${folder}/${uniqueFilename}`;

    // Optimize image with sharp (convert to WebP, compress)
    const optimizedBuffer = await sharp(fileBuffer)
      .webp({ quality: options.quality || 85 })
      .resize(options.maxWidth || 1920, options.maxHeight || 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    console.log(
      `📤 Uploading to R2: ${key} (${(optimizedBuffer.length / 1024).toFixed(2)} KB)`,
    );

    // Upload to R2
    const upload = new Upload({
      client: getR2Client(),
      params: {
        Bucket: R2_BUCKET(),
        Key: key,
        Body: optimizedBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000", // 1 year cache
      },
    });

    await upload.done();

    // Return public URL
    const publicUrl = `${R2_PUBLIC_URL()}/${key}`;
    console.log(`✅ Upload successful: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("❌ R2 Upload Error:", error.message);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
};

/**
 * Upload multiple images to R2
 * @param {Array} files - Array of file objects from multer
 * @param {string} folder - Folder path
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
export const uploadMultipleToR2 = async (files, folder = "properties") => {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileBuffer = file.buffer; // Requires multer memoryStorage
      const ext = file.originalname.split(".").pop();

      return await uploadToR2(fileBuffer, folder, null, { ext });
    });

    const urls = await Promise.all(uploadPromises);
    console.log(`✅ Uploaded ${urls.length} images to R2`);

    return urls;
  } catch (error) {
    console.error("❌ Multiple R2 Upload Error:", error.message);
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

/**
 * Delete image from R2
 * @param {string} imageUrl - Full public URL or just the key
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromR2 = async (imageUrl) => {
  try {
    // Extract key from URL (remove public URL prefix)
    let key = imageUrl;
    if (imageUrl.startsWith("http")) {
      key = imageUrl.replace(`${R2_PUBLIC_URL()}/`, "");
    }

    console.log(`🗑️  Deleting from R2: ${key}`);

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET(),
      Key: key,
    });

    await getR2Client().send(command);
    console.log(`✅ Deleted successfully: ${key}`);

    return true;
  } catch (error) {
    console.error("❌ R2 Delete Error:", error.message);
    // Don't throw - gracefully handle delete failures
    return false;
  }
};

/**
 * Delete multiple images from R2
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<Object>} - Success/failure counts
 */
export const deleteMultipleFromR2 = async (imageUrls) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const url of imageUrls) {
    const deleted = await deleteFromR2(url);
    if (deleted) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(url);
    }
  }

  console.log(
    `🗑️  R2 Batch Delete: ${results.success} success, ${results.failed} failed`,
  );
  return results;
};

/**
 * Check if R2 is configured
 * @returns {boolean}
 */
export const isR2Configured = () => {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
};

/**
 * Migrate local file to R2
 * Used for migrating existing uploads to R2
 * @param {string} localPath - Local file path
 * @param {string} folder - R2 folder
 * @returns {Promise<string>} - R2 public URL
 */
export const migrateLocalToR2 = async (localPath, folder = "properties") => {
  try {
    const fs = await import("fs/promises");
    const fileBuffer = await fs.readFile(localPath);
    const filename = localPath.split("/").pop();

    return await uploadToR2(fileBuffer, folder, filename);
  } catch (error) {
    console.error("❌ Migration Error:", error.message);
    throw error;
  }
};

export default {
  uploadToR2,
  uploadMultipleToR2,
  deleteFromR2,
  deleteMultipleFromR2,
  isR2Configured,
  migrateLocalToR2,
};
