/**
 * ============================================================================
 * BOOKING FLEXIBILITY BADGE COMPONENT
 * ============================================================================
 * Displays booking flexibility indicators:
 * - Same-day booking availability
 * - Maximum booking days limit
 * - Minimum/Maximum stay requirements
 *
 * Phase: 4 - Booking Flexibility & Features
 * Date: February 15, 2026
 * ============================================================================
 */

import React from "react";
import styles from "./booking-flexibility.module.css";
import { FiCalendar, FiClock, FiZap } from "react-icons/fi";

interface BookingFlexibilityBadgeProps {
  sameDayBookingAllowed?: boolean | number;
  maxBookingDays?: number | null;
  minStayDays?: number;
  maxStayDays?: number;
}

const BookingFlexibilityBadge: React.FC<BookingFlexibilityBadgeProps> = ({
  sameDayBookingAllowed,
  maxBookingDays,
  minStayDays,
  maxStayDays,
}) => {
  // Convert boolean/number to boolean (handles MySQL tinyint)
  const isSameDayBookingAllowed = Boolean(sameDayBookingAllowed);

  // Don't render if no flexibility data available
  if (
    !isSameDayBookingAllowed &&
    !maxBookingDays &&
    !minStayDays &&
    !maxStayDays
  ) {
    return null;
  }

  return (
    <div className={styles.bookingFlexibilityCard}>
      <div className={styles.cardHeader}>
        <FiCalendar className={styles.headerIcon} />
        <h3>Booking Information</h3>
      </div>

      <div className={styles.badgesGrid}>
        {/* Same-Day Booking Badge */}
        {isSameDayBookingAllowed && (
          <div className={`${styles.badge} ${styles.sameDayBadge}`}>
            <FiZap className={styles.badgeIcon} />
            <div className={styles.badgeContent}>
              <div className={styles.badgeTitle}>Same-Day Booking</div>
              <div className={styles.badgeDescription}>
                Book today, check in today!
              </div>
            </div>
          </div>
        )}

        {/* Minimum Stay Badge */}
        {minStayDays && minStayDays > 1 && (
          <div className={`${styles.badge} ${styles.minStayBadge}`}>
            <FiClock className={styles.badgeIcon} />
            <div className={styles.badgeContent}>
              <div className={styles.badgeTitle}>Minimum Stay</div>
              <div className={styles.badgeDescription}>
                {minStayDays} {minStayDays === 1 ? "night" : "nights"} required
              </div>
            </div>
          </div>
        )}

        {/* Maximum Stay Badge */}
        {maxStayDays && (
          <div className={`${styles.badge} ${styles.maxStayBadge}`}>
            <FiCalendar className={styles.badgeIcon} />
            <div className={styles.badgeContent}>
              <div className={styles.badgeTitle}>Maximum Stay</div>
              <div className={styles.badgeDescription}>
                Up to {maxStayDays} {maxStayDays === 1 ? "night" : "nights"}
              </div>
            </div>
          </div>
        )}

        {/* Maximum Booking Days Badge (if different from max stay) */}
        {maxBookingDays && maxBookingDays !== maxStayDays && (
          <div className={`${styles.badge} ${styles.maxBookingBadge}`}>
            <FiCalendar className={styles.badgeIcon} />
            <div className={styles.badgeContent}>
              <div className={styles.badgeTitle}>Booking Limit</div>
              <div className={styles.badgeDescription}>
                Book up to {maxBookingDays} days in advance
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flexible Booking Note */}
      {(isSameDayBookingAllowed || (!maxBookingDays && !maxStayDays)) && (
        <div className={styles.flexibilityNote}>
          <span className={styles.checkmark}>✓</span>
          <span>
            {isSameDayBookingAllowed
              ? "Flexible booking - perfect for last-minute plans!"
              : "No maximum stay limit - book for as long as you need!"}
          </span>
        </div>
      )}

      {/* Long Stay Information */}
      {maxStayDays && maxStayDays >= 30 && (
        <div className={styles.longStayNote}>
          <span className={styles.infoIcon}>ℹ️</span>
          <span>
            Extended stays welcome! Enjoy long-term discounts for stays over 30
            nights.
          </span>
        </div>
      )}
    </div>
  );
};

export default BookingFlexibilityBadge;
