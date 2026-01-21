/**
 * Property Pricing Service
 * Handles all pricing-related database queries after Phase 1 normalization
 * Date: January 18, 2026
 */

import db from "../config/database.js";

/**
 * Get pricing SELECT clause with table alias
 * @param {string} alias - Table alias for property_pricing (default: 'pr')
 * @returns {string} SQL SELECT clause for pricing fields
 */
export const getPricingSelectClause = (alias = "pr") => {
  return `
    ${alias}.price_per_night,
    ${alias}.gst_percentage,
    ${alias}.min_guests,
    ${alias}.extra_guest_charge,
    ${alias}.min_children,
    ${alias}.max_children,
    ${alias}.extra_child_charge,
    ${alias}.weekly_discount_percent,
    ${alias}.monthly_discount_percent,
    ${alias}.quarterly_discount_percent,
    ${alias}.long_term_discount_percent,
    ${alias}.allow_corporate_booking,
    ${alias}.corporate_discount_percent,
    ${alias}.deposit_amount,
    ${alias}.maintenance_charges,
    ${alias}.notice_period_days
  `;
};

/**
 * Get pricing JOIN clause
 * @param {string} propertyAlias - Property table alias (default: 'p')
 * @param {string} pricingAlias - Pricing table alias (default: 'pr')
 * @returns {string} SQL JOIN clause
 */
export const getPricingJoinClause = (
  propertyAlias = "p",
  pricingAlias = "pr"
) => {
  return `LEFT JOIN property_pricing ${pricingAlias} ON ${propertyAlias}.id = ${pricingAlias}.property_id`;
};

/**
 * Get pricing data for a single property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Pricing data
 */
export const getPropertyPricing = async (propertyId) => {
  const [rows] = await db.query(
    `SELECT 
      price_per_night,
      gst_percentage,
      min_guests,
      extra_guest_charge,
      min_children,
      max_children,
      extra_child_charge,
      weekly_discount_percent,
      monthly_discount_percent,
      quarterly_discount_percent,
      long_term_discount_percent,
      allow_corporate_booking,
      corporate_discount_percent,
      deposit_amount,
      maintenance_charges,
      notice_period_days
    FROM property_pricing 
    WHERE property_id = ?`,
    [propertyId]
  );

  return rows[0] || null;
};

/**
 * Update pricing for a property
 * @param {string} propertyId - Property ID
 * @param {Object} pricingData - Pricing data to update
 * @returns {Promise<boolean>} Success status
 */
export const updatePropertyPricing = async (propertyId, pricingData) => {
  const allowedFields = [
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

  const updates = [];
  const values = [];

  Object.keys(pricingData).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(pricingData[key]);
    }
  });

  if (updates.length === 0) {
    return false;
  }

  values.push(propertyId);

  const [result] = await db.query(
    `UPDATE property_pricing SET ${updates.join(", ")} WHERE property_id = ?`,
    values
  );

  return result.affectedRows > 0;
};

/**
 * Create pricing entry for new property
 * @param {string} propertyId - Property ID
 * @param {Object} pricingData - Pricing data
 * @returns {Promise<string>} Pricing ID
 */
export const createPropertyPricing = async (propertyId, pricingData) => {
  const { v4: uuidv4 } = await import("uuid");
  const id = uuidv4();

  const defaults = {
    price_per_night: 0.0,
    gst_percentage: 18.0,
    min_guests: 1,
    extra_guest_charge: 0.0,
    min_children: 0,
    max_children: 5,
    extra_child_charge: 0.0,
    weekly_discount_percent: 15.0,
    monthly_discount_percent: 25.0,
    quarterly_discount_percent: 30.0,
    long_term_discount_percent: 35.0,
    allow_corporate_booking: 0,
    corporate_discount_percent: 20,
    deposit_amount: null,
    maintenance_charges: 0.0,
    notice_period_days: 30,
  };

  const data = { ...defaults, ...pricingData };

  await db.query(
    `INSERT INTO property_pricing (
      id, property_id, price_per_night, gst_percentage, min_guests, extra_guest_charge,
      min_children, max_children, extra_child_charge, weekly_discount_percent,
      monthly_discount_percent, quarterly_discount_percent, long_term_discount_percent,
      allow_corporate_booking, corporate_discount_percent, deposit_amount,
      maintenance_charges, notice_period_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      propertyId,
      data.price_per_night,
      data.gst_percentage,
      data.min_guests,
      data.extra_guest_charge,
      data.min_children,
      data.max_children,
      data.extra_child_charge,
      data.weekly_discount_percent,
      data.monthly_discount_percent,
      data.quarterly_discount_percent,
      data.long_term_discount_percent,
      data.allow_corporate_booking,
      data.corporate_discount_percent,
      data.deposit_amount,
      data.maintenance_charges,
      data.notice_period_days,
    ]
  );

  return id;
};

/**
 * Delete pricing entry for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<boolean>} Success status
 */
export const deletePropertyPricing = async (propertyId) => {
  const [result] = await db.query(
    `DELETE FROM property_pricing WHERE property_id = ?`,
    [propertyId]
  );

  return result.affectedRows > 0;
};

export default {
  getPricingSelectClause,
  getPricingJoinClause,
  getPropertyPricing,
  updatePropertyPricing,
  createPropertyPricing,
  deletePropertyPricing,
};
