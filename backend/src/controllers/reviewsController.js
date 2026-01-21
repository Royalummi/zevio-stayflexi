import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a completed booking
 * @access  Private (User)
 */
export const submitReview = asyncHandler(async (req, res) => {
  const {
    property_id,
    booking_id,
    rating,
    review_text,
    cleanliness_rating,
    accuracy_rating,
    check_in_rating,
    communication_rating,
    location_rating,
    value_rating,
  } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!property_id || !booking_id || !rating) {
    return sendError(
      res,
      "Property ID, booking ID, and rating are required",
      400
    );
  }

  // Validate rating range (1-5)
  if (rating < 1 || rating > 5) {
    return sendError(res, "Rating must be between 1 and 5", 400);
  }

  // Check if booking exists and belongs to user
  const [bookings] = await db.query(
    `SELECT id, status, check_out FROM bookings 
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [booking_id, userId]
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found or unauthorized", 404);
  }

  const booking = bookings[0];

  // Check if booking is completed
  if (booking.status !== "completed") {
    return sendError(res, "You can only review completed bookings", 400);
  }

  // Check if user already reviewed this booking
  const [existingReviews] = await db.query(
    `SELECT id FROM reviews WHERE booking_id = ? AND user_id = ?`,
    [booking_id, userId]
  );

  if (existingReviews.length > 0) {
    return sendError(res, "You have already reviewed this booking", 400);
  }

  // Insert review
  const reviewId = generateUUID();
  await db.query(
    `INSERT INTO reviews (
      id, property_id, user_id, booking_id, rating, review_text,
      cleanliness_rating, accuracy_rating, check_in_rating,
      communication_rating, location_rating, value_rating, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      reviewId,
      property_id,
      userId,
      booking_id,
      rating,
      review_text || null,
      cleanliness_rating || null,
      accuracy_rating || null,
      check_in_rating || null,
      communication_rating || null,
      location_rating || null,
      value_rating || null,
    ]
  );

  // Update property rating and review count
  await updatePropertyRating(property_id);

  // Send notification to vendor
  const [properties] = await db.query(
    `SELECT vendor_id, title FROM properties WHERE id = ?`,
    [property_id]
  );

  if (properties.length > 0) {
    const notifId = generateUUID();
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message) 
       VALUES (?, ?, 'vendor', ?, ?)`,
      [
        notifId,
        properties[0].vendor_id,
        "New Review Received",
        `You received a new ${rating}-star review for ${properties[0].title}`,
      ]
    );
  }

  sendSuccess(res, "Review submitted successfully", { reviewId }, 201);
});

/**
 * @route   GET /api/reviews/property/:propertyId
 * @desc    Get all published reviews for a property
 * @access  Public
 */
export const getPropertyReviews = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const [reviews] = await db.query(
    `SELECT 
      r.id, r.rating, r.review_text, r.cleanliness_rating,
      r.accuracy_rating, r.check_in_rating, r.communication_rating,
      r.location_rating, r.value_rating, r.created_at,
      u.full_name as user_name, u.avatar as user_avatar,
      (SELECT reply_text FROM review_replies 
       WHERE review_id = r.id LIMIT 1) as vendor_reply,
      (SELECT created_at FROM review_replies 
       WHERE review_id = r.id LIMIT 1) as reply_date
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.property_id = ? AND r.status = 'published'
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?`,
    [propertyId, parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM reviews 
     WHERE property_id = ? AND status = 'published'`,
    [propertyId]
  );

  sendSuccess(res, "Reviews retrieved successfully", {
    reviews,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

/**
 * @route   GET /api/reviews/my
 * @desc    Get current user's reviews
 * @access  Private (User)
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [reviews] = await db.query(
    `SELECT 
      r.id, r.rating, r.review_text, r.status, r.created_at,
      p.title as property_title, p.id as property_id,
      (SELECT reply_text FROM review_replies 
       WHERE review_id = r.id LIMIT 1) as vendor_reply
    FROM reviews r
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC`,
    [userId]
  );

  sendSuccess(res, "Your reviews retrieved successfully", { reviews });
});

/**
 * @route   PATCH /api/reviews/:id
 * @desc    Update user's own review
 * @access  Private (User)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    rating,
    review_text,
    cleanliness_rating,
    accuracy_rating,
    check_in_rating,
    communication_rating,
    location_rating,
    value_rating,
  } = req.body;

  // Check if review belongs to user
  const [reviews] = await db.query(
    `SELECT id, property_id FROM reviews WHERE id = ? AND user_id = ?`,
    [id, userId]
  );

  if (reviews.length === 0) {
    return sendError(res, "Review not found or unauthorized", 404);
  }

  // Update review
  await db.query(
    `UPDATE reviews SET 
      rating = ?, review_text = ?, cleanliness_rating = ?,
      accuracy_rating = ?, check_in_rating = ?, communication_rating = ?,
      location_rating = ?, value_rating = ?, updated_at = NOW()
    WHERE id = ?`,
    [
      rating,
      review_text,
      cleanliness_rating,
      accuracy_rating,
      check_in_rating,
      communication_rating,
      location_rating,
      value_rating,
      id,
    ]
  );

  // Update property rating
  await updatePropertyRating(reviews[0].property_id);

  sendSuccess(res, "Review updated successfully");
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete user's own review
 * @access  Private (User)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if review belongs to user
  const [reviews] = await db.query(
    `SELECT id, property_id FROM reviews WHERE id = ? AND user_id = ?`,
    [id, userId]
  );

  if (reviews.length === 0) {
    return sendError(res, "Review not found or unauthorized", 404);
  }

  // Soft delete review
  await db.query(`UPDATE reviews SET deleted_at = NOW() WHERE id = ?`, [id]);

  // Update property rating
  await updatePropertyRating(reviews[0].property_id);

  sendSuccess(res, "Review deleted successfully");
});

/**
 * @route   POST /api/reviews/:id/reply
 * @desc    Vendor reply to a review
 * @access  Private (Vendor)
 */
export const replyToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply_text } = req.body;
  const vendorId = req.user.id;

  if (!reply_text || reply_text.trim().length === 0) {
    return sendError(res, "Reply text is required", 400);
  }

  // Check if review exists and belongs to vendor's property
  const [reviews] = await db.query(
    `SELECT r.id, r.user_id, p.title 
     FROM reviews r
     INNER JOIN properties p ON r.property_id = p.id
     WHERE r.id = ? AND p.vendor_id = ?`,
    [id, vendorId]
  );

  if (reviews.length === 0) {
    return sendError(res, "Review not found or unauthorized", 404);
  }

  // Check if reply already exists
  const [existingReplies] = await db.query(
    `SELECT id FROM review_replies WHERE review_id = ?`,
    [id]
  );

  const replyId = generateUUID();

  if (existingReplies.length > 0) {
    // Update existing reply
    await db.query(
      `UPDATE review_replies SET reply_text = ?, updated_at = NOW() 
       WHERE review_id = ?`,
      [reply_text, id]
    );
  } else {
    // Insert new reply
    await db.query(
      `INSERT INTO review_replies (id, review_id, vendor_id, reply_text) 
       VALUES (?, ?, ?, ?)`,
      [replyId, id, vendorId, reply_text]
    );
  }

  // Send notification to user
  const notifId = generateUUID();
  await db.query(
    `INSERT INTO notifications (id, recipient_id, recipient_role, title, message) 
     VALUES (?, ?, 'user', ?, ?)`,
    [
      notifId,
      reviews[0].user_id,
      "Vendor Replied to Your Review",
      `The property owner responded to your review for ${reviews[0].title}`,
    ]
  );

  sendSuccess(res, "Reply posted successfully", { replyId });
});

