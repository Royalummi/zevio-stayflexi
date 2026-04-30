"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import styles from "./DateRangeSelector.module.css";

interface PriceEntry {
  price_date: string;
  price: number;
}

interface BlockedRange {
  start_date: string;
  end_date: string;
}

interface DateRangeSelectorProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  minDate?: Date;
  label?: string;
  luxuryStyles?: { [key: string]: string };
  calendarOnly?: boolean;
  /**
   * inline=true: renders the calendar as a block element (no absolute/fixed
   * positioning). Use inside bottom sheets / drawers where the calendar should
   * be part of the normal document flow.
   */
  inline?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Pass a property ID to show per-day pricing inside the calendar */
  propertyId?: string;
  /** Base price per night — shown on days without a custom rate */
  basePrice?: number;
}

function formatDayPrice(amount: number): string {
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
}

export default function DateRangeSelector({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate = new Date(),
  label = "Select dates",
  luxuryStyles: luxStyles,
  calendarOnly = false,
  inline = false,
  isOpen: externalIsOpen,
  onOpenChange,
  propertyId,
  basePrice,
}: DateRangeSelectorProps) {
  const [internalShowDropdown, setInternalShowDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Pricing state — keyed by "YYYY-MM-DD"
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [fetchedYears, setFetchedYears] = useState<Set<number>>(new Set());
  // Blocked date ranges (blackouts + confirmed bookings)
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [blockedLoaded, setBlockedLoaded] = useState(false);
  const [rangeError, setRangeError] = useState<string>("");

  // Use external isOpen if provided (for controlled mode), otherwise use internal state
  const showDropdown =
    externalIsOpen !== undefined ? externalIsOpen : internalShowDropdown;

  // Fetch per-day pricing from public API when calendar opens or year changes
  useEffect(() => {
    if (!propertyId || !showDropdown) return;
    const yr = currentMonth.getFullYear();
    if (fetchedYears.has(yr)) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}/calendar-pricing?year=${yr}`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPriceMap((prev) => {
            const next = { ...prev };
            (json.data as PriceEntry[]).forEach((e) => {
              next[e.price_date] = e.price;
            });
            return next;
          });
          setFetchedYears((prev) => new Set(prev).add(yr));
        }
      } catch {
        // calendar still works without pricing overlay
      }
    };
    load();
  }, [showDropdown, currentMonth, propertyId, fetchedYears]);

  // Fetch blocked/booked date ranges once per propertyId
  useEffect(() => {
    if (!propertyId || blockedLoaded) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}/blocked-dates`,
        );
        const json = await res.json();
        if (json.success && json.data) {
          const ranges: BlockedRange[] = [
            ...(json.data.blackouts || []),
            ...(json.data.bookings || []),
          ];
          setBlockedRanges(ranges);
          setBlockedLoaded(true);
        }
      } catch {
        // calendar still works without blocked dates
      }
    };
    load();
  }, [propertyId, blockedLoaded]);

  const handleOpenChange = (newState: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalShowDropdown(newState);
    }
    onOpenChange?.(newState);
  };

  const getSelectionHintText = () => {
    if (!checkIn) return "Step 1 of 2: Select check-in date";
    if (!checkOut) return "Step 2 of 2: Select check-out date";
    return `${formatDisplayDate(checkIn)} -> ${formatDisplayDate(checkOut)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (externalIsOpen === undefined) {
          setInternalShowDropdown(false);
        } else {
          onOpenChange?.(false);
        }
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown, externalIsOpen, onOpenChange]);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);

    if (!checkIn) {
      onCheckInChange(date);
      const checkout = new Date(date);
      checkout.setDate(checkout.getDate() + 3);
      onCheckOutChange(checkout);
    }
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  const isSelected = (date: Date) => {
    if (checkIn && date.toDateString() === checkIn.toDateString()) return true;
    if (checkOut && date.toDateString() === checkOut.toDateString())
      return true;
    return false;
  };

  const isDisabled = (date: Date) => {
    // Compare date-only (ignore time-of-day) so today is always selectable.
    // minDate = new Date() captures current time; without this fix a calendar
    // date at midnight would be < "now at 2pm" and falsely appear disabled.
    const minDay = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate(),
    );
    return date < minDay;
  };

  const toKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isBlocked = (date: Date): boolean => {
    if (blockedRanges.length === 0) return false;
    const key = toKey(date);
    return blockedRanges.some(
      (r) =>
        key >= r.start_date.substring(0, 10) &&
        key <= r.end_date.substring(0, 10),
    );
  };

  /** Returns true if any date strictly between fromDate and toDate (exclusive) is blocked */
  const hasBlockedInRange = (fromDate: Date, toDate: Date): boolean => {
    if (blockedRanges.length === 0) return false;
    const cur = new Date(fromDate);
    cur.setDate(cur.getDate() + 1); // start day after check-in
    while (cur < toDate) {
      if (isBlocked(cur)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentMonth);
    selectedDate.setDate(day);
    selectedDate.setHours(0, 0, 0, 0);

    if (isDisabled(selectedDate) || isBlocked(selectedDate)) return;

    setRangeError("");

    if (!checkIn || (checkIn && checkOut)) {
      // Starting a new selection
      onCheckInChange(selectedDate);
      onCheckOutChange(null);
    } else {
      if (selectedDate > checkIn) {
        // Validate: no blocked dates inside the selected range
        if (hasBlockedInRange(checkIn, selectedDate)) {
          setRangeError(
            "Your selected range includes unavailable dates. Please choose dates that don't span blocked periods.",
          );
          onCheckInChange(selectedDate);
          onCheckOutChange(null);
          return;
        }
        onCheckOutChange(selectedDate);
        handleOpenChange(false);
      } else {
        // Clicked before or on check-in — restart selection
        onCheckInChange(selectedDate);
        onCheckOutChange(null);
      }
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Use luxury styles if provided for wrapper and field, otherwise use default styles
  const containerClass = luxStyles?.modernFieldWrapper || styles.wrapper;
  const fieldClass = luxStyles?.modernField || styles.container;
  const innerClass = luxStyles?.fieldInner || styles.inputField;
  const iconClass = luxStyles?.fieldIcon || styles.icon;
  const textClass = luxStyles?.fieldText || styles.dates;
  const labelClass = luxStyles?.fieldLabel || "";
  const valueClass = luxStyles?.fieldValue || styles.dates;

  // If calendarOnly mode, render without wrapper
  if (calendarOnly) {
    return (
      <>
        {/* Calendar Dropdown */}
        {showDropdown && (
          <div
            className={`${styles.dropdownContent} ${styles.calendarOnlyContent}`}
          >
            {/* Calendar Header */}
            <div className={styles.calendarHeader}>
              <button
                onClick={() => {
                  const prev = new Date(currentMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentMonth(prev);
                }}
                className={styles.navBtn}
                aria-label="Previous month"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className={styles.monthYear}>
                {currentMonth.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => {
                  const next = new Date(currentMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentMonth(next);
                }}
                className={styles.navBtn}
                aria-label="Next month"
              >
                <FiChevronRight size={18} />
              </button>
            </div>

            {/* Selection hint */}
            <div className={styles.selectionHint} aria-live="polite">
              {getSelectionHintText()}
            </div>

            {/* Days of week header */}
            <div className={styles.daysOfWeek}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className={styles.dayHeader}>
                  {day}
                </div>
              ))}
            </div>

            {/* Range error message */}
            {rangeError && (
              <div className={styles.rangeError}>{rangeError}</div>
            )}

            {/* Calendar days grid */}
            <div className={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className={styles.emptyDay} />
                  );
                }

                const date = new Date(currentMonth);
                date.setDate(day);
                date.setHours(0, 0, 0, 0);

                const disabled = isDisabled(date);
                const blocked = !disabled && isBlocked(date);
                const selected = isSelected(date);
                const inRange = isInRange(date);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const customPx = priceMap[dateKey];
                const displayPx = customPx ?? basePrice;

                return (
                  <button
                    key={day}
                    onClick={() => !disabled && !blocked && handleDayClick(day)}
                    className={`${styles.day} ${
                      disabled ? styles.disabled : ""
                    } ${
                      blocked ? styles.blocked : ""
                    } ${selected ? styles.selected : ""} ${
                      inRange ? styles.inRange : ""
                    }`}
                    disabled={disabled || blocked}
                    aria-label={`${day}`}
                  >
                    <span className={styles.dayNumber}>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Inline mode: calendar rendered as a block, no absolute/fixed positioning ──
  if (inline) {
    return (
      <div className={styles.inlineCalendar}>
        {/* Month navigation */}
        <div className={styles.calendarHeader}>
          <button
            onClick={() => {
              const prev = new Date(currentMonth);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentMonth(prev);
            }}
            className={styles.navBtn}
            aria-label="Previous month"
          >
            <FiChevronLeft size={18} />
          </button>
          <span className={styles.monthYear}>
            {currentMonth.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => {
              const next = new Date(currentMonth);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonth(next);
            }}
            className={styles.navBtn}
            aria-label="Next month"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Selection hint */}
        <div className={styles.selectionHint} aria-live="polite">
          {getSelectionHintText()}
        </div>
        {/* Range error message */}
        {rangeError && <div className={styles.rangeError}>{rangeError}</div>}
        {/* Days of week */}
        <div className={styles.daysOfWeek}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className={styles.emptyDay} />;
            }
            const date = new Date(currentMonth);
            date.setDate(day);
            date.setHours(0, 0, 0, 0);
            const disabled = isDisabled(date);
            const blocked = !disabled && isBlocked(date);
            const selected = isSelected(date);
            const inRange = isInRange(date);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const customPx = priceMap[dateKey];
            const displayPx = customPx ?? basePrice;
            return (
              <button
                key={day}
                onClick={() => !disabled && !blocked && handleDayClick(day)}
                className={`${styles.day} ${disabled ? styles.disabled : ""} ${blocked ? styles.blocked : ""} ${selected ? styles.selected : ""} ${inRange ? styles.inRange : ""}`}
                disabled={disabled || blocked}
                aria-label={`${day}`}
              >
                <span className={styles.dayNumber}>{day}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Normal mode - with wrapper and field
  return (
    <div className={containerClass} ref={dropdownRef}>
      <div
        className={fieldClass}
        onClick={() => handleOpenChange(!showDropdown)}
      >
        <div className={innerClass}>
          <FiCalendar className={iconClass} size={16} />
          <div className={textClass}>
            {labelClass && <label className={labelClass}>{label}</label>}
            <div className={valueClass}>
              {checkIn && checkOut ? (
                <>
                  <span>{formatDisplayDate(checkIn)}</span>
                  <span className={styles.separator}>→</span>
                  <span>{formatDisplayDate(checkOut)}</span>
                </>
              ) : checkIn ? (
                <span>{formatDisplayDate(checkIn)}</span>
              ) : (
                <span className={styles.placeholder}>{label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {showDropdown && (
        <div className={styles.dropdownContent}>
          {/* Calendar Header */}
          <div className={styles.calendarHeader}>
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
              className={styles.navBtn}
              aria-label="Previous month"
            >
              <FiChevronLeft size={18} />
            </button>
            <span className={styles.monthYear}>
              {currentMonth.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
              className={styles.navBtn}
              aria-label="Next month"
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          {/* Selection hint */}
          <div className={styles.selectionHint} aria-live="polite">
            {getSelectionHintText()}
          </div>

          {/* Days of week header */}
          <div className={styles.daysOfWeek}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className={styles.dayHeader}>
                {day}
              </div>
            ))}
          </div>

          {rangeError && <div className={styles.rangeError}>{rangeError}</div>}

          {/* Calendar days grid */}
          <div className={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div key={`empty-${index}`} className={styles.emptyDay} />
                );
              }

              const date = new Date(currentMonth);
              date.setDate(day);
              date.setHours(0, 0, 0, 0);

              const disabled = isDisabled(date);
              const blocked = !disabled && isBlocked(date);
              const selected = isSelected(date);
              const inRange = isInRange(date);
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const customPx = priceMap[dateKey];
              const displayPx = customPx ?? basePrice;

              return (
                <button
                  key={day}
                  onClick={() => !disabled && !blocked && handleDayClick(day)}
                  className={`${styles.day} ${
                    disabled ? styles.disabled : ""
                  } ${
                    blocked ? styles.blocked : ""
                  } ${selected ? styles.selected : ""} ${
                    inRange ? styles.inRange : ""
                  }`}
                  disabled={disabled || blocked}
                  aria-label={`${day}`}
                >
                  <span className={styles.dayNumber}>{day}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
