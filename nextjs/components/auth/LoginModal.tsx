"use client";

import { useState, useEffect } from "react";
import { FiX, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { validateEmail } from "@/lib/utils";
import { api } from "@/lib/axios";
import styles from "./auth-modals.module.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const RESEND_COOLDOWN = 30;

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToSignup,
}: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Corporate unverified state
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUnverifiedEmail("");
      setError("");
      setResendDone(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      onClose();
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const e = err as Error & {
        responseData?: { corporate_unverified?: boolean; email?: string };
      };
      if (e.responseData?.corporate_unverified) {
        // Show inline verify-email banner instead of generic error
        setUnverifiedEmail(e.responseData.email || email);
        setResendCooldown(RESEND_COOLDOWN);
      } else {
        setError(e.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendDone(false);
    try {
      await api.post("/corporate/resend-verification", {
        email: unverifiedEmail,
      });
      setResendDone(true);
      setResendCooldown(RESEND_COOLDOWN);
    } catch {
      // fail silently — user can try again
    } finally {
      setIsResending(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <ModalPortal isOpen={isOpen}>
        <div className={styles.authModalOverlay} onClick={handleOverlayClick}>
          <div className={styles.authModal}>
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
                <h2 className={styles.authModalTitle}>Welcome Back</h2>
                <p className={styles.authModalSubtitle}>
                  Sign in to book your dream villa
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={styles.authModalForm}>
                {/* Generic Error */}
                {error && (
                  <div className={styles.authErrorMessage}>{error}</div>
                )}

                {/* Corporate unverified — inline banner */}
                {unverifiedEmail && (
                  <div className={styles.corporateUnverifiedBanner}>
                    <p className={styles.corporateUnverifiedTitle}>
                      <FiAlertTriangle size={16} />
                      Email not verified
                    </p>
                    <p className={styles.corporateUnverifiedText}>
                      Your corporate account for{" "}
                      <strong>{unverifiedEmail}</strong> needs to be verified
                      before you can log in.
                      {resendDone && (
                        <> A new link has been sent — check your inbox.</>
                      )}
                    </p>
                    <div className={styles.corporateUnverifiedActions}>
                      <button
                        type="button"
                        className={styles.corporateResendBtn}
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || isResending}
                      >
                        {isResending
                          ? "Sending…"
                          : resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : "Resend Verification Email"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className={styles.authFormGroup}>
                  <label className={styles.authFormLabel} htmlFor="login-email">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={styles.authFormInput}
                    required
                    autoFocus
                  />
                </div>

                {/* Password Field */}
                <div className={styles.authFormGroup}>
                  <label
                    className={styles.authFormLabel}
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <div className={styles.authPasswordInput}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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

                {/* Forgot Password */}
                <div className={styles.authForgotPassword}>
                  <button
                    type="button"
                    className={styles.authLinkBtn}
                    onClick={() => {
                      onClose();
                      setShowForgotPassword(true);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={styles.authSubmitBtn}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                {/* Divider */}
                <div className={styles.authDivider}>
                  <span>Or</span>
                </div>

                {/* Switch to Signup */}
                <div className={styles.authSwitch}>
                  <span>Don&apos;t have an account?</span>
                  <button
                    type="button"
                    className={styles.authSwitchBtn}
                    onClick={onSwitchToSignup}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
}