/**
 * @route   GET /api/admin/reviews
 * @desc    Admin view all reviews with filtering
 * @access  Private (Admin)
 */
export const getAllReviews = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let statusFilter = "";
  if (
    status &&
    ["pending", "published", "flagged", "removed"].includes(status)
  ) {
    statusFilter = `AND r.status = '${status}'`;
  }

  const [reviews] = await db.query(
    `SELECT 
      r.id, r.rating, r.review_text, r.status, r.created_at,
      u.full_name as user_name, u.email as user_email,
      p.title as property_title, p.id as property_id,
      v.name as vendor_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE r.deleted_at IS NULL ${statusFilter}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM reviews 
     WHERE deleted_at IS NULL ${statusFilter}`
  );

  sendSuccess(res, "Reviews retrieved successfully", {
    reviews,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

/**
 * @route   PATCH /api/admin/reviews/:id/status
 * @desc    Admin moderate review (approve/flag/remove)
 * @access  Private (Admin)
 */
export const moderateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "published", "flagged", "removed"].includes(status)) {
    return sendError(res, "Invalid status", 400);
  }

  // Check if review exists
  const [reviews] = await db.query(
    `SELECT id, property_id FROM reviews WHERE id = ?`,
    [id]
  );

  if (reviews.length === 0) {
    return sendError(res, "Review not found", 404);
  }

  // Update status
  await db.query(
    `UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, id]
  );

  // Update property rating if status changed to published or removed
  if (["published", "removed"].includes(status)) {
    await updatePropertyRating(reviews[0].property_id);
  }

  sendSuccess(res, `Review ${status} successfully`);
});

/**
 * Helper function to update property rating
 */
async function updatePropertyRating(propertyId) {
  const [ratingData] = await db.query(
    `SELECT 
      COUNT(*) as reviews_count,
      AVG(rating) as avg_rating
    FROM reviews 
    WHERE property_id = ? AND status = 'published' AND deleted_at IS NULL`,
    [propertyId]
  );

  const reviewsCount = ratingData[0].reviews_count;
  const avgRating = ratingData[0].avg_rating || 0;

  await db.query(
    `UPDATE properties 
     SET rating = ?, reviews_count = ? 
     WHERE id = ?`,
    [parseFloat(avgRating.toFixed(2)), reviewsCount, propertyId]
  );
}
