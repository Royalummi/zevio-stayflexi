"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError("Current password is required");
      return false;
    }
    if (!formData.newPassword) {
      setError("New password is required");
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "600px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href="/profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--primary)",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            ← Back to Profile
          </Link>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "8px",
            }}
          >
            Change Password
          </h1>
          <p style={{ color: "var(--gray-600)" }}>
            Update your password to keep your account secure
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "8px",
              color: "#155724",
              marginBottom: "24px",
            }}
          >
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "8px",
              color: "#721c24",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Password Change Form */}
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "24px" }}>
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "8px",
                  }}
                >
                  <FiLock size={16} />
                  Current Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    placeholder="Enter current password"
                    style={{
                      width: "100%",
                      padding: "12px 48px 12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--gray-600)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showCurrentPassword ? (
                      <FiEyeOff size={20} />
                    ) : (
                      <FiEye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "8px",
                  }}
                >
                  <FiLock size={16} />
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="Enter new password"
                    minLength={6}
                    style={{
                      width: "100%",
                      padding: "12px 48px 12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--gray-600)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showNewPassword ? (
                      <FiEyeOff size={20} />
                    ) : (
                      <FiEye size={20} />
                    )}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-600)",
                    marginTop: "4px",
                  }}
                >
                  Must be at least 6 characters
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "8px",
                  }}
                >
                  <FiLock size={16} />
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm new password"
                    style={{
                      width: "100%",
                      padding: "12px 48px 12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--gray-600)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={20} />
                    ) : (
                      <FiEye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: "8px" }}
              >
                {loading ? "Changing Password..." : "Change Password"}
              </button>
            </div>
          </form>

          {/* Security Tips */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid var(--gray-200)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--gray-900)",
                marginBottom: "12px",
              }}
            >
              Password Security Tips
            </h3>
            <ul
              style={{
                fontSize: "13px",
                color: "var(--gray-600)",
                lineHeight: "1.8",
                paddingLeft: "20px",
              }}
            >
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid common words and personal information</li>
              <li>Don&apos;t reuse passwords from other sites</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
