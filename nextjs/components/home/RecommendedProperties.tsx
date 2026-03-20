"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiStar,
  FiMapPin,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { api } from "@/lib/axios";
import { getPropertyMainImage } from "@/lib/imageUtils";
import styles from "./RecommendedProperties.module.css";

interface Property {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  area?: string;
  maps_location?: string;
  bedrooms: number;
  max_guests: number;
  price_per_night: number;
  rating: number;
  reviews_count: number;
  photos: string[];
  images: Array<{ id: string; image_url: string }>;
}

interface RecommendedPropertiesProps {
  propertyType: "villa" | "service_apartment";
  title?: string;
  description?: string;
  className?: string;
}

export default function RecommendedProperties({
  propertyType,
  title = "Recommended for You",
  description = "Hand-picked properties curated by our experts for exceptional stays",
  className = "",
}: RecommendedPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendedProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/public/recommended-properties?type=${propertyType}`,
      );
      setProperties(response.data.data.properties || []);
    } catch (err) {
      console.error("Error fetching recommended properties:", err);
      setError("Unable to load recommended properties");
    } finally {
      setLoading(false);
    }
  }, [propertyType]);

  useEffect(() => {
    fetchRecommendedProperties();
  }, [fetchRecommendedProperties]);

  // Show first 3, then expand to show all
  const visibleProperties = showAll ? properties : properties.slice(0, 3);
  const hasMore = properties.length > 3;

  if (loading) {
    return (
      <section className={`${styles.section} ${className}`}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading recommended properties...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || properties.length === 0) {
    return null; // Don't show section if no properties
  }

  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.badge}>
            <FiStar /> Recommended
          </span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        {/* Properties Grid */}
        <div className={styles.grid}>
          {visibleProperties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className={styles.card}
            >
              {/* Image */}
              <div className={styles.imageWrapper}>
                <Image
                  src={getPropertyMainImage(property)}
                  alt={property.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.image}
                  unoptimized
                />
                {/* Recommended Badge */}
                <div className={styles.recommendedBadge}>
                  <FiStar /> Recommended
                </div>
              </div>

              {/* Content */}
              <div className={styles.cardContent}>
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
                  <FiMapPin />
                  <span>
                    {property.area
                      ? `${property.area}, ${property.city}`
                      : `${property.city}, ${property.state}`}
                  </span>
                </div>

                {/* Title */}
                <h3 className={styles.propertyTitle}>{property.title}</h3>

                {/* Stats */}
                <div className={styles.stats}>
                  <span className={styles.stat}>{property.bedrooms} BHK</span>
                  <span className={styles.stat}>
                    <FiUsers /> {property.max_guests} Guests
                  </span>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                  <div className={styles.price}>
                    <span className={styles.amount}>
                      ₹{(property.price_per_night || 0).toLocaleString("en-IN")}
                    </span>
                    <span className={styles.period}>/ night</span>
                  </div>
                  {property.rating && property.rating > 0 && (
                    <div className={styles.rating}>
                      <FiStar />
                      <span>{Number(property.rating).toFixed(1)}</span>
                      <span className={styles.reviewsCount}>
                        ({property.reviews_count || 0})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Show More Button */}
        {hasMore && (
          <div className={styles.showMoreContainer}>
            <button
              onClick={() => setShowAll(!showAll)}
              className={styles.showMoreBtn}
            >
              {showAll ? (
                <>
                  Show Less <FiChevronUp />
                </>
              ) : (
                <>
                  Show More <FiChevronDown />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
