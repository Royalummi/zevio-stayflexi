import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * @route   POST /api/vendor/properties/:id/request-change
 * @desc    Vendor request changes to their property
 * @access  Private (Vendor)
 */
export const requestPropertyChange = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { requested_changes } = req.body;
  const vendorId = req.user.id;

  if (!requested_changes || Object.keys(requested_changes).length === 0) {
    return sendError(res, "Requested changes are required", 400);
  }

  // Check if property belongs to vendor
  const [properties] = await db.query(
    `SELECT id, title FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Check if there's already a pending request for this property
  const [pending] = await db.query(
    `SELECT id FROM property_change_requests 
     WHERE property_id = ? AND status = 'pending'`,
    [id],
  );

  if (pending.length > 0) {
    return sendError(
      res,
      "There is already a pending change request for this property",
      400,
    );
  }

  // Create change request
  const requestId = generateUUID();
  await db.query(
    `INSERT INTO property_change_requests 
     (id, property_id, requested_changes, status) 
     VALUES (?, ?, ?, 'pending')`,
    [requestId, id, JSON.stringify(requested_changes)],
  );

  // Send notification to admin (best-effort — don't block on FK mismatch)
  try {
    const notifId = generateUUID();
    const [admins] = await db.query(
      `SELECT id FROM admins WHERE role IN ('admin', 'super_admin') AND status = 'active' LIMIT 1`,
    );

    if (admins.length > 0) {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, recipient_role, title, message) 
         VALUES (?, ?, 'admin', ?, ?)`,
        [
          notifId,
          admins[0].id,
          "Property Change Request",
          `Vendor requested changes for property: ${properties[0].title}`,
        ],
      );
    }
  } catch (notifError) {
    console.error(
      "Failed to send change request notification:",
      notifError.message,
    );
  }

  sendSuccess(res, { requestId }, "Change request submitted successfully", 201);
});

/**
 * @route   GET /api/vendor/change-requests
 * @desc    Get vendor's property change requests
 * @access  Private (Vendor)
 */
export const getVendorChangeRequests = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { status } = req.query;

  let statusFilter = "";
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    statusFilter = `AND pcr.status = '${status}'`;
  }

  const [requests] = await db.query(
    `SELECT 
      pcr.id, pcr.requested_changes, pcr.status, pcr.created_at, pcr.reviewed_at,
      p.title as property_title, p.id as property_id,
      a.name as reviewed_by_name
    FROM property_change_requests pcr
    LEFT JOIN properties p ON pcr.property_id = p.id
    LEFT JOIN admins a ON pcr.reviewed_by = a.id
    WHERE p.vendor_id = ? ${statusFilter}
    ORDER BY pcr.created_at DESC`,
    [vendorId],
  );

  sendSuccess(res, { requests }, "Change requests retrieved successfully");
});

/**
 * @route   GET /api/admin/change-requests
 * @desc    Admin view all property change requests
 * @access  Private (Admin)
 */
export const getAllChangeRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let statusFilter = "";
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    statusFilter = `AND pcr.status = '${status}'`;
  }

  const [requests] = await db.query(
    `SELECT 
      pcr.id, pcr.requested_changes, pcr.status, pcr.created_at, pcr.reviewed_at,
      p.title as property_title, p.id as property_id, p.status as property_status,
      v.name as vendor_name, v.email as vendor_email,
      a.name as reviewed_by_name
    FROM property_change_requests pcr
    LEFT JOIN properties p ON pcr.property_id = p.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN admins a ON pcr.reviewed_by = a.id
    WHERE 1=1 ${statusFilter}
    ORDER BY pcr.created_at DESC
    LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM property_change_requests pcr 
     WHERE 1=1 ${statusFilter}`,
  );

  sendSuccess(
    res,
    {
      requests,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    },
    "Change requests retrieved successfully",
  );
});

/**
 * @route   PATCH /api/admin/change-requests/:id/approve
 * @desc    Admin approve property change request
 * @access  Private (Admin)
 */
