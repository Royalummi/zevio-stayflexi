import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHeart,
  FiMapPin,
  FiStar,
  FiBriefcase,
  FiCoffee,
  FiTruck,
} from "react-icons/fi";
import { MdOutlineElevator, MdFitnessCenter } from "react-icons/md";
import type { ServiceApartment } from "@/app/service-apartments/page";
import { api } from "@/lib/axios";
import styles from "./ServiceApartmentCard.module.css";
import {
  useCorporateUser,
  calculateCorporateSavings,
} from "@/hooks/useCorporateUser";
import { getImageUrl } from "@/lib/imageUtils";

interface ServiceApartmentCardProps {
  property: ServiceApartment;
  onWishlistToggle: (propertyId: string, isWishlisted: boolean) => void;
  checkin?: string;
  checkout?: string;
}

export default function ServiceApartmentCard({
  property,
  onWishlistToggle,
  checkin,
  checkout,
}: ServiceApartmentCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showCorporateFeatures } = useCorporateUser();

  // Check corporate discount
  const hasCorporateDiscount =
    (property.corporate_discount_percentage ||
      property.corporate_discount_percent ||
      0) > 0;
  const corporateDiscountPercent =
    property.corporate_discount_percentage ||
    property.corporate_discount_percent ||
    0;

  // Calculate corporate pricing
  const corporatePricing =
    hasCorporateDiscount && showCorporateFeatures
      ? calculateCorporateSavings(
          property.price_per_night,
          corporateDiscountPercent,
        )
      : null;

  useEffect(() => {
    const checkWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsWishlisted(false);
        return;
      }

      try {
        const targetId = property.id || property.property_id;
        if (!targetId) return;
        const response = await api.get(`/wishlist/check/${targetId}`);
        setIsWishlisted(response.data.data?.isWishlisted || false);
      } catch {
        setIsWishlisted(false);
      }
    };

    checkWishlist();
  }, [property.id, property.property_id]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      // Delegate to parent to show login toast / open modal
      onWishlistToggle(property.id || property.property_id || "", false);
      return;
    }

    const targetId = property.id || property.property_id || "";
    const wasWishlisted = isWishlisted;

    // Optimistic update — feels instant to the user
    setIsWishlisted(!wasWishlisted);
    setLoading(true);

    try {
      if (wasWishlisted) {
        await api.delete(`/wishlist/${targetId}`);
      } else {
        await api.post("/wishlist", { property_id: targetId });
      }
    } catch (error: unknown) {
      const status = (
        error as { response?: { status?: number; data?: { message?: string } } }
      )?.response?.status;
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "";

      if (status === 400 && message.toLowerCase().includes("already")) {
        // Already wishlisted — keep as true (don't revert)
        setIsWishlisted(true);
      } else if (status === 403) {
        // Non-user role — revert silently
        setIsWishlisted(wasWishlisted);
      } else {
        // Revert optimistic update on unexpected failure
        setIsWishlisted(wasWishlisted);
        console.error("Wishlist error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultPhoto =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop";
  const photos = (
    Array.isArray(property.photos) && property.photos.length > 0
      ? property.photos
      : [defaultPhoto]
  ).map(getImageUrl);

  const monthlyDiscount =
    property.monthly_discount_percent ||
    property.monthly_discount_percentage ||
    0;

  const cardId = property.id || property.property_id;
  const dateParams =
    checkin && checkout ? `?checkIn=${checkin}&checkOut=${checkout}` : "";

  return (
    <Link
      href={`/service-apartments/${cardId}${dateParams}`}
      className={styles.card}
    >
      {/* Image Section */}
      <div className={styles.imageWrapper}>
        <Image
          src={photos[0]}
          alt={property.title}
          width={400}
          height={300}
          className={styles.image}
          priority={false}
          unoptimized
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={loading}
          className={`${styles.wishlistBtn} ${
            isWishlisted ? styles.wishlisted : ""
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FiHeart className={isWishlisted ? styles.filledHeart : ""} />
        </button>

        {/* Discount Badge */}
        {monthlyDiscount > 0 && (
          <div className={styles.discountBadge}>
            {monthlyDiscount}% off monthly
          </div>
        )}

        {/* Corporate Rate Badge - Only for corporate users */}
        {showCorporateFeatures && hasCorporateDiscount && (
          <div className={styles.corporateBadge}>
            <FiBriefcase /> Corporate Rate
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{property.title}</h3>
          <div className={styles.rating}>
            <FiStar className={styles.starIcon} />
            <span className={styles.ratingValue}>{property.rating}</span>
            <span className={styles.reviewsCount}>
              ({property.reviews_count || property.total_reviews || 0})
            </span>
          </div>
        </div>

        {/* Location */}
        <div
          className={`${styles.location} ${property.maps_location ? styles.locationClickable : ""}`}
          onClick={(e) => {
            if (property.maps_location) {
              e.preventDefault();
              e.stopPropagation();
              window.open(property.maps_location, "_blank");
            }
          }}
          title={property.maps_location ? "View on Google Maps" : ""}
        >
          <FiMapPin className={styles.locationIcon} />
          <span>
            {property.area
              ? `${property.area}, ${property.city}`
              : `${property.city}, ${property.state}`}
          </span>
        </div>

        {/* Specs */}
        <div className={styles.specs}>
          <span className={styles.spec}>{property.bedrooms} BHK</span>
          <span className={styles.dot}>·</span>
          <span className={styles.spec}>
            Up to {property.max_guests || property.max_occupancy || 2} guests
          </span>
        </div>

        {/* Amenities Icons */}
        <div className={styles.amenities}>
          {property.has_workspace && (
            <div className={styles.amenityIcon} title="Workspace">
              <FiBriefcase />
            </div>
          )}
          {property.has_housekeeping && (
            <div className={styles.amenityIcon} title="Housekeeping">
              <FiCoffee />
            </div>
          )}
          {property.has_elevator && (
            <div className={styles.amenityIcon} title="Elevator">
              <MdOutlineElevator />
            </div>
          )}
          {property.has_gym && (
            <div className={styles.amenityIcon} title="Gym">
              <MdFitnessCenter />
            </div>
          )}
          {property.has_parking && (
            <div className={styles.amenityIcon} title="Parking">
              <FiTruck />
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className={styles.pricing}>
          {corporatePricing ? (
            <>
              <div className={styles.corporatePricing}>
                <span className={styles.originalPrice}>
                  ₹{property.price_per_night.toLocaleString("en-IN")}
                </span>
                <span className={styles.price}>
                  ₹{corporatePricing.discountedPrice.toLocaleString("en-IN")}
                </span>
                <span className={styles.perNight}>/ night</span>
              </div>
              <div className={styles.savingsText}>
                Save {corporatePricing.savingsPercent}%
              </div>
            </>
          ) : (
            <div className={styles.priceMain}>
              <span className={styles.price}>
                ₹{property.price_per_night.toLocaleString("en-IN")}
              </span>
              <span className={styles.perNight}>/ night</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
