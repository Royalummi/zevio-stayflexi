"use client";

import { useState } from "react";
import { FiX, FiEye, FiEyeOff, FiBriefcase } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import { validateEmail, validatePhone, validatePassword } from "@/lib/utils";
import { api } from "@/lib/axios";
import styles from "./auth-modals.module.css";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignupModalProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    company_name: "",
    gst_number: "",
  });
  const [isCorporate, setIsCorporate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    // Email validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Phone validation
    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Corporate-specific validation
    if (isCorporate) {
      if (!formData.company_name.trim()) {
        setError("Company name is required for corporate registration");
        return false;
      }

      if (!formData.gst_number.trim()) {
        setError("GST number is required for corporate registration");
        return false;
      }

      // GST format validation (15 characters alphanumeric)
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(formData.gst_number)) {
        setError(
          "Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)"
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isCorporate) {
        // Corporate registration with email verification
        const response = await api.post("/auth/register-corporate", {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          company_name: formData.company_name,
          gst_number: formData.gst_number,
        });

        if (response.data.success) {
          setSuccessMessage(
            "Registration successful! A verification email has been sent to your email address. Please verify your email to access corporate features."
          );
          // Clear form after 3 seconds
          setTimeout(() => {
            onClose();
            setFormData({
              full_name: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
              company_name: "",
              gst_number: "",
            });
            setIsCorporate(false);
            setSuccessMessage("");
          }, 5000);
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
          gst_number: "",
        });
      }
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
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

            {/* Form - Two Column Layout on Desktop */}
            <form onSubmit={handleSubmit} className={styles.authModalForm}>
              {/* Error Message (Full Width) */}
              {error && <div className={styles.authErrorMessage}>{error}</div>}

              {/* Success Message (Full Width) */}
              {successMessage && (
                <div className={styles.authSuccessMessage}>
                  {successMessage}
                </div>
              )}

              {/* Corporate Toggle (Full Width) */}
              <div className={styles.corporateToggle}>
                <label className={styles.corporateCheckbox}>
                  <input
                    type="checkbox"
                    checked={isCorporate}
                    onChange={(e) => setIsCorporate(e.target.checked)}
                  />
                  <FiBriefcase className={styles.corporateIcon} />
                  <span>Im registering for my company</span>
                </label>
                {isCorporate && (
                  <p className={styles.corporateNote}>
                    Corporate accounts get exclusive discounts on service
                    apartments. Email verification required.
                  </p>
                )}
              </div>

              {/* Full Name Field */}
              <div className={styles.authFormGroup}>
                <label className={styles.authFormLabel} htmlFor="signup-name">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={styles.authFormInput}
                  required
                  autoFocus
                />
              </div>

              {/* Email Field */}
              <div className={styles.authFormGroup}>
                <label className={styles.authFormLabel} htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={styles.authFormInput}
                  required
                />
              </div>

              {/* Phone Field */}
              <div className={styles.authFormGroup}>
                <label className={styles.authFormLabel} htmlFor="signup-phone">
                  Phone Number
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={styles.authFormInput}
                  maxLength={10}
                  required
                />
              </div>

              {/* Corporate Fields (Conditional) */}
              {isCorporate && (
                <>
                  <div className={styles.authFormGroup}>
                    <label
                      className={styles.authFormLabel}
                      htmlFor="signup-company"
                    >
                      Company Name
                    </label>
                    <input
                      id="signup-company"
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="ABC Pvt Ltd"
                      className={styles.authFormInput}
                      required={isCorporate}
                    />
                  </div>

                  <div className={styles.authFormGroup}>
                    <label
                      className={styles.authFormLabel}
                      htmlFor="signup-gst"
                    >
                      GST Number
                    </label>
                    <input
                      id="signup-gst"
                      type="text"
                      name="gst_number"
                      value={formData.gst_number}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z5"
                      className={styles.authFormInput}
                      maxLength={15}
                      required={isCorporate}
                      style={{ textTransform: "uppercase" }}
                    />
                    <small className={styles.fieldHint}>
                      15-character GST identification number
                    </small>
                  </div>
                </>
              )}

              {/* Password Field */}
              <div className={styles.authFormGroup}>
                <label
                  className={styles.authFormLabel}
                  htmlFor="signup-password"
                >
                  Password (min 8 characters)
                </label>
                <div className={styles.authPasswordInput}>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className={styles.authFormInput}
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
              </div>

              {/* Confirm Password Field */}
              <div className={styles.authFormGroup}>
                <label
                  className={styles.authFormLabel}
                  htmlFor="signup-confirm-password"
                >
                  Confirm Password
                </label>
                <div className={styles.authPasswordInput}>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={styles.authFormInput}
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
              </div>

              {/* Submit Button (Full Width) */}
              <button
                type="submit"
                className={styles.authSubmitBtn}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              {/* Terms (Full Width) */}
              <p className={styles.authTerms}>
                By signing up, you agree to our{" "}
                <a href="/terms">Terms of Service</a> and{" "}
                <a href="/privacy">Privacy Policy</a>
              </p>

              {/* Divider (Full Width) */}
              <div className={styles.authDivider}>
                <span>Or</span>
              </div>

              {/* Switch to Login (Full Width) */}
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
