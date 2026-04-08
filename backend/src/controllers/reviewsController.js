/**
 * SESSION 64: REVIEW CONTROLLER
 * Post-stay review collection with admin moderation
 *
 * Features:
 * - User submits reviews after completed stays
 * - 6 category ratings (cleanliness, accuracy, communication, location, check-in, value)
 * - Photo upload (max 5 photos, 5MB each, R2 storage)
 * - Admin full edit powers (text + ratings) with transparency
 * - Admin approval/rejection workflow
 * - Email automation tracking
 */

import db from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * @route   POST /api/bookings/:bookingId/reviews
 * @desc    User submits review after completed stay
 * @access  Protected (User)
 */
export const submitReview = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  const {
    review_text,
    cleanliness_rating,
    accuracy_rating,
    communication_rating,
    location_rating,
    check_in_rating,
    value_rating,
    guest_name,
    photoUrls = [], // Array of R2 URLs (already uploaded)
  } = req.body;

  try {
    // 1. Verify booking exists and belongs to user
    const [bookings] = await db.query(
      `SELECT id, property_id, user_id, status, check_out 
       FROM bookings 
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [bookingId, userId],
    );

    if (bookings.length === 0) {
      return sendError(res, "Booking not found or unauthorized", 404);
    }

    const booking = bookings[0];

    // 2. Verify booking is completed
    if (booking.status !== "completed") {
      return sendError(res, "You can only review completed bookings", 400);
    }

    // 3. Check if review already exists
    const [existingReviews] = await db.query(
      `SELECT id FROM reviews WHERE booking_id = ? AND deleted_at IS NULL`,
      [bookingId],
    );

    if (existingReviews.length > 0) {
      return sendError(res, "You have already reviewed this booking", 400);
    }

    // 4. Validate ratings (1-5)
    const ratings = [
      cleanliness_rating,
      accuracy_rating,
      communication_rating,
      location_rating,
      check_in_rating,
      value_rating,
    ];

    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return sendError(res, "All ratings must be between 1 and 5", 400);
      }
    }

    // 5. Calculate overall rating (weighted average)
    // Parse each rating as a number to prevent string concatenation in reduce
    const parsedRatings = [
      parseFloat(cleanliness_rating),
      parseFloat(accuracy_rating),
      parseFloat(communication_rating),
      parseFloat(location_rating),
      parseFloat(check_in_rating),
      parseFloat(value_rating),
    ];

    const overallRating = (
      parsedRatings.reduce((sum, r) => sum + r, 0) / parsedRatings.length
    ).toFixed(1);

    // 6. Validate photo count (max 5)
    if (photoUrls.length > 5) {
      return sendError(res, "Maximum 5 photos allowed per review", 400);
    }

    // 7. Create review
    const reviewId = uuidv4();

    await db.query(
      `INSERT INTO reviews (
        id, property_id, user_id, booking_id,
        rating, overall_rating, review_text, guest_name,
        cleanliness_rating, accuracy_rating, communication_rating,
        location_rating, check_in_rating, value_rating,
        status, is_visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewId,
        booking.property_id,
        userId,
        bookingId,
        parseFloat(overallRating),
        parseFloat(overallRating),
        review_text || null,
        guest_name || null,
        parsedRatings[0],
        parsedRatings[1],
        parsedRatings[2],
        parsedRatings[3],
        parsedRatings[4],
        parsedRatings[5],
        "pending", // Admin needs to approve
        false, // Not visible until approved
      ],
    );

    // 8. Insert review photos (if any)
    if (photoUrls.length > 0) {
      const photoInserts = photoUrls.map((url, index) => [
        uuidv4(),
        reviewId,
        url,
        index + 1, // display_order
        null, // file_size (optional)
      ]);

      await db.query(
        `INSERT INTO review_photos (id, review_id, photo_url, display_order, file_size)
         VALUES ?`,
        [photoInserts],
      );
    }

    // 9. Get created review with photos
    const [createdReview] = await db.query(
      `SELECT r.*, 
              GROUP_CONCAT(rp.photo_url ORDER BY rp.display_order) as photo_urls
       FROM reviews r
       LEFT JOIN review_photos rp ON r.id = rp.review_id
       WHERE r.id = ?
       GROUP BY r.id`,
      [reviewId],
    );

    return sendSuccess(
      res,
      {
        review: {
          ...createdReview[0],
          photo_urls: createdReview[0].photo_urls
            ? createdReview[0].photo_urls.split(",")
            : [],
        },
      },
      "Review submitted successfully. It will be visible after admin approval.",
      201,
    );
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/properties/:propertyId/reviews
 * @desc    Get approved reviews for a property (public)
 * @access  Public
 */
export const getPropertyReviews = async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  try {
    // 1. Get approved reviews with photos
    const [reviews] = await db.query(
      `SELECT 
        r.id,
        r.review_text,
        r.guest_name,
        r.overall_rating,
        r.cleanliness_rating,
        r.accuracy_rating,
        r.communication_rating,
        r.location_rating,
        r.check_in_rating,
        r.value_rating,
        r.is_edited_by_admin,
        r.created_at,
        u.full_name as user_name,
        u.avatar,
        GROUP_CONCAT(rp.photo_url ORDER BY rp.display_order) as photo_urls
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN review_photos rp ON r.id = rp.review_id
       WHERE r.property_id = ? 
         AND r.is_visible = TRUE 
         AND r.status = 'published'
         AND r.deleted_at IS NULL
         AND r.overall_rating > 0
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [propertyId, parseInt(limit), offset],
    );

    // 2. Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM reviews 
       WHERE property_id = ? 
         AND is_visible = TRUE 
         AND status = 'published'
         AND deleted_at IS NULL
         AND overall_rating > 0`,
      [propertyId],
    );

    // 3. Calculate rating breakdown
    const [ratingStats] = await db.query(
      `SELECT 
        AVG(overall_rating) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN overall_rating >= 4.5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN overall_rating >= 3.5 AND overall_rating < 4.5 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN overall_rating >= 2.5 AND overall_rating < 3.5 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN overall_rating >= 1.5 AND overall_rating < 2.5 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN overall_rating < 1.5 THEN 1 ELSE 0 END) as one_star
       FROM reviews 
       WHERE property_id = ? 
         AND is_visible = TRUE 
         AND status = 'published'
         AND deleted_at IS NULL
         AND overall_rating > 0`,
      [propertyId],
    );

    // 4. Format response
    const formattedReviews = reviews.map((review) => ({
      ...review,
      photo_urls: review.photo_urls ? review.photo_urls.split(",") : [],
      display_name: review.guest_name || review.user_name || "Anonymous",
    }));

    return sendSuccess(res, {
      reviews: formattedReviews,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult[0].total / limit),
        total_reviews: countResult[0].total,
        per_page: parseInt(limit),
      },
      rating_stats: {
        average: parseFloat(ratingStats[0].average_rating || 0).toFixed(1),
        total: ratingStats[0].total_reviews,
        breakdown: {
          5: ratingStats[0].five_star,
          4: ratingStats[0].four_star,
          3: ratingStats[0].three_star,
          2: ratingStats[0].two_star,
          1: ratingStats[0].one_star,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching property reviews:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/admin/reviews
 * @desc    Admin lists all reviews with filters
 * @access  Protected (Admin)
 */
export const adminListReviews = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status, // pending, published, flagged, removed
    property_id,
    search,
    sort_by = "created_at",
    sort_order = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        r.id,
        r.property_id,
        r.user_id,
        r.booking_id,
        r.review_text,
        r.guest_name,
        r.overall_rating,
        r.cleanliness_rating,
        r.accuracy_rating,
        r.communication_rating,
        r.location_rating,
        r.check_in_rating,
        r.value_rating,
        r.status,
        r.is_visible,
        r.is_edited_by_admin,
        r.admin_edit_reason,
        r.reviewed_by,
        r.reviewed_at,
        r.created_at,
        r.updated_at,
        u.full_name as user_name,
        u.email as user_email,
        p.title as property_name,
        admin.name as reviewed_by_name,
        (SELECT COUNT(*) FROM review_photos WHERE review_id = r.id) as photo_count
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN admins admin ON r.reviewed_by = admin.id
      WHERE r.deleted_at IS NULL
    `;

    const params = [];

    // Filters
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (property_id) {
      query += ` AND r.property_id = ?`;
      params.push(property_id);
    }

    if (search) {
      query += ` AND (r.review_text LIKE ? OR u.full_name LIKE ? OR p.title LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const validSortColumns = [
      "created_at",
      "overall_rating",
      "status",
      "property_name",
    ];
    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : "created_at";
    const sortDirection = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [reviews] = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN properties p ON r.property_id = p.id
      WHERE r.deleted_at IS NULL
    `;
    const countParams = [];

    if (status) {
      countQuery += ` AND r.status = ?`;
      countParams.push(status);
    }

    if (property_id) {
      countQuery += ` AND r.property_id = ?`;
      countParams.push(property_id);
    }

    if (search) {
      countQuery += ` AND (r.review_text LIKE ? OR u.full_name LIKE ? OR p.title LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams);

    return sendSuccess(res, {
      reviews,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(countResult[0].total / limit),
        total_reviews: countResult[0].total,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Error listing reviews:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PATCH /api/admin/reviews/:reviewId
 * @desc    Admin edits review (FULL EDIT POWERS - text + ratings)
 * @access  Protected (Admin)
 */
export const adminEditReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminId = req.user.id;
  const {
    review_text,
    cleanliness_rating,
    accuracy_rating,
    communication_rating,
    location_rating,
    check_in_rating,
    value_rating,
    admin_edit_reason,
  } = req.body;

  try {
    // 1. Verify review exists
    const [reviews] = await db.query(
      `SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL`,
      [reviewId],
    );

    if (reviews.length === 0) {
      return sendError(res, "Review not found", 404);
    }

    const review = reviews[0];

    // 2. Validate ratings if provided (1-5)
    const ratings = [
      cleanliness_rating,
      accuracy_rating,
      communication_rating,
      location_rating,
      check_in_rating,
      value_rating,
    ].filter((r) => r !== undefined);

    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return sendError(res, "All ratings must be between 1 and 5", 400);
      }
    }

    // 3. Calculate new overall rating if ratings changed
    let overallRating = review.overall_rating;
    if (ratings.length > 0) {
      const allRatings = [
        cleanliness_rating !== undefined
          ? cleanliness_rating
          : review.cleanliness_rating,
        accuracy_rating !== undefined
          ? accuracy_rating
          : review.accuracy_rating,
        communication_rating !== undefined
          ? communication_rating
          : review.communication_rating,
        location_rating !== undefined
          ? location_rating
          : review.location_rating,
        check_in_rating !== undefined
          ? check_in_rating
          : review.check_in_rating,
        value_rating !== undefined ? value_rating : review.value_rating,
      ];

      overallRating = (
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      ).toFixed(1);
    }

    // 4. Build UPDATE query dynamically
    const updates = [];
    const params = [];

    if (review_text !== undefined) {
      updates.push("review_text = ?");
      params.push(review_text);
    }

    if (cleanliness_rating !== undefined) {
      updates.push("cleanliness_rating = ?");
      params.push(cleanliness_rating);
    }

    if (accuracy_rating !== undefined) {
      updates.push("accuracy_rating = ?");
      params.push(accuracy_rating);
    }

    if (communication_rating !== undefined) {
      updates.push("communication_rating = ?");
      params.push(communication_rating);
    }

    if (location_rating !== undefined) {
      updates.push("location_rating = ?");
      params.push(location_rating);
    }

    if (check_in_rating !== undefined) {
      updates.push("check_in_rating = ?");
      params.push(check_in_rating);
    }

    if (value_rating !== undefined) {
      updates.push("value_rating = ?");
      params.push(value_rating);
    }

    // Always update these fields when admin edits
    updates.push("overall_rating = ?");
    params.push(parseFloat(overallRating));

    updates.push("rating = ?");
    params.push(parseFloat(overallRating));

    updates.push("is_edited_by_admin = TRUE");

    if (admin_edit_reason) {
      updates.push("admin_edit_reason = ?");
      params.push(admin_edit_reason);
    }

    updates.push("updated_at = NOW()");

    params.push(reviewId);

    // 5. Execute update
    await db.query(
      `UPDATE reviews SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    // 6. Log admin activity
    const activityLogId = uuidv4();
    await db.query(
      `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [activityLogId, adminId, "admin", "EDIT_REVIEW", "reviews", reviewId],
    );

    // 7. Get updated review
    const [updatedReview] = await db.query(
      `SELECT r.*,
              u.full_name as user_name,
              p.title as property_name,
              GROUP_CONCAT(rp.photo_url ORDER BY rp.display_order) as photo_urls
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN properties p ON r.property_id = p.id
       LEFT JOIN review_photos rp ON r.id = rp.review_id
       WHERE r.id = ?
       GROUP BY r.id`,
      [reviewId],
    );

    return sendSuccess(
      res,
      {
        review: {
          ...updatedReview[0],
          photo_urls: updatedReview[0].photo_urls
            ? updatedReview[0].photo_urls.split(",")
            : [],
        },
      },
      "Review updated successfully",
    );
  } catch (error) {
    console.error("❌ Error editing review:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/admin/reviews/:reviewId/approve
 * @desc    Admin approves review (makes it visible)
 * @access  Protected (Admin)
 */
export const adminApproveReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminId = req.user.id;

  try {
    // 1. Verify review exists
    const [reviews] = await db.query(
      `SELECT r.*, p.title as property_name 
       FROM reviews r
       LEFT JOIN properties p ON r.property_id = p.id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [reviewId],
    );

    if (reviews.length === 0) {
      return sendError(res, "Review not found", 404);
    }

    const review = reviews[0];

    // 2. Update review status
    await db.query(
      `UPDATE reviews 
       SET status = 'published',
           is_visible = TRUE,
           reviewed_by = ?,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [adminId, reviewId],
    );

    // 3. Update property average rating (exclude invalid 0.0 ratings)
    await db.query(
      `UPDATE properties p
       SET rating = (
         SELECT AVG(overall_rating)
         FROM reviews
         WHERE property_id = p.id
           AND status = 'published'
           AND is_visible = TRUE
           AND deleted_at IS NULL
           AND overall_rating > 0
       )
       WHERE p.id = ?`,
      [review.property_id],
    );

    // 4. Log admin activity
    const activityLogId = uuidv4();
    await db.query(
      `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [activityLogId, adminId, "admin", "APPROVE_REVIEW", "reviews", reviewId],
    );

    return sendSuccess(
      res,
      { review_id: reviewId },
      "Review approved successfully",
    );
  } catch (error) {
    console.error("❌ Error approving review:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/admin/reviews/:reviewId/reject
 * @desc    Admin rejects review (hides it)
 * @access  Protected (Admin)
 */
export const adminRejectReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminId = req.user.id;
  const { rejection_reason } = req.body;

  try {
    // 1. Verify review exists
    const [reviews] = await db.query(
      `SELECT r.*, p.title as property_name 
       FROM reviews r
       LEFT JOIN properties p ON r.property_id = p.id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [reviewId],
    );

    if (reviews.length === 0) {
      return sendError(res, "Review not found", 404);
    }

    const review = reviews[0];

    // 2. Update review status
    await db.query(
      `UPDATE reviews 
       SET status = 'flagged',
           is_visible = FALSE,
           reviewed_by = ?,
           reviewed_at = NOW(),
           admin_edit_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [adminId, rejection_reason || "Rejected by admin", reviewId],
    );

    // 3. Log admin activity
    const activityLogId = uuidv4();
    await db.query(
      `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [activityLogId, adminId, "admin", "REJECT_REVIEW", "reviews", reviewId],
    );

    // 4. TODO: Send notification email to user (optional)
    // await sendReviewRejectionEmail(review.user_id, rejection_reason);

    return sendSuccess(
      res,
      { review_id: reviewId },
      "Review rejected successfully",
    );
  } catch (error) {
    console.error("❌ Error rejecting review:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   DELETE /api/admin/reviews/:reviewId
 * @desc    Admin soft-deletes a review
 * @access  Protected (Admin)
 */
export const adminDeleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const adminId = req.user.id;

  try {
    const [reviews] = await db.query(
      `SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL`,
      [reviewId],
    );

    if (reviews.length === 0) {
      return sendError(res, "Review not found", 404);
    }

    await db.query(
      `UPDATE reviews SET deleted_at = NOW(), is_visible = FALSE, updated_at = NOW() WHERE id = ?`,
      [reviewId],
    );

    const activityLogId = uuidv4();
    await db.query(
      `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [activityLogId, adminId, "admin", "DELETE_REVIEW", "reviews", reviewId],
    );

    return sendSuccess(
      res,
      { review_id: reviewId },
      "Review deleted successfully",
    );
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/admin/reviews/:reviewId
 * @desc    Admin gets review details with all info
 * @access  Protected (Admin)
 */
export const adminGetReviewDetails = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const [reviews] = await db.query(
      `SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.title as property_name,
        c.name as city,
        b.check_in,
        b.check_out,
        b.total_amount,
        admin.name as reviewed_by_name,
        GROUP_CONCAT(rp.photo_url ORDER BY rp.display_order) as photo_urls
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN properties p ON r.property_id = p.id
       LEFT JOIN cities c ON p.city_id = c.id
       LEFT JOIN bookings b ON r.booking_id = b.id
       LEFT JOIN admins admin ON r.reviewed_by = admin.id
       LEFT JOIN review_photos rp ON r.id = rp.review_id
       WHERE r.id = ? AND r.deleted_at IS NULL
       GROUP BY r.id`,
      [reviewId],
    );

    if (reviews.length === 0) {
      return sendError(res, "Review not found", 404);
    }

    const review = {
      ...reviews[0],
      photo_urls: reviews[0].photo_urls ? reviews[0].photo_urls.split(",") : [],
    };

    return sendSuccess(res, { review });
  } catch (error) {
    console.error("❌ Error fetching review details:", error);
    return sendError(res, error.message, 500);
  }
};

export default {
  submitReview,
  getPropertyReviews,
  adminListReviews,
  adminEditReview,
  adminApproveReview,
  adminRejectReview,
  adminGetReviewDetails,
};
