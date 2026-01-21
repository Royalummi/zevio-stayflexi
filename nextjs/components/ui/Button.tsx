import React from "react";
import styles from "./Button.module.css";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Reusable Button Component
 * Industry-standard button with multiple variants, sizes, and loading states
 */
export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = styles.zevioButton;
  const variantClass =
    styles[`zevioButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const sizeClass = styles[`zevioButton${size.toUpperCase()}`];
  const fullWidthClass = fullWidth ? styles.zevioButtonFull : "";
  const loadingClass = isLoading ? styles.zevioButtonLoading : "";

  const combinedClassName = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className={styles.zevioButtonSpinner}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </span>
      )}
      {icon && !isLoading && (
        <span className={styles.zevioButtonIcon}>{icon}</span>
      )}
      <span className={styles.zevioButtonText}>{children}</span>
    </button>
  );
}
