/**
 * Image URL Helper Utilities
 *
 * SESSION 56.6: Handles image URLs from backend server (port 5000)
 * SESSION 56.7: Added support for Cloudflare R2 URLs
 *
 * Supports three URL types:
 * 1. Relative paths: /uploads/... → http://localhost:5000/uploads/... (local storage)
 * 2. Absolute URLs: https://images.yourdomain.com/... → returned as-is (R2 storage)
 * 3. Data URIs: data:image/svg+xml... → returned as-is (placeholders)
 */

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

/**
 * Converts a relative or absolute image URL to a full URL
 * @param imageUrl - The image URL (relative, absolute, or data URI)
 * @returns Full URL to the image (backend local storage or R2 CDN)
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  // Return placeholder if no image
  if (!imageUrl) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
  }

  // If already absolute URL (http/https) - R2 or external URLs
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If data URI (SVG placeholder), return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // Relative path - prepend backend base URL (local storage fallback)
  const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${BACKEND_BASE_URL}${cleanUrl}`;
}

/**
 * Gets the first image URL from a property's photos array or images array
 * @param property - Property object with photos and/or images array
 * @returns Full URL to the first image or placeholder
 */
export function getPropertyMainImage(property: {
  photos?: string | string[];
  images?: Array<{ image_url: string }>;
}): string {
  // Try photos array first
  if (property.photos) {
    const photosArray = Array.isArray(property.photos)
      ? property.photos
      : typeof property.photos === "string"
        ? [property.photos]
        : [];

    if (photosArray.length > 0 && photosArray[0]) {
      return getImageUrl(photosArray[0]);
    }
  }

  // Fallback to images array
  if (
    property.images &&
    property.images.length > 0 &&
    property.images[0]?.image_url
  ) {
    return getImageUrl(property.images[0].image_url);
  }

  // Return placeholder if no images
  return getImageUrl(null);
}

/**
 * Gets all image URLs from a property
 * @param property - Property object with photos and/or images array
 * @returns Array of full URLs to all images
 */
export function getPropertyImages(property: {
  photos?: string | string[];
  images?: Array<{ image_url: string }>;
}): string[] {
  const imageUrls: string[] = [];

  // Add photos
  if (property.photos) {
    const photosArray = Array.isArray(property.photos)
      ? property.photos
      : typeof property.photos === "string"
        ? [property.photos]
        : [];

    imageUrls.push(...photosArray.filter(Boolean).map(getImageUrl));
  }

  // Add images if no photos
  if (imageUrls.length === 0 && property.images) {
    imageUrls.push(
      ...property.images
        .map((img) => img.image_url)
        .filter(Boolean)
        .map(getImageUrl),
    );
  }

  // Return at least one placeholder
  return imageUrls.length > 0 ? imageUrls : [getImageUrl(null)];
}
