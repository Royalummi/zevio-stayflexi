"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiX,
  FiMapPin,
  FiNavigation,
  FiCalendar,
  FiUsers,
  FiHome,
} from "react-icons/fi";
import { BsBuilding } from "react-icons/bs";
import DateRangeSelector from "@/components/DateRangeSelector";
import { City } from "@/types";
import { formatDateForAPI } from "@/lib/utils";
import { api } from "@/lib/axios";
import MobileSearchBar from "./MobileSearchBar";
import styles from "./SearchBar-modern.module.css";

type PropertyType = "villas" | "apartments";

export default function SearchBar() {
  const router = useRouter();

  // Property type toggle
  const [propertyType, setPropertyType] = useState<PropertyType>("villas");

  // Areas/localities for area-wise search (both villas and apartments)
  const [areas, setAreas] = useState<City[]>([]);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [moveInDate, setMoveInDate] = useState<Date | null>(null);
  const [moveOutDate, setMoveOutDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [showDatesDropdown, setShowDatesDropdown] = useState(false);

  const [activeField, setActiveField] = useState<string | null>(null);

  // Modal state for search experience
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // true only on client after hydration — prevents SSR mismatch
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  const datesDropdownRef = useRef<HTMLDivElement>(null);
  // Ref for the portal-rendered calendar panel — used to exempt it from the
  // click-outside handler (portal lives in document.body, not in datesDropdownRef)
  const calendarPortalRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const originalPositionRef = useRef<number>(0);
  const hasInteractedRef = useRef<boolean>(false);

  // Lock / unlock body scroll when modal opens / closes
  useEffect(() => {
    if (isSearchModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchModalOpen]);

  // Handle smooth slide animation using `top` (NOT transform — transform creates
  // a CSS stacking context that traps z-index of all dropdown children).
  useEffect(() => {
    if (!searchBarRef.current || !hasInteractedRef.current) return;

    const searchBar = searchBarRef.current;
    const spacer = spacerRef.current;

    if (isSearchModalOpen) {
      // Capture current position before switching to fixed
      const rect = searchBar.getBoundingClientRect();
      originalPositionRef.current = rect.top;

      // Reserve space so hero layout doesn't collapse
      if (spacer) {
        spacer.style.height = `${rect.height}px`;
        spacer.style.display = "block";
      }

      const startY = rect.top;
      const endY = 100;

      // Fix position at its current visual location — NO transform so we
      // never create a stacking context that traps fixed dropdowns.
      // Centering: left:0 + right:0 + width:90% + margin:auto = centred.
      searchBar.style.position = "fixed";
      searchBar.style.top = `${startY}px`;
      searchBar.style.left = "0";
      searchBar.style.right = "0";
      searchBar.style.width = "90%";
      searchBar.style.maxWidth = "1200px";
      searchBar.style.margin = "0 auto";
      searchBar.style.zIndex = "10001";
      searchBar.style.transform = "";

      // Animate slide to top using `top` property — no transform
      requestAnimationFrame(() => {
        searchBar.style.transition = "top 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
        searchBar.style.top = `${endY}px`;
      });
    } else {
      // Slide back to original position
      searchBar.style.transition = "top 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      searchBar.style.top = `${originalPositionRef.current}px`;

      const timeout = setTimeout(() => {
        searchBar.style.position = "";
        searchBar.style.top = "";
        searchBar.style.left = "";
        searchBar.style.right = "";
        searchBar.style.width = "";
        searchBar.style.maxWidth = "";
        searchBar.style.margin = "";
        searchBar.style.zIndex = "";
        searchBar.style.transform = "";
        searchBar.style.transition = "";
        if (spacer) {
          spacer.style.height = "";
          spacer.style.display = "none";
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isSearchModalOpen]);

  // Modal handlers
  const openModal = () => {
    hasInteractedRef.current = true;
    setIsSearchModalOpen(true);
  };

  const closeModal = () => {
    setIsSearchModalOpen(false);
    setShowCityDropdown(false);
    setShowDatesDropdown(false);
    setShowGuestsDropdown(false);
    setActiveField(null);
  };

  // ESC key listener
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchModalOpen) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isSearchModalOpen]);

  // Mobile keyboard detection - adjust search bar position to stay visible
  useEffect(() => {
    if (!isMobile || !isSearchModalOpen) return;

    const handleKeyboardVisibilityChange = () => {
      if (!searchBarRef.current) return;

      const searchBar = searchBarRef.current;
      const searchBarHeight = searchBar.offsetHeight || 80;
      const minTopPosition = 20; // Minimum space from top (in px)

      // Calculate visible viewport height (accounts for keyboard)
      const windowHeight = window.innerHeight;
      const visualViewportHeight =
        window.visualViewport?.height || windowHeight;
      const keyboardHeight = windowHeight - visualViewportHeight;

      // If keyboard is visible (keyboardHeight > 50px threshold)
      if (keyboardHeight > 50) {
        // Calculate safe top position: ensure search bar stays visible with margin
        // Available space = visualViewportHeight - searchBarHeight - margin
        const maxSafeTop =
          visualViewportHeight - searchBarHeight - minTopPosition;
        const currentTop = parseFloat(searchBar.style.top || "100");

        // If current position would be cut off by keyboard, adjust it
        if (
          currentTop + searchBarHeight >
          visualViewportHeight - minTopPosition
        ) {
          const newTop = Math.max(minTopPosition, maxSafeTop);
          // Use existing animation easing for smooth adjustment
          searchBar.style.transition = "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
          searchBar.style.top = `${newTop}px`;
        }
      } else {
        // Keyboard closed — return to original position (100px)
        searchBar.style.transition = "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        searchBar.style.top = "100px";
      }
    };

    // Listen to visualViewport resize (keyboard appearance on mobile)
    window.visualViewport?.addEventListener(
      "resize",
      handleKeyboardVisibilityChange,
    );

    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        handleKeyboardVisibilityChange,
      );
    };
  }, [isMobile, isSearchModalOpen]);

  // Fetch areas/localities based on property type.
  // Villas tab: no filter → backend returns all approved property types merged
  // (DB DISTINCT on area+city_id ensures deduplication automatically).
  // Apartments tab: filter to service_apartment only.
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const url =
          propertyType === "villas"
            ? `/public/areas`
            : `/public/areas?property_type=service_apartment`;
        const response = await api.get(url);

        if (response.data.success && response.data.data) {
          setAreas(response.data.data.areas || []);
        } else {
          setAreas([]);
        }
      } catch (error) {
        console.error("Failed to fetch areas:", error);
        setAreas([]);
      }
    };
    fetchAreas();
  }, [propertyType]);

  // Filter locations based on search input — only areas from real properties
  const filteredCities = useMemo(() => {
    if (!searchInput.trim()) {
      return areas;
    }

    return areas.filter((location) => {
      const searchLower = searchInput.toLowerCase();
      // Search in area, city, and state
      if (location.area) {
        return (
          location.area.toLowerCase().includes(searchLower) ||
          location.city?.toLowerCase().includes(searchLower) ||
          location.state.toLowerCase().includes(searchLower)
        );
      }
      // For cities without area, search in city name and state
      return (
        location.name.toLowerCase().includes(searchLower) ||
        location.state.toLowerCase().includes(searchLower)
      );
    });
  }, [searchInput, areas]);

  // Flat list: cities first (no area), then areas sorted by city then area name
  // Nandi Hills is pinned to the top
  const renderList = useMemo((): City[] => {
    const cityItems = filteredCities
      .filter((c) => !c.area)
      .sort((a, b) => a.name.localeCompare(b.name));
    const areaItems = filteredCities
      .filter((c) => c.area)
      .sort((a, b) => {
        const cityComp = (a.city || a.name).localeCompare(b.city || b.name);
        if (cityComp !== 0) return cityComp;
        return (a.area || "").localeCompare(b.area || "");
      });

    const allItems = [...cityItems, ...areaItems];

    // Pin Nandi Hills to the top if it exists in results
    const nandiHillsIndex = allItems.findIndex(
      (item) => item.name === "Nandi Hills" || item.area === "Nandi Hills",
    );
    if (nandiHillsIndex > -1) {
      const nandiHills = allItems[nandiHillsIndex];
      const remainingItems = [
        ...allItems.slice(0, nandiHillsIndex),
        ...allItems.slice(nandiHillsIndex + 1),
      ];
      return [nandiHills, ...remainingItems];
    }

    return allItems;
  }, [filteredCities]);

  // Used for keyboard navigation (renderList is already all City items)
  const sortedCitiesForNav = renderList;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close individual dropdowns when tapping outside their own field wrapper
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(target)
      ) {
        setShowCityDropdown(false);
      }
      if (
        guestsDropdownRef.current &&
        !guestsDropdownRef.current.contains(target)
      ) {
        setShowGuestsDropdown(false);
      }
      if (
        datesDropdownRef.current &&
        !datesDropdownRef.current.contains(target) &&
        !calendarPortalRef.current?.contains(target)
      ) {
        setShowDatesDropdown(false);
      }

      // Close the entire modal when tapping outside the search bar.
      // The overlay has pointer-events:none so this mousedown handler is the
      // sole mechanism for closing on outside-tap (no overlay click interference).
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(target) &&
        !calendarPortalRef.current?.contains(target)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCityDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, sortedCitiesForNav.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectCity(sortedCitiesForNav[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowCityDropdown(false);
      setActiveField(null);
    }
  };

  const selectCity = (city: City) => {
    setSelectedCity(city);
    // Format display - show area if available
    if (city.area) {
      setSearchInput(`${city.area}, ${city.city || city.name}, ${city.state}`);
    } else {
      setSearchInput(`${city.name}, ${city.state}`);
    }
    setShowCityDropdown(false);
    setSelectedIndex(-1);
    setActiveField(null);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setSearchInput("");
    setSelectedIndex(-1);
  };

  const formatDateLabel = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const getDesktopDateValueText = () => {
    if (propertyType === "villas") {
      if (checkin && checkout) {
        return `${formatDateLabel(checkin)} - ${formatDateLabel(checkout)}`;
      }
      if (checkin && !checkout) {
        return `${formatDateLabel(checkin)} - Check-out`;
      }
      return "Check-in - Check-out";
    }

    if (moveInDate && moveOutDate) {
      return `${formatDateLabel(moveInDate)} - ${formatDateLabel(moveOutDate)}`;
    }
    if (moveInDate && !moveOutDate) {
      return `${formatDateLabel(moveInDate)} - Move-out`;
    }
    return "Move-in - Move-out";
  };

  const getDateStepHint = () => {
    if (propertyType === "villas") {
      if (!checkin) return "Step 1 of 2: Select check-in date";
      if (!checkout) return "Step 2 of 2: Select check-out date";
      return "Dates selected. You can continue to guests and search.";
    }

    if (!moveInDate) return "Step 1 of 2: Select move-in date";
    if (!moveOutDate) return "Step 2 of 2: Select move-out date";
    return "Dates selected. You can continue to guests and search.";
  };

  const beginDestinationEdit = () => {
    if (selectedCity) {
      setSearchInput("");
    }
  };

  const handleSearch = () => {
    // ============================================
    // CRITICAL FIX: Date & Guest Validation
    // Prevents user errors before search
    // ============================================

    if (propertyType === "villas") {
      // Villa validation logic
      // 1. Validate check-in date is not in the past
      if (checkin) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkinDate = new Date(checkin);
        checkinDate.setHours(0, 0, 0, 0);

        if (checkinDate < today) {
          alert(
            "Check-in date cannot be in the past. Please select a future date.",
          );
          return;
        }
      }

      // 2. Validate check-out is after check-in
      if (checkin && checkout) {
        if (checkout <= checkin) {
          alert("Check-out date must be after check-in date.");
          return;
        }

        // 3. Validate maximum booking duration (30 days for villas)
        const daysDiff = Math.ceil(
          (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff > 30) {
          alert(
            "Maximum booking duration is 30 days. Please select a shorter stay.",
          );
          return;
        }

        // 4. Minimum booking duration (1 night)
        if (daysDiff < 1) {
          alert("Minimum booking duration is 1 night.");
          return;
        }
      }
    } else {
      // Apartment validation logic
      if (!moveInDate) {
        alert("Please select a move-in date.");
        return;
      }

      if (!moveOutDate) {
        alert("Please select a move-out date.");
        return;
      }

      // Validate move-in date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const moveIn = new Date(moveInDate);
      moveIn.setHours(0, 0, 0, 0);

      if (moveIn < today) {
        alert(
          "Move-in date cannot be in the past. Please select a future date.",
        );
        return;
      }

      // Validate move-out is after move-in
      if (moveOutDate <= moveInDate) {
        alert("Move-out date must be after move-in date.");
        return;
      }

      // Calculate days for apartments
      const daysDiff = Math.ceil(
        (moveOutDate.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Minimum 1 day
      if (daysDiff < 1) {
        alert("Minimum stay duration is 1 day.");
        return;
      }

      // Maximum 365 days
      if (daysDiff > 365) {
        alert(
          "Maximum stay duration is 365 days. For longer stays, please contact us.",
        );
        return;
      }
    }

    // 5. Validate guest count (common for both)
    const totalGuests = adults + children;
    if (totalGuests === 0) {
      alert("Please add at least 1 guest.");
      return;
    }

    if (totalGuests > 20) {
      alert(
        "Maximum 20 guests allowed. For larger groups, please contact us directly.",
      );
      return;
    }

    // ============================================
    // Build search parameters
    // ============================================
    const params = new URLSearchParams();

    if (selectedCity) {
      params.append(
        "city",
        selectedCity.city || selectedCity.name.toLowerCase(),
      );
      // Add area parameter if area is selected
      if (selectedCity.area) {
        params.append("area", selectedCity.area);
      }
    }

    if (propertyType === "villas") {
      if (checkin) {
        params.append("checkin", formatDateForAPI(checkin));
      }
      if (checkout) {
        params.append("checkout", formatDateForAPI(checkout));
      }
    } else {
      // Apartments use moveInDate and moveOutDate
      if (moveInDate) {
        params.append("checkin", formatDateForAPI(moveInDate));
      }
      if (moveOutDate) {
        params.append("checkout", formatDateForAPI(moveOutDate));
      }
    }

    // Keep adults/children/infants as explicit params for accurate UI badges
    // on listing filter bars, and keep combined `guests` for capacity filtering.
    if (adults > 0) {
      params.append("adults", adults.toString());
    }
    if (children > 0) {
      params.append("children", children.toString());
    }

    // Pass combined guests (adults + children) for backend max_guests filtering.
    if (totalGuests > 0) {
      params.append("guests", totalGuests.toString());
    }
    if (infants > 0) {
      params.append("infants", infants.toString());
    }

    const query = params.toString();

    // Close modal before navigation
    closeModal();

    // Route to appropriate page based on property type
    if (propertyType === "villas") {
      if (query) {
        router.push(`/villas?${query}`);
      } else {
        router.push("/villas");
      }
    } else {
      if (query) {
        router.push(`/service-apartments?${query}`);
      } else {
        router.push("/service-apartments");
      }
    }
  };

  if (isMobile) {
    return (
      <MobileSearchBar
        propertyType={propertyType}
        onPropertyTypeChange={setPropertyType}
        selectedCity={selectedCity}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSelectCity={selectCity}
        onClearCity={clearCity}
        onBeginDestinationEdit={beginDestinationEdit}
        renderList={renderList}
        checkin={checkin}
        checkout={checkout}
        onCheckinChange={setCheckin}
        onCheckoutChange={setCheckout}
        moveInDate={moveInDate}
        moveOutDate={moveOutDate}
        onMoveInDateChange={setMoveInDate}
        onMoveOutDateChange={setMoveOutDate}
        adults={adults}
        childCount={children}
        infants={infants}
        onAdultsChange={setAdults}
        onChildCountChange={setChildren}
        onInfantsChange={setInfants}
        onSearch={handleSearch}
      />
    );
  }

  return (
    <>
      {/* Dark Overlay */}
      {isSearchModalOpen && (
        <div
          data-testid="search-modal-overlay"
          className={`${styles.searchOverlay} ${styles.overlayActive}`}
          onClick={closeModal}
        />
      )}

      {/*
        Invisible spacer: shown only when searchBar is position:fixed.
        Takes the exact height of the searchBar so the hero flex container
        doesn't collapse and the title doesn't jump.
      */}
      <div
        ref={spacerRef}
        aria-hidden="true"
        style={{ display: "none", flexShrink: 0 }}
      />

      {/* SearchBar with Smooth Slide Animation */}
      <div
        ref={searchBarRef}
        data-testid="search-bar-container"
        className={styles.searchBarModern}
      >
        {/* ── Property type toggle – always inline inside the pill ── */}
        <div className={styles.toggleInBar}>
          <button
            className={`${styles.togglePillInBar} ${
              propertyType === "villas" ? styles.active : ""
            }`}
            onClick={() => setPropertyType("villas")}
            type="button"
          >
            <FiHome className={styles.toggleIconInBar} />
            <span>Villas</span>
          </button>
          {/* HIDDEN: Apartments tab — re-enable when service apartments feature is live */}
          {/* <button
            className={`${styles.togglePillInBar} ${
              propertyType === "apartments" ? styles.active : ""
            }`}
            onClick={() => setPropertyType("apartments")}
            type="button"
          >
            <BsBuilding className={styles.toggleIconInBar} />
            <span>Apartments</span>
          </button> */}
        </div>
        <div className={styles.searchWrapper}>
          <div className={styles.dividerModern} />
          {/* Destination Field */}
          <div
            className={`${styles.searchFieldModern} ${
              activeField === "where" ? styles.fieldActive : ""
            }`}
            ref={cityDropdownRef}
          >
            <div
              className={styles.fieldInner}
              onClick={() => {
                openModal();
                setShowCityDropdown(true);
                setActiveField("where");
                // If a city is already selected, clear the input text so the
                // full list shows again — user can type to filter or pick a new one
                if (selectedCity) {
                  setSearchInput("");
                }
                destinationInputRef.current?.focus();
              }}
            >
              <FiMapPin className={styles.fieldIcon} />
              <div className={styles.fieldTextWrapper}>
                <label className={styles.fieldLabelModern}>Location</label>
                <input
                  ref={destinationInputRef}
                  type="text"
                  className={styles.fieldInputModern}
                  placeholder="City or area"
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
                  className={styles.clearBtnModern}
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
              <div className={styles.dropdownModern}>
                {sortedCitiesForNav.length === 0 ? (
                  <div className={styles.dropdownEmptyModern}>
                    <FiMapPin className={styles.emptyIcon} />
                    <div>Coming Soon</div>
                    <div className={styles.emptySubtitle}>
                      We&apos;re not in this area yet, but stay tuned!
                    </div>
                  </div>
                ) : (
                  <div className={styles.dropdownListModern}>
                    {renderList.map((city, i) => {
                      /* City / area item */
                      void i;
                      const navIndex = sortedCitiesForNav.indexOf(city);
                      const isSelected =
                        selectedCity?.id === city.id &&
                        (selectedCity?.area ?? "") === (city.area ?? "");
                      return (
                        <div
                          key={city.area ? `${city.id}-${city.area}` : city.id}
                          className={`${styles.dropdownItemModern} ${
                            navIndex === selectedIndex
                              ? styles.itemHighlighted
                              : ""
                          } ${isSelected ? styles.itemSelected : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCity(city);
                          }}
                        >
                          <div className={styles.itemIconWrapper}>
                            {city.area ? (
                              <FiNavigation className={styles.itemIconModern} />
                            ) : (
                              <FiMapPin className={styles.itemIconModern} />
                            )}
                          </div>
                          <div className={styles.itemText}>
                            <div className={styles.itemTitleModern}>
                              {city.area ? city.area : city.name}
                            </div>
                            <div className={styles.itemSubtitleModern}>
                              {city.area
                                ? `${city.city || city.name}, ${city.state}`
                                : city.state}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className={styles.dividerModern} />

          {/* Single Dates Field - Shows side-by-side calendars */}
          <div
            className={`${styles.searchFieldModern} ${
              activeField === "dates" ? styles.fieldActive : ""
            }`}
            ref={datesDropdownRef}
          >
            <div
              className={styles.fieldInner}
              onClick={() => {
                openModal();
                setShowDatesDropdown(true);
                setActiveField("dates");
              }}
            >
              <FiCalendar className={styles.fieldIcon} />
              <div className={styles.fieldTextWrapper}>
                <label className={styles.fieldLabelModern}>
                  {propertyType === "villas" ? "Dates" : "Duration"}
                </label>
                <div className={styles.fieldValueModern}>
                  {getDesktopDateValueText()}
                </div>
              </div>
            </div>

            {/* Dates Dropdown — desktop only; mobile is portaled to body */}
            {showDatesDropdown && !isMobile && (
              <div
                className={`${styles.dropdownModern} ${styles.datesDropdownModern}`}
              >
                {propertyType === "villas" ? (
                  <DateRangeSelector
                    checkIn={checkin}
                    checkOut={checkout}
                    onCheckInChange={(date) => {
                      setCheckin(date);
                    }}
                    onCheckOutChange={(date) => {
                      setCheckout(date);
                      if (checkin && date) {
                        setShowDatesDropdown(false);
                        setActiveField(null);
                      }
                    }}
                    minDate={new Date()}
                    calendarOnly={true}
                    isOpen={showDatesDropdown}
                    onOpenChange={setShowDatesDropdown}
                  />
                ) : (
                  <DateRangeSelector
                    checkIn={moveInDate}
                    checkOut={moveOutDate}
                    onCheckInChange={(date) => {
                      setMoveInDate(date);
                    }}
                    onCheckOutChange={(date) => {
                      setMoveOutDate(date);
                      if (moveInDate && date) {
                        setShowDatesDropdown(false);
                        setActiveField(null);
                      }
                    }}
                    minDate={new Date()}
                    calendarOnly={true}
                    isOpen={showDatesDropdown}
                    onOpenChange={setShowDatesDropdown}
                  />
                )}
                {((propertyType === "villas" && (checkin || checkout)) ||
                  (propertyType === "apartments" &&
                    (moveInDate || moveOutDate))) && (
                  <div className={styles.calendarFooter}>
                    <button
                      type="button"
                      className={styles.clearDatesBtn}
                      onClick={() => {
                        if (propertyType === "villas") {
                          setCheckin(null);
                          setCheckout(null);
                        } else {
                          setMoveInDate(null);
                          setMoveOutDate(null);
                        }
                      }}
                    >
                      Clear dates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className={styles.dividerModern} />

          {/* Guests Field */}
          <div
            className={`${styles.searchFieldModern} ${styles.fieldWithButton} ${
              activeField === "guests" ? styles.fieldActive : ""
            }`}
            ref={guestsDropdownRef}
          >
            <div
              className={styles.fieldInner}
              onClick={() => {
                openModal();
                setShowGuestsDropdown(!showGuestsDropdown);
                setActiveField("guests");
              }}
            >
              <FiUsers className={styles.fieldIcon} />
              <div className={styles.fieldTextWrapper}>
                <label className={styles.fieldLabelModern}>Guests</label>
                <div className={styles.fieldValueModern}>
                  {adults + children}{" "}
                  {adults + children === 1 ? "Guest" : "Guests"}
                  {infants > 0 &&
                    `, ${infants} ${infants === 1 ? "Infant" : "Infants"}`}
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button className={styles.searchBtnModern} onClick={handleSearch}>
              <FiSearch className={styles.searchIcon} />
              <span className={styles.searchText}>Search</span>
            </button>

            {/* Guests Dropdown */}
            {showGuestsDropdown && (
              <div
                className={`${styles.dropdownModern} ${styles.guestsDropdownModern}`}
              >
                {/* Adults Counter */}
                <div className={styles.guestsControlModern}>
                  <div className={styles.guestsInfoModern}>
                    <div className={styles.guestsLabelModern}>Adults</div>
                    <div className={styles.guestsSublabelModern}>Age 13+</div>
                  </div>
                  <div className={styles.guestsCounter}>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdults(Math.max(1, adults - 1));
                      }}
                      disabled={adults <= 1}
                    >
                      −
                    </button>
                    <span className={styles.counterValue}>{adults}</span>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdults(Math.min(16, adults + 1));
                      }}
                      disabled={adults >= 16}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.guestsDivider} />

                {/* Children Counter */}
                <div className={styles.guestsControlModern}>
                  <div className={styles.guestsInfoModern}>
                    <div className={styles.guestsLabelModern}>Children</div>
                    <div className={styles.guestsSublabelModern}>Ages 2-12</div>
                  </div>
                  <div className={styles.guestsCounter}>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setChildren(Math.max(0, children - 1));
                      }}
                      disabled={children <= 0}
                    >
                      −
                    </button>
                    <span className={styles.counterValue}>{children}</span>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setChildren(Math.min(10, children + 1));
                      }}
                      disabled={children >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.guestsDivider} />

                {/* Infants Counter */}
                <div className={styles.guestsControlModern}>
                  <div className={styles.guestsInfoModern}>
                    <div className={styles.guestsLabelModern}>Infants</div>
                    <div className={styles.guestsSublabelModern}>Under 2</div>
                  </div>
                  <div className={styles.guestsCounter}>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfants(Math.max(0, infants - 1));
                      }}
                      disabled={infants <= 0}
                    >
                      −
                    </button>
                    <span className={styles.counterValue}>{infants}</span>
                    <button
                      className={styles.counterBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfants(Math.min(5, infants + 1));
                      }}
                      disabled={infants >= 5}
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
    </>
  );
}
