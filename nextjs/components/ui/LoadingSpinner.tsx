import React from "react";
import styles from "./LoadingSpinner.module.css";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "current";
  fullScreen?: boolean;
  text?: string;
}

/**
 * Reusable Loading Spinner Component
 * Can be used inline or as full-screen overlay
 */
export default function LoadingSpinner({
  size = "md",
  color = "primary",
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${styles.loadingSpinner} ${
        styles[`loadingSpinner${size.toUpperCase()}`]
      } ${
        styles[
          `loadingSpinner${color.charAt(0).toUpperCase() + color.slice(1)}`
        ]
      }`}
    >
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="20" />
      </svg>
      {text && <p className={styles.loadingSpinnerText}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className={styles.loadingSpinnerOverlay}>{spinner}</div>;
  }

  return spinner;
}

/**
 * Loading Skeleton Component
 * For better perceived performance
 */
export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
  className?: string;
}

export function LoadingSkeleton({
  width = "100%",
  height = "1rem",
  variant = "text",
  animation = "pulse",
  className = "",
}: LoadingSkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`${styles.loadingSkeleton} ${
        styles[
          `loadingSkeleton${variant.charAt(0).toUpperCase() + variant.slice(1)}`
        ]
      } ${
        styles[
          `loadingSkeleton${
            animation.charAt(0).toUpperCase() + animation.slice(1)
          }`
        ]
      } ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
