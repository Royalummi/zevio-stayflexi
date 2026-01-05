"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowLeft, FiBell, FiLock, FiMail, FiShield } from "react-icons/fi";
import "./settings.css";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="settings-container">
      <div className="settings-inner">
        {/* Header */}
        <div className="settings-header">
          <button onClick={() => router.back()} className="back-button">
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your account preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="settings-grid">
          {/* Notifications */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                <FiBell size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Notifications</h3>
                <p className="settings-card-desc">
                  Manage how you receive notifications
                </p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="setting-item">
                <div>
                  <p className="setting-label">Email Notifications</p>
                  <p className="setting-desc">
                    Receive booking updates via email
                  </p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <p className="setting-label">Promotional Emails</p>
                  <p className="setting-desc">Get special offers and deals</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                <FiLock size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Security</h3>
                <p className="settings-card-desc">
                  Manage your account security
                </p>
              </div>
            </div>
            <div className="settings-card-body">
              <button
                onClick={() => router.push("/change-password")}
                className="setting-action-btn"
              >
                Change Password
              </button>
              <button className="setting-action-btn">
                Two-Factor Authentication
                <span className="badge">Coming Soon</span>
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                <FiShield size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Privacy</h3>
                <p className="settings-card-desc">
                  Control your privacy settings
                </p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="setting-item">
                <div>
                  <p className="setting-label">Profile Visibility</p>
                  <p className="setting-desc">Make profile visible to others</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <p className="setting-label">Show Booking History</p>
                  <p className="setting-desc">Display your past bookings</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">
                <FiMail size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Email Preferences</h3>
                <p className="settings-card-desc">
                  Customize email communications
                </p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="setting-item">
                <div>
                  <p className="setting-label">Newsletter</p>
                  <p className="setting-desc">Monthly travel inspiration</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div>
                  <p className="setting-label">Booking Reminders</p>
                  <p className="setting-desc">Reminders before check-in</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3 className="danger-title">Danger Zone</h3>
          <div className="danger-content">
            <div>
              <p className="danger-label">Delete Account</p>
              <p className="danger-desc">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
