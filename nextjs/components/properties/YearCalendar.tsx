"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import styles from "./YearCalendar.module.css";

interface CalendarDay {
  date: string;
  status: "available" | "booked" | "blocked" | "maintenance";
  price_per_night?: number;
}

interface Props {
  propertyId: string;
  onDateSelect: (checkIn: string, checkOut: string) => void;
  selectedCheckIn?: string;
  selectedCheckOut?: string;
  minStayNights?: number;
}

export default function YearCalendar({
  propertyId,
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
  minStayNights = 1,
}: Props) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, currentYear]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/service-apartments/${propertyId}/calendar`,
        { params: { start_date: startDate, end_date: endDate } }
      );

      if (response.data.success) {
        const dataMap: Record<string, CalendarDay> = {};
        response.data.data.calendar.forEach((day: CalendarDay) => {
          dataMap[day.date] = day;
        });
        setCalendarData(dataMap);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (dateStr: string) => {
    const dayData = calendarData[dateStr];
    if (!dayData || dayData.status !== "available") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(dateStr);

    if (clickedDate < today) return; // Can't select past dates

    if (selectingCheckIn || !selectedCheckIn) {
      // Selecting check-in
      onDateSelect(dateStr, "");
      setSelectingCheckIn(false);
    } else {
      // Selecting check-out
      const checkInDate = new Date(selectedCheckIn);
      const checkOutDate = new Date(dateStr);

      // Check if check-out is after check-in
      if (checkOutDate <= checkInDate) {
        // Reset and make this the new check-in
        onDateSelect(dateStr, "");
        setSelectingCheckIn(false);
        return;
      }

      // Check minimum stay requirement
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights < minStayNights) {
        alert(`Minimum stay is ${minStayNights} nights`);
        return;
      }

      // Check if all dates in range are available
      const allAvailable = checkDateRangeAvailable(selectedCheckIn, dateStr);
      if (!allAvailable) {
        alert("Some dates in this range are not available");
        return;
      }

      onDateSelect(selectedCheckIn, dateStr);
      setSelectingCheckIn(true);
    }
  };

  const checkDateRangeAvailable = (
    startDate: string,
    endDate: string
  ): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current < end) {
      const dateStr = current.toISOString().split("T")[0];
      const dayData = calendarData[dateStr];

      if (!dayData || dayData.status !== "available") {
        return false;
      }

      current.setDate(current.getDate() + 1);
    }

    return true;
  };

  const isDateInSelectedRange = (dateStr: string): boolean => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    const date = new Date(dateStr);
    const checkIn = new Date(selectedCheckIn);
    const checkOut = new Date(selectedCheckOut);
    return date >= checkIn && date <= checkOut;
  };

  const isDateInHoverRange = (dateStr: string): boolean => {
    if (!selectedCheckIn || selectingCheckIn || !hoveredDate) return false;
    const date = new Date(dateStr);
    const checkIn = new Date(selectedCheckIn);
    const hover = new Date(hoveredDate);

    if (hover <= checkIn) return false;

    return date > checkIn && date <= hover;
  };

  const getCellClassName = (dateStr: string): string => {
    const dayData = calendarData[dateStr];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(dateStr);

    const classes = [styles.calendarDay];

    // Past date
    if (cellDate < today) {
      classes.push(styles.past);
    }
    // Selected check-in
    else if (dateStr === selectedCheckIn) {
      classes.push(styles.checkIn);
    }
    // Selected check-out
    else if (dateStr === selectedCheckOut) {
      classes.push(styles.checkOut);
    }
    // In selected range
    else if (isDateInSelectedRange(dateStr)) {
      classes.push(styles.inRange);
    }
    // In hover preview range
    else if (isDateInHoverRange(dateStr)) {
      classes.push(styles.hoverRange);
    }
    // Status-based styling
    else if (!dayData) {
      classes.push(styles.unavailable);
    } else {
      switch (dayData.status) {
        case "available":
          classes.push(styles.available);
          break;
        case "booked":
          classes.push(styles.booked);
          break;
        case "blocked":
          classes.push(styles.blocked);
          break;
        case "maintenance":
          classes.push(styles.maintenance);
          break;
      }
    }

    return classes.join(" ");
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = today.toISOString().split("T")[0];
    const checkOutDate = new Date(today);
    checkOutDate.setDate(checkOutDate.getDate() + days);
    const checkOut = checkOutDate.toISOString().split("T")[0];

    // Check availability
    if (checkDateRangeAvailable(checkIn, checkOut)) {
      onDateSelect(checkIn, checkOut);
      setSelectingCheckIn(true);
    } else {
      alert(`Selected dates are not available`);
    }
  };

  const clearSelection = () => {
    onDateSelect("", "");
    setSelectingCheckIn(true);
  };

  const renderMonth = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day);
      const dayData = calendarData[dateStr];

      days.push(
        <div
          key={dateStr}
          className={getCellClassName(dateStr)}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={() => setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <span className={styles.dayNumber}>{day}</span>
          {dayData?.price_per_night && dayData.status === "available" && (
            <span className={styles.dayPrice}>₹{dayData.price_per_night}</span>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <FiCalendar size={48} />
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Quick Select Presets */}
      <div className={styles.quickSelect}>
        <button
          onClick={() => handleQuickSelect(7)}
          className={styles.quickBtn}
        >
          1 Week (15% off)
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className={styles.quickBtn}
        >
          1 Month (25% off)
        </button>
        <button
          onClick={() => handleQuickSelect(90)}
          className={styles.quickBtn}
        >
          3 Months (30% off)
        </button>
        {selectedCheckIn && (
          <button onClick={clearSelection} className={styles.clearBtn}>
            Clear Selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.availableDot}`}></span>
          Available
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.bookedDot}`}></span>
          Booked
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.blockedDot}`}></span>
          Blocked
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.selectedDot}`}></span>
          Selected
        </div>
      </div>

      {/* Selection Status */}
      {selectedCheckIn && (
        <div className={styles.selectionStatus}>
          <p>
            <strong>Check-in:</strong>{" "}
            {new Date(selectedCheckIn).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {selectedCheckOut && (
            <p>
              <strong>Check-out:</strong>{" "}
              {new Date(selectedCheckOut).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          {!selectedCheckOut && (
            <p className={styles.hint}>Click on check-out date</p>
          )}
        </div>
      )}

      {/* Month Navigation */}
      <div className={styles.header}>
        <button
          onClick={handlePreviousMonth}
          className={styles.navBtn}
          aria-label="Previous month"
        >
          <FiChevronLeft />
        </button>
        <h3 className={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={handleNextMonth}
          className={styles.navBtn}
          aria-label="Next month"
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendar}>
        {/* Day headers */}
        <div className={styles.dayHeader}>Sun</div>
        <div className={styles.dayHeader}>Mon</div>
        <div className={styles.dayHeader}>Tue</div>
        <div className={styles.dayHeader}>Wed</div>
        <div className={styles.dayHeader}>Thu</div>
        <div className={styles.dayHeader}>Fri</div>
        <div className={styles.dayHeader}>Sat</div>

        {/* Calendar days */}
        {renderMonth()}
      </div>

      {/* Help Text */}
      <p className={styles.helpText}>
        Click on a date to select check-in, then click another date for
        check-out. Minimum stay: {minStayNights} night
        {minStayNights > 1 ? "s" : ""}.
      </p>
    </div>
  );
}
