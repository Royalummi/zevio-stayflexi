import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import {
  getAmenitiesSelectClause,
  getAmenitiesJoinClause,
} from "../services/amenitiesService.js";
import { generateUUID } from "../utils/helpers.js";

// Add property to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const { property_id } = req.body;
  const userId = req.user.id;

  if (!property_id) {
    return sendError(res, "Property ID is required", 400);
  }

  // Check if property exists
  const [properties] = await db.query(
    "SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL",
    [property_id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  // Check if already in wishlist
  const [existing] = await db.query(
    "SELECT id FROM wishlists WHERE user_id = ? AND property_id = ?",
    [userId, property_id],
  );

  if (existing.length > 0) {
    return sendError(res, "Property already in wishlist", 400);
  }

  // Add to wishlist
  const wishlistId = generateUUID();
  await db.query(
    "INSERT INTO wishlists (id, user_id, property_id) VALUES (?, ?, ?)",
    [wishlistId, userId, property_id],
  );

  sendSuccess(
    res,
    { id: wishlistId, property_id },
    "Added to wishlist successfully",
    201,
  );
});

// Remove property from wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user.id;

  if (!propertyId) {
    return sendError(res, "Property ID is required", 400);
  }

  // Check if in wishlist
  const [existing] = await db.query(
    "SELECT id FROM wishlists WHERE user_id = ? AND property_id = ?",
    [userId, propertyId],
  );

  if (existing.length === 0) {
    return sendError(res, "Property not in wishlist", 404);
  }

  // Remove from wishlist
  await db.query(
    "DELETE FROM wishlists WHERE user_id = ? AND property_id = ?",
    [userId, propertyId],
  );

  sendSuccess(res, null, "Removed from wishlist successfully");
});

// Get user's wishlist
export const getMyWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const offset = (page - 1) * limit;

  // Get wishlisted properties with full details
  const [wishlists] = await db.query(
    `SELECT 
      w.id as wishlist_id,
      w.created_at as added_at,
      p.id,
      p.title,
      pt.name as property_type,
      p.description,
      c.name as city,
      c.state as state,
      p.bedrooms,
      p.bathrooms,
      p.max_guests,
      pp.price_per_night,
      p.rating,
      p.reviews_count,
      p.photos,
      ${getAmenitiesSelectClause("p", "pa", "a")},
      c.name as city_name
    FROM wishlists w
    INNER JOIN properties p ON w.property_id = p.id
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN property_pricing pp ON p.id = pp.property_id
    ${getAmenitiesJoinClause("p", "pa", "a")}
    WHERE w.user_id = ? 
    AND p.status = 'approved'
    AND p.deleted_at IS NULL
    GROUP BY w.id, p.id, pp.id
    ORDER BY w.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), offset],
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total 
     FROM wishlists w
     INNER JOIN properties p ON w.property_id = p.id
     WHERE w.user_id = ? 
     AND p.status = 'approved'
     AND p.deleted_at IS NULL`,
    [userId],
  );

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, {
    wishlists,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    },
  });
});

// Check if property is wishlisted
export const checkWishlistStatus = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  // Check if user is authenticated (optional auth)
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    // Not authenticated, return false
    return sendSuccess(res, {
      isWishlisted: false,
      propertyId,
    });
  }

  try {
    // Verify token and get user
    const { verifyAccessToken } = await import("../config/jwt.js");
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const [existing] = await db.query(
      "SELECT id FROM wishlists WHERE user_id = ? AND property_id = ?",
      [userId, propertyId],
    );

    sendSuccess(res, {
      isWishlisted: existing.length > 0,
      propertyId,
    });
  } catch (error) {
    // Invalid token, return false (not wishlisted)
    sendSuccess(res, {
      isWishlisted: false,
      propertyId,
    });
  }
});
