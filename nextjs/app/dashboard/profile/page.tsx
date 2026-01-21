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
  FiClock,
  FiHeart,
  FiHome,
  FiActivity,
} from "react-icons/fi";
import Image from "next/image";
import { api } from "@/lib/axios";
import styles from "./profile.module.css";

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
};

type ActivityLog = {
  id: string;
  title: string;
  timestamp: string;
  icon: typeof FiHome;
};

export default function ProfileRedesign() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
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

  // Activity logs from API
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [isInitialized, setIsInitialized] = useState(false);

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch activity logs
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await api.get("/auth/activity");
        const activityData = response.data.data?.activities || [];

        // Transform API data to match ActivityLog interface
        const transformedActivities = activityData.map((activity: any) => {
          let icon = FiActivity;
          let title = activity.action;

          // Map actions to icons and readable titles
          if (activity.action.toLowerCase().includes("booking")) {
            icon = FiCheckCircle;
            title = `${activity.action} - ${activity.entity}`;
          } else if (
            activity.action.toLowerCase().includes("wishlist") ||
            activity.action.toLowerCase().includes("favorite")
          ) {
            icon = FiHeart;
          } else if (
            activity.action.toLowerCase().includes("property") ||
            activity.action.toLowerCase().includes("view")
          ) {
            icon = FiHome;
          } else if (
            activity.action.toLowerCase().includes("profile") ||
            activity.action.toLowerCase().includes("update")
          ) {
            icon = FiUser;
          }

          // Format timestamp as relative time
          const createdAt = new Date(activity.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let timestamp;
          if (diffMins < 60) {
            timestamp = `${diffMins} ${
              diffMins === 1 ? "minute" : "minutes"
            } ago`;
          } else if (diffHours < 24) {
            timestamp = `${diffHours} ${
              diffHours === 1 ? "hour" : "hours"
            } ago`;
          } else {
            timestamp = `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
          }

          return {
            id: activity.id,
            title,
            timestamp,
            icon,
          };
        });

        setActivities(transformedActivities);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        // Set empty array on error
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    if (isAuthenticated) {
      fetchActivities();
    }
  }, [isAuthenticated]);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

              <div className={styles.bannerStats}>
                <div className={styles.bannerStat}>
                  <span className={styles.bannerStatValue}>12</span>
                  <span className={styles.bannerStatLabel}>Bookings</span>
                </div>
                <div className={styles.bannerStat}>
                  <span className={styles.bannerStatValue}>8</span>
                  <span className={styles.bannerStatLabel}>Favorites</span>
                </div>
                <div className={styles.bannerStat}>
                  <span className={styles.bannerStatValue}>Active</span>
                  <span className={styles.bannerStatLabel}>Status</span>
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

            {/* Activity Timeline Card */}
            <div className={styles.activityCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FiClock size={24} />
                </div>
                <h3 className={styles.cardTitle}>Recent Activity</h3>
              </div>

              <div className={styles.activityTimeline}>
                {activities.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <activity.icon size={18} />
                    </div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityTitle}>{activity.title}</p>
                      <p className={styles.activityTime}>
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Account Information Card */}
            <div className={styles.accountInfoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FiShield size={24} />
                </div>
                <h3 className={styles.cardTitle}>Account Details</h3>
              </div>

              <div className={styles.accountInfoGrid}>
                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>
                    Account Status
                  </span>
                  <span
                    className={`${styles.accountInfoValue} ${styles.statusActive}`}
                  >
                    {profileUser.status}
                  </span>
                </div>

                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>Account Type</span>
                  <span className={styles.accountInfoValue}>
                    {profileUser.role || "User"}
                  </span>
                </div>

                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>Member Since</span>
                  <span className={styles.accountInfoValue}>
                    <FiCalendar
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    {formatDate(profileUser.created_at)}
                  </span>
                </div>

                <div className={styles.accountInfoItem}>
                  <span className={styles.accountInfoLabel}>User ID</span>
                  <span
                    className={styles.accountInfoValue}
                    style={{ fontSize: "0.875rem", fontFamily: "monospace" }}
                  >
                    {profileUser.id}
                  </span>
                </div>
              </div>
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
