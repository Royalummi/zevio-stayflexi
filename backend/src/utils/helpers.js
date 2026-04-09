import { v4 as uuidv4 } from "uuid";

export const generateUUID = () => {
  return uuidv4();
};

export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateBookingAmount = (
  pricePerNight,
  nights,
  gstPercentage, // DEPRECATED - will use tiered GST instead
  discountAmount = 0,
  propertyPricing = {},
  guestCounts = {},
  precomputedBaseAmount = null, // Optional: calendar-aware pre-computed base
) => {
  // Base amount: use pre-computed calendar total if provided, else flat rate
  const baseAmount =
    precomputedBaseAmount !== null
      ? parseFloat(precomputedBaseAmount) || 0
      : (parseFloat(pricePerNight) || 0) * nights;

  // Calculate extra guest charges
  let extraGuestCharges = 0;
  if (
    guestCounts.guest_count &&
    propertyPricing.min_guests &&
    propertyPricing.extra_guest_charge
  ) {
    const extraGuests = Math.max(
      0,
      guestCounts.guest_count - propertyPricing.min_guests,
    );
    extraGuestCharges =
      extraGuests * propertyPricing.extra_guest_charge * nights;
  }

  // Calculate extra children charges (children age 0-12, excluding infants 0-2)
  let extraChildrenCharges = 0;
  if (
    guestCounts.children_count &&
    propertyPricing.min_children !== undefined &&
    propertyPricing.extra_child_charge
  ) {
    const extraChildren = Math.max(
      0,
      guestCounts.children_count - propertyPricing.min_children,
    );
    extraChildrenCharges =
      extraChildren * propertyPricing.extra_child_charge * nights;
  }

  // Note: Infants (0-2 years) are FREE - no charges

  // Subtotal before discount
  const subtotal = baseAmount + extraGuestCharges + extraChildrenCharges;

  // Apply coupon discount
  const bookingAmount = subtotal - discountAmount;

  // ============================================
  // SESSION 64: NEW PRICING LOGIC
  // - Tiered GST (5% if ≤₹7500, 18% if >₹7500)
  // - GST calculated on booking amount only
  // - Service charge (5% of booking amount, NO GST on it)
  // ============================================

  // Tiered GST calculation
  const GST_THRESHOLD = 7500; // ₹7,500 threshold
  const GST_RATE_LOW = 5; // 5% for bookings ≤ ₹7,500
  const GST_RATE_HIGH = 18; // 18% for bookings > ₹7,500

  const gstRate = bookingAmount <= GST_THRESHOLD ? GST_RATE_LOW : GST_RATE_HIGH;
  const gstAmount = (bookingAmount * gstRate) / 100;

  // Service charge (5% of booking amount, flat - no GST on it per client requirement)
  const SERVICE_CHARGE_RATE = 5; // 5%
  const serviceCharge = (bookingAmount * SERVICE_CHARGE_RATE) / 100;

  // Final total = Booking Amount + GST + Service Charge
  const totalAmount = bookingAmount + gstAmount + serviceCharge;

  return {
    baseAmount: parseFloat(baseAmount.toFixed(2)),
    extraGuestCharges: parseFloat(extraGuestCharges.toFixed(2)),
    extraChildrenCharges: parseFloat(extraChildrenCharges.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)), // Before discount
    discountAmount: parseFloat(discountAmount.toFixed(2)), // Coupon discount
    bookingAmount: parseFloat(bookingAmount.toFixed(2)), // After discount
    gstRate, // 5 or 18 (for display)
    gstAmount: parseFloat(gstAmount.toFixed(2)), // GST on booking amount only
    serviceCharge: parseFloat(serviceCharge.toFixed(2)), // 5% platform fee
    totalAmount: parseFloat(totalAmount.toFixed(2)), // Final payable amount
    nights,
  };
};

export const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
