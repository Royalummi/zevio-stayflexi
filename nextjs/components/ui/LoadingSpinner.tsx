import React from "react";
import "./LoadingSpinner.css";

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
      className={`loading-spinner loading-spinner--${size} loading-spinner--${color}`}
    >
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="20" />
      </svg>
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="loading-spinner-overlay">{spinner}</div>;
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
      className={`loading-skeleton loading-skeleton--${variant} loading-skeleton--${animation} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
