import React from "react";
import "./Button.css";

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
  const baseClass = "zevio-button";
  const variantClass = `zevio-button--${variant}`;
  const sizeClass = `zevio-button--${size}`;
  const fullWidthClass = fullWidth ? "zevio-button--full" : "";
  const loadingClass = isLoading ? "zevio-button--loading" : "";

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
        <span className="zevio-button__spinner">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </span>
      )}
      {icon && !isLoading && <span className="zevio-button__icon">{icon}</span>}
      <span className="zevio-button__text">{children}</span>
    </button>
  );
}
