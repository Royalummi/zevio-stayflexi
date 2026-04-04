"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiArrowLeft,
  FiCamera,
  FiMail,
  FiPhone,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiCheckCircle,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";
import Image from "next/image";
import { api } from "@/lib/axios";
import styles from "./profile.module.css";

type BankDetails = {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
};

// Extended user type
type ProfileUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  role?: string;
  created_at?: string;
  avatar?: string;
  address?: string;
  bio?: string;
  bank_details?: BankDetails | null;
};

export default function ProfileRedesign() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    bio: "",
  });

  const [bankForm, setBankForm] = useState<BankDetails>({
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize form data
  useEffect(() => {
    if (user && !isInitialized) {
      const profileUser = user as ProfileUser;
      setFormData({
        full_name: profileUser.full_name || "",
        phone: profileUser.phone || "",
        address: profileUser.address || "",
        bio: profileUser.bio || "",
      });
      if (profileUser.bank_details) {
        setBankForm({
          bank_name: profileUser.bank_details.bank_name || "",
          account_holder_name:
            profileUser.bank_details.account_holder_name || "",
          account_number: profileUser.bank_details.account_number || "",
          ifsc_code: profileUser.bank_details.ifsc_code || "",
          branch_name: profileUser.bank_details.branch_name || "",
        });
      }
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className={styles.profileLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const profileUser = user as ProfileUser;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update profile via API
      await api.put("/auth/profile", {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      });

      setToast({
        message: "Profile updated successfully!",
        type: "success",
      });

      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setToast({
        message:
          err.response?.data?.message ||
          "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankForm({ ...bankForm, [e.target.name]: e.target.value });
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaving(true);
    try {
      await api.put("/auth/profile", { bank_details: bankForm });
      setToast({
        message: "Bank details saved successfully!",
        type: "success",
      });
      if (refreshUser) await refreshUser();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      setToast({
        message: err.response?.data?.message || "Failed to save bank details.",
        type: "error",
      });
    } finally {
      setBankSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({
        message: "Please select a valid image file",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        message: "Image size must be less than 5MB",
        type: "error",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setAvatarUploading(true);
    try {
      const avatarFormData = new FormData();
      avatarFormData.append("avatar", file);

      // Upload to backend
      await api.post("/auth/upload-avatar", avatarFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({
        message: "Profile photo updated successfully!",
        type: "success",
      });

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setToast({
        message:
          err.response?.data?.message ||
          "Failed to upload photo. Please try again.",
        type: "error",
      });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileInner}>
        {/* Header */}
        <div className={styles.profileHeader}>
          <button
            onClick={() => router.push("/dashboard")}
            className={styles.backButton}
          >
            <FiArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className={styles.profileTitle}>My Profile</h1>
            <p className={styles.profileSubtitle}>
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Premium Banner Card */}
        <div className={styles.profileBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                {avatarPreview || profileUser.avatar ? (
                  <Image
                    src={avatarPreview || profileUser.avatar || ""}
                    alt={profileUser.full_name}
                    width={120}
                    height={120}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <FiUser size={48} />
                  </div>
                )}
                <button
                  className={styles.avatarUploadBtn}
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  title="Upload profile photo"
                >
                  <FiCamera size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className={styles.avatarUploadInput}
                />
              </div>
            </div>

            <div className={styles.bannerInfo}>
              <h2 className={styles.bannerName}>{profileUser.full_name}</h2>
              <p className={styles.bannerRole}>
                {profileUser.role || "User"} Account
              </p>

              <div className={styles.bannerMeta}>
                <div className={styles.bannerMetaItem}>
                  <FiCalendar size={14} />
                  <span>Member since {formatDate(profileUser.created_at)}</span>
                </div>
                <div className={styles.bannerMetaItem}>
                  <FiMail size={14} />
                  <span>{profileUser.email}</span>
                </div>
                <div className={styles.bannerMetaItem}>
                  <FiCheckCircle size={14} />
                  <span style={{ textTransform: "capitalize" }}>
                    {profileUser.status || "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.profileGrid}>
          {/* Left Column - Settings Cards */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Personal Information Card */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FiUser size={24} />
                </div>
                <h3 className={styles.cardTitle}>Personal Information</h3>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="full_name">
                    <FiUser size={16} />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="email">
                    <FiMail size={16} />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profileUser.email}
                    className={styles.formInput}
                    disabled
                  />
                  <p className={styles.formHelp}>
                    Email cannot be changed for security reasons
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="phone">
                    <FiPhone size={16} />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="address">
                    <FiMapPin size={16} />
                    <span>Address</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="City, State, Country"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="bio">
                    <FiUser size={16} />
                    <span>Bio (Optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className={styles.formTextarea}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Bank Details + Security */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Bank Details Card */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FiCreditCard size={24} />
                </div>
                <h3 className={styles.cardTitle}>Bank Details</h3>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginBottom: "1.25rem",
                }}
              >
                Used for refunds and settlements. Your details are kept secure.
              </p>
              <form onSubmit={handleBankSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="bank_name">
                    <FiCreditCard size={16} />
                    <span>Bank Name</span>
                  </label>
                  <input
                    type="text"
                    id="bank_name"
                    name="bank_name"
                    value={bankForm.bank_name}
                    onChange={handleBankChange}
                    className={styles.formInput}
                    placeholder="e.g. State Bank of India"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label
                    className={styles.formLabel}
                    htmlFor="account_holder_name"
                  >
                    <FiUser size={16} />
                    <span>Account Holder Name</span>
                  </label>
                  <input
                    type="text"
                    id="account_holder_name"
                    name="account_holder_name"
                    value={bankForm.account_holder_name}
                    onChange={handleBankChange}
                    className={styles.formInput}
                    placeholder="As per bank records"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="account_number">
                    <FiCreditCard size={16} />
                    <span>Account Number</span>
                  </label>
                  <input
                    type="text"
                    id="account_number"
                    name="account_number"
                    value={bankForm.account_number}
                    onChange={handleBankChange}
                    className={styles.formInput}
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="ifsc_code">
                    <FiCreditCard size={16} />
                    <span>IFSC Code</span>
                  </label>
                  <input
                    type="text"
                    id="ifsc_code"
                    name="ifsc_code"
                    value={bankForm.ifsc_code}
                    onChange={handleBankChange}
                    className={styles.formInput}
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="branch_name">
                    <FiMapPin size={16} />
                    <span>Branch Name</span>
                  </label>
                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={bankForm.branch_name}
                    onChange={handleBankChange}
                    className={styles.formInput}
                    placeholder="e.g. Koramangala, Bengaluru"
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={bankSaving}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {bankSaving ? "Saving..." : "Save Bank Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Settings Card */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FiShield size={24} />
                </div>
                <h3 className={styles.cardTitle}>Security</h3>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => router.push("/change-password")}
                  className={styles.btnSecondary}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Change Password
                </button>

                <button
                  className={styles.btnSecondary}
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    setToast({
                      message: "Two-factor authentication coming soon!",
                      type: "success",
                    });
                  }}
                >
                  Enable Two-Factor Auth
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <FiShield size={24} color="#DC2626" />
            )}
          </div>
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
