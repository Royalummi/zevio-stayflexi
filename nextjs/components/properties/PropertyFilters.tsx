"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { City } from "@/types";
import DateRangeSelector from "@/components/DateRangeSelector";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiMinus,
  FiPlus,
  FiWifi,
  FiDroplet,
  FiTruck,
  FiHeart,
  FiSun,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import { MdFitnessCenter } from "react-icons/md";
import styles from "./PropertyFilters.module.css";

export interface PropertyFiltersState {
  city: string;
  minPrice: string;
  maxPrice: string;
  guests: string;
  children: string;
  bedrooms: string;
  checkin: string;
  checkout: string;
  sortBy: string;
  hasPool: boolean;
  hasParking: boolean;
  hasGym: boolean;
  hasWifi: boolean;
  hasPetFriendly: boolean;
  hasGarden: boolean;
}

interface PropertyFiltersProps {
  cities: City[];
  filters: PropertyFiltersState;
  onFilterChange: (
    key: keyof PropertyFiltersState,
    value: string | boolean,
  ) => void;
  onClearFilters: () => void;
  resultsCount: number;
}

export default function PropertyFilters({
  cities,
  filters,
  onFilterChange,
  onClearFilters,
  resultsCount,
}: PropertyFiltersProps) {
  // Count active filters (exclude sortBy, checkin, checkout from count)
  const activeFiltersCount = [
    filters.city !== "",
    filters.guests !== "" && parseInt(filters.guests) > 0,
    filters.children !== "" && parseInt(filters.children) > 0,
    filters.minPrice !== "" || filters.maxPrice !== "",
    filters.bedrooms !== "",
    filters.hasPool,
    filters.hasParking,
    filters.hasGym,
    filters.hasWifi,
    filters.hasPetFriendly,
    filters.hasGarden,
  ].filter(Boolean).length;

  // Auto-expand filters if any are active on initial load
  const [showFilters, setShowFilters] = useState(() => activeFiltersCount > 0);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // City search
  const [citySearchInput, setCitySearchInput] = useState("");

  // Date picker states
  const [checkinDate, setCheckinDate] = useState<Date | null>(() =>
    filters.checkin ? new Date(filters.checkin) : null,
  );
  const [checkoutDate, setCheckoutDate] = useState<Date | null>(() =>
    filters.checkout ? new Date(filters.checkout) : null,
  );

  // Refs for click outside
  const cityRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const capacityRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        cityRef,
        datesRef,
        capacityRef,
        priceRef,
        bedroomsRef,
        amenitiesRef,
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

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (citySearchInput.trim() === "") {
      return cities;
    }
    const searchLower = citySearchInput.toLowerCase();
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(searchLower) ||
        city.state.toLowerCase().includes(searchLower),
    );
  }, [citySearchInput, cities]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleCitySelect = (cityName: string) => {
    onFilterChange("city", cityName);
    setCitySearchInput("");
    setOpenDropdown(null);
  };

  const handleCapacityChange = (
    type: "guests" | "children",
    increment: boolean,
  ) => {
    const currentValue = parseInt(filters[type] || "0");
    const newValue = increment
      ? currentValue + 1
      : Math.max(type === "guests" ? 1 : 0, currentValue - 1);
    onFilterChange(type, newValue.toString());
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

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setCheckinDate(start);
    setCheckoutDate(end);
    if (start) onFilterChange("checkin", start.toISOString());
    if (end) onFilterChange("checkout", end.toISOString());
  };

  // Get display text helpers
  const getCityText = () => {
    if (!filters.city) return "All Cities";
    const selectedCity = cities.find((c) => c.name === filters.city);
    return selectedCity
      ? `${selectedCity.name}, ${selectedCity.state}`
      : filters.city;
  };

  const getCapacityText = () => {
    const guests = parseInt(filters.guests || "0");
    const children = parseInt(filters.children || "0");
    const parts = [];
    if (guests > 0) parts.push(`${guests} Adults`);
    if (children > 0) parts.push(`${children} Children`);
    return parts.length > 0 ? parts.join(", ") : "Any Capacity";
  };

  const getPriceText = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `₹${parseInt(filters.minPrice).toLocaleString()} - ₹${parseInt(filters.maxPrice).toLocaleString()}`;
    }
    if (filters.minPrice)
      return `₹${parseInt(filters.minPrice).toLocaleString()}+`;
    if (filters.maxPrice)
      return `Up to ₹${parseInt(filters.maxPrice).toLocaleString()}`;
    return "Any Price";
  };

  const getBedroomsText = () => {
    if (!filters.bedrooms) return "Any Bedrooms";
    return `${filters.bedrooms}+ Bedrooms`;
  };

  const getDatesText = () => {
    if (checkinDate && checkoutDate) {
      return `${checkinDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${checkoutDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
    }
    return "Select Dates";
  };

  const getAmenitiesText = () => {
    const count = [
      filters.hasPool,
      filters.hasParking,
      filters.hasGym,
      filters.hasWifi,
      filters.hasPetFriendly,
      filters.hasGarden,
    ].filter(Boolean).length;
    if (count === 0) return "All Amenities";
    return `${count} Amenit${count > 1 ? "ies" : "y"}`;
  };

  const getSortText = () => {
    const sortOptions: { [key: string]: string } = {
      recommended: "Recommended",
      "price-low": "Price: Low to High",
      "price-high": "Price: High to Low",
      rating: "Rating: High to Low",
    };
    return sortOptions[filters.sortBy] || "Recommended";
  };

  return (
    <div className={styles.container}>
      {/* Mobile overlay backdrop for bottom-sheet dropdowns */}
      {openDropdown && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setOpenDropdown(null)}
        />
      )}
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

        <div className={styles.resultsActions}>
          <div className={styles.resultsCount}>
            <strong>{resultsCount}</strong> properties found
          </div>

          {/* Sort Dropdown */}
          <div className={styles.filterItem} ref={sortRef}>
            <button
              className={styles.filterButton}
              onClick={() => toggleDropdown("sort")}
            >
              <span className={styles.label}>{getSortText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "sort" && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownItem} ${filters.sortBy === "recommended" ? styles.selected : ""}`}
                  onClick={() => handleSortSelect("recommended")}
                >
                  Recommended
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
      </div>

      {/* Filter Grid - Collapsible */}
      {showFilters && (
        <div className={styles.filterGrid}>
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
              <div className={styles.dropdown}>
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

          {/* Dates Filter */}
          <div className={styles.filterItem} ref={datesRef}>
            <button
              className={`${styles.filterButton} ${checkinDate && checkoutDate ? styles.active : ""}`}
              onClick={() => toggleDropdown("dates")}
            >
              <FiCalendar className={styles.icon} />
              <span className={styles.label}>{getDatesText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "dates" && (
              <div className={`${styles.dropdown} ${styles.datesDropdown}`}>
                {/* Calendar renders inline — one-tap, no nested popup */}
                <DateRangeSelector
                  checkIn={checkinDate}
                  checkOut={checkoutDate}
                  onCheckInChange={(date) => {
                    setCheckinDate(date);
                    if (date) {
                      onFilterChange(
                        "checkin",
                        date.toISOString().split("T")[0],
                      );
                    } else {
                      onFilterChange("checkin", "");
                    }
                  }}
                  onCheckOutChange={(date) => {
                    setCheckoutDate(date);
                    if (checkinDate && date) {
                      onFilterChange(
                        "checkin",
                        checkinDate.toISOString().split("T")[0],
                      );
                      onFilterChange(
                        "checkout",
                        date.toISOString().split("T")[0],
                      );
                    }
                  }}
                  minDate={new Date()}
                  calendarOnly={true}
                  isOpen={true}
                  onOpenChange={(open) => {
                    if (!open) setOpenDropdown(null);
                  }}
                />
                {(checkinDate || checkoutDate) && (
                  <div className={styles.dateFooter}>
                    <button
                      onClick={() => {
                        setCheckinDate(null);
                        setCheckoutDate(null);
                        onFilterChange("checkin", "");
                        onFilterChange("checkout", "");
                      }}
                      className={styles.clearDatesBtn}
                    >
                      Clear dates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Capacity Filter (Combined Guests + Children) */}
          <div className={styles.filterItem} ref={capacityRef}>
            <button
              className={`${styles.filterButton} ${parseInt(filters.guests || "0") > 0 || parseInt(filters.children || "0") > 0 ? styles.active : ""}`}
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
                        onClick={() => handleCapacityChange("guests", false)}
                        disabled={parseInt(filters.guests || "0") <= 1}
                        className={styles.counterBtn}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className={styles.counterValue}>
                        {filters.guests || "1"}
                      </span>
                      <button
                        onClick={() => handleCapacityChange("guests", true)}
                        className={styles.counterBtn}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.capacityRow}>
                    <label>Children</label>
                    <div className={styles.counter}>
                      <button
                        onClick={() => handleCapacityChange("children", false)}
                        disabled={parseInt(filters.children || "0") <= 0}
                        className={styles.counterBtn}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className={styles.counterValue}>
                        {filters.children || "0"}
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
              <FiDollarSign className={styles.icon} />
              <span className={styles.label}>{getPriceText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "price" && (
              <div className={styles.dropdown}>
                <div className={styles.priceSection}>
                  <label>Price Range (per night)</label>
                  <div className={styles.priceInputs}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) =>
                        onFilterChange("minPrice", e.target.value)
                      }
                      className={styles.priceInput}
                    />
                    <span className={styles.priceSeparator}>—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        onFilterChange("maxPrice", e.target.value)
                      }
                      className={styles.priceInput}
                    />
                  </div>

                  <div className={styles.priceQuickFilters}>
                    <button
                      onClick={() => handlePriceQuickFilter("", "5000")}
                      className={styles.quickFilterBtn}
                    >
                      Under ₹5,000
                    </button>
                    <button
                      onClick={() => handlePriceQuickFilter("5000", "10000")}
                      className={styles.quickFilterBtn}
                    >
                      ₹5,000 - ₹10,000
                    </button>
                    <button
                      onClick={() => handlePriceQuickFilter("10000", "20000")}
                      className={styles.quickFilterBtn}
                    >
                      ₹10,000 - ₹20,000
                    </button>
                    <button
                      onClick={() => handlePriceQuickFilter("20000", "")}
                      className={styles.quickFilterBtn}
                    >
                      Over ₹20,000
                    </button>
                  </div>
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
                  Any Bedrooms
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.bedrooms === "1" ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("1")}
                >
                  1+ Bedroom
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.bedrooms === "2" ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("2")}
                >
                  2+ Bedrooms
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.bedrooms === "3" ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("3")}
                >
                  3+ Bedrooms
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.bedrooms === "4" ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("4")}
                >
                  4+ Bedrooms
                </button>
                <button
                  className={`${styles.dropdownItem} ${filters.bedrooms === "5" ? styles.selected : ""}`}
                  onClick={() => handleBedroomSelect("5")}
                >
                  5+ Bedrooms
                </button>
              </div>
            )}
          </div>

          {/* Amenities Filter */}
          <div className={styles.filterItem} ref={amenitiesRef}>
            <button
              className={`${styles.filterButton} ${getAmenitiesText() !== "All Amenities" ? styles.active : ""}`}
              onClick={() => toggleDropdown("amenities")}
            >
              <FiFilter className={styles.icon} />
              <span className={styles.label}>{getAmenitiesText()}</span>
              <FiChevronDown className={styles.chevron} />
            </button>

            {openDropdown === "amenities" && (
              <div className={styles.dropdown}>
                <div className={styles.amenitiesSection}>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasPool}
                      onChange={(e) =>
                        onFilterChange("hasPool", e.target.checked)
                      }
                    />
                    <FiDroplet className={styles.amenityIcon} />
                    <span>Swimming Pool</span>
                  </label>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasParking}
                      onChange={(e) =>
                        onFilterChange("hasParking", e.target.checked)
                      }
                    />
                    <FiTruck className={styles.amenityIcon} />
                    <span>Parking</span>
                  </label>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasGym}
                      onChange={(e) =>
                        onFilterChange("hasGym", e.target.checked)
                      }
                    />
                    <MdFitnessCenter className={styles.amenityIcon} />
                    <span>Gym</span>
                  </label>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasWifi}
                      onChange={(e) =>
                        onFilterChange("hasWifi", e.target.checked)
                      }
                    />
                    <FiWifi className={styles.amenityIcon} />
                    <span>WiFi</span>
                  </label>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasPetFriendly}
                      onChange={(e) =>
                        onFilterChange("hasPetFriendly", e.target.checked)
                      }
                    />
                    <FiHeart className={styles.amenityIcon} />
                    <span>Pet Friendly</span>
                  </label>
                  <label className={styles.amenityItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasGarden}
                      onChange={(e) =>
                        onFilterChange("hasGarden", e.target.checked)
                      }
                    />
                    <FiSun className={styles.amenityIcon} />
                    <span>Garden</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
