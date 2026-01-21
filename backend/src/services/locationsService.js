/**
 * Locations Service
 * Handles all location proximity operations for properties
 * Phase 6: Location Proximity Normalization
 */

import pool from "../config/database.js";

/**
 * Get all location types
 * @returns {Promise<Array>} Array of location types
 */
const getAllLocationTypes = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, icon, category, display_order
     FROM location_types
     WHERE is_active = 1
     ORDER BY display_order ASC`
  );
  return rows;
};

/**
 * Get locations for a specific property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Array>} Array of locations for the property
 */
const getByPropertyId = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT 
       pl.id,
       pl.property_id,
       lt.name as location_type,
       lt.icon,
       lt.category,
       pl.name as location_name,
       pl.distance_km,
       pl.travel_time_mins
     FROM property_locations pl
     INNER JOIN location_types lt ON pl.location_type_id = lt.id
     WHERE pl.property_id = ? AND pl.is_active = 1
     ORDER BY lt.display_order ASC, pl.distance_km ASC`,
    [propertyId]
  );
  return rows;
};

/**
 * Get locations by type for a property
 * @param {string} propertyId - Property UUID
 * @param {string} locationType - Location type name (metro, airport, etc.)
 * @returns {Promise<Array>} Array of locations
 */
const getByPropertyIdAndType = async (propertyId, locationType) => {
  const [rows] = await pool.query(
    `SELECT 
       pl.id,
       pl.name as location_name,
       pl.distance_km,
       pl.travel_time_mins
     FROM property_locations pl
     INNER JOIN location_types lt ON pl.location_type_id = lt.id
     WHERE pl.property_id = ? AND lt.name = ? AND pl.is_active = 1
     ORDER BY pl.distance_km ASC`,
    [propertyId, locationType]
  );
  return rows;
};

/**
 * Get nearest location of a specific type
 * @param {string} propertyId - Property UUID
 * @param {string} locationType - Location type name
 * @returns {Promise<Object|null>} Nearest location or null
 */
const getNearestByType = async (propertyId, locationType) => {
  const [rows] = await pool.query(
    `SELECT 
       pl.name as location_name,
       pl.distance_km,
       pl.travel_time_mins
     FROM property_locations pl
     INNER JOIN location_types lt ON pl.location_type_id = lt.id
     WHERE pl.property_id = ? AND lt.name = ? AND pl.is_active = 1
     ORDER BY pl.distance_km ASC
     LIMIT 1`,
    [propertyId, locationType]
  );
  return rows[0] || null;
};

/**
 * Add locations to a property
 * @param {string} propertyId - Property UUID
 * @param {Array} locations - Array of location objects
 * @returns {Promise<Object>} Result of insertion
 */
const addLocationsToProperty = async (propertyId, locations) => {
  const values = locations.map((l) => [
    propertyId,
    l.location_type_id,
    l.name,
    l.distance_km || null,
    l.travel_time_mins || null,
  ]);

  const [result] = await pool.query(
    `INSERT INTO property_locations 
     (property_id, location_type_id, name, distance_km, travel_time_mins)
     VALUES ?`,
    [values]
  );

  return {
    inserted: result.affectedRows,
    insertId: result.insertId,
  };
};

/**
 * Update a property location
 * @param {number} locationId - Location ID
 * @param {Object} locationData - Location data to update
 * @returns {Promise<Object>} Result of update
 */
