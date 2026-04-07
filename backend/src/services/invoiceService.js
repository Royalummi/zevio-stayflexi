import PDFDocument from "pdfkit";
import db from "../config/database.js";

// ─── Brand Colors ──────────────────────────────────────────────────
const COLORS = {
  navy: "#1F3A5F",
  navyLight: "#2d4f7d",
  navyDark: "#152844",
  teal: "#2FA4A9",
  tealDark: "#248d92",
  greyLight: "#E6E9EE",
  white: "#FFFFFF",
  textDark: "#5F6B7A",
  border: "#D1D7DF",
  black: "#1a1a1a",
  success: "#16a34a",
  danger: "#dc2626",
};

// ─── Helper: Draw a horizontal line ────────────────────────────────
const drawLine = (doc, y, opts = {}) => {
  const x1 = opts.x1 || 40;
  const x2 = opts.x2 || 555;
  doc
    .strokeColor(opts.color || COLORS.border)
    .lineWidth(opts.width || 0.5)
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke();
};

// ─── Helper: Rounded rectangle ─────────────────────────────────────
const drawRoundedRect = (doc, x, y, w, h, r, fillColor) => {
  doc.roundedRect(x, y, w, h, r).fill(fillColor);
};

// ─── Helper: Format currency ───────────────────────────────────────
const formatCurrency = (amount) => {
  const num = parseFloat(amount || 0);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── Helper: Format date ───────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Helper: Safe JSON parse ───────────────────────────────────────
const safeJsonParse = (str, fallback = {}) => {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// ─── Fetch full booking data for invoice ───────────────────────────
export const fetchInvoiceData = async (bookingId) => {
  const [bookings] = await db.query(
    `SELECT 
      b.*,
      u.full_name, u.email, u.phone as user_phone,
      p.title as property_title,
      p.address as property_address,
      p.area as property_area,
      p.state as property_state,
      p.pincode as property_pincode,
      p.cancellation_policy,
      p.check_in_time,
      p.check_out_time,
      c.name as city_name,
      c.state as city_state,
      pt.name as property_type_name,
      pp.gst_percentage
    FROM bookings b
    INNER JOIN users u ON b.user_id = u.id
    INNER JOIN properties p ON b.property_id = p.id
    INNER JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN property_pricing pp ON p.id = pp.property_id
    WHERE b.id = ?`,
    [bookingId],
  );

  if (bookings.length === 0) {
    throw new Error("Booking not found");
  }

  // Get invoice number
  const [invoices] = await db.query(
    "SELECT invoice_number FROM invoices WHERE booking_id = ?",
    [bookingId],
  );

  const booking = bookings[0];
  booking.invoice_number =
    invoices.length > 0 ? invoices[0].invoice_number : null;

  return booking;
};

// ─── Generate Invoice PDF ──────────────────────────────────────────
export const generateInvoicePDF = async (bookingId) => {
  const booking = await fetchInvoiceData(bookingId);
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const pdfReady = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Page dimensions
  const pageW = 595.28;
  const marginX = 40;
  const contentW = pageW - marginX * 2;

  let y = 0;

  // ═══════════════════════════════════════════════════════════════
  // HEADER - Navy background with ZEVIO branding
  // ═══════════════════════════════════════════════════════════════
  doc.rect(0, 0, pageW, 80).fill(COLORS.navy);

  // ZEVIO text
  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(COLORS.white)
    .text("ZEVIO", marginX, 25, { width: 200 });

  // INVOICE label on right
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.teal)
    .text("BOOKING INVOICE", pageW - marginX - 200, 22, {
      width: 200,
      align: "right",
    });

  // Invoice number
  const invoiceNum = booking.invoice_number
    ? `INV-${String(booking.invoice_number).padStart(6, "0")}`
    : `INV-${booking.id.substring(0, 8).toUpperCase()}`;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.greyLight)
    .text(invoiceNum, pageW - marginX - 200, 40, {
      width: 200,
      align: "right",
    });

  // Date
  doc.text(
    `Date: ${formatDate(booking.created_at)}`,
    pageW - marginX - 200,
    54,
    {
      width: 200,
      align: "right",
    },
  );

  y = 95;

  // ═══════════════════════════════════════════════════════════════
  // BOOKING CONFIRMED BANNER - Teal accent
  // ═══════════════════════════════════════════════════════════════
  drawRoundedRect(doc, marginX, y, contentW, 42, 6, COLORS.teal);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.white)
    .text("Booking Confirmed", marginX + 16, y + 8, { width: contentW - 32 });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(
      "Thank you for your booking! Your reservation has been confirmed.",
      marginX + 16,
      y + 26,
      { width: contentW - 32 },
    );

  y += 58;

  // ═══════════════════════════════════════════════════════════════
  // GUEST INFORMATION & BOOKING INFO - Two columns
  // ═══════════════════════════════════════════════════════════════
  const colW = contentW / 2;

  // Section header
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text("GUEST INFORMATION", marginX, y);

  doc.text("BOOKING DETAILS", marginX + colW, y);

  y += 16;
  drawLine(doc, y, { color: COLORS.teal, width: 1.5 });
  y += 8;

  // Guest info - left column
  const guestFields = [
    ["Guest Name", booking.full_name || "N/A"],
    ["Email", booking.email || "N/A"],
    ["Phone", booking.user_phone || "N/A"],
  ];

  // Booking info - right column
  const bookingFields = [
    ["Booking ID", booking.id.substring(0, 8).toUpperCase()],
    [
      "Payment Mode",
      booking.payment_status === "completed" ? "Online (Cashfree)" : "Pending",
    ],
    [
      "Status",
      booking.status === "confirmed"
        ? "Confirmed"
        : booking.status
            ?.replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
    ],
  ];

  const fieldH = 16;
  guestFields.forEach(([label, value], i) => {
    const fy = y + i * fieldH;
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.textDark)
      .text(`${label}:`, marginX, fy, { width: 80 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.black)
      .text(value, marginX + 82, fy, { width: colW - 90 });
  });

  bookingFields.forEach(([label, value], i) => {
    const fy = y + i * fieldH;
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.textDark)
      .text(`${label}:`, marginX + colW, fy, { width: 90 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.black)
      .text(value, marginX + colW + 92, fy, { width: colW - 100 });
  });

  y += fieldH * 3 + 10;

  // ═══════════════════════════════════════════════════════════════
  // STAY DETAILS - Check-in / Check-out / Guests
  // ═══════════════════════════════════════════════════════════════
  drawRoundedRect(doc, marginX, y, contentW, 60, 6, COLORS.greyLight);

  const stayBoxW = contentW / 4;

  const stayItems = [
    ["CHECK-IN", formatDate(booking.check_in)],
    ["CHECK-OUT", formatDate(booking.check_out)],
    ["NIGHTS", `${booking.nights || 0}`],
    [
      "GUESTS",
      `${booking.guest_count || 0} Adults${booking.children_count > 0 ? `, ${booking.children_count} Children` : ""}${booking.infants_count > 0 ? `, ${booking.infants_count} Infants` : ""}`,
    ],
  ];

  stayItems.forEach(([label, value], i) => {
    const bx = marginX + i * stayBoxW + 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(COLORS.textDark)
      .text(label, bx, y + 12, { width: stayBoxW - 24 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text(value, bx, y + 26, { width: stayBoxW - 24 });
  });

  y += 74;

  // ═══════════════════════════════════════════════════════════════
  // PROPERTY DETAILS & PRICE BREAKDOWN - Two column layout
  // ═══════════════════════════════════════════════════════════════
  const leftColW = contentW * 0.48;
  const rightColW = contentW * 0.48;
  const gapW = contentW * 0.04;

  // --- Left Column: Property Details ---
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text("PROPERTY DETAILS", marginX, y);

  doc.text("PRICE BREAKDOWN", marginX + leftColW + gapW, y);

  y += 16;
  drawLine(doc, y, { color: COLORS.teal, width: 1.5 });
  y += 8;

  const propY = y;

  // Property title
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.black)
    .text(booking.property_title || "N/A", marginX, y, { width: leftColW });

  y +=
    doc.heightOfString(booking.property_title || "N/A", { width: leftColW }) +
    6;

  // Property type
  if (booking.property_type_name) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.teal)
      .text(booking.property_type_name, marginX, y, { width: leftColW });
    y += 14;
  }

  // Location
  const locationParts = [
    booking.property_area,
    booking.city_name,
    booking.property_state || booking.city_state,
    booking.property_pincode,
  ].filter(Boolean);

  if (locationParts.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.textDark)
      .text(locationParts.join(", "), marginX, y, { width: leftColW });
    y += doc.heightOfString(locationParts.join(", "), { width: leftColW }) + 8;
  }

  // Check-in/out times
  if (booking.check_in_time || booking.check_out_time) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.textDark)
      .text("Check-in Time:", marginX, y, { width: 80 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.black)
      .text(booking.check_in_time || "2:00 PM", marginX + 82, y);
    y += 14;
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.textDark)
      .text("Check-out Time:", marginX, y, { width: 80 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.black)
      .text(booking.check_out_time || "11:00 AM", marginX + 82, y);
    y += 14;
  }

  // --- Right Column: Price Breakdown ---
  let priceY = propY;
  const priceX = marginX + leftColW + gapW;
  const priceValX = priceX + rightColW - 90;

  // Price line items
  const priceItems = [];

  // Base amount
  priceItems.push({
    label: `Base Amount (${booking.nights || 0} night${(booking.nights || 0) !== 1 ? "s" : ""})`,
    value: formatCurrency(booking.base_amount),
    bold: false,
  });

  // Extra guest charges
  if (parseFloat(booking.extra_guest_charges || 0) > 0) {
    priceItems.push({
      label: "Extra Guest Charges",
      value: formatCurrency(booking.extra_guest_charges),
      bold: false,
    });
  }

  // Extra children charges
  if (parseFloat(booking.extra_children_charges || 0) > 0) {
    priceItems.push({
      label: "Extra Children Charges",
      value: formatCurrency(booking.extra_children_charges),
      bold: false,
    });
  }

  // Service charge
  if (parseFloat(booking.service_charge || 0) > 0) {
    priceItems.push({
      label: "Service Charge (5%)",
      value: formatCurrency(booking.service_charge),
      bold: false,
    });
  }

  // GST
  const gstPct = booking.gst_percentage || 18;
  priceItems.push({
    label: `GST (${gstPct}%)`,
    value: formatCurrency(booking.gst_amount),
    bold: false,
  });

  // Coupon discount
  if (parseFloat(booking.coupon_discount || 0) > 0) {
    priceItems.push({
      label: `Coupon Discount${booking.coupon_code ? ` (${booking.coupon_code})` : ""}`,
      value: `-${formatCurrency(booking.coupon_discount)}`,
      bold: false,
      color: COLORS.success,
    });
  }

  // Other discount
  if (
    parseFloat(booking.discount_amount || 0) > 0 &&
    parseFloat(booking.coupon_discount || 0) === 0
  ) {
    priceItems.push({
      label: "Discount",
      value: `-${formatCurrency(booking.discount_amount)}`,
      bold: false,
      color: COLORS.success,
    });
  }

  // Render price items
  priceItems.forEach((item) => {
    doc
      .font(item.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor(item.color || COLORS.textDark)
      .text(item.label, priceX, priceY, { width: rightColW - 95 });

    doc
      .font(item.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor(item.color || COLORS.black)
      .text(item.value, priceValX, priceY, { width: 85, align: "right" });

    priceY += 18;
  });

  // Separator before total
  priceY += 4;
  drawLine(doc, priceY, {
    x1: priceX,
    x2: priceX + rightColW,
    color: COLORS.navy,
    width: 1,
  });
  priceY += 10;

  // Total amount - prominent
  drawRoundedRect(doc, priceX, priceY, rightColW, 30, 4, COLORS.navy);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.white)
    .text("TOTAL AMOUNT", priceX + 12, priceY + 9, { width: rightColW - 120 });
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.white)
    .text(formatCurrency(booking.total_amount), priceValX - 10, priceY + 8, {
      width: 95,
      align: "right",
    });

  priceY += 36;

  // Payment status badge
  const isPaid = booking.payment_status === "completed";
  const badgeColor = isPaid ? COLORS.success : COLORS.danger;
  const badgeText = isPaid ? "PAID" : "PAYMENT PENDING";

  drawRoundedRect(doc, priceX, priceY, 80, 20, 4, badgeColor);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.white)
    .text(badgeText, priceX, priceY + 6, { width: 80, align: "center" });

  // Use whichever column is taller
  y = Math.max(y, priceY + 36) + 12;

  // ═══════════════════════════════════════════════════════════════
  // CANCELLATION POLICY
  // ═══════════════════════════════════════════════════════════════
  const cancellation = safeJsonParse(booking.cancellation_policy, null);

  if (cancellation) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text("CANCELLATION POLICY", marginX, y);

    y += 16;
    drawLine(doc, y, { color: COLORS.teal, width: 1.5 });
    y += 8;

    drawRoundedRect(doc, marginX, y, contentW, 0, 6, COLORS.greyLight); // placeholder, will resize

    const policyLines = [];
    if (cancellation.policy_type)
      policyLines.push(`Policy Type: ${cancellation.policy_type}`);
    if (cancellation.free_cancellation_text)
      policyLines.push(`• ${cancellation.free_cancellation_text}`);
    if (cancellation.partial_refund_text)
      policyLines.push(`• ${cancellation.partial_refund_text}`);
    if (cancellation.no_refund_text)
      policyLines.push(`• ${cancellation.no_refund_text}`);

    if (policyLines.length > 0) {
      const policyText = policyLines.join("\n");
      const textH = doc.heightOfString(policyText, { width: contentW - 24 });

      // Redraw background with correct height
      drawRoundedRect(
        doc,
        marginX,
        y,
        contentW,
        textH + 16,
        6,
        COLORS.greyLight,
      );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.textDark)
        .text(policyText, marginX + 12, y + 8, { width: contentW - 24 });

      y += textH + 28;
    } else {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.textDark)
        .text(
          "Please refer to the property listing for cancellation details.",
          marginX,
          y,
        );
      y += 20;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  const footerY = Math.max(y + 20, 720);

  // Footer divider
  drawLine(doc, footerY, { color: COLORS.navy, width: 1 });

  // Footer background
  doc.rect(0, footerY + 1, pageW, 842 - footerY).fill(COLORS.navy);

  const fY = footerY + 12;

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.teal)
    .text("COMPANY ADDRESS:", marginX, fY, { width: contentW });

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.greyLight)
    .text(
      "Navarathna Agrahara, Bettahalasur Post, Bangalore North - 562157",
      marginX,
      fY + 12,
      { width: contentW },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.teal)
    .text("SUPPORT:", marginX, fY + 28, { width: 60 });

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.greyLight)
    .text("support@zevio.com  |  www.zevio.in", marginX + 62, fY + 28, {
      width: contentW - 62,
    });

  // Small legal note
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.textDark)
    .text(
      "This is a computer-generated invoice and does not require a signature.",
      marginX,
      fY + 48,
      { width: contentW, align: "center" },
    );

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.textDark)
    .text(
      `© ${new Date().getFullYear()} Zevio. All rights reserved.`,
      marginX,
      fY + 60,
      { width: contentW, align: "center" },
    );

  // Finalize
  doc.end();
  return pdfReady;
};
