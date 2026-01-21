"use client";

import { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <FiCheckCircle />,
    error: <FiAlertCircle />,
    info: <FiCheckCircle />,
    warning: <FiAlertCircle />,
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastIcon}>{icons[type]}</div>
      <div className={styles.toastMessage}>{message}</div>
      <button
        className={styles.toastClose}
        onClick={onClose}
        aria-label="Close notification"
      >
        <FiX />
      </button>
    </div>
  );
}
