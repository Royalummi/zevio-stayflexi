"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { City } from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiMapPin,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import "./PropertyFilters.css";

export interface PropertyFiltersState {
  city: string;
  minPrice: string;
  maxPrice: string;
  guests: string;
  bedrooms: string;
  checkin: string;
  checkout: string;
  sortBy: string;
}

interface PropertyFiltersProps {
  cities: City[];
  filters: PropertyFiltersState;
  onFilterChange: (key: keyof PropertyFiltersState, value: string) => void;
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
  // Local state for city search - initialized from filters
  const [citySearchInput, setCitySearchInput] = useState(() => {
    if (filters.city) {
      const selectedCity = cities.find((c) => c.name === filters.city);
      return selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : "";
    }
    return "";
  });
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityIndex, setSelectedCityIndex] = useState(-1);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Date picker states - initialized from filters
  const [checkinDate, setCheckinDate] = useState<Date | null>(() =>
    filters.checkin ? new Date(filters.checkin) : null
  );
  const [checkoutDate, setCheckoutDate] = useState<Date | null>(() =>
    filters.checkout ? new Date(filters.checkout) : null
  );

  // Guests dropdown state - initialized from filters
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [guestsCount, setGuestsCount] = useState<number>(() =>
    filters.guests ? parseInt(filters.guests) : 0
  );
  const guestsDropdownRef = useRef<HTMLDivElement>(null);

  // Bedrooms dropdown state - initialized from filters
  const [showBedroomsDropdown, setShowBedroomsDropdown] = useState(false);
  const [bedroomsCount, setBedroomsCount] = useState<number>(() =>
    filters.bedrooms ? parseInt(filters.bedrooms) : 0
  );
  const bedroomsDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered cities for search
  const filteredCities = useMemo(() => {
    const citiesArray = Array.isArray(cities) ? cities : [];
    if (!citySearchInput.trim()) {
      return citiesArray;
    }
    return citiesArray.filter(
      (city) =>
        city.name.toLowerCase().includes(citySearchInput.toLowerCase()) ||
        city.state.toLowerCase().includes(citySearchInput.toLowerCase())
    );
  }, [citySearchInput, cities]);

  // Sync city search input when filters.city changes externally (e.g., clear filters)
  useEffect(() => {
    if (!filters.city) {
      // Filter was cleared, clear the input
      setCitySearchInput("");
    } else {
      // Check if current input doesn't match the filter
      const selectedCity = cities.find((c) => c.name === filters.city);
      if (selectedCity) {
        const expectedInput = `${selectedCity.name}, ${selectedCity.state}`;
        // Only update if input doesn't match (avoid unnecessary updates)
        if (
          citySearchInput !== expectedInput &&
          !citySearchInput.includes(selectedCity.name)
        ) {
          setCitySearchInput(expectedInput);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.city, cities]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
      }
      if (
        guestsDropdownRef.current &&
        !guestsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGuestsDropdown(false);
      }
      if (
        bedroomsDropdownRef.current &&
        !bedroomsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBedroomsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate active filters count (exclude sortBy, checkin, checkout)
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "sortBy" &&
      key !== "checkin" &&
      key !== "checkout" &&
      value !== ""
  ).length;

  // Auto-expand filters if any are active on initial load
  const [showFilters, setShowFilters] = useState(() => activeFiltersCount > 0);

  return (
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
              <button onClick={onClearFilters} className="clear-filters-btn">
                <FiX />
                <span>Clear all</span>
              </button>
            )}
          </div>

          <div className="results-actions">
            <div className="results-count">
              <strong>{resultsCount}</strong> properties found
            </div>

            <div className="sort-dropdown">
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange("sortBy", e.target.value)}
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
              {/* City - Searchable Dropdown */}
              <div className="filter-group" ref={cityDropdownRef}>
                <label>
                  <FiMapPin />
                  Location
                </label>
                <div className="searchable-dropdown">
                  <input
                    type="text"
                    value={citySearchInput}
                    onChange={(e) => {
                      setCitySearchInput(e.target.value);
                      setShowCityDropdown(true);
                      if (!e.target.value) {
                        onFilterChange("city", "");
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedCityIndex((prev) =>
                          Math.min(prev + 1, filteredCities.length - 1)
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedCityIndex((prev) => Math.max(prev - 1, 0));
                      } else if (e.key === "Enter" && selectedCityIndex >= 0) {
                        e.preventDefault();
                        const city = filteredCities[selectedCityIndex];
                        setCitySearchInput(`${city.name}, ${city.state}`);
                        onFilterChange("city", city.name);
                        setShowCityDropdown(false);
                      }
                    }}
                    placeholder="Search city..."
                    className="filter-input"
                  />
                  {citySearchInput && (
                    <button
                      className="clear-city-btn"
                      onClick={() => {
                        setCitySearchInput("");
                        onFilterChange("city", "");
                      }}
                      type="button"
                    >
                      <FiX />
                    </button>
                  )}
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="city-dropdown-menu">
                      {filteredCities.map((city, index) => (
                        <div
                          key={city.id}
                          className={`city-option ${
                            index === selectedCityIndex ? "highlighted" : ""
                          } ${filters.city === city.name ? "selected" : ""}`}
                          onClick={() => {
                            setCitySearchInput(`${city.name}, ${city.state}`);
                            onFilterChange("city", city.name);
                            setShowCityDropdown(false);
                            setSelectedCityIndex(-1);
                          }}
                        >
                          <FiMapPin className="city-icon" />
                          <div className="city-details">
                            <div className="city-name">{city.name}</div>
                            <div className="city-state">{city.state}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in Date - DatePicker */}
              <div className="filter-group">
                <label>
                  <FiCalendar />
                  Check-in
                </label>
                <DatePicker
                  selected={checkinDate}
                  onChange={(date: Date | null) => {
                    setCheckinDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      onFilterChange("checkin", `${year}-${month}-${day}`);
                    } else {
                      onFilterChange("checkin", "");
                    }
                  }}
                  selectsStart
                  startDate={checkinDate}
                  endDate={checkoutDate}
                  minDate={new Date()}
                  placeholderText="Select check-in"
                  className="filter-input date-picker-input"
                  dateFormat="MMM d, yyyy"
                />
              </div>

              {/* Check-out Date - DatePicker */}
              <div className="filter-group">
                <label>
                  <FiCalendar />
                  Check-out
                </label>
                <DatePicker
                  selected={checkoutDate}
                  onChange={(date: Date | null) => {
                    setCheckoutDate(date);
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      onFilterChange("checkout", `${year}-${month}-${day}`);
                    } else {
                      onFilterChange("checkout", "");
                    }
                  }}
                  selectsEnd
                  startDate={checkinDate}
                  endDate={checkoutDate}
                  minDate={checkinDate || new Date()}
                  placeholderText="Select check-out"
                  className="filter-input date-picker-input"
                  dateFormat="MMM d, yyyy"
                />
              </div>

              {/* Guests - Incrementer Dropdown */}
              <div className="filter-group" ref={guestsDropdownRef}>
                <label>
                  <FiUsers />
                  Guests
                </label>
                <div className="guests-selector">
                  <button
                    type="button"
                    className="filter-input guests-display-btn"
                    onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                  >
                    <span>
                      {guestsCount > 0
                        ? `${guestsCount} ${
                            guestsCount === 1 ? "Guest" : "Guests"
                          }`
                        : "Any"}
                    </span>
                    <FiChevronDown
                      className={`chevron ${
                        showGuestsDropdown ? "rotated" : ""
                      }`}
                    />
                  </button>
                  {showGuestsDropdown && (
                    <div className="guests-dropdown-menu">
                      <div className="guests-control">
                        <div className="guests-counter">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCount = Math.max(0, guestsCount - 1);
                              setGuestsCount(newCount);
                              onFilterChange(
                                "guests",
                                newCount > 0 ? newCount.toString() : ""
                              );
                            }}
                            disabled={guestsCount <= 0}
                          >
                            −
                          </button>
                          <span className="counter-value">{guestsCount}</span>
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCount = Math.min(20, guestsCount + 1);
                              setGuestsCount(newCount);
                              onFilterChange("guests", newCount.toString());
                            }}
                            disabled={guestsCount >= 20}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bedrooms - Incrementer Dropdown */}
              <div className="filter-group" ref={bedroomsDropdownRef}>
                <label>
                  <IoBed />
                  Bedrooms
                </label>
                <div className="guests-selector">
                  <button
                    type="button"
                    className="filter-input guests-display-btn"
                    onClick={() =>
                      setShowBedroomsDropdown(!showBedroomsDropdown)
                    }
                  >
                    <span>
                      {bedroomsCount > 0
                        ? `${bedroomsCount} ${
                            bedroomsCount === 1 ? "Bedroom" : "Bedrooms"
                          }`
                        : "Any"}
                    </span>
                    <FiChevronDown
                      className={`chevron ${
                        showBedroomsDropdown ? "rotated" : ""
                      }`}
                    />
                  </button>
                  {showBedroomsDropdown && (
                    <div className="guests-dropdown-menu">
                      <div className="guests-control">
                        <div className="guests-counter">
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCount = Math.max(0, bedroomsCount - 1);
                              setBedroomsCount(newCount);
                              onFilterChange(
                                "bedrooms",
                                newCount > 0 ? newCount.toString() : ""
                              );
                            }}
                            disabled={bedroomsCount <= 0}
                          >
                            −
                          </button>
                          <span className="counter-value">{bedroomsCount}</span>
                          <button
                            type="button"
                            className="counter-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCount = Math.min(10, bedroomsCount + 1);
                              setBedroomsCount(newCount);
                              onFilterChange("bedrooms", newCount.toString());
                            }}
                            disabled={bedroomsCount >= 10}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Min Price */}
              <div className="filter-group">
                <label>Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange("minPrice", e.target.value)}
                  placeholder="₹0"
                  className="filter-input"
                  min="0"
                />
              </div>

              {/* Max Price */}
              <div className="filter-group">
                <label>Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                  placeholder="₹50,000"
                  className="filter-input"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
