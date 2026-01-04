"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX, FiMapPin, FiCalendar, FiUsers } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { City } from "@/types";
import { formatDateForAPI } from "@/lib/utils";
import "./SearchBar-modern.css";

interface SearchBarProps {
  cities: City[];
}

export default function SearchBar({ cities }: SearchBarProps) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [activeField, setActiveField] = useState<string | null>(null);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  const filteredCities = useMemo(() => {
    // Ensure cities is always an array
    const citiesArray = Array.isArray(cities) ? cities : [];

    if (!searchInput.trim()) {
      return citiesArray;
    }

    return citiesArray.filter(
      (city) =>
        city.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        city.state.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput, cities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
        setActiveField(null);
      }
      if (
        guestsDropdownRef.current &&
        !guestsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGuestsDropdown(false);
        setActiveField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCityDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCities.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectCity(filteredCities[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowCityDropdown(false);
      setActiveField(null);
    }
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setSearchInput(`${city.name}, ${city.state}`);
    setShowCityDropdown(false);
    setSelectedIndex(-1);
    setActiveField(null);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setSearchInput("");
    setSelectedIndex(-1);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedCity) {
      params.append("city", selectedCity.name.toLowerCase());
    }
    if (checkin) {
      params.append("checkin", formatDateForAPI(checkin));
    }
    if (checkout) {
      params.append("checkout", formatDateForAPI(checkout));
    }
    if (guests > 0) {
      params.append("guests", guests.toString());
    }

    const query = params.toString();
    console.log("SearchBar - Navigating with params:", query);
    console.log("SearchBar - Guests value:", guests);

    if (query) {
      router.push(`/properties?${query}`);
    } else {
      router.push("/properties");
    }
  };

  return (
    <div className="search-bar-modern">
      <div className="search-wrapper">
        {/* Destination Field */}
        <div
          className={`search-field-modern ${
            activeField === "where" ? "field-active" : ""
          }`}
          ref={cityDropdownRef}
        >
          <div
            className="field-inner"
            onClick={() => {
              setShowCityDropdown(true);
              setActiveField("where");
              destinationInputRef.current?.focus();
            }}
          >
            <FiMapPin className="field-icon" />
            <div className="field-text-wrapper">
              <label className="field-label-modern">Destination</label>
              <input
                ref={destinationInputRef}
                type="text"
                className="field-input-modern"
                placeholder="Where are you going?"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowCityDropdown(true);
                  setActiveField("where");
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
            {searchInput && (
              <button
                className="clear-btn-modern"
                onClick={(e) => {
                  e.stopPropagation();
                  clearCity();
                }}
              >
                <FiX />
              </button>
            )}
          </div>

          {/* City Dropdown */}
          {showCityDropdown && (
            <div className="dropdown-modern">
              {filteredCities.length === 0 ? (
                <div className="dropdown-empty-modern">
                  <FiMapPin className="empty-icon" />
                  <div>No destinations found</div>
                  <div className="empty-subtitle">
                    Try searching for a different city
                  </div>
                </div>
              ) : (
                <div className="dropdown-list-modern">
                  {filteredCities.map((city, index) => (
                    <div
                      key={city.id}
                      className={`dropdown-item-modern ${
                        index === selectedIndex ? "item-highlighted" : ""
                      } ${selectedCity?.id === city.id ? "item-selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCity(city);
                      }}
                    >
                      <div className="item-icon-wrapper">
                        <FiMapPin className="item-icon-modern" />
                      </div>
                      <div className="item-text">
                        <div className="item-title-modern">{city.name}</div>
                        <div className="item-subtitle-modern">{city.state}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="divider-modern" />

        {/* Check-in Field */}
        <div
          className={`search-field-modern ${
            activeField === "checkin" ? "field-active" : ""
          }`}
        >
          <div
            className="field-inner"
            onClick={() => {
              setIsCheckinOpen(true);
              setActiveField("checkin");
            }}
          >
            <FiCalendar className="field-icon" />
            <div className="field-text-wrapper">
              <label className="field-label-modern">Check-in</label>
              <DatePicker
                selected={checkin}
                onChange={(date: Date | null) => setCheckin(date)}
                selectsStart
                startDate={checkin}
                endDate={checkout}
                minDate={new Date()}
                placeholderText="Select date"
                className="field-input-modern date-picker-modern"
                dateFormat="MMM d, yyyy"
                open={isCheckinOpen}
                onClickOutside={() => {
                  setIsCheckinOpen(false);
                  setActiveField(null);
                }}
                onSelect={() => setIsCheckinOpen(false)}
                preventOpenOnFocus={true}
                shouldCloseOnSelect={true}
              />
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="divider-modern" />

        {/* Check-out Field */}
        <div
          className={`search-field-modern ${
            activeField === "checkout" ? "field-active" : ""
          }`}
        >
          <div
            className="field-inner"
            onClick={() => {
              setIsCheckoutOpen(true);
              setActiveField("checkout");
            }}
          >
            <FiCalendar className="field-icon" />
            <div className="field-text-wrapper">
              <label className="field-label-modern">Check-out</label>
              <DatePicker
                selected={checkout}
                onChange={(date: Date | null) => setCheckout(date)}
                selectsEnd
                startDate={checkin}
                endDate={checkout}
                minDate={checkin || new Date()}
                placeholderText="Select date"
                className="field-input-modern date-picker-modern"
                dateFormat="MMM d, yyyy"
                open={isCheckoutOpen}
                onClickOutside={() => {
                  setIsCheckoutOpen(false);
                  setActiveField(null);
                }}
                onSelect={() => setIsCheckoutOpen(false)}
                preventOpenOnFocus={true}
                shouldCloseOnSelect={true}
              />
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="divider-modern" />

        {/* Guests Field */}
        <div
          className={`search-field-modern field-with-button ${
            activeField === "guests" ? "field-active" : ""
          }`}
          ref={guestsDropdownRef}
        >
          <div
            className="field-inner"
            onClick={() => {
              setShowGuestsDropdown(!showGuestsDropdown);
              setActiveField("guests");
            }}
          >
            <FiUsers className="field-icon" />
            <div className="field-text-wrapper">
              <label className="field-label-modern">Guests</label>
              <div className="field-value-modern">
                {guests} {guests === 1 ? "Guest" : "Guests"}
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button className="search-btn-modern" onClick={handleSearch}>
            <FiSearch className="search-icon" />
            <span className="search-text">Search</span>
          </button>

          {/* Guests Dropdown */}
          {showGuestsDropdown && (
            <div className="dropdown-modern guests-dropdown-modern">
              <div className="guests-control-modern">
                <div className="guests-info-modern">
                  <div className="guests-label-modern">Number of Guests</div>
                  <div className="guests-sublabel-modern">
                    How many people are traveling?
                  </div>
                </div>
                <div className="guests-counter">
                  <button
                    className="counter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGuests(Math.max(1, guests - 1));
                    }}
                    disabled={guests <= 1}
                  >
                    −
                  </button>
                  <span className="counter-value">{guests}</span>
                  <button
                    className="counter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGuests(Math.min(20, guests + 1));
                    }}
                    disabled={guests >= 20}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
