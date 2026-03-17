"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import {
  FiCalendar,
  FiHome,
  FiCreditCard,
  FiMapPin,
  FiArrowLeft,
  FiDownload,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiEye,
  FiFileText,
  FiSliders,
} from "react-icons/fi";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DateRangeSelector from "@/components/DateRangeSelector";
import styles from "./bookings.module.css";

interface Booking {
  id: string;
  property_id: string;
  property_title: string; // Backend returns 'property_title' not 'property_name'
  property_city: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  children_count?: number;
  total_amount: number;
  base_amount: number;
  extra_guest_charges?: number;
  gst_amount: number;
  status:
    | "confirmed"
    | "pending_payment"
    | "completed"
    | "cancelled"
    | "pending"
    | "expired";
  payment_status?: "pending" | "completed" | "failed" | "refunded"; // SESSION 47: Payment tracking
  payment_expires_at?: string; // SESSION 47: 15-minute payment window
  created_at: string;
  expires_at?: string; // SESSION 30: 12-hour expiry timestamp
}

type StatusType =
  | "all"
  | "confirmed"
  | "pending_payment"
  | "completed"
  | "cancelled";

export default function BookingsEnhanced() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<StatusType>("all");

  // SESSION 34: Confirmation modal for delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  // SESSION 34: Bulk cancel for pending bookings
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);

  // SESSION 30: Force re-render every minute for countdown timer updates
  const [, setTimerTick] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCheckIn, setFilterCheckIn] = useState<Date | null>(null);
  const [filterCheckOut, setFilterCheckOut] = useState<Date | null>(null);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // SESSION 30: Update countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);

      let bookingsData =
        response.data.data?.bookings || response.data.data || [];

      // SESSION 30: Filter out expired bookings completely
      const now = new Date();
      bookingsData = bookingsData.filter((booking: Booking) => {
        if (
          (booking.status === "pending" ||
            booking.status === "pending_payment") &&
          booking.expires_at
        ) {
          const expiryDate = new Date(booking.expires_at);
          return expiryDate > now; // Only show if not expired
        }
        return true; // Show all non-pending bookings
      });

      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setToast({
        message: "Failed to load bookings. Please try again.",
        type: "error",
      });
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (activeStatus !== "all") {
      filtered = filtered.filter((b) => b.status === activeStatus);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.property_title?.toLowerCase().includes(query) ||
          b.property_city?.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query),
      );
    }

    // Date range filter
    if (filterCheckIn) {
      filtered = filtered.filter((b) => new Date(b.check_in) >= filterCheckIn);
    }
    if (filterCheckOut) {
      filtered = filtered.filter(
        (b) => new Date(b.check_out) <= filterCheckOut,
      );
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(
        (b) => b.total_amount >= parseFloat(minAmount),
      );
    }
    if (maxAmount) {
      filtered = filtered.filter(
        (b) => b.total_amount <= parseFloat(maxAmount),
      );
    }

    setFilteredBookings(filtered);
    setPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCheckIn(null);
    setFilterCheckOut(null);
    setMinAmount("");
    setMaxAmount("");
    setActiveStatus("all");
    setFilteredBookings(bookings);
    setPage(1);
    setShowDatePicker(false);
  };

  // ============================================
  // NEW FEATURE: Export to CSV using backend API
  // ============================================
  const exportToCSV = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("export", "true");

      if (activeStatus !== "all") {
        params.append("status", activeStatus);
      }

      // Download CSV from backend
      const response = await api.get(
        `${API_ENDPOINTS.BOOKINGS.MY_BOOKINGS}?${params.toString()}`,
        {
          responseType: "blob", // Important for file download
        },
      );

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({
        message: "Bookings exported successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Export failed:", error);
      setToast({
        message: "Failed to export bookings. Please try again.",
        type: "error",
      });
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export with jsPDF library
    setToast({
      message: "PDF export coming soon!",
      type: "success",
    });
  };

  // SESSION 30: Handle Continue Booking (navigate to booking-review with bookingId)
  const handleContinueBooking = (booking: Booking) => {
    router.push(`/booking-review?bookingId=${booking.id}`);
  };

  // SESSION 34: Handle Delete/Cancel Pending Booking
  const handleDeletePendingBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await api.delete(`/api/bookings/${bookingToDelete.id}/cancel-pending`);
      setToast({
        message: "Pending booking cancelled successfully!",
        type: "success",
      });
      setShowDeleteModal(false);
      setBookingToDelete(null);
      fetchBookings(); // Refresh bookings list
    } catch (error) {
      console.error("Cancel booking error:", error);
      const axiosError = error as AxiosError<{ message: string }> | Error;
      const errorMsg =
        axiosError instanceof AxiosError
          ? axiosError.response?.data?.message || "Failed to cancel booking"
          : axiosError.message || "Failed to cancel booking. Please try again.";
      setToast({
        message: errorMsg,
        type: "error",
      });
      setShowDeleteModal(false);
    }
  };

  // SESSION 34: Bulk Cancel Handlers
  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId],
    );
  };

  const handleSelectAll = () => {
    const pendingBookings = paginatedBookings.filter(
      (b) => b.status === "pending" || b.status === "pending_payment",
    );

    if (selectedBookings.length === pendingBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(pendingBookings.map((b) => b.id));
    }
  };

  const handleBulkCancel = () => {
    if (selectedBookings.length === 0) return;
    setShowBulkCancelModal(true);
  };

  const confirmBulkCancel = async () => {
    try {
      await Promise.all(
        selectedBookings.map((id) =>
          api.delete(`/api/bookings/${id}/cancel-pending`),
        ),
      );

      setToast({
        message: `${selectedBookings.length} booking(s) cancelled successfully!`,
        type: "success",
      });

      setShowBulkCancelModal(false);
      setSelectedBookings([]);
      fetchBookings();
    } catch (error) {
      console.error("Bulk cancel failed:", error);
      const axiosError = error as AxiosError<{ message: string }> | Error;
      const errorMsg =
        axiosError instanceof AxiosError
          ? axiosError.response?.data?.message || "Failed to cancel bookings"
          : axiosError.message ||
            "Failed to cancel bookings. Please try again.";
      setToast({
        message: errorMsg,
        type: "error",
      });
      setShowBulkCancelModal(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <FiCheckCircle size={18} />;
      case "pending_payment":
      case "pending":
        return <FiClock size={18} />;
      case "completed":
        return <FiCheckCircle size={18} />;
      case "cancelled":
        return <FiXCircle size={18} />;
      default:
        return <FiAlertCircle size={18} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return styles.statusConfirmed;
      case "pending_payment":
        return styles.statusPendingPayment;
      case "pending":
        return styles.statusPending;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // SESSION 30 + SESSION 47: Calculate countdown timer for pending bookings
  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // SESSION 47: Check if user can check-in (only confirmed + payment completed)
  const canUserCheckIn = (booking: Booking): boolean => {
    return (
      booking.status === "confirmed" &&
      booking.payment_status === "completed" &&
      new Date(booking.check_in) <= new Date()
    );
  };

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      pending_payment: bookings.filter(
        (b) => b.status === "pending_payment" || b.status === "pending",
      ).length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  };

  const paginatedBookings = filteredBookings.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  if (isLoading || !user) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className={styles.bookingsContainer}>
      <div className={styles.bookingsInner}>
        {/* Header */}
        <div className={styles.bookingsHeader}>
          <button
            onClick={() => router.push("/dashboard")}
            className={styles.backButton}
          >
            <FiArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1>My Bookings</h1>
              <p>
                {filteredBookings.length > 0
                  ? `${filteredBookings.length} ${
                      filteredBookings.length === 1 ? "booking" : "bookings"
                    } found`
                  : "No bookings found"}
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                onClick={exportToCSV}
                className={styles.exportBtn}
                disabled={filteredBookings.length === 0}
              >
                <FiDownload size={18} />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className={styles.exportBtn}
                disabled={filteredBookings.length === 0}
              >
                <FiFileText size={18} />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersRow}>
            {/* Search */}
            <div className={styles.filterInputWrap}>
              <FiSearch className={styles.filterIcon} size={16} />
              <input
                type="text"
                placeholder="Search by name, city, or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.filterInlineInput}
              />
            </div>

            <div className={styles.filterDivider} />

            {/* Date Range */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={styles.filterDateBtn}
                onClick={() => setShowDatePicker((v) => !v)}
              >
                <FiCalendar size={15} />
                {filterCheckIn || filterCheckOut ? (
                  <span className={styles.filterDateValue}>
                    {filterCheckIn
                      ? filterCheckIn.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Any"}
                    {" – "}
                    {filterCheckOut
                      ? filterCheckOut.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Any"}
                  </span>
                ) : (
                  <span className={styles.filterDatePlaceholder}>Dates</span>
                )}
                {(filterCheckIn || filterCheckOut) && (
                  <span
                    role="button"
                    className={styles.dateRangeClear}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterCheckIn(null);
                      setFilterCheckOut(null);
                    }}
                  >
                    <FiX size={13} />
                  </span>
                )}
              </button>
              {showDatePicker && (
                <div className={styles.datePickerDropdown}>
                  <DateRangeSelector
                    checkIn={filterCheckIn}
                    checkOut={filterCheckOut}
                    onCheckInChange={(d) => setFilterCheckIn(d)}
                    onCheckOutChange={(d) => {
                      setFilterCheckOut(d);
                      if (d) setShowDatePicker(false);
                    }}
                    isOpen={showDatePicker}
                    onOpenChange={setShowDatePicker}
                    inline
                  />
                </div>
              )}
            </div>

            <div className={styles.filterDivider} />

            {/* Amount Range */}
            <div className={styles.filterAmountRow}>
              <FiCreditCard size={15} className={styles.filterIcon} />
              <input
                type="number"
                placeholder="Min ₹"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className={styles.filterAmountInput}
                min={0}
              />
              <span className={styles.amountSep}>–</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className={styles.filterAmountInput}
                min={0}
              />
            </div>

            <div className={styles.filterDivider} />

            {/* Actions */}
            <button onClick={clearFilters} className={styles.filterClearBtn}>
              <FiX size={14} />
              Clear
            </button>
            <button onClick={applyFilters} className={styles.filterApplyBtn}>
              <FiSliders size={14} />
              Apply
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className={styles.statusTabs}>
          <button
            onClick={() => {
              setActiveStatus("all");
              setPage(1);
            }}
            className={`${styles.statusTab} ${
              activeStatus === "all" ? styles.active : ""
            }`}
          >
            All Bookings
            <span className={styles.statusBadge}>{statusCounts.all}</span>
          </button>
          <button
            onClick={() => {
              setActiveStatus("confirmed");
              setPage(1);
            }}
            className={`${styles.statusTab} ${
              activeStatus === "confirmed" ? styles.active : ""
            }`}
          >
            Confirmed
            <span className={styles.statusBadge}>{statusCounts.confirmed}</span>
          </button>
          <button
            onClick={() => {
              setActiveStatus("pending_payment");
              setPage(1);
            }}
            className={`${styles.statusTab} ${
              activeStatus === "pending_payment" ? styles.active : ""
            }`}
          >
            Pending
            <span className={styles.statusBadge}>
              {statusCounts.pending_payment}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveStatus("completed");
              setPage(1);
            }}
            className={`${styles.statusTab} ${
              activeStatus === "completed" ? styles.active : ""
            }`}
          >
            Completed
            <span className={styles.statusBadge}>{statusCounts.completed}</span>
          </button>
          <button
            onClick={() => {
              setActiveStatus("cancelled");
              setPage(1);
            }}
            className={`${styles.statusTab} ${
              activeStatus === "cancelled" ? styles.active : ""
            }`}
          >
            Cancelled
            <span className={styles.statusBadge}>{statusCounts.cancelled}</span>
          </button>
        </div>

        {/* SESSION 34: Bulk Actions Toolbar */}
        {(activeStatus === "pending_payment" || activeStatus === "all") &&
          paginatedBookings.some(
            (b) => b.status === "pending" || b.status === "pending_payment",
          ) && (
            <div className={styles.bulkActionsToolbar}>
              <label className={styles.selectAllCheckbox}>
                <input
                  type="checkbox"
                  checked={
                    selectedBookings.length > 0 &&
                    selectedBookings.length ===
                      paginatedBookings.filter(
                        (b) =>
                          b.status === "pending" ||
                          b.status === "pending_payment",
                      ).length
                  }
                  onChange={handleSelectAll}
                />
                <span>
                  Select All Pending (
                  {
                    paginatedBookings.filter(
                      (b) =>
                        b.status === "pending" ||
                        b.status === "pending_payment",
                    ).length
                  }
                  )
                </span>
              </label>

              {selectedBookings.length > 0 && (
                <button
                  onClick={handleBulkCancel}
                  className={styles.bulkCancelBtn}
                >
                  <FiXCircle size={18} />
                  Cancel {selectedBookings.length} Selected
                </button>
              )}
            </div>
          )}

        {/* Bookings List */}
        {loading ? (
          <div className={styles.loadingPage}>
            <LoadingSpinner />
            <p>Loading bookings...</p>
          </div>
        ) : paginatedBookings.length > 0 ? (
          <>
            <div className={styles.bookingsList}>
              {paginatedBookings.map((booking) => (
                <div key={booking.id} className={styles.bookingCard}>
                  {/* SESSION 34: Checkbox for bulk selection */}
                  {(booking.status === "pending" ||
                    booking.status === "pending_payment") && (
                    <label className={styles.bookingCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={() => handleSelectBooking(booking.id)}
                      />
                    </label>
                  )}

                  <div className={styles.bookingCardHeader}>
                    <div className={styles.bookingPropertyInfo}>
                      <h3 className={styles.bookingPropertyName}>
                        <FiHome size={20} />
                        {booking.property_title || "Property"}
                        <span className={styles.bookingId}>
                          #{booking.id.slice(0, 8)}
                        </span>
                      </h3>
                      <div className={styles.bookingLocation}>
                        <FiMapPin size={16} />
                        {booking.property_city || "Location"}
                      </div>
                    </div>
                    <div className={styles.badgeGroup}>
                      <span
                        className={`${
                          styles.bookingStatusBadge
                        } ${getStatusClass(booking.status)}`}
                      >
                        {getStatusIcon(booking.status)}
                        {booking.status.replace("_", " ")}
                      </span>
                      {/* SESSION 30: Show countdown timer for pending bookings */}
                      {(booking.status === "pending" ||
                        booking.status === "pending_payment") &&
                        booking.expires_at && (
                          <span className={styles.expiryBadge}>
                            <FiClock size={14} />
                            {calculateTimeLeft(booking.expires_at)}
                          </span>
                        )}
                      {/* SESSION 47: Check-In Today badge */}
                      {canUserCheckIn(booking) && (
                        <span className={styles.checkInTodayBadge}>
                          🏠 Check-In Today!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.bookingDetailsGrid}>
                    {/* SESSION 47: Hide check-in details for pending payment bookings */}
                    {booking.status === "pending_payment" &&
                    booking.payment_status === "pending" ? (
                      <div className={styles.paymentPendingNotice}>
                        <div className={styles.paymentWarning}>
                          <FiAlertCircle size={24} />
                          <div>
                            <h4>Payment Required</h4>
                            <p>
                              Complete payment within{" "}
                              {booking.payment_expires_at &&
                                calculateTimeLeft(
                                  booking.payment_expires_at,
                                )}{" "}
                              to confirm your booking
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.detailItem}>
                          <div className={styles.detailIcon}>
                            <FiCalendar size={18} />
                          </div>
                          <div className={styles.detailContent}>
                            <p className={styles.detailLabel}>Check-in</p>
                            <p className={styles.detailValue}>
                              {formatDate(booking.check_in)}
                            </p>
                          </div>
                        </div>

                        <div className={styles.detailItem}>
                          <div className={styles.detailIcon}>
                            <FiCalendar size={18} />
                          </div>
                          <div className={styles.detailContent}>
                            <p className={styles.detailLabel}>Check-out</p>
                            <p className={styles.detailValue}>
                              {formatDate(booking.check_out)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className={styles.detailItem}>
                      <div className={styles.detailIcon}>
                        <FiHome size={18} />
                      </div>
                      <div className={styles.detailContent}>
                        <p className={styles.detailLabel}>Guests</p>
                        <p className={styles.detailValue}>
                          {booking.guest_count}{" "}
                          {booking.guest_count === 1 ? "Guest" : "Guests"}
                          {booking.children_count &&
                            booking.children_count > 0 &&
                            ` + ${booking.children_count} Children`}
                        </p>
                      </div>
                    </div>

                    <div className={styles.detailItem}>
                      <div className={styles.detailIcon}>
                        <FiCreditCard size={18} />
                      </div>
                      <div className={styles.detailContent}>
                        <p className={styles.detailLabel}>Total Amount</p>
                        <p className={styles.detailValueLarge}>
                          ₹{booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SESSION 47: Enhanced Action Section with Prominent Cancel Button */}
                  <div className={styles.bookingActions}>
                    {booking.status === "pending_payment" &&
                    booking.payment_status === "pending" ? (
                      <div className={styles.pendingPaymentActions}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnPrimaryLarge}`}
                          onClick={() => handleContinueBooking(booking)}
                        >
                          <FiCheckCircle size={20} />
                          <div className={styles.buttonContent}>
                            <strong>Complete Payment</strong>
                            <small>
                              Expires in{" "}
                              {booking.payment_expires_at &&
                                calculateTimeLeft(booking.payment_expires_at)}
                            </small>
                          </div>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnCancelLarge}`}
                          onClick={() => handleDeletePendingBooking(booking)}
                        >
                          <FiXCircle size={18} />
                          Cancel Booking
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            router.push(`/properties/${booking.property_id}`)
                          }
                          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                        >
                          <FiHome size={16} />
                          View Property
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          onClick={() =>
                            router.push(`/dashboard/bookings/${booking.id}`)
                          }
                        >
                          <FiEye size={16} />
                          View Details
                        </button>
                        {booking.status === "confirmed" && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => {
                              setToast({
                                message: "Cancellation feature coming soon!",
                                type: "success",
                              });
                            }}
                          >
                            <FiXCircle size={16} />
                            Request Cancellation
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredBookings.length > itemsPerPage && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.paginationBtn}
                >
                  Previous
                </button>
                <span className={styles.paginationInfo}>
                  Page {page} of{" "}
                  {Math.ceil(filteredBookings.length / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        Math.ceil(filteredBookings.length / itemsPerPage),
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    page === Math.ceil(filteredBookings.length / itemsPerPage)
                  }
                  className={styles.paginationBtn}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiCalendar size={48} />
            </div>
            <h3 className={styles.emptyTitle}>No bookings found</h3>
            <p className={styles.emptyText}>
              {activeStatus !== "all"
                ? `You don't have any ${activeStatus.replace(
                    "_",
                    " ",
                  )} bookings.`
                : "Start exploring our luxury villas and make your first booking!"}
            </p>
            <button
              onClick={() => router.push("/properties")}
              className={styles.emptyAction}
            >
              <FiHome size={18} />
              Browse Properties
            </button>
          </div>
        )}
      </div>

      {/* SESSION 34: Delete Confirmation Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FiAlertCircle size={48} color="#EF4444" />
              <h2 className={styles.modalTitle}>Cancel Pending Booking?</h2>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Are you sure you want to cancel your pending booking for{" "}
                <strong>{bookingToDelete.property_title}</strong>?
              </p>
              <p className={styles.modalWarning}>
                This action cannot be undone. You&apos;ll need to create a new
                booking if you change your mind.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => {
                  setShowDeleteModal(false);
                  setBookingToDelete(null);
                }}
              >
                Keep Booking
              </button>
              <button
                className={styles.modalBtnDanger}
                onClick={confirmDeleteBooking}
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION 34: Bulk Cancel Modal */}
      {showBulkCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FiAlertCircle size={48} color="#EF4444" />
              <h2 className={styles.modalTitle}>
                Cancel {selectedBookings.length} Booking(s)?
              </h2>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Are you sure you want to cancel{" "}
                <strong>{selectedBookings.length} pending booking(s)</strong>?
              </p>
              <p className={styles.modalWarning}>
                This action cannot be undone. You&apos;ll need to create new
                bookings if you change your mind.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => {
                  setShowBulkCancelModal(false);
                }}
              >
                Keep Bookings
              </button>
              <button
                className={styles.modalBtnDanger}
                onClick={confirmBulkCancel}
              >
                Yes, Cancel All Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
        >
          <div className={styles.toastIcon}>
            {toast.type === "success" ? (
              <FiCheckCircle size={24} color="#059669" />
            ) : (
              <FiXCircle size={24} color="#DC2626" />
            )}
          </div>
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
