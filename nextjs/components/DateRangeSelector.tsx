"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import styles from "./DateRangeSelector.module.css";

interface DateRangeSelectorProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  minDate?: Date;
  label?: string;
  luxuryStyles?: { [key: string]: string };
  calendarOnly?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
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
  isOpen: externalIsOpen,
  onOpenChange,
}: DateRangeSelectorProps) {
  const [internalShowDropdown, setInternalShowDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use external isOpen if provided (for controlled mode), otherwise use internal state
  const showDropdown =
    externalIsOpen !== undefined ? externalIsOpen : internalShowDropdown;

  const handleOpenChange = (newState: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalShowDropdown(newState);
    }
    onOpenChange?.(newState);
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
    return date < minDate;
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentMonth);
    selectedDate.setDate(day);
    selectedDate.setHours(0, 0, 0, 0);

    if (!checkIn || (checkIn && checkOut)) {
      onCheckInChange(selectedDate);
      onCheckOutChange(null);
    } else {
      if (selectedDate > checkIn) {
        onCheckOutChange(selectedDate);
        handleOpenChange(false);
      } else {
        onCheckInChange(selectedDate);
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

            {/* Days of week header */}
            <div className={styles.daysOfWeek}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className={styles.dayHeader}>
                  {day}
                </div>
              ))}
            </div>

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
                const selected = isSelected(date);
                const inRange = isInRange(date);

                return (
                  <button
                    key={day}
                    onClick={() => !disabled && handleDayClick(day)}
                    className={`${styles.day} ${
                      disabled ? styles.disabled : ""
                    } ${selected ? styles.selected : ""} ${
                      inRange ? styles.inRange : ""
                    }`}
                    disabled={disabled}
                    aria-label={`Select ${day}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick select buttons */}
            <div className={styles.quickSelect}>
              <button
                onClick={() => setQuickDate(0)}
                className={styles.quickBtn}
              >
                Today
              </button>
              <button
                onClick={() => setQuickDate(7)}
                className={styles.quickBtn}
              >
                Next Week
              </button>
              <button
                onClick={() => setQuickDate(30)}
                className={styles.quickBtn}
              >
                Next Month
              </button>
            </div>
          </div>
        )}
      </>
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

          {/* Days of week header */}
          <div className={styles.daysOfWeek}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className={styles.dayHeader}>
                {day}
              </div>
            ))}
          </div>

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
              const selected = isSelected(date);
              const inRange = isInRange(date);

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDayClick(day)}
                  className={`${styles.day} ${
                    disabled ? styles.disabled : ""
                  } ${selected ? styles.selected : ""} ${
                    inRange ? styles.inRange : ""
                  }`}
                  disabled={disabled}
                  aria-label={`Select ${day}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick select buttons */}
          <div className={styles.quickSelect}>
            <button onClick={() => setQuickDate(0)} className={styles.quickBtn}>
              Today
            </button>
            <button onClick={() => setQuickDate(7)} className={styles.quickBtn}>
              Next Week
            </button>
            <button
              onClick={() => setQuickDate(30)}
              className={styles.quickBtn}
            >
              Next Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
