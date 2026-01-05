"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowLeft, FiCamera, FiMail, FiPhone, FiUser } from "react-icons/fi";
import "./profile.css";

// Extended user type with optional fields
type ProfileUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  role?: string;
  created_at?: string;
};

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  // Initialize formData with empty values
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize form data once when user is available (avoids cascading render warning)
  if (user && !isInitialized) {
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setIsInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // TODO: Implement API call to update profile
    setTimeout(() => {
      setSaving(false);
      alert("Profile updated successfully!");
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-inner">
        {/* Header */}
        <div className="profile-header">
          <button onClick={() => router.back()} className="back-button">
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div>
            <h1 className="profile-title">Edit Profile</h1>
            <p className="profile-subtitle">Update your personal information</p>
          </div>
        </div>

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                <FiUser size={48} />
              </div>
              <button className="avatar-upload-btn">
                <FiCamera size={16} />
              </button>
            </div>
            <div>
              <h3 className="avatar-name">{user.full_name}</h3>
              <p className="avatar-role">
                {(user as ProfileUser).role || "User"}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="full_name">
                  <FiUser size={18} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <FiMail size={18} />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled
                />
                <p className="form-help">Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  <FiPhone size={18} />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Account Info */}
          <div className="account-info">
            <h3 className="account-info-title">Account Information</h3>
            <div className="account-info-grid">
              <div className="account-info-item">
                <span className="account-info-label">Account Status</span>
                <span className="account-info-value status-active">
                  {user.status}
                </span>
              </div>
              <div className="account-info-item">
                <span className="account-info-label">Account Type</span>
                <span className="account-info-value">
                  {(user as ProfileUser).role || "User"}
                </span>
              </div>
              <div className="account-info-item">
                <span className="account-info-label">Member Since</span>
                <span className="account-info-value">
                  {(user as ProfileUser).created_at
                    ? new Date(
                        (user as ProfileUser).created_at!
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
