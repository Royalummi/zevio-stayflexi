import express from "express";
import { authenticateChannelManagerRequest } from "../middlewares/channelManagerAuth.js";
import { receiveProviderWebhook } from "../controllers/channelManagerController.js";

const router = express.Router();

const xmlBodyParser = express.text({
  type: ["application/xml", "text/xml", "application/*+xml"],
});

const bindExpectedOperation = (expectedOperation) => (req, _res, next) => {
  req.cmExpectedOperation = expectedOperation;
  next();
};

/**
 * Stayflexi OTA doc: each inbound operation has its own URL (consumer-supplied).
 * Paths are provider-scoped so additional channel managers can reuse the pattern.
 */
const STAYFLEXI_OPERATION_ROUTES = [
  ["inventory/update", "update_inventory"],
  ["inventory/get", "get_inventory"],
  ["rates/update", "update_rates"],
  ["rates/get", "get_rates"],
  ["restrictions/update", "update_restriction"],
  ["restrictions/get", "get_restriction"],
  ["hotel/detail", "get_hotel_detail"],
];

for (const [pathSuffix, operation] of STAYFLEXI_OPERATION_ROUTES) {
  router.post(
    `/:providerKey/${pathSuffix}`,
    xmlBodyParser,
    authenticateChannelManagerRequest,
    bindExpectedOperation(operation),
    receiveProviderWebhook,
  );
}

export default router;
