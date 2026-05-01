"use client";

import { useState, useEffect, useCallback } from "react";
import { FiStar, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { api } from "@/lib/axios";
import PropertyCard from "@/components/properties/PropertyCard";
import type { Property as SharedProperty } from "@/types";
import styles from "./RecommendedProperties.module.css";

interface RecommendedProperty {
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
  original_price?: number | string | null;
  corporate_discount_percentage?: number;
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
  const [properties, setProperties] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailBasePath =
    propertyType === "service_apartment"
      ? "/service-apartments"
      : "/properties";

  const toPropertyCardShape = (
    property: RecommendedProperty,
  ): SharedProperty => ({
    id: property.id,
    name: property.title,
    title: property.title,
    description: property.description || "",
    address: "",
    area: property.area,
    city: property.city,
    state: property.state,
    pincode: "",
    maps_location: property.maps_location,
    price_per_night: property.price_per_night,
    original_price: property.original_price,
    max_guests: property.max_guests,
    bedrooms: property.bedrooms,
    bathrooms: 0,
    amenities: [],
    photos:
      Array.isArray(property.photos) && property.photos.length > 0
        ? property.photos
        : Array.isArray(property.images)
          ? property.images.map((image) => image.image_url)
          : [],
    rating: property.rating || 0,
    reviews_count: property.reviews_count || 0,
    status: "active",
    corporate_discount_percentage: property.corporate_discount_percentage,
    property_type: propertyType,
  });

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
            <div key={property.id} className={styles.cardSlot}>
              <PropertyCard
                property={toPropertyCardShape(property)}
                detailBasePath={detailBasePath}
                forceVertical={true}
              />
            </div>
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
