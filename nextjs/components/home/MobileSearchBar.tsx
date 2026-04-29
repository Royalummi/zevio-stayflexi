"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiChevronRight,
  FiHome,
  FiMapPin,
  FiNavigation,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { BsBuilding } from "react-icons/bs";
import DateRangeSelector from "@/components/DateRangeSelector";
import { City } from "@/types";
import styles from "./MobileSearchBar.module.css";

type PropertyType = "villas" | "apartments";
type MobileStep = "where" | "dates" | "guests";

interface MobileSearchBarProps {
  propertyType: PropertyType;
  onPropertyTypeChange: (value: PropertyType) => void;
  selectedCity: City | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSelectCity: (city: City) => void;
  onClearCity: () => void;
  onBeginDestinationEdit: () => void;
  renderList: City[];
  checkin: Date | null;
  checkout: Date | null;
  onCheckinChange: (date: Date | null) => void;
  onCheckoutChange: (date: Date | null) => void;
  moveInDate: Date | null;
  moveOutDate: Date | null;
  onMoveInDateChange: (date: Date | null) => void;
  onMoveOutDateChange: (date: Date | null) => void;
  adults: number;
  childCount: number;
  infants: number;
  onAdultsChange: (value: number) => void;
  onChildCountChange: (value: number) => void;
  onInfantsChange: (value: number) => void;
  onSearch: () => void;
}

