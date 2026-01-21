"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiClock,
  FiCalendar,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./PendingBookingModal.module.css";

interface PendingBooking {
  id: string;
  property_title: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  children_count: number;
  infants_count?: number;
  total_amount: number;
  expires_at: string;
}

interface Props {
  booking: PendingBooking;
  onClose: () => void;
  onContinue: () => void;
  onModify: () => void;
  onCancelAndCreateNew: () => void;
}

export default function PendingBookingModal({
  booking,
  onClose,
  onContinue,
  onModify,
  onCancelAndCreateNew,
}: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expires = new Date(booking.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [booking.expires_at]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <FiAlertCircle />
          </div>
          <h2 className={styles.modalTitle}>Pending Booking Found</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Expiry Timer */}
        <div className={styles.expiryBanner}>
          <FiClock />
          <span>
            This booking expires in <strong>{timeLeft}</strong>
          </span>
        </div>

        {/* Booking Details */}
        <div className={styles.bookingDetails}>
          <h3 className={styles.propertyTitle}>{booking.property_title}</h3>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <FiCalendar className={styles.detailIcon} />
              <div>
                <p className={styles.detailLabel}>Check-in</p>
                <p className={styles.detailValue}>
                  {formatDate(booking.check_in)}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <FiCalendar className={styles.detailIcon} />
              <div>
                <p className={styles.detailLabel}>Check-out</p>
                <p className={styles.detailValue}>
                  {formatDate(booking.check_out)}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <FiUsers className={styles.detailIcon} />
              <div>
                <p className={styles.detailLabel}>Guests</p>
                <p className={styles.detailValue}>
                  {booking.guest_count}{" "}
                  {booking.guest_count === 1 ? "Adult" : "Adults"}
                  {booking.children_count > 0 &&
                    `, ${booking.children_count} ${
                      booking.children_count === 1 ? "Child" : "Children"
                    }`}
                  {booking.infants_count &&
                    booking.infants_count > 0 &&
                    `, ${booking.infants_count} ${
                      booking.infants_count === 1 ? "Infant" : "Infants"
                    }`}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.amountBadge}>
                ₹{booking.total_amount.toLocaleString()}
              </div>
              <div>
                <p className={styles.detailLabel}>Total Amount</p>
                <p className={styles.detailValue}>{booking.nights} nights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.continueBtn} onClick={onContinue}>
            Continue Booking
          </button>
          <button className={styles.modifyBtn} onClick={onModify}>
            Modify Dates/Guests
          </button>
          <button className={styles.cancelBtn} onClick={onCancelAndCreateNew}>
            Cancel & Create New
          </button>
        </div>

        {/* Info Text */}
        <p className={styles.infoText}>
          You can only have one pending booking per property. Complete or cancel
          this booking to create a new one.
        </p>
      </div>
    </div>
  );
}
