import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sendEmail, SENDERS, ADMIN_EMAIL } from "./emailService.js";
import db from "../config/database.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates", "emails");

// ─── Template helpers ──────────────────────────────────────────────

function loadTemplate(name) {
  return readFileSync(join(TEMPLATES_DIR, name), "utf-8");
}

function renderBase(subject, subtitle, innerHtml) {
  let base = loadTemplate("base.html");
  base = base.replace(/\{\{SUBJECT\}\}/g, subject);
  base = base.replace(/\{\{HEADER_SUBTITLE\}\}/g, subtitle || "");
  base = base.replace(/\{\{CONTENT\}\}/g, innerHtml);
  base = base.replace(/\{\{YEAR\}\}/g, new Date().getFullYear().toString());
  return base;
}

function renderNotification({
  title,
  message,
  recipientName,
  badgeText,
  badgeClass,
  ctaUrl,
  ctaText,
  detailsHtml,
}) {
  let tpl = loadTemplate("notification.html");
  tpl = tpl.replace(/\{\{TITLE\}\}/g, title || "");
  tpl = tpl.replace(/\{\{MESSAGE\}\}/g, message || "");
  tpl = tpl.replace(/\{\{RECIPIENT_NAME\}\}/g, recipientName || "there");

  // Badge
  if (badgeText) {
    tpl = tpl.replace(
      /\{\{BADGE_HTML\}\}/g,
      `<p><span class="badge ${badgeClass || "badge-info"}">${badgeText}</span></p>`,
    );
  } else {
    tpl = tpl.replace(/\{\{BADGE_HTML\}\}/g, "");
  }

  // Details
  tpl = tpl.replace(/\{\{DETAILS_HTML\}\}/g, detailsHtml || "");

  // CTA
  if (ctaUrl && ctaText) {
    tpl = tpl.replace(
      /\{\{CTA_HTML\}\}/g,
      `<div class="cta-wrap"><a href="${ctaUrl}" class="cta">${ctaText}</a></div>`,
    );
  } else {
    tpl = tpl.replace(/\{\{CTA_HTML\}\}/g, "");
  }

  return tpl;
}

function renderAlert({
  title,
  message,
  recipientName,
  alertType,
  ctaUrl,
  ctaText,
  detailsHtml,
}) {
  const colorMap = {
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
  };
  let tpl = loadTemplate("alert.html");
  tpl = tpl.replace(/\{\{TITLE\}\}/g, title || "");
  tpl = tpl.replace(/\{\{MESSAGE\}\}/g, message || "");
  tpl = tpl.replace(/\{\{RECIPIENT_NAME\}\}/g, recipientName || "there");
  tpl = tpl.replace(
    /\{\{ALERT_COLOR\}\}/g,
    colorMap[alertType] || colorMap.info,
  );
  tpl = tpl.replace(/\{\{DETAILS_HTML\}\}/g, detailsHtml || "");

  if (ctaUrl && ctaText) {
    tpl = tpl.replace(
      /\{\{CTA_HTML\}\}/g,
      `<div class="cta-wrap"><a href="${ctaUrl}" class="cta">${ctaText}</a></div>`,
    );
  } else {
    tpl = tpl.replace(/\{\{CTA_HTML\}\}/g, "");
  }

  return tpl;
}

function buildDetailsCard(rows) {
  if (!rows || rows.length === 0) return "";
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`,
    )
    .join("\n");
  return `<div class="info-card">${rowsHtml}</div>`;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Send a notification email using the notification template.
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.recipientName - Greeting name
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.title - Heading inside the email
 * @param {string} opts.message - Body text
 * @param {string} [opts.subtitle] - Header subtitle
 * @param {string} [opts.badgeText] - Status badge
 * @param {string} [opts.badgeClass] - badge-success | badge-warning | badge-danger | badge-info
 * @param {string} [opts.ctaUrl] - Button URL
 * @param {string} [opts.ctaText] - Button label
 * @param {Array}  [opts.details] - Array of [label, value] pairs
 */
export async function sendNotificationEmail(opts) {
  try {
    const detailsHtml = buildDetailsCard(opts.details);
    const inner = renderNotification({ ...opts, detailsHtml });
    const html = renderBase(
      opts.subject,
      opts.subtitle || "Notification",
      inner,
    );
    await sendEmail({
      to: opts.to,
      subject: opts.subject,
      html,
      from: SENDERS.SYSTEM,
    });
    return true;
  } catch (err) {
    console.error("sendNotificationEmail failed:", err.message);
    return false;
  }
}

/**
 * Send an alert email using the alert template.
 * @param {Object} opts
 * @param {string} opts.to - Recipient email
 * @param {string} opts.recipientName - Greeting name
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.title - Heading
 * @param {string} opts.message - Body text
 * @param {string} [opts.alertType] - success | warning | danger | info
 * @param {string} [opts.ctaUrl] - Button URL
 * @param {string} [opts.ctaText] - Button label
 * @param {Array}  [opts.details] - Array of [label, value] pairs
 */
export async function sendAlertEmail(opts) {
  try {
    const detailsHtml = buildDetailsCard(opts.details);
    const inner = renderAlert({ ...opts, detailsHtml });
    const html = renderBase(opts.subject, opts.subtitle || "Alert", inner);
    await sendEmail({
      to: opts.to,
      subject: opts.subject,
      html,
      from: SENDERS.ALERTS,
    });
    return true;
  } catch (err) {
    console.error("sendAlertEmail failed:", err.message);
    return false;
  }
}

// ─── Convenience: Send to admin ────────────────────────────────────

export async function notifyAdmin({
  subject,
  title,
  message,
  details,
  ctaUrl,
  ctaText,
  badgeText,
  badgeClass,
}) {
  return sendNotificationEmail({
    to: ADMIN_EMAIL,
    recipientName: "Admin",
    subject,
    title,
    message,
    subtitle: "Admin Notification",
    badgeText,
    badgeClass,
    ctaUrl,
    ctaText,
    details,
  });
}

// ─── Convenience: Send to vendor by vendorId ───────────────────────

export async function notifyVendor(
  vendorId,
  { subject, title, message, alertType, details, ctaUrl, ctaText },
) {
  try {
    const [vendors] = await db.query(
      `SELECT v.business_name, u.email, u.full_name
       FROM vendors v
       INNER JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [vendorId],
    );
    if (!vendors.length) {
      console.error(`notifyVendor: vendor ${vendorId} not found`);
      return false;
    }
    const v = vendors[0];
    return sendAlertEmail({
      to: v.email,
      recipientName: v.full_name || v.business_name || "Partner",
      subject,
      title,
      message,
      alertType: alertType || "info",
      subtitle: "Partner Update",
      details,
      ctaUrl,
      ctaText,
    });
  } catch (err) {
    console.error("notifyVendor failed:", err.message);
    return false;
  }
}