export const approveChangeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  // Get change request details
  const [requests] = await db.query(
    `SELECT 
      pcr.id, pcr.property_id, pcr.requested_changes,
      p.vendor_id, p.title
    FROM property_change_requests pcr
    LEFT JOIN properties p ON pcr.property_id = p.id
    WHERE pcr.id = ? AND pcr.status = 'pending'`,
    [id],
  );

  if (requests.length === 0) {
    return sendError(res, "Change request not found or already processed", 404);
  }

  const request = requests[0];
  const changes = JSON.parse(request.requested_changes);

  // Define which fields belong to which tables
  const pricingFields = [
    "price_per_night",
    "gst_percentage",
    "min_guests",
    "extra_guest_charge",
    "min_children",
    "max_children",
    "extra_child_charge",
    "weekly_discount_percent",
    "monthly_discount_percent",
    "quarterly_discount_percent",
    "long_term_discount_percent",
    "allow_corporate_booking",
    "corporate_discount_percent",
    "deposit_amount",
    "maintenance_charges",
    "notice_period_days",
  ];

  const propertyFields = {};
  const pricingUpdates = {};
  let amenitiesUpdate = null;

  // Separate changes by table
  Object.keys(changes).forEach((field) => {
    if (field === "amenities") {
      amenitiesUpdate = changes[field]; // Array of amenity IDs
    } else if (pricingFields.includes(field)) {
      pricingUpdates[field] = changes[field];
    } else {
      // Property table fields
      propertyFields[field] = changes[field];
    }
  });

  // Update properties table
  if (Object.keys(propertyFields).length > 0) {
    const updateFields = [];
    const params = [];

    Object.keys(propertyFields).forEach((field) => {
      updateFields.push(`${field} = ?`);
      // Handle JSON fields
      if (["house_rules", "cancellation_policy", "photos"].includes(field)) {
        params.push(
          typeof propertyFields[field] === "string"
            ? propertyFields[field]
            : JSON.stringify(propertyFields[field]),
        );
      } else {
        params.push(propertyFields[field]);
      }
    });

    params.push(request.property_id);
    await db.query(
      `UPDATE properties SET ${updateFields.join(", ")} WHERE id = ?`,
      params,
    );
  }

  // Update property_pricing table
  if (Object.keys(pricingUpdates).length > 0) {
    const updateFields = [];
    const params = [];

    Object.keys(pricingUpdates).forEach((field) => {
      updateFields.push(`${field} = ?`);
      params.push(pricingUpdates[field]);
    });

    params.push(request.property_id);
    // Check if pricing exists
    const [existingPricing] = await db.query(
      `SELECT id FROM property_pricing WHERE property_id = ?`,
      [request.property_id],
    );

    if (existingPricing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE property_pricing SET ${updateFields.join(", ")}, updated_at = NOW() WHERE property_id = ?`,
        params,
      );
    } else {
      // Create new (shouldn't happen for approved properties, but handle it)
      const pricingId = generateUUID();
      const insertFields = [
        "id",
        "property_id",
        ...Object.keys(pricingUpdates),
      ];
      const insertValues = [
        pricingId,
        request.property_id,
        ...Object.values(pricingUpdates),
      ];
      await db.query(
        `INSERT INTO property_pricing (${insertFields.join(", ")}) VALUES (${insertFields.map(() => "?").join(", ")})`,
        insertValues,
      );
    }
  }

  // Update amenities
  if (amenitiesUpdate && Array.isArray(amenitiesUpdate)) {
    // Delete existing amenities
    await db.query(`DELETE FROM property_amenities WHERE property_id = ?`, [
      request.property_id,
    ]);

    // Insert new amenities
    if (amenitiesUpdate.length > 0) {
      const amenityValues = amenitiesUpdate.map((amenityId) => [
        generateUUID(),
        request.property_id,
        amenityId,
      ]);
      await db.query(
        `INSERT INTO property_amenities (id, property_id, amenity_id) VALUES ?`,
        [amenityValues],
      );
    }
  }

  // Update request status
  await db.query(
    `UPDATE property_change_requests 
     SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() 
     WHERE id = ?`,
    [adminId, id],
  );

  // Send notification to vendor (don't let failure block response)
  try {
    const notifId = generateUUID();
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at) 
       VALUES (?, ?, 'vendor', ?, ?, NOW())`,
      [
        notifId,
        request.vendor_id,
        "Change Request Approved",
        `Your change request for "${request.title}" has been approved`,
      ],
    );
  } catch (notifError) {
    console.error("Failed to send notification:", notifError);
  }

  sendSuccess(res, null, "Change request approved and applied successfully");
});

/**
 * @route   PATCH /api/admin/change-requests/:id/reject
 * @desc    Admin reject property change request
 * @access  Private (Admin)
 */
export const rejectChangeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const adminId = req.user.id;

  // Get change request details
  const [requests] = await db.query(
    `SELECT 
      pcr.id, p.vendor_id, p.title
    FROM property_change_requests pcr
    LEFT JOIN properties p ON pcr.property_id = p.id
    WHERE pcr.id = ? AND pcr.status = 'pending'`,
    [id],
  );

  if (requests.length === 0) {
    return sendError(res, "Change request not found or already processed", 404);
  }

  const request = requests[0];

  // Update request status
  await db.query(
    `UPDATE property_change_requests 
     SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() 
     WHERE id = ?`,
    [adminId, id],
  );

  // Send notification to vendor (don't let failure block response)
  try {
    const notifId = generateUUID();
    const message = rejection_reason
      ? `Your change request for "${request.title}" was rejected. Reason: ${rejection_reason}`
      : `Your change request for "${request.title}" was rejected`;

    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at) 
       VALUES (?, ?, 'vendor', ?, ?, NOW())`,
      [notifId, request.vendor_id, "Change Request Rejected", message],
    );
  } catch (notifError) {
    console.error("Failed to send notification:", notifError);
  }

  sendSuccess(res, null, "Change request rejected successfully");
});
