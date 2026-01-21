/**
 * Corporate Login Modal
 *
 * Modal component to prompt users to login as corporate users
 * to access exclusive corporate rates and features
 *
 * @module components/modals/CorporateLoginModal
 */

"use client";

import { FiBriefcase, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthModals } from "@/contexts/AuthModalContext";
import styles from "./CorporateLoginModal.module.css";

interface CorporateLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle?: string;
  discountPercent?: number;
}

export default function CorporateLoginModal({
  isOpen,
  onClose,
  propertyTitle,
  discountPercent,
}: CorporateLoginModalProps) {
  const router = useRouter();
  const { openLoginModal } = useAuthModals();

  if (!isOpen) return null;

  const handleLoginClick = () => {
    onClose();
    openLoginModal();
  };

  const handleSignupClick = () => {
    onClose();
    router.push("/register?type=corporate");
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.iconWrapper}>
            <FiBriefcase size={48} />
          </div>
          <h2>Corporate Rates Available</h2>
          {propertyTitle && (
            <p className={styles.propertyName}>{propertyTitle}</p>
          )}
          {discountPercent && (
            <div className={styles.savingsHighlight}>
              <span className={styles.savingsText}>
                Save up to {discountPercent}% with Corporate Account
              </span>
            </div>
          )}
        </div>

        <div className={styles.modalBody}>
          <div className={styles.ctaSection}>
            <p className={styles.promptText}>
              Login as a corporate user to access exclusive rates
            </p>

            <div className={styles.buttonGroup}>
              <button className={styles.loginButton} onClick={handleLoginClick}>
                Login as Corporate User
              </button>
              <button
                className={styles.signupButton}
                onClick={handleSignupClick}
              >
                Sign Up for Corporate Account
              </button>
            </div>

            <button className={styles.cancelButton} onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
