"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import Link from "next/link";
import {
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiHome,
  FiList,
} from "react-icons/fi";
import styles from "./booking-success.module.css";

interface Booking {
  id: string;
  property_title?: string;
  property_name?: string;
  property_city?: string;
  city_name?: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  children_count?: number;
  total_amount: number;
  status: string;
}

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const bookingId = searchParams.get("bookingId");
  // orderId is appended to returnUrl so we can call verifyPayment after external redirect
  const orderId = searchParams.get("orderId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Wait for AuthContext to finish loading before checking user
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (!bookingId) {
      router.push("/dashboard/bookings");
      return;
    }

    const initPage = async () => {
      try {
        // If orderId is present we arrived from a Cashfree external redirect —
        // call verifyPayment first before fetching booking details
        if (orderId) {
          setVerifying(true);
          try {
            await api.post("/payments/verify", {
              order_id: orderId,
              booking_id: bookingId,
            });
          } catch (verifyError) {
            // Verification may fail if already verified (idempotent) — continue
            console.warn("verifyPayment on redirect:", verifyError);
          } finally {
            setVerifying(false);
          }
        }

        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data.data);
      } catch (error) {
        console.error("Failed to fetch booking:", error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [authLoading, user, bookingId, orderId, router]);

  if (authLoading || loading || verifying) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>
            {verifying
              ? "Confirming your payment..."
              : "Loading booking details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <p>Booking not found</p>
          <Link href="/dashboard/bookings" className={styles.link}>
            View All Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        {/* Success Header — content depends on actual booking status */}
        <div className={styles.successHeader}>
          <div className={styles.successIcon}>
            {isConfirmed ? <FiCheckCircle /> : <FiClock />}
          </div>
          <h1 className={styles.successTitle}>
            {isConfirmed ? "Booking Confirmed!" : "Payment Pending"}
          </h1>
          <p className={styles.successSubtitle}>
            {isConfirmed ? (
              <>
                Your booking has been successfully confirmed. We&apos;ve sent a
                confirmation email to <strong>{user?.email}</strong>
              </>
            ) : (
              "Your payment is being processed. This page will update once confirmation is received."
            )}
          </p>
          <p className={styles.bookingId}>
            Booking ID: <strong>{bookingId}</strong>
          </p>
        </div>

        {/* Booking Details Card */}
        <div className={styles.detailsCard}>
          <h2 className={styles.cardTitle}>Booking Details</h2>
          <div className={styles.detailsGrid}>
            {/* Property Info */}
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>
                <FiHome /> Property
              </h3>
              <p className={styles.propertyName}>
                {booking.property_title || booking.property_name}
              </p>
              <p className={styles.propertyLocation}>
                <FiMapPin /> {booking.city_name || booking.property_city}
              </p>
            </div>

            {/* Dates */}
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>
                <FiCalendar /> Check-in & Check-out
              </h3>
              <p className={styles.dateInfo}>
                <strong>Check-in:</strong>{" "}
                {new Date(booking.check_in).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className={styles.dateInfo}>
                <strong>Check-out:</strong>{" "}
                {new Date(booking.check_out).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className={styles.nightsInfo}>
                {booking.nights} {booking.nights === 1 ? "Night" : "Nights"}
              </p>
            </div>

            {/* Guests */}
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>
                <FiUsers /> Guests
              </h3>
              <p className={styles.guestInfo}>
                {booking.guest_count}{" "}
                {booking.guest_count === 1 ? "Guest" : "Guests"}
              </p>
              {(booking.children_count ?? 0) > 0 && (
                <p className={styles.guestInfo}>
                  {booking.children_count}{" "}
                  {booking.children_count === 1 ? "Child" : "Children"}
                </p>
              )}
            </div>

            {/* Payment */}
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Payment</h3>
              <p className={styles.amountPaid}>
                ₹{(booking.total_amount || 0).toLocaleString("en-IN")}
              </p>
              <p className={styles.paymentStatus}>
                Status:{" "}
                <span
                  className={
                    isConfirmed ? styles.statusPaid : styles.statusPending
                  }
                >
                  {isConfirmed ? "Paid" : "Pending"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className={styles.nextStepsCard}>
          <h2 className={styles.cardTitle}>What&apos;s Next?</h2>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Check Your Email</h3>
                <p>
                  We&apos;ve sent a confirmation email with your booking details
                  and check-in instructions.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Download Invoice</h3>
                <p>
                  You can download your invoice from the booking details page.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Property Contact</h3>
                <p>
                  The property owner will contact you 24 hours before check-in
                  with directions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsContainer}>
          <Link
            href={`/dashboard/bookings/${bookingId}`}
            className={styles.primaryButton}
          >
            <FiList /> View Booking Details
          </Link>
          <Link href="/dashboard/bookings" className={styles.secondaryButton}>
            <FiList /> All Bookings
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            <FiHome /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
