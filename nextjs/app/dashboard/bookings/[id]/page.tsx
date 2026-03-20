"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiLoader,
} from "react-icons/fi";
import { api } from "@/lib/axios";
import ReviewForm from "@/components/reviews/ReviewForm";
import styles from "./booking-detail.module.css";

interface BookingDetails {
  id: string;
  booking_number: string;
  property_id: string;
  property_title: string;
  property_description: string;
  property_images: { image_url: string }[];
  city_name: string;
  city_state: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  children_count: number;
  infants_count: number;
  nights: number;
  base_amount: number;
  extra_guest_charges: number;
  extra_children_charges: number;
  gst_amount: number;
  total_amount: number;
  discount_amount: number;
  coupon_code?: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  expires_at?: string; // SESSION 31: 12-hour expiry timestamp
  payments: Array<{
    id: string;
    payment_id: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }>;
  invoice?: {
    invoice_number: string;
    invoice_url: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  // SESSION 31: Force re-render every minute for countdown timer updates
  const [, setTimerTick] = useState(0);
  // SESSION 64: Review system state
  const [hasReview, setHasReview] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // SESSION 31: Update countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      // Handle both response formats: { data: booking } or booking directly
      const bookingData = response.data?.data || response.data;
      console.log("Booking data received:", bookingData);
      console.log("Property images:", bookingData.property_images);
      setBooking(bookingData);
    } catch (error: unknown) {
      console.error("Error fetching booking details:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setToast({
        message: errorMessage || "Failed to load booking details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  // SESSION 64: Check if user has already submitted a review for completed bookings
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!booking || booking.status !== "completed") return;

      try {
        setCheckingReview(true);
        const response = await api.get(`/bookings/${bookingId}/reviews/check`);
        setHasReview(response.data.hasReview || false);
      } catch (error: unknown) {
        console.error("Error checking review status:", error);
        // Silently fail - not critical to page rendering
      } finally {
        setCheckingReview(false);
      }
    };