const updateLocation = async (locationId, locationData) => {
  const [result] = await pool.query(
    `UPDATE property_locations 
     SET name = ?, distance_km = ?, travel_time_mins = ?
     WHERE id = ?`,
    [
      locationData.name,
      locationData.distance_km || null,
      locationData.travel_time_mins || null,
      locationId,
    ]
  );

  return {
    updated: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};

/**
 * Delete a property location (soft delete)
 * @param {number} locationId - Location ID
 * @returns {Promise<Object>} Result of deletion
 */
const deleteLocation = async (locationId) => {
  const [result] = await pool.query(
    `UPDATE property_locations SET is_active = 0 WHERE id = ?`,
    [locationId]
  );

  return {
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};

/**
 * Get locations SELECT clause for property queries
 * @param {string} propertyAlias - Alias for properties table
 * @param {string} plAlias - Alias for property_locations table
 * @param {string} ltAlias - Alias for location_types table
 * @returns {string} SELECT clause
 */
const getLocationsSelectClause = (
  propertyAlias = "p",
  plAlias = "pl",
  ltAlias = "lt"
) => {
  return `
    GROUP_CONCAT(DISTINCT CONCAT(${ltAlias}.name, ':', ${plAlias}.name, '|', IFNULL(${plAlias}.distance_km, 'N/A'), 'km') SEPARATOR '; ') as locations_list,
    (SELECT ${plAlias}.distance_km FROM property_locations ${plAlias}
     INNER JOIN location_types ${ltAlias} ON ${plAlias}.location_type_id = ${ltAlias}.id
     WHERE ${plAlias}.property_id = ${propertyAlias}.id AND ${ltAlias}.name = 'metro' AND ${plAlias}.is_active = 1
     ORDER BY ${plAlias}.distance_km ASC LIMIT 1) as nearest_metro_km,
    (SELECT ${plAlias}.name FROM property_locations ${plAlias}
     INNER JOIN location_types ${ltAlias} ON ${plAlias}.location_type_id = ${ltAlias}.id
     WHERE ${plAlias}.property_id = ${propertyAlias}.id AND ${ltAlias}.name = 'metro' AND ${plAlias}.is_active = 1
     ORDER BY ${plAlias}.distance_km ASC LIMIT 1) as nearest_metro_name
  `.trim();
};

/**
 * Get locations JOIN clause for property queries
 * @param {string} propertyAlias - Alias for properties table
 * @param {string} plAlias - Alias for property_locations table
 * @param {string} ltAlias - Alias for location_types table
 * @returns {string} JOIN clause
 */
const getLocationsJoinClause = (
  propertyAlias = "p",
  plAlias = "pl",
  ltAlias = "lt"
) => {
  return `
    LEFT JOIN property_locations ${plAlias} ON ${propertyAlias}.id = ${plAlias}.property_id AND ${plAlias}.is_active = 1
    LEFT JOIN location_types ${ltAlias} ON ${plAlias}.location_type_id = ${ltAlias}.id AND ${ltAlias}.is_active = 1
  `.trim();
};

/**
 * Search properties near a specific location type within distance
 * @param {string} locationType - Location type name
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @returns {Promise<Array>} Array of property IDs
 */
const searchPropertiesNearLocation = async (locationType, maxDistanceKm) => {
  const [rows] = await pool.query(
    `SELECT DISTINCT pl.property_id, pl.distance_km
     FROM property_locations pl
     INNER JOIN location_types lt ON pl.location_type_id = lt.id
     WHERE lt.name = ? 
       AND pl.distance_km <= ? 
       AND pl.is_active = 1
     ORDER BY pl.distance_km ASC`,
    [locationType, maxDistanceKm]
  );
  return rows;
};

/**
 * Get locations grouped by category for a property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Object>} Locations grouped by category
 */
const getLocationsByCategory = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT 
       lt.category,
       lt.name as location_type,
       pl.name as location_name,
       pl.distance_km,
       pl.travel_time_mins
     FROM property_locations pl
     INNER JOIN location_types lt ON pl.location_type_id = lt.id
     WHERE pl.property_id = ? AND pl.is_active = 1
     ORDER BY lt.category, lt.display_order, pl.distance_km`,
    [propertyId]
  );

  // Group by category
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.category]) {
      grouped[row.category] = [];
    }
    grouped[row.category].push({
      location_type: row.location_type,
      location_name: row.location_name,
      distance_km: row.distance_km,
      travel_time_mins: row.travel_time_mins,
    });
  });

  return grouped;
};

export default {
  getAllLocationTypes,
  getByPropertyId,
  getByPropertyIdAndType,
  getNearestByType,
  addLocationsToProperty,
  updateLocation,
  deleteLocation,
  getLocationsSelectClause,
  getLocationsJoinClause,
  searchPropertiesNearLocation,
  getLocationsByCategory,
};
