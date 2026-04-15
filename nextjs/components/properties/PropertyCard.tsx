"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiStar,
  FiUsers,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import Image from "next/image";
import type { Property } from "@/types";
import styles from "./PropertyCard.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModals } from "@/contexts/AuthModalContext";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import Toast from "@/components/ui/Toast";
import {
  useCorporateUser,
  calculateCorporateSavings,
} from "@/hooks/useCorporateUser";
import { getImageUrl } from "@/lib/imageUtils";

interface PropertyCardProps {
  property: Property;
  onWishlistToggle?: (propertyId: string, isWishlisted: boolean) => void;
  initialWishlistState?: boolean;
  checkin?: string;
  checkout?: string;
}

export default function PropertyCard({
  property,
  onWishlistToggle,
  initialWishlistState = false,
  checkin,
  checkout,
}: PropertyCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModals();
  const { showCorporateFeatures } = useCorporateUser();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [nextPhotoIndex, setNextPhotoIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlistState);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Check if property has corporate discount
  const hasCorporateDiscount =
    (property.corporate_discount_percentage || 0) > 0;
  const corporateDiscountPercent = property.corporate_discount_percentage || 0;

  // Original-price discount badge (original_price > price_per_night)
  const originalPrice = property.original_price
    ? Number(property.original_price)
    : null;
  const discountedPrice = Number(property.price_per_night) || 0;
  const hasOriginalDiscount =
    originalPrice !== null && originalPrice > discountedPrice;
  const originalDiscountPercent = hasOriginalDiscount
    ? Math.round(((originalPrice! - discountedPrice) / originalPrice!) * 100)
    : 0;

  // Calculate corporate pricing
  const corporatePricing =
    hasCorporateDiscount && showCorporateFeatures
      ? calculateCorporateSavings(
          property.price_per_night,
          corporateDiscountPercent,
        )
      : null;

  // Professional placeholder images from Unsplash
  const defaultPhotos = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  ];

  // Normalize photos to array
  const photosArray = Array.isArray(property.photos)
    ? property.photos
    : property.photos
      ? [property.photos]
      : [];

  const photos = (photosArray.length > 0 ? photosArray : defaultPhotos).map(
    getImageUrl,
  );

  // Check wishlist status on mount if user is logged in
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user) {
        // User not logged in, reset wishlist state
        setIsWishlisted(false);
        return;
      }

      try {
        const response = await api.get(
          API_ENDPOINTS.WISHLIST.CHECK(property.id),
        );
        setIsWishlisted(response.data.data.isWishlisted);
      } catch (error) {
        // Silently fail for 401 (not authenticated) or other errors
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          // User token expired or invalid, reset wishlist state
          setIsWishlisted(false);
        }
        // Don't show error to user - not critical
        console.debug(
          "Wishlist check skipped:",
          err.response?.status || "Network error",
        );
      }
    };

    checkWishlistStatus();
  }, [user, property.id]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user is logged in - open modal instead of showing toast
    if (!user) {
      openLoginModal();
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    const newWishlistState = !isWishlisted;

    try {
      if (newWishlistState) {
        // Add to wishlist
        await api.post(API_ENDPOINTS.WISHLIST.ADD, {
          property_id: property.id,
        });
        setIsWishlisted(true);
        setToast({
          message: "Added to favorites",
          type: "success",
        });
      } else {
        // Remove from wishlist
        await api.delete(API_ENDPOINTS.WISHLIST.REMOVE(property.id));
        setIsWishlisted(false);
        setToast({
          message: "Removed from favorites",
          type: "success",
        });
      }

      // Call parent callback if provided
      onWishlistToggle?.(property.id, newWishlistState);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Wishlist operation failed:", error);
      setToast({
        message:
          err.response?.data?.message ||
          "Failed to update wishlist. Please try again.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    const dateParams =
      checkin && checkout ? `?checkIn=${checkin}&checkOut=${checkout}` : "";
    router.push(`/properties/${property.id}${dateParams}`);
  };

  // Two-layer crossfade: old image stays visible, new one pixel-reveals on top
  const changePhoto = useCallback(
    (getNext: (prev: number) => number) => {
      if (isTransitioning) return; // prevent overlap
      const next = getNext(currentPhotoIndex);
      setNextPhotoIndex(next);
      setIsTransitioning(true);
    },
    [currentPhotoIndex, isTransitioning],
  );

  const handleTransitionEnd = useCallback(() => {
    if (nextPhotoIndex !== null) {
      setCurrentPhotoIndex(nextPhotoIndex);
    }
    setNextPhotoIndex(null);
    setIsTransitioning(false);
  }, [nextPhotoIndex]);

  // Auto-scroll: advance every 3 s, pause while hovering
  useEffect(() => {
    if (photos.length <= 1) return;
    if (isImageHovered) return;
    const timer = setInterval(() => {
      changePhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isImageHovered, photos.length, changePhoto]);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    changePhoto((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    changePhoto((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.propertyCard} onClick={handleCardClick}>
      {/* Image Container with Carousel */}
      <div
        className={styles.propertyCardImageContainer}
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        {/* Bottom layer: current image — always visible, never hides */}
        <div className={styles.propertyCardImage}>
          <Image
            src={photos[currentPhotoIndex]}
            alt={property.title || `${property.city} Villa`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.propertyImage}
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </div>

        {/* Top layer: incoming image pixel-reveals on top; on finish becomes bottom */}
        {isTransitioning && nextPhotoIndex !== null && (
          <div
            className={styles.propertyCardImageTop}
            onAnimationEnd={handleTransitionEnd}
          >
            <Image
              src={photos[nextPhotoIndex]}
              alt={property.title || `${property.city} Villa`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={styles.propertyImage}
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        )}

        {/* Wishlist Button */}
        <button
          className={`${styles.wishlistBtn} ${
            isWishlisted ? styles.active : ""
          } ${isProcessing ? styles.processing : ""}`}
          onClick={handleWishlistClick}
          disabled={isProcessing}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FiHeart />
        </button>

        {/* Photo Navigation - Show on Hover */}
        {isImageHovered && photos.length > 1 && (
          <>
            <button
              className={`${styles.photoNavBtn} ${styles.prev}`}
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M7.5 2L3.5 6L7.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={`${styles.photoNavBtn} ${styles.next}`}
              onClick={handleNextPhoto}
              aria-label="Next photo"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4.5 2L8.5 6L4.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <div className={styles.photoIndicators}>
            {photos.map((_, index) => (
              <div
                key={index}
                className={`${styles.indicator} ${
                  index === currentPhotoIndex ? styles.active : ""
                }`}
              />
            ))}
          </div>
        )}

        {/* Verified Badge (if property has high rating) */}
        {property.rating >= 4.8 && property.reviews_count >= 10 && (
          <div className={styles.verifiedBadge}>
            <FiStar /> Superhost
          </div>
        )}

        {/* Corporate Rate Badge - Only for corporate users */}
        {showCorporateFeatures && hasCorporateDiscount && (
          <div className={styles.corporateBadge}>
            <FiBriefcase /> Corporate Rate
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className={styles.propertyCardContent}>
        {/* Location & Rating Row */}
        <div className={styles.propertyCardHeader}>
          <div
            className={styles.propertyLocation}
          >
            <FiMapPin className={styles.locationIcon} />
            <span className={styles.locationText}>
              {property.area
                ? `${property.area}, ${property.city}`
                : `${property.city}, ${property.state}`}
            </span>
          </div>
          {property.rating > 0 && (
            <div className={styles.propertyRating}>
              <FiStar className={styles.starIcon} />
              <span className={styles.ratingValue}>
                {Number(property.rating).toFixed(1)}
              </span>
              <span className={styles.ratingCount}>
                ({property.reviews_count || 0})
              </span>
            </div>
          )}
        </div>

        {/* Property Name */}
        <h3 className={styles.propertyCardName}>{property.title}</h3>

        {/* Property Details */}
        <div className={styles.propertyCardDetails}>
          <div className={styles.detailItem}>
            <FiUsers />
            <span>{property.max_guests} guests</span>
          </div>
          <div className={styles.detailItem}>
            <IoBed />
            <span>{property.bedrooms} bedrooms</span>
          </div>
        </div>

        {/* Price */}
        <div className={styles.propertyCardFooter}>
          <div className={styles.propertyPrice}>
            {corporatePricing ? (
              <>
                <div className={styles.corporatePricing}>
                  <span className={styles.originalPrice}>
                    ₹
                    {parseFloat(
                      String(property.price_per_night || 0),
                    ).toLocaleString("en-IN")}
                  </span>
                  <span className={styles.priceAmount}>
                    ₹
                    {parseFloat(
                      String(corporatePricing.discountedPrice || 0),
                    ).toLocaleString("en-IN")}
                  </span>
                  <span className={styles.pricePeriod}>/ night</span>
                </div>
                <div className={styles.savingsText}>
                  Save {corporatePricing.savingsPercent}%
                </div>
              </>
            ) : hasOriginalDiscount ? (
              <>
                <div className={styles.discountPricing}>
                  <span className={styles.originalPrice}>
                    ₹{originalPrice!.toLocaleString("en-IN")}
                  </span>
                  <span className={styles.priceAmount}>
                    ₹{discountedPrice.toLocaleString("en-IN")}
                  </span>
                  <span className={styles.pricePeriod}>/ night</span>
                </div>
                <span className={styles.discountBadge}>
                  {originalDiscountPercent}% off
                </span>
              </>
            ) : (
              <>
                <span className={styles.priceAmount}>
                  ₹
                  {parseFloat(
                    String(property.price_per_night || 0),
                  ).toLocaleString("en-IN")}
                </span>
                <span className={styles.pricePeriod}>/ night</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
