/**
 * Amenities Service
 * Helper functions for working with normalized amenities tables
 */

import db from "../config/database.js";

/**
 * Get amenities SELECT clause with aggregation
 * @param {string} propertyAlias - Alias for properties table (default: 'p')
 * @param {string} paAlias - Alias for property_amenities table (default: 'pa')
 * @param {string} aAlias - Alias for amenities table (default: 'a')
 * @returns {string} SELECT clause for amenities
 */
export const getAmenitiesSelectClause = (
  propertyAlias = "p",
  paAlias = "pa",
  aAlias = "a"
) => {
  return `GROUP_CONCAT(DISTINCT ${aAlias}.name ORDER BY ${aAlias}.display_order SEPARATOR ', ') as amenities`;
};

/**
 * Get amenities JOIN clause
 * @param {string} propertyAlias - Alias for properties table (default: 'p')
 * @param {string} paAlias - Alias for property_amenities table (default: 'pa')
 * @param {string} aAlias - Alias for amenities table (default: 'a')
 * @returns {string} JOIN clause for amenities
 */
export const getAmenitiesJoinClause = (
  propertyAlias = "p",
  paAlias = "pa",
  aAlias = "a"
) => {
  return `LEFT JOIN property_amenities ${paAlias} ON ${propertyAlias}.id = ${paAlias}.property_id LEFT JOIN amenities ${aAlias} ON ${paAlias}.amenity_id = ${aAlias}.id AND ${aAlias}.is_active = 1`;
};

/**
 * Get all amenities for a property (returns array)
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of amenity objects
 */
export const getPropertyAmenities = async (propertyId) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        a.id,
        a.name,
        a.category,
        a.icon,
        a.description,
        a.display_order
      FROM property_amenities pa
      INNER JOIN amenities a ON pa.amenity_id = a.id
      WHERE pa.property_id = ? AND a.is_active = 1
      ORDER BY a.display_order`,
      [propertyId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching property amenities:", error);
    throw error;
  }
};

/**
 * Get all available amenities (master list)
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of all amenities
 */
export const getAllAmenities = async (category = null) => {
  try {
    let query = "SELECT * FROM amenities WHERE is_active = 1";
    const params = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY display_order, name";

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Error fetching amenities:", error);
    throw error;
  }
};

/**
 * Set amenities for a property (replaces existing)
 * @param {string} propertyId - Property ID
 * @param {Array<string>} amenityIds - Array of amenity IDs
 * @returns {Promise<boolean>} Success status
 */
export const setPropertyAmenities = async (propertyId, amenityIds) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Delete existing amenities
    await connection.execute(
      "DELETE FROM property_amenities WHERE property_id = ?",
      [propertyId]
    );

    // Insert new amenities
    if (amenityIds && amenityIds.length > 0) {
      const values = amenityIds.map((amenityId) => [
        generateUUID(),
        propertyId,
        amenityId,
      ]);

      await connection.query(
        `INSERT INTO property_amenities (id, property_id, amenity_id) VALUES ?`,
        [values]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error("Error setting property amenities:", error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Add amenities to a property (appends to existing)
 * @param {string} propertyId - Property ID
 * @param {Array<string>} amenityIds - Array of amenity IDs to add
 * @returns {Promise<boolean>} Success status
 */
export const addPropertyAmenities = async (propertyId, amenityIds) => {
  try {
    if (!amenityIds || amenityIds.length === 0) {
      return true;
    }

    const values = amenityIds.map((amenityId) => [
      generateUUID(),
      propertyId,
      amenityId,
    ]);

    await db.query(
      `INSERT IGNORE INTO property_amenities (id, property_id, amenity_id) VALUES ?`,
      [values]
    );

    return true;
  } catch (error) {
    console.error("Error adding property amenities:", error);
    throw error;
  }
};

/**
 * Remove amenities from a property
 * @param {string} propertyId - Property ID
 * @param {Array<string>} amenityIds - Array of amenity IDs to remove
 * @returns {Promise<boolean>} Success status
 */
export const removePropertyAmenities = async (propertyId, amenityIds) => {
  try {
    if (!amenityIds || amenityIds.length === 0) {
      return true;
    }

    const placeholders = amenityIds.map(() => "?").join(",");

    await db.execute(
      `DELETE FROM property_amenities 
       WHERE property_id = ? AND amenity_id IN (${placeholders})`,
      [propertyId, ...amenityIds]
    );

    return true;
  } catch (error) {
    console.error("Error removing property amenities:", error);
    throw error;
  }
};

/**
 * Create a new amenity
 * @param {Object} amenityData - Amenity data
 * @returns {Promise<string>} New amenity ID
 */
export const createAmenity = async (amenityData) => {
  try {
    const amenityId = generateUUID();

    await db.execute(
      `INSERT INTO amenities (id, name, category, icon, description, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        amenityId,
        amenityData.name,
        amenityData.category || "general",
        amenityData.icon || null,
        amenityData.description || null,
        amenityData.display_order || 0,
        amenityData.is_active !== undefined ? amenityData.is_active : 1,
      ]
    );

    return amenityId;
  } catch (error) {
    console.error("Error creating amenity:", error);
    throw error;
  }
};

