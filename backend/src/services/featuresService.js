/**
 * Features Service
 * Handles all feature-related database operations for property feature flags
 * Phase 4: Feature Flags Normalization
 */

import pool from "../config/database.js";

/**
 * Get all active features
 * @returns {Promise<Array>} Array of active features
 */
const getAllFeatures = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, key_name, description, icon, category, display_order
     FROM features
     WHERE is_active = 1
     ORDER BY display_order ASC`
  );
  return rows;
};

/**
 * Get features for a specific property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Array>} Array of features for the property
 */
const getByPropertyId = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT f.id, f.name, f.key_name, f.description, f.icon, f.category, f.display_order
     FROM features f
     INNER JOIN property_features pf ON f.id = pf.feature_id
     WHERE pf.property_id = ? AND f.is_active = 1
     ORDER BY f.display_order ASC`,
    [propertyId]
  );
  return rows;
};

/**
 * Get features as a simple array of names for a property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Array<string>>} Array of feature names
 */
const getFeatureNamesByPropertyId = async (propertyId) => {
  const features = await getByPropertyId(propertyId);
  return features.map((f) => f.name);
};

/**
 * Get features as a key-value object (useful for checking specific features)
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Object>} Object with key_name as keys and boolean values
 * @example { elevator: true, gym: true, housekeeping: false, ... }
 */
const getFeaturesFlagsForProperty = async (propertyId) => {
  const allFeatures = await getAllFeatures();
  const propertyFeatures = await getByPropertyId(propertyId);
  const propertyFeatureIds = new Set(propertyFeatures.map((f) => f.id));

  const flags = {};
  allFeatures.forEach((feature) => {
    flags[feature.key_name] = propertyFeatureIds.has(feature.id);
  });

  return flags;
};

/**
 * Add features to a property
 * @param {string} propertyId - Property UUID
 * @param {Array<number>} featureIds - Array of feature IDs to add
 * @returns {Promise<Object>} Result with count of added features
 */
const addFeaturesToProperty = async (propertyId, featureIds) => {
  if (!Array.isArray(featureIds) || featureIds.length === 0) {
    return { added: 0 };
  }

  const values = featureIds.map((featureId) => [propertyId, featureId]);

  const [result] = await pool.query(
    `INSERT IGNORE INTO property_features (property_id, feature_id) VALUES ?`,
    [values]
  );

  return { added: result.affectedRows };
};

/**
 * Remove features from a property
 * @param {string} propertyId - Property UUID
 * @param {Array<number>} featureIds - Array of feature IDs to remove
 * @returns {Promise<Object>} Result with count of removed features
 */
const removeFeaturesFromProperty = async (propertyId, featureIds) => {
  if (!Array.isArray(featureIds) || featureIds.length === 0) {
    return { removed: 0 };
  }

  const [result] = await pool.query(
    `DELETE FROM property_features 
     WHERE property_id = ? AND feature_id IN (?)`,
    [propertyId, featureIds]
  );

  return { removed: result.affectedRows };
};

/**
 * Replace all features for a property (removes old, adds new)
 * @param {string} propertyId - Property UUID
 * @param {Array<number>} featureIds - Array of feature IDs to set
 * @returns {Promise<Object>} Result with counts
 */
const replacePropertyFeatures = async (propertyId, featureIds) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Remove all existing features
    await connection.query(
      "DELETE FROM property_features WHERE property_id = ?",
      [propertyId]
    );

    // Add new features
    if (Array.isArray(featureIds) && featureIds.length > 0) {
      const values = featureIds.map((featureId) => [propertyId, featureId]);
      await connection.query(
        "INSERT INTO property_features (property_id, feature_id) VALUES ?",
        [values]
      );
    }

    await connection.commit();

    return {
      success: true,
      featureCount: featureIds ? featureIds.length : 0,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get features grouped by category
 * @returns {Promise<Object>} Features grouped by category
 */
const getFeaturesByCategory = async () => {
  const features = await getAllFeatures();

  const grouped = {
    facility: [],
    utility: [],
    service: [],
    security: [],
  };

  features.forEach((feature) => {
    if (grouped[feature.category]) {
      grouped[feature.category].push(feature);
    }
  });

  return grouped;
};

/**
 * Helper function to generate feature SELECT clause for JOINs
 * @param {string} propertyAlias - Alias for properties table (e.g., 'p')
 * @param {string} pfAlias - Alias for property_features table (e.g., 'pf')
 * @param {string} fAlias - Alias for features table (e.g., 'f')
 * @returns {string} SQL SELECT clause for features
 */
const getFeaturesSelectClause = (
  propertyAlias = "p",
  pfAlias = "pf",
  fAlias = "f"
) => {
  return `GROUP_CONCAT(DISTINCT ${fAlias}.name ORDER BY ${fAlias}.display_order SEPARATOR ', ') as features_list`;
};

/**
 * Helper function to generate feature JOIN clauses
 * @param {string} propertyAlias - Alias for properties table (e.g., 'p')
 * @param {string} pfAlias - Alias for property_features table (e.g., 'pf')
 * @param {string} fAlias - Alias for features table (e.g., 'f')
 * @returns {string} SQL JOIN clauses for features
 */
const getFeaturesJoinClause = (
  propertyAlias = "p",
  pfAlias = "pf",
  fAlias = "f"
) => {
  return `
    LEFT JOIN property_features ${pfAlias} ON ${propertyAlias}.id = ${pfAlias}.property_id
    LEFT JOIN features ${fAlias} ON ${pfAlias}.feature_id = ${fAlias}.id AND ${fAlias}.is_active = 1
  `;
};

/**
 * Search properties by features
 * @param {Array<string>} featureKeys - Array of feature key names (e.g., ['gym', 'parking'])
 * @param {string} matchType - 'all' (AND) or 'any' (OR)
 * @returns {Promise<Array>} Array of property IDs matching the criteria
 */
const searchPropertiesByFeatures = async (featureKeys, matchType = "any") => {
  if (!Array.isArray(featureKeys) || featureKeys.length === 0) {
    return [];
  }

  if (matchType === "all") {
    // Properties must have ALL specified features
    const [rows] = await pool.query(
      `SELECT pf.property_id, COUNT(DISTINCT pf.feature_id) as feature_count
       FROM property_features pf
       INNER JOIN features f ON pf.feature_id = f.id
       WHERE f.key_name IN (?) AND f.is_active = 1
       GROUP BY pf.property_id
       HAVING feature_count = ?`,
      [featureKeys, featureKeys.length]
    );
    return rows.map((row) => row.property_id);
  } else {
    // Properties must have ANY of the specified features
    const [rows] = await pool.query(
      `SELECT DISTINCT pf.property_id
       FROM property_features pf
       INNER JOIN features f ON pf.feature_id = f.id
       WHERE f.key_name IN (?) AND f.is_active = 1`,
      [featureKeys]
    );
    return rows.map((row) => row.property_id);
  }
};

export default {
  getAllFeatures,
  getByPropertyId,
  getFeatureNamesByPropertyId,
  getFeaturesFlagsForProperty,
  addFeaturesToProperty,
  removeFeaturesFromProperty,
  replacePropertyFeatures,
  getFeaturesByCategory,
  getFeaturesSelectClause,
  getFeaturesJoinClause,
  searchPropertiesByFeatures,
};
