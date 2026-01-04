"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import type { City, Property } from "@/types";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters, {
  PropertyFiltersState,
} from "@/components/properties/PropertyFilters";
import { FiHome } from "react-icons/fi";
import "./properties.css";

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL search params (from SearchBar)
  const [filters, setFilters] = useState<PropertyFiltersState>(() => {
    const cityParam = searchParams.get("city");
    const guestsParam = searchParams.get("guests");
    const checkinParam = searchParams.get("checkin");
    const checkoutParam = searchParams.get("checkout");

    console.log("URL Params - guests:", guestsParam);

    // Capitalize first letter of city for display
    const formattedCity = cityParam
      ? cityParam.charAt(0).toUpperCase() + cityParam.slice(1)
      : "";

    return {
      city: formattedCity,
      minPrice: "",
      maxPrice: "",
      guests: guestsParam || "",
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
      bedrooms: "",
      checkin: "",
      checkout: "",
      sortBy: "recommended",
    });
  };

  const handleWishlistToggle = (propertyId: string, isWishlisted: boolean) => {
    // TODO: Implement wishlist functionality with backend API
    console.log(`Property ${propertyId} wishlist status: ${isWishlisted}`);
  };

  return (
    <div className="properties-page">
      {/* Filters Component */}
      <PropertyFilters
        cities={cities}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        resultsCount={filteredProperties.length}
      />

      {/* Main Content */}
      <div className="main-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading amazing properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiHome />
            </div>
            <h3 className="empty-title">No Properties Found</h3>
            <p className="empty-message">
              We couldn&apos;t find any properties matching your criteria. Try
              adjusting your filters.
            </p>
            <button onClick={clearFilters} className="empty-cta-btn">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="properties-grid">
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
    </div>
  );
}
