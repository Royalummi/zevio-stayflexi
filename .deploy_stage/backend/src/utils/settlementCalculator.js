/**
 * Calculate vendor settlement based on GST registration status.
 *
 * GST Vendor: gets base + GST, minus (5% platform fee + 18% GST on fee)
 * Non-GST Vendor: gets base only, minus (5% platform fee + 18% GST on fee)
 *
 * @param {Object} params
 * @param {number} params.baseAmount - Booking base amount (before GST/service charge)
 * @param {number} params.gstAmount - GST amount from booking
 * @param {number} params.serviceCharge - Service charge from booking (5%)
 * @param {number} params.totalAmount - Total amount guest paid
 * @param {boolean} params.isVendorGst - Whether vendor is GST registered
 * @returns {Object} Settlement breakdown
 */
export function calculateSettlement({
  baseAmount,
  gstAmount,
  serviceCharge,
  totalAmount,
  isVendorGst,
}) {
  // Vendor gross: GST vendor gets base + GST, non-GST vendor gets base only
  const vendorGrossAmount = isVendorGst
    ? roundTo2(baseAmount + gstAmount)
    : roundTo2(baseAmount);

  // Platform fee: 5% of vendor gross
  const platformFee = roundTo2(vendorGrossAmount * 0.05);

  // GST on platform fee: 18%
  const platformFeeGst = roundTo2(platformFee * 0.18);

  // Total deduction
  const totalDeduction = roundTo2(platformFee + platformFeeGst);

  // Final settlement amount (vendor receives)
  const settlementAmount = roundTo2(vendorGrossAmount - totalDeduction);

  return {
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
