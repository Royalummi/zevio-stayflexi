"use client";

import { useState, useMemo } from "react";
import {
  FiX,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiGrid,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import { validateEmail, validatePhone, validatePassword } from "@/lib/utils";
import { api } from "@/lib/axios";
import styles from "./auth-modals.module.css";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onCorporateRegistered: (email: string, companyName: string) => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onCorporateRegistered,
}: SignupModalProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    company_name: "",
  });
  const [isCorporate, setIsCorporate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    company_name?: string;
  }>({});

  // Password strength: 0-4
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [formData.password]);
  const strengthMeta = [
    { label: "", color: "" },
    { label: "Weak", color: "#EF4444" },
    { label: "Fair", color: "#F59E0B" },
    { label: "Good", color: "#3B82F6" },
    { label: "Strong", color: "#10B981" },
  ];
  const { label: strengthLabel, color: strengthColor } =
    strengthMeta[passwordStrength];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the inline error for this field as the user types
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (isCorporate) {
      if (!formData.company_name.trim()) {
        errors.company_name =
          "Company name is required for corporate accounts.";
      }

      const freeEmailDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "live.com",
        "icloud.com",
        "aol.com",
        "protonmail.com",
        "mail.com",
        "ymail.com",
        "rediffmail.com",
        "zoho.com",
        "inbox.com",
        "gmx.com",
        "fastmail.com",
        "me.com",
        "mac.com",
        "msn.com",
        "yahoo.in",
        "yahoo.co.in",
      ];
      const emailDomain = formData.email.split("@")[1]?.toLowerCase();
      if (
        !errors.email &&
        (!emailDomain || freeEmailDomains.includes(emailDomain))
      ) {
        errors.email =
          "Please use your company email. Free providers (Gmail, Yahoo, Outlook, etc.) are not accepted.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setFieldErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isCorporate) {
        // Corporate registration with email verification
        const response = await api.post("/corporate/register", {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          company_name: formData.company_name,
        });

        if (response.data.success) {
          // Let handleCorporateRegistered close signup AND open the verification modal
          // in a single batched state update — do NOT call onClose() separately
          onCorporateRegistered(formData.email, formData.company_name);
        }
      } else {
        // Regular registration
        await register({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        onClose();
        // Clear form
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          company_name: "",
        });
      }
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      // AuthContext.register() rethrows as plain Error — .response is stripped,
      // but .message already contains the extracted backend text
      setError(
        error.message ||
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className={styles.authModalOverlay} onClick={handleOverlayClick}>
        <div className={`${styles.authModal} ${styles.signup}`}>
          {/* Close Button */}
          <button
            className={styles.authModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>

          {/* Scrollable Content */}
          <div className={styles.authModalContent}>
            {/* Header */}
            <div className={styles.authModalHeader}>
              <h2 className={styles.authModalTitle}>Create Account</h2>
              <p className={styles.authModalSubtitle}>
                Join Zevio and book amazing villas
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authModalForm}>
              {/* Server/submission error only */}
              {error && <div className={styles.authErrorMessage}>{error}</div>}

              {/* Success */}
              {successMessage && (
                <div className={styles.authSuccessMessage}>
                  {successMessage}
                </div>
              )}

              {/* HIDDEN: Corporate Toggle — re-enable when corporate registration is live */}
              {/* <div
                className={`${styles.corporateToggle} ${
                  isCorporate ? styles.corporateToggleActive : ""
                }`}
                onClick={() => setIsCorporate(!isCorporate)}
                role="checkbox"
                aria-checked={isCorporate}
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === " " || e.key === "Enter") &&
                  setIsCorporate(!isCorporate)
                }
              >
                <div className={styles.corporateToggleRow}>
                  <span className={styles.corporateToggleLabel}>
                    <FiBriefcase className={styles.corporateIcon} />
                    I&apos;m registering for my company
                  </span>
                  <span
                    className={`${styles.toggleSwitch} ${
                      isCorporate ? styles.toggleSwitchOn : ""
                    }`}
                  />
                </div>
                {isCorporate && (
                  <p className={styles.corporateNote}>
                    Corporate accounts get exclusive discounts on service
                    apartments. A company email is required and will be
                    verified.
                  </p>
                )}
              </div> */}

              {/* ── Full Name ── */}
              <div className={styles.authFormGroup}>
                <label className={styles.authFormLabel} htmlFor="signup-name">
                  Full Name
                </label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    id="signup-name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`${styles.authFormInput} ${styles.withIcon}`}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* ── Email ── */}
              <div className={styles.authFormGroup}>
                <label className={styles.authFormLabel} htmlFor="signup-email">
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`${styles.authFormInput} ${styles.withIcon} ${
                      fieldErrors.email ? styles.error : ""
                    }`}
                    required
                  />
                </div>
                {fieldErrors.email ? (
                  <small className={styles.matchHintBad}>
                    ✗ {fieldErrors.email}
                  </small>
                ) : isCorporate ? (
                  <small className={styles.fieldHintWarn}>
                    Use your official company email — free providers (Gmail,
                    Yahoo, Outlook&hellip;) are not accepted.
                  </small>
                ) : null}
              </div>

              {/* ── Phone — full-width when non-corporate ── */}
              <div
                className={`${styles.authFormGroup} ${
                  !isCorporate ? styles.fullWidth : ""
                }`}
              >
                <label className={styles.authFormLabel} htmlFor="signup-phone">
                  Phone Number
                </label>
                <div className={styles.inputWrapper}>
                  <FiPhone className={styles.inputIcon} />
                  <input
                    id="signup-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className={`${styles.authFormInput} ${styles.withIcon} ${
                      fieldErrors.phone ? styles.error : ""
                    }`}
                    maxLength={10}
                    required
                  />
                </div>
                {fieldErrors.phone && (
                  <small className={styles.matchHintBad}>
                    ✗ {fieldErrors.phone}
                  </small>
                )}
              </div>

              {/* ── Company Name (corporate only) ── */}
              {isCorporate && (
                <div className={styles.authFormGroup}>
                  <label
                    className={styles.authFormLabel}
                    htmlFor="signup-company"
                  >
                    Company Name
                  </label>
                  <div className={styles.inputWrapper}>
                    <FiGrid className={styles.inputIcon} />
                    <input
                      id="signup-company"
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="ABC Pvt Ltd"
                      className={`${styles.authFormInput} ${styles.withIcon} ${
                        fieldErrors.company_name ? styles.error : ""
                      }`}
                      required={isCorporate}
                    />
                  </div>
                  {fieldErrors.company_name && (
                    <small className={styles.matchHintBad}>
                      ✗ {fieldErrors.company_name}
                    </small>
                  )}
                </div>
              )}

              {/* ── Password ── */}
              <div className={styles.authFormGroup}>
                <label
                  className={styles.authFormLabel}
                  htmlFor="signup-password"
                >
                  Password
                </label>
                <div className={styles.authPasswordInput}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className={`${styles.authFormInput} ${styles.withIcon} ${
                      fieldErrors.password ? styles.error : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className={styles.authPasswordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <small className={styles.matchHintBad}>
                    ✗ {fieldErrors.password}
                  </small>
                )}
                {formData.password && !fieldErrors.password && (
                  <div className={styles.strengthBar}>
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={styles.strengthSegment}
                        style={{
                          background:
                            passwordStrength >= i
                              ? strengthColor
                              : "var(--brand-border)",
                        }}
                      />
                    ))}
                    <span
                      className={styles.strengthLabel}
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Confirm Password ── */}
              <div className={styles.authFormGroup}>
                <label
                  className={styles.authFormLabel}
                  htmlFor="signup-confirm-password"
                >
                  Confirm Password
                </label>
                <div className={styles.authPasswordInput}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`${styles.authFormInput} ${styles.withIcon} ${
                      fieldErrors.confirmPassword ? styles.error : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className={styles.authPasswordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <small
                    className={
                      formData.password === formData.confirmPassword
                        ? styles.matchHintOk
                        : styles.matchHintBad
                    }
                  >
                    {formData.password === formData.confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </small>
                )}
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                className={styles.authSubmitBtn}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account…" : "Create Account"}
              </button>

              {/* ── Terms ── */}
              <p className={styles.authTerms}>
                By signing up, you agree to our{" "}
                <a href="/terms">Terms of Service</a> and{" "}
                <a href="/privacy">Privacy Policy</a>
              </p>

              {/* ── Divider ── */}
              <div className={styles.authDivider}>
                <span>Or</span>
              </div>

              {/* ── Switch to Login ── */}
              <div className={styles.authSwitch}>
                <span>Already have an account?</span>
                <button
                  type="button"
                  className={styles.authSwitchBtn}
                  onClick={onSwitchToLogin}
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
