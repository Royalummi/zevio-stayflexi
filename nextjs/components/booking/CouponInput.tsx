/**
 * CouponInput Component
 *
 * Allows users to apply discount coupons during booking checkout
 * Validates coupon via backend API with real-time feedback
 *
 * @component
 * @example
 * ```tsx
 * <CouponInput
 *   propertyId="prop-123"
 *   bookingAmount={10000}
 *   onCouponApplied={(code, discount) => console.log(code, discount)}
 *   onCouponRemoved={() => console.log('removed')}
 * />
 * ```
 */

import React, { useState } from "react";
import { FiTag, FiCheck, FiX, FiLoader, FiAlertCircle } from "react-icons/fi";
import { api } from "@/lib/axios";
import styles from "./CouponInput.module.css";

interface CouponInputProps {
  propertyId: string;
  bookingAmount: number;
  onCouponApplied: (
    couponCode: string,
    discountAmount: number,
    couponId: string,
  ) => void;
  onCouponRemoved: () => void;
  appliedCouponCode?: string;
  appliedDiscount?: number;
  className?: string;
}

export default function CouponInput({
  propertyId,
  bookingAmount,
  onCouponApplied,
  onCouponRemoved,
  appliedCouponCode,
  appliedDiscount = 0,
  className = "",
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isApplied, setIsApplied] = useState(!!appliedCouponCode);

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    // Clear previous errors
    setError("");

    // Validate input
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setLoading(true);

    try {
      // Call backend validation API
      const response = await api.post("/coupons/validate", {
        code: couponCode.toUpperCase(),
        property_id: propertyId,
        booking_amount: bookingAmount,
      });

      const data = response.data?.data || response.data;

      if (data.valid) {
        // Success - coupon is valid
        setIsApplied(true);
        setError("");

        // Notify parent component
        onCouponApplied(data.coupon_code, data.discount_amount, data.coupon_id);
      } else {
        setError("Invalid coupon code");
      }
    } catch (err: unknown) {
      // Handle API errors with proper type checking
      let errorMessage = "Failed to validate coupon. Please try again.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object" &&
        (err as Record<string, unknown>).response !== null
      ) {
        const response = (err as Record<string, unknown>).response as Record<
          string,
          unknown
        >;
        const data = response.data as Record<string, unknown>;
        errorMessage =
          (data?.message as string) || (data?.error as string) || errorMessage;
      }

      setError(errorMessage);
      setIsApplied(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setIsApplied(false);
    setError("");
    onCouponRemoved();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && !isApplied) {
      handleApplyCoupon();
    }
  };

  return (
    <div className={`${styles.couponContainer} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <FiTag className={styles.headerIcon} />
        <h3 className={styles.title}>Have a Coupon Code?</h3>
      </div>

      {/* Input Section */}
      <div className={styles.inputWrapper}>
        <div
          className={`${styles.inputGroup} ${
            isApplied ? styles.inputApplied : ""
          } ${error ? styles.inputError : ""}`}
        >
          <input
            type="text"
            value={isApplied ? appliedCouponCode || couponCode : couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter coupon code"
            className={styles.input}
            disabled={loading || isApplied}
            maxLength={20}
            aria-label="Coupon code"
            aria-invalid={!!error}
            aria-describedby={error ? "coupon-error" : undefined}
          />

          {/* Applied Check Icon */}
          {isApplied && (
            <div className={styles.appliedIcon}>
              <FiCheck />
            </div>
          )}
        </div>

        {/* Action Button */}
        {!isApplied ? (
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim()}
            className={`${styles.applyButton} ${
              loading ? styles.buttonLoading : ""
            }`}
            aria-label="Apply coupon"
          >
            {loading ? (
              <>
                <FiLoader className={styles.spinner} />
                Validating...
              </>
            ) : (
              <>
                <FiTag />
                Apply
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className={styles.removeButton}
            aria-label="Remove coupon"
          >
            <FiX />
            Remove
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage} id="coupon-error" role="alert">
          <FiAlertCircle className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {isApplied && appliedDiscount > 0 && (
        <div className={styles.successMessage} role="status">
          <FiCheck className={styles.successIcon} />
          <span>
            Coupon applied successfully! You saved{" "}
            <strong>₹{appliedDiscount.toLocaleString("en-IN")}</strong>
          </span>
        </div>
      )}

      {/* Info Text */}
      {!isApplied && !error && (
        <p className={styles.infoText}>
          Enter your coupon code to get instant discounts on your booking
        </p>
      )}
    </div>
  );
}
