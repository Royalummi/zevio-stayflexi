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
  discountAmount = 0
) => {
  const baseAmount = pricePerNight * nights;
  const gstAmount = (baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount - discountAmount;

  return {
    baseAmount: parseFloat(baseAmount.toFixed(2)),
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
