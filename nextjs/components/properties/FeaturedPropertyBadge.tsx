/**
 * ============================================================================
 * FEATURED PROPERTY BADGE COMPONENT
 * ============================================================================
 * Displays "Recommended by Zevio" badge for featured properties
 *
 * Features:
 * - Premium "Staff Pick" badge for recommended properties
 * - Priority indicator (High Priority, Medium Priority, etc.)
 * - Trust indicator for curated properties
 *
 * Phase: 4 - Booking Flexibility & Features
 * Date: February 15, 2026
 * ============================================================================
 */

import React from "react";
import styles from "./featured-property.module.css";
import { FiStar, FiAward, FiTrendingUp } from "react-icons/fi";

interface FeaturedPropertyBadgeProps {
  isRecommended?: boolean | number;
  recommendedPriority?: number;
}

const FeaturedPropertyBadge: React.FC<FeaturedPropertyBadgeProps> = ({
  isRecommended,
  recommendedPriority = 0,
}) => {
  // Convert boolean/number to boolean (handles MySQL tinyint)
  const isFeatured = Boolean(isRecommended);

  // Don't render if not recommended
  if (!isFeatured) {
    return null;
  }

  // Determine priority level based on priority number
  const getPriorityLevel = (priority: number) => {
    if (priority >= 9)
      return { text: "Top Pick", color: "gold", icon: <FiAward /> };
    if (priority >= 6)
      return { text: "Highly Recommended", color: "blue", icon: <FiStar /> };
    if (priority >= 3)
      return { text: "Staff Pick", color: "purple", icon: <FiTrendingUp /> };
    return { text: "Recommended", color: "green", icon: <FiStar /> };
  };

  const priorityInfo = getPriorityLevel(recommendedPriority);

  return (
    <div
      className={`${styles.featuredBadge} ${styles[`badge-${priorityInfo.color}`]}`}
    >
      <div className={styles.badgeIcon}>{priorityInfo.icon}</div>
      <div className={styles.badgeContent}>
        <div className={styles.badgeTitle}>{priorityInfo.text}</div>
        <div className={styles.badgeSubtitle}>
          Curated by our property experts
        </div>
      </div>
      <div className={styles.starDecoration}>
        <FiStar />
        <FiStar />
        <FiStar />
      </div>
    </div>
  );
};

export default FeaturedPropertyBadge;
