"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiUsers, FiMapPin } from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import Image from "next/image";
import type { Property } from "@/types";
import "./PropertyCard.css";

interface PropertyCardProps {
  property: Property;
  onWishlistToggle?: (propertyId: string, isWishlisted: boolean) => void;
}

export default function PropertyCard({
  property,
  onWishlistToggle,
}: PropertyCardProps) {
  const router = useRouter();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

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

  const photos = photosArray.length > 0 ? photosArray : defaultPhotos;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newWishlistState = !isWishlisted;
    setIsWishlisted(newWishlistState);
    onWishlistToggle?.(property.id, newWishlistState);
  };

  const handleCardClick = () => {
    router.push(`/properties/${property.id}`);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="property-card" onClick={handleCardClick}>
      {/* Image Container with Carousel */}
      <div
        className="property-card-image-container"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <div className="property-card-image">
          <Image
            src={photos[currentPhotoIndex]}
            alt={property.title || `${property.city} Villa`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="property-image"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FiHeart />
        </button>

        {/* Photo Navigation - Show on Hover */}
        {isImageHovered && photos.length > 1 && (
          <>
            <button
              className="photo-nav-btn prev"
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
              className="photo-nav-btn next"
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
          <div className="photo-indicators">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`indicator ${
                  index === currentPhotoIndex ? "active" : ""
                }`}
              />
            ))}
          </div>
        )}

        {/* Verified Badge (if property has high rating) */}
        {property.rating >= 4.8 && property.reviews_count >= 10 && (
          <div className="verified-badge">
            <FiStar /> Superhost
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="property-card-content">
        {/* Location & Rating Row */}
        <div className="property-card-header">
          <div className="property-location">
            <FiMapPin className="location-icon" />
            <span className="location-text">
              {property.city}, {property.state}
            </span>
          </div>
          {property.rating > 0 && (
            <div className="property-rating">
              <FiStar className="star-icon" />
              <span className="rating-value">
                {Number(property.rating).toFixed(1)}
              </span>
              <span className="rating-count">({property.reviews_count})</span>
            </div>
          )}
        </div>

        {/* Property Name */}
        <h3 className="property-card-name">{property.title}</h3>

        {/* Property Details */}
        <div className="property-card-details">
          <div className="detail-item">
            <FiUsers />
            <span>{property.max_guests} guests</span>
          </div>
          <div className="detail-item">
            <IoBed />
            <span>{property.bedrooms} bedrooms</span>
          </div>
        </div>

        {/* Price */}
        <div className="property-card-footer">
          <div className="property-price">
            <span className="price-amount">
              ₹{property.price_per_night.toLocaleString()}
            </span>
            <span className="price-period">/ night</span>
          </div>
        </div>
      </div>
    </div>
  );
}
