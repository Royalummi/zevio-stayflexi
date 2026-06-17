/**
 * Copy differing files from Zevio -> zevio stay flexi (additive overwrite only).
 * Never deletes stayflexi-only files (CM modules stay intact).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const ZEVIO = path.resolve(ROOT, "..", "Zevio");

const APPS = ["backend", "frontend", "nextjs"];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "uploads",
  "test-results",
]);

const SKIP_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

const NEVER_OVERWRITE = [
  // CM-only backend
  /backend[\\/]migrations[\\/]0054_/,
  /backend[\\/]migrations[\\/]0055_/,
  /backend[\\/]src[\\/]controllers[\\/]channelManager/,
  /backend[\\/]src[\\/]middlewares[\\/]channelManagerAuth/,
  /backend[\\/]src[\\/]routes[\\/]channelManagerRoutes/,
  /backend[\\/]src[\\/]services[\\/]channelManagerOutboundService/,
  /backend[\\/]src[\\/]utils[\\/]xmlBuilder/,
  /backend[\\/]src[\\/]utils[\\/]xmlParser/,
  /backend[\\/]scripts[\\/].*cm/i,
  /backend[\\/]scripts[\\/].*channel-manager/i,
  /backend[\\/]scripts[\\/].*stayflexi/i,
  /backend[\\/]scripts[\\/]sync-/,
  // CM frontend
  /frontend[\\/]src[\\/]components[\\/]shared[\\/]ChannelManagerSyncLogsTable/,
  /frontend[\\/]src[\\/]pages[\\/]admin[\\/]AdminChannelManager/,
  /frontend[\\/]src[\\/]pages[\\/]vendor[\\/]VendorChannelManager/,
  // CM merge-critical shared files (patched manually after sync)
  /backend[\\/]server\.js$/,
  /backend[\\/]package\.json$/,
  /backend[\\/]src[\\/]routes[\\/]adminRoutes\.js$/,
  /backend[\\/]src[\\/]routes[\\/]vendorRoutes\.js$/,
  /backend[\\/]src[\\/]controllers[\\/]paymentController\.js$/,
  /backend[\\/]src[\\/]controllers[\\/]vendorController\.js$/,
  /backend[\\/]src[\\/]cron[\\/]jobs\.js$/,
  /frontend[\\/]src[\\/]App\.jsx$/,
  /frontend[\\/]src[\\/]components[\\/]layout[\\/]DashboardLayout\.jsx$/,
  /frontend[\\/]src[\\/]lib[\\/]utils\.js$/,
  /backend[\\/]scripts[\\/]restore-cm-hooks\.mjs$/,
];

const hashFile = (p) => {
  const buf = fs.readFileSync(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
};

const walk = (dir, base, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(base, full);
    const relPosix = rel.split(path.sep).join("/");
    if (SKIP_FILES.has(name)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, base, out);
    else out.push(relPosix);
  }
  return out;
};

let copied = 0;
let skipped = 0;
let same = 0;

for (const app of APPS) {
  const srcRoot = path.join(ZEVIO, app);
  const dstRoot = path.join(ROOT, app);
  if (!fs.existsSync(srcRoot)) continue;

  for (const rel of walk(srcRoot, srcRoot)) {
    const relNorm = `${app}/${rel}`.replace(/\\/g, "/");
    if (NEVER_OVERWRITE.some((re) => re.test(relNorm))) {
      skipped++;
      continue;
    }

    const src = path.join(srcRoot, rel);
    const dst = path.join(dstRoot, rel);
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      copied++;
      continue;
    }

    if (hashFile(src) === hashFile(dst)) {
      same++;
      continue;
    }

    fs.copyFileSync(src, dst);
    copied++;
  }
}

console.log({ copied, skipped, same, zevio: ZEVIO, target: ROOT });
