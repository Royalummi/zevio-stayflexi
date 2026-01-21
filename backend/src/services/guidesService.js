/**
 * Guides Service
 * Handles all property guide operations with smart template inheritance
 * Phase 7: Property Guides Normalization
 *
 * Smart Template System:
 * - Default templates (property_id = NULL) apply to ALL properties
 * - Property-specific guides override default templates
 * - When fetching: Check property-specific first, fallback to default
 */

import pool from "../config/database.js";

/**
 * Get all guide types
 * @returns {Promise<Array>} Array of guide types
 */
const getAllGuideTypes = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, description, display_order
     FROM guide_types
     WHERE is_active = 1
     ORDER BY display_order ASC`
  );
  return rows;
};

/**
 * Get guides for a specific property (with template inheritance)
 * Returns property-specific guide if exists, otherwise returns default template
 * @param {string} propertyId - Property UUID
 * @param {string} language - Language code (default 'en')
 * @returns {Promise<Array>} Array of guides for the property
 */
const getByPropertyId = async (propertyId, language = "en") => {
  const [rows] = await pool.query(
    `SELECT 
       gt.id as guide_type_id,
       gt.name as guide_type,
       gt.description as guide_description,
       COALESCE(
         (SELECT pg.title 
          FROM property_guides pg 
          WHERE pg.property_id = ? AND pg.guide_type_id = gt.id AND pg.language = ? AND pg.is_active = 1
          LIMIT 1),
         (SELECT pg.title 
          FROM property_guides pg 
          WHERE pg.is_default_template = 1 AND pg.guide_type_id = gt.id AND pg.language = ? AND pg.is_active = 1
          LIMIT 1)
       ) as title,
       COALESCE(
         (SELECT pg.content 
          FROM property_guides pg 
          WHERE pg.property_id = ? AND pg.guide_type_id = gt.id AND pg.language = ? AND pg.is_active = 1
          LIMIT 1),
         (SELECT pg.content 
          FROM property_guides pg 
          WHERE pg.is_default_template = 1 AND pg.guide_type_id = gt.id AND pg.language = ? AND pg.is_active = 1
          LIMIT 1)
       ) as content,
       CASE 
         WHEN EXISTS(SELECT 1 FROM property_guides pg WHERE pg.property_id = ? AND pg.guide_type_id = gt.id AND pg.language = ? AND pg.is_active = 1)
         THEN 'custom'
         ELSE 'default'
       END as source
     FROM guide_types gt
     WHERE gt.is_active = 1
     ORDER BY gt.display_order ASC`,
    [
      propertyId,
      language,
      language,
      propertyId,
      language,
      language,
      propertyId,
      language,
    ]
  );
  return rows;
};

/**
 * Get a specific guide for a property (with template inheritance)
 * @param {string} propertyId - Property UUID
 * @param {string} guideType - Guide type name (check_in, house_rules, etc.)
 * @param {string} language - Language code (default 'en')
 * @returns {Promise<Object|null>} Guide object or null
 */
const getByPropertyIdAndType = async (
  propertyId,
  guideType,
  language = "en"
) => {
  const [rows] = await pool.query(
    `SELECT 
       gt.name as guide_type,
       COALESCE(pg_custom.title, pg_default.title) as title,
       COALESCE(pg_custom.content, pg_default.content) as content,
       CASE 
         WHEN pg_custom.id IS NOT NULL THEN 'custom'
         ELSE 'default'
       END as source,
       COALESCE(pg_custom.version, pg_default.version) as version
     FROM guide_types gt
     LEFT JOIN property_guides pg_custom ON gt.id = pg_custom.guide_type_id 
       AND pg_custom.property_id = ? 
       AND pg_custom.language = ? 
       AND pg_custom.is_active = 1
     LEFT JOIN property_guides pg_default ON gt.id = pg_default.guide_type_id 
       AND pg_default.is_default_template = 1 
       AND pg_default.language = ? 
       AND pg_default.is_active = 1
     WHERE gt.name = ? AND gt.is_active = 1
     LIMIT 1`,
    [propertyId, language, language, guideType]
  );
  return rows[0] || null;
};

/**
 * Get all default template guides
 * @param {string} language - Language code (default 'en')
 * @returns {Promise<Array>} Array of default template guides
 */
const getAllDefaultTemplates = async (language = "en") => {
  const [rows] = await pool.query(
    `SELECT 
       gt.name as guide_type,
       pg.title,
       pg.content,
       pg.version
     FROM property_guides pg
     INNER JOIN guide_types gt ON pg.guide_type_id = gt.id
     WHERE pg.is_default_template = 1 
       AND pg.language = ? 
       AND pg.is_active = 1
     ORDER BY gt.display_order ASC`,
    [language]
  );
  return rows;
};

/**
 * Create or update a property-specific guide (override default template)
 * @param {string} propertyId - Property UUID
 * @param {string} guideType - Guide type name
 * @param {Object} guideData - Guide data (title, content, language)
 * @returns {Promise<Object>} Result of operation
 */
const createOrUpdatePropertyGuide = async (
  propertyId,
  guideType,
  guideData
) => {
  const { title, content, language = "en" } = guideData;

  // Get guide_type_id
  const [guideTypes] = await pool.query(
    `SELECT id FROM guide_types WHERE name = ? AND is_active = 1`,
    [guideType]
  );

  if (guideTypes.length === 0) {
    throw new Error(`Guide type '${guideType}' not found`);
  }

  const guideTypeId = guideTypes[0].id;

  // Check if property-specific guide already exists
  const [existing] = await pool.query(
    `SELECT id, version FROM property_guides 
     WHERE property_id = ? AND guide_type_id = ? AND language = ?`,
    [propertyId, guideTypeId, language]
  );

  if (existing.length > 0) {
    // Update existing guide
    const [result] = await pool.query(
      `UPDATE property_guides 
       SET title = ?, content = ?, version = version + 1, is_active = 1
       WHERE id = ?`,
      [title, content, existing[0].id]
    );

    return {
      action: "updated",
      guideId: existing[0].id,
      version: existing[0].version + 1,
      affectedRows: result.affectedRows,
    };
  } else {
    // Insert new property-specific guide
    const [result] = await pool.query(
      `INSERT INTO property_guides 
       (property_id, guide_type_id, title, content, language, is_default_template, version)
       VALUES (?, ?, ?, ?, ?, 0, 1)`,
      [propertyId, guideTypeId, title, content, language]
    );

    return {
      action: "created",
      guideId: result.insertId,
      version: 1,
      insertId: result.insertId,
    };
  }
};

/**
 * Update a default template guide (affects all properties using it)
 * @param {string} guideType - Guide type name
 * @param {Object} guideData - Guide data (title, content, language)
 * @returns {Promise<Object>} Result of operation
 */
const updateDefaultTemplate = async (guideType, guideData) => {
  const { title, content, language = "en" } = guideData;

  const [result] = await pool.query(
    `UPDATE property_guides pg
     INNER JOIN guide_types gt ON pg.guide_type_id = gt.id
     SET pg.title = ?, pg.content = ?, pg.version = pg.version + 1
     WHERE pg.is_default_template = 1 
       AND gt.name = ? 
       AND pg.language = ?`,
    [title, content, guideType, language]
  );

  return {
    updated: result.affectedRows > 0,
    affectedRows: result.affectedRows,
    message:
      result.affectedRows > 0
        ? `Default template updated. This will affect all properties using the default '${guideType}' guide.`
        : `No default template found for '${guideType}'`,
  };
};

/**
 * Delete a property-specific guide (revert to default template)
 * @param {string} propertyId - Property UUID
 * @param {string} guideType - Guide type name
 * @param {string} language - Language code (default 'en')
 * @returns {Promise<Object>} Result of deletion
 */
const deletePropertyGuide = async (propertyId, guideType, language = "en") => {
  const [result] = await pool.query(
    `UPDATE property_guides pg
     INNER JOIN guide_types gt ON pg.guide_type_id = gt.id
     SET pg.is_active = 0
     WHERE pg.property_id = ? 
       AND gt.name = ? 
       AND pg.language = ?
       AND pg.is_default_template = 0`,
    [propertyId, guideType, language]
  );

  return {
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows,
    message:
      result.affectedRows > 0
        ? `Property-specific guide deleted. Property will now use default template.`
        : `No property-specific guide found to delete.`,
  };
};

/**
 * Check if property has custom guides
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Object>} Summary of custom guides
 */
const getPropertyGuideSummary = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT 
       gt.name as guide_type,
       CASE 
         WHEN pg_custom.id IS NOT NULL THEN 'custom'
         WHEN pg_default.id IS NOT NULL THEN 'default'
         ELSE 'missing'
       END as status
     FROM guide_types gt
     LEFT JOIN property_guides pg_custom ON gt.id = pg_custom.guide_type_id 
       AND pg_custom.property_id = ? 
       AND pg_custom.is_active = 1
       AND pg_custom.is_default_template = 0
     LEFT JOIN property_guides pg_default ON gt.id = pg_default.guide_type_id 
       AND pg_default.is_default_template = 1 
       AND pg_default.is_active = 1
     WHERE gt.is_active = 1
     ORDER BY gt.display_order ASC`,
    [propertyId]
  );

  const summary = {
    total: rows.length,
    custom: rows.filter((r) => r.status === "custom").length,
    default: rows.filter((r) => r.status === "default").length,
    missing: rows.filter((r) => r.status === "missing").length,
    guides: rows,
  };

  return summary;
};

