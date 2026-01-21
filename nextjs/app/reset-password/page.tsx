"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import { api } from "@/lib/axios";
import styles from "./reset-password.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/?login=true");
      }, 3000);
    } catch (err: unknown) {
      console.error("Reset password error:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(
        errorMessage || "Failed to reset password. The link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.resetPasswordContainer}>
          <div className={styles.header}>
            <div className={`${styles.iconContainer} ${styles.error}`}>
              <FiLock className={styles.icon} />
            </div>
            <h2 className={styles.title}>Invalid Link</h2>
            <p className={styles.subtitle}>
              This password reset link is invalid or has expired.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className={styles.homeButton}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.resetPasswordPage}>
        <div className={styles.resetPasswordContainer}>
          <div className={styles.header}>
            <div className={`${styles.iconContainer} ${styles.success}`}>
              <FiCheckCircle className={styles.icon} />
            </div>
            <h2 className={styles.title}>Password Reset Successful!</h2>
            <p className={styles.subtitle}>
              Your password has been reset successfully. You can now login with
              your new password.
            </p>
          </div>
          <p className={styles.redirectText}>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.resetPasswordContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={`${styles.iconContainer} ${styles.info}`}>
            <FiLock className={styles.icon} />
          </div>
          <h2 className={styles.title}>Reset Your Password</h2>
          <p className={styles.subtitle}>Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.resetForm}>
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* New Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="new-password" className={styles.label}>
              New Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={styles.input}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={styles.toggleButton}
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <p className={styles.hint}>Must be at least 6 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="confirm-password" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.toggleButton}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>

          {/* Back to Login */}
          <div className={styles.actionSection}>
            <button
              type="button"
              onClick={() => router.push("/")}
              className={styles.backButton}
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
