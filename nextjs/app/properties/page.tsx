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
    const areaParam = searchParams.get("area");
    const guestsParam = searchParams.get("guests");
    const childrenParam = searchParams.get("children");
    const checkinParam = searchParams.get("checkin");
    const checkoutParam = searchParams.get("checkout");

    console.log(
      "URL Params - guests:",
      guestsParam,
      "children:",
      childrenParam,
    );

    // Capitalize first letter of city for display
    const formattedCity = cityParam
      ? cityParam.charAt(0).toUpperCase() + cityParam.slice(1)
      : "";

    return {
      city: formattedCity,
      area: areaParam || "",
      minPrice: "",
      maxPrice: "",
      guests: guestsParam || "",
      children: childrenParam || "",
      bedrooms: "",
      checkin: checkinParam || "",
      checkout: checkoutParam || "",
      sortBy: "recommended",
      hasPool: false,
      hasParking: false,
      hasGym: false,
      hasWifi: false,
      hasPetFriendly: false,
      hasGarden: false,
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
        // Build API params — server handles availability (checkin/checkout)
        // and guest-capacity filtering; everything else stays client-side.
        const apiParams: Record<string, string> = {};
        if (filters.city) apiParams.city = filters.city.toLowerCase();
        if (filters.area) apiParams.area = filters.area;
        if (filters.checkin) apiParams.checkin = filters.checkin;
        if (filters.checkout) apiParams.checkout = filters.checkout;
        // Send combined guest count (adults + children) for max_guests comparison
        const totalGuests =
          parseInt(filters.guests || "0") + parseInt(filters.children || "0");
        if (totalGuests > 0) apiParams.guests = totalGuests.toString();
        const response = await api.get("/public/properties", {
          params: apiParams,
        });
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
  }, [
    filters.city,
    filters.area,
    filters.checkin,
    filters.checkout,
    filters.guests,
    filters.children,
  ]);

  useEffect(() => {
    let filtered = [...properties];

    // City is already filtered server-side — skip client-side city filter
    // to avoid excluding results due to case/ID mismatch.

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(
        (p) => p.price_per_night >= parseFloat(filters.minPrice),
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (p) => p.price_per_night <= parseFloat(filters.maxPrice),
      );
    }

    // Filter by guests (combine adults + children for capacity check)
    if (filters.guests || filters.children) {
      const needed =
        parseInt(filters.guests || "0") + parseInt(filters.children || "0");
      if (needed > 0) {
        filtered = filtered.filter((p) => p.max_guests >= needed);
      }
    }

    // Filter by bedrooms
    if (filters.bedrooms) {
      filtered = filtered.filter(
        (p) => p.bedrooms >= parseInt(filters.bedrooms),
      );
    }

    // Filter by amenities
    const getPropertyAmenities = (amenities: string[] | string): string[] => {
      if (Array.isArray(amenities))
        return amenities.map((a) => a.toLowerCase());
      if (typeof amenities === "string") {
        try {
          const parsed = JSON.parse(amenities);
          if (Array.isArray(parsed))
            return parsed.map((a: string) => a.toLowerCase());
        } catch {}
        return amenities.split(",").map((a) => a.trim().toLowerCase());
      }
      return [];
    };
    const requiredAmenities: string[] = [
      [filters.hasPool, "swimming pool"],
      [filters.hasParking, "parking"],
      [filters.hasGym, "gym"],
      [filters.hasWifi, "wifi"],
      [filters.hasPetFriendly, "pet friendly"],
      [filters.hasGarden, "garden"],
    ]
      .filter(([active]) => active)
      .map(([, name]) => name as string);
    if (requiredAmenities.length > 0) {
      filtered = filtered.filter((p) => {
        const propAmenities = getPropertyAmenities(p.amenities);
        return requiredAmenities.every((a) =>
          propAmenities.some((pa) => pa.includes(a)),
        );
      });
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
    value: string | boolean,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: "",
      area: "",
      minPrice: "",
      maxPrice: "",
      guests: "",
      children: "",
      bedrooms: "",
      checkin: "",
      checkout: "",
      sortBy: "recommended",
      hasPool: false,
      hasParking: false,
      hasGym: false,
      hasWifi: false,
      hasPetFriendly: false,
      hasGarden: false,
    });
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
            <h3 className={styles.emptyTitle}>
              {filters.area ? "Coming Soon" : "No Properties Found"}
            </h3>
            <p className={styles.emptyMessage}>
              {filters.area
                ? `We're expanding to ${filters.area} soon. Stay tuned for exciting properties in this area!`
                : "We couldn't find any properties matching your criteria. Try adjusting your filters."}
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
                checkin={filters.checkin}
                checkout={filters.checkout}
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
    <Suspense
      fallback={
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading properties...</p>
          </div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
