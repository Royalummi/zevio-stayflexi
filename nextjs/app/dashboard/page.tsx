"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiSettings,
} from "react-icons/fi";
import "./dashboard.css";

interface Booking {
  id: string;
  property_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

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
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.check_in) > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.check_out) < new Date()
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-inner">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div>
            <h1 className="dashboard-title">Welcome back, {user.full_name}!</h1>
            <p className="dashboard-subtitle">
              Manage your bookings and explore more luxury villas
            </p>
          </div>
          <div className="dashboard-avatar">
            <FiUser size={32} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FiCalendar size={24} color="white" />
            </div>
            <div>
              <p className="stat-label">Total Bookings</p>
              <p className="stat-value">{bookings.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiHome size={24} color="white" />
            </div>
            <div>
              <p className="stat-label">Upcoming Stays</p>
              <p className="stat-value">{upcomingBookings.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiCreditCard size={24} color="white" />
            </div>
            <div>
              <p className="stat-label">Past Bookings</p>
              <p className="stat-value">{pastBookings.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button
              onClick={() => router.push("/properties")}
              className="action-card"
            >
              <FiHome size={24} />
              <span>Browse Properties</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/bookings")}
              className="action-card"
            >
              <FiCalendar size={24} />
              <span>My Bookings</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/profile")}
              className="action-card"
            >
              <FiUser size={24} />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => router.push("/dashboard/settings")}
              className="action-card"
            >
              <FiSettings size={24} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Bookings</h2>
            <button
              onClick={() => router.push("/dashboard/bookings")}
              className="view-all-link"
            >
              View All
            </button>
          </div>

          {loadingBookings ? (
            <div className="bookings-loading">
              <div className="loading-spinner"></div>
              <p>Loading your bookings...</p>
            </div>
          ) : bookings.length > 0 ? (
            <div className="bookings-grid">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3 className="booking-property">
                      {booking.property_name}
                    </h3>
                    <span className={`booking-status status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-dates">
                      <FiCalendar size={16} />
                      <span>
                        {new Date(booking.check_in).toLocaleDateString()} -{" "}
                        {new Date(booking.check_out).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="booking-amount">
                      <FiCreditCard size={16} />
                      <span>₹{booking.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FiCalendar size={48} color="#9ca3af" />
              <h3>No bookings yet</h3>
              <p>
                Start exploring our luxury villas and make your first booking!
              </p>
              <button
                onClick={() => router.push("/properties")}
                className="btn btn-primary"
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
