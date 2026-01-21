"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/axios";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera,
} from "react-icons/fi";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: string;
  created_at: string;
  avatar?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/profile");
      setProfile(response.data.user);
      setFormData({
        name: response.data.user.name,
        phone: response.data.user.phone || "",
        address: response.data.user.address || "",
        city: response.data.user.city || "",
        state: response.data.user.state || "",
        pincode: response.data.user.pincode || "",
      });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await api.put("/auth/profile", formData);
      setProfile(response.data.user);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
      });
    }
    setEditing(false);
    setError("");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    try {
      setUploadingAvatar(true);
      setError("");

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(response.data.user);
      setSuccess("Avatar updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid var(--gray-200)",
            borderTop: "4px solid var(--primary)",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "16px", color: "var(--gray-600)" }}>
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--gray-600)" }}>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "8px",
            }}
          >
            My Profile
          </h1>
          <p style={{ color: "var(--gray-600)" }}>
            Manage your account information
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

        {/* Profile Card */}
        <div className="card" style={{ padding: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Avatar with Upload */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background:
                      avatarPreview || profile.avatar
                        ? `url(${avatarPreview || profile.avatar})`
                        : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "32px",
                    fontWeight: "700",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {!avatarPreview &&
                    !profile.avatar &&
                    profile.name.charAt(0).toUpperCase()}
                </div>

                {/* Upload Button Overlay */}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    border: "3px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: uploadingAvatar ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!uploadingAvatar) {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiCamera size={16} color="white" />
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>

              <div>
                {uploadingAvatar && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--primary)",
                      marginBottom: "4px",
                    }}
                  >
                    Uploading...
                  </p>
                )}
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "var(--gray-900)",
                    marginBottom: "4px",
                  }}
                >
                  {profile.name}
                </h2>
                <p
                  style={{
                    color: "var(--gray-600)",
                    textTransform: "capitalize",
                  }}
                >
                  {profile.role}
                </p>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FiEdit2 size={18} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
              }}
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
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
                  <FiUser size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "1px solid var(--gray-300)",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "all 0.2s",
                    backgroundColor: editing ? "white" : "var(--gray-50)",
                    cursor: editing ? "text" : "not-allowed",
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
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
                  <FiMail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "1px solid var(--gray-300)",
                    borderRadius: "8px",
                    backgroundColor: "var(--gray-50)",
                    cursor: "not-allowed",
                    color: "var(--gray-600)",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-600)",
                    marginTop: "4px",
                  }}
                >
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
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
                  <FiPhone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your phone number"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "1px solid var(--gray-300)",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "all 0.2s",
                    backgroundColor: editing ? "white" : "var(--gray-50)",
                    cursor: editing ? "text" : "not-allowed",
                  }}
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
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
                  <FiMapPin size={16} />
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your address"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    border: "1px solid var(--gray-300)",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "all 0.2s",
                    backgroundColor: editing ? "white" : "var(--gray-50)",
                    cursor: editing ? "text" : "not-allowed",
                  }}
                />
              </div>

              {/* City, State, Pincode Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    htmlFor="city"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--gray-700)",
                      marginBottom: "8px",
                    }}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="City"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                      backgroundColor: editing ? "white" : "var(--gray-50)",
                      cursor: editing ? "text" : "not-allowed",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--gray-700)",
                      marginBottom: "8px",
                    }}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="State"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                      backgroundColor: editing ? "white" : "var(--gray-50)",
                      cursor: editing ? "text" : "not-allowed",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--gray-700)",
                      marginBottom: "8px",
                    }}
                  >
                    Pincode
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Pincode"
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "14px",
                      border: "1px solid var(--gray-300)",
                      borderRadius: "8px",
                      outline: "none",
                      transition: "all 0.2s",
                      backgroundColor: editing ? "white" : "var(--gray-50)",
                      cursor: editing ? "text" : "not-allowed",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--gray-200)",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FiX size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FiSave size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Account Info */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid var(--gray-200)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--gray-900)",
                marginBottom: "12px",
              }}
            >
              Account Information
            </h3>
            <div style={{ fontSize: "14px", color: "var(--gray-600)" }}>
              <p>
                <strong>Member since:</strong>{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
