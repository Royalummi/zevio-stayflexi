/**
 * PolicySection Component
 * Displays house rules and cancellation policy for property detail pages
 * Phase 1: Critical Safety & Policies
 */

import { useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiXCircle,
} from "react-icons/fi";
import styles from "./policy-section.module.css";

interface PolicySectionProps {
  houseRules?: object | string | null;
  cancellationPolicy?: object | string | null;
  noticePeriodDays?: number | null;
}

export default function PolicySection({
  houseRules,
  cancellationPolicy,
  noticePeriodDays,
}: PolicySectionProps) {
  const [houseRulesExpanded, setHouseRulesExpanded] = useState(false);
  const [cancellationExpanded, setCancellationExpanded] = useState(false);

  // Parse house rules
  const parseHouseRules = () => {
    if (!houseRules) return null;

    // If we have house_rules (JSON object)
    try {
      const rules =
        typeof houseRules === "string" ? JSON.parse(houseRules) : houseRules;

      if (!rules || typeof rules !== "object") return null;

      return (
        <div className={styles.rulesContent}>
          {/* Check-in/Check-out times */}
          {(rules.check_in_after || rules.check_out_before) && (
            <div className={styles.rulesGroup}>
              <h4 className={styles.rulesGroupTitle}>Check-in & Check-out</h4>
              <ul className={styles.rulesList}>
                {rules.check_in_after && (
                  <li>Check-in after: {rules.check_in_after}</li>
                )}
                {rules.check_out_before && (
                  <li>Check-out before: {rules.check_out_before}</li>
                )}
              </ul>
            </div>
          )}

          {/* Main rules */}
          <div className={styles.rulesGroup}>
            <h4 className={styles.rulesGroupTitle}>Property Rules</h4>
            <ul className={styles.rulesList}>
              {rules.no_smoking && <li>No smoking inside the property</li>}
              {rules.no_parties && <li>No parties or events allowed</li>}
              {rules.no_events === false && (
                <li>Events allowed with prior approval</li>
              )}
              {rules.pets_allowed && (
                <li>
                  Pets allowed
                  {rules.pets_approval_required && " (prior approval required)"}
                </li>
              )}
              {rules.pets_allowed === false && <li>Pets not allowed</li>}
              {rules.quiet_hours && <li>Quiet hours: {rules.quiet_hours}</li>}
            </ul>
          </div>

          {/* Additional rules */}
          {rules.additional_rules &&
            Array.isArray(rules.additional_rules) &&
            rules.additional_rules.length > 0 && (
              <div className={styles.rulesGroup}>
                <h4 className={styles.rulesGroupTitle}>
                  Additional Guidelines
                </h4>
                <ul className={styles.rulesList}>
                  {rules.additional_rules.map((rule: string, idx: number) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      );
    } catch (error) {
      console.error("Error parsing house rules:", error);
      return null;
    }
  };

  // Parse cancellation policy
  const parseCancellationPolicy = () => {
    if (!cancellationPolicy) return null;

    try {
      const policy =
        typeof cancellationPolicy === "string"
          ? JSON.parse(cancellationPolicy)
          : cancellationPolicy;

      if (!policy || typeof policy !== "object") return null;

      return (
        <div className={styles.policyContent}>
          {/* Policy type */}
          {policy.policy_type && (
            <div className={styles.policyTypeBox}>
              <span className={styles.policyTypeLabel}>
                {policy.policy_type} Cancellation Policy
              </span>
            </div>
          )}

          {/* Free cancellation */}
          {policy.free_cancellation_text && (
            <div className={styles.refundGroup}>
              <h4 className={`${styles.refundTitle} ${styles.freeRefundTitle}`}>
                Free Cancellation
              </h4>
              <p className={styles.refundText}>
                {policy.free_cancellation_text}
              </p>
            </div>
          )}

          {/* Partial refund */}
          {policy.partial_refund_text && (
            <div className={styles.refundGroup}>
              <h4
                className={`${styles.refundTitle} ${styles.partialRefundTitle}`}
              >
                Partial Refund
              </h4>
              <p className={styles.refundText}>{policy.partial_refund_text}</p>
            </div>
          )}

          {/* No refund */}
          {policy.no_refund_text && (
            <div className={styles.refundGroup}>
              <h4 className={`${styles.refundTitle} ${styles.noRefundTitle}`}>
                Non-Refundable
              </h4>
              <p className={styles.refundText}>{policy.no_refund_text}</p>
            </div>
          )}

          {/* Additional notes */}
          {policy.notes && (
            <div className={styles.policyNotesBox}>
              <p className={styles.policyNotes}>{policy.notes}</p>
            </div>
          )}

          {/* Notice Period */}
          {noticePeriodDays && (
            <div className={styles.noticePeriodBox}>
              <h4 className={styles.noticePeriodTitle}>Notice Period</h4>
              <p className={styles.noticePeriodText}>
                Cancellations must be made at least{" "}
                <strong>
                  {noticePeriodDays} {noticePeriodDays === 1 ? "day" : "days"}
                </strong>{" "}
                before check-in for refund eligibility.
              </p>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error parsing cancellation policy:", error);
      return null;
    }
  };

  const houseRulesContent = parseHouseRules();
  const cancellationContent = parseCancellationPolicy();

  // Don't render if no content
  if (!houseRulesContent && !cancellationContent) {
    return null;
  }

  return (
    <div className={styles.policySection}>
      <h2 className={styles.sectionTitle}>
        <FiFileText className={styles.titleIcon} />
        Policies
      </h2>

      <div className={styles.accordionList}>
        {/* House Rules */}
        {houseRulesContent && (
          <div className={styles.accordionItem}>
            <button
              onClick={() => setHouseRulesExpanded(!houseRulesExpanded)}
              className={styles.accordionButton}
            >
              <span className={styles.accordionTitle}>House Rules</span>
              {houseRulesExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {houseRulesExpanded && (
              <div className={styles.accordionContent}>{houseRulesContent}</div>
            )}
          </div>
        )}

        {/* Cancellation Policy */}
        {cancellationContent && (
          <div className={styles.accordionItem}>
            <button
              onClick={() => setCancellationExpanded(!cancellationExpanded)}
              className={styles.accordionButton}
            >
              <span className={styles.accordionTitle}>
                <FiXCircle className={styles.cancellationIcon} />
                Cancellation Policy
              </span>
              {cancellationExpanded ? (
                <FiChevronUp className={styles.chevronIcon} />
              ) : (
                <FiChevronDown className={styles.chevronIcon} />
              )}
            </button>

            {cancellationExpanded && (
              <div className={styles.accordionContent}>
                {cancellationContent}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
