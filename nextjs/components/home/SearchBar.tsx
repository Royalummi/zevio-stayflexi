"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX, FiMapPin } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { City } from "@/types";
import { formatDateForAPI } from "@/lib/utils";
import "./SearchBar.css";

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

  const [activeField, setActiveField] = useState<string | null>(null);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(() => {
    if (!searchInput.trim()) return cities;

    return cities.filter(
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
    if (query) {
      router.push(`/properties?${query}`);
    } else {
      router.push("/properties");
    }
  };

  return (
    <div className="search-bar-professional">
      <div className="search-container-airbnb">
        {/* WHERE */}
        <div
          className={`search-field ${activeField === "where" ? "active" : ""}`}
          ref={cityDropdownRef}
          onClick={() => {
            setShowCityDropdown(true);
            setActiveField("where");
          }}
        >
          <div className="field-content">
            <label className="field-label">Where</label>
            <input
              type="text"
              className="field-input"
              placeholder="Search destinations"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowCityDropdown(true);
                setActiveField("where");
              }}
              onKeyDown={handleKeyDown}
            />
            {searchInput && (
              <button
                className="clear-btn"
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
            <div className="dropdown-menu">
              {filteredCities.length === 0 ? (
                <div className="dropdown-empty">
                  No cities found matching &quot;{searchInput}&quot;
                </div>
              ) : (
                <div className="dropdown-list">
                  {filteredCities.map((city, index) => (
                    <div
                      key={city.id}
                      className={`dropdown-item ${
                        index === selectedIndex ? "selected" : ""
                      } ${selectedCity?.id === city.id ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCity(city);
                      }}
                    >
                      <FiMapPin className="item-icon" />
                      <div className="item-content">
                        <div className="item-title">{city.name}</div>
                        <div className="item-subtitle">{city.state}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="field-divider" />

        {/* CHECK-IN */}
        <div
          className={`search-field ${
            activeField === "checkin" ? "active" : ""
          }`}
          onClick={() => setActiveField("checkin")}
        >
          <div className="field-content">
            <label className="field-label">Check in</label>
            <DatePicker
              selected={checkin}
              onChange={(date: Date | null) => setCheckin(date)}
              selectsStart
              startDate={checkin}
              endDate={checkout}
              minDate={new Date()}
              placeholderText="Add dates"
              className="field-input date-input"
              dateFormat="MMM d"
              onFocus={() => setActiveField("checkin")}
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="field-divider" />

        {/* CHECK-OUT */}
        <div
          className={`search-field ${
            activeField === "checkout" ? "active" : ""
          }`}
          onClick={() => setActiveField("checkout")}
        >
          <div className="field-content">
            <label className="field-label">Check out</label>
            <DatePicker
              selected={checkout}
              onChange={(date: Date | null) => setCheckout(date)}
              selectsEnd
              startDate={checkin}
              endDate={checkout}
              minDate={checkin || new Date()}
              placeholderText="Add dates"
              className="field-input date-input"
              dateFormat="MMM d"
              onFocus={() => setActiveField("checkout")}
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="field-divider" />

        {/* GUESTS */}
        <div
          className={`search-field search-field-last ${
            activeField === "guests" ? "active" : ""
          }`}
          ref={guestsDropdownRef}
        >
          <div
            className="field-content"
            onClick={() => {
              setShowGuestsDropdown(!showGuestsDropdown);
              setActiveField("guests");
            }}
          >
            <label className="field-label">Who</label>
            <div className="field-input">
              {guests === 0
                ? "Add guests"
                : `${guests} guest${guests !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Search Button */}
          <button className="search-btn-airbnb" onClick={handleSearch}>
            <FiSearch />
            <span className="search-btn-text">Search</span>
          </button>

          {/* Guests Dropdown */}
          {showGuestsDropdown && (
            <div className="dropdown-menu guests-dropdown">
              <div className="guests-control">
                <div className="guests-info">
                  <div className="guests-label">Guests</div>
                  <div className="guests-sublabel">All ages welcome</div>
                </div>
                <div className="guests-buttons">
                  <button
                    className="qty-btn"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                  >
                    −
                  </button>
                  <span className="guests-value">{guests}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setGuests(Math.min(20, guests + 1))}
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
