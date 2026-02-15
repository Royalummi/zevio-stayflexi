import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import { sanitizeRichText } from "../utils/sanitize.js";

/**
 * @route   POST /api/vendor/properties
 * @desc    Create new property (vendor)
 * @access  Private (Vendor only)
 */
export const createProperty = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const {
    city_id,
    property_type_id,
    title,
    description,
    address,
    area,
    state,
    pincode,
    maps_location,
    bedrooms,
    bathrooms,
    max_guests,
    min_stay_days,
    max_stay_days,
    housekeeping_frequency,
    laundry_frequency,
    utilities_included,
    parking_slots,
    floor_number,
    wifi_speed_mbps,
    wifi_provider,
    furnishing_type,
    same_day_booking_allowed,
    max_booking_days,
    check_in_time,
    check_out_time,
    check_in_guidelines,
    house_rules_text,
    amenities_guide,
    safety_information,
    local_area_info,
    emergency_contacts,
    amenities,
    house_rules,
    cancellation_policy,
    photos,
    price_per_night,
    gst_percentage,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
    weekly_discount_percent,
    monthly_discount_percent,
    primary_incharge_name,
    primary_incharge_phone,
    primary_incharge_email,
  } = req.body;

  // Minimal validation - allow draft saving
  if (!title) {
    return sendError(res, "Property title is required", 400);
  }

  // XSS Protection - Sanitize rich text fields
  const safeCheckInGuidelines = check_in_guidelines
    ? sanitizeRichText(check_in_guidelines)
    : null;
  const safeHouseRulesText = house_rules_text
    ? sanitizeRichText(house_rules_text)
    : null;
  const safeAmenitiesGuide = amenities_guide
    ? sanitizeRichText(amenities_guide)
    : null;
  const safeSafetyInfo = safety_information
    ? sanitizeRichText(safety_information)
    : null;
  const safeLocalAreaInfo = local_area_info
    ? sanitizeRichText(local_area_info)
    : null;
  const safeEmergencyContacts = emergency_contacts
    ? sanitizeRichText(emergency_contacts)
    : null;

  const propertyId = generateUUID();

  // Insert property
  const propertyQuery = `
    INSERT INTO properties (
      id, vendor_id, city_id, property_type_id, title, description,
      address, area, state, pincode, maps_location,
      bedrooms, bathrooms, max_guests,
      min_stay_days, max_stay_days, housekeeping_frequency, laundry_frequency,
      utilities_included, parking_slots, floor_number, wifi_speed_mbps, wifi_provider, furnishing_type,
      same_day_booking_allowed, max_booking_days, check_in_time, check_out_time,
      check_in_guidelines, house_rules_text, amenities_guide,
      safety_information, local_area_info, emergency_contacts,
      house_rules, cancellation_policy, photos, status, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, 'draft', NOW()
    )
  `;

  const propertyValues = [
    propertyId,
    vendorId,
    city_id || null,
    property_type_id || null,
    title,
    description || null,
    address || null,
    area || null,
    state || null,
    pincode || null,
    maps_location || null,
    bedrooms || 0,
    bathrooms || 0,
    max_guests || 2,
    min_stay_days || 1,
    max_stay_days || null,
    housekeeping_frequency || "weekly",
    laundry_frequency || "weekly",
    utilities_included || false,
    parking_slots || 0,
    floor_number || null,
    wifi_speed_mbps || null,
    wifi_provider || null,
    furnishing_type || "fully_furnished",
    same_day_booking_allowed || false,
    max_booking_days || null,
    check_in_time || "2:00 PM",
    check_out_time || "11:00 AM",
    safeCheckInGuidelines,
    safeHouseRulesText,
    safeAmenitiesGuide,
    safeSafetyInfo,
    safeLocalAreaInfo,
    safeEmergencyContacts,
    house_rules ? JSON.stringify(house_rules) : "{}",
    cancellation_policy ? JSON.stringify(cancellation_policy) : "{}",
    photos ? JSON.stringify(photos) : "[]",
  ];

  await db.query(propertyQuery, propertyValues);

  // Insert pricing data if provided
  if (price_per_night) {
    const pricingId = generateUUID();
    const pricingQuery = `
      INSERT INTO property_pricing (
        id, property_id, price_per_night, gst_percentage,
        min_guests, extra_guest_charge, min_children, max_children, extra_child_charge,
        weekly_discount_percent, monthly_discount_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const pricingValues = [
      pricingId,
      propertyId,
      price_per_night,
      gst_percentage || 18,
      min_guests || 1,
      extra_guest_charge || 0,
      min_children || 0,
      max_children || 0,
      extra_child_charge || 0,
      weekly_discount_percent || 0,
      monthly_discount_percent || 0,
    ];

    await db.query(pricingQuery, pricingValues);
  }

  // Insert amenities if provided
  if (amenities && Array.isArray(amenities) && amenities.length > 0) {
    const amenityValues = amenities.map((amenityId) => [
      generateUUID(),
      propertyId,
      amenityId,
    ]);
    const amenityQuery = `INSERT INTO property_amenities (id, property_id, amenity_id) VALUES ?`;
    await db.query(amenityQuery, [amenityValues]);
  }

  // Insert primary incharge if provided
  if (primary_incharge_name && primary_incharge_phone) {
    const contactQuery = `
      INSERT INTO property_contacts (property_id, contact_type_id, name, phone, email, is_active)
      VALUES (?, 1, ?, ?, ?, 1)
    `;
    await db.query(contactQuery, [
      propertyId,
      primary_incharge_name,
      primary_incharge_phone,
      primary_incharge_email || null,
    ]);
  }

  sendSuccess(
    res,
    {
      id: propertyId,
      title,
      status: "draft",
    },
    "Property created successfully as draft. Complete the details and submit for approval.",
    201,
  );
});

/**
 * @route   GET /api/vendor/properties/:id
 * @desc    Get property details by ID
 * @access  Private (Vendor only)
 */
export const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;

  // Get property with pricing and amenities
  const [properties] = await db.query(
    `SELECT 
      p.*,
      c.name as city_name,
      pt.name as property_type_name,
      pr.price_per_night, pr.gst_percentage, pr.min_guests, pr.extra_guest_charge,
      pr.min_children, pr.max_children, pr.extra_child_charge,
      pr.weekly_discount_percent, pr.monthly_discount_percent,
      pr.quarterly_discount_percent, pr.long_term_discount_percent,
      pr.allow_corporate_booking, pr.corporate_discount_percent,
      pr.deposit_amount, pr.maintenance_charges, pr.notice_period_days
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN property_pricing pr ON p.id = pr.property_id
    WHERE p.id = ? AND p.vendor_id = ? AND p.deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  const property = properties[0];

  // Get amenities
  const [amenities] = await db.query(
    `SELECT pa.amenity_id as id, a.name, a.category, a.icon
     FROM property_amenities pa
     JOIN amenities a ON pa.amenity_id = a.id
     WHERE pa.property_id = ?`,
    [id],
  );

  // Get contacts
  const [contacts] = await db.query(
    `SELECT id, name, phone, email, contact_type_id
     FROM property_contacts
     WHERE property_id = ? AND is_active = 1`,
    [id],
  );

  // Check for pending change requests
  const [pendingChanges] = await db.query(
    `SELECT id, requested_changes, created_at
     FROM property_change_requests
     WHERE property_id = ? AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1`,
    [id],
  );

  // Parse JSON fields
  if (property.house_rules) {
    try {
      property.house_rules = JSON.parse(property.house_rules);
    } catch (e) {
      property.house_rules = {};
    }
  }
  if (property.cancellation_policy) {
    try {
      property.cancellation_policy = JSON.parse(property.cancellation_policy);
    } catch (e) {
      property.cancellation_policy = {};
    }
  }
  if (property.photos) {
    try {
      property.photos = JSON.parse(property.photos);
    } catch (e) {
      property.photos = [];
    }
  }

  sendSuccess(res, {
    property,
    amenities,
    contacts,
    pendingChangeRequest: pendingChanges.length > 0 ? pendingChanges[0] : null,
  });
});

