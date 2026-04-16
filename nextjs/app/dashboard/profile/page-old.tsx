"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowLeft, FiCamera, FiMail, FiPhone, FiUser } from "react-icons/fi";
import styles from "./profile.module.css";

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
      <div className={styles.profileLoading}>
        <div className={styles.loadingSpinner}></div>
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
    <div className={styles.profileContainer}>
      <div className={styles.profileInner}>
        {/* Header */}
        <div className={styles.profileHeader}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div>
            <h1 className={styles.profileTitle}>Edit Profile</h1>
            <p className={styles.profileSubtitle}>
              Update your personal information
            </p>
          </div>
        </div>

        <div className={styles.profileContent}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarPlaceholder}>
                <FiUser size={48} />
              </div>
              <button className={styles.avatarUploadBtn}>
                <FiCamera size={16} />
              </button>
            </div>
            <div>
              <h3 className={styles.avatarName}>{user.full_name}</h3>
              <p className={styles.avatarRole}>
                {(user as ProfileUser).role || "User"}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Personal Information</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="full_name">
                  <FiUser size={18} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="email">
                  <FiMail size={18} />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                  disabled
                />
                <p className={styles.formHelp}>Email cannot be changed</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="phone">
                  <FiPhone size={18} />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.back()}
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

          {/* Account Info */}
          <div className={styles.accountInfo}>
            <h3 className={styles.accountInfoTitle}>Account Information</h3>
            <div className={styles.accountInfoGrid}>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Account Status</span>
                <span
                  className={`${styles.accountInfoValue} ${styles.statusActive}`}
                >
                  {user.status}
                </span>
              </div>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Account Type</span>
                <span className={styles.accountInfoValue}>
                  {(user as ProfileUser).role || "User"}
                </span>
              </div>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Member Since</span>
                <span className={styles.accountInfoValue}>
                  {(user as ProfileUser).created_at
                    ? new Date(
                        (user as ProfileUser).created_at!,
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
