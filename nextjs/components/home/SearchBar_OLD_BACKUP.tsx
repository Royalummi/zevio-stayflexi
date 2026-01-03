"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiSearch,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { City } from "@/lib/api";
import { formatDateForAPI } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
      }
      if (
        guestsDropdownRef.current &&
        !guestsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGuestsDropdown(false);
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
    }
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setSearchInput(`${city.name}, ${city.state}`);
    setShowCityDropdown(false);
    setSelectedIndex(-1);
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
    <div className="search-bar">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0",
          alignItems: "stretch",
          background: "white",
          borderRadius: "50px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
          padding: "8px",
          border: "1px solid #DDDDDD",
        }}
        className="search-grid"
      >
        {/* Where - City Selection */}
        <div style={{ position: "relative" }} ref={cityDropdownRef}>
          <div
            style={{
              height: "100%",
              cursor: "pointer",
              borderRadius: "12px",
              border: "2px solid transparent",
              padding: "12px 16px",
              transition: "all 0.2s",
              background: showCityDropdown ? "var(--gray-50)" : "transparent",
            }}
            onClick={() => setShowCityDropdown(true)}
          >
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--gray-700)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Where
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", flex: "1" }}>
                <FiMapPin
                  style={{ color: "var(--gray-600)", marginRight: "8px" }}
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search destinations"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%",
                    background: "transparent",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--gray-900)",
                    border: "none",
                    outline: "none",
                  }}
                />
              </div>
              {selectedCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCity();
                  }}
                  style={{
                    marginLeft: "8px",
                    color: "var(--gray-600)",
                    background: "none",
                    padding: "4px",
                  }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* City Dropdown */}
          {showCityDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: "0",
                right: "0",
                background: "white",
                borderRadius: "12px",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--gray-200)",
                zIndex: "50",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {filteredCities.length > 0 ? (
                <div style={{ padding: "8px 0" }}>
                  {filteredCities.map((city, index) => (
                    <button
                      key={city.id}
                      onClick={() => selectCity(city)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background:
                          index === selectedIndex
                            ? "var(--gray-50)"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "background 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <FiMapPin
                          style={{
                            color: "var(--primary)",
                            marginRight: "12px",
                          }}
                          size={18}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: "500",
                              color: "var(--gray-900)",
                            }}
                          >
                            {city.name}
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "var(--gray-600)",
                            }}
                          >
                            {city.state}
                          </div>
                        </div>
                      </div>
                      {selectedCity?.id === city.id && (
                        <FiCheck
                          style={{ color: "var(--primary)" }}
                          size={18}
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--gray-600)",
                  }}
                >
                  <FiMapPin
                    style={{ margin: "0 auto 8px", color: "var(--gray-300)" }}
                    size={32}
                  />
                  <p style={{ fontWeight: "500" }}>No destinations found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Check-in Date */}
        <div>
          <div
            style={{
              height: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--gray-700)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Check-in
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <FiCalendar
                style={{ color: "var(--gray-600)", marginRight: "8px" }}
                size={20}
              />
              <div style={{ width: "100%" }}>
                <DatePicker
                  selected={checkin}
                  onChange={(date: Date | null) => setCheckin(date)}
                  selectsStart
                  startDate={checkin}
                  endDate={checkout}
                  minDate={new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Add date"
                  className="datepicker-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Check-out Date */}
        <div>
          <div
            style={{
              height: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--gray-700)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Check-out
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <FiCalendar
                style={{ color: "var(--gray-600)", marginRight: "8px" }}
                size={20}
              />
              <div style={{ width: "100%" }}>
                <DatePicker
                  selected={checkout}
                  onChange={(date: Date | null) => setCheckout(date)}
                  selectsEnd
                  startDate={checkin}
                  endDate={checkout}
                  minDate={checkin || new Date()}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Add date"
                  disabled={!checkin}
                  className="datepicker-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div style={{ position: "relative" }} ref={guestsDropdownRef}>
          <div
            style={{
              height: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "all 0.2s",
              background: showGuestsDropdown ? "var(--gray-50)" : "transparent",
            }}
            onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
          >
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--gray-700)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Guests
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <FiUsers
                style={{ color: "var(--gray-600)", marginRight: "8px" }}
                size={20}
              />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--gray-900)",
                }}
              >
                {guests} {guests === 1 ? "guest" : "guests"}
              </span>
            </div>
          </div>

          {/* Guests Dropdown */}
          {showGuestsDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: "0",
                width: "256px",
                borderRadius: "12px",
                border: "1px solid var(--gray-200)",
                background: "white",
                boxShadow: "var(--shadow-xl)",
                zIndex: "50",
              }}
            >
              <div style={{ padding: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: "500", color: "var(--gray-900)" }}>
                    Guests
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "2px solid var(--gray-300)",
                        color: "var(--gray-600)",
                        background: "white",
                        cursor: guests <= 1 ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: guests <= 1 ? 0.5 : 1,
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        width: "32px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "var(--gray-900)",
                      }}
                    >
                      {guests}
                    </span>
                    <button
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      disabled={guests >= 20}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "2px solid var(--gray-300)",
                        color: "var(--gray-600)",
                        background: "white",
                        cursor: guests >= 20 ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: guests >= 20 ? 0.5 : 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-600)",
                    marginTop: "8px",
                  }}
                >
                  Maximum 20 guests per property
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <button
            type="button"
            onClick={handleSearch}
            aria-label="Search villas"
            className="btn btn-primary"
            style={{
              width: "100%",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiSearch size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
