"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiMapPin,
  FiPercent,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { getAmenityIcon, getPriorityAmenities } from "@/lib/amenityIconMap";
import styles from "./CorporatePropertyCard.module.css";

export interface CorporateProperty {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  bedrooms: number;
  max_guests: number;
  price_per_night: number;
  corporate_discount_percentage: number;
  discounted_price: number;
  min_stay_days: number;
  rating: number | null;
  reviews_count: number | null;
  photos: string[];
  propertyType: "villa" | "apartment";

  // API fields for amenities and features
  amenities?: string[];
  features?: string[];
  wifi_speed_mbps?: number;
  furnishing_type?: string;
  floor_number?: number;

  // Backward compatibility (deprecated)
  has_workspace?: boolean;
  has_housekeeping?: boolean;
  has_elevator?: boolean;
  has_parking?: boolean;
  wifi_speed?: string;
  parking_type?: string;
}

interface CorporatePropertyCardProps {
  property: CorporateProperty;
  onPropertyClick: (property: CorporateProperty) => void;
}

export default function CorporatePropertyCard({
  property,
  onPropertyClick,
}: CorporatePropertyCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? property.photos.length - 1 : prev - 1,
    );
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) =>
      prev === property.photos.length - 1 ? 0 : prev + 1,
    );
  };

  // Get amenities to display (prioritized top 4)
  const displayAmenities = property.amenities
    ? getPriorityAmenities(property.amenities, 4)
    : [];

  // Get features to display (first 3)
  const displayFeatures = property.features
    ? property.features.slice(0, 3)
    : [];

  return (
    <div
      className={styles.card}
      onClick={() => onPropertyClick(property)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <Image
            src={
              property.photos[currentPhotoIndex] || "/placeholder-property.jpg"
            }
            alt={property.title}
            width={400}
            height={280}
            className={styles.image}
            style={{ objectFit: "cover" }}
          />

          {/* Property Type Badge */}
          <div
            className={`${styles.typeBadge} ${
              property.propertyType === "villa"
                ? styles.typeBadgeVilla
                : styles.typeBadgeApartment
            }`}
          >
            {property.propertyType === "villa" ? "🏡 Villa" : "🏢 Service Apt"}
          </div>

          {/* Discount Badge */}
          <div className={styles.discountBadge}>
            <FiPercent size={14} />
            <span>{property.corporate_discount_percentage}% OFF</span>
          </div>

          {/* Photo Navigation - Show on Hover */}
          {isHovered && property.photos.length > 1 && (
            <>
              <button
                className={`${styles.navBtn} ${styles.prevBtn}`}
                onClick={handlePrevPhoto}
                aria-label="Previous photo"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                className={`${styles.navBtn} ${styles.nextBtn}`}
                onClick={handleNextPhoto}
                aria-label="Next photo"
              >
                <FiChevronRight size={20} />
              </button>
            </>
          )}

          {/* Photo Indicators */}
          {property.photos.length > 1 && (
            <div className={styles.indicators}>
              {property.photos.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.indicator} ${
                    index === currentPhotoIndex ? styles.indicatorActive : ""
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{property.title}</h3>
          <div className={styles.rating}>
            <FiStar className={styles.starIcon} />
            <span className={styles.ratingValue}>
              {property.rating ? Number(property.rating).toFixed(1) : "0.0"}
            </span>
            <span className={styles.reviewCount}>
              ({property.reviews_count || 0})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className={styles.location}>
          <FiMapPin size={14} />
          <span>
            {property.city}, {property.state}
          </span>
        </div>

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className={styles.amenities}>
            {displayAmenities.map((amenity, index) => {
              const { icon: Icon, label } = getAmenityIcon(amenity);
              return (
                <div key={index} className={styles.amenity} title={label}>
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Features Tags */}
        {displayFeatures.length > 0 && (
          <div className={styles.features}>
            {displayFeatures.map((feature, index) => (
              <span key={index} className={styles.featureTag}>
                {feature}
              </span>
            ))}
            {property.features && property.features.length > 3 && (
              <span className={styles.featureTag}>
                +{property.features.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className={styles.details}>
          <span>{property.bedrooms} Bedrooms</span>
          <span className={styles.separator}>•</span>
          <span>Up to {property.max_guests} Guests</span>
          <span className={styles.separator}>•</span>
          <span>Min {property.min_stay_days} nights</span>
        </div>

        {/* Pricing & CTA */}
        <div className={styles.footer}>
          <div className={styles.pricing}>
            <div className={styles.priceRow}>
              <span className={styles.originalPrice}>
                ₹{(property.price_per_night || 0).toLocaleString("en-IN")}
              </span>
              <span className={styles.discountedPrice}>
                ₹{(property.discounted_price || 0).toLocaleString("en-IN")}
              </span>
              <span className={styles.perNight}>/ night</span>
            </div>
            <p className={styles.savings}>
              Save ₹
              {(
                (property.price_per_night || 0) -
                (property.discounted_price || 0)
              ).toLocaleString("en-IN")}{" "}
              per night
            </p>
          </div>

          <button className={styles.viewBtn}>View Details</button>
        </div>
      </div>
    </div>
  );
}
