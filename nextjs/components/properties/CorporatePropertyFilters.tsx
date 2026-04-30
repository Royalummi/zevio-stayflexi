"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { City } from "@/types";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiMapPin,
  FiUsers,
  FiHome,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import styles from "./CorporatePropertyFilters.module.css";

export interface CorporateFiltersState {
  propertyType: string; // "all" | "villa" | "apartment"
  city: string;
  adults: number;
  children: number;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  sortBy: string;
}

interface CorporatePropertyFiltersProps {
  cities: City[];
  filters: CorporateFiltersState;
  onFilterChange: (
    key: keyof CorporateFiltersState,
    value: string | number,
  ) => void;
  onClearFilters: () => void;
  resultsCount: number;
}

export default function CorporatePropertyFilters({
  cities,
  filters,
  onFilterChange,
  onClearFilters,
  resultsCount,
}: CorporatePropertyFiltersProps) {
  // Count active filters
  const activeFiltersCount = [
    filters.propertyType !== "all",
    filters.city !== "",
    filters.adults > 1 || filters.children > 0,
    filters.minPrice !== "" || filters.maxPrice !== "",
    filters.bedrooms !== "",
  ].filter(Boolean).length;

  // Auto-expand filters if any are active on initial load
  const [showFilters, setShowFilters] = useState(() => activeFiltersCount > 0);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // City search
  const [citySearchInput, setCitySearchInput] = useState("");

  // Refs for click outside
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const capacityRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        propertyTypeRef,
        cityRef,
        capacityRef,
        priceRef,
        bedroomsRef,
        sortRef,
      ];
      if (
        refs.every(
          (ref) => ref.current && !ref.current.contains(event.target as Node),
        )
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableCities = useMemo(
    () => cities.filter((city) => city.property_count === undefined || city.property_count > 0),
    [cities],
  );

  // Filter cities based on search (using useMemo to avoid cascading renders)
  const filteredCities = useMemo(() => {
    if (citySearchInput.trim() === "") {
      return availableCities;
    }
    const searchLower = citySearchInput.toLowerCase();
    return availableCities.filter(
      (city) =>
        city.name.toLowerCase().includes(searchLower) ||
        city.state.toLowerCase().includes(searchLower),
    );
  }, [citySearchInput, availableCities]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handlePropertyTypeSelect = (type: string) => {
    onFilterChange("propertyType", type);
    setOpenDropdown(null);
  };

  const handleCitySelect = (cityName: string) => {
    onFilterChange("city", cityName);
    setCitySearchInput("");
    setOpenDropdown(null);
  };

  const handleCapacityChange = (
    type: "adults" | "children",
    increment: boolean,
  ) => {
    const currentValue = filters[type];
    const newValue = increment
      ? currentValue + 1
      : Math.max(type === "adults" ? 1 : 0, currentValue - 1);
    onFilterChange(type, newValue);
  };

  const handlePriceQuickFilter = (min: string, max: string) => {
    onFilterChange("minPrice", min);
    onFilterChange("maxPrice", max);
  };

  const handleBedroomSelect = (bedrooms: string) => {
    onFilterChange("bedrooms", bedrooms);
    setOpenDropdown(null);
  };

  const handleSortSelect = (sortBy: string) => {
    onFilterChange("sortBy", sortBy);
    setOpenDropdown(null);
  };

  // Get display text for property type
  const getPropertyTypeText = () => {
    if (filters.propertyType === "villa") return "🏡 Villas Only";
    if (filters.propertyType === "apartment") return "🏢 Service Apartments";
    return "All Properties";
  };

  // Get display text for city
  const getCityText = () => {
    if (!filters.city) return "All Cities";
    const selectedCity = availableCities.find((c) => c.name === filters.city);
    return selectedCity
      ? `${selectedCity.name}, ${selectedCity.state}`
      : filters.city;
  };

  // Get display text for capacity
  const getCapacityText = () => {
    const parts = [];
    if (filters.adults > 0) parts.push(`${filters.adults} Adults`);
    if (filters.children > 0) parts.push(`${filters.children} Children`);
    return parts.length > 0 ? parts.join(", ") : "Capacity";
  };

  // Get display text for price
  const getPriceText = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `₹${parseInt(filters.minPrice).toLocaleString()} - ₹${parseInt(filters.maxPrice).toLocaleString()}`;
    }
    if (filters.minPrice)
      return `₹${parseInt(filters.minPrice).toLocaleString()}+`;
    if (filters.maxPrice)
      return `Up to ₹${parseInt(filters.maxPrice).toLocaleString()}`;
    return "Price";
  };

  // Get display text for bedrooms
  const getBedroomsText = () => {
    if (!filters.bedrooms) return "Bedrooms";
    return `${filters.bedrooms}+ Bedrooms`;
  };

  // Get display text for sort
  const getSortText = () => {
    const sortOptions: { [key: string]: string } = {
      discount: "Highest Discount",
      "price-low": "Price: Low to High",
      "price-high": "Price: High to Low",
      rating: "Rating: High to Low",
    };
    return sortOptions[filters.sortBy] || "Sort By";
  };

  return (
    <div className={styles.container}>
      {/* Filters Top Bar */}
      <div className={styles.filtersTop}>
        <div className={styles.filtersActions}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterToggleBtn}
          >
            <FiFilter />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className={styles.filterBadge}>{activeFiltersCount}</span>
            )}
            <FiChevronDown
              className={`${styles.chevronIcon} ${
                showFilters ? styles.rotated : ""
              }`}
            />
          </button>

          {activeFiltersCount > 0 && (
            <button onClick={onClearFilters} className={styles.clearFiltersBtn}>
              <FiX />
              <span>Clear all</span>
            </button>
          )}
        </div>

        <div className={styles.resultsCount}>
          <strong>{resultsCount}</strong>{" "}
          {filters.propertyType === "villa"
            ? "villas"
            : filters.propertyType === "apartment"
              ? "service apartments"
              : "properties"}
        </div>
      </div>

      {/* Filter Grid - Collapsible */}
      {showFilters && (
        <div className={styles.filterGrid}>
          {/* Property Type Filter */}
          <div className={styles.filterItem} ref={propertyTypeRef}>
            <button
              className={`${styles.filterButton} ${filters.propertyType !== "all" ? styles.active : ""}`}
              onClick={() => toggleDropdown("propertyType")}
            >
              <FiHome className={styles.icon} />
              <span className={styles.label}>{getPropertyTypeText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "propertyType" && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownItem} ${filters.propertyType === "all" ? styles.selected : ""}`}
                  onClick={() => handlePropertyTypeSelect("all")}
                >
                  All Properties
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.propertyType === "villa" ? styles.selected : ""}`}
                  onClick={() => handlePropertyTypeSelect("villa")}
                >
                  🏡 Villas Only
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.propertyType === "apartment" ? styles.selected : ""}`}
                  onClick={() => handlePropertyTypeSelect("apartment")}
                >
                  🏢 Service Apartments Only
                </button>
              </div>
            )}
          </div>

          {/* City Filter */}
          <div className={styles.filterItem} ref={cityRef}>
            <button
              className={`${styles.filterButton} ${filters.city ? styles.active : ""}`}
              onClick={() => toggleDropdown("city")}
            >
              <FiMapPin className={styles.icon} />
              <span className={styles.label}>{getCityText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "city" && (
              <div className={`${styles.dropdown} ${styles.cityDropdown}`}>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={citySearchInput}
                    onChange={(e) => setCitySearchInput(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.dropdownScroll}>
                  <button
                    className={`${styles.dropdownItem} ${!filters.city ? styles.selected : ""}`}
                    onClick={() => handleCitySelect("")}
                  >
                    All Cities
                  </button>
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      className={`${styles.dropdownItem} ${filters.city === city.name ? styles.selected : ""}`}
                      onClick={() => handleCitySelect(city.name)}
                    >
                      {city.name}, {city.state}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Capacity Filter (Combined Adults + Children) */}
          <div className={styles.filterItem} ref={capacityRef}>
            <button
              className={`${styles.filterButton} ${filters.adults > 1 || filters.children > 0 ? styles.active : ""}`}
              onClick={() => toggleDropdown("capacity")}
            >
              <FiUsers className={styles.icon} />
              <span className={styles.label}>{getCapacityText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "capacity" && (
              <div className={styles.dropdown}>
                <div className={styles.capacitySection}>
                  <div className={styles.capacityRow}>
                    <label>Adults</label>
                    <div className={styles.counter}>
                      <button
                        onClick={() => handleCapacityChange("adults", false)}
                        disabled={filters.adults <= 1}
                        className={styles.counterBtn}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className={styles.counterValue}>
                        {filters.adults}
                      </span>
                      <button
                        onClick={() => handleCapacityChange("adults", true)}
                        className={styles.counterBtn}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.capacityRow}>
                    <label>Children</label>
                    <div className={styles.counter}>
                      <button
                        onClick={() => handleCapacityChange("children", false)}
                        disabled={filters.children <= 0}
                        className={styles.counterBtn}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className={styles.counterValue}>
                        {filters.children}
                      </span>
                      <button
                        onClick={() => handleCapacityChange("children", true)}
                        className={styles.counterBtn}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div className={styles.filterItem} ref={priceRef}>
            <button
              className={`${styles.filterButton} ${filters.minPrice || filters.maxPrice ? styles.active : ""}`}
              onClick={() => toggleDropdown("price")}
            >
              <span className={styles.icon}>₹</span>
              <span className={styles.label}>{getPriceText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "price" && (
              <div className={styles.dropdown}>
                <div className={styles.priceInputs}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => onFilterChange("minPrice", e.target.value)}
                    className={styles.priceInput}
                  />
                  <span className={styles.priceSeparator}>—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                    className={styles.priceInput}
                  />
                </div>
                <div className={styles.quickFilters}>
                  <button
                    className={styles.quickFilterBtn}
                    onClick={() => handlePriceQuickFilter("0", "3000")}
                  >
                    Under ₹3K
                  </button>
                  <button
                    className={styles.quickFilterBtn}
                    onClick={() => handlePriceQuickFilter("3000", "5000")}
                  >
                    ₹3K - ₹5K
                  </button>
                  <button
                    className={styles.quickFilterBtn}
                    onClick={() => handlePriceQuickFilter("5000", "8000")}
                  >
                    ₹5K - ₹8K
                  </button>
                  <button
                    className={styles.quickFilterBtn}
                    onClick={() => handlePriceQuickFilter("8000", "")}
                  >
                    ₹8K+
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms Filter */}
          <div className={styles.filterItem} ref={bedroomsRef}>
            <button
              className={`${styles.filterButton} ${filters.bedrooms ? styles.active : ""}`}
              onClick={() => toggleDropdown("bedrooms")}
            >
              <IoBed className={styles.icon} />
              <span className={styles.label}>{getBedroomsText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "bedrooms" && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownItem} ${!filters.bedrooms ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("")}
                >
                  Bedrooms
                </button>
                {["1", "2", "3", "4", "5"].map((num) => (
                  <button
                    key={num}
                    className={`${styles.dropdownItem} ${filters.bedrooms === num ? styles.selected : ""}`}
                    onClick={() => handleBedroomSelect(num)}
                  >
                    {num}+ Bedrooms
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By Filter */}
          <div className={styles.filterItem} ref={sortRef}>
            <button
              className={styles.filterButton}
              onClick={() => toggleDropdown("sort")}
            >
              <FiFilter className={styles.icon} />
              <span className={styles.label}>{getSortText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "sort" && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownItem} ${filters.sortBy === "discount" ? styles.selected : ""}`}
                  onClick={() => handleSortSelect("discount")}
                >
                  Highest Discount %
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.sortBy === "price-low" ? styles.selected : ""}`}
                  onClick={() => handleSortSelect("price-low")}
                >
                  Price: Low to High
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.sortBy === "price-high" ? styles.selected : ""}`}
                  onClick={() => handleSortSelect("price-high")}
                >
                  Price: High to Low
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.sortBy === "rating" ? styles.selected : ""}`}
                  onClick={() => handleSortSelect("rating")}
                >
                  Rating: High to Low
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
