/**
 * SafetySection Component
 * Displays emergency contacts and safety information for property detail pages
 * Phase 1: Critical Safety & Policies
 */

import { useState } from "react";
import {
  FiShield,
  FiChevronDown,
  FiChevronUp,
  FiPhone,
  FiAlertTriangle,
} from "react-icons/fi";
import styles from "./safety-section.module.css";
import { sanitizeHtml } from "@/lib/sanitize";

interface SafetySectionProps {
  emergencyContacts?: string | null;
  safetyInformation?: string | null;
}

export default function SafetySection({
  emergencyContacts,
  safetyInformation,
}: SafetySectionProps) {
  const [emergencyExpanded, setEmergencyExpanded] = useState(false);
  const [safetyExpanded, setSafetyExpanded] = useState(false);

  // Don't render if no content
  if (!emergencyContacts && !safetyInformation) {
    return null;
  }

  return (
    <div className={styles.safetySection}>
      <h2 className={styles.sectionTitle}>
        <FiShield className={styles.titleIcon} />
        Safety & Emergency Information
      </h2>

      <div className={styles.accordionList}>
        {/* Emergency Contacts */}
        {emergencyContacts && (
          <div className={styles.emergencyAccordion}>
            <button
              onClick={() => setEmergencyExpanded(!emergencyExpanded)}
              className={styles.emergencyButton}
            >
              <span className={styles.accordionTitle}>
                <FiPhone className={styles.phoneIcon} />
                Emergency Contacts
              </span>
              {emergencyExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {emergencyExpanded && (
              <div
                className={`${styles.accordionContent} ${styles.proseContent}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(emergencyContacts) }}
              />
            )}
          </div>
        )}

        {/* Safety Information */}
        {safetyInformation && (
          <div className={styles.safetyAccordion}>
            <button
              onClick={() => setSafetyExpanded(!safetyExpanded)}
              className={styles.safetyButton}
            >
              <span className={styles.accordionTitle}>
                <FiAlertTriangle className={styles.alertIcon} />
                Safety Guidelines
              </span>
              {safetyExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {safetyExpanded && (
              <div
                className={`${styles.accordionContent} ${styles.proseContent}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(safetyInformation) }}
              />
            )}
          </div>
        )}
      </div>

      {/* Quick access note */}
      <div className={styles.noteBox}>
        <p className={styles.noteText}>
          <strong>Note:</strong> Please familiarize yourself with this
          information before your stay. In case of emergency, contact the
          property manager first before calling emergency services.
        </p>
      </div>
    </div>
  );
}
