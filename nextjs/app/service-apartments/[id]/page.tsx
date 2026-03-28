"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { api } from "@/lib/axios";
import styles from "./property-detail.module.css";
import {
  FiMapPin,
  FiBriefcase,
  FiWifi,
  FiCoffee,
  FiTruck,
  FiBox,
  FiUsers,
  FiCalendar,
  FiClock,
  FiPercent,
  FiShare2,
  FiHeart,
  FiArrowLeft,
  FiCheck,
  FiShield,
  FiPhone,
  FiAlertCircle,
  FiInfo,
  FiHome,
  FiCheckCircle,
  FiX,
  FiTv,
  FiWind,
  FiDroplet,
  FiZap,
} from "react-icons/fi";
import { MdOutlineElevator } from "react-icons/md";
import { useCorporateUser } from "@/hooks/useCorporateUser";
import { useBooking } from "@/contexts/BookingContext";
import { formatDateForAPI } from "@/lib/utils";
import ImageGallery from "@/components/properties/ImageGallery";
import DateRangeSelector from "@/components/DateRangeSelector";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { useAuthModals } from "@/contexts/AuthModalContext";
import { getImageUrl, getPropertyImages } from "@/lib/imageUtils";
import ServiceDetailsCard from "@/components/properties/ServiceDetailsCard";
import FeaturedPropertyBadge from "@/components/properties/FeaturedPropertyBadge";
import MobileBookingSheet from "@/components/MobileBookingSheet";

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return <FiWifi />;
  if (lower.includes("tv") || lower.includes("television")) return <FiTv />;
  if (
    lower.includes("coffee") ||
    lower.includes("kitchen") ||
    lower.includes("dining")
  )
    return <FiCoffee />;
  if (
    lower.includes("ac") ||
    lower.includes("air") ||
    lower.includes("cooling")
  )
    return <FiWind />;
  if (
    lower.includes("water") ||
    lower.includes("pool") ||
    lower.includes("laundry")
  )
    return <FiDroplet />;
  if (
    lower.includes("power") ||
    lower.includes("backup") ||
    lower.includes("generator")
  )
    return <FiZap />;
  if (lower.includes("gym") || lower.includes("fitness")) return <FiBox />;
  if (
    lower.includes("park") ||
    lower.includes("car") ||
    lower.includes("vehicle")
  )
    return <FiTruck />;
  if (
    lower.includes("workspace") ||
    lower.includes("desk") ||
    lower.includes("office")
  )
    return <FiBriefcase />;
  return <FiCheck />;
};

interface PriceBreakdown {
  nights: number;
  base_total: number;
  long_stay_discount?: {
    type: string;
    percentage: number;
    amount: number;
  };
  corporate_discount?: {
    percentage: number;
    amount: number;
  };
  gst_amount: number;
  total_amount: number;
  total_savings: number;
  savings_percentage: number;
}

interface Property {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  address: string;
  area?: string;
  pincode?: string;
  maps_location?: string;
  bedrooms: number;
  bathrooms?: number;
  max_guests?: number;
  max_occupancy?: number;
  base_occupancy?: number;
  price_per_night: number;
  gst_percentage?: number;
  min_guests?: number;
  min_children?: number;
  max_children?: number;
  extra_guest_charge?: number;
  extra_child_charge?: number;
  weekly_discount_percent?: number;
  monthly_discount_percent?: number;
  quarterly_discount_percent?: number;
  long_term_discount_percent?: number;
  monthly_discount_percentage?: number;
  quarterly_discount_percentage?: number;
  long_term_discount_percentage?: number;
  corporate_discount_percent?: number;
  corporate_discount_percentage?: number;
  min_stay_days?: number;
  max_stay_days?: number;
  min_stay_nights?: number;
  max_stay_nights?: number;
  maintenance_charges?: number | string;
  notice_period_days?: number;
  // Features returned as array from backend
  features?: string[];
  features_list?: string;
  // Computed boolean flags from features array
  has_workspace: boolean;
  has_housekeeping: boolean;
  has_elevator: boolean;
  has_gym: boolean;
  has_parking: boolean;
  allow_corporate_booking: boolean;
  rating: number;
  reviews_count?: number;
  total_reviews?: number;
  photos: string[];
  amenities: string[];
  // Phase 2: Service apartment specific fields
  housekeeping_frequency?: string;
  wifi_speed_mbps?: number;
  wifi_provider?: string;
  furnishing_type?: string;
  parking_slots?: number;
  floor_number?: number;
  utilities_included?: boolean;
  // Phase 1: Policy fields
  house_rules?: object | string;
  cancellation_policy?: object | string;
  emergency_contacts?: string;
  safety_information?: string;
  local_area_info?: string;
  check_in_time?: string;
  check_out_time?: string;
  // Phase 3: Property info
  property_type?: string;
  vendor_name?: string;
  employee_name?: string;
  // Phase 4: Booking flexibility
  same_day_booking_allowed?: boolean | number;
  max_booking_days?: number | null;
  is_recommended?: boolean | number;
  recommended_priority?: number;
}

