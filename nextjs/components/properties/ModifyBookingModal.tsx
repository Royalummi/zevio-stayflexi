"use client";

import { useState, useEffect } from "react";
import { FiX, FiCalendar, FiUsers, FiLoader } from "react-icons/fi";
import DateRangeSelector from "@/components/DateRangeSelector";
import { api } from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import styles from "./ModifyBookingModal.module.css";

interface PendingBooking {
  id: string;
  property_title: string;
  property_price?: number; // Optional - will calculate from total_amount/nights
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  children_count: number;
  infants_count?: number; // Optional
  total_amount: number;
}

interface Props {
  booking: PendingBooking;
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModifyBookingModal({
  booking,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Calculate property price from available data if not provided
  const propertyPrice =
    booking.property_price ||
    Math.round(booking.total_amount / 1.18 / booking.nights); // Remove GST and divide by nights

  // Form state
  const [checkIn, setCheckIn] = useState<Date | null>(
    new Date(booking.check_in),
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    new Date(booking.check_out),
  );
  const [adults, setAdults] = useState(booking.guest_count);
  const [children, setChildren] = useState(booking.children_count);

  // Price calculation
  const [priceBreakdown, setPriceBreakdown] = useState({
    baseAmount: 0,
    extraGuestCharges: 0,
    extraChildrenCharges: 0,
    gstAmount: 0,
    totalAmount: 0,
    nights: 0,
  });

  // Calculate price when dates/guests change
  useEffect(() => {
    if (checkIn && checkOut) {
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (nights > 0) {
        // Simplified calculation (should match backend logic)
        const baseAmount = propertyPrice * nights;
        const subtotal = baseAmount; // Add extra charges if property has them
        const gstAmount = subtotal * 0.18;
        const totalAmount = subtotal + gstAmount;

        setPriceBreakdown({
          baseAmount,
          extraGuestCharges: 0,
          extraChildrenCharges: 0,
          gstAmount,
          totalAmount,
          nights,
        });
      }
    }
  }, [checkIn, checkOut, adults, children, propertyPrice]);

  const handleSave = async () => {
    if (!checkIn || !checkOut) {
      toast.warning("Please select check-in and check-out dates");
      return;
    }

    if (adults < 1) {
      toast.warning("At least 1 adult is required");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/bookings/${booking.id}/modify-pending`, {
        check_in: checkIn.toISOString().split("T")[0],
        check_out: checkOut.toISOString().split("T")[0],
        guest_count: adults,
        children_count: children,
      });

      toast.success("Booking modified successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Modify booking error:", error);
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        "Failed to modify booking";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Modify Booking</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Property Name */}
        <div className={styles.propertySection}>
          <p className={styles.propertyName}>{booking.property_title}</p>
          <p className={styles.propertyPrice}>
            ₹{(propertyPrice || 0).toLocaleString()} / night
          </p>
        </div>

        {/* Form */}
        <div className={styles.formSection}>
          {/* Dates - Using DateRangeSelector */}
          <div className={styles.dateRangeSection}>
            <DateRangeSelector
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              minDate={new Date()}
              label="Select new dates"
              luxuryStyles={styles}
            />
          </div>

          {/* Guests */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FiUsers /> Adults
              </label>
              <div className={styles.incrementer}>
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className={styles.incrementBtn}
                  disabled={adults <= 1}
                >
                  −
                </button>
                <span className={styles.incrementValue}>{adults}</span>
                <button
                  onClick={() => setAdults(adults + 1)}
                  className={styles.incrementBtn}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FiUsers /> Children
              </label>
              <div className={styles.incrementer}>
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className={styles.incrementBtn}
                  disabled={children <= 0}
                >
                  −
                </button>
                <span className={styles.incrementValue}>{children}</span>
                <button
                  onClick={() => setChildren(children + 1)}
                  className={styles.incrementBtn}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className={styles.priceSection}>
          <div className={styles.priceRow}>
            <span>Base Amount ({priceBreakdown.nights} nights)</span>
            <span>₹{(priceBreakdown.baseAmount || 0).toLocaleString()}</span>
          </div>
          <div className={styles.priceRow}>
            <span>GST (18%)</span>
            <span>₹{(priceBreakdown.gstAmount || 0).toLocaleString()}</span>
          </div>
          <div className={styles.priceRowTotal}>
            <span>Total Amount</span>
            <span>₹{(priceBreakdown.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <FiLoader className={styles.spinner} /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
