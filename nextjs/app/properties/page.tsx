"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import type { City, Property } from "@/types";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters, {
  PropertyFiltersState,
} from "@/components/properties/PropertyFilters";
import { FiHome } from "react-icons/fi";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import styles from "./properties.module.css";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL search params (from SearchBar)
  const [filters, setFilters] = useState<PropertyFiltersState>(() => {
    const cityParam = searchParams.get("city");
    const guestsParam = searchParams.get("guests");
    const childrenParam = searchParams.get("children");
    const checkinParam = searchParams.get("checkin");
    const checkoutParam = searchParams.get("checkout");

    console.log(
      "URL Params - guests:",
      guestsParam,
      "children:",
      childrenParam
    );

    // Capitalize first letter of city for display
    const formattedCity = cityParam
      ? cityParam.charAt(0).toUpperCase() + cityParam.slice(1)
      : "";

    return {
      city: formattedCity,
      minPrice: "",
      maxPrice: "",
      guests: guestsParam || "",
      children: childrenParam || "",
      bedrooms: "",
      checkin: checkinParam || "",
      checkout: checkoutParam || "",
      sortBy: "recommended",
    };
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get("/public/cities");
        console.log("Cities API response:", response.data);
        console.log("Cities data:", response.data.data);
        console.log("Cities array:", response.data.data.cities);
        setCities(response.data.data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await api.get("/public/properties");
        const fetchedProperties = response.data.data.properties || [];
        setProperties(fetchedProperties);
        setFilteredProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    let filtered = [...properties];

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === filters.city.toLowerCase()
      );
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(
        (p) => p.price_per_night >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (p) => p.price_per_night <= parseFloat(filters.maxPrice)
      );
    }

    // Filter by guests
    if (filters.guests) {
      filtered = filtered.filter(
        (p) => p.max_guests >= parseInt(filters.guests)
      );
    }

    // Filter by bedrooms
    if (filters.bedrooms) {
      filtered = filtered.filter(
        (p) => p.bedrooms >= parseInt(filters.bedrooms)
      );
    }

    // Sorting
    if (filters.sortBy === "price-low") {
      filtered.sort((a, b) => a.price_per_night - b.price_per_night);
    } else if (filters.sortBy === "price-high") {
      filtered.sort((a, b) => b.price_per_night - a.price_per_night);
    } else if (filters.sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setFilteredProperties(filtered);
  }, [filters, properties]);

  const handleFilterChange = (
    key: keyof PropertyFiltersState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: "",
      minPrice: "",
      maxPrice: "",
      guests: "",
      children: "",
      bedrooms: "",
      checkin: "",
      checkout: "",
      sortBy: "recommended",
    });
  };

  const handleWishlistToggle = async (
    propertyId: string,
    isWishlisted: boolean
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to manage your wishlist");
      return;
    }

    try {
      if (isWishlisted) {
        // Remove from wishlist
        await api.delete(`/wishlist/${propertyId}`);
      } else {
        // Add to wishlist
        await api.post("/wishlist", { property_id: propertyId });
      }

      // Refresh property to get updated wishlist status
      // The PropertyCard component will update its own state
    } catch (error) {
      console.error("Wishlist error:", error);
      const errorMessage =
        error instanceof Error
          ? (error as Error & { response?: { data?: { message?: string } } })
              .response?.data?.message || "Failed to update wishlist"
          : "Failed to update wishlist";
      toast.error(errorMessage);
    }
  };

  return (
    <div className={styles.propertiesPage}>
      {/* Filters Component */}
      <PropertyFilters
        cities={cities}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        resultsCount={filteredProperties.length}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading amazing properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiHome />
            </div>
            <h3 className={styles.emptyTitle}>No Properties Found</h3>
            <p className={styles.emptyMessage}>
              We couldn&apos;t find any properties matching your criteria. Try
              adjusting your filters.
            </p>
            <button onClick={clearFilters} className={styles.emptyCtaBtn}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={styles.propertiesGrid}>
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading properties...</p>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
