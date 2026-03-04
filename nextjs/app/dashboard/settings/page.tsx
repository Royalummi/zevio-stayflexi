"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowLeft, FiBell, FiLock, FiMail, FiShield } from "react-icons/fi";
import { api } from "@/lib/axios";
import styles from "./settings.module.css";

interface UserSettings {
  email_notifications: boolean;
  email_promotions: boolean;
  email_reminders: boolean;
  sms_notifications: boolean;
  sms_reminders: boolean;
  push_notifications: boolean;
  profile_visibility: "public" | "private";
  show_wishlist: boolean;
  share_activity: boolean;
  newsletter_subscription: boolean;
}

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    email_promotions: true,
    email_reminders: true,
    sms_notifications: false,
    sms_reminders: false,
    push_notifications: true,
    profile_visibility: "private",
    show_wishlist: false,
    share_activity: false,
    newsletter_subscription: true,
  });

  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await api.get("/auth/settings");
      // Backend wraps response in data key: { success, data: { settings: {...} } }
      if (response.data.data?.settings) {
        setSettings(response.data.data.settings);
      }
    } catch (error: unknown) {
      console.error("Error fetching settings:", error);
      // If settings don't exist yet, use defaults
      if ((error as any).response?.status !== 404) {
        setToast({ message: "Failed to load settings", type: "error" });
      }
    } finally {
      setLoadingSettings(false);
    }
  };

  const updateSetting = async (
    key: keyof UserSettings,
    value: boolean | string,
  ) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      await api.put("/auth/settings", updatedSettings);
      setToast({ message: "Settings updated successfully", type: "success" });
    } catch (error: unknown) {
      console.error("Error updating settings:", error);
      setToast({
        message:
          (error as any).response?.data?.message || "Failed to update settings",
        type: "error",
      });
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loadingSettings) {
    return (
      <div className={styles.settingsLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsInner}>
        {/* Header */}
        <div className={styles.settingsHeader}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <FiArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div>
            <h1 className={styles.settingsTitle}>Settings</h1>
            <p className={styles.settingsSubtitle}>
              Manage your account preferences
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className={styles.settingsGrid}>
          {/* Notifications */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div className={styles.settingsIcon}>
                <FiBell size={24} />
              </div>
              <div>
                <h3 className={styles.settingsCardTitle}>Notifications</h3>
                <p className={styles.settingsCardDesc}>
                  Manage how you receive notifications
                </p>
              </div>
            </div>
            <div className={styles.settingsCardBody}>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Email Notifications</p>
                  <p className={styles.settingDesc}>
                    Receive booking updates via email
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) =>
                      updateSetting("email_notifications", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Promotional Emails</p>
                  <p className={styles.settingDesc}>
                    Get special offers and deals
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.email_promotions}
                    onChange={(e) =>
                      updateSetting("email_promotions", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Booking Reminders</p>
                  <p className={styles.settingDesc}>
                    Email reminders before check-in
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.email_reminders}
                    onChange={(e) =>
                      updateSetting("email_reminders", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>SMS Notifications</p>
                  <p className={styles.settingDesc}>
                    Receive important updates via SMS
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.sms_notifications}
                    onChange={(e) =>
                      updateSetting("sms_notifications", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Push Notifications</p>
                  <p className={styles.settingDesc}>
                    Browser push notifications
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.push_notifications}
                    onChange={(e) =>
                      updateSetting("push_notifications", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div className={styles.settingsIcon}>
                <FiLock size={24} />
              </div>
              <div>
                <h3 className={styles.settingsCardTitle}>Security</h3>
                <p className={styles.settingsCardDesc}>
                  Manage your account security
                </p>
              </div>
            </div>
            <div className={styles.settingsCardBody}>
              <button
                onClick={() => router.push("/change-password")}
                className={styles.settingActionBtn}
              >
                Change Password
              </button>
              <button className={styles.settingActionBtn}>
                Two-Factor Authentication
                <span className={styles.badge}>Coming Soon</span>
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div className={styles.settingsIcon}>
                <FiShield size={24} />
              </div>
              <div>
                <h3 className={styles.settingsCardTitle}>Privacy</h3>
                <p className={styles.settingsCardDesc}>
                  Control your privacy settings
                </p>
              </div>
            </div>
            <div className={styles.settingsCardBody}>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Profile Visibility</p>
                  <p className={styles.settingDesc}>
                    Make profile visible to others
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.profile_visibility === "public"}
                    onChange={(e) =>
                      updateSetting(
                        "profile_visibility",
                        e.target.checked ? "public" : "private",
                      )
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Show Wishlist</p>
                  <p className={styles.settingDesc}>
                    Display your saved properties
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.show_wishlist}
                    onChange={(e) =>
                      updateSetting("show_wishlist", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Share Activity</p>
                  <p className={styles.settingDesc}>
                    Share your activity with others
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.share_activity}
                    onChange={(e) =>
                      updateSetting("share_activity", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div className={styles.settingsIcon}>
                <FiMail size={24} />
              </div>
              <div>
                <h3 className={styles.settingsCardTitle}>Email Preferences</h3>
                <p className={styles.settingsCardDesc}>
                  Customize email communications
                </p>
              </div>
            </div>
            <div className={styles.settingsCardBody}>
              <div className={styles.settingItem}>
                <div>
                  <p className={styles.settingLabel}>Newsletter</p>
                  <p className={styles.settingDesc}>
                    Monthly travel inspiration
                  </p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.newsletter_subscription}
                    onChange={(e) =>
                      updateSetting("newsletter_subscription", e.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
