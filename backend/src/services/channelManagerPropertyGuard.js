import db from "../config/database.js";
import { sendError } from "../utils/response.js";

export const isStayflexiManagedProperty = async (propertyId) => {
  const [rows] = await db.query(
    `SELECT m.id
     FROM channel_manager_property_mappings m
     INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
     WHERE m.property_id = ?
       AND m.is_active = 1
       AND i.provider_key = 'stayflexi'
       AND i.deleted_at IS NULL
       AND i.status IN ('active', 'test')
     LIMIT 1`,
    [propertyId],
  );

  return rows.length > 0;
};

export const STAYFLEXI_PRICING_LOCK_MESSAGE =
  "Calendar pricing is managed by Stayflexi for this property. Deactivate the channel manager mapping to edit manually.";

export const STAYFLEXI_BLOCKING_LOCK_MESSAGE =
  "Date blocking is managed by Stayflexi for this property. Deactivate the channel manager mapping to edit manually.";

export const enforceStayflexiManagedLock = async (
  res,
  propertyId,
  message,
) => {
  if (await isStayflexiManagedProperty(propertyId)) {
    sendError(res, message, 409);
    return true;
  }

  return false;
};
