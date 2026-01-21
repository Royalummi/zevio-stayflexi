"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiSettings,
  FiHeart,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
} from "react-icons/fi";
import styles from "./dashboard.module.css";

interface Booking {
  id: string;
  booking_number?: string;
  property_id: string;
  property_title: string; // Backend returns 'property_title' not 'property_name'
  city_name?: string;
  city_state?: string;
  check_in: string;
  check_out: string;
  guest_count?: number;
  children_count?: number;
  nights?: number;
  total_amount: number;
  status: string;
  payment_status?: string;
  expires_at?: string; // SESSION 31: 12-hour expiry timestamp
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  // SESSION 31: Force re-render every minute for countdown timer updates
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // SESSION 31: Update countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user bookings
      const fetchBookings = async () => {
        try {
          const response = await api.get("/bookings/my");
          let bookingsData =
            response.data.data?.bookings || response.data.data || [];

          // SESSION 31: Filter out expired bookings completely
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
        } catch (error) {
          console.error("Failed to fetch bookings:", error);
          setBookings([]);
        } finally {
          setLoadingBookings(false);
        }
      };

      fetchBookings();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className={styles.dashboardLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

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

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.check_in) > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.check_out) < new Date()
  );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardInner}>
        {/* Welcome Section */}
        <div className={styles.dashboardWelcome}>
          <div>
            <h1 className={styles.dashboardTitle}>
              Welcome back, {user.full_name}!
            </h1>
            <p className={styles.dashboardSubtitle}>
              Manage your bookings and explore more luxury villas
            </p>
          </div>
          <div className={styles.dashboardAvatar}>
            <FiUser size={32} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.dashboardStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Total Bookings</p>
              <p className={styles.statValue}>{bookings.length}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiHome size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Upcoming Stays</p>
              <p className={styles.statValue}>{upcomingBookings.length}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCreditCard size={24} color="white" />
            </div>
            <div>
              <p className={styles.statLabel}>Past Bookings</p>
              <p className={styles.statValue}>{pastBookings.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActions}>
            <button
              onClick={() => router.push("/dashboard/favorites")}
              className={styles.actionCard}
            >
              <FiHeart size={24} />
              <span>Favourite Properties</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/bookings")}
              className={styles.actionCard}
            >
              <FiCalendar size={24} />
              <span>My Bookings</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/profile")}
              className={styles.actionCard}
            >
              <FiUser size={24} />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/settings")}
              className={styles.actionCard}
            >
              <FiSettings size={24} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Bookings</h2>
            <button
              onClick={() => router.push("/dashboard/bookings")}
              className={styles.viewAllLink}
            >
              View All
            </button>
          </div>

          {loadingBookings ? (
            <div className={styles.bookingsLoading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading your bookings...</p>
            </div>
          ) : bookings.length > 0 ? (
            <div className={styles.bookingsGrid}>
              {bookings.slice(0, 3).map((booking) => {
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case "confirmed":
                      return <FiCheckCircle size={16} />;
                    case "completed":
                      return <FiCheckCircle size={16} />;
                    case "cancelled":
                    case "cancel_requested":
                      return <FiXCircle size={16} />;
                    default:
                      return <FiClock size={16} />;
                  }
                };

                return (
                  <div
                    key={booking.id}
                    className={styles.bookingCard}
                    onClick={() =>
                      router.push(`/dashboard/bookings/${booking.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/dashboard/bookings/${booking.id}`);
                      }
                    }}
                  >
                    {/* Header */}
                    <div className={styles.bookingCardHeader}>
                      <div className={styles.bookingPropertyInfo}>
                        <h3 className={styles.bookingPropertyName}>
                          <FiHome size={18} />
                          {booking.property_title}
                        </h3>
                        {booking.city_name && (
                          <div className={styles.bookingLocation}>
                            <FiMapPin size={14} />
                            {booking.city_name}, {booking.city_state}
                          </div>
                        )}
                      </div>
                      <div className={styles.badgeGroup}>
                        <span
                          className={`${styles.bookingStatusBadge} ${
                            styles[
                              `status${
                                booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)
                              }`
                            ]
                          }`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status.replace("_", " ")}
                        </span>
                        {/* SESSION 31: Countdown Timer Badge */}
                        {(booking.status === "pending" ||
                          booking.status === "pending_payment") &&
                          booking.expires_at && (
                            <span className={styles.expiryBadge}>
                              <FiClock size={14} />
                              {calculateTimeLeft(booking.expires_at)}
                            </span>
                          )}
                      </div>
                      {/* SESSION 31/32: Continue Booking Button for Pending, View Details for Others */}
                      {booking.status === "pending" ||
                      booking.status === "pending_payment" ? (
                        <button
                          className={styles.continueBookingButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            // SESSION 32: Include dates/guests in URL for data restoration
                            const queryParams = new URLSearchParams({
                              bookingId: booking.id,
                              checkIn: booking.check_in,
                              checkOut: booking.check_out,
                              adults: (
                                (booking.guest_count || 2) -
                                (booking.children_count || 0)
                              ).toString(),
                              children: (
                                booking.children_count || 0
                              ).toString(),
                            });
                            router.push(
                              `/booking-review?${queryParams.toString()}`
                            );
                          }}
                        >
                          <FiCheckCircle size={16} />
                          Continue Booking
                        </button>
                      ) : (
                        <button
                          className={styles.viewDetailsButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/bookings/${booking.id}`);
                          }}
                        >
                          <FiEye size={16} />
                          View Details
                        </button>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className={styles.bookingDetailsGrid}>
                      <div className={styles.detailItem}>
                        <FiCalendar className={styles.detailIcon} />
                        <div>
                          <p className={styles.detailLabel}>Check-in</p>
                          <p className={styles.detailValue}>
                            {new Date(booking.check_in).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <FiCalendar className={styles.detailIcon} />
                        <div>
                          <p className={styles.detailLabel}>Check-out</p>
                          <p className={styles.detailValue}>
                            {new Date(booking.check_out).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <FiHome className={styles.detailIcon} />
                        <div>
                          <p className={styles.detailLabel}>Guests</p>
                          <p className={styles.detailValue}>
                            {booking.guest_count || 0}{" "}
                            {(booking.guest_count || 0) === 1
                              ? "Guest"
                              : "Guests"}
                            {booking.children_count &&
                            booking.children_count > 0
                              ? ` + ${booking.children_count} Children`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <FiCreditCard className={styles.detailIcon} />
                        <div>
                          <p className={styles.detailLabel}>Total Amount</p>
                          <p className={styles.detailValueLarge}>
                            ₹{booking.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiCalendar size={48} color="#9ca3af" />
              <h3>No bookings yet</h3>
              <p>
                Start exploring our luxury villas and make your first booking!
              </p>
              <button
                onClick={() => router.push("/properties")}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Browse Properties
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
