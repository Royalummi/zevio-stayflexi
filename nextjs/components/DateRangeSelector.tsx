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
  /** 'booking' = end_date is check-out (available for new check-ins); 'blackout' = end_date is last blocked day (inclusive) */
  type?: "booking" | "blackout";
}

interface StayRestriction {
  closed_on_arrival: boolean;
  closed_on_departure: boolean;
  min_los: number | null;
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
  /** Minimum nights required for the selected check-in (property + CM MinLOS) */
  minStayNights?: number;
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
  minStayNights = 1,
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
  const [restrictionMap, setRestrictionMap] = useState<
    Record<string, StayRestriction>
  >({});
  const [restrictionYearsFetched, setRestrictionYearsFetched] = useState<
    Set<number>
  >(new Set());
  const [rangeError, setRangeError] = useState<string>("");

  // Use external isOpen if provided (for controlled mode), otherwise use internal state
  const showDropdown =
    externalIsOpen !== undefined ? externalIsOpen : internalShowDropdown;

  // True when user has selected check-in but not yet check-out.
  // Blocked dates can be used as checkout in this state.
  const selectingCheckOut = !!checkIn && !checkOut;

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
          // Preserve the type tag added by the backend so isBlocked can
          // apply the correct end-date logic for each range.
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

  // Fetch CM stay restrictions (COA/COD) for calendar year
  useEffect(() => {
    if (!propertyId) return;
    if (!inline && !showDropdown) return;
    const yr = currentMonth.getFullYear();
    if (restrictionYearsFetched.has(yr)) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}/stay-restrictions?year=${yr}`,
        );
        const json = await res.json();
        if (json.success && json.data?.restrictions) {
          setRestrictionMap((prev) => {
            const next = { ...prev };
            (
              json.data.restrictions as Array<{
                control_date: string;
                closed_on_arrival: boolean;
                closed_on_departure: boolean;
                min_los: number | null;
              }>
            ).forEach((entry) => {
              next[entry.control_date] = {
                closed_on_arrival: Boolean(entry.closed_on_arrival),
                closed_on_departure: Boolean(entry.closed_on_departure),
                min_los:
                  entry.min_los !== null ? Number(entry.min_los) : null,
              };
            });
            return next;
          });
          setRestrictionYearsFetched((prev) => new Set(prev).add(yr));
        }
      } catch {
        // calendar still works without restriction overlay
      }
    };
    load();
  }, [inline, showDropdown, currentMonth, propertyId, restrictionYearsFetched]);

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
    return blockedRanges.some((r) => {
      const start = r.start_date.substring(0, 10);
      const end = r.end_date.substring(0, 10);
      if (r.type === "booking") {
        // The check-out date itself is NOT blocked — a new guest can check in
        // on the same day a previous guest checks out.
        return key >= start && key < end;
      }
      // Blackouts: every day from start_date to end_date (inclusive) is blocked.
      return key >= start && key <= end;
    });
  };

  const isClosedOnArrival = (date: Date): boolean =>
    Boolean(restrictionMap[toKey(date)]?.closed_on_arrival);

  const isClosedOnDeparture = (date: Date): boolean =>
    Boolean(restrictionMap[toKey(date)]?.closed_on_departure);

  const isRestrictionBlocked = (date: Date): boolean => {
    if (selectingCheckOut) {
      return isClosedOnDeparture(date);
    }
    return isClosedOnArrival(date);
  };

  const isEffectivelyBlocked = (date: Date): boolean => {
    const blocked = !isDisabled(date) && isBlocked(date);
    const inventoryBlocked =
      blocked && !(selectingCheckOut && !!checkIn && date > checkIn);
    return inventoryBlocked || isRestrictionBlocked(date);
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

    if (
      isDisabled(selectedDate) ||
      isEffectivelyBlocked(selectedDate)
    )
      return;

    setRangeError("");

    if (!checkIn || (checkIn && checkOut)) {
      if (isClosedOnArrival(selectedDate)) {
        setRangeError("Check-in is not available on this date.");
        return;
      }
      // Starting a new selection
      onCheckInChange(selectedDate);
      onCheckOutChange(null);
    } else {
      if (selectedDate > checkIn) {
        if (isClosedOnDeparture(selectedDate)) {
          setRangeError("Check-out is not available on this date.");
          return;
        }

        const selectedNights = Math.ceil(
          (selectedDate.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (minStayNights > 1 && selectedNights < minStayNights) {
          setRangeError(
            `Minimum stay is ${minStayNights} nights for this check-in date.`,
          );
          onCheckOutChange(null);
          return;
        }

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
        if (isClosedOnArrival(selectedDate)) {
          setRangeError("Check-in is not available on this date.");
          return;
        }
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
                  // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Apr 31 rolls over)
                  const prev = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1,
                  );
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
                  // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Jun 31 rolls over to Jul)
                  const next = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1,
                  );
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
                const effectivelyBlocked =
                  !disabled && isEffectivelyBlocked(date);
                const selected = isSelected(date);
                const inRange = isInRange(date);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const customPx = priceMap[dateKey];
                const displayPx = customPx ?? basePrice;

                return (
                  <button
                    key={day}
                    onClick={() =>
                      !disabled && !effectivelyBlocked && handleDayClick(day)
                    }
                    className={`${styles.day} ${
                      disabled ? styles.disabled : ""
                    } ${
                      effectivelyBlocked ? styles.blocked : ""
                    } ${selected ? styles.selected : ""} ${
                      inRange ? styles.inRange : ""
                    }`}
                    disabled={disabled || effectivelyBlocked}
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
              // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Apr 31 rolls over)
              const prev = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1,
              );
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
              // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Jun 31 rolls over to Jul)
              const next = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1,
              );
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
            const effectivelyBlocked =
              !disabled && isEffectivelyBlocked(date);
            const selected = isSelected(date);
            const inRange = isInRange(date);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const customPx = priceMap[dateKey];
            const displayPx = customPx ?? basePrice;
            return (
              <button
                key={day}
                onClick={() =>
                  !disabled && !effectivelyBlocked && handleDayClick(day)
                }
                className={`${styles.day} ${disabled ? styles.disabled : ""} ${effectivelyBlocked ? styles.blocked : ""} ${selected ? styles.selected : ""} ${inRange ? styles.inRange : ""}`}
                disabled={disabled || effectivelyBlocked}
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
                // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Apr 31 rolls over)
                const prev = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                );
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
                // Anchor to day 1 to avoid month-overflow (e.g. May 31 -> Jun 31 rolls over to Jul)
                const next = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                );
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
              const effectivelyBlocked =
                !disabled && isEffectivelyBlocked(date);
              const selected = isSelected(date);
              const inRange = isInRange(date);
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const customPx = priceMap[dateKey];
              const displayPx = customPx ?? basePrice;

              return (
                <button
                  key={day}
                  onClick={() =>
                    !disabled && !effectivelyBlocked && handleDayClick(day)
                  }
                  className={`${styles.day} ${
                    disabled ? styles.disabled : ""
                  } ${
                    effectivelyBlocked ? styles.blocked : ""
                  } ${selected ? styles.selected : ""} ${
                    inRange ? styles.inRange : ""
                  }`}
                  disabled={disabled || effectivelyBlocked}
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
