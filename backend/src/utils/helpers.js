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
  gstPercentage,
  discountAmount = 0,
  propertyPricing = {},
  guestCounts = {}
) => {
  // Base amount (includes minimum guests/children in property price)
  const baseAmount = pricePerNight * nights;

  // Calculate extra guest charges
  let extraGuestCharges = 0;
  if (
    guestCounts.guest_count &&
    propertyPricing.min_guests &&
    propertyPricing.extra_guest_charge
  ) {
    const extraGuests = Math.max(
      0,
      guestCounts.guest_count - propertyPricing.min_guests
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
      guestCounts.children_count - propertyPricing.min_children
    );
    extraChildrenCharges =
      extraChildren * propertyPricing.extra_child_charge * nights;
  }

  // Note: Infants (0-2 years) are FREE - no charges

  // Subtotal before GST
  const subtotal =
    baseAmount + extraGuestCharges + extraChildrenCharges - discountAmount;

  // Calculate GST on total (base + extra guests + extra children - discount)
  const gstAmount = (subtotal * gstPercentage) / 100;

  // Final total
  const totalAmount = subtotal + gstAmount;

  return {
    baseAmount: parseFloat(baseAmount.toFixed(2)),
    extraGuestCharges: parseFloat(extraGuestCharges.toFixed(2)),
    extraChildrenCharges: parseFloat(extraChildrenCharges.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
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
