import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { retryFailedChannelManagerOutboundEvents } from "../src/services/channelManagerOutboundService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const summary = await retryFailedChannelManagerOutboundEvents({
  limit: 20,
  lookbackHours: 24,
});

console.log("Retry summary:", summary);
process.exit(0);
