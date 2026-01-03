"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import type { City, Property } from "@/types";
import PropertyCard from "@/components/properties/PropertyCard";
import {
  FiFilter,
  FiX,
  FiHome,
  FiChevronDown,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import "./properties.css";

interface Filters {
  city: string;
  minPrice: string;
  maxPrice: string;
  guests: string;
  bedrooms: string;
  sortBy: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: "",
    minPrice: "",
    maxPrice: "",
    guests: "",
    bedrooms: "",
    sortBy: "recommended",
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

    if (filters.city) {
      filtered = filtered.filter((p) => p.city === filters.city);
    }

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

    if (filters.guests) {
      filtered = filtered.filter(
        (p) => p.max_guests >= parseInt(filters.guests)
      );
    }

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

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: "",
      minPrice: "",
      maxPrice: "",
      guests: "",
      bedrooms: "",
      sortBy: "recommended",
    });
  };

  const handleWishlistToggle = (propertyId: string, isWishlisted: boolean) => {
    // TODO: Implement wishlist functionality with backend API
    console.log(`Property ${propertyId} wishlist status: ${isWishlisted}`);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== ""
  ).length;

  return (
    <div className="properties-page">
      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-container">
          <div className="filters-top">
            <div className="filters-actions">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="filter-toggle-btn"
              >
                <FiFilter />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="filter-badge">{activeFiltersCount}</span>
                )}
                <FiChevronDown
                  className={`chevron-icon ${showFilters ? "rotated" : ""}`}
                />
              </button>

              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  <FiX />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className="results-actions">
              <div className="results-count">
                <strong>{filteredProperties.length}</strong> properties found
              </div>

              <div className="sort-dropdown">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="sort-select"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-grid">
                {/* City */}
                <div className="filter-group">
                  <label>
                    <FiMapPin />
                    Location
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All cities</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}, {city.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div className="filter-group">
                  <label>Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    placeholder="₹0"
                    className="filter-input"
                  />
                </div>

                {/* Max Price */}
                <div className="filter-group">
                  <label>Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    placeholder="₹50,000"
                    className="filter-input"
                  />
                </div>

                {/* Guests */}
                <div className="filter-group">
                  <label>
                    <FiUsers />
                    Guests
                  </label>
                  <select
                    value={filters.guests}
                    onChange={(e) =>
                      handleFilterChange("guests", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">Any</option>
                    <option value="2">2+</option>
                    <option value="4">4+</option>
                    <option value="6">6+</option>
                    <option value="8">8+</option>
                  </select>
                </div>

                {/* Bedrooms */}
                <div className="filter-group">
                  <label>
                    <IoBed />
                    Bedrooms
                  </label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) =>
                      handleFilterChange("bedrooms", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
