"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiMaximize2,
} from "react-icons/fi";
import styles from "./ImageGallery.module.css";

interface ImageGalleryProps {
  images: string[];
  title: string;
  maxThumbnails?: number; // Number of thumbnails to display before showing "+X" (default: 4 for Airbnb-style 2x2 grid)
}

export default function ImageGallery({
  images,
  title,
  maxThumbnails = 4,
}: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate remaining images count for overflow indicator
  const remainingImagesCount = Math.max(0, images.length - maxThumbnails);
  const displayedThumbnails = images.slice(0, maxThumbnails);

  // Main carousel navigation
  const goToPrevious = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Lightbox navigation
  const goToPreviousLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNextLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Open lightbox at specific index
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";
  };

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPreviousLightbox();
      } else if (e.key === "ArrowRight") {
        goToNextLightbox();
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, goToPreviousLightbox, goToNextLightbox]);

  // Prevent rendering if no images
  if (!images || images.length === 0) {
    return (
      <div className={styles.noImages}>
        <p>No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery Container - Airbnb Style Layout */}
      <div className={styles.galleryContainer}>
        {/* Left Side: Main Image with Carousel */}
        <div className={styles.mainImageSection}>
          <div className={styles.mainImageWrapper}>
            <Image
              src={images[currentImageIndex]}
              alt={`${title} - Image ${currentImageIndex + 1}`}
              fill
              style={{ objectFit: "cover" }}
              priority
              loading="eager"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 800px"
              onLoad={() => setImageLoaded(true)}
              className={`${styles.mainImage} ${imageLoaded ? styles.loaded : ""}`}
            />

            {/* Loading Spinner */}
            {!imageLoaded && (
              <div className={styles.imageLoader}>
                <div className={styles.spinner}></div>
              </div>
            )}

            {/* Carousel Navigation Arrows - Show only if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.carouselNav} ${styles.carouselNavLeft}`}
                  onClick={goToPrevious}
                  aria-label="Previous image"
                >
                  <FiChevronLeft />
                </button>
                <button
                  className={`${styles.carouselNav} ${styles.carouselNavRight}`}
                  onClick={goToNext}
                  aria-label="Next image"
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className={styles.imageCounter}>
              {currentImageIndex + 1} / {images.length}
            </div>

            {/* View All Images Button */}
            <button
              className={styles.viewAllBtn}
              onClick={() => openLightbox(currentImageIndex)}
              aria-label="View all images"
            >
              <FiMaximize2 />
              <span>View All Photos</span>
            </button>
          </div>
        </div>

        {/* Right Side: Thumbnail Grid (2x2) */}
        <div className={styles.thumbnailGrid}>
          {displayedThumbnails.map((image, index) => (
            <div
              key={index}
              className={`${styles.thumbnail} ${
                index === currentImageIndex ? styles.activeThumbnail : ""
              } ${
                index === maxThumbnails - 1 && remainingImagesCount > 0
                  ? styles.lastThumbnail
                  : ""
              }`}
              onClick={() => {
                if (index === maxThumbnails - 1 && remainingImagesCount > 0) {
                  // If last thumbnail with overflow, open lightbox
                  openLightbox(index);
                } else {
                  // Otherwise, update main carousel
                  setImageLoaded(false);
                  setCurrentImageIndex(index);
                }
              }}
            >
              <Image
                src={image}
                alt={`${title} - Thumbnail ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100px, 150px"
              />

              {/* Overflow Indicator on Last Thumbnail */}
              {index === maxThumbnails - 1 && remainingImagesCount > 0 && (
                <div className={styles.overflowIndicator}>
                  <span className={styles.overflowText}>
                    +{remainingImagesCount}
                  </span>
                  <span className={styles.overflowSubtext}>more photos</span>
                </div>
              )}

              {/* Active Border */}
              {index === currentImageIndex && (
                <div className={styles.activeBorder}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxContainer}>
            {/* Close Button */}
            <button
              className={styles.lightboxClose}
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              <FiX />
            </button>

            {/* Lightbox Navigation */}
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNavLeft}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPreviousLightbox();
                  }}
                  aria-label="Previous image"
                >
                  <FiChevronLeft />
                </button>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNavRight}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextLightbox();
                  }}
                  aria-label="Next image"
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Lightbox Image */}
            <div
              className={styles.lightboxImageWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex]}
                alt={`${title} - Image ${lightboxIndex + 1}`}
                fill
                style={{ objectFit: "contain" }}
                quality={100}
                sizes="100vw"
              />
            </div>

            {/* Lightbox Counter */}
            <div className={styles.lightboxCounter}>
              {lightboxIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip in Lightbox */}
            <div className={styles.lightboxThumbnails}>
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`${styles.lightboxThumbnail} ${
                    index === lightboxIndex
                      ? styles.lightboxThumbnailActive
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(index);
                  }}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="80px"
                  />
                </div>
              ))}
            </div>

            {/* Keyboard Hint */}
            <div className={styles.keyboardHint}>
              Use arrow keys to navigate • Press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