// Utility function to parse features array into boolean flags
const parseFeatures = (
  property: Partial<Property> & { features?: string[] },
): Property => {
  const features = property.features || [];
  return {
    ...property,
    has_workspace: features.some((f: string) =>
      f.toLowerCase().includes("workspace"),
    ),
    has_housekeeping: features.some((f: string) =>
      f.toLowerCase().includes("housekeeping"),
    ),
    has_elevator: features.some((f: string) =>
      f.toLowerCase().includes("elevator"),
    ),
    has_gym: features.some((f: string) => f.toLowerCase().includes("gym")),
    has_parking: features.some((f: string) =>
      f.toLowerCase().includes("parking"),
    ),
  } as Property;
};

function ServiceApartmentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showCorporateFeatures, isCorporateUser } = useCorporateUser();
  const { setBookingData } = useBooking();
  const toast = useToast();
  const { openLoginModal } = useAuthModals();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Modern dropdown states - guests only
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  // Mobile bottom sheet — opens when user taps "Select Dates" on mobile
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null,
  );
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasShownInvalidToast, setHasShownInvalidToast] = useState(false);

  // Removed: showCalendar, isCorporate checkbox, tabs state

  // Check if property is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await api.get(`/wishlist/check/${params.id}`);
        if (response.data.success) {
          setIsSaved(response.data.data.isWishlisted || false);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    checkWishlist();
  }, [params.id]);

  // Click outside handler for guests dropdown only
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchPropertySafe = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);

        // Use dedicated single-property endpoint instead of fetching the full list
        const response = await api.get(`/service-apartments/${params.id}`, {
          signal: abortController.signal,
        });

        if (!isMounted) return;

        if (response.data.success && response.data.data) {
          const found = response.data.data;
          // Parse features array into boolean flags
          const parsedProperty = parseFeatures({
            ...found,
            features: Array.isArray(found.features)
              ? found.features
              : found.features_list
                ? found.features_list
                    .split(", ")
                    .filter((f: string) => f.trim())
                : [],
          });
          setProperty(parsedProperty);
        }
      } catch (error: unknown) {
        if (
          isMounted &&
          (error as Error)?.name !== "AbortError" &&
          (error as { response?: { status?: number } })?.response?.status !==
            429
        ) {
          console.error("[Fetch Property] Error:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPropertySafe();

    // Restore dates from URL if present
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");

    if (checkInParam) setCheckIn(new Date(checkInParam));
    if (checkOutParam) setCheckOut(new Date(checkOutParam));
    if (adultsParam) setAdults(parseInt(adultsParam));
    if (childrenParam) setChildren(parseInt(childrenParam));

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [params.id, searchParams]);

  useEffect(() => {
    if (property && checkIn && checkOut) {
      calculatePrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, checkIn, checkOut]);

  // Show toast when user attempts to select dates below minimum stay
  useEffect(() => {
    if (checkIn && checkOut && property) {
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      const minStay = property.min_stay_days || property.min_stay_nights || 1;

      if (nights < minStay && !hasShownInvalidToast) {
        toast.info(
          `This property requires a minimum stay of ${minStay} nights. Please select ${minStay} or more nights.`,
          5000,
        );
        setHasShownInvalidToast(true);
      } else if (nights >= minStay) {
        setHasShownInvalidToast(false);
      }
    }
  }, [checkIn, checkOut, property, hasShownInvalidToast, toast]);

  const calculatePrice = async () => {
    if (!property || !checkIn || !checkOut) return;

    // Client-side validation before API call
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    const minStay = property.min_stay_days || property.min_stay_nights || 1;
    if (nights < minStay) {
      console.log(
        `[Client Validation] Rejected: ${nights} nights < ${minStay} minimum`,
      );
      setPriceBreakdown(null);
      return;
    }

    setCalculatingPrice(true);
    try {
      const payload = {
        property_id: property.id,
        check_in: formatDateForAPI(checkIn),
        check_out: formatDateForAPI(checkOut),
        is_corporate: isCorporateUser,
      };

      console.log("[Calculate Price] Payload:", payload, `(${nights} nights)`);

      const response = await api.post(
        `/service-apartments/calculate-price`,
        payload,
      );

      console.log("Price calculation response:", response.data);

      if (response.data.success && response.data.data) {
        const apiData = response.data.data;

        // Map backend response to frontend PriceBreakdown interface
        const breakdown: PriceBreakdown = {
          nights: apiData.nights || 0,
          base_total: apiData.pricing?.base_price || 0,
          long_stay_discount:
            apiData.pricing?.long_stay_discount?.amount > 0
              ? {
                  type: apiData.pricing.long_stay_discount.type || "discount",
                  percentage:
                    apiData.pricing.long_stay_discount.percentage || 0,
                  amount: apiData.pricing.long_stay_discount.amount || 0,
                }
              : undefined,
          corporate_discount:
            apiData.pricing?.corporate_discount?.amount > 0
              ? {
                  percentage:
                    apiData.pricing.corporate_discount.percentage || 0,
                  amount: apiData.pricing.corporate_discount.amount || 0,
                }
              : undefined,
          gst_amount: apiData.pricing?.gst?.amount || 0,
          total_amount: apiData.pricing?.total || 0,
          total_savings: apiData.savings?.total_discount || 0,
          savings_percentage: apiData.savings?.percentage_saved || 0,
        };

        setPriceBreakdown(breakdown);
      }
    } catch (error) {
      console.error("Error calculating price:", error);
      if (error instanceof AxiosError) {
        console.error("Error response:", error.response?.data);
      }

      // Clear price breakdown on error
      setPriceBreakdown(null);

      // Show user-friendly error based on status code
      if (error instanceof AxiosError && error.response?.status === 400) {
        const message = error.response.data.message;

        // Extract minimum stay requirement if available
        if (message.includes("Minimum stay")) {
          const minStay =
            property.min_stay_days || property.min_stay_nights || 1;
          toast.warning(
            `This property requires a minimum stay of ${minStay} nights. Please select a longer duration.`,
            5000,
          );
        } else if (message.includes("Maximum stay")) {
          const maxStay =
            property.max_stay_days || property.max_stay_nights || 365;
          toast.warning(
            `This property allows a maximum stay of ${maxStay} nights. Please select a shorter duration.`,
            5000,
          );
        } else if (message.includes("Check-out date must be after check-in")) {
          toast.warning(
            "Please select a check-out date after the check-in date.",
            5000,
          );
        } else {
          toast.error(`Booking validation error: ${message}`, 5000);
        }
      } else if (
        error instanceof AxiosError &&
        error.response?.status === 404
      ) {
        toast.error(
          "This property is currently unavailable for booking.",
          5000,
        );
      } else {
        toast.error("Unable to calculate price. Please try again.", 5000);
      }
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property!.title,
          text: `Check out this amazing service apartment: ${property!.title}`,
          url: window.location.href,
        });
      } catch {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!", 3000);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please login to save properties to wishlist", 5000);
      return;
    }

    try {
      if (isSaved) {
        await api.delete(`/wishlist/${property!.id}`);
        setIsSaved(false);
        toast.success("Removed from wishlist", 3000);
      } else {
        await api.post(`/wishlist`, { property_id: property!.id });
        setIsSaved(true);
        toast.success("Added to wishlist", 3000);
      }
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message || "";

      if (status === 400 && message.toLowerCase().includes("already")) {
        // Property is already wishlisted — sync UI state silently
        setIsSaved(true);
      } else if (status === 403) {
        // Non-user role (admin/vendor) — don't show error, just ignore
      } else {
        console.error("Error toggling wishlist:", error);
        const errorMessage =
          message ||
          (error instanceof Error ? error.message : null) ||
          "Failed to update wishlist. Please try again.";
        toast.error(errorMessage, 5000);
      }
    }
  };

  const handleReserve = () => {
    // Check authentication first
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please login to proceed with booking", 5000);
      openLoginModal();
      return;
    }

    if (!checkIn || !checkOut) {
      toast.warning("Please select check-in and check-out dates", 5000);
      return;
    }

    // Validate guest count
    const maxGuestsAllowed =
      property!.max_guests || property!.max_occupancy || 4;
    if (adults + children > maxGuestsAllowed) {
      toast.warning(
        `Maximum ${maxGuestsAllowed} guests allowed for this property`,
        5000,
      );
      return;
    }

    // Validate minimum stay
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    const minStay = property!.min_stay_days || property!.min_stay_nights || 1;
    if (nights < minStay) {
      toast.warning(
        `This property requires a minimum stay of ${minStay} nights. Please select a longer duration.`,
        5000,
      );
      return;
    }

    // Calculate amounts - use priceBreakdown if available, otherwise calculate
    const baseAmount =
      priceBreakdown?.base_total || property!.price_per_night * nights;
    const gstAmount = priceBreakdown?.gst_amount || baseAmount * 0.18;
    const totalAmount = priceBreakdown?.total_amount || baseAmount + gstAmount;

    // Use booking context to set booking data
    setBookingData({
      propertyId: property!.id,
      propertyType: "service-apartment", // Track property type for back navigation
      propertyTypeId: "pt-002",
      checkIn: formatDateForAPI(checkIn),
      checkOut: formatDateForAPI(checkOut),
      adults,
      children,
      infants: 0,
      propertyName: property!.title,
      propertyLocation: `${property!.city}, ${property!.state}`,
      propertyImage:
        getImageUrl(property!.photos[0]) || "/placeholder-property.jpg",
      pricePerNight: Number(property!.price_per_night),
      nights,
      baseAmount,
      extraGuestCharges: 0,
      extraChildrenCharges: 0,
      gstAmount,
      totalAmount,
      minGuests: property!.base_occupancy || 1,
      maxGuests: property!.max_guests || property!.max_occupancy || 4,
      minChildren: 0,
      maxChildren: 2,
      extraGuestCharge: Number(property!.extra_guest_charge) || 0,
      extraChildCharge: Number(property!.extra_child_charge) || 0,
    });

    router.push("/booking-review");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Property not found</h2>
          <button onClick={() => router.push("/service-apartments")}>
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Professional Header with Back, Share, Wishlist */}
      <div className={styles.propertyHeader}>
        <div className={styles.headerWrapper}>
          <div className={styles.headerContent}>
            {/* Left: Property Title & Location */}
            <div className={styles.propertyTitleSection}>
              <h1 className={styles.propertyNameHeader}>{property.title}</h1>
              <p
                className={`${styles.propertyLocationHeader} ${property.maps_location ? styles.locationClickable : ""}`}
                onClick={(e) => {
                  if (property.maps_location) {
                    e.preventDefault();
                    window.open(property.maps_location, "_blank");
                  }
                }}
                title={property.maps_location ? "View on Google Maps" : ""}
              >
                <FiMapPin />
                <span>
                  {property.area
                    ? `${property.area}, ${property.city}`
                    : `${property.city}, ${property.state}`}
                  {property.pincode && ` - ${property.pincode}`}
                </span>
              </p>
            </div>

            {/* Right: Action Buttons */}
            <div className={styles.headerActions}>
              <button
                onClick={handleShare}
                className={styles.actionButton}
                aria-label="Share property"
              >
                <FiShare2 />
                <span>Share</span>
              </button>
              <button
                onClick={handleSave}
                className={`${styles.actionButton} ${
                  isSaved ? styles.activeWishlist : ""
                }`}
                aria-label={
                  isSaved ? "Remove from wishlist" : "Save to wishlist"
                }
              >
                <FiHeart />
                <span>Wishlist</span>
              </button>
              <button
                onClick={() => router.push("/service-apartments")}
                className={styles.backButton}
              >
                <FiArrowLeft />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery - Airbnb-Style Layout */}
      <ImageGallery
        images={getPropertyImages(property)}
        title={property.title}
        maxThumbnails={4}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Property Info */}
        <div className={styles.propertyInfo}>
          {/* Phase 4: Featured Property Badge */}
          <FeaturedPropertyBadge
            isRecommended={property.is_recommended}
            recommendedPriority={property.recommended_priority}
          />

          {/* Property Overview Header */}
          <div className={styles.overviewHeader}>
            <div className={styles.propertyStats}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <FiUsers />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{property.bedrooms}</div>
                  <div className={styles.statLabel}>BHK</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <FiUsers />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>
                    {property.max_guests || property.max_occupancy || 2}
                  </div>
                  <div className={styles.statLabel}>Guests</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>⭐</div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{property.rating}</div>
                  <div className={styles.statLabel}>
                    ({property.reviews_count || property.total_reviews || 0})
                  </div>
                </div>
              </div>
            </div>
            {showCorporateFeatures &&
              (property.corporate_discount_percentage || 0) > 0 && (
                <div className={styles.corporateBadge}>
                  <FiBriefcase /> Corporate Rate - Save{" "}
                  {property.corporate_discount_percentage}%
                </div>
              )}
          </div>

          {/* Special Offers Banner */}
          {((property.monthly_discount_percent ||
            property.monthly_discount_percentage ||
            0) > 0 ||
            (property.quarterly_discount_percent ||
              property.quarterly_discount_percentage ||
              0) > 0) && (
            <div className={styles.specialOffer}>
              <div className={styles.offerIcon}>
                <FiPercent />
              </div>
              <div className={styles.offerContent}>
                <h3>Special Long-Stay Discounts</h3>
                <p>
                  Save up to{" "}
                  <strong>
                    {Math.max(
                      property.long_term_discount_percent || 0,
                      property.long_term_discount_percentage || 0,
                      property.quarterly_discount_percent || 0,
                      property.quarterly_discount_percentage || 0,
                      property.monthly_discount_percent || 0,
                      property.monthly_discount_percentage || 0,
                    ) || "up to 35"}
                    %
                  </strong>{" "}
                  on extended stays · Unlock bigger savings with longer bookings
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>About This Property</h2>
              <div className={styles.sectionDivider}></div>
            </div>
            <div className={styles.descriptionContent}>
              <p>{property.description}</p>
            </div>
          </div>

          {/* Amenities */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Amenities & Features</h2>
              <div className={styles.sectionDivider}></div>
            </div>
            <div className={styles.amenitiesGrid}>
              {property.has_workspace && (
                <div className={styles.amenity}>
                  <FiBriefcase />
                  <span>Dedicated Workspace</span>
                </div>
              )}
              {property.has_housekeeping && (
                <div className={styles.amenity}>
                  <FiCoffee />
                  <span>Housekeeping</span>
                </div>
              )}
              {property.has_elevator && (
                <div className={styles.amenity}>
                  <MdOutlineElevator />
                  <span>Elevator</span>
                </div>
              )}
              {property.has_gym && (
                <div className={styles.amenity}>
                  <FiBox />
                  <span>Gym/Fitness Center</span>
                </div>
              )}
              {property.has_parking && (
                <div className={styles.amenity}>
                  <FiTruck />
                  <span>Free Parking</span>
                </div>
              )}
              {property.amenities
                ?.filter((amenity) => {
                  const lower = amenity.toLowerCase();
                  if (property.has_workspace && lower.includes("workspace"))
                    return false;
                  if (
                    property.has_housekeeping &&
                    lower.includes("housekeeping")
                  )
                    return false;
                  if (property.has_elevator && lower.includes("elevator"))
                    return false;
                  if (
                    property.has_gym &&
                    (lower.includes("gym") || lower.includes("fitness"))
                  )
                    return false;
                  if (property.has_parking && lower.includes("parking"))
                    return false;
                  return true;
                })
                .map((amenity, index) => (
                  <div key={index} className={styles.amenity}>
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Phase 2: Service Apartment Specific Details */}
          <ServiceDetailsCard
            housekeepingFrequency={property.housekeeping_frequency}
            wifiSpeedMbps={property.wifi_speed_mbps}
            wifiProvider={property.wifi_provider}
            furnishingType={property.furnishing_type}
            parkingSlots={property.parking_slots}
            floorNumber={property.floor_number}
            utilitiesIncluded={property.utilities_included}
          />

          {/* Property Information - Accordion with infoList */}
          <details className={styles.accordionCard}>
            <summary className={styles.accordionHeader}>
              <span className={styles.accordionHeaderInner}>
                <FiInfo />
                Property Information
              </span>
              <span className={styles.accordionChevron}>&#8250;</span>
            </summary>
            <div className={styles.accordionBody}>
              <div className={styles.infoList}>
                {/* Check-in & Check-out */}
                {(property.check_in_time || property.check_out_time) && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiClock />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>
                        Check-in &amp; Check-out
                      </div>
                      <div className={styles.infoValue}>
                        {property.check_in_time || "3:00 PM"} —{" "}
                        {property.check_out_time || "11:00 AM"}
                      </div>
                      <div className={styles.infoNote}>
                        Standard check-in and check-out times
                      </div>
                    </div>
                  </div>
                )}

                {/* Stay Requirements */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <FiCalendar />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Stay Requirements</div>
                    <div className={styles.infoValue}>
                      Min:{" "}
                      {property.min_stay_days || property.min_stay_nights || 1}{" "}
                      nights
                      {(property.max_stay_days || property.max_stay_nights) &&
                        ` • Max: ${property.max_stay_days || property.max_stay_nights} nights`}
                    </div>
                    {Boolean(property.same_day_booking_allowed) && (
                      <div className={styles.infoNote}>
                        ✓ Same-day booking available
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Charges */}
                {property.maintenance_charges &&
                  parseFloat(property.maintenance_charges.toString()) > 0 && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <FiHome />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>Maintenance Fee</div>
                        <div className={styles.infoValue}>
                          ₹
                          {(property.maintenance_charges || 0).toLocaleString()}
                        </div>
                        <div className={styles.infoNote}>
                          One-time maintenance charge
                        </div>
                      </div>
                    </div>
                  )}

                {/* Cancellation Policy */}
                {property.notice_period_days && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiAlertCircle />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>
                        Cancellation Policy
                      </div>
                      <div className={styles.infoValue}>
                        {property.notice_period_days}{" "}
                        {property.notice_period_days === 1 ? "day" : "days"}{" "}
                        notice required
                      </div>
                      <div className={styles.infoNote}>
                        Free cancellation before notice period
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {property.emergency_contacts && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiPhone />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Emergency Contact</div>
                      <div className={styles.infoValue}>
                        24/7 Support Available
                      </div>
                      <div className={styles.infoNote}>
                        Contact details provided after booking
                      </div>
                    </div>
                  </div>
                )}

                {/* Corporate Bookings */}
                {Boolean(property.allow_corporate_booking) && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiCheckCircle />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Corporate Bookings</div>
                      <div className={styles.infoValue}>
                        Available
                        {(property.corporate_discount_percent ||
                          property.corporate_discount_percentage) &&
                          parseFloat(
                            (
                              property.corporate_discount_percent ||
                              property.corporate_discount_percentage ||
                              0
                            ).toString(),
                          ) > 0 &&
                          ` • ${parseFloat((property.corporate_discount_percent || property.corporate_discount_percentage || 0).toString())}% corporate discount`}
                      </div>
                      <div className={styles.infoNote}>
                        Special rates for corporate clients
                      </div>
                    </div>
                  </div>
                )}

                {/* Children Policy */}
                {property.max_children !== undefined &&
                  property.max_children > 0 && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <FiUsers />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>Children Policy</div>
                        <div className={styles.infoValue}>
                          {property.min_children || 0} – {property.max_children}{" "}
                          children allowed
                        </div>
                        {property.extra_child_charge &&
                        parseFloat(property.extra_child_charge.toString()) >
                          0 ? (
                          <div className={styles.infoNote}>
                            Extra charge: ₹
                            {(
                              property.extra_child_charge || 0
                            ).toLocaleString()}{" "}
                            per child per night
                          </div>
                        ) : (
                          <div className={styles.infoNote}>
                            No additional charges for children
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* GST */}
                {property.gst_percentage && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiPercent />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>GST Included</div>
                      <div className={styles.infoValue}>
                        {parseFloat(property.gst_percentage.toString())}% GST
                      </div>
                      <div className={styles.infoNote}>
                        All prices include applicable taxes
                      </div>
                    </div>
                  </div>
                )}

                {/* Maximum Booking Period */}
                {property.max_booking_days && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiCalendar />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>
                        Maximum Booking Period
                      </div>
                      <div className={styles.infoValue}>
                        {property.max_booking_days}{" "}
                        {property.max_booking_days === 1 ? "day" : "days"}{" "}
                        maximum
                      </div>
                      <div className={styles.infoNote}>
                        Maximum booking duration allowed
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Housekeeping */}
                {property.housekeeping_frequency === "daily" && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <FiHome />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Daily Housekeeping</div>
                      <div className={styles.infoValue}>Included</div>
                      <div className={styles.infoNote}>
                        Daily cleaning and housekeeping service
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* Discount Tiers */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Flexible Pricing Plans</h2>
              <div className={styles.sectionDivider}></div>
            </div>
            <p className={styles.sectionSubtitle}>
              Choose the duration that works best for you and enjoy increasing
              discounts
            </p>
            <div className={styles.discountTiers}>
              <div className={styles.tier}>
                <div className={styles.tierHeader}>
                  <span
                    className={styles.tierBadge}
                    style={{ background: "#f59e0b" }}
                  >
                    7-29 nights
                  </span>
                  <span className={styles.tierDiscount}>
                    {property.weekly_discount_percent
                      ? `${property.weekly_discount_percent}% OFF`
                      : "Discount applies"}
                  </span>
                </div>
                <p>Weekly Discount</p>
              </div>
              <div className={styles.tier}>
                <div className={styles.tierHeader}>
                  <span
                    className={styles.tierBadge}
                    style={{ background: "#10b981" }}
                  >
                    30-89 nights
                  </span>
                  <span className={styles.tierDiscount}>
                    {property.monthly_discount_percent ||
                      property.monthly_discount_percentage ||
                      25}
                    % OFF
                  </span>
                </div>
                <p>Monthly Discount</p>
              </div>
              <div className={styles.tier}>
                <div className={styles.tierHeader}>
                  <span
                    className={styles.tierBadge}
                    style={{ background: "#06b6d4" }}
                  >
                    90-179 nights
                  </span>
                  <span className={styles.tierDiscount}>
                    {property.quarterly_discount_percent ||
                      property.quarterly_discount_percentage ||
                      30}
                    % OFF
                  </span>
                </div>
                <p>Quarterly Discount</p>
              </div>
              <div className={styles.tier}>
                <div className={styles.tierHeader}>
                  <span
                    className={styles.tierBadge}
                    style={{ background: "#8b5cf6" }}
                  >
                    180+ nights
                  </span>
                  <span className={styles.tierDiscount}>
                    {property.long_term_discount_percent ||
                      property.long_term_discount_percentage ||
                      35}
                    % OFF
                  </span>
                </div>
                <p>Long-term Discount</p>
              </div>
            </div>
          </div>

          {/* House Rules - Structured display */}
          {property.house_rules && typeof property.house_rules === "object" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <FiShield
                    style={{ display: "inline-block", marginRight: "0.5rem" }}
                  />
                  House Rules
                </h2>
                <div className={styles.sectionDivider}></div>
              </div>
              <div className={styles.houseRulesGrid}>
                {(property.house_rules as Record<string, unknown>)
                  .no_smoking === true && (
                  <div className={styles.houseRuleItem}>
                    <FiX className={styles.ruleDenyIcon} />
                    <span>No Smoking</span>
                  </div>
                )}
                {(property.house_rules as Record<string, unknown>)
                  .no_parties === true && (
                  <div className={styles.houseRuleItem}>
                    <FiX className={styles.ruleDenyIcon} />
                    <span>No Parties or Events</span>
                  </div>
                )}
                {(property.house_rules as Record<string, unknown>)
                  .no_outsiders === true && (
                  <div className={styles.houseRuleItem}>
                    <FiX className={styles.ruleDenyIcon} />
                    <span>No Outside Visitors</span>
                  </div>
                )}
                {(property.house_rules as Record<string, unknown>)
                  .pet_friendly === true ? (
                  <div className={styles.houseRuleItem}>
                    <FiCheck className={styles.ruleAllowIcon} />
                    <span>Pets Allowed</span>
                  </div>
                ) : (property.house_rules as Record<string, unknown>)
                    .pet_friendly === false ? (
                  <div className={styles.houseRuleItem}>
                    <FiX className={styles.ruleDenyIcon} />
                    <span>No Pets</span>
                  </div>
                ) : null}
                {Boolean(
                  (property.house_rules as Record<string, unknown>).quiet_hours,
                ) && (
                  <div className={styles.houseRuleItem}>
                    <FiClock className={styles.ruleInfoIcon} />
                    <span>
                      Quiet hours after{" "}
                      {String(
                        (property.house_rules as Record<string, unknown>)
                          .quiet_hours,
                      )}
                    </span>
                  </div>
                )}
              </div>
              {Array.isArray(
                (property.house_rules as Record<string, unknown>)
                  .additional_rules,
              ) &&
                (
                  (property.house_rules as Record<string, unknown>)
                    .additional_rules as string[]
                ).length > 0 && (
                  <ul className={styles.additionalRulesList}>
                    {(
                      (property.house_rules as Record<string, unknown>)
                        .additional_rules as string[]
                    ).map((rule: string, i: number) => (
                      <li key={i} className={styles.additionalRuleItem}>
                        <FiAlertCircle className={styles.ruleInfoIcon} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {/* Cancellation Policy - Structured tiers display */}
          {(property.cancellation_policy || property.notice_period_days) && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>
                  <FiAlertCircle
                    style={{ display: "inline-block", marginRight: "0.5rem" }}
                  />
                  Cancellation Policy
                </h2>
                <div className={styles.sectionDivider}></div>
              </div>
              {property.notice_period_days && (
                <div className={styles.cancelPolicySummary}>
                  <FiCheckCircle className={styles.ruleAllowIcon} />
                  <span>
                    Free cancellation if cancelled{" "}
                    <strong>{property.notice_period_days}</strong>{" "}
                    {property.notice_period_days === 1 ? "day" : "days"} before
                    check-in
                  </span>
                </div>
              )}
              {property.cancellation_policy &&
                Array.isArray(
                  (property.cancellation_policy as Record<string, unknown>)
                    .tiers,
                ) && (
                  <div className={styles.cancelTiersList}>
                    {(
                      (property.cancellation_policy as Record<string, unknown>)
                        .tiers as Array<{
                        label: string;
                        days_before_checkin: number;
                        refund_percent: number;
                      }>
                    ).map((tier, i) => (
                      <div key={i} className={styles.cancelTierItem}>
                        <div className={styles.cancelTierLabel}>
                          {tier.label}
                        </div>
                        <div className={styles.cancelTierDetails}>
                          <span className={styles.cancelTierDays}>
                            {tier.days_before_checkin > 0
                              ? `${tier.days_before_checkin}+ days before`
                              : "At check-in"}
                          </span>
                          <span
                            className={`${styles.cancelTierRefund} ${
                              tier.refund_percent === 100
                                ? styles.refundFull
                                : tier.refund_percent > 0
                                  ? styles.refundPartial
                                  : styles.refundNone
                            }`}
                          >
                            {tier.refund_percent}% Refund
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Local Area Information - Accordion */}
          {property.local_area_info && (
            <details className={styles.accordionCard}>
              <summary className={styles.accordionHeader}>
                <span className={styles.accordionHeaderInner}>
                  <FiMapPin />
                  Local Area & Nearby Facilities
                </span>
                <span className={styles.accordionChevron}>&#8250;</span>
              </summary>
              <div className={styles.accordionBody}>
                <div
                  className={styles.sectionContent}
                  dangerouslySetInnerHTML={{ __html: property.local_area_info }}
                />
              </div>
            </details>
          )}

          {/* Safety & Security Measures - Accordion */}
          {property.safety_information && (
            <details className={styles.accordionCard}>
              <summary className={styles.accordionHeader}>
                <span className={styles.accordionHeaderInner}>
                  <FiShield />
                  Safety & Security Measures
                </span>
                <span className={styles.accordionChevron}>&#8250;</span>
              </summary>
              <div className={styles.accordionBody}>
                <div
                  className={styles.sectionContent}
                  dangerouslySetInnerHTML={{
                    __html: property.safety_information,
                  }}
                />
              </div>
            </details>
          )}
        </div>

        {/* Booking Card */}
        <div id="booking" className={styles.bookingCard}>
          <div className={styles.priceHeader}>
            <div>
              <span className={styles.price}>
                ₹{(property.price_per_night || 0).toLocaleString("en-IN")}
              </span>
              <span className={styles.perNight}>/ night</span>
            </div>
          </div>

          <div className={styles.bookingFields}>
            {/* New Date Range Selector Component */}
            <DateRangeSelector
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              minDate={new Date()}
              label="Select check-in date"
              propertyId={property.id}
              basePrice={property.price_per_night}
            />

            {/* Guest Selection */}
            <div className={styles.modernFieldWrapper} ref={guestsDropdownRef}>
              <div
                className={styles.modernField}
                onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
              >
                <div className={styles.fieldInner}>
                  <FiUsers className={styles.fieldIcon} />
                  <div className={styles.fieldText}>
                    <label className={styles.fieldLabel}>Guests</label>
                    <div className={styles.fieldValue}>
                      {(adults || 0) + (children || 0)}{" "}
                      {(adults || 0) + (children || 0) === 1
                        ? "Guest"
                        : "Guests"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guests Dropdown */}
              {showGuestsDropdown && (
                <div className={styles.dropdownModern}>
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
                      <span className={styles.counterValue}>{adults || 0}</span>
                      <button
                        className={styles.counterBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (property) {
                            setAdults(
                              Math.min(
                                property.max_guests ||
                                  property.max_occupancy ||
                                  4,
                                adults + 1,
                              ),
                            );
                          }
                        }}
                        disabled={
                          !property ||
                          adults >=
                            (property.max_guests || property.max_occupancy || 4)
                        }
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
                      <div className={styles.guestsSublabelModern}>
                        Ages 2-12
                      </div>
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
                      <span className={styles.counterValue}>
                        {children || 0}
                      </span>
                      <button
                        className={styles.counterBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setChildren(Math.min(5, children + 1));
                        }}
                        disabled={children >= 5}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className={styles.priceBreakdown}>
              <div className={styles.breakdownRow}>
                <span>
                  ₹
                  {property
                    ? (property.price_per_night || 0).toLocaleString("en-IN")
                    : "0"}{" "}
                  × {priceBreakdown.nights || 0} nights
                </span>
                <span>
                  ₹{(priceBreakdown.base_total || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {priceBreakdown.long_stay_discount &&
                priceBreakdown.long_stay_discount.amount && (
                  <div
                    className={styles.breakdownRow}
                    style={{ color: "#10b981" }}
                  >
                    <span>
                      {priceBreakdown.long_stay_discount.type || "Long-stay"}{" "}
                      discount
                    </span>
                    <span>
                      -₹
                      {(
                        priceBreakdown.long_stay_discount.amount || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

              {priceBreakdown.corporate_discount &&
                priceBreakdown.corporate_discount.amount &&
                showCorporateFeatures && (
                  <div
                    className={styles.breakdownRow}
                    style={{ color: "#2FA4A9" }}
                  >
                    <span>Corporate discount</span>
                    <span>
                      -₹
                      {(
                        priceBreakdown.corporate_discount.amount || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

              <div className={styles.breakdownRow}>
                <span>GST (18%)</span>
                <span>
                  ₹{(priceBreakdown.gst_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className={styles.breakdownTotal}>
                <span>Total</span>
                <span>
                  ₹{(priceBreakdown.total_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={!checkIn || !checkOut || calculatingPrice}
            className={styles.reserveButton}
          >
            {calculatingPrice ? "Calculating..." : "Reserve Now"}
          </button>

          <p className={styles.disclaimer}>You wont be charged yet</p>
        </div>
      </div>
      {/* Mobile Floating Booking Bar */}
      <div className={styles.mobileBookingFloat}>
        <div className={styles.mobileBookingContent}>
          <div className={styles.mobileBookingPrice}>
            {checkIn && checkOut ? (
              <>
                <div className={styles.mobilePriceAmount}>
                  {Math.ceil(
                    (checkOut.getTime() - checkIn.getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  nights · ₹
                  {priceBreakdown
                    ? (priceBreakdown.total_amount || 0).toLocaleString("en-IN")
                    : (
                        (property.price_per_night || 0) *
                        Math.ceil(
                          (checkOut.getTime() - checkIn.getTime()) /
                            (1000 * 60 * 60 * 24),
                        )
                      ).toLocaleString("en-IN")}
                </div>
                <div className={styles.mobilePriceLabel}>
                  {checkIn.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  –{" "}
                  {checkOut.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </>
            ) : (
              <>
                <div className={styles.mobilePriceAmount}>
                  ₹{(property.price_per_night || 0).toLocaleString("en-IN")}
                </div>
                <div className={styles.mobilePriceLabel}>per night</div>
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (checkIn && checkOut) {
                handleReserve();
              } else {
                setShowMobileSheet(true);
              }
            }}
            className={styles.mobileReserveBtn}
          >
            {checkIn && checkOut ? "Reserve Now" : "Select Dates"}
          </button>
        </div>
      </div>
      {/* Mobile booking bottom sheet */}
      <MobileBookingSheet
        isOpen={showMobileSheet}
        onClose={() => setShowMobileSheet(false)}
        onConfirm={() => {
          setShowMobileSheet(false);
          if (checkIn && checkOut) handleReserve();
        }}
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        adults={adults}
        childCount={children}
        onAdultsChange={setAdults}
        onChildrenChange={setChildren}
        maxGuests={property?.max_guests || property?.max_occupancy || 10}
        propertyId={property?.id}
        pricePerNight={property?.price_per_night ?? 0}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default function ServiceApartmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
            <p>Loading service apartment...</p>
          </div>
        </div>
      }
    >
      <ServiceApartmentDetailContent />
    </Suspense>
  );
}
