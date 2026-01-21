"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios, { AxiosError } from "axios";
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
} from "react-icons/fi";
import { MdOutlineElevator } from "react-icons/md";
import { useCorporateUser } from "@/hooks/useCorporateUser";
import { useBooking } from "@/contexts/BookingContext";
import { formatDateForAPI } from "@/lib/utils";
import ImageGallery from "@/components/properties/ImageGallery";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { useAuthModals } from "@/contexts/AuthModalContext";

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
  bedrooms: number;
  bathrooms?: number;
  max_guests?: number;
  max_occupancy?: number;
  base_occupancy?: number;
  price_per_night: number;
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
  // Features returned as array from backend
  features?: string[];
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

export default function ServiceApartmentDetailPage() {
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
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/wishlist/check/${params.id}`,
        );
        if (response.data.success) {
          setIsSaved(response.data.data.isSaved || false);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    checkWishlist();
  }, [params.id]);

  useEffect(() => {
    fetchProperty();

    // Restore dates from URL if present
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");

    if (checkInParam) setCheckIn(new Date(checkInParam));
    if (checkOutParam) setCheckOut(new Date(checkOutParam));
    if (adultsParam) setAdults(parseInt(adultsParam));
    if (childrenParam) setChildren(parseInt(childrenParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchProperty = async () => {
    try {
      console.log("[Fetch Property] Fetching property with ID:", params.id);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/service-apartments`,
      );

      console.log("[Fetch Property] Response received:", {
        success: response.data.success,
        propertyCount: response.data.data?.properties?.length || 0,
      });

      if (response.data.success) {
        const properties = response.data.data.properties;
        console.log(
          "[Fetch Property] Available property IDs:",
          properties.map((p: Property) => p.id),
        );

        const found = properties.find((p: Property) => p.id === params.id);

        if (found) {
          console.log("[Fetch Property] Property found:", {
            id: found.id,
            title: found.title,
            price_per_night: found.price_per_night,
          });
          // Parse features array into boolean flags
          const parsedProperty = parseFeatures(found);
          setProperty(parsedProperty);
        } else {
          console.error(
            "[Fetch Property] Property not found with ID:",
            params.id,
          );
          console.log("[Fetch Property] Trying to match by comparing:", {
            searchId: params.id,
            availableIds: properties.map((p: Property) => ({
              id: p.id,
              matches: p.id === params.id,
            })),
          });
        }
      }
    } catch (error) {
      console.error("[Fetch Property] Error fetching property:", error);
    } finally {
      setLoading(false);
    }
  };

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

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/service-apartments/calculate-price`,
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
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/wishlist/${property!.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsSaved(false);
        toast.success("Removed from wishlist", 3000);
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/wishlist`,
          { property_id: property!.id },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsSaved(true);
        toast.success("Added to wishlist", 3000);
      }
    } catch (_error) {
      console.error("Error toggling wishlist:", _error);
      toast.error("Failed to update wishlist. Please try again.", 5000);
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

    const baseAmount = property!.price_per_night * nights;
    const gstAmount = baseAmount * 0.18;
    const totalAmount = baseAmount + gstAmount;

    // Use booking context to set booking data
    setBookingData({
      propertyId: property!.id,
      propertyType: "service-apartment", // Track property type for back navigation
      checkIn: formatDateForAPI(checkIn),
      checkOut: formatDateForAPI(checkOut),
      adults,
      children,
      infants: 0,
      propertyName: property!.title,
      propertyLocation: `${property!.city}, ${property!.state}`,
      propertyImage: property!.photos[0] || "/placeholder-property.jpg",
      pricePerNight: property!.price_per_night,
      nights,
      baseAmount,
      extraGuestCharges: 0,
      extraChildrenCharges: 0,
      gstAmount,
      totalAmount,
      minGuests: 1,
      maxGuests: property!.max_guests || property!.max_occupancy || 4,
      minChildren: 0,
      maxChildren: 2,
      extraGuestCharge: 0,
      extraChildCharge: 0,
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
              <p className={styles.propertyLocationHeader}>
                <FiMapPin />
                <span>
                  {property.city}, {property.state}
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
        images={property.photos}
        title={property.title}
        maxThumbnails={4}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Property Info */}
        <div className={styles.propertyInfo}>
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
                    {property.long_term_discount_percent ||
                      property.long_term_discount_percentage ||
                      35}
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
              {property.amenities?.map((amenity, index) => (
                <div key={index} className={styles.amenity}>
                  <FiWifi />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stay Requirements */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Booking Information</h2>
              <div className={styles.sectionDivider}></div>
            </div>
            <div className={styles.requirements}>
              <div className={styles.requirement}>
                <FiClock />
                <div>
                  <strong>Minimum Stay</strong>
                  <p>
                    {property.min_stay_days || property.min_stay_nights || 1}{" "}
                    nights
                  </p>
                </div>
              </div>
              <div className={styles.requirement}>
                <FiCalendar />
                <div>
                  <strong>Maximum Stay</strong>
                  <p>
                    {property.max_stay_days || property.max_stay_nights || 365}{" "}
                    nights
                  </p>
                </div>
              </div>
              <div className={styles.requirement}>
                <FiUsers />
                <div>
                  <strong>Base Occupancy</strong>
                  <p>{property.base_occupancy || 2} guests included</p>
                </div>
              </div>
            </div>
          </div>

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
                  <span className={styles.tierDiscount}>15% OFF</span>
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
        </div>

        {/* Booking Card */}
        <div className={styles.bookingCard}>
          <div className={styles.priceHeader}>
            <div>
              <span className={styles.price}>
                ₹{(property.price_per_night || 0).toLocaleString("en-IN")}
              </span>
              <span className={styles.perNight}>/ night</span>
            </div>
          </div>

          {/* Date Selection */}
          <div className={styles.dateSelectionSection}>
            <div className={styles.guestsRow}>
              <div className={styles.formGroup}>
                <label>Check-in</label>
                <DatePicker
                  selected={checkIn}
                  onChange={(date: Date | null) => {
                    setCheckIn(date);
                    // Clear check-out if it violates minimum stay
                    if (date && checkOut) {
                      const minStay =
                        property.min_stay_days || property.min_stay_nights || 1;
                      const nights = Math.ceil(
                        (checkOut.getTime() - date.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      if (nights < minStay) {
                        setCheckOut(null);
                        // Show toast when clearing invalid check-out
                        toast.info(
                          `This property requires a minimum stay of ${minStay} nights. Please select a longer duration.`,
                          5000,
                        );
                      }
                    }
                    // Reset toast flag when check-in changes
                    setHasShownInvalidToast(false);
                  }}
                  selectsStart
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={new Date()}
                  placeholderText="Select check-in"
                  className={styles.input}
                  dateFormat="MMM d, yyyy"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-out</label>
                <DatePicker
                  selected={checkOut}
                  onChange={(date: Date | null) => setCheckOut(date)}
                  selectsEnd
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={
                    checkIn
                      ? new Date(
                          checkIn.getTime() +
                            (property.min_stay_days ||
                              property.min_stay_nights ||
                              1) *
                              24 *
                              60 *
                              60 *
                              1000,
                        )
                      : new Date()
                  }
                  disabled={!checkIn}
                  placeholderText={
                    checkIn ? "Select check-out" : "Select check-in first"
                  }
                  className={styles.input}
                  dateFormat="MMM d, yyyy"
                  filterDate={(date) => {
                    if (!checkIn) return true;
                    const minStay =
                      property.min_stay_days || property.min_stay_nights || 1;
                    const nights = Math.ceil(
                      (date.getTime() - checkIn.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return nights >= minStay;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Guest Selection */}
          <div className={styles.guestsRow}>
            <div className={styles.formGroup}>
              <label>Adults</label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value))}
                className={styles.select}
              >
                {[
                  ...Array(property.max_guests || property.max_occupancy || 4),
                ].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Children</label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value))}
                className={styles.select}
              >
                {[...Array(5)].map((_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className={styles.priceBreakdown}>
              <div className={styles.breakdownRow}>
                <span>
                  ₹{(property.price_per_night || 0).toLocaleString("en-IN")} ×{" "}
                  {priceBreakdown.nights || 0} nights
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
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}
