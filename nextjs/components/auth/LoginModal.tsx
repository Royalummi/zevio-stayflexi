"use client";

import { useState } from "react";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { validateEmail } from "@/lib/utils";
import styles from "./auth-modals.module.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
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
      // Clear form
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Login failed. Please check your credentials.");
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
                {/* Error Message */}
                {error && (
                  <div className={styles.authErrorMessage}>{error}</div>
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