function formatLocation(city: City | null): string {
  if (!city) return "City";

  if (city.area) {
    return `${city.area}, ${city.city || city.name}`;
  }

  return `${city.name}, ${city.state}`;
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return "Dates";

  return `${startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export default function MobileSearchBar({
  propertyType,
  onPropertyTypeChange,
  selectedCity,
  searchInput,
  onSearchInputChange,
  onSelectCity,
  onClearCity,
  onBeginDestinationEdit,
  renderList,
  checkin,
  checkout,
  onCheckinChange,
  onCheckoutChange,
  moveInDate,
  moveOutDate,
  onMoveInDateChange,
  onMoveOutDateChange,
  adults,
  childCount,
  infants,
  onAdultsChange,
  onChildCountChange,
  onInfantsChange,
  onSearch,
}: MobileSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<MobileStep>("where");
  const [isVisible, setIsVisible] = useState(false);

  const startDate = propertyType === "villas" ? checkin : moveInDate;
  const endDate = propertyType === "villas" ? checkout : moveOutDate;
  const totalGuests = adults + childCount;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activateStep = (step: MobileStep) => {
    setActiveStep(step);

    if (!isOpen) {
      setIsOpen(true);
      window.requestAnimationFrame(() => setIsVisible(true));
    }

    if (step === "where") {
      onBeginDestinationEdit();
    }
  };

  const openFromSummary = () => {
    if (!selectedCity) {
      activateStep("where");
      return;
    }

    if (!startDate || !endDate) {
      activateStep("dates");
      return;
    }

    activateStep("guests");
  };

  const closeSheet = () => {
    setIsVisible(false);
    window.setTimeout(() => setIsOpen(false), 220);
  };

  const handleStartDateChange = (date: Date | null) => {
    if (propertyType === "villas") {
      onCheckinChange(date);
      return;
    }

    onMoveInDateChange(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    if (propertyType === "villas") {
      onCheckoutChange(date);
    } else {
      onMoveOutDateChange(date);
    }

    if (startDate && date) {
      setActiveStep("guests");
    }
  };

  const handleStepAction = () => {
    if (activeStep === "where") {
      if (selectedCity) {
        setActiveStep("dates");
      }
      return;
    }

    if (activeStep === "dates") {
      if (startDate && endDate) {
        setActiveStep("guests");
      }
      return;
    }

    closeSheet();
    onSearch();
  };

  const stepButtonLabel = useMemo(() => {
    if (activeStep === "where") {
      return selectedCity ? "Continue to dates" : "Select city";
    }

    if (activeStep === "dates") {
      return startDate && endDate ? "Continue to guests" : "Select dates";
    }

    return propertyType === "villas" ? "Search villas" : "Search apartments";
  }, [activeStep, endDate, propertyType, selectedCity, startDate]);

  const guestsSummary =
    totalGuests === 0
      ? "Add guests"
      : `${totalGuests} ${totalGuests === 1 ? "guest" : "guests"}${
          infants > 0 ? `, ${infants} ${infants === 1 ? "infant" : "infants"}` : ""
        }`;

  const heroSummary = [
    formatLocation(selectedCity),
    formatDateRange(startDate, endDate),
    guestsSummary,
  ].join(" · ");

  return (
    <>
      <div className={styles.mobileSearchBar}>
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={`${styles.togglePill} ${
              propertyType === "villas" ? styles.togglePillActive : ""
            }`}
            onClick={() => onPropertyTypeChange("villas")}
          >
            <FiHome className={styles.toggleIcon} />
            <span>Villas</span>
          </button>
          <button
            type="button"
            className={`${styles.togglePill} ${
              propertyType === "apartments" ? styles.togglePillActive : ""
            }`}
            onClick={() => onPropertyTypeChange("apartments")}
          >
            <BsBuilding className={styles.toggleIcon} />
            <span>Apartments</span>
          </button>
        </div>

        <div className={styles.summaryCard}>
          <button
            type="button"
            className={styles.heroButton}
            onClick={openFromSummary}
          >
            <div className={styles.heroIcon}><FiSearch /></div>
            <div className={styles.heroText}>
              <span className={styles.heroLabel}>Search stay</span>
              <span className={styles.heroValue}>{heroSummary}</span>
            </div>
            <FiChevronRight className={styles.heroChevron} />
          </button>


        </div>
      </div>

      {isOpen && (
        <>
          <div
            className={`${styles.backdrop} ${isVisible ? styles.backdropVisible : ""}`}
            onClick={closeSheet}
          />
          <div className={`${styles.sheet} ${isVisible ? styles.sheetVisible : ""}`}>
            <div className={styles.sheetHeader}>
              <div>
                <h3 className={styles.sheetTitle}>Find your stay faster</h3>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeSheet}>
                <FiX />
              </button>
            </div>

            <div className={styles.stepTabs}>
              <button
                type="button"
                className={`${styles.stepTab} ${activeStep === "where" ? styles.stepTabActive : ""}`}
                onClick={() => activateStep("where")}
              >
                <span className={styles.stepTabLabel}>Where</span>
                <span className={styles.stepTabValue}>{formatLocation(selectedCity)}</span>
              </button>
              <button
                type="button"
                className={`${styles.stepTab} ${activeStep === "dates" ? styles.stepTabActive : ""}`}
                onClick={() => activateStep("dates")}
              >
                <span className={styles.stepTabLabel}>When</span>
                <span className={styles.stepTabValue}>{formatDateRange(startDate, endDate)}</span>
              </button>
              <button
                type="button"
                className={`${styles.stepTab} ${activeStep === "guests" ? styles.stepTabActive : ""}`}
                onClick={() => activateStep("guests")}
              >
                <span className={styles.stepTabLabel}>Who</span>
                <span className={styles.stepTabValue}>{guestsSummary}</span>
              </button>
            </div>

            <div className={styles.sheetBody}>
              {activeStep === "where" && (
                <div className={styles.stepPanel}>
                  <div className={styles.stepHeader}>
                    <h4>Choose city or area</h4>
                  </div>

                  <div className={styles.locationField}>
                    <FiMapPin className={styles.locationIcon} />
                    <input
                      type="text"
                      className={styles.locationInput}
                      placeholder="Search city or area"
                      value={searchInput}
                      onFocus={onBeginDestinationEdit}
                      onChange={(e) => onSearchInputChange(e.target.value)}
                    />
                    {searchInput && (
                      <button type="button" className={styles.clearButton} onClick={onClearCity}>
                        <FiX />
                      </button>
                    )}
                  </div>

                  <div className={styles.locationList}>
                    {renderList.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyTitle}>Coming Soon</div>
                        <div className={styles.emptyCopy}>
                          We&apos;re not in this area yet, but stay tuned.
                        </div>
                      </div>
                    ) : (
                      renderList.map((city) => {
                        const isSelected =
                          selectedCity?.id === city.id &&
                          (selectedCity?.area ?? "") === (city.area ?? "");

                        return (
                          <button
                            type="button"
                            key={city.area ? `${city.id}-${city.area}` : city.id}
                            className={`${styles.locationRow} ${
                              isSelected ? styles.locationRowSelected : ""
                            }`}
                            onClick={() => {
                              onSelectCity(city);
                              setActiveStep("dates");
                            }}
                          >
                            <span className={styles.locationRowIcon}>
                              {city.area ? <FiNavigation /> : <FiMapPin />}
                            </span>
                            <span className={styles.locationText}>
                              <span className={styles.locationTitle}>
                                {city.area ? city.area : city.name}
                              </span>
                              <span className={styles.locationSubtitle}>
                                {city.area
                                  ? `${city.city || city.name}, ${city.state}`
                                  : city.state}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeStep === "dates" && (
                <div className={styles.stepPanel}>
                  <div className={styles.stepHeader}>
                    <h4>{propertyType === "villas" ? "Select stay dates" : "Select move-in and move-out"}</h4>
                  </div>

                  <div className={styles.calendarPanel}>
                    <DateRangeSelector
                      checkIn={startDate}
                      checkOut={endDate}
                      onCheckInChange={handleStartDateChange}
                      onCheckOutChange={handleEndDateChange}
                      minDate={new Date()}
                      calendarOnly={true}
                      inline={true}
                      isOpen={true}
                    />
                  </div>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        if (propertyType === "villas") {
                          onCheckinChange(null);
                          onCheckoutChange(null);
                        } else {
                          onMoveInDateChange(null);
                          onMoveOutDateChange(null);
                        }
                      }}
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              )}

              {activeStep === "guests" && (
                <div className={styles.stepPanel}>
                  <div className={styles.stepHeader}>
                    <h4>How many guests?</h4>
                  </div>

                  <div className={styles.counterList}>
                    <div className={styles.counterRow}>
                      <div>
                        <div className={styles.counterTitle}>Adults</div>
                        <div className={styles.counterCopy}>Age 13+</div>
                      </div>
                      <div className={styles.counterControls}>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                        >
                          −
                        </button>
                        <span className={styles.counterValue}>{adults}</span>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onAdultsChange(Math.min(16, adults + 1))}
                          disabled={adults >= 16}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className={styles.counterRow}>
                      <div>
                        <div className={styles.counterTitle}>Children</div>
                        <div className={styles.counterCopy}>Ages 2-12</div>
                      </div>
                      <div className={styles.counterControls}>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onChildCountChange(Math.max(0, childCount - 1))}
                          disabled={childCount <= 0}
                        >
                          −
                        </button>
                        <span className={styles.counterValue}>{childCount}</span>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onChildCountChange(Math.min(10, childCount + 1))}
                          disabled={childCount >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className={styles.counterRow}>
                      <div>
                        <div className={styles.counterTitle}>Infants</div>
                        <div className={styles.counterCopy}>Under 2</div>
                      </div>
                      <div className={styles.counterControls}>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onInfantsChange(Math.max(0, infants - 1))}
                          disabled={infants <= 0}
                        >
                          −
                        </button>
                        <span className={styles.counterValue}>{infants}</span>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() => onInfantsChange(Math.min(5, infants + 1))}
                          disabled={infants >= 5}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sheetFooter}>
              <button type="button" className={styles.primaryButton} onClick={handleStepAction}>
                {stepButtonLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}