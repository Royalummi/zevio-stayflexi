import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
    [id, vendorId]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return sendError(res, "No images uploaded", 400);
  }

  // Get current max sort_order
  const [maxOrder] = await db.query(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order 
     FROM property_images WHERE property_id = ?`,
    [id]
  );

  let sortOrder = maxOrder[0].max_order;
  const uploadedImages = [];

  // Insert images into database
  for (const file of req.files) {
    sortOrder++;
    const imageId = generateUUID();
    const imageUrl = `/uploads/properties/${file.filename}`;

    await db.query(
      `INSERT INTO property_images (id, property_id, image_url, sort_order) 
       VALUES (?, ?, ?, ?)`,
      [imageId, id, imageUrl, sortOrder]
    );

    uploadedImages.push({
      id: imageId,
      url: imageUrl,
      sort_order: sortOrder,
    });
  }

  // Update property photos JSON field
  await updatePropertyPhotosField(id);

  sendSuccess(
    res,
    "Images uploaded successfully",
    { images: uploadedImages },
    201
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
    [id, vendorId]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Get image details
  const [images] = await db.query(
    `SELECT id, image_url FROM property_images 
     WHERE id = ? AND property_id = ?`,
    [imageId, id]
  );

  if (images.length === 0) {
    return sendError(res, "Image not found", 404);
  }

  // Delete file from filesystem (optional - can skip if using cloud storage)
  const imagePath = path.join(__dirname, "../..", images[0].image_url);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
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
    [id, vendorId]
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
      [item.sort_order, item.id, id]
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

  // Check if property belongs to vendor
  const [properties] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Get images
  const [images] = await db.query(
    `SELECT id, image_url, sort_order 
     FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [id]
  );

  sendSuccess(res, "Images retrieved successfully", { images });
});

/**
 * Helper function to reorder images after deletion
 */
async function reorderImages(propertyId) {
  const [images] = await db.query(
    `SELECT id FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [propertyId]
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
    [propertyId]
  );

  const photoUrls = images.map((img) => img.image_url);
  const photosJson = JSON.stringify(photoUrls);

  await db.query(`UPDATE properties SET photos = ? WHERE id = ?`, [
    photosJson,
    propertyId,
  ]);
}
