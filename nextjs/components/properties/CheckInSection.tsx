/**
 * CheckInSection Component
 * Displays check-in guidelines and local area information for property detail pages
 * Phase 1: Critical Safety & Policies
 */

import { useState } from "react";
import {
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiInfo,
} from "react-icons/fi";
import styles from "./check-in-section.module.css";
import { sanitizeHtml } from "@/lib/sanitize";

interface CheckInSectionProps {
  checkInGuidelines?: string | null;
  localAreaInfo?: string | null;
  amenitiesGuide?: string | null;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function CheckInSection({
  checkInGuidelines,
  localAreaInfo,
  amenitiesGuide,
  checkInTime,
  checkOutTime,
}: CheckInSectionProps) {
  const [checkInExpanded, setCheckInExpanded] = useState(false);
  const [localAreaExpanded, setLocalAreaExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);

  // Don't render if no content
  if (!checkInGuidelines && !localAreaInfo && !amenitiesGuide) {
    return null;
  }

  return (
    <div className={styles.checkInSection}>
      <h2 className={styles.sectionTitle}>
        <FiClock className={styles.titleIcon} />
        Check-in Information
      </h2>

      {/* Check-in/Check-out times */}
      {(checkInTime || checkOutTime) && (
        <div className={styles.timesBox}>
          <div className={styles.timesGrid}>
            {checkInTime && (
              <div className={styles.timeItem}>
                <span className={styles.timeLabel}>Check-in Time:</span>
                <p className={styles.timeValue}>{checkInTime}</p>
              </div>
            )}
            {checkOutTime && (
              <div className={styles.timeItem}>
                <span className={styles.timeLabel}>Check-out Time:</span>
                <p className={styles.timeValue}>{checkOutTime}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.accordionList}>
        {/* Check-in Guidelines */}
        {checkInGuidelines && (
          <div className={styles.accordionItem}>
            <button
              onClick={() => setCheckInExpanded(!checkInExpanded)}
              className={styles.accordionButton}
            >
              <span className={styles.accordionTitle}>Check-in Guidelines</span>
              {checkInExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {checkInExpanded && (
              <div
                className={`${styles.accordionContent} ${styles.proseContent}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(checkInGuidelines) }}
              />
            )}
          </div>
        )}

        {/* Local Area Information */}
        {localAreaInfo && (
          <div className={styles.accordionItem}>
            <button
              onClick={() => setLocalAreaExpanded(!localAreaExpanded)}
              className={styles.accordionButton}
            >
              <span className={styles.accordionTitle}>
                <FiMapPin className={styles.mapIcon} />
                About the Area
              </span>
              {localAreaExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {localAreaExpanded && (
              <div
                className={`${styles.accordionContent} ${styles.proseContent}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(localAreaInfo) }}
              />
            )}
          </div>
        )}

        {/* Amenities Guide */}
        {amenitiesGuide && (
          <div className={styles.accordionItem}>
            <button
              onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
              className={styles.accordionButton}
            >
              <span className={styles.accordionTitle}>
                <FiInfo className={styles.infoIcon} />
                Amenities Guide
              </span>
              {amenitiesExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {amenitiesExpanded && (
              <div
                className={`${styles.accordionContent} ${styles.proseContent}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(amenitiesGuide) }}
              />
            )}
          </div>
        )}
      </div>

      {/* Important reminder */}
      <div className={styles.verificationNote}>
        <p className={styles.noteText}>
          <strong>Reminder:</strong> Please bring a valid government-issued
          photo ID for check-in. Contact the property manager if you expect to
          arrive outside check-in hours.
        </p>
      </div>
    </div>
  );
}
