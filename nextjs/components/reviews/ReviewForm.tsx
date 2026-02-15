/**
 * ReviewForm Component
 *
 * Post-stay review submission form with:
 * - 6 category ratings (interactive stars)
 * - Review text
 * - Photo upload (max 5 photos, 5MB each, R2 storage)
 * - Guest name override
 *
 * @component
 * @example
 * ```tsx
 * <ReviewForm
 *   bookingId="booking-123"
 *   propertyName="Sunset Villa"
 *   onSuccess={() => console.log('Review submitted')}
 * />
 * ```
 */

import React, { useState } from "react";
import Image from "next/image";
import {
  FiStar,
  FiX,
  FiImage,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { api } from "@/lib/axios";
import styles from "./ReviewForm.module.css";

interface ReviewFormProps {
  bookingId: string;
  propertyName: string;
  userName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface RatingCategory {
  key: string;
  label: string;
  description: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  {
    key: "cleanliness_rating",
    label: "Cleanliness",
    description: "How clean was the property?",
  },
  {
    key: "accuracy_rating",
    label: "Accuracy",
    description: "Did the listing match reality?",
  },
  {
    key: "communication_rating",
    label: "Communication",
    description: "How responsive was the host?",
  },
  {
    key: "location_rating",
    label: "Location",
    description: "Was the location convenient?",
  },
  {
    key: "check_in_rating",
    label: "Check-in",
    description: "Was check-in smooth?",
  },
  {
    key: "value_rating",
    label: "Value for Money",
    description: "Was it worth the price?",
  },
];

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ReviewForm({
  bookingId,
  propertyName,
  userName = "",
  onSuccess,
  onCancel,
  className = "",
}: ReviewFormProps) {
  // Form state
  const [ratings, setRatings] = useState<Record<string, number>>({
    cleanliness_rating: 0,
    accuracy_rating: 0,
    communication_rating: 0,
    location_rating: 0,
    check_in_rating: 0,
    value_rating: 0,
  });
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState("");
  const [guestName, setGuestName] = useState(userName);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle star rating click
  const handleRatingClick = (category: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [category]: rating }));
  };

  // Handle star hover
  const handleStarHover = (category: string, rating: number) => {
    setHoverRatings((prev) => ({ ...prev, [category]: rating }));
  };

  // Handle star hover leave
  const handleStarLeave = (category: string) => {
    setHoverRatings((prev) => ({ ...prev, [category]: 0 }));
  };

  // Render interactive stars
  const renderStars = (category: string) => {
    const currentRating = ratings[category] || 0;
    const hoverRating = hoverRatings[category] || 0;
    const displayRating = hoverRating || currentRating;

    return (
      <div className={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.starButton} ${
              star <= displayRating ? styles.starFilled : styles.starEmpty
            }`}
            onClick={() => handleRatingClick(category, star)}
            onMouseEnter={() => handleStarHover(category, star)}
            onMouseLeave={() => handleStarLeave(category)}
            aria-label={`Rate ${star} stars`}
          >
            <FiStar />
          </button>
        ))}
        <span className={styles.ratingLabel}>
          {currentRating > 0 ? `${currentRating}/5` : "Not rated"}
        </span>
      </div>
    );
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Use JPG, PNG, or WebP`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `${file.name}: File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        );
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setPhotos((prev) => [...prev, ...validFiles]);
    setPhotoPreview((prev) => [...prev, ...previews]);
    setError("");
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreview[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload photos to R2
  const uploadPhotosToR2 = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("image", photo);
        formData.append("folder", "reviews");

        const response = await api.post("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = response.data?.data?.url || response.data?.url;
        if (url) uploadedUrls.push(url);
      }

      return uploadedUrls;
    } catch (err) {
      console.error("Photo upload error:", err);
      throw new Error("Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation: at least one rating required
    const hasRatings = Object.values(ratings).some((r) => r > 0);
    if (!hasRatings) {
      setError("Please provide at least one rating");
      return;
    }

    // Validation: review text (optional but recommended)
    if (reviewText.trim().length > 0 && reviewText.trim().length < 10) {
      setError("Review text must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload photos to R2
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotosToR2();
      }

      // Step 2: Submit review
      const reviewData = {
        booking_id: bookingId,
        review_text: reviewText.trim() || null,
        guest_name: guestName.trim() || null,
        ...ratings,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      };

      await api.post(`/bookings/${bookingId}/reviews`, reviewData);

      // Success
      setSuccess(true);

      // Clean up photo preview URLs
      photoPreview.forEach((url) => URL.revokeObjectURL(url));

      // Call onSuccess callback
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err: unknown) {
      console.error("Review submission error:", err);

      let errorMessage = "Failed to submit review. Please try again.";
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
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
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (success) {
    return (
      <div className={`${styles.successContainer} ${className}`}>
        <div className={styles.successIcon}>
          <FiCheckCircle />
        </div>
        <h3 className={styles.successTitle}>Thank You for Your Review!</h3>
        <p className={styles.successMessage}>
          Your review has been submitted successfully. It will be published
          after admin approval.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.reviewForm} ${className}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Share Your Experience</h3>
        <p className={styles.subtitle}>
          How was your stay at <strong>{propertyName}</strong>?
        </p>
      </div>

      {/* Rating Categories */}
      <div className={styles.ratingsSection}>
        <h4 className={styles.sectionTitle}>Rate Your Stay</h4>
        <div className={styles.ratingsGrid}>
          {RATING_CATEGORIES.map((category) => (
            <div key={category.key} className={styles.ratingItem}>
              <div className={styles.ratingHeader}>
                <label className={styles.ratingLabel}>{category.label}</label>
                <span className={styles.ratingDescription}>
                  {category.description}
                </span>
              </div>
              {renderStars(category.key)}
            </div>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className={styles.textSection}>
        <label className={styles.label} htmlFor="reviewText">
          Write Your Review <span className={styles.optional}>(Optional)</span>
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with future guests... What did you love? Any suggestions?"
          className={styles.textarea}
          rows={6}
          maxLength={1000}
        />
        <div className={styles.charCount}>
          {reviewText.length}/1000 characters
        </div>
      </div>

      {/* Guest Name Override */}
      <div className={styles.nameSection}>
        <label className={styles.label} htmlFor="guestName">
          Display Name <span className={styles.optional}>(Optional)</span>
        </label>
        <input
          type="text"
          id="guestName"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder={userName || "Your name"}
          className={styles.input}
          maxLength={50}
        />
        <span className={styles.hint}>
          Leave blank to use your account name
        </span>
      </div>

      {/* Photo Upload */}
      <div className={styles.photoSection}>
        <label className={styles.label}>
          Add Photos <span className={styles.optional}>(Optional, Max 5)</span>
        </label>
        <p className={styles.photoHint}>
          JPG, PNG, or WebP • Max 5MB per photo
        </p>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className={styles.photoGrid}>
            {photoPreview.map((preview, index) => (
              <div key={index} className={styles.photoItem}>
                <Image
                  src={preview}
                  alt={`Review photo ${index + 1}`}
                  className={styles.photoPreview}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className={styles.photoRemove}
                  aria-label="Remove photo"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {photos.length < MAX_PHOTOS && (
          <label className={styles.uploadButton}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className={styles.fileInput}
            />
            <FiImage />
            <span>
              {photos.length === 0
                ? "Add Photos"
                : `Add More (${photos.length}/${MAX_PHOTOS})`}
            </span>
          </label>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage} role="alert">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploadingPhotos}
          className={styles.submitButton}
        >
          {loading || uploadingPhotos ? (
            <>
              <FiLoader className={styles.spinner} />
              {uploadingPhotos ? "Uploading Photos..." : "Submitting..."}
            </>
          ) : (
            <>
              <FiCheckCircle />
              Submit Review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
