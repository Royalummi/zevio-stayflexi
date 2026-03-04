"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import type { City } from "@/types";
import ServiceApartmentCard from "@/components/properties/ServiceApartmentCard";
import ServiceApartmentFilters, {
  ServiceApartmentFiltersState,
} from "@/components/properties/ServiceApartmentFilters";
import { BsBuilding } from "react-icons/bs";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import styles from "./service-apartments.module.css";

export interface ServiceApartment {
  id: string;
  property_id?: string;
  title: string;
  city: string;
  state: string;
  address: string;
  area?: string;
  maps_location?: string;
  bedrooms: number;
  bathrooms?: number;
  max_guests?: number;
  max_occupancy?: number;
  price_per_night: number;
  weekly_discount_percent?: number;
  monthly_discount_percent?: number;
  quarterly_discount_percent?: number;
  long_term_discount_percent?: number;
  monthly_discount_percentage?: number;
  corporate_discount_percent?: number;
  corporate_discount_percentage?: number;
  // Features returned as array from backend
  features?: string[];
  // Computed boolean flags from features array
  has_workspace: boolean;
  has_housekeeping: boolean;
  has_elevator: boolean;
  has_gym: boolean;
  has_parking: boolean;
  allow_corporate_booking: boolean;
  rating: number;
  reviews_count?: number;
  total_reviews?: number;
  photos: string[];
  amenities: string[];
}

// Utility function to parse features array into boolean flags
const parseFeatures = (
  property: Partial<ServiceApartment> & { features?: string[] },
): ServiceApartment => {
  const features = property.features || [];
  return {
    ...property,
    has_workspace: features.some((f: string) =>
      f.toLowerCase().includes("workspace"),
    ),
    has_housekeeping: features.some((f: string) =>
      f.toLowerCase().includes("housekeeping"),
    ),
    has_elevator: features.some((f: string) =>
      f.toLowerCase().includes("elevator"),
    ),
    has_gym: features.some((f: string) => f.toLowerCase().includes("gym")),
    has_parking: features.some((f: string) =>
      f.toLowerCase().includes("parking"),
    ),
  } as ServiceApartment;
};

function ServiceApartmentsContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [properties, setProperties] = useState<ServiceApartment[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<
    ServiceApartment[]
  >([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<ServiceApartmentFiltersState>(() => {
    const cityParam = searchParams.get("city");
    const guestsParam = searchParams.get("guests");
    const childrenParam = searchParams.get("children");
    const checkinParam = searchParams.get("checkin");
    const checkoutParam = searchParams.get("checkout");
    const bedroomsParam = searchParams.get("bedrooms");

    const formattedCity = cityParam
      ? cityParam.charAt(0).toUpperCase() + cityParam.slice(1)
      : "";

    return {
      city: formattedCity,
      minPrice: "",
      maxPrice: "",
      guests: guestsParam || "",
      children: childrenParam || "",
      bedrooms: bedroomsParam || "",
      checkin: checkinParam || "",
      checkout: checkoutParam || "",
      sortBy: "recommended",
      hasWorkspace: false,
      hasHousekeeping: false,
      hasElevator: false,
      hasGym: false,
      hasParking: false,
      allowCorporateBooking: false,
    };
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get("/public/cities");
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
        if (filters.city) apiParams.city = filters.city;
        if (filters.checkin) apiParams.checkin = filters.checkin;
        if (filters.checkout) apiParams.checkout = filters.checkout;
        // Send combined guest count (adults + children) for max_guests comparison
        const totalGuests =
          parseInt(filters.guests || "0") + parseInt(filters.children || "0");
        if (totalGuests > 0) apiParams.guests = totalGuests.toString();
        const response = await api.get("/service-apartments", {
          params: apiParams,
        });
        const fetchedProperties = response.data.data.properties || [];

        // Parse features array into boolean flags for each property
        const parsedProperties = fetchedProperties.map(parseFeatures);

        setProperties(parsedProperties);
        setFilteredProperties(parsedProperties);
      } catch (error) {
        console.error("Error fetching service apartments:", error);
        toast.error("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.city,
    filters.checkin,
    filters.checkout,
    filters.guests,
    filters.children,
  ]);

  useEffect(() => {
    let filtered = [...properties];

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === filters.city.toLowerCase(),
      );
    }
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
        filtered = filtered.filter(
          (p) => (p.max_guests || p.max_occupancy || 0) >= needed,
        );
      }
    }

    // Filter by bedrooms
    if (filters.bedrooms) {
      filtered = filtered.filter(
        (p) => p.bedrooms >= parseInt(filters.bedrooms),
      );
    }

    // Filter by amenities
    if (filters.hasWorkspace) {
      filtered = filtered.filter((p) => p.has_workspace);
    }
    if (filters.hasHousekeeping) {
      filtered = filtered.filter((p) => p.has_housekeeping);
    }
    if (filters.hasElevator) {
      filtered = filtered.filter((p) => p.has_elevator);
    }
    if (filters.hasGym) {
      filtered = filtered.filter((p) => p.has_gym);
    }
    if (filters.hasParking) {
      filtered = filtered.filter((p) => p.has_parking);
    }
    if (filters.allowCorporateBooking) {
      filtered = filtered.filter((p) => p.allow_corporate_booking);
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
    key: keyof ServiceApartmentFiltersState,
    value: string | boolean,
  ) => {
    setFilters((prev: ServiceApartmentFiltersState) => ({
      ...prev,
      [key]: value,
    }));
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
      hasWorkspace: false,
      hasHousekeeping: false,
      hasElevator: false,
      hasGym: false,
      hasParking: false,
      allowCorporateBooking: false,
    });
  };

  // The card handles its own API calls; this callback is only invoked when
  // the user is not logged in (card detected no token before attempting the call).
  const handleWishlistToggle = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to save properties to your wishlist");
    }
  };

  return (
    <div className={styles.serviceApartmentsPage}>
      {/* Filters Component */}
      <ServiceApartmentFilters
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
            <p className={styles.loadingText}>Loading service apartments...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BsBuilding />
            </div>
            <h3 className={styles.emptyTitle}>No Service Apartments Found</h3>
            <p className={styles.emptyMessage}>
              We couldn&apos;t find any service apartments matching your
              criteria. Try adjusting your filters.
            </p>
            <button onClick={clearFilters} className={styles.emptyCtaBtn}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={styles.propertiesGrid}>
            {filteredProperties.map((property) => (
              <ServiceApartmentCard
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

export default function ServiceApartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading service apartments...</p>
          </div>
        </div>
      }
    >
      <ServiceApartmentsContent />
    </Suspense>
  );
}