/**
 * Get guides SELECT clause for property queries (compact format)
 * @param {string} propertyAlias - Alias for properties table
 * @returns {string} SELECT clause
 */
const getGuidesSelectClause = (propertyAlias = "p") => {
  return `
    (SELECT COUNT(*) FROM property_guides pg 
     WHERE pg.property_id = ${propertyAlias}.id AND pg.is_default_template = 0 AND pg.is_active = 1) as custom_guides_count,
    (SELECT GROUP_CONCAT(gt.name SEPARATOR ',')
     FROM property_guides pg
     INNER JOIN guide_types gt ON pg.guide_type_id = gt.id
     WHERE pg.property_id = ${propertyAlias}.id AND pg.is_default_template = 0 AND pg.is_active = 1) as custom_guide_types
  `.trim();
};

/**
 * Clone guides from one property to another
 * @param {string} sourcePropertyId - Source property UUID
 * @param {string} targetPropertyId - Target property UUID
 * @returns {Promise<Object>} Result of cloning
 */
const clonePropertyGuides = async (sourcePropertyId, targetPropertyId) => {
  const [result] = await pool.query(
    `INSERT INTO property_guides 
     (property_id, guide_type_id, title, content, language, is_default_template, version)
     SELECT ?, guide_type_id, title, content, language, 0, 1
     FROM property_guides
     WHERE property_id = ? AND is_default_template = 0 AND is_active = 1`,
    [targetPropertyId, sourcePropertyId]
  );

  return {
    cloned: result.affectedRows,
    insertId: result.insertId,
  };
};

export default {
  getAllGuideTypes,
  getByPropertyId,
  getByPropertyIdAndType,
  getAllDefaultTemplates,
  createOrUpdatePropertyGuide,
  updateDefaultTemplate,
  deletePropertyGuide,
  getPropertyGuideSummary,
  getGuidesSelectClause,
  clonePropertyGuides,
};
