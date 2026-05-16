import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadToR2, deleteFromR2, isR2Configured } from "../utils/r2Storage.js";

const MAX_PROPERTY_IMAGES = 40;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route   POST /api/vendor/properties/:id/images
 * @desc    Upload multiple images for a property
 * @access  Private (Vendor)
 */
export const uploadPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;

  // Check if property belongs to vendor
  const [properties] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return sendError(res, "No images uploaded", 400);
  }

  // Enforce total image cap across existing + new uploads.
  const [[{ existingCount }]] = await db.query(
    `SELECT COUNT(*) AS existingCount FROM property_images WHERE property_id = ?`,
    [id],
  );

  const totalAfterUpload = Number(existingCount || 0) + req.files.length;
  if (totalAfterUpload > MAX_PROPERTY_IMAGES) {
    const remainingSlots = Math.max(
      0,
      MAX_PROPERTY_IMAGES - Number(existingCount || 0),
    );
    return sendError(
      res,
      `Image limit exceeded. Maximum ${MAX_PROPERTY_IMAGES} images allowed per property. You can upload ${remainingSlots} more image(s).`,
      400,
    );
  }

  // Get current max sort_order
  const [maxOrder] = await db.query(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order 
     FROM property_images WHERE property_id = ?`,
    [id],
  );

  let sortOrder = maxOrder[0].max_order;
  const uploadedImages = [];
  const failedUploads = [];
  const useR2 = isR2Configured();

  for (const file of req.files) {
    try {
      sortOrder++;
      const imageId = generateUUID();
      let imageUrl;

      if (useR2) {
        // R2 path: file.buffer available from memoryStorage
        imageUrl = await uploadToR2(file.buffer, "properties", null, {
          ext: file.originalname.split(".").pop(),
        });
      } else {
        // Local disk path: compress with sharp then store
        const filePath = file.path;
        try {
          await sharp(filePath)
            .resize(1920, null, { withoutEnlargement: true, fit: "inside" })
            .jpeg({ quality: 85, progressive: true })
            .toFile(filePath + ".tmp");
          fs.unlinkSync(filePath);
          fs.renameSync(filePath + ".tmp", filePath);
        } catch (compressionError) {
          console.error("Image compression error:", compressionError);
        }
        imageUrl = `/uploads/properties/${file.filename}`;
      }

      await db.query(
        `INSERT INTO property_images (id, property_id, image_url, sort_order) VALUES (?, ?, ?, ?)`,
        [imageId, id, imageUrl, sortOrder],
      );

      uploadedImages.push({
        id: imageId,
        image_url: imageUrl,
        sort_order: sortOrder,
      });
    } catch (error) {
      // Keep processing remaining files so one bad file doesn't fail the whole batch.
      console.error("Image upload failed for file:", file.originalname, error);
      failedUploads.push({
        filename: file.originalname,
        error: error?.message || "Upload failed",
      });
    }
  }

  if (uploadedImages.length === 0) {
    return sendError(
      res,
      failedUploads[0]?.error || "Failed to upload images",
      500,
    );
  }

  // Update property photos JSON field
  await updatePropertyPhotosField(id);

  sendSuccess(
    res,
    {
      images: uploadedImages,
      failed: failedUploads,
      summary: {
        total: req.files.length,
        uploaded: uploadedImages.length,
        failed: failedUploads.length,
      },
    },
    failedUploads.length
      ? `Uploaded ${uploadedImages.length} image(s). ${failedUploads.length} failed.`
      : "Images uploaded successfully",
    201,
  );
});

/**
 * @route   DELETE /api/vendor/properties/:id/images/:imageId
 * @desc    Delete a specific property image
 * @access  Private (Vendor)
 */
export const deletePropertyImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const vendorId = req.user.id;

  // Check if property belongs to vendor
  const [properties] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Get image details
  const [images] = await db.query(
    `SELECT id, image_url FROM property_images 
     WHERE id = ? AND property_id = ?`,
    [imageId, id],
  );

  if (images.length === 0) {
    return sendError(res, "Image not found", 404);
  }

  // Delete file from storage (R2 or local)
  const imageUrl = images[0].image_url;
  if (isR2Configured() && imageUrl.startsWith("http")) {
    // Delete from Cloudflare R2
    await deleteFromR2(imageUrl).catch((err) =>
      console.error("R2 delete failed (non-fatal):", err.message),
    );
  } else {
    // Delete from local filesystem fallback
    const imagePath = path.join(__dirname, "../..", imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Delete from database
  await db.query(`DELETE FROM property_images WHERE id = ?`, [imageId]);

  // Reorder remaining images
  await reorderImages(id);

  // Update property photos JSON field
  await updatePropertyPhotosField(id);

  sendSuccess(res, "Image deleted successfully");
});

/**
 * @route   PATCH /api/vendor/properties/:id/images/reorder
 * @desc    Reorder property images
 * @access  Private (Vendor)
 */
export const reorderPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageOrder } = req.body; // Array of {id, sort_order}
  const vendorId = req.user.id;

  if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
    return sendError(res, "Image order array is required", 400);
  }

  // Check if property belongs to vendor
  const [properties] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Update each image's sort_order
  for (const item of imageOrder) {
    await db.query(
      `UPDATE property_images 
       SET sort_order = ? 
       WHERE id = ? AND property_id = ?`,
      [item.sort_order, item.id, id],
    );
  }

  // Update property photos JSON field
  await updatePropertyPhotosField(id);

  sendSuccess(res, "Images reordered successfully");
});

/**
 * @route   GET /api/vendor/properties/:id/images
 * @desc    Get all images for a property
 * @access  Private (Vendor)
 */
export const getPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;

  // Check if property belongs to vendor and get photos JSON fallback
  const [properties] = await db.query(
    `SELECT id, photos FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Get images from property_images table
  const [images] = await db.query(
    `SELECT id, image_url, sort_order 
     FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [id],
  );

  // If property_images table has results, return them
  if (images.length > 0) {
    return sendSuccess(res, images, "Images retrieved successfully");
  }

  // Fallback: read from properties.photos JSON column
  let fallbackImages = [];
  try {
    const photosData = properties[0].photos;
    if (photosData && photosData !== "[]" && photosData !== "") {
      const photosArray =
        typeof photosData === "string" ? JSON.parse(photosData) : photosData;
      if (Array.isArray(photosArray)) {
        fallbackImages = photosArray
          .filter((url) => url && typeof url === "string")
          .map((url, index) => ({
            id: index,
            image_url: url.trim(),
            sort_order: index,
          }));
      }
    }
  } catch (parseError) {
    console.error("Error parsing photos JSON:", parseError.message);
  }

  sendSuccess(res, fallbackImages, "Images retrieved successfully");
});

/**
 * Helper function to reorder images after deletion
 */
async function reorderImages(propertyId) {
  const [images] = await db.query(
    `SELECT id FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [propertyId],
  );

  let order = 1;
  for (const image of images) {
    await db.query(`UPDATE property_images SET sort_order = ? WHERE id = ?`, [
      order,
      image.id,
    ]);
    order++;
  }
}

/**
 * Helper function to update property photos JSON field
 */
async function updatePropertyPhotosField(propertyId) {
  const [images] = await db.query(
    `SELECT image_url FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [propertyId],
  );

  const photoUrls = images.map((img) => img.image_url);
  const photosJson = JSON.stringify(photoUrls);

  await db.query(`UPDATE properties SET photos = ? WHERE id = ?`, [
    photosJson,
    propertyId,
  ]);
}
