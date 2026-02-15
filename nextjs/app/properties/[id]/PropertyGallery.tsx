"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { FiChevronUp, FiChevronDown, FiMaximize2 } from "react-icons/fi";
import styles from "./property-gallery.module.css";

interface PropertyGalleryProps {
  photos: string[];
  propertyName: string;
}

export default function PropertyGallery({
  photos,
  propertyName,
}: PropertyGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [thumbnailScrollPosition, setThumbnailScrollPosition] = useState(0);

  const THUMBNAIL_HEIGHT = 100; // Height of each thumbnail + gap
  const VISIBLE_THUMBNAILS = 5; // Number of thumbnails visible at once
  const MAX_SCROLL = Math.max(0, photos.length - VISIBLE_THUMBNAILS);

  const scrollThumbnails = (direction: "up" | "down") => {
    if (direction === "up" && thumbnailScrollPosition > 0) {
      setThumbnailScrollPosition(thumbnailScrollPosition - 1);
    } else if (direction === "down" && thumbnailScrollPosition < MAX_SCROLL) {
      setThumbnailScrollPosition(thumbnailScrollPosition + 1);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedPhoto(index);
    // Auto-scroll thumbnails to show selected image
    if (index < thumbnailScrollPosition) {
      setThumbnailScrollPosition(index);
    } else if (index >= thumbnailScrollPosition + VISIBLE_THUMBNAILS) {
      setThumbnailScrollPosition(index - VISIBLE_THUMBNAILS + 1);
    }
  };

  return (
    <div className={styles.galleryContainer}>
      {/* Thumbnails Sidebar - LEFT */}
      <div className={styles.thumbnailsSidebar}>
        {photos.length > VISIBLE_THUMBNAILS && (
          <button
            className={styles.scrollButton}
            onClick={() => scrollThumbnails("up")}
            disabled={thumbnailScrollPosition === 0}
            aria-label="Scroll thumbnails up"
          >
            <FiChevronUp />
          </button>
        )}

        <div className={styles.thumbnailsContainer}>
          <div
            className={styles.thumbnailsScroll}
            style={{
              transform: `translateY(-${
                thumbnailScrollPosition * THUMBNAIL_HEIGHT
              }px)`,
            }}
          >
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`${styles.thumbnail} ${
                  selectedPhoto === index ? styles.active : ""
                }`}
                aria-label={`View photo ${index + 1}`}
              >
                <Image
                  src={photo}
                  alt={`${propertyName} - Photo ${index + 1}`}
                  width={50}
                  height={30}
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                {selectedPhoto === index && (
                  <div className={styles.activeIndicator}>
                    <span>✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {photos.length > VISIBLE_THUMBNAILS && (
          <button
            className={styles.scrollButton}
            onClick={() => scrollThumbnails("down")}
            disabled={thumbnailScrollPosition >= MAX_SCROLL}
            aria-label="Scroll thumbnails down"
          >
            <FiChevronDown />
          </button>
        )}
      </div>

      {/* Main Image - RIGHT */}
      <div className={styles.mainImageContainer}>
        <button
          onClick={() => setIsLightboxOpen(true)}
          className={styles.mainImageWrapper}
          aria-label="Open image in full screen"
        >
          <Image
            src={photos[selectedPhoto]}
            alt={propertyName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
            style={{ objectFit: "cover" }}
            className={styles.mainImage}
            unoptimized
          />
          <div className={styles.zoomOverlay}>
            <FiMaximize2 />
            <span>Click to view full size</span>
          </div>
        </button>

        <div className={styles.photoCounter}>
          <span>{selectedPhoto + 1}</span>
          <span className={styles.separator}>/</span>
          <span>{photos.length}</span>
        </div>
      </div>

      {/* Lightbox with Zoom */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={photos.map((photo) => ({
          src: photo,
          alt: propertyName,
        }))}
        index={selectedPhoto}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        on={{
          view: ({ index }) => setSelectedPhoto(index),
        }}
        carousel={{
          finite: false,
        }}
        render={{
          buttonPrev: photos.length <= 1 ? () => null : undefined,
          buttonNext: photos.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}
