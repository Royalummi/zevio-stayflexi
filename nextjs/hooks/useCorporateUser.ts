/**
 * Corporate User Hook
 *
 * Manages corporate user authentication and feature access
 * - Checks if user is logged in and corporate verified
 * - Provides helper functions for corporate feature visibility
 * - Handles corporate login prompts
 *
 * @module hooks/useCorporateUser
 */

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModals } from "@/contexts/AuthModalContext";
import type { User } from "@/types";

interface CorporateUser {
  /** Whether user is authenticated (logged in) */
  isAuthenticated: boolean;
  /** Whether user is a verified corporate user */
  isCorporateUser: boolean;
  /** Whether to show corporate badges and pricing */
  showCorporateFeatures: boolean;
  /** User's corporate verification status */
  corporateVerified: boolean;
  /** Helper function to check if corporate login is required */
  requiresCorporateLogin: () => boolean;
  /** Function to prompt corporate login */
  promptCorporateLogin: (callback?: () => void) => void;
}

/**
 * Hook to manage corporate user status and features
 *
 * @returns {CorporateUser} Corporate user state and helper functions
 *
 * @example
 * ```tsx
 * const { isCorporateUser, showCorporateFeatures, promptCorporateLogin } = useCorporateUser();
 *
 * // Show corporate badge only for corporate users
 * {showCorporateFeatures && hasCorporateDiscount && (
 *   <div className="corporate-badge">Corporate Rate</div>
 * )}
 *
 * // Handle property click on corporate offers page
 * const handleClick = () => {
 *   if (!isCorporateUser) {
 *     promptCorporateLogin(() => router.push(`/properties/${id}`));
 *     return;
 *   }
 *   router.push(`/properties/${id}`);
 * };
 * ```
 */
export const useCorporateUser = (): CorporateUser => {
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModals();

  // Check if user is corporate verified
  const typedUser = user as User | null;
  const corporateVerified = typedUser?.corporate_verified === true;
  const isCorporateUser = isAuthenticated && corporateVerified;

  /**
   * Check if corporate login is required
   * @returns true if user needs to login as corporate
   */
  const requiresCorporateLogin = (): boolean => {
    return !isAuthenticated || !corporateVerified;
  };

  /**
   * Prompt user to login as corporate user
   * @param callback - Optional callback to execute after successful login
   */
  const promptCorporateLogin = (callback?: () => void): void => {
    if (!isAuthenticated) {
      // User not logged in - open login modal
      openLoginModal();
      // Store callback for after login (if needed)
      if (callback && typeof window !== "undefined") {
        sessionStorage.setItem("postLoginCallback", "corporate-redirect");
      }
    } else if (!corporateVerified) {
      // User logged in but not corporate verified
      // Show alert for now (will be replaced with modal in Phase 2)
      alert(
        "This offer is exclusively for corporate users. Please verify your corporate account or contact support."
      );
    }
  };

  return {
    isAuthenticated,
    isCorporateUser,
    showCorporateFeatures: isCorporateUser,
    corporateVerified,
    requiresCorporateLogin,
    promptCorporateLogin,
  };
};

/**
 * Helper function to calculate corporate savings
 * @param regularPrice - Regular price per night
 * @param corporateDiscountPercent - Corporate discount percentage
 * @returns Object with discounted price and savings amount
 */
export const calculateCorporateSavings = (
  regularPrice: number,
  corporateDiscountPercent: number
): {
  discountedPrice: number;
  savingsAmount: number;
  savingsPercent: number;
} => {
  const savingsAmount = (regularPrice * corporateDiscountPercent) / 100;
  const discountedPrice = regularPrice - savingsAmount;

  return {
    discountedPrice: Math.round(discountedPrice),
    savingsAmount: Math.round(savingsAmount),
    savingsPercent: corporateDiscountPercent,
  };
};

/**
 * Helper function to format corporate pricing display
 * @param regularPrice - Regular price per night
 * @param discountedPrice - Corporate discounted price
 * @returns Formatted pricing strings
 */
export const formatCorporatePricing = (
  regularPrice: number,
  discountedPrice: number
): { regular: string; discounted: string; savings: string } => {
  const savings = regularPrice - discountedPrice;
  const savingsPercent = Math.round((savings / regularPrice) * 100);

  return {
    regular: `₹${regularPrice.toLocaleString("en-IN")}`,
    discounted: `₹${discountedPrice.toLocaleString("en-IN")}`,
    savings: `Save ${savingsPercent}%`,
  };
};
