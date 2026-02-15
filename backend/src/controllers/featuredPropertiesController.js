// Additional controller functions for Featured & Recommended Properties Manager
// Add these functions to adminController.js after the existing recommended properties functions

// ===================================================================
// FEATURED & RECOMMENDED PROPERTIES MANAGEMENT (SESSION 53)
// ===================================================================

/**
 * Get all properties with featured/recommended status for management page
 * Returns compact data optimized for the management interface
 */
export const getFeaturedRecommendedManagement = asyncHandler(
  async (req, res) => {
    const { property_type_id, status, search } = req.query;

    let query = `
    SELECT 
      p.id,
      p.title,
      p.city_id,
      c.name as city_name,
      c.state as city_state,
      p.property_type_id,
      pt.name as property_type_name,
      pt.slug as property_type_slug,
      p.status,
      p.is_featured,
      p.priority_order,
      p.featured_at,
      p.featured_by,
      fa.name as featured_by_name,
      p.is_recommended,
      p.recommended_priority,
      p.recommended_at, 
      p.recommended_by,
      ra.name as recommended_by_name,
      p.rating,
      p.reviews_count,
      p.photos,
      p.bedrooms,
      p.max_guests,
      p.created_at
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN admins fa ON p.featured_by = fa.id
    LEFT JOIN admins ra ON p.recommended_by = ra.id
    WHERE p.deleted_at IS NULL
  `;

    const params = [];

    // Filters
    if (property_type_id) {
      query += " AND p.property_type_id = ?";
      params.push(property_type_id);
    }

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (p.title LIKE ? OR c.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query +=
      " ORDER BY p.is_featured DESC, p.priority_order DESC, p.is_recommended DESC, p.recommended_priority DESC, p.created_at DESC";

    const [properties] = await db.query(query, params);

    // Parse photos and add thumbnail
    const parsedProperties = properties.map((prop) => {
      try {
        prop.photos = prop.photos ? JSON.parse(prop.photos) : [];
        prop.thumbnail = prop.photos[0] || null;
      } catch (error) {
        prop.photos = [];
        prop.thumbnail = null;
      }
      return prop;
    });

    // Get counts
    const featuredCount = parsedProperties.filter((p) => p.is_featured).length;
    const recommendedCount = parsedProperties.filter(
      (p) => p.is_recommended,
    ).length;

    sendSuccess(
      res,
      {
        properties: parsedProperties,
        total: parsedProperties.length,
        featured_count: featuredCount,
        recommended_count: recommendedCount,
      },
      "Properties fetched successfully",
      200,
    );
  },
);

/**
 * Toggle featured status for a property
 * Featured properties are limited to 6 maximum
 */
export const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_featured } = req.body;
  const adminId = req.admin.id;

  // Validate property exists
  const [properties] = await db.query(
    "SELECT id, is_featured, title, status FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const property = properties[0];

  // If marking as featured, check limit (6 maximum)
  if (is_featured) {
    const [count] = await db.query(
      `SELECT COUNT(*) as total 
       FROM properties 
       WHERE is_featured = 1 
       AND deleted_at IS NULL
       AND id != ?`,
      [id],
    );

    if (count[0].total >= 6) {
      return sendError(
        res,
        "Maximum 6 properties can be featured at once",
        400,
      );
    }

    // Get next priority (highest current + 1)
    const [maxPriority] = await db.query(
      `SELECT COALESCE(MAX(priority_order), 0) as max_priority 
       FROM properties 
       WHERE is_featured = 1 
       AND deleted_at IS NULL`,
    );

    const newPriority = maxPriority[0].max_priority + 1;

    await db.query(
      `UPDATE properties 
       SET is_featured = 1, 
           priority_order = ?,
           featured_at = NOW(),
           featured_by = ?
       WHERE id = ?`,
      [newPriority, adminId, id],
    );

    sendSuccess(
      res,
      {
        property_id: id,
        is_featured: true,
        priority_order: newPriority,
      },
      `"${property.title}" is now featured`,
      200,
    );
  } else {
    // Remove from featured
    await db.query(
      `UPDATE properties 
       SET is_featured = 0, 
           priority_order = 0,
           featured_at = NULL,
           featured_by = NULL
       WHERE id = ?`,
      [id],
    );

    // Reorder remaining featured properties
    const [remainingProperties] = await db.query(
      `SELECT id 
       FROM properties 
       WHERE is_featured = 1 
       AND deleted_at IS NULL
       ORDER BY priority_order DESC`,
    );

    // Reset priorities to 6, 5, 4, 3, 2, 1 (descending)
    const totalRemaining = remainingProperties.length;
    for (let i = 0; i < totalRemaining; i++) {
      await db.query("UPDATE properties SET priority_order = ? WHERE id = ?", [
        totalRemaining - i,
        remainingProperties[i].id,
      ]);
    }

    sendSuccess(
      res,
      { property_id: id, is_featured: false },
      `"${property.title}" removed from featured`,
      200,
    );
  }
});

/**
 * Reorder featured properties (drag and drop)
 * Accepts array of property IDs in desired order
 */
