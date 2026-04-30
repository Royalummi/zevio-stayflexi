/**
 * Contacts Service
 * Handles all contact-related database operations for property contacts
 * Phase 5: Contact Information Normalization
 */

import pool from "../config/database.js";

/**
 * Get all contact types
 * @returns {Promise<Array>} Array of contact types
 */
const getAllContactTypes = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, description, display_order
     FROM contact_types
     WHERE is_active = 1
     ORDER BY display_order ASC`
  );
  return rows;
};

/**
 * Get contacts for a specific property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Array>} Array of contacts for the property
 */
const getByPropertyId = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT 
       pc.id,
       pc.property_id,
       ct.name as contact_type,
       pc.name,
       pc.phone,
       pc.email,
       pc.whatsapp,
       pc.alt_contact,
       pc.is_active
     FROM property_contacts pc
     INNER JOIN contact_types ct ON pc.contact_type_id = ct.id
     WHERE pc.property_id = ? AND pc.is_active = 1
     ORDER BY ct.display_order ASC`,
    [propertyId]
  );
  return rows;
};

/**
 * Get primary contact for a property
 * @param {string} propertyId - Property UUID
 * @returns {Promise<Object|null>} Primary contact or null
 */
const getPrimaryContact = async (propertyId) => {
  const [rows] = await pool.query(
    `SELECT 
       pc.name,
       pc.phone,
       pc.email,
       pc.whatsapp,
       pc.alt_contact
     FROM property_contacts pc
     INNER JOIN contact_types ct ON pc.contact_type_id = ct.id
     WHERE pc.property_id = ? AND ct.name = 'primary' AND pc.is_active = 1
     LIMIT 1`,
    [propertyId]
  );
  return rows[0] || null;
};

/**
 * Add contacts to a property
 * @param {string} propertyId - Property UUID
 * @param {Array} contacts - Array of contact objects
 * @returns {Promise<Object>} Result of insertion
 */
const addContactsToProperty = async (propertyId, contacts) => {
  const values = contacts.map((c) => [
    propertyId,
    c.contact_type_id,
    c.name,
    c.phone,
    c.email,
    c.whatsapp || null,
    c.alt_contact || null,
  ]);

  const [result] = await pool.query(
    `INSERT INTO property_contacts 
     (property_id, contact_type_id, name, phone, email, whatsapp, alt_contact)
     VALUES ?`,
    [values]
  );

  return {
    inserted: result.affectedRows,
    insertId: result.insertId,
  };
};

/**
 * Update a property contact
 * @param {number} contactId - Contact ID
 * @param {Object} contactData - Contact data to update
 * @returns {Promise<Object>} Result of update
 */
const updateContact = async (contactId, contactData) => {
  const [result] = await pool.query(
    `UPDATE property_contacts 
     SET name = ?, phone = ?, email = ?, whatsapp = ?, alt_contact = ?
     WHERE id = ?`,
    [
      contactData.name,
      contactData.phone,
      contactData.email,
      contactData.whatsapp || null,
      contactData.alt_contact || null,
      contactId,
    ]
  );

  return {
    updated: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};

/**
 * Delete a property contact (soft delete)
 * @param {number} contactId - Contact ID
 * @returns {Promise<Object>} Result of deletion
 */
const deleteContact = async (contactId) => {
  const [result] = await pool.query(
    `UPDATE property_contacts SET is_active = 0 WHERE id = ?`,
    [contactId]
  );

  return {
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows,
  };
};

/**
 * Get contacts SELECT clause for property queries
 * @param {string} propertyAlias - Alias for properties table
 * @param {string} pcAlias - Alias for property_contacts table
 * @param {string} ctAlias - Alias for contact_types table
 * @returns {string} SELECT clause
 */
const getContactsSelectClause = (
  propertyAlias = "p",
  pcAlias = "pc",
  ctAlias = "ct"
) => {
  return `GROUP_CONCAT(DISTINCT CONCAT(${ctAlias}.name, ':', ${pcAlias}.name, '|', ${pcAlias}.phone) SEPARATOR '; ') as contacts_list`;
};

/**
 * Get contacts JOIN clause for property queries
 * @param {string} propertyAlias - Alias for properties table
 * @param {string} pcAlias - Alias for property_contacts table
 * @param {string} ctAlias - Alias for contact_types table
 * @returns {string} JOIN clause
 */
const getContactsJoinClause = (
  propertyAlias = "p",
  pcAlias = "pc",
  ctAlias = "ct"
) => {
  return `
    LEFT JOIN property_contacts ${pcAlias} ON ${propertyAlias}.id = ${pcAlias}.property_id AND ${pcAlias}.is_active = 1
    LEFT JOIN contact_types ${ctAlias} ON ${pcAlias}.contact_type_id = ${ctAlias}.id AND ${ctAlias}.is_active = 1
  `.trim();
};

/**
 * Search properties by contact type
 * @param {string} contactType - Contact type name
 * @returns {Promise<Array>} Array of property IDs
 */
const searchPropertiesByContactType = async (contactType) => {
  const [rows] = await pool.query(
    `SELECT DISTINCT pc.property_id
     FROM property_contacts pc
     INNER JOIN contact_types ct ON pc.contact_type_id = ct.id
     WHERE ct.name = ? AND pc.is_active = 1`,
    [contactType]
  );
  return rows.map((r) => r.property_id);
};

export default {
  getAllContactTypes,
  getByPropertyId,
  getPrimaryContact,
  addContactsToProperty,
  updateContact,
  deleteContact,
  getContactsSelectClause,
  getContactsJoinClause,
  searchPropertiesByContactType,
};
