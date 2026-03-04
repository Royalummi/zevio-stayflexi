"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
} from "react-icons/fi";
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

  // Touch swipe tracking refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // Prevents a completed swipe from also triggering the lightbox onClick
  const didSwipe = useRef(false);

  const THUMBNAIL_HEIGHT = 100; // Height of each thumbnail + gap in px
  const VISIBLE_THUMBNAILS = 5; // Number of thumbnails visible at once
  const MAX_SCROLL = Math.max(0, photos.length - VISIBLE_THUMBNAILS);

  // ── navigate to a specific photo and keep thumbnails in sync ──────────────
  const handleThumbnailClick = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, photos.length - 1));
      setSelectedPhoto(clamped);
      // Auto-scroll desktop thumbnail list to keep selected thumb visible
      if (clamped < thumbnailScrollPosition) {
        setThumbnailScrollPosition(clamped);
      } else if (clamped >= thumbnailScrollPosition + VISIBLE_THUMBNAILS) {
        setThumbnailScrollPosition(clamped - VISIBLE_THUMBNAILS + 1);
      }
    },
    [photos.length, thumbnailScrollPosition],
  );

  // ── Keyboard navigation (ArrowLeft / ArrowRight) ──────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input / textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        handleThumbnailClick(selectedPhoto + 1);
      } else if (e.key === "ArrowLeft") {
        handleThumbnailClick(selectedPhoto - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPhoto, handleThumbnailClick]);

  // ── Desktop thumbnail-strip scroll buttons ────────────────────────────────
  const scrollThumbnails = (direction: "up" | "down") => {
    if (direction === "up" && thumbnailScrollPosition > 0) {
      setThumbnailScrollPosition(thumbnailScrollPosition - 1);
    } else if (direction === "down" && thumbnailScrollPosition < MAX_SCROLL) {
      setThumbnailScrollPosition(thumbnailScrollPosition + 1);
    }
  };

  // ── Touch swipe on the main image ─────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(
      e.changedTouches[0].clientY - (touchStartY.current ?? 0),
    );
    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore: not horizontal enough, or too short
    if (Math.abs(deltaX) < 40 || deltaY > Math.abs(deltaX) * 0.8) return;

    didSwipe.current = true; // suppress the onClick that follows
    if (deltaX < 0) {
      handleThumbnailClick(selectedPhoto + 1); // swipe left → next
    } else {
      handleThumbnailClick(selectedPhoto - 1); // swipe right → prev
    }
  };

  return (
    <div className={styles.galleryContainer}>
      {/* Thumbnails Sidebar - LEFT (desktop) / BELOW (mobile) */}
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
          {/* Desktop: translate trick. Mobile: pure CSS overflow-x scroll (transform: none !important in CSS) */}
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
                  fill
                  sizes="(max-width: 768px) 80px, 120px"
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
      <div
        className={styles.mainImageContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* The main image itself — click opens lightbox, but NOT if a swipe just happened */}
        <button
          onClick={() => {
            if (didSwipe.current) {
              didSwipe.current = false;
              return;
            }
            setIsLightboxOpen(true);
          }}
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

        {/* ── Prev / Next overlay arrows ──────────────────────────────── */}
        {photos.length > 1 && (
          <>
            <button
              className={`${styles.navArrow} ${styles.navArrowPrev} ${
                selectedPhoto === 0 ? styles.navArrowHidden : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleThumbnailClick(selectedPhoto - 1);
              }}
              aria-label="Previous photo"
              disabled={selectedPhoto === 0}
            >
              <FiChevronLeft />
            </button>

            <button
              className={`${styles.navArrow} ${styles.navArrowNext} ${
                selectedPhoto === photos.length - 1 ? styles.navArrowHidden : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleThumbnailClick(selectedPhoto + 1);
              }}
              aria-label="Next photo"
              disabled={selectedPhoto === photos.length - 1}
            >
              <FiChevronRight />
            </button>
          </>
        )}

        {/* Photo counter */}
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