export const reorderFeaturedProperties = asyncHandler(async (req, res) => {
  const { ordered_property_ids } = req.body;

  // Validate inputs
  if (!Array.isArray(ordered_property_ids)) {
    return sendError(res, "ordered_property_ids array required", 400);
  }

  if (ordered_property_ids.length > 6) {
    return sendError(res, "Maximum 6 properties can be featured", 400);
  }

  // Verify all properties exist and are featured
  const placeholders = ordered_property_ids.map(() => "?").join(",");
  const [properties] = await db.query(
    `SELECT id 
     FROM properties 
     WHERE id IN (${placeholders}) 
     AND is_featured = 1
     AND deleted_at IS NULL`,
    ordered_property_ids,
  );

  if (properties.length !== ordered_property_ids.length) {
    return sendError(res, "Some properties not found or not featured", 400);
  }

  // Update priorities (highest priority = first in array)
  const totalProperties = ordered_property_ids.length;
  for (let i = 0; i < totalProperties; i++) {
    const priority = totalProperties - i; // Reverse: first = highest
    await db.query("UPDATE properties SET priority_order = ? WHERE id = ?", [
      priority,
      ordered_property_ids[i],
    ]);
  }

  sendSuccess(
    res,
    {
      reordered_count: totalProperties,
    },
    "Featured properties reordered successfully",
    200,
  );
});

/**
 * Bulk update featured/recommended status
 * Allows selecting multiple properties and applying status change
 */
export const bulkUpdateFeaturedRecommended = asyncHandler(async (req, res) => {
  const { property_ids, action, property_type_id } = req.body;
  const adminId = req.admin.id;

  // Validate inputs
  if (!Array.isArray(property_ids) || property_ids.length === 0) {
    return sendError(res, "property_ids array required", 400);
  }

  if (!["feature", "unfeature", "recommend", "unrecommend"].includes(action)) {
    return sendError(res, "Invalid action", 400);
  }

  const placeholders = property_ids.map(() => "?").join(",");
  const [properties] = await db.query(
    `SELECT id, title 
     FROM properties 
     WHERE id IN (${placeholders}) 
     AND deleted_at IS NULL`,
    property_ids,
  );

  if (properties.length !== property_ids.length) {
    return sendError(res, "Some properties not found", 400);
  }

  let updated = 0;
  let errors = [];

  // Process each property
  for (const propId of property_ids) {
    try {
      if (action === "feature") {
        // Check featured limit
        const [count] = await db.query(
          `SELECT COUNT(*) as total FROM properties WHERE is_featured = 1 AND deleted_at IS NULL`,
        );
        if (count[0].total >= 6) {
          errors.push(`Featured limit reached (max 6)`);
          break;
        }

        const [maxPriority] = await db.query(
          `SELECT COALESCE(MAX(priority_order), 0) as max_priority FROM properties WHERE is_featured = 1`,
        );
        const newPriority = maxPriority[0].max_priority + 1;

        await db.query(
          `UPDATE properties 
           SET is_featured = 1, priority_order = ?, featured_at = NOW(), featured_by = ? 
           WHERE id = ?`,
          [newPriority, adminId, propId],
        );
        updated++;
      } else if (action === "unfeature") {
        await db.query(
          `UPDATE properties 
           SET is_featured = 0, priority_order = 0, featured_at = NULL, featured_by = NULL 
           WHERE id = ?`,
          [propId],
        );
        updated++;
      } else if (action === "recommend") {
        if (!property_type_id) {
          errors.push("property_type_id required for recommend action");
          break;
        }

        // Check recommended limit per type
        const [count] = await db.query(
          `SELECT COUNT(*) as total FROM properties WHERE property_type_id = ? AND is_recommended = 1 AND deleted_at IS NULL`,
          [property_type_id],
        );
        if (count[0].total >= 12) {
          errors.push(`Recommended limit reached for property type (max 12)`);
          break;
        }

        const [maxPriority] = await db.query(
          `SELECT COALESCE(MAX(recommended_priority), 0) as max_priority 
           FROM properties WHERE property_type_id = ? AND is_recommended = 1`,
          [property_type_id],
        );
        const newPriority = maxPriority[0].max_priority + 1;

        await db.query(
          `UPDATE properties 
           SET is_recommended = 1, recommended_priority = ?, recommended_at = NOW(), recommended_by = ? 
           WHERE id = ?`,
          [newPriority, adminId, propId],
        );
        updated++;
      } else if (action === "unrecommend") {
        await db.query(
          `UPDATE properties 
           SET is_recommended = 0, recommended_priority = 0, recommended_at = NULL, recommended_by = NULL 
           WHERE id = ?`,
          [propId],
        );
        updated++;
      }
    } catch (error) {
      errors.push(`Error updating property ${propId}: ${error.message}`);
    }
  }

  sendSuccess(
    res,
    {
      updated_count: updated,
      errors: errors.length > 0 ? errors : null,
    },
    `Bulk update completed: ${updated} properties updated`,
    200,
  );
});
