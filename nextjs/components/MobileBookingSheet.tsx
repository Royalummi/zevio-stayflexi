"use client";

import { useEffect, useState, useRef } from "react";
import { FiX, FiCalendar, FiUsers } from "react-icons/fi";
import DateRangeSelector from "./DateRangeSelector";
import styles from "./MobileBookingSheet.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface MobileBookingSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Called when user dismisses the sheet (X, backdrop, or Done with no dates) */
  onClose: () => void;
  /** Called when user taps "Confirm" with dates selected — proceed to booking */
  onConfirm: () => void;

  // ── Date state (controlled by parent) ──────────────────────────────────────
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;

  // ── Guest state (controlled by parent) ─────────────────────────────────────
  adults: number;
  childCount: number;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;

  // ── Property config ─────────────────────────────────────────────────────────
  /** Max total guests allowed */
  maxGuests?: number;
  /** Min adults (default 1) */
  minAdults?: number;
  /** Max children (default 5) */
  maxChildren?: number;
  /** Pass to show per-day pricing inside the calendar */
  propertyId?: string;
  /** Base nightly rate — shown in price summary */
  pricePerNight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function MobileBookingSheet({
  isOpen,
  onClose,
  onConfirm,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  adults,
  childCount,
  onAdultsChange,
  onChildrenChange,
  maxGuests = 10,
  minAdults = 1,
  maxChildren = 5,
  propertyId,
  pricePerNight,
}: MobileBookingSheetProps) {
  // Active tab: "dates" | "guests"
  const [activeTab, setActiveTab] = useState<"dates" | "guests">("dates");
  // Animate in/out a frame after mount/unmount
  const [visible, setVisible] = useState(false);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Small delay so transform animation starts after DOM paint
      const t = setTimeout(() => setVisible(true), 10);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = ""; // restore on unmount (e.g. navigation)
      };
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        document.body.style.overflow = "";
      }, 400); // match transition duration
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-switch to guests tab when both dates are selected
  useEffect(() => {
    if (checkIn && checkOut && activeTab === "dates") {
      setActiveTab("guests");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut]);

  // Reset tab to "dates" when sheet reopens
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      // if dates are already set, go straight to guests; else start at dates
      setActiveTab(checkIn && checkOut ? "guests" : "dates");
    }
    prevOpen.current = isOpen;
  }, [isOpen, checkIn, checkOut]);

  if (!isOpen) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const confirmLabel = !checkIn
    ? "Select Check-in Date"
    : !checkOut
      ? "Select Check-out Date"
      : "Confirm Dates & Guests";

  const canConfirm = !!(checkIn && checkOut);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBackdropClick = () => {
    // Allow closing even with dates set — user can keep them and close
    onClose();
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${visible ? styles.backdropVisible : ""}`}
        onClick={handleBackdropClick}
        aria-label="Close booking sheet"
      />

      {/* Sheet */}
      <div
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Select dates and guests"
      >
        {/* Drag handle */}
        <div className={styles.handle}>
          <div className={styles.handleBar} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {activeTab === "dates" ? "Select Dates" : "Select Guests"}
          </span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tab strip */}
        <div className={styles.body}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "dates" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("dates")}
            >
              <FiCalendar
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Dates
              {checkIn && checkOut && (
                <span
                  style={{ marginLeft: 6, fontSize: "0.75rem", opacity: 0.8 }}
                >
                  ✓
                </span>
              )}
            </button>
            <button
              className={`${styles.tab} ${activeTab === "guests" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("guests")}
            >
              <FiUsers
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Guests
            </button>
          </div>

          {/* ── DATES TAB ─────────────────────────────────────────────────── */}
          {activeTab === "dates" && (
            <div className={styles.section}>
              <DateRangeSelector
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={onCheckInChange}
                onCheckOutChange={onCheckOutChange}
                minDate={new Date()}
                inline={true}
                propertyId={propertyId}
                basePrice={pricePerNight}
              />
            </div>
          )}

          {/* ── GUESTS TAB ────────────────────────────────────────────────── */}
          {activeTab === "guests" && (
            <div className={styles.section}>
              {/* Adults */}
              <div className={styles.guestRow}>
                <div className={styles.guestInfo}>
                  <div className={styles.guestType}>Adults</div>
                  <div className={styles.guestSubtype}>Age 13+</div>
                </div>
                <div className={styles.counter}>
                  <button
                    className={styles.counterBtn}
                    onClick={() =>
                      onAdultsChange(Math.max(minAdults, adults - 1))
                    }
                    disabled={adults <= minAdults}
                    aria-label="Decrease adults"
                  >
                    −
                  </button>
                  <span className={styles.counterValue}>{adults}</span>
                  <button
                    className={styles.counterBtn}
                    onClick={() =>
                      onAdultsChange(
                        Math.min(maxGuests - childCount, adults + 1),
                      )
                    }
                    disabled={adults + childCount >= maxGuests}
                    aria-label="Increase adults"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className={styles.guestRow}>
                <div className={styles.guestInfo}>
                  <div className={styles.guestType}>Children</div>
                  <div className={styles.guestSubtype}>Ages 2–12</div>
                </div>
                <div className={styles.counter}>
                  <button
                    className={styles.counterBtn}
                    onClick={() =>
                      onChildrenChange(Math.max(0, childCount - 1))
                    }
                    disabled={childCount <= 0}
                    aria-label="Decrease children"
                  >
                    −
                  </button>
                  <span className={styles.counterValue}>{childCount}</span>
                  <button
                    className={styles.counterBtn}
                    onClick={() =>
                      onChildrenChange(
                        Math.min(
                          maxChildren,
                          adults + childCount < maxGuests
                            ? childCount + 1
                            : childCount,
                        ),
                      )
                    }
                    disabled={
                      childCount >= maxChildren ||
                      adults + childCount >= maxGuests
                    }
                    aria-label="Increase children"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Price summary (always visible) ────────────────────────────── */}
          <div className={styles.priceSummary}>
            <div>
              <div className={styles.priceSummaryLabel}>
                ₹{pricePerNight.toLocaleString("en-IN")} / night
              </div>
              {nights > 0 && (
                <div className={styles.priceSummaryNights}>
                  {nights} {nights === 1 ? "night" : "nights"}
                </div>
              )}
            </div>
            <div>
              <div className={styles.priceSummaryAmount}>
                {nights > 0
                  ? `₹${(pricePerNight * nights).toLocaleString("en-IN")}`
                  : "—"}
              </div>
              {nights > 0 && (
                <div className={styles.priceSummaryPer}>base total</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
