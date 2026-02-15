"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface BookingData {
  propertyId: string;
  propertyName: string;
  propertyLocation: string;
  propertyImage: string;
  propertyType?: "villa" | "service-apartment"; // Added to track property type for back navigation
  propertyTypeId?: string; // Added to track property_type_id for booking creation (pt-001 for villa, pt-002 for service apartment)
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  nights: number;
  baseAmount: number;
  extraGuestCharges: number;
  extraChildrenCharges: number;
  gstAmount: number;
  totalAmount: number;
  pricePerNight: number;
  minGuests: number;
  maxGuests: number;
  minChildren: number;
  maxChildren: number;
  extraGuestCharge: number;
  extraChildCharge: number;
  // SESSION 64: Coupon system fields (optional for backward compatibility)
  couponCode?: string;
  couponId?: string;
  couponDiscount?: number;
  serviceCharge?: number; // 5% service charge
  gstRate?: number; // Tiered GST rate (5% or 18%)
}

interface BookingContextType {
  bookingData: BookingData | null;
  setBookingData: (data: BookingData | null) => void;
  clearBookingData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const clearBookingData = () => {
    setBookingData(null);
  };

  return (
    <BookingContext.Provider
      value={{ bookingData, setBookingData, clearBookingData }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