/**
 * @route   PATCH /api/vendor/properties/:id/submit
 * @desc    Submit property for approval (draft → pending_approval)
 * @access  Private (Vendor only)
 */
export const submitProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;

  // Check if property exists and belongs to vendor
  const [properties] = await db.query(
    `SELECT id, title, status, city_id, property_type_id 
     FROM properties 
     WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  const property = properties[0];

  // Only draft properties can be submitted
  if (property.status !== "draft") {
    return sendError(
      res,
      `Cannot submit property with status: ${property.status}`,
      400,
    );
  }

  // Validate required fields for submission
  if (!property.city_id || !property.property_type_id) {
    return sendError(
      res,
      "Please complete all required fields: city, property type",
      400,
    );
  }

  // Check if pricing exists
  const [pricing] = await db.query(
    `SELECT id FROM property_pricing WHERE property_id = ?`,
    [id],
  );

  if (pricing.length === 0) {
    return sendError(
      res,
      "Please add pricing information before submitting",
      400,
    );
  }

  // Update status to pending_approval
  await db.query(
    `UPDATE properties SET status = 'pending_approval' WHERE id = ?`,
    [id],
  );

  // Notify admin (don't let notification failure block response)
  try {
    const notifId = generateUUID();
    const [admins] = await db.query(
      `SELECT id FROM admins WHERE role IN ('admin', 'super_admin') AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
    );

    if (admins.length > 0) {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at) 
         VALUES (?, ?, 'admin', ?, ?, NOW())`,
        [
          notifId,
          admins[0].id,
          "New Property Submission",
          `New property "${property.title}" submitted for approval by vendor`,
        ],
      );
    }
  } catch (notifError) {
    console.error("Failed to send notification:", notifError);
    // Continue anyway - notification failure shouldn't block submission
  }

  sendSuccess(
    res,
    {
      id,
      status: "pending_approval",
    },
    "Property submitted for approval successfully",
  );
});

/**
 * @route   PATCH /api/vendor/properties/:id
 * @desc    Update property (creates change request if approved)
 * @access  Private (Vendor only)
 */
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;
  const updates = req.body;

  // Check if property exists and belongs to vendor
  const [properties] = await db.query(
    `SELECT id, title, status FROM properties 
     WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  const property = properties[0];

  // If property is approved, create change request instead
  if (property.status === "approved") {
    // Check for pending change requests
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

    // Sanitize rich text fields in updates
    const sanitizedUpdates = { ...updates };
    const richTextFields = [
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];

    richTextFields.forEach((field) => {
      if (sanitizedUpdates[field]) {
        sanitizedUpdates[field] = sanitizeRichText(sanitizedUpdates[field]);
      }
    });

    // Create change request
    const requestId = generateUUID();
    await db.query(
      `INSERT INTO property_change_requests 
       (id, property_id, requested_changes, status, created_at) 
       VALUES (?, ?, ?, 'pending', NOW())`,
      [requestId, id, JSON.stringify(sanitizedUpdates)],
    );

    // Notify admin (don't let notification failure block response)
    try {
      const notifId = generateUUID();
      const [admins] = await db.query(
        `SELECT id FROM admins WHERE role IN ('admin', 'super_admin') AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      );

      if (admins.length > 0) {
        await db.query(
          `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at) 
           VALUES (?, ?, 'admin', ?, ?, NOW())`,
          [
            notifId,
            admins[0].id,
            "Property Change Request",
            `Vendor requested changes for property: ${property.title}`,
          ],
        );
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Continue anyway - notification failure shouldn't block change request
    }

    return sendSuccess(
      res,
      {
        changeRequestId: requestId,
        message:
          "Property is live. Change request created and sent for admin approval.",
      },
      "Change request submitted successfully",
    );
  }

  // If property is draft or pending_approval, update directly
  // Build update query dynamically
  const updateFields = [];
  const params = [];

  // Sanitize rich text fields
  const richTextFields = [
    "check_in_guidelines",
    "house_rules_text",
    "amenities_guide",
    "safety_information",
    "local_area_info",
    "emergency_contacts",
  ];

  Object.keys(updates).forEach((field) => {
    if (field === "amenities" || field === "pricing") {
      // Skip - handle separately
      return;
    }

    let value = updates[field];

    // Sanitize rich text
    if (richTextFields.includes(field) && value) {
      value = sanitizeRichText(value);
    }

    // Handle JSON fields
    if (
      ["house_rules", "cancellation_policy", "photos"].includes(field) &&
      typeof value === "object"
    ) {
      value = JSON.stringify(value);
    }

    updateFields.push(`${field} = ?`);
    params.push(value);
  });

  if (updateFields.length > 0) {
    params.push(id);
    await db.query(
      `UPDATE properties SET ${updateFields.join(", ")} WHERE id = ?`,
      params,
    );
  }

  // Update pricing if provided
  if (updates.pricing) {
    const pricingUpdates = updates.pricing;
    const pricingFields = [];
    const pricingParams = [];

    Object.keys(pricingUpdates).forEach((field) => {
      pricingFields.push(`${field} = ?`);
      pricingParams.push(pricingUpdates[field]);
    });

    if (pricingFields.length > 0) {
      pricingParams.push(id);
      await db.query(
        `UPDATE property_pricing SET ${pricingFields.join(", ")} WHERE property_id = ?`,
        pricingParams,
      );
    }
  }

  // Update amenities if provided
  if (updates.amenities && Array.isArray(updates.amenities)) {
    // Delete existing
    await db.query(`DELETE FROM property_amenities WHERE property_id = ?`, [
      id,
    ]);

    // Insert new
    if (updates.amenities.length > 0) {
      const amenityValues = updates.amenities.map((amenityId) => [
        generateUUID(),
        id,
        amenityId,
      ]);
      await db.query(
        `INSERT INTO property_amenities (id, property_id, amenity_id) VALUES ?`,
        [amenityValues],
      );
    }
  }

  sendSuccess(
    res,
    { id, status: property.status },
    "Property updated successfully",
  );
});

/**
 * @route   DELETE /api/vendor/properties/:id
 * @desc    Soft delete property (vendor)
 * @access  Private (Vendor only)
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { id } = req.params;

  // Check if property exists and belongs to vendor
  const [properties] = await db.query(
    `SELECT id, status FROM properties WHERE id = ? AND vendor_id = ?`,
    [id, vendorId],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const property = properties[0];

  // Check if property can be deleted (no active bookings)
  const [activeBookings] = await db.query(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE property_id = ? 
     AND status IN ('pending', 'confirmed') 
     AND check_out >= CURDATE()`,
    [id],
  );

  if (activeBookings[0].count > 0) {
    return sendError(
      res,
      "Cannot delete property with active or upcoming bookings",
      400,
    );
  }

  // Soft delete by setting deleted_at timestamp and updating status
  await db.query(
    `UPDATE properties 
     SET deleted_at = NOW(), status = 'draft' 
     WHERE id = ?`,
    [id],
  );

  sendSuccess(res, null, "Property deleted successfully");
});

export default {
  createProperty,
  getPropertyById,
  submitProperty,
  updateProperty,
  deleteProperty,
};
