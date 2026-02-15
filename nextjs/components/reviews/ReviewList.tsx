/**
 * ReviewList Component
 * Session 64: Display property reviews with ratings, photos, and pagination
 *
 * Features:
 * - Overall rating statistics with breakdown bars
 * - Individual review cards with stars, text, photos
 * - Photo lightbox for fullscreen viewing
 * - Pagination with page navigation
 * - Admin-edited badges
 * - Empty and loading states
 *
 * @example
 * ```tsx
 * <ReviewList propertyId="property-123" initialLimit={10} />
 * ```
 */

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FiStar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiMessageSquare,
} from "react-icons/fi";
import styles from "./ReviewList.module.css";
import { api } from "@/lib/axios";

interface Review {
  id: string;
  guest_name: string;
  review_text: string | null;
  cleanliness_rating: number;
  accuracy_rating: number;
  communication_rating: number;
  location_rating: number;
  check_in_rating: number;
  value_rating: number;
  overall_rating: number;
  photos: string[] | null;
  created_at: string;
  edited_by_admin: boolean;
  admin_notes: string | null;
}

interface ReviewStatistics {
  total: number;
  average: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewListProps {
  propertyId: string;
  initialLimit?: number;
  showStatistics?: boolean;
  className?: string;
}

const RATING_CATEGORIES = [
  { key: "cleanliness_rating", label: "Cleanliness" },
  { key: "accuracy_rating", label: "Accuracy" },
  { key: "communication_rating", label: "Communication" },
  { key: "location_rating", label: "Location" },
  { key: "check_in_rating", label: "Check-in" },
  { key: "value_rating", label: "Value" },
];

const ReviewList: React.FC<ReviewListProps> = ({
  propertyId,
  initialLimit = 10,
  showStatistics = true,
  className = "",
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(
        `/properties/${propertyId}/reviews?page=${currentPage}&limit=${initialLimit}`,
      );
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, currentPage, initialLimit]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await api.get(
        `/properties/${propertyId}/reviews/statistics`,
      );
      setStatistics(response.data);
    } catch (err: unknown) {
      console.error("Failed to fetch review statistics:", err);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReviews();
    if (showStatistics) {
      fetchStatistics();
    }
  }, [fetchReviews, fetchStatistics, showStatistics]);

  const renderStars = (
    rating: number,
    size: "small" | "medium" | "large" = "small",
  ) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FiStar
            key={i}
            className={`${styles.star} ${styles[size]} ${styles.filled}`}
          />,
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FiStar
            key={i}
            className={`${styles.star} ${styles[size]} ${styles.halfFilled}`}
          />,
        );
      } else {
        stars.push(
          <FiStar
            key={i}
            className={`${styles.star} ${styles[size]} ${styles.empty}`}
          />,
        );
      }
    }

    return <div className={styles.starContainer}>{stars}</div>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
  };

  const openLightbox = (photos: string[], index: number) => {
    setCurrentPhotos(photos);
    setSelectedPhoto(photos[index]);
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto("");
    setCurrentPhotos([]);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (selectedPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length
        : (selectedPhotoIndex + 1) % currentPhotos.length;
    setSelectedPhotoIndex(newIndex);
    setSelectedPhoto(currentPhotos[newIndex]);
  };

  if (loading && currentPage === 1) {
    return (
      <div className={`${styles.reviewList} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.loadingSkeleton}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.reviewList} ${className}`}>
        <div className={styles.error}>
          <FiAlertCircle />
          <p>{error}</p>
          <button onClick={fetchReviews} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`${styles.reviewList} ${className}`}>
        <div className={styles.empty}>
          <FiMessageSquare />
          <h3>No Reviews Yet</h3>
          <p>Be the first to share your experience at this property!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.reviewList} ${className}`}>
      {/* Statistics Section */}
      {showStatistics && statistics && (
        <div className={styles.statistics}>
          <div className={styles.statisticsHeader}>
            <div className={styles.overallRating}>
              <div className={styles.ratingNumber}>
                {statistics.average.toFixed(1)}
              </div>
              {renderStars(statistics.average, "large")}
              <div className={styles.totalReviews}>
                {statistics.total}{" "}
                {statistics.total === 1 ? "Review" : "Reviews"}
              </div>
            </div>
          </div>

          <div className={styles.breakdown}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                statistics.breakdown[
                  star as keyof typeof statistics.breakdown
                ] || 0;
              const percentage =
                statistics.total > 0 ? (count / statistics.total) * 100 : 0;

              return (
                <div key={star} className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>{star} ★</span>
                  <div className={styles.breakdownBar}>
                    <div
                      className={styles.breakdownFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.breakdownCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      <div className={styles.reviewsGrid}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            {/* Header */}
            <div className={styles.reviewHeader}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {review.guest_name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>{review.guest_name}</div>
                  <div className={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </div>
              <div className={styles.ratingInfo}>
                {renderStars(review.overall_rating, "small")}
                <span className={styles.ratingNumber}>
                  {review.overall_rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Review Text */}
            {review.review_text && (
              <div className={styles.reviewText}>
                <p>{review.review_text}</p>
              </div>
            )}

            {/* Category Ratings */}
            <div className={styles.categoryRatings}>
              {RATING_CATEGORIES.map((category) => {
                const rating = review[category.key as keyof Review] as number;
                if (rating === 0) return null;

                return (
                  <div key={category.key} className={styles.categoryItem}>
                    <span className={styles.categoryLabel}>
                      {category.label}
                    </span>
                    <div className={styles.categoryStars}>
                      {renderStars(rating, "small")}
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Photos */}
            {review.photos && review.photos.length > 0 && (
              <div className={styles.photoGallery}>
                {review.photos.map((photo, index) => (
                  <div
                    key={index}
                    className={styles.photoThumbnail}
                    onClick={() => openLightbox(review.photos!, index)}
                  >
                    <Image
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Admin Badge */}
            {review.edited_by_admin && (
              <div className={styles.adminBadge}>
                <span>✏️ Edited by Admin</span>
                {review.admin_notes && (
                  <span className={styles.adminTooltip}>
                    {review.admin_notes}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <FiChevronLeft /> Previous
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and neighbors
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`${styles.pageNumber} ${
                      page === currentPage ? styles.active : ""
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className={styles.ellipsis}>
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button className={styles.lightboxClose} onClick={closeLightbox}>
            <FiX />
          </button>

          {currentPhotos.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
              >
                <FiChevronLeft />
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
              >
                <FiChevronRight />
              </button>
            </>
          )}

          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto}
              alt="Review photo"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>

          <div className={styles.lightboxCounter}>
            {selectedPhotoIndex + 1} / {currentPhotos.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
