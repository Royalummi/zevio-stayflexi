/**
 * PriceBreakdown Component
 *
 * Displays detailed price breakdown with Session 64 pricing structure:
 * - Tiered GST (5% ≤₹7,500, 18% >₹7,500)
 * - 5% Service Charge (NO GST on service charge)
 * - Coupon discount integration
 *
 * @component
 * @example
 * ```tsx
 * <PriceBreakdown
 *   baseAmount={10000}
 *   extraGuestCharges={1000}
 *   extraChildrenCharges={500}
 *   couponDiscount={1150}
 *   couponCode="SUMMER10"
 *   showDetails={true}
 * />
 * ```
 */

import React, { useMemo, useState } from "react";
import { FiInfo, FiTag, FiPercent, FiChevronDown } from "react-icons/fi";
import styles from "./PriceBreakdown.module.css";

interface PriceBreakdownProps {
  baseAmount: number;
  extraGuestCharges?: number;
  extraChildrenCharges?: number;
  nights: number;
  pricePerNight: number;
  minGuests: number;
  minChildren?: number;
  adults: number;
  childrenCount: number;
  extraGuestCharge: number;
  extraChildCharge: number;
  couponDiscount?: number;
  couponCode?: string;
  showDetails?: boolean;
  className?: string;
}

export default function PriceBreakdown({
  baseAmount,
  extraGuestCharges = 0,
  extraChildrenCharges = 0,
  nights,
  pricePerNight,
  minGuests,
  minChildren = 0,
  adults,
  childrenCount,
  extraGuestCharge,
  extraChildCharge,
  couponDiscount = 0,
  couponCode,
  showDetails = true,
  className = "",
}: PriceBreakdownProps) {
  const [taxExpanded, setTaxExpanded] = useState(false);
  // Calculate pricing breakdown following Session 64 pricing logic
  const pricingBreakdown = useMemo(() => {
    // Step 1: Subtotal = Base + Extra Guests + Extra Children
    const subtotal = baseAmount + extraGuestCharges + extraChildrenCharges;

    // Step 2: Apply Coupon Discount
    const bookingAmount = subtotal - couponDiscount;

    // Step 3: Calculate Tiered GST (5% if ≤₹7,500, 18% if >₹7,500)
    const gstRate = bookingAmount <= 7500 ? 5 : 18;
    const gstAmount = Math.round((bookingAmount * gstRate) / 100);

    // Step 4: Calculate Service Charge (5% of booking amount, NO GST)
    const serviceCharge = Math.round((bookingAmount * 5) / 100);

    // Step 5: Total Amount
    const totalAmount = bookingAmount + gstAmount + serviceCharge;

    return {
      subtotal,
      bookingAmount,
      gstRate,
      gstAmount,
      serviceCharge,
      totalAmount,
    };
  }, [baseAmount, extraGuestCharges, extraChildrenCharges, couponDiscount]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const extraAdults = Math.max(0, adults - minGuests);
  const extraChildren = Math.max(0, childrenCount - minChildren);

  return (
    <div className={`${styles.priceBreakdown} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Price Breakdown</h3>
        {showDetails && (
          <span className={styles.detailsBadge}>
            <FiInfo className={styles.icon} /> Detailed
          </span>
        )}
      </div>

      {/* Price Lines */}
      <div className={styles.priceLines}>
        {/* Base Amount */}
        <div className={styles.priceLine}>
          <div className={styles.lineLeft}>
            <span className={styles.lineLabel}>
              {formatCurrency(pricePerNight)} × {nights}{" "}
              {nights === 1 ? "night" : "nights"}
            </span>
            {showDetails && (
              <span className={styles.lineNote}>
                Base price for {minGuests}{" "}
                {minGuests === 1 ? "guest" : "guests"}
                {minChildren > 0 &&
                  ` + ${minChildren} ${
                    minChildren === 1 ? "child" : "children"
                  }`}
              </span>
            )}
          </div>
          <span className={styles.lineValue}>{formatCurrency(baseAmount)}</span>
        </div>

        {/* Extra Guest Charges */}
        {extraGuestCharges > 0 && (
          <div className={styles.priceLine}>
            <div className={styles.lineLeft}>
              <span className={styles.lineLabel}>Extra guest charges</span>
              {showDetails && (
                <span className={styles.lineNote}>
                  {extraAdults} additional{" "}
                  {extraAdults === 1 ? "adult" : "adults"} ×{" "}
                  {formatCurrency(extraGuestCharge)} × {nights}{" "}
                  {nights === 1 ? "night" : "nights"}
                </span>
              )}
            </div>
            <span className={styles.lineValue}>
              {formatCurrency(extraGuestCharges)}
            </span>
          </div>
        )}

        {/* Extra Children Charges */}
        {extraChildrenCharges > 0 && (
          <div className={styles.priceLine}>
            <div className={styles.lineLeft}>
              <span className={styles.lineLabel}>Extra children charges</span>
              {showDetails && (
                <span className={styles.lineNote}>
                  {extraChildren} additional{" "}
                  {extraChildren === 1 ? "child" : "children"} ×{" "}
                  {formatCurrency(extraChildCharge)} × {nights}{" "}
                  {nights === 1 ? "night" : "nights"}
                </span>
              )}
            </div>
            <span className={styles.lineValue}>
              {formatCurrency(extraChildrenCharges)}
            </span>
          </div>
        )}

        {/* Subtotal Divider */}
        <div className={styles.divider} />

        {/* Subtotal */}
        <div className={`${styles.priceLine} ${styles.subtotal}`}>
          <span className={styles.lineLabel}>Subtotal</span>
          <span className={styles.lineValue}>
            {formatCurrency(pricingBreakdown.subtotal)}
          </span>
        </div>

        {/* Coupon Discount */}
        {couponDiscount > 0 && couponCode && (
          <div className={`${styles.priceLine} ${styles.discount}`}>
            <div className={styles.lineLeft}>
              <span className={styles.lineLabel}>
                <FiTag className={styles.icon} /> Coupon Discount
              </span>
              <span className={styles.couponCode}>{couponCode}</span>
            </div>
            <span className={`${styles.lineValue} ${styles.discountValue}`}>
              -{formatCurrency(couponDiscount)}
            </span>
          </div>
        )}

        {/* Booking Amount Divider */}
        <div className={styles.divider} />

        {/* Booking Amount */}
        <div className={`${styles.priceLine} ${styles.bookingAmount}`}>
          <div className={styles.lineLeft}>
            <span className={styles.lineLabel}>Booking Amount</span>
            {showDetails && (
              <span className={styles.lineNote}>
                Amount after coupon discount
              </span>
            )}
          </div>
          <span className={styles.lineValue}>
            {formatCurrency(pricingBreakdown.bookingAmount)}
          </span>
        </div>

        {/* Taxes & Fees — collapsible */}
        <div className={styles.taxRow}>
          <button
            type="button"
            className={styles.taxHeader}
            onClick={() => setTaxExpanded((prev) => !prev)}
            aria-expanded={taxExpanded}
          >
            <div className={styles.taxHeaderLeft}>
              <span className={styles.lineLabel}>
                <FiPercent className={styles.icon} /> Taxes &amp; Fees
              </span>
              <span className={styles.taxHint}>
                {taxExpanded ? "Hide breakdown" : "View breakdown"}
              </span>
            </div>
            <div className={styles.taxHeaderRight}>
              <span className={styles.lineValue}>
                {formatCurrency(
                  pricingBreakdown.gstAmount + pricingBreakdown.serviceCharge,
                )}
              </span>
              <FiChevronDown
                className={`${styles.chevron} ${taxExpanded ? styles.chevronOpen : ""}`}
              />
            </div>
          </button>

          {taxExpanded && (
            <div className={styles.taxBreakdown}>
              <div className={styles.taxItem}>
                <span className={styles.taxItemLabel}>
                  GST ({pricingBreakdown.gstRate}%)
                </span>
                <span className={styles.taxItemValue}>
                  {formatCurrency(pricingBreakdown.gstAmount)}
                </span>
              </div>
              <div className={styles.taxItem}>
                <span className={styles.taxItemLabel}>
                  Service Charge (5% Inclusive of GST)
                </span>
                <span className={styles.taxItemValue}>
                  {formatCurrency(pricingBreakdown.serviceCharge)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Final Divider */}
        <div className={`${styles.divider} ${styles.finalDivider}`} />

        {/* Total Amount */}
        <div className={`${styles.priceLine} ${styles.totalLine}`}>
          <span className={styles.totalLabel}>Total Amount</span>
          <span className={styles.totalValue}>
            {formatCurrency(pricingBreakdown.totalAmount)}
          </span>
        </div>
      </div>

      {/* Info Footer */}
      {showDetails && (
        <div className={styles.infoFooter}>
          <FiInfo className={styles.infoIcon} />
          <p className={styles.infoText}>
            All prices are in Indian Rupees (INR). Taxes and service charges are
            applicable as per government regulations.
          </p>
        </div>
      )}
    </div>
  );
}
