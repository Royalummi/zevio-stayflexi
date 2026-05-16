"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import styles from "./corporate-offers.module.css";
import { FiBriefcase, FiShield, FiAlertCircle } from "react-icons/fi";
import { useCorporateUser } from "@/hooks/useCorporateUser";
import CorporateLoginModal from "@/components/modals/CorporateLoginModal";
import CorporatePropertyFilters, {
  CorporateFiltersState,
} from "@/components/properties/CorporatePropertyFilters";
import CorporatePropertyCard, {
  CorporateProperty,
} from "@/components/properties/CorporatePropertyCard";
import type { City } from "@/types";

export default function CorporateOffersPage() {
  const router = useRouter();

  // HIDDEN: Corporate Offers — re-enable by removing the 2 lines below when feature is live
  useEffect(() => {
    router.replace("/villas");
  }, [router]);
  return null;

  // Original page below (kept intact for re-enabling later):
  // eslint-disable-next-line no-unreachable
  const [properties, setProperties] = useState<CorporateProperty[]>([]);
  const [allProperties, setAllProperties] = useState<CorporateProperty[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Filters state
  const [filters, setFilters] = useState<CorporateFiltersState>({
    propertyType: "all",
    city: "",
    adults: 1,
    children: 0,
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    sortBy: "discount", // Default sort by discount for corporate
  });

  const [loading, setLoading] = useState(false); // Start as false
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const { isCorporateUser, isAuthenticated } = useCorporateUser();

  // Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<CorporateProperty | null>(null);

  // Client-side mounting check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchCorporateProperties = async (isRetry = false) => {
    // Prevent multiple simultaneous fetches
    if (loading && !isRetry) return;

    // Maximum 3 retry attempts
    if (retryCount >= 3) {
      setError("Unable to load properties. Please refresh the page.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both villas and service apartments with corporate discounts
      // Use sequential requests with delay to avoid rate limiting
      const villasResponse = await api.get("/public/properties?limit=100", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      // Wait 500ms before second request to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));

      const apartmentsResponse = await api.get(
        "/service-apartments?limit=100",
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      const allProperties: CorporateProperty[] = [];

      // Add villas with corporate discounts
      if (villasResponse.data.success && villasResponse.data.data) {
        // Handle paginated response - data.properties is the array
        const villasData = Array.isArray(villasResponse.data.data.properties)
          ? villasResponse.data.data.properties
          : [];

        const corporateVillas = villasData.filter(
          (property: CorporateProperty) => {
            const discount =
              property.corporate_discount_percentage ||
              property.corporate_discount_percent ||
              0;
            return discount > 0;
          },
        );
        allProperties.push(
          ...corporateVillas.map((property: CorporateProperty) => {
            const discount = Number(
              property.corporate_discount_percentage ||
                property.corporate_discount_percent ||
                0,
            );
            const basePrice = Number(property.price_per_night || 0);
            const discountedPrice = basePrice * (1 - discount / 100);

            return {
              ...property,
              propertyType: "villa" as const,
              corporate_discount_percentage: discount,
              discounted_price: discountedPrice,
              price_per_night: basePrice,
            };
          }),
        );
      }

      // Add service apartments with corporate discounts
      if (apartmentsResponse.data.success && apartmentsResponse.data.data) {
        // Service apartments returns data.properties (nested structure)
        const apartmentsData = Array.isArray(
          apartmentsResponse.data.data.properties,
        )
          ? apartmentsResponse.data.data.properties
          : [];

        const corporateApartments = apartmentsData.filter(
          (property: CorporateProperty) => {
            const discount =
              property.corporate_discount_percentage ||
              property.corporate_discount_percent ||
              0;
            return discount > 0;
          },
        );
        allProperties.push(
          ...corporateApartments.map((property: CorporateProperty) => {
            const discount = Number(
              property.corporate_discount_percentage ||
                property.corporate_discount_percent ||
                0,
            );
            const basePrice = Number(property.price_per_night || 0);
            const discountedPrice = basePrice * (1 - discount / 100);

            return {
              ...property,
              propertyType: "apartment" as const,
              corporate_discount_percentage: discount,
              discounted_price: discountedPrice,
              price_per_night: basePrice,
            };
          }),
        );
      }

      setAllProperties(allProperties);
      setProperties(allProperties);

      // Extract unique cities from properties
      const uniqueCities = Array.from(
        new Set(allProperties.map((p) => `${p.city || ""}|${p.state || ""}`)),
      )
        .filter((cityState) => cityState !== "|") // Filter out empty entries
        .map((cityState, index) => {
          const [name, state] = cityState.split("|");
          return {
            id: String(index + 1),
            name,
            state,
            status: "active" as const,
          };
        });
      setCities(uniqueCities);

      setRetryCount(0); // Reset retry count on success
      setLoading(false);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error fetching corporate properties:", error);

      // Handle rate limiting with exponential backoff
      if (axiosError.response?.status === 429) {
        const nextRetryCount = retryCount + 1;
        const retryDelay = Math.min(1000 * Math.pow(2, nextRetryCount), 10000); // Exponential backoff, max 10s

        console.warn(
          `Rate limit exceeded. Retry ${nextRetryCount}/3 after ${retryDelay}ms`,
        );
        setRetryCount(nextRetryCount);

        // Don't set loading to false during retry
        setTimeout(() => {
          fetchCorporateProperties(true);
        }, retryDelay);
        return;
      }

      // Handle other errors
      setError(
        axiosError.response?.data?.message ||
          "Failed to load properties. Please try again.",
      );
      setLoading(false);
    }
  };

  // Apply filters to properties
  useEffect(() => {
    let filtered = [...allProperties];

    // Filter by property type
    if (filters.propertyType !== "all") {
      filtered = filtered.filter(
        (p) => p.propertyType === filters.propertyType,
      );
    }

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(
        (p) => p.city?.toLowerCase() === filters.city.toLowerCase(),
      );
    }

    // Filter by capacity (adults + children)
    const totalGuests = (filters.adults || 0) + (filters.children || 0);
    if (totalGuests > 1) {
      filtered = filtered.filter((p) => (p.max_guests || 0) >= totalGuests);
    }

    // Filter by price range (using discounted price)
    if (filters.minPrice) {
      filtered = filtered.filter(
        (p) => p.discounted_price >= parseInt(filters.minPrice),
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (p) => p.discounted_price <= parseInt(filters.maxPrice),
      );
    }

    // Filter by bedrooms
    if (filters.bedrooms) {
      filtered = filtered.filter(
        (p) => (p.bedrooms || 0) >= parseInt(filters.bedrooms),
      );
    }

    // Sort
    if (filters.sortBy === "discount") {
      filtered.sort(
        (a, b) =>
          (b.corporate_discount_percentage || 0) -
          (a.corporate_discount_percentage || 0),
      );
    } else if (filters.sortBy === "price-low") {
      filtered.sort((a, b) => a.discounted_price - b.discounted_price);
    } else if (filters.sortBy === "price-high") {
      filtered.sort((a, b) => b.discounted_price - a.discounted_price);
    } else if (filters.sortBy === "rating") {
      filtered.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    }

    setProperties(filtered);
  }, [allProperties, filters]);

  const handleFilterChange = (
    key: keyof CorporateFiltersState,
    value: string | number,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      propertyType: "all",
      city: "",
      adults: 1,
      children: 0,
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      sortBy: "discount",
    });
  };

  // Use useEffect with proper dependency management
  useEffect(() => {
    let mounted = true;

    // Fetch on mount if not already loaded
    if (mounted && properties.length === 0) {
      fetchCorporateProperties();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleResendVerification = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        return;
      }

      // Parse email from stored user — backend requires it in the request body
      let userEmail = "";
      try {
        const stored = localStorage.getItem("user");
        if (stored) userEmail = JSON.parse(stored).email || "";
      } catch {
        // ignore parse error
      }

      if (!userEmail) {
        alert(
          "Could not determine your email. Please log out and log back in.",
        );
        return;
      }

      const response = await api.post(
        `/corporate/resend-verification`,
        { email: userEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data?.success) {
        alert("Verification email sent! Please check your inbox.");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Verification error:", error);
      alert(
        err.response?.data?.message || "Failed to resend verification email",
      );
    }
  };

  const handlePropertyClick = (property: CorporateProperty) => {
    // Check if user is corporate verified
    if (!isCorporateUser) {
      // Show login modal instead of navigating
      setSelectedProperty(property);
      setShowLoginModal(true);
      return;
    }

    // Corporate user - navigate directly to detail page
    if (property.propertyType === "villa") {
      router.push(`/villas/${property.id}`);
    } else {
      router.push(`/service-apartments/${property.id}`);
    }
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    setSelectedProperty(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading corporate properties...</p>
          {retryCount > 0 && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginTop: "0.5rem",
              }}
            >
              Retry attempt {retryCount}/3...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <FiBriefcase size={48} />
          </div>
          <h1>Corporate Accommodations</h1>
          <p className={styles.subtitle}>
            Premium service apartments with exclusive corporate discounts for
            your business stays
          </p>
        </div>
      </div>

      {/* Verification Banner - Only show for logged-in non-verified users */}
      {isMounted && isAuthenticated && !isCorporateUser && (
        <div className={styles.verificationBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerIcon}>
              <FiShield size={28} />
            </div>
            <div className={styles.bannerText}>
              <h3>Corporate Verification Required</h3>
              <p>
                Verify your corporate account to unlock exclusive discounts and
                book at corporate rates
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              className={styles.resendBtn}
            >
              Verify Corporate Account
            </button>
          </div>
        </div>
      )}
      {/* Filters Section */}
      {!loading && !error && allProperties.length > 0 && (
        <div className={styles.filtersSection}>
          <CorporatePropertyFilters
            cities={cities}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            resultsCount={properties.length}
          />
        </div>
      )}

      {/* Properties List */}
      <div className={styles.content}>
        {error ? (
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>
              <FiAlertCircle size={48} />
            </div>
            <h3 className={styles.errorTitle}>Unable to Load Properties</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button
              onClick={() => {
                setRetryCount(0);
                setError(null);
                fetchCorporateProperties();
              }}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className={styles.emptyState}>
            <FiBriefcase size={64} />
            <h3>No corporate properties available</h3>
            <p>Check back soon for new listings</p>
          </div>
        ) : (
          <div className={styles.propertiesGrid}>
            {properties.map((property) => (
              <CorporatePropertyCard
                key={`${property.id}-${property.propertyType}`}
                property={property}
                onPropertyClick={handlePropertyClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Corporate Login Modal */}
      <CorporateLoginModal
        isOpen={showLoginModal}
        onClose={handleModalClose}
        propertyTitle={selectedProperty?.title}
        discountPercent={selectedProperty?.corporate_discount_percentage}
      />
    </div>
  );
}