    checkReviewStatus();
  }, [booking, bookingId]);

  // SESSION 31: Calculate countdown timer for pending bookings
  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expires in ${hours}h ${minutes}m`;
    } else {
      return `Expires in ${minutes}m`;
    }
  };

  const handleCancelRequest = async () => {
    if (
      !confirm(
        "Are you sure you want to request cancellation for this booking?",
      )
    ) {
      return;
    }

    try {
      setCanceling(true);
      await api.post(`/bookings/${bookingId}/cancel-request`);
      setToast({
        message: "Cancellation request submitted successfully",
        type: "success",
      });
      fetchBookingDetails(); // Refresh data
    } catch (error: unknown) {
      console.error("Error requesting cancellation:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setToast({
        message: errorMessage || "Failed to request cancellation",
        type: "error",
      });
    } finally {
      setCanceling(false);
    }
  };

  // SESSION 34: Handle Delete Pending Booking
  const handleDeletePendingBooking = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    try {
      setCanceling(true);
      await api.delete(`/bookings/${bookingId}/cancel-pending`);
      setToast({
        message: "Pending booking cancelled successfully",
        type: "success",
      });
      setShowDeleteModal(false);
      // Redirect to bookings list after successful deletion
      setTimeout(() => {
        router.push("/dashboard/bookings");
      }, 1500);
    } catch (error: unknown) {
      console.error("Error cancelling pending booking:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setToast({
        message: errorMessage || "Failed to cancel pending booking",
        type: "error",
      });
      setShowDeleteModal(false);
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; icon: React.ElementType; statusClass: string }
    > = {
      pending: {
        label: "Pending Payment",
        icon: FiClock,
        statusClass: "pending",
      },
      confirmed: {
        label: "Confirmed",
        icon: FiCheckCircle,
        statusClass: "confirmed",
      },
      cancel_requested: {
        label: "Cancellation Requested",
        icon: FiAlertCircle,
        statusClass: "pending",
      },
      cancelled: {
        label: "Cancelled",
        icon: FiXCircle,
        statusClass: "cancelled",
      },
      completed: {
        label: "Completed",
        icon: FiCheckCircle,
        statusClass: "completed",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`${styles.statusBadge} ${styles[config.statusClass]}`}>
        <Icon />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; statusClass: string }> =
      {
        pending: {
          label: "Pending",
          statusClass: "pending",
        },
        completed: {
          label: "Paid",
          statusClass: "paid",
        },
        failed: {
          label: "Failed",
          statusClass: "failed",
        },
        refunded: {
          label: "Refunded",
          statusClass: "refunded",
        },
      };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`${styles.paymentStatusBadge} ${styles[config.statusClass]}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>Booking Not Found</h2>
        <p className={styles.errorMessage}>
          The booking you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have permission to view it.
        </p>
        <Link href="/dashboard/bookings" className={styles.errorButton}>
          <FiArrowLeft />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const checkInDate = new Date(booking.check_in);
  const checkOutDate = new Date(booking.check_out);
  const canCancel = booking.status === "confirmed" && checkInDate > new Date();
  const today = new Date();

  // Helper function to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.bookingDetailPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.container}>
          <Link href="/dashboard/bookings" className={styles.backLink}>
            <FiArrowLeft />
            Back to Bookings
          </Link>

          <div className={styles.headerContent}>
            <div className={styles.headerTitle}>
              <p className={styles.bookingNumber}>
                Booking #{booking.booking_number}
              </p>
              <h1 className={styles.propertyTitle}>{booking.property_title}</h1>
            </div>
            <div className={styles.statusBadgeContainer}>
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.payment_status)}
              {/* SESSION 31: Countdown Timer Badge for Pending Bookings */}
              {(booking.status === "pending" ||
                booking.status === "pending_payment") &&
                booking.expires_at && (
                  <span className={styles.expiryBadge}>
                    <FiClock />
                    {calculateTimeLeft(booking.expires_at)}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* Horizontal Timeline */}
        <div className={styles.horizontalTimeline}>
          {/* Step 1: Booking Created */}
          <div className={styles.timelineStep}>
            <div className={`${styles.timelineStepIcon} ${styles.completed}`}>
              <FiCheckCircle />
            </div>
            <div className={styles.timelineStepContent}>
              <p className={styles.timelineStepTitle}>Created</p>
              <p className={styles.timelineStepDate}>
                {new Date(booking.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {(booking.payment_status === "completed" ||
              booking.status === "confirmed" ||
              booking.status === "completed") && (
              <div className={styles.timelineStepLine}></div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div className={styles.timelineStep}>
            <div
              className={`${styles.timelineStepIcon} ${
                booking.payment_status === "completed"
                  ? styles.completed
                  : styles.pending
              }`}
            >
              {booking.payment_status === "completed" ? (
                <FiCheckCircle />
              ) : (
                <FiClock />
              )}
            </div>
            <div className={styles.timelineStepContent}>
              <p className={styles.timelineStepTitle}>
                {booking.payment_status === "completed" ? "Paid" : "Payment"}
              </p>
              <p className={styles.timelineStepDate}>
                ₹{(booking.total_amount || 0).toLocaleString()}
              </p>
            </div>
            {(booking.status === "confirmed" ||
              booking.status === "completed") && (
              <div className={styles.timelineStepLine}></div>
            )}
          </div>

          {/* Step 3: Confirmed */}
          <div className={styles.timelineStep}>
            <div
              className={`${styles.timelineStepIcon} ${
                booking.status === "confirmed" || booking.status === "completed"
                  ? styles.completed
                  : booking.status === "cancelled"
                    ? styles.cancelled
                    : styles.pending
              }`}
            >
              {booking.status === "confirmed" ||
              booking.status === "completed" ? (
                <FiCheckCircle />
              ) : booking.status === "cancelled" ? (
                <FiXCircle />
              ) : (
                <FiClock />
              )}
            </div>
            <div className={styles.timelineStepContent}>
              <p className={styles.timelineStepTitle}>
                {booking.status === "confirmed" ||
                booking.status === "completed"
                  ? "Confirmed"
                  : booking.status === "cancelled"
                    ? "Cancelled"
                    : "Confirming"}
              </p>
              <p className={styles.timelineStepDate}>
                {booking.status === "confirmed" ||
                booking.status === "completed"
                  ? "Booking set"
                  : booking.status === "cancelled"
                    ? "Booking void"
                    : "Pending"}
              </p>
            </div>
            {booking.status !== "cancelled" &&
              booking.status !== "cancel_requested" &&
              (checkInDate <= today || booking.status === "completed") && (
                <div className={styles.timelineStepLine}></div>
              )}
          </div>

          {/* Step 4: Check-in */}
          {booking.status !== "cancelled" &&
            booking.status !== "cancel_requested" && (
              <div className={styles.timelineStep}>
                <div
                  className={`${styles.timelineStepIcon} ${
                    checkInDate <= today ? styles.completed : styles.pending
                  }`}
                >
                  {checkInDate <= today ? <FiCheckCircle /> : <FiClock />}
                </div>
                <div className={styles.timelineStepContent}>
                  <p className={styles.timelineStepTitle}>
                    {checkInDate <= today ? "Checked In" : "Check-in"}
                  </p>
                  <p className={styles.timelineStepDate}>
                    {formatDate(checkInDate).split(",")[0]}
                  </p>
                </div>
                {booking.status === "completed" && (
                  <div className={styles.timelineStepLine}></div>
                )}
              </div>
            )}

          {/* Step 5: Check-out */}
          {booking.status !== "cancelled" &&
            booking.status !== "cancel_requested" && (
              <div className={styles.timelineStep}>
                <div
                  className={`${styles.timelineStepIcon} ${
                    booking.status === "completed"
                      ? styles.completed
                      : styles.pending
                  }`}
                >
                  {booking.status === "completed" ? (
                    <FiCheckCircle />
                  ) : (
                    <FiClock />
                  )}
                </div>
                <div className={styles.timelineStepContent}>
                  <p className={styles.timelineStepTitle}>
                    {booking.status === "completed"
                      ? "Checked Out"
                      : "Check-out"}
                  </p>
                  <p className={styles.timelineStepDate}>
                    {formatDate(checkOutDate).split(",")[0]}
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* 4-Column Card Grid */}
        <div className={styles.cardGrid}>
          {/* Property Preview Card */}
          <div className={`${styles.card} ${styles.propertyPreviewCard}`}>
            {/* Large Property Image on Top */}
            <div className={styles.propertyImageContainer}>
              {booking.property_images && booking.property_images.length > 0 ? (
                <Image
                  src={booking.property_images[0].image_url}
                  alt={booking.property_title}
                  fill
                  priority
                  unoptimized
                  className={styles.propertyImageLarge}
                />
              ) : (
                <div className={styles.propertyImagePlaceholder}>
                  <FiMapPin size={48} />
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Property Details Below Image */}
            <div className={styles.propertyDetailsContent}>
              <h3 className={styles.propertyNameLarge}>
                {booking.property_title}
              </h3>
              <p className={styles.propertyLocationLarge}>
                <FiMapPin />
                {booking.city_name}, {booking.city_state}
              </p>

              {/* View Property Button */}
              <Link
                href={`/properties/${booking.property_id}`}
                className={styles.viewPropertyButton}
              >
                <FiMapPin />
                View Full Property Details
              </Link>
            </div>
          </div>

          {/* Booking Info Card */}
          <div className={`${styles.card} ${styles.bookingInfoCard}`}>
            <h3 className={styles.cardTitle}>Booking Info</h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <FiCalendar className={styles.infoIcon} />
                <div>
                  <p className={styles.infoLabel}>Check-in</p>
                  <p className={styles.infoValue}>{formatDate(checkInDate)}</p>
                  <p className={styles.infoHint}>After 2:00 PM</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <FiCalendar className={styles.infoIcon} />
                <div>
                  <p className={styles.infoLabel}>Check-out</p>
                  <p className={styles.infoValue}>{formatDate(checkOutDate)}</p>
                  <p className={styles.infoHint}>Before 11:00 AM</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <FiUsers className={styles.infoIcon} />
                <div>
                  <p className={styles.infoLabel}>Guests</p>
                  <p className={styles.infoValue}>
                    {booking.guest_count || 0} Adults
                    {(booking.children_count || 0) > 0 &&
                      `, ${booking.children_count} Children`}
                    {(booking.infants_count || 0) > 0 &&
                      `, ${booking.infants_count} Infants`}
                  </p>
                  <p className={styles.infoHint}>
                    {booking.nights || 0}{" "}
                    {(booking.nights || 0) === 1 ? "Night" : "Nights"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown Card */}
          <div className={`${styles.card} ${styles.priceCard}`}>
            <h3 className={styles.cardTitle}>Price Details</h3>
            <div className={styles.priceBreakdown}>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>
                  ₹
                  {(
                    (booking.base_amount || 0) / (booking.nights || 1)
                  ).toLocaleString()}{" "}
                  x {booking.nights} nights
                </span>
                <span className={styles.priceValue}>
                  ₹{(booking.base_amount || 0).toLocaleString()}
                </span>
              </div>

              {(booking.extra_guest_charges || 0) > 0 && (
                <div className={styles.priceItem}>
                  <span className={styles.priceLabel}>Extra Guests</span>
                  <span className={styles.priceValue}>
                    ₹{(booking.extra_guest_charges || 0).toLocaleString()}
                  </span>
                </div>
              )}

              {(booking.extra_children_charges || 0) > 0 && (
                <div className={styles.priceItem}>
                  <span className={styles.priceLabel}>Extra Children</span>
                  <span className={styles.priceValue}>
                    ₹{(booking.extra_children_charges || 0).toLocaleString()}
                  </span>
                </div>
              )}

              {booking.coupon_code && (booking.discount_amount || 0) > 0 && (
                <div className={`${styles.priceItem} ${styles.discount}`}>
                  <span className={styles.priceLabel}>
                    Discount ({booking.coupon_code})
                  </span>
                  <span className={styles.priceValue}>
                    -₹{(booking.discount_amount || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>GST (18%)</span>
                <span className={styles.priceValue}>
                  ₹{(booking.gst_amount || 0).toLocaleString()}
                </span>
              </div>

              <div className={styles.priceDivider}></div>

              <div className={`${styles.priceItem} ${styles.priceTotal}`}>
                <span className={styles.priceLabel}>Total Amount</span>
                <span className={styles.priceValue}>
                  ₹{(booking.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className={`${styles.card} ${styles.actionsCard}`}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
            <div className={styles.actionsList}>
              {/* SESSION 31/32: Continue Booking Button for Pending Bookings */}
              {(booking.status === "pending" ||
                booking.status === "pending_payment") && (
                <>
                  <Link
                    href={`/booking-review?bookingId=${booking.id}&checkIn=${
                      booking.check_in
                    }&checkOut=${booking.check_out}&adults=${
                      booking.guest_count - booking.children_count
                    }&children=${booking.children_count}`}
                    className={`${styles.actionButton} ${styles.continueBookingButton}`}
                  >
                    <FiCheckCircle />
                    Continue Booking
                  </Link>

                  {/* SESSION 34: Cancel Pending Booking Button */}
                  <button
                    onClick={handleDeletePendingBooking}
                    disabled={canceling}
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                  >
                    {canceling ? (
                      <>
                        <FiLoader className={styles.spinIcon} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiXCircle />
                        Cancel Booking
                      </>
                    )}
                  </button>
                </>
              )}

              {canCancel && (
                <button
                  onClick={handleCancelRequest}
                  disabled={canceling}
                  className={`${styles.actionButton} ${styles.cancelButton}`}
                >
                  {canceling ? (
                    <>
                      <FiLoader className={styles.spinIcon} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiXCircle />
                      Request Cancellation
                    </>
                  )}
                </button>
              )}

              {booking.invoice && (
                <a
                  href={booking.invoice.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.actionButton} ${styles.downloadButton}`}
                >
                  <FiArrowLeft style={{ transform: "rotate(-90deg)" }} />
                  Download Invoice
                </a>
              )}

              <Link
                href="/contact"
                className={`${styles.actionButton} ${styles.supportButton}`}
              >
                <FiAlertCircle />
                Contact Support
              </Link>
            </div>

            {canCancel && (
              <div className={styles.actionNote}>
                <FiAlertCircle />
                <p>Refund depends on cancellation policy</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History - Collapsible */}
        {booking.payments && booking.payments.length > 0 && (
          <div className={`${styles.card} ${styles.paymentHistoryCard}`}>
            <div className={styles.paymentHistoryHeader}>
              <h3 className={styles.cardTitle}>Payment History</h3>
              <button
                onClick={() => {
                  const section = document.getElementById("allPayments");
                  if (section) {
                    section.style.display =
                      section.style.display === "none" ? "block" : "none";
                  }
                }}
                className={styles.toggleButton}
              >
                Show All Payments ▼
              </button>
            </div>

            {/* Show last payment by default */}
            <div className={styles.paymentItem}>
              <div className={styles.paymentDetails}>
                <p className={styles.paymentId}>
                  ID: {booking.payments[0].payment_id}
                </p>
                <p className={styles.paymentDate}>
                  {new Date(booking.payments[0].created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
                <p className={styles.paymentMethod}>
                  {booking.payments[0].payment_method}
                </p>
              </div>
              <div className={styles.paymentRight}>
                <p className={styles.paymentAmount}>
                  ₹{(booking.payments[0].amount || 0).toLocaleString()}
                </p>
                {getPaymentStatusBadge(booking.payments[0].status)}
              </div>
            </div>

            {/* All payments - hidden by default */}
            {booking.payments.length > 1 && (
              <div id="allPayments" style={{ display: "none" }}>
                <div className={styles.priceDivider}></div>
                {booking.payments.slice(1).map((payment) => (
                  <div key={payment.id} className={styles.paymentItem}>
                    <div className={styles.paymentDetails}>
                      <p className={styles.paymentId}>
                        ID: {payment.payment_id}
                      </p>
                      <p className={styles.paymentDate}>
                        {new Date(payment.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                      <p className={styles.paymentMethod}>
                        {payment.payment_method}
                      </p>
                    </div>
                    <div className={styles.paymentRight}>
                      <p className={styles.paymentAmount}>
                        ₹{(payment.amount || 0).toLocaleString()}
                      </p>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SESSION 64: Review Section - Show for completed bookings only */}
        {booking.status === "completed" && (
          <div className={`${styles.card} ${styles.reviewCard}`}>
            <h3 className={styles.cardTitle}>Share Your Experience</h3>

            {checkingReview ? (
              <div className={styles.reviewLoading}>
                <FiLoader className={styles.spinner} />
                <p>Checking review status...</p>
              </div>
            ) : hasReview ? (
              <div className={styles.reviewThankYou}>
                <FiCheckCircle className={styles.thankYouIcon} />
                <h4>Thank You for Your Review!</h4>
                <p>
                  Your feedback helps other travelers make better decisions. We
                  appreciate you taking the time to share your experience!
                </p>
              </div>
            ) : (
              <div className={styles.reviewFormContainer}>
                <p className={styles.reviewPrompt}>
                  How was your stay at {booking.property_title}? Your honest
                  feedback helps us maintain quality and helps other travelers
                  make informed decisions.
                </p>
                <ReviewForm
                  bookingId={booking.id}
                  propertyName={booking.property_title}
                  onSuccess={() => {
                    setHasReview(true);
                    setToast({
                      message: "Thank you for your review!",
                      type: "success",
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* SESSION 34: Delete Confirmation Modal */}
      {showDeleteModal && booking && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <FiAlertCircle size={48} color="#EF4444" />
              <h2 className={styles.modalTitle}>Cancel Pending Booking?</h2>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Are you sure you want to cancel your pending booking for{" "}
                <strong>{booking.property_title}</strong>?
              </p>
              <p className={styles.modalWarning}>
                This action cannot be undone. You&apos;ll need to create a new
                booking if you change your mind.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => setShowDeleteModal(false)}
                disabled={canceling}
              >
                Keep Booking
              </button>
              <button
                className={styles.modalBtnDanger}
                onClick={confirmDeleteBooking}
                disabled={canceling}
              >
                {canceling ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.success : styles.error
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
