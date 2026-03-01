"use client";

import { useState, useEffect } from "react";
import { FiX, FiMail, FiCheckCircle } from "react-icons/fi";
import { api } from "@/lib/axios";
import ModalPortal from "@/components/ui/ModalPortal";
import styles from "./auth-modals.module.css";

interface EmailVerificationSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  companyName: string;
}

const RESEND_COOLDOWN = 30;

export default function EmailVerificationSentModal({
  isOpen,
  onClose,
  email,
  companyName,
}: EmailVerificationSentModalProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  // Start cooldown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCooldown(RESEND_COOLDOWN);
      setResendSuccess(false);
      setResendError("");
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendError("");
    setResendSuccess(false);
    try {
      await api.post("/corporate/resend-verification", { email });
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setResendError(
        e.response?.data?.message || "Failed to resend. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className={styles.authModalOverlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className={styles.authModal}>
          <button
            className={styles.authModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>

          <div className={styles.authModalContent}>
            {/* Icon + Header */}
            <div className={styles.verifyEmailHeader}>
              <div className={styles.verifyEmailIconWrap}>
                <FiMail className={styles.verifyEmailIcon} />
              </div>
              <h2 className={styles.authModalTitle}>Check your inbox</h2>
              <p className={styles.authModalSubtitle}>
                We sent a verification link to
              </p>
              <p className={styles.verifyEmailAddress}>{email}</p>
              {companyName && (
                <p className={styles.verifyCompanyName}>
                  for <strong>{companyName}</strong>
                </p>
              )}
            </div>

            {/* Body */}
            <div className={styles.verifyEmailBody}>
              <p className={styles.verifyEmailInstructions}>
                Click the link in the email to verify and activate your
                corporate account. The link expires in <strong>24 hours</strong>
                .
              </p>

              {/* Resend success */}
              {resendSuccess && (
                <div className={styles.verifyResendSuccess}>
                  <FiCheckCircle />
                  <span>Verification email resent successfully.</span>
                </div>
              )}

              {/* Resend error */}
              {resendError && (
                <p className={styles.matchHintBad}>{resendError}</p>
              )}

              {/* Resend button */}
              <div className={styles.verifyResendRow}>
                <span className={styles.verifyResendLabel}>
                  Didn&apos;t receive it?
                </span>
                <button
                  className={styles.verifyResendBtn}
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                >
                  {isResending
                    ? "Sending…"
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend Email"}
                </button>
              </div>

              {/* Close / Done */}
              <button className={styles.authSubmitBtn} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
