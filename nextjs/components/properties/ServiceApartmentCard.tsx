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

interface ServiceApartmentCardProps {
  property: ServiceApartment;
  onWishlistToggle: (propertyId: string, isWishlisted: boolean) => void;
}

export default function ServiceApartmentCard({
  property,
  onWishlistToggle,
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
          corporateDiscountPercent
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
        const response = await api.get("/wishlist/my");
        const wishlist = response.data.data.wishlist || [];
        const isInWishlist = wishlist.some(
          (item: { property_id: string }) =>
            item.property_id === property.id ||
            item.property_id === property.property_id
        );
        setIsWishlisted(isInWishlist);
      } catch {
        // Silently fail - user might not be authenticated or token expired
        setIsWishlisted(false);
      }
    };

    checkWishlist();
  }, [property.id, property.property_id]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    await onWishlistToggle(
      property.id || property.property_id || "",
      isWishlisted
    );
    setIsWishlisted(!isWishlisted);
    setLoading(false);
  };

  const defaultPhoto =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop";
  const photos =
    Array.isArray(property.photos) && property.photos.length > 0
      ? property.photos
      : [defaultPhoto];

  const monthlyDiscount =
    property.monthly_discount_percent ||
    property.monthly_discount_percentage ||
    0;

  return (
    <Link
      href={`/service-apartments/${property.id || property.property_id}`}
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
        <div className={styles.location}>
          <FiMapPin className={styles.locationIcon} />
          <span>
            {property.city}, {property.state}
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
