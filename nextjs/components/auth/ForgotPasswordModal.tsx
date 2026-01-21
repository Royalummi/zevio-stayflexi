"use client";

import { useState } from "react";
import { FiX, FiMail, FiCheckCircle } from "react-icons/fi";
import ModalPortal from "@/components/ui/ModalPortal";
import { validateEmail } from "@/lib/utils";
import apiClient from "@/lib/api";
import styles from "./auth-modals.module.css";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSuccess(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className={styles.authModalOverlay} onClick={handleOverlayClick}>
        <div className={styles.authModal}>
          {/* Close Button */}
          <button
            className={styles.authModalClose}
            onClick={handleClose}
            aria-label="Close"
          >
            <FiX />
          </button>

          {/* Scrollable Content */}
          <div className={styles.authModalContent}>
            {!isSuccess ? (
              <>
                {/* Header */}
                <div className={styles.authModalHeader}>
                  <div className={styles.authModalIcon}>
                    <FiMail />
                  </div>
                  <h2 className={styles.authModalTitle}>Forgot Password?</h2>
                  <p className={styles.authModalSubtitle}>
                    No worries! Enter your email and we&apos;ll send you a reset
                    link.
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
                    <label
                      className={styles.authFormLabel}
                      htmlFor="forgot-email"
                    >
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={styles.authFormInput}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className={styles.authSubmitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>

                  {/* Back to Login */}
                  <div className={styles.authSwitch}>
                    <button
                      type="button"
                      className={styles.authLinkBtn}
                      onClick={handleClose}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className={styles.authModalHeader}>
                  <div
                    className={`${styles.authModalIcon} ${styles.authModalIconSuccess}`}
                  >
                    <FiCheckCircle />
                  </div>
                  <h2 className={styles.authModalTitle}>Check Your Email</h2>
                  <p className={styles.authModalSubtitle}>
                    We&apos;ve sent a password reset link to{" "}
                    <strong>{email}</strong>
                  </p>
                  <p className={styles.authModalSubtitle}>
                    Please check your inbox and click the link to reset your
                    password.
                  </p>
                </div>

                <div className={styles.authModalForm}>
                  <button
                    type="button"
                    className={styles.authSubmitBtn}
                    onClick={handleClose}
                  >
                    Got it, thanks!
                  </button>

                  <div className={styles.authSwitch}>
                    <span>Didn&apos;t receive the email?</span>
                    <button
                      type="button"
                      className={styles.authSwitchBtn}
                      onClick={() => {
                        setIsSuccess(false);
                        setEmail("");
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
