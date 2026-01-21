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
    [id, vendorId]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Check if there's already a pending request for this property
  const [pending] = await db.query(
    `SELECT id FROM property_change_requests 
     WHERE property_id = ? AND status = 'pending'`,
    [id]
  );

  if (pending.length > 0) {
    return sendError(
      res,
      "There is already a pending change request for this property",
      400
    );
  }

  // Create change request
  const requestId = generateUUID();
  await db.query(
    `INSERT INTO property_change_requests 
     (id, property_id, requested_changes, status) 
     VALUES (?, ?, ?, 'pending')`,
    [requestId, id, JSON.stringify(requested_changes)]
  );

  // Send notification to admin
  const notifId = generateUUID();
  const [admins] = await db.query(
    `SELECT id FROM admins WHERE role IN ('admin', 'super_admin') AND status = 'active' LIMIT 1`
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
      ]
    );
  }

  sendSuccess(res, "Change request submitted successfully", { requestId }, 201);
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
    [vendorId]
  );

  sendSuccess(res, "Change requests retrieved successfully", { requests });
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
    [parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM property_change_requests pcr 
     WHERE 1=1 ${statusFilter}`
  );

  sendSuccess(res, "Change requests retrieved successfully", {
    requests,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
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
    [id]
  );

  if (requests.length === 0) {
    return sendError(res, "Change request not found or already processed", 404);
  }

  const request = requests[0];
  const changes = JSON.parse(request.requested_changes);

  // Build update query dynamically
  const updateFields = [];
  const params = [];

  Object.keys(changes).forEach((field) => {
    updateFields.push(`${field} = ?`);
    params.push(changes[field]);
  });

  if (updateFields.length > 0) {
    params.push(request.property_id);
    await db.query(
      `UPDATE properties SET ${updateFields.join(", ")} WHERE id = ?`,
      params
    );
  }

  // Update request status
  await db.query(
    `UPDATE property_change_requests 
     SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() 
     WHERE id = ?`,
    [adminId, id]
  );

  // Send notification to vendor
  const notifId = generateUUID();
  await db.query(
    `INSERT INTO notifications (id, recipient_id, recipient_role, title, message) 
     VALUES (?, ?, 'vendor', ?, ?)`,
    [
      notifId,
      request.vendor_id,
      "Change Request Approved",
      `Your change request for "${request.title}" has been approved`,
    ]
  );

  sendSuccess(res, "Change request approved and applied successfully");
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
    [id]
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
    [adminId, id]
  );

  // Send notification to vendor
  const notifId = generateUUID();
  const message = rejection_reason
    ? `Your change request for "${request.title}" was rejected. Reason: ${rejection_reason}`
    : `Your change request for "${request.title}" was rejected`;

  await db.query(
    `INSERT INTO notifications (id, recipient_id, recipient_role, title, message) 
     VALUES (?, ?, 'vendor', ?, ?)`,
    [notifId, request.vendor_id, "Change Request Rejected", message]
  );

  sendSuccess(res, "Change request rejected successfully");
});
