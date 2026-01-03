"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiCalendar,
  FiHome,
  FiCreditCard,
  FiMapPin,
  FiArrowLeft,
} from "react-icons/fi";
import "./bookings.css";

interface Booking {
  id: string;
  property_id: string;
  property_name: string;
  property_location: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">(
    "all"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user bookings
      // TODO: Implement API call to fetch bookings
      // For now, using mock data
      setTimeout(() => {
        setBookings([]);
        setLoadingBookings(false);
      }, 1000);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="bookings-loading-page">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const now = new Date();
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "upcoming") {
      return new Date(booking.check_in) > now;
    } else if (activeTab === "past") {
      return new Date(booking.check_out) < now;
    }
    return true;
  });

  return (
    <div className="bookings-page-container">
      <div className="bookings-page-inner">
        {/* Header */}
        <div className="bookings-header">
          <button
            onClick={() => router.push("/dashboard")}
            className="back-button"
          >
            <FiArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="bookings-page-title">My Bookings</h1>
          <p className="bookings-page-subtitle">
            View and manage all your property bookings
          </p>
        </div>

        {/* Tabs */}
        <div className="bookings-tabs">
          <button
            onClick={() => setActiveTab("all")}
            className={`tab-button ${activeTab === "all" ? "active" : ""}`}
          >
            All Bookings
            <span className="tab-badge">{bookings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
          >
            Upcoming
            <span className="tab-badge">
              {bookings.filter((b) => new Date(b.check_in) > now).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`tab-button ${activeTab === "past" ? "active" : ""}`}
          >
            Past
            <span className="tab-badge">
              {bookings.filter((b) => new Date(b.check_out) < now).length}
            </span>
          </button>
        </div>

        {/* Bookings List */}
        <div className="bookings-content">
          {loadingBookings ? (
            <div className="bookings-loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your bookings...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="bookings-list">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-item-header">
                    <div>
                      <h3 className="booking-item-property">
                        {booking.property_name}
                      </h3>
                      <div className="booking-item-location">
                        <FiMapPin size={14} />
                        <span>{booking.property_location}</span>
                      </div>
                    </div>
                    <span
                      className={`booking-item-status status-${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-item-body">
                    <div className="booking-item-info">
                      <div className="info-item">
                        <FiCalendar size={18} color="#9333ea" />
                        <div>
                          <p className="info-label">Check-in</p>
                          <p className="info-value">
                            {new Date(booking.check_in).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiCalendar size={18} color="#9333ea" />
                        <div>
                          <p className="info-label">Check-out</p>
                          <p className="info-value">
                            {new Date(booking.check_out).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiHome size={18} color="#9333ea" />
                        <div>
                          <p className="info-label">Guests</p>
                          <p className="info-value">{booking.guests} Guests</p>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiCreditCard size={18} color="#9333ea" />
                        <div>
                          <p className="info-label">Total Amount</p>
                          <p className="info-value">
                            ₹{booking.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="booking-item-actions">
                      <button
                        onClick={() =>
                          router.push(`/properties/${booking.property_id}`)
                        }
                        className="action-button action-button-secondary"
                      >
                        View Property
                      </button>
                      <button className="action-button action-button-primary">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bookings-empty-state">
              <FiCalendar size={64} color="#d1d5db" />
              <h3>No bookings found</h3>
              <p>
                {activeTab === "upcoming"
                  ? "You don't have any upcoming bookings."
                  : activeTab === "past"
                  ? "You don't have any past bookings."
                  : "Start exploring our luxury villas and make your first booking!"}
              </p>
              <button
                onClick={() => router.push("/properties")}
                className="btn btn-primary"
                style={{ marginTop: "1.5rem" }}
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
