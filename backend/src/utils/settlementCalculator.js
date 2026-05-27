/**
 * Calculate vendor settlement based on GST registration status.
 *
 * GST Vendor: gets discounted_base + GST, minus (5% platform fee + 18% GST on fee)
 * Non-GST Vendor: gets discounted_base only, minus (5% platform fee + 18% GST on fee)
 *
 * When a coupon is used the vendor is paid on the post-discount base amount.
 * The gstAmount stored in bookings is already calculated on the post-discount amount,
 * so we must use (baseAmount - discountAmount) as the effective base.
 *
 * @param {Object} params
 * @param {number} params.baseAmount      - Booking base amount (pre-discount, pre-GST)
 * @param {number} params.gstAmount       - GST amount from booking (calculated on post-discount amount)
 * @param {number} params.serviceCharge   - Service charge from booking (5%)
 * @param {number} params.totalAmount     - Total amount guest paid
 * @param {number} params.discountAmount  - Coupon discount applied (default 0)
 * @param {boolean} params.isVendorGst    - Whether vendor is GST registered
 * @returns {Object} Settlement breakdown
 */
export function calculateSettlement({
  baseAmount,
  gstAmount,
  serviceCharge,
  totalAmount,
  discountAmount = 0,
  isVendorGst,
}) {
  // Effective base after coupon discount (this is what the vendor earns from accommodation)
  const effectiveBase = roundTo2(baseAmount - discountAmount);

  // Vendor gross: GST vendor gets effective_base + GST, non-GST vendor gets effective_base only
  const vendorGrossAmount = isVendorGst
    ? roundTo2(effectiveBase + gstAmount)
    : roundTo2(effectiveBase);

  // Platform fee: 5% of vendor gross
  const platformFee = roundTo2(vendorGrossAmount * 0.05);

  // GST on platform fee: 18%
  const platformFeeGst = roundTo2(platformFee * 0.18);

  // Total deduction
  const totalDeduction = roundTo2(platformFee + platformFeeGst);

  // Final settlement amount (vendor receives)
  const settlementAmount = roundTo2(vendorGrossAmount - totalDeduction);

  return {
    effectiveBase,
    discountAmount: roundTo2(discountAmount),
    vendorGrossAmount,
    platformFee,
    platformFeeGst,
    totalDeduction,
    settlementAmount,
    isVendorGst,
  };
}

function roundTo2(num) {
  return Math.round(num * 100) / 100;
}