/**
 * Update an amenity
 * @param {string} amenityId - Amenity ID
 * @param {Object} amenityData - Updated amenity data
 * @returns {Promise<boolean>} Success status
 */
export const updateAmenity = async (amenityId, amenityData) => {
  try {
    const updates = [];
    const values = [];

    if (amenityData.name !== undefined) {
      updates.push("name = ?");
      values.push(amenityData.name);
    }
    if (amenityData.category !== undefined) {
      updates.push("category = ?");
      values.push(amenityData.category);
    }
    if (amenityData.icon !== undefined) {
      updates.push("icon = ?");
      values.push(amenityData.icon);
    }
    if (amenityData.description !== undefined) {
      updates.push("description = ?");
      values.push(amenityData.description);
    }
    if (amenityData.display_order !== undefined) {
      updates.push("display_order = ?");
      values.push(amenityData.display_order);
    }
    if (amenityData.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(amenityData.is_active);
    }

    if (updates.length === 0) {
      return true;
    }

    values.push(amenityId);

    await db.execute(
      `UPDATE amenities SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return true;
  } catch (error) {
    console.error("Error updating amenity:", error);
    throw error;
  }
};

/**
 * Delete an amenity (soft delete by setting is_active = 0)
 * @param {string} amenityId - Amenity ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAmenity = async (amenityId) => {
  try {
    await db.execute("UPDATE amenities SET is_active = 0 WHERE id = ?", [
      amenityId,
    ]);
    return true;
  } catch (error) {
    console.error("Error deleting amenity:", error);
    throw error;
  }
};

/**
 * Search properties by amenities
 * @param {Array<string>} amenityIds - Array of required amenity IDs
 * @param {string} matchType - 'any' or 'all' (default: 'all')
 * @returns {Promise<Array>} Array of property IDs
 */
export const searchPropertiesByAmenities = async (
  amenityIds,
  matchType = "all"
) => {
  try {
    if (!amenityIds || amenityIds.length === 0) {
      return [];
    }

    const placeholders = amenityIds.map(() => "?").join(",");

    let query;
    if (matchType === "all") {
      // Properties must have ALL specified amenities
      query = `
        SELECT property_id
        FROM property_amenities
        WHERE amenity_id IN (${placeholders})
        GROUP BY property_id
        HAVING COUNT(DISTINCT amenity_id) = ?
      `;
      const [rows] = await db.execute(query, [
        ...amenityIds,
        amenityIds.length,
      ]);
      return rows.map((row) => row.property_id);
    } else {
      // Properties must have ANY of the specified amenities
      query = `
        SELECT DISTINCT property_id
        FROM property_amenities
        WHERE amenity_id IN (${placeholders})
      `;
      const [rows] = await db.execute(query, amenityIds);
      return rows.map((row) => row.property_id);
    }
  } catch (error) {
    console.error("Error searching properties by amenities:", error);
    throw error;
  }
};

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default {
  getAmenitiesSelectClause,
  getAmenitiesJoinClause,
  getPropertyAmenities,
  getAllAmenities,
  setPropertyAmenities,
  addPropertyAmenities,
  removePropertyAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  searchPropertiesByAmenities,
};
