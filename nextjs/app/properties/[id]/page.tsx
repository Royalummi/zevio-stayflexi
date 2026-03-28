"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import { formatDateForAPI } from "@/lib/utils";
import type { Property } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModals } from "@/contexts/AuthModalContext";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import {
  FiArrowLeft,
  FiMapPin,
  FiUsers,
  FiStar,
  FiCalendar,
  FiCheck,
  FiWifi,
  FiTv,
  FiCoffee,
  FiWind,
  FiHome,
  FiShare2,
  FiHeart,
  FiClock,
  FiX,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiPhone,
  FiPercent,
  FiDroplet,
  FiZap,
  FiMoon,
  FiMusic,
  FiUserMinus,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import propertyStyles from "./property-detail.module.css";
import luxuryStyles from "./luxury-property.module.css";
import PropertyGallery from "./PropertyGallery";
import DateRangeSelector from "@/components/DateRangeSelector";
import { getImageUrl } from "@/lib/imageUtils";
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
  if (lower.includes("gym") || lower.includes("fitness"))
    return <FiCheckCircle />;
  if (
    lower.includes("park") ||
    lower.includes("car") ||
    lower.includes("vehicle")
  )
    return <FiHome />;
  return <FiCheck />;
};

function PropertyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const toast = useToast();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModals();
  const { setBookingData } = useBooking();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  // Modern dropdown states for guests only
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  // Mobile bottom sheet — opens when user taps "Select Dates" on mobile
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  // Pre-fill from SearchBar URL params
  const [adults, setAdults] = useState(() => {
    const adultsParam = searchParams.get("adults");
    const parsed = adultsParam ? parseInt(adultsParam, 10) : NaN;
    return !isNaN(parsed) ? parsed : 2;
  });
  const [children, setChildren] = useState(() => {
    const childrenParam = searchParams.get("children");
    const parsed = childrenParam ? parseInt(childrenParam, 10) : NaN;
    return !isNaN(parsed) ? parsed : 0;
  });

  // SESSION 32: Restore dates from URL params when navigating back from booking-review
  useEffect(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");

    if (checkInParam && checkOutParam) {
      const checkInDate = new Date(checkInParam);
      const checkOutDate = new Date(checkOutParam);

      // Validate dates are valid
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
        setCheckIn(checkInDate);
        setCheckOut(checkOutDate);
      }
    }
  }, [searchParams]);
  // Calendar pricing map: keyed by "YYYY-MM-DD" → custom nightly price
  const [calendarPriceMap, setCalendarPriceMap] = useState<
    Record<string, number>
  >({});

  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({
    baseAmount: 0,
    extraGuestCharges: 0,
    extraChildrenCharges: 0,
    gstAmount: 0,
    totalAmount: 0,
  });
  const [nights, setNights] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // SESSION 30: Pending Booking Management
  const [pendingBooking, setPendingBooking] = useState<{
    id: string;
    property_title: string;
    property_price?: number;
    check_in: string;
    check_out: string;
    nights: number;
    guest_count: number;
    children_count: number;
    infants_count?: number;
    total_amount: number;
    expires_at: string;
  } | null>(null);

  // Property pricing details
  const [propertyPricing, setPropertyPricing] = useState({
    min_guests: 2,
    max_guests: 10,
    extra_guest_charge: 0,
    min_children: 0,
    max_children: 5,
    extra_child_charge: 0,
  });

  // Check if property is in wishlist on mount
  useEffect(() => {
    let isMounted = true;

    const checkWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token || !isMounted) return;

      try {
        const response = await api.get(`/wishlist/check/${propertyId}`);
        if (isMounted) {
          setIsSaved(response.data.data.isWishlisted || false);
        }
      } catch (error: unknown) {
        if (
          isMounted &&
          (error as { response?: { status?: number } })?.response?.status !==
            429
        ) {
          console.error("Error checking wishlist:", error);
        }
        // If rate limited, don't retry
      }
    };

    // Debounce the check to avoid rapid calls
    const timeoutId = setTimeout(() => {
      checkWishlist();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [propertyId]);

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

    const fetchProperty = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        const response = await api.get(`/public/property/${propertyId}`, {
          signal: abortController.signal,
        });

        if (!isMounted) return;

        const data = response.data.data;

        // Map backend fields to frontend Property interface
        const mappedProperty: Property = {
          id: data.id,
          name: data.title || data.name,
          description: data.description,
          address: data.address,
          area: data.area,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          maps_location: data.maps_location,
          price_per_night: Number(data.price_per_night),
          max_guests: data.max_guests,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          amenities: Array.isArray(data.amenities)
            ? data.amenities
            : data.amenities
              ? typeof data.amenities === "string"
                ? JSON.parse(data.amenities)
                : []
              : [],
          photos: (() => {
            // Prefer property_images table (R2 uploads) over legacy photos column
            if (Array.isArray(data.images) && data.images.length > 0) {
              return data.images.map(
                (img: { image_url: string }) => img.image_url,
              );
            }
            return Array.isArray(data.photos)
              ? data.photos
              : data.photos
                ? typeof data.photos === "string"
                  ? JSON.parse(data.photos)
                  : []
                : [];
          })(),
          rating: data.rating || 0,
          reviews_count: data.reviews_count || 0,
          status: data.status,
          // Phase 1 fields
          house_rules: data.house_rules,
          cancellation_policy: data.cancellation_policy,
          emergency_contacts: data.emergency_contacts,
          safety_information: data.safety_information,
          local_area_info: data.local_area_info,
          check_in_time: data.check_in_time,
          check_out_time: data.check_out_time,
          // Phase 3 fields
          property_type: data.property_type,
          vendor_name: data.vendor_name,
          employee_name: data.employee_name,
          // Phase 4 fields
          min_stay_days: data.min_stay_days,
          max_stay_days: data.max_stay_days,
          same_day_booking_allowed: data.same_day_booking_allowed,
          max_booking_days: data.max_booking_days,
          is_recommended: data.is_recommended,
          recommended_priority: data.recommended_priority,
          // Additional pricing fields
          gst_percentage: data.gst_percentage,
          weekly_discount_percent: data.weekly_discount_percent,
          monthly_discount_percent: data.monthly_discount_percent,
          quarterly_discount_percent: data.quarterly_discount_percent,
          long_term_discount_percent: data.long_term_discount_percent,
          maintenance_charges: data.maintenance_charges,
          allow_corporate_booking: data.allow_corporate_booking,
          corporate_discount_percent: data.corporate_discount_percent,
          notice_period_days: data.notice_period_days,
          features_list: data.features_list,
        };

        setProperty(mappedProperty);

        // Store pricing details for dynamic calculation
        setPropertyPricing({
          min_guests: Number(data.min_guests) || 2,
          max_guests: Number(data.max_guests) || 10,
          extra_guest_charge: Number(data.extra_guest_charge) || 0,
          min_children: Number(data.min_children) || 0,
          max_children: Number(data.max_children) || 5,
          extra_child_charge: Number(data.extra_child_charge) || 0,
        });
      } catch (error: unknown) {
        if (
          isMounted &&
          (error as Error)?.name !== "AbortError" &&
          (error as { response?: { status?: number } })?.response?.status !==
            429
        ) {
          console.error("Error fetching property:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [propertyId]);

  // Fetch calendar pricing for current + next year once the property ID is known
  useEffect(() => {
    if (!propertyId) return;
    const fetchCalendarPricing = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const map: Record<string, number> = {};
        await Promise.all(
          [currentYear, currentYear + 1].map(async (yr) => {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}/calendar-pricing?year=${yr}`,
            );
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              (
                json.data as { price_date: string; price: string | number }[]
              ).forEach((e) => {
                map[e.price_date] = Number(e.price);
              });
            }
          }),
        );
        setCalendarPriceMap(map);
      } catch {
        // Non-critical — will fall back to base price_per_night
      }
    };
    fetchCalendarPricing();
  }, [propertyId]);

  // Calculate pricing when dates or guests change
  useEffect(() => {
    if (checkIn && checkOut && property) {
      const start = checkIn;
      const end = checkOut;
      const calculatedNights = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (calculatedNights > 0) {
        setNights(calculatedNights);

        // Sum per-night prices, using calendar custom prices where available
        const toKey = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        let baseAmount = 0;
        const cur = new Date(start);
        while (cur < end) {
          baseAmount +=
            calendarPriceMap[toKey(cur)] ?? Number(property.price_per_night);
          cur.setDate(cur.getDate() + 1);
        }

        // Calculate extra guest charges (only if exceeding min_guests)
        // Base price includes up to min_guests, extra charges apply above that
        const extraGuests = Math.max(0, adults - propertyPricing.min_guests);
        const extraGuestCharges =
          extraGuests * propertyPricing.extra_guest_charge * calculatedNights;

        // Calculate extra children charges (only if exceeding min_children)
        // Base price includes up to min_children, extra charges apply above that
        const extraChildren = Math.max(
          0,
          children - propertyPricing.min_children,
        );
        const extraChildrenCharges =
          extraChildren * propertyPricing.extra_child_charge * calculatedNights;

        // Subtotal before GST
        const subtotal = baseAmount + extraGuestCharges + extraChildrenCharges;

        // Calculate GST (use dynamic percentage from property or default to 18%)
        const gstPercentage = property.gst_percentage
          ? parseFloat(property.gst_percentage.toString()) / 100
          : 0.18;
        const gstAmount = subtotal * gstPercentage;

        // Total amount
        const totalAmount = subtotal + gstAmount;

        setPriceBreakdown({
          baseAmount,
          extraGuestCharges,
          extraChildrenCharges,
          gstAmount,
          totalAmount,
        });

        setTotalPrice(totalAmount);
      } else {
        setNights(0);
        setTotalPrice(0);
        setPriceBreakdown({
          baseAmount: 0,
          extraGuestCharges: 0,
          extraChildrenCharges: 0,
          gstAmount: 0,
          totalAmount: 0,
        });
      }
    } else {
      setNights(0);
      setTotalPrice(0);
      setPriceBreakdown({
        baseAmount: 0,
        extraGuestCharges: 0,
        extraChildrenCharges: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
    }
  }, [
    checkIn,
    checkOut,
    property,
    adults,
    children,
    propertyPricing,
    calendarPriceMap,
  ]);

  const handleBooking = async () => {
    // Validation
    if (!checkIn || !checkOut) {
      toast.warning("Please select check-in and check-out dates");
      return;
    }

    const maxGuestsAllowed =
      propertyPricing.max_guests || property?.max_guests || 10;
    if (adults + children > maxGuestsAllowed) {
      toast.warning(`Maximum ${maxGuestsAllowed} guests allowed`);
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.info("Please login to continue booking");
      openLoginModal();
      return;
    }

    // Populate booking context
    if (property) {
      setBookingData({
        propertyId: property.id,
        propertyType: "villa", // Track property type for back navigation
        propertyTypeId: "pt-001",
        propertyName: property.name,
        propertyLocation: `${property.city}, ${property.state}`,
        propertyImage:
          getImageUrl(property.photos[0]) ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='32' fill='%23999'%3ENo Image Available%3C/text%3E%3C/svg%3E",
        checkIn: formatDateForAPI(checkIn),
        checkOut: formatDateForAPI(checkOut),
        adults: adults,
        children: children,
        infants: 0,
        nights: nights,
        baseAmount: priceBreakdown.baseAmount,
        extraGuestCharges: priceBreakdown.extraGuestCharges,
        extraChildrenCharges: priceBreakdown.extraChildrenCharges,
        gstAmount: priceBreakdown.gstAmount,
        totalAmount: priceBreakdown.totalAmount,
        pricePerNight: Number(property.price_per_night),
        minGuests: propertyPricing.min_guests,
        maxGuests: propertyPricing.max_guests,
        minChildren: propertyPricing.min_children,
        maxChildren: propertyPricing.max_children,
        extraGuestCharge: Number(propertyPricing.extra_guest_charge),
        extraChildCharge: Number(propertyPricing.extra_child_charge),
      });

      // SESSION 32: Navigate with URL params to preserve data (Airbnb pattern)
      const queryParams = new URLSearchParams({
        propertyId: property.id,
        checkIn: formatDateForAPI(checkIn),
        checkOut: formatDateForAPI(checkOut),
        adults: adults.toString(),
        children: children.toString(),
      });
      router.push(`/booking-review?${queryParams.toString()}`);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.info("Please login to save properties to your wishlist");
      openLoginModal();
      return;
    }

    try {
      if (isSaved) {
        // Remove from wishlist
        await api.delete(`/wishlist/${propertyId}`);
        setIsSaved(false);
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        await api.post("/wishlist", { property_id: params.id });
        setIsSaved(true);
        toast.success("Added to wishlist");
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
        console.error("Wishlist error:", error);
        const errorMessage =
          message ||
          (error instanceof Error ? error.message : null) ||
          "Failed to update wishlist";
        toast.error(errorMessage);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: property?.name,
          text: `Check out this amazing property: ${property?.name}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // SESSION 30/32/33: Inline Pending Booking Handlers
  const handleContinuePendingBooking = () => {
    if (!pendingBooking) return;
    // SESSION 32: Include dates/guests in URL for data restoration
    const queryParams = new URLSearchParams({
      bookingId: pendingBooking.id,
      checkIn: pendingBooking.check_in,
      checkOut: pendingBooking.check_out,
      adults: (
        pendingBooking.guest_count - (pendingBooking.children_count || 0)
      ).toString(),
      children: (pendingBooking.children_count || 0).toString(),
    });
    router.push(`/booking-review?${queryParams.toString()}`);
  };

  const handleCancelPendingBooking = async () => {
    if (!pendingBooking) return;
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this pending booking? You can create a new booking after cancellation.",
    );
    if (!confirmCancel) return;

    try {
      await api.delete(`/bookings/${pendingBooking.id}/cancel-pending`);
      toast.success("Pending booking cancelled successfully");
      setPendingBooking(null);
      // User can now create a new booking
    } catch (error: unknown) {
      console.error("Cancel booking error:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to cancel booking",
      );
    }
  };

  // SESSION 33: Calculate countdown timer for pending booking
  const calculateTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className={propertyStyles.loadingPage}>
        <div className={propertyStyles.loadingSpinnerDetail}></div>
        <p className={propertyStyles.loadingTextDetail}>
          Loading property details...
        </p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={propertyStyles.notFoundPage}>
        <div className={propertyStyles.notFoundCard}>
          <div className={propertyStyles.notFoundIcon}>
            <FiHome />
          </div>
          <h2 className={propertyStyles.notFoundTitle}>Property Not Found</h2>
          <p className={propertyStyles.notFoundMessage}>
            The property you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className={propertyStyles.notFoundBtn}
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  // Professional placeholder images from Unsplash
  const defaultPhotos = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop",
  ];

  // Normalize photos to array (handle both string and array types)
  const photosArray = Array.isArray(property.photos)
    ? property.photos
    : property.photos
      ? [property.photos]
      : [];

  const photos = (photosArray.length > 0 ? photosArray : defaultPhotos).map(
    getImageUrl,
  );

  // Normalize amenities to array (handle both string and array types)
  const amenities = Array.isArray(property.amenities)
    ? property.amenities
    : property.amenities
      ? [property.amenities]
      : [];

  // Combine features with amenities for display
  const allFeatures = [
    ...amenities,
    ...(property.features_list
      ? property.features_list.split(", ").filter((f) => f.trim())
      : []),
  ];

  return (
    <div className={propertyStyles.propertyDetailPage}>
      {/* Navigation Bar */}
      <div className={propertyStyles.propertyNav}>
        <div className={propertyStyles.navContainer}>
          <div className={propertyStyles.navContent}>
            {/* Left: Property Title & Location */}
            <div className={propertyStyles.propertyTitleNav}>
              <h1 className={propertyStyles.propertyNameNav}>
                {property.name}
              </h1>
              <div
                className={`${propertyStyles.propertyLocationNav} ${
                  property.maps_location ? propertyStyles.locationClickable : ""
                }`}
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
                  {property.area ? (
                    <>
                      {property.area}, {property.city}
                    </>
                  ) : (
                    <>
                      {property.city}, {property.state}
                    </>
                  )}
                </span>
                {property.maps_location && (
                  <span className={propertyStyles.mapLinkText}>
                    • View on Map
                  </span>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className={propertyStyles.navActions}>
              <button
                onClick={handleShare}
                className={propertyStyles.actionBtn}
                aria-label="Share property"
              >
                <FiShare2 />
                <span>Share</span>
              </button>
              <button
                onClick={handleSave}
                className={`${propertyStyles.actionBtn} ${
                  isSaved ? propertyStyles.active : ""
                }`}
                aria-label={
                  isSaved ? "Remove from wishlist" : "Save to wishlist"
                }
              >
                <FiHeart />
                <span>Wishlist</span>
              </button>
              <button
                onClick={() => router.push("/properties")}
                className={propertyStyles.backBtn}
              >
                <FiArrowLeft />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={propertyStyles.detailContainer}>
        {/* Luxury Two-Column Layout: Gallery LEFT + Property Details | Header + Booking RIGHT */}
        <div className={luxuryStyles.luxuryVillaLayout}>
          {/* LEFT SIDE - Photo Gallery + Property Details */}
          <div className={luxuryStyles.gallerySection}>
            {/* New Professional Gallery Component */}
            <PropertyGallery photos={photos} propertyName={property.name} />

            {/* Property Details - Inside LEFT Column */}
            <div className={luxuryStyles.propertyDetailsLeft}>
              {/* Phase 4: Featured Property Badge */}
              <FeaturedPropertyBadge
                isRecommended={property.is_recommended}
                recommendedPriority={property.recommended_priority}
              />

              {/* Property Overview */}
              <section className={luxuryStyles.overviewSectionLuxury}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>
                  Property Overview
                </h2>
                <div className={luxuryStyles.statsGridLuxury}>
                  <div className={luxuryStyles.statCardLuxury}>
                    <div className={luxuryStyles.statIconLuxury}>
                      <FiUsers />
                    </div>
                    <div className={luxuryStyles.statContentLuxury}>
                      <div className={luxuryStyles.statValueLuxury}>
                        {property.max_guests}
                      </div>
                      <div className={luxuryStyles.statLabelLuxury}>Guests</div>
                    </div>
                  </div>
                  <div className={luxuryStyles.statCardLuxury}>
                    <div className={luxuryStyles.statIconLuxury}>
                      <IoBed />
                    </div>
                    <div className={luxuryStyles.statContentLuxury}>
                      <div className={luxuryStyles.statValueLuxury}>
                        {property.bedrooms}
                      </div>
                      <div className={luxuryStyles.statLabelLuxury}>
                        Bedrooms
                      </div>
                    </div>
                  </div>
                  <div className={luxuryStyles.statCardLuxury}>
                    <div className={luxuryStyles.statIconLuxury}>
                      <FiHome />
                    </div>
                    <div className={luxuryStyles.statContentLuxury}>
                      <div className={luxuryStyles.statValueLuxury}>
                        {property.bathrooms}
                      </div>
                      <div className={luxuryStyles.statLabelLuxury}>
                        Bathrooms
                      </div>
                    </div>
                  </div>
                  <div className={luxuryStyles.statCardLuxury}>
                    <div className={luxuryStyles.statIconLuxury}>
                      <FiStar />
                    </div>
                    <div className={luxuryStyles.statContentLuxury}>
                      <div className={luxuryStyles.statValueLuxury}>
                        {Number(property.rating).toFixed(1)}
                      </div>
                      <div className={luxuryStyles.statLabelLuxury}>Rating</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* About This Place */}
              <section className={luxuryStyles.aboutSectionLuxury}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>
                  About This Place
                </h2>
                <p className={luxuryStyles.descriptionTextLuxury}>
                  {property.description}
                </p>
              </section>

              {/* Amenities & Features */}
              {allFeatures.length > 0 && (
                <section className={luxuryStyles.amenitiesSectionLuxury}>
                  <h2 className={luxuryStyles.sectionTitleLuxury}>
                    Amenities & Features
                  </h2>
                  <div className={luxuryStyles.amenitiesGridLuxury}>
                    {allFeatures.map((amenity: string, index: number) => (
                      <div
                        key={index}
                        className={luxuryStyles.amenityItemLuxury}
                      >
                        <div className={luxuryStyles.amenityIconLuxury}>
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className={luxuryStyles.amenityTextLuxury}>
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Comprehensive Property Information - Unified UI */}
              <section className={luxuryStyles.bookingInfoSection}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>
                  Property Information
                </h2>
                <div className={luxuryStyles.infoList}>
                  {/* Check-in & Check-out Times */}
                  {(property.check_in_time || property.check_out_time) && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiClock />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Check-in & Check-out
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          {property.check_in_time || "3:00 PM"} -{" "}
                          {property.check_out_time || "11:00 AM"}
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          Standard check-in and check-out times
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Minimum & Maximum Stay */}
                  {(property.min_stay_days || property.max_stay_days) && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiCalendar />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Stay Requirements
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          {property.min_stay_days &&
                            `Min: ${property.min_stay_days} ${property.min_stay_days === 1 ? "night" : "nights"}`}
                          {property.min_stay_days &&
                            property.max_stay_days &&
                            " • "}
                          {property.max_stay_days &&
                            `Max: ${property.max_stay_days} ${property.max_stay_days === 1 ? "night" : "nights"}`}
                        </div>
                        {Boolean(property.same_day_booking_allowed) && (
                          <div className={luxuryStyles.infoNote}>
                            ✓ Same-day booking available
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Maintenance Charges */}
                  {property.maintenance_charges &&
                    parseFloat(property.maintenance_charges.toString()) > 0 && (
                      <div className={luxuryStyles.infoItem}>
                        <div className={luxuryStyles.infoIcon}>
                          <FiHome />
                        </div>
                        <div className={luxuryStyles.infoContent}>
                          <div className={luxuryStyles.infoLabel}>
                            Maintenance Fee
                          </div>
                          <div className={luxuryStyles.infoValue}>
                            ₹
                            {(
                              property.maintenance_charges || 0
                            ).toLocaleString()}
                          </div>
                          <div className={luxuryStyles.infoNote}>
                            One-time maintenance charge
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Cancellation Policy */}
                  {property.notice_period_days && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiAlertCircle />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Cancellation Policy
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          {property.notice_period_days}{" "}
                          {property.notice_period_days === 1 ? "day" : "days"}{" "}
                          notice required
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          Free cancellation before notice period
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emergency Contacts */}
                  {property.emergency_contacts && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiPhone />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Emergency Contact
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          24/7 Support Available
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          Contact details provided after booking
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Corporate Bookings */}
                  {Boolean(property.allow_corporate_booking) && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiCheckCircle />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Corporate Bookings
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          Available
                          {property.corporate_discount_percent &&
                            parseFloat(
                              property.corporate_discount_percent.toString(),
                            ) > 0 && (
                              <span className={luxuryStyles.corporateDiscount}>
                                {" "}
                                (
                                {parseFloat(
                                  property.corporate_discount_percent.toString(),
                                )}
                                % discount)
                              </span>
                            )}
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          Special rates for corporate clients
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Children Policy */}
                  {propertyPricing.max_children !== undefined &&
                    propertyPricing.max_children > 0 && (
                      <div className={luxuryStyles.infoItem}>
                        <div className={luxuryStyles.infoIcon}>
                          <FiUsers />
                        </div>
                        <div className={luxuryStyles.infoContent}>
                          <div className={luxuryStyles.infoLabel}>
                            Children Policy
                          </div>
                          <div className={luxuryStyles.infoValue}>
                            {propertyPricing.min_children || 0} -{" "}
                            {propertyPricing.max_children} children allowed
                          </div>
                          <div className={luxuryStyles.infoNote}>
                            {propertyPricing.extra_child_charge &&
                            propertyPricing.extra_child_charge > 0
                              ? `Extra charge: ₹${propertyPricing.extra_child_charge.toLocaleString()} per child per night`
                              : "No additional charges for children"}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* GST Information */}
                  {property.gst_percentage && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiPercent />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          GST Included
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          {parseFloat(property.gst_percentage.toString())}% GST
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          All prices include applicable taxes
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Maximum Booking Period */}
                  {property.max_booking_days && (
                    <div className={luxuryStyles.infoItem}>
                      <div className={luxuryStyles.infoIcon}>
                        <FiCalendar />
                      </div>
                      <div className={luxuryStyles.infoContent}>
                        <div className={luxuryStyles.infoLabel}>
                          Maximum Booking Period
                        </div>
                        <div className={luxuryStyles.infoValue}>
                          {property.max_booking_days}{" "}
                          {property.max_booking_days === 1 ? "day" : "days"}{" "}
                          maximum
                        </div>
                        <div className={luxuryStyles.infoNote}>
                          Maximum booking duration allowed
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Local Area Information - Accordion */}
              {property.local_area_info && (
                <details className={luxuryStyles.accordionCard}>
                  <summary className={luxuryStyles.accordionHeader}>
                    <span className={luxuryStyles.accordionHeaderInner}>
                      <FiMapPin />
                      Local Area & Nearby Facilities
                    </span>
                    <span className={luxuryStyles.accordionChevron}>
                      &#8250;
                    </span>
                  </summary>
                  <div
                    className={luxuryStyles.descriptionTextLuxury}
                    dangerouslySetInnerHTML={{
                      __html: property.local_area_info,
                    }}
                  />
                </details>
              )}

              {/* Safety & Security - Accordion */}
              {property.safety_information && (
                <details className={luxuryStyles.accordionCard}>
                  <summary className={luxuryStyles.accordionHeader}>
                    <span className={luxuryStyles.accordionHeaderInner}>
                      <FiShield />
                      Safety & Security Measures
                    </span>
                    <span className={luxuryStyles.accordionChevron}>
                      &#8250;
                    </span>
                  </summary>
                  <div
                    className={luxuryStyles.descriptionTextLuxury}
                    dangerouslySetInnerHTML={{
                      __html: property.safety_information,
                    }}
                  />
                </details>
              )}

              {/* Long-Stay Discount Tiers - Villa 3-slab */}
              {(property.discount_3_5_days ||
                property.discount_6_14_days ||
                property.discount_15_plus_days) && (
                <section className={luxuryStyles.discountTiersSection}>
                  <h2 className={luxuryStyles.sectionTitleLuxury}>
                    Duration Discounts
                  </h2>
                  <p className={luxuryStyles.discountSubtitle}>
                    Enjoy special rates for extended stays — the longer you
                    stay, the more you save!
                  </p>
                  <div className={luxuryStyles.discountGrid}>
                    {property.discount_3_5_days &&
                      parseFloat(property.discount_3_5_days.toString()) > 0 && (
                        <div className={luxuryStyles.discountCard}>
                          <div className={luxuryStyles.discountIcon}>
                            <FiCalendar />
                          </div>
                          <div className={luxuryStyles.discountContent}>
                            <div className={luxuryStyles.discountPercent}>
                              {parseFloat(
                                property.discount_3_5_days.toString(),
                              )}
                              % OFF
                            </div>
                            <div className={luxuryStyles.discountLabel}>
                              Short Stay
                            </div>
                            <div className={luxuryStyles.discountDuration}>
                              3–5 nights
                            </div>
                          </div>
                        </div>
                      )}
                    {property.discount_6_14_days &&
                      parseFloat(property.discount_6_14_days.toString()) >
                        0 && (
                        <div className={luxuryStyles.discountCard}>
                          <div className={luxuryStyles.discountIcon}>
                            <FiCalendar />
                          </div>
                          <div className={luxuryStyles.discountContent}>
                            <div className={luxuryStyles.discountPercent}>
                              {parseFloat(
                                property.discount_6_14_days.toString(),
                              )}
                              % OFF
                            </div>
                            <div className={luxuryStyles.discountLabel}>
                              Extended Stay
                            </div>
                            <div className={luxuryStyles.discountDuration}>
                              6–14 nights
                            </div>
                          </div>
                        </div>
                      )}
                    {property.discount_15_plus_days &&
                      parseFloat(property.discount_15_plus_days.toString()) >
                        0 && (
                        <div className={luxuryStyles.discountCard}>
                          <div className={luxuryStyles.discountIcon}>
                            <FiCalendar />
                          </div>
                          <div className={luxuryStyles.discountContent}>
                            <div className={luxuryStyles.discountPercent}>
                              {parseFloat(
                                property.discount_15_plus_days.toString(),
                              )}
                              % OFF
                            </div>
                            <div className={luxuryStyles.discountLabel}>
                              Long Stay
                            </div>
                            <div className={luxuryStyles.discountDuration}>
                              15+ nights
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </section>
              )}

              {/* House Rules */}
              {property.house_rules &&
                typeof property.house_rules === "object" && (
                  <section className={luxuryStyles.aboutSectionLuxury}>
                    <h2 className={luxuryStyles.sectionTitleLuxury}>
                      <FiShield /> House Rules
                    </h2>
                    <div className={luxuryStyles.houseRulesGrid}>
                      {(property.house_rules as Record<string, unknown>)
                        .no_smoking === true && (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleDeny}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiAlertCircle
                              className={luxuryStyles.ruleDenyIcon}
                            />
                          </span>
                          <span>No Smoking</span>
                        </div>
                      )}
                      {(property.house_rules as Record<string, unknown>)
                        .no_parties === true && (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleDeny}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiMusic className={luxuryStyles.ruleDenyIcon} />
                          </span>
                          <span>No Parties or Events</span>
                        </div>
                      )}
                      {(property.house_rules as Record<string, unknown>)
                        .no_outsiders === true && (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleDeny}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiUserMinus
                              className={luxuryStyles.ruleDenyIcon}
                            />
                          </span>
                          <span>No Outside Visitors</span>
                        </div>
                      )}
                      {(property.house_rules as Record<string, unknown>)
                        .pet_friendly === true ? (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleAllow}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiHeart className={luxuryStyles.ruleAllowIcon} />
                          </span>
                          <span>Pets Allowed</span>
                        </div>
                      ) : (property.house_rules as Record<string, unknown>)
                          .pet_friendly === false ? (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleDeny}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiX className={luxuryStyles.ruleDenyIcon} />
                          </span>
                          <span>No Pets</span>
                        </div>
                      ) : null}
                      {Boolean(
                        (property.house_rules as Record<string, unknown>)
                          .quiet_hours,
                      ) && (
                        <div
                          className={`${luxuryStyles.houseRuleItem} ${luxuryStyles.houseRuleInfo}`}
                        >
                          <span className={luxuryStyles.ruleIconBadge}>
                            <FiMoon className={luxuryStyles.ruleInfoIcon} />
                          </span>
                          <span>
                            Quiet Hours after{" "}
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
                        <ul className={luxuryStyles.additionalRulesList}>
                          {(
                            (property.house_rules as Record<string, unknown>)
                              .additional_rules as string[]
                          ).map((rule: string, i: number) => (
                            <li
                              key={i}
                              className={luxuryStyles.additionalRuleItem}
                            >
                              <FiAlertCircle
                                className={luxuryStyles.ruleInfoIcon}
                              />
                              {rule}
                            </li>
                          ))}
                        </ul>
                      )}
                  </section>
                )}

              {/* Cancellation Policy */}
              {(property.cancellation_policy ||
                property.notice_period_days) && (
                <section className={luxuryStyles.aboutSectionLuxury}>
                  <h2 className={luxuryStyles.sectionTitleLuxury}>
                    <FiAlertCircle /> Cancellation Policy
                  </h2>
                  {property.notice_period_days && (
                    <div className={luxuryStyles.cancelPolicySummary}>
                      <FiCheckCircle className={luxuryStyles.ruleAllowIcon} />
                      <span>
                        Free cancellation if cancelled{" "}
                        <strong>{property.notice_period_days}</strong>{" "}
                        {property.notice_period_days === 1 ? "day" : "days"}{" "}
                        before check-in
                      </span>
                    </div>
                  )}
                  {property.cancellation_policy &&
                    Array.isArray(
                      (property.cancellation_policy as Record<string, unknown>)
                        .tiers,
                    ) && (
                      <div className={luxuryStyles.cancelTiersList}>
                        {(
                          (
                            property.cancellation_policy as Record<
                              string,
                              unknown
                            >
                          ).tiers as Array<{
                            label: string;
                            days_before_checkin: number;
                            refund_percent: number;
                          }>
                        ).map((tier, i) => (
                          <div key={i} className={luxuryStyles.cancelTierItem}>
                            <div className={luxuryStyles.cancelTierLabel}>
                              {tier.label}
                            </div>
                            <div className={luxuryStyles.cancelTierDetails}>
                              <span className={luxuryStyles.cancelTierDays}>
                                {tier.days_before_checkin > 0
                                  ? `${tier.days_before_checkin}+ days before`
                                  : "At check-in"}
                              </span>
                              <span
                                className={`${luxuryStyles.cancelTierRefund} ${
                                  tier.refund_percent === 100
                                    ? luxuryStyles.refundFull
                                    : tier.refund_percent > 0
                                      ? luxuryStyles.refundPartial
                                      : luxuryStyles.refundNone
                                }`}
                              >
                                {tier.refund_percent}% Refund
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </section>
              )}

              {/* Location Section */}
              {(property.area || property.maps_location) && (
                <section className={luxuryStyles.locationSectionLuxury}>
                  <h2 className={luxuryStyles.sectionTitleLuxury}>
                    <FiMapPin /> Location
                  </h2>
                  <div className={luxuryStyles.locationCard}>
                    <div className={luxuryStyles.locationDetails}>
                      <div className={luxuryStyles.locationAddress}>
                        <strong>Address:</strong>
                        <p>
                          {property.area && <span>{property.area}, </span>}
                          {property.city}, {property.state}
                          {property.pincode && (
                            <span> - {property.pincode}</span>
                          )}
                        </p>
                      </div>
                      {property.maps_location && (
                        <button
                          onClick={() =>
                            window.open(property.maps_location, "_blank")
                          }
                          className={luxuryStyles.viewMapButton}
                        >
                          <FiMapPin />
                          <span>View on Google Maps</span>
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Host Information - Industry Standard with Dynamic Data */}
              <section className={luxuryStyles.hostSection}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>Hosted By</h2>
                <div className={luxuryStyles.hostCard}>
                  <div className={luxuryStyles.hostHeader}>
                    <div className={luxuryStyles.hostAvatar}>
                      <FiUser />
                    </div>
                    <div className={luxuryStyles.hostInfo}>
                      <h3 className={luxuryStyles.hostName}>
                        {property.vendor_name || "Zevio Villas"}
                      </h3>
                      <p className={luxuryStyles.hostJoined}>
                        {property.employee_name
                          ? `Managed by ${property.employee_name}`
                          : "Joined in 2024"}
                      </p>
                    </div>
                    {property.rating >= 4.8 && (
                      <div className={luxuryStyles.superhostBadge}>
                        <FiStar /> Superhost
                      </div>
                    )}
                  </div>
                  <div className={luxuryStyles.hostStats}>
                    <div className={luxuryStyles.hostStat}>
                      <FiStar className={luxuryStyles.statIconHost} />
                      <div>
                        <strong>{property.reviews_count}</strong> Reviews
                      </div>
                    </div>
                    <div className={luxuryStyles.hostStat}>
                      <FiShield className={luxuryStyles.statIconHost} />
                      <div>
                        <strong>Identity verified</strong>
                      </div>
                    </div>
                    <div className={luxuryStyles.hostStat}>
                      <FiCheck className={luxuryStyles.statIconHost} />
                      <div>
                        <strong>92%</strong> Response rate
                      </div>
                    </div>
                  </div>
                  <p className={luxuryStyles.hostDescription}>
                    {property.property_type || "Luxury Property"} managed by
                    professional hospitality experts. We specialize in premium
                    rentals across India&apos;s most beautiful destinations,
                    ensuring every stay is memorable with exceptional service.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT SIDE - Property Header + Booking Card (Sticky) */}
          <div id="booking" className={luxuryStyles.sidebarColumn}>
            <aside className={luxuryStyles.bookingSidebar}>
              {/* Booking Card */}
              <div className={luxuryStyles.bookingCard}>
                <div className={luxuryStyles.bookingCardContent}>
                  {/* SESSION 33: Pending Booking Banner */}
                  {pendingBooking && (
                    <div className={luxuryStyles.pendingBookingBanner}>
                      <div className={luxuryStyles.pendingBookingHeader}>
                        <div className={luxuryStyles.pendingBookingTitle}>
                          <FiClock size={20} />
                          <span>You have a pending booking</span>
                        </div>
                        {pendingBooking.expires_at && (
                          <div className={luxuryStyles.pendingBookingTimer}>
                            Expires in{" "}
                            {calculateTimeLeft(pendingBooking.expires_at)}
                          </div>
                        )}
                      </div>
                      <div className={luxuryStyles.pendingBookingDetails}>
                        <div className={luxuryStyles.pendingBookingRow}>
                          <FiCalendar size={16} />
                          <span>
                            {new Date(
                              pendingBooking.check_in,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(
                              pendingBooking.check_out,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {" · "}
                            {pendingBooking.nights}{" "}
                            {pendingBooking.nights === 1 ? "night" : "nights"}
                          </span>
                        </div>
                        <div className={luxuryStyles.pendingBookingRow}>
                          <FiUsers size={16} />
                          <span>
                            {pendingBooking.guest_count}{" "}
                            {pendingBooking.guest_count === 1
                              ? "Guest"
                              : "Guests"}
                            {pendingBooking.children_count > 0 &&
                              ` + ${pendingBooking.children_count} ${
                                pendingBooking.children_count === 1
                                  ? "Child"
                                  : "Children"
                              }`}
                          </span>
                        </div>
                        <div className={luxuryStyles.pendingBookingRow}>
                          <span className={luxuryStyles.pendingBookingPrice}>
                            ₹
                            {(
                              pendingBooking.total_amount || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className={luxuryStyles.pendingBookingActions}>
                        <button
                          onClick={handleContinuePendingBooking}
                          className={luxuryStyles.pendingBookingContinue}
                        >
                          <FiCheckCircle size={18} />
                          Continue Booking
                        </button>
                        <button
                          onClick={handleCancelPendingBooking}
                          className={luxuryStyles.pendingBookingCancel}
                        >
                          <FiX size={18} />
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={luxuryStyles.bookingHeader}>
                    <div className={luxuryStyles.priceSection}>
                      <div className={luxuryStyles.priceDisplay}>
                        <span className={luxuryStyles.bookingPrice}>
                          ₹{(property.price_per_night || 0).toLocaleString()}
                        </span>
                        <span className={luxuryStyles.bookingPeriod}>
                          / night
                        </span>
                        {totalPrice > 0 &&
                          adults + children > propertyPricing.min_guests && (
                            <div className={luxuryStyles.guestInfo}>
                              (for {adults + children} guests)
                            </div>
                          )}
                      </div>
                      <div className={luxuryStyles.basePriceNote}>
                        Base price includes up to {propertyPricing.min_guests}{" "}
                        {propertyPricing.min_guests === 1 ? "guest" : "guests"}
                        {propertyPricing.min_children > 0 &&
                          ` & ${propertyPricing.min_children} ${
                            propertyPricing.min_children === 1
                              ? "child"
                              : "children"
                          }`}
                      </div>
                    </div>
                    {property.rating > 0 && (
                      <div className={luxuryStyles.metaRating}>
                        <div className={luxuryStyles.ratingBox}>
                          <FiStar />
                          <span>{Number(property.rating).toFixed(1)}</span>
                        </div>
                        <span className={luxuryStyles.reviewsCount}>
                          ({property.reviews_count} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SESSION 33: Hide booking form when pending booking exists */}
                  {!pendingBooking && (
                    <div className={luxuryStyles.bookingForm}>
                      {/* New Date Range Selector Component */}
                      <DateRangeSelector
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                        minDate={new Date()}
                        label="Check-in date"
                        luxuryStyles={luxuryStyles}
                        propertyId={property.id}
                        basePrice={property.price_per_night}
                      />

                      {/* Modern Guests Field */}
                      <div
                        className={luxuryStyles.modernFieldWrapper}
                        ref={guestsDropdownRef}
                      >
                        <div
                          className={luxuryStyles.modernField}
                          onClick={() =>
                            setShowGuestsDropdown(!showGuestsDropdown)
                          }
                        >
                          <div className={luxuryStyles.fieldInner}>
                            <FiUsers className={luxuryStyles.fieldIcon} />
                            <div className={luxuryStyles.fieldText}>
                              <label className={luxuryStyles.fieldLabel}>
                                Guests
                              </label>
                              <div className={luxuryStyles.fieldValue}>
                                {(adults || 0) + (children || 0)}{" "}
                                {(adults || 0) + (children || 0) === 1
                                  ? "Guest"
                                  : "Guests"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Guests dropdown trigger */}
                        {showGuestsDropdown && (
                          <div className={luxuryStyles.dropdownModern}>
                            {/* Adults Counter */}
                            <div className={luxuryStyles.guestsControlModern}>
                              <div className={luxuryStyles.guestsInfoModern}>
                                <div className={luxuryStyles.guestsLabelModern}>
                                  Adults
                                </div>
                                <div
                                  className={luxuryStyles.guestsSublabelModern}
                                >
                                  Age 13+
                                </div>
                              </div>
                              <div className={luxuryStyles.guestsCounter}>
                                <button
                                  className={luxuryStyles.counterBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAdults(Math.max(1, adults - 1));
                                  }}
                                  disabled={adults <= 1}
                                >
                                  −
                                </button>
                                <span className={luxuryStyles.counterValue}>
                                  {adults || 0}
                                </span>
                                <button
                                  className={luxuryStyles.counterBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAdults(
                                      Math.min(
                                        propertyPricing.max_guests,
                                        adults + 1,
                                      ),
                                    );
                                  }}
                                  disabled={
                                    adults >= propertyPricing.max_guests
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className={luxuryStyles.guestsDivider} />

                            {/* Children Counter */}
                            <div className={luxuryStyles.guestsControlModern}>
                              <div className={luxuryStyles.guestsInfoModern}>
                                <div className={luxuryStyles.guestsLabelModern}>
                                  Children
                                </div>
                                <div
                                  className={luxuryStyles.guestsSublabelModern}
                                >
                                  Ages 2-12
                                </div>
                              </div>
                              <div className={luxuryStyles.guestsCounter}>
                                <button
                                  className={luxuryStyles.counterBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChildren(Math.max(0, children - 1));
                                  }}
                                  disabled={children <= 0}
                                >
                                  −
                                </button>
                                <span className={luxuryStyles.counterValue}>
                                  {children || 0}
                                </span>
                                <button
                                  className={luxuryStyles.counterBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChildren(
                                      Math.min(
                                        propertyPricing.max_children,
                                        children + 1,
                                      ),
                                    );
                                  }}
                                  disabled={
                                    children >= propertyPricing.max_children
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  {!pendingBooking && totalPrice > 0 && (
                    <div className={luxuryStyles.priceBreakdown}>
                      <h4 className={luxuryStyles.breakdownTitle}>
                        Price Breakdown
                      </h4>
                      <div className={luxuryStyles.breakdownItems}>
                        <div className={luxuryStyles.breakdownItem}>
                          <span>
                            Base ({nights} {nights === 1 ? "night" : "nights"})
                          </span>
                          <span>
                            ₹{(priceBreakdown.baseAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        {priceBreakdown.extraGuestCharges > 0 && (
                          <div className={luxuryStyles.breakdownItem}>
                            <span>Extra Guest Charges</span>
                            <span>
                              ₹
                              {(
                                priceBreakdown.extraGuestCharges || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {priceBreakdown.extraChildrenCharges > 0 && (
                          <div className={luxuryStyles.breakdownItem}>
                            <span>Extra Children Charges</span>
                            <span>
                              ₹
                              {(
                                priceBreakdown.extraChildrenCharges || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className={luxuryStyles.breakdownItem}>
                          <span>
                            GST (
                            {property.gst_percentage
                              ? parseFloat(property.gst_percentage.toString())
                              : 18}
                            %)
                          </span>
                          <span>
                            ₹{(priceBreakdown.gstAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className={luxuryStyles.breakdownTotal}>
                          <span>Total</span>
                          <span>
                            ₹
                            {(priceBreakdown.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!pendingBooking && (
                    <button
                      onClick={handleBooking}
                      className={luxuryStyles.reserveBtnLuxury}
                    >
                      <span>Reserve Now</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile Floating Booking Button */}
        <div className={luxuryStyles.mobileBookingFloat}>
          <div className={luxuryStyles.mobileBookingContent}>
            <div className={luxuryStyles.mobileBookingPrice}>
              {checkIn && checkOut && nights > 0 ? (
                <>
                  <div className={luxuryStyles.mobilePriceAmount}>
                    {nights} {nights === 1 ? "night" : "nights"} · ₹
                    {priceBreakdown.totalAmount > 0
                      ? (priceBreakdown.totalAmount || 0).toLocaleString()
                      : (
                          (property.price_per_night || 0) * nights
                        ).toLocaleString()}
                  </div>
                  <div className={luxuryStyles.mobilePriceLabel}>
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
                  <div className={luxuryStyles.mobilePriceAmount}>
                    ₹{(property.price_per_night || 0).toLocaleString()}
                  </div>
                  <div className={luxuryStyles.mobilePriceLabel}>per night</div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                if (checkIn && checkOut) {
                  handleBooking();
                } else {
                  setShowMobileSheet(true);
                }
              }}
              className={luxuryStyles.mobileReserveBtn}
            >
              {checkIn && checkOut ? "Reserve Now" : "Select Dates"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile booking bottom sheet */}
      <MobileBookingSheet
        isOpen={showMobileSheet}
        onClose={() => setShowMobileSheet(false)}
        onConfirm={() => {
          setShowMobileSheet(false);
          // If both dates are set after closing, proceed to booking
          if (checkIn && checkOut) handleBooking();
        }}
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        adults={adults}
        childCount={children}
        onAdultsChange={setAdults}
        onChildrenChange={setChildren}
        maxGuests={propertyPricing.max_guests}
        maxChildren={propertyPricing.max_children}
        propertyId={property?.id}
        pricePerNight={property?.price_per_night ?? 0}
        calendarPriceMap={calendarPriceMap}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default function PropertyDetailPage() {
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
            <p>Loading property...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailContent />
    </Suspense>
  );
}
