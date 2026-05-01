"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
import styles from "../properties/properties.module.css";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL search params (from SearchBar)
  const [filters, setFilters] = useState<PropertyFiltersState>(() => {
    const cityParam = searchParams.get("city");
    const areaParam = searchParams.get("area");
    const guestsParam = searchParams.get("guests");
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");
    const infantsParam = searchParams.get("infants");
    const checkinParam = searchParams.get("checkin");
    const checkoutParam = searchParams.get("checkout");

    const guestsFromUrl = parseInt(guestsParam || "0", 10);
    const childrenFromUrl = parseInt(childrenParam || "0", 10);
    const adultsFromUrl = adultsParam
      ? parseInt(adultsParam, 10)
      : Math.max(0, guestsFromUrl - childrenFromUrl);

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
      guests: adultsFromUrl > 0 ? adultsFromUrl.toString() : "",
      children: childrenParam || "",
      infants: infantsParam || "",
      bedrooms: "",
      checkin: checkinParam || "",
      checkout: checkoutParam || "",
      sortBy: "recommended",
      selectedAmenities: [],
    };
  });

  const parseAmenities = (amenities: string[] | string): string[] => {
    if (Array.isArray(amenities)) {
      return amenities.map((item) => item.toLowerCase().trim()).filter(Boolean);
    }
    if (typeof amenities === "string") {
      try {
        const parsed = JSON.parse(amenities);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item: string) => item.toLowerCase().trim())
            .filter(Boolean);
        }
      } catch {
        // fall back to comma-separated text format
      }
      return amenities
        .split(",")
        .map((item) => item.toLowerCase().trim())
        .filter(Boolean);
    }
    return [];
  };

  const availableCities = useMemo(() => {
    const cityMap = new Map<string, City>();
    properties.forEach((property) => {
      const cityName = property.city?.trim();
      if (!cityName) return;
      const key = cityName.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          id: key,
          name: cityName,
          state: property.state || "",
          status: "active",
          property_count: 1,
        });
      }
    });
    return Array.from(cityMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [properties]);

  const availableAmenities = useMemo(() => {
    const amenitiesSet = new Set<string>();
    properties.forEach((property) => {
      parseAmenities(property.amenities).forEach((amenity) =>
        amenitiesSet.add(amenity),
      );
    });
    return Array.from(amenitiesSet).sort((a, b) => a.localeCompare(b));
  }, [properties]);

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
    if (filters.selectedAmenities.length > 0) {
      filtered = filtered.filter((p) => {
        const propAmenities = parseAmenities(p.amenities);
        return filters.selectedAmenities.every((requiredAmenity) =>
          propAmenities.some((item) => item.includes(requiredAmenity)),
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
    value: string | string[],
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
      infants: "",
      bedrooms: "",
      checkin: "",
      checkout: "",
      sortBy: "recommended",
      selectedAmenities: [],
    });
  };

  return (
    <div className={styles.propertiesPage}>
      {/* Filters Component */}
      <PropertyFilters
        cities={availableCities}
        availableAmenities={availableAmenities}
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
            <p className={styles.loadingText}>Loading amazing villas...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiHome />
            </div>
            <h3 className={styles.emptyTitle}>
              {filters.area ? "Coming Soon" : "No Villas Found"}
            </h3>
            <p className={styles.emptyMessage}>
              {filters.area
                ? `We're expanding to ${filters.area} soon. Stay tuned for exciting villas in this area!`
                : "We couldn't find any villas matching your criteria. Try adjusting your filters."}
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
            <p>Loading villas...</p>
          </div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
