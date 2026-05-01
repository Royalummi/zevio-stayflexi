"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/properties/PropertyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";
import { Property } from "@/types";
import styles from "./favorites.module.css";
import { FiHeart, FiAlertCircle } from "react-icons/fi";

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(API_ENDPOINTS.WISHLIST.MY_WISHLIST, {
        params: { page, limit: 12 },
      });

      const data = response.data.data;
      
      // Parse photos if they come as JSON string from backend
      const parsedWishlists = (data.wishlists || []).map((property: Property) => ({
        ...property,
        photos: typeof property.photos === 'string'
          ? JSON.parse(property.photos as string)
          : Array.isArray(property.photos)
          ? property.photos
          : [],
      }));
      
      setFavorites(parsedWishlists);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Failed to fetch favorites:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load favorites. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const handleWishlistToggle = (propertyId: string, isWishlisted: boolean) => {
    // Remove from list if removed from wishlist
    if (!isWishlisted) {
      setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  if (authLoading || (loading && favorites.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <FiHeart />
          </div>
          <div>
            <h1 className={styles.title}>Favourite Properties</h1>
            <p className={styles.subtitle}>
              {favorites.length > 0
                ? `${favorites.length} ${
                    favorites.length === 1 ? "property" : "properties"
                  } in your wishlist`
                : "Start adding properties you love"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={fetchFavorites} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiHeart />
          </div>
          <h2 className={styles.emptyTitle}>No Favorites Yet</h2>
          <p className={styles.emptyText}>
            Start exploring properties and click the heart icon to save your
            favorites
          </p>
          <button
            onClick={() => router.push("/villas")}
            className={styles.exploreBtn}
          >
            Explore Villas
          </button>
        </div>
      )}

      {favorites.length > 0 && (
        <>
          <div className={styles.grid}>
            {favorites.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onWishlistToggle={handleWishlistToggle}
                initialWishlistState={true}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={styles.paginationBtn}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={styles.paginationBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
