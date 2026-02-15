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
  FiInfo,
  FiUser,
  FiCheckCircle,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import propertyStyles from "./property-detail.module.css";
import luxuryStyles from "./luxury-property.module.css";
import PropertyGallery from "./PropertyGallery";
import DateRangeSelector from "@/components/DateRangeSelector";
import { getImageUrl } from "@/lib/imageUtils";

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return <FiWifi />;
  if (lower.includes("tv") || lower.includes("television")) return <FiTv />;
  if (lower.includes("coffee") || lower.includes("kitchen"))
    return <FiCoffee />;
  if (lower.includes("ac") || lower.includes("air")) return <FiWind />;
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
          setIsSaved(response.data.data.isSaved || false);
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
          price_per_night: data.price_per_night,
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
          photos: Array.isArray(data.photos)
            ? data.photos
            : data.photos
              ? typeof data.photos === "string"
                ? JSON.parse(data.photos)
                : []
              : [],
          rating: data.rating || 0,
          reviews_count: data.reviews_count || 0,
          status: data.status,
        };

        setProperty(mappedProperty);

        // Store pricing details for dynamic calculation
        setPropertyPricing({
          min_guests: data.min_guests || 2,
          max_guests: data.max_guests || 10,
          extra_guest_charge: data.extra_guest_charge || 0,
          min_children: data.min_children || 0,
          max_children: data.max_children || 5,
          extra_child_charge: data.extra_child_charge || 0,
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

        // Calculate dynamic pricing with extra guest charges
        const baseAmount = property.price_per_night * calculatedNights;

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

        // Calculate GST (18%)
        const gstAmount = subtotal * 0.18;

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
  }, [checkIn, checkOut, property, adults, children, propertyPricing]);

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
        pricePerNight: property.price_per_night,
        minGuests: propertyPricing.min_guests,
        maxGuests: propertyPricing.max_guests,
        minChildren: propertyPricing.min_children,
        maxChildren: propertyPricing.max_children,
        extraGuestCharge: propertyPricing.extra_guest_charge,
        extraChildCharge: propertyPricing.extra_child_charge,
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
    } catch (error) {
      console.error("Wishlist error:", error);
      const errorMessage =
        error instanceof Error
          ? (error as Error & { response?: { data?: { message?: string } } })
              .response?.data?.message || "Failed to update wishlist"
          : "Failed to update wishlist";
      toast.error(errorMessage);
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
                          {property.city}, {property.state} - {property.pincode}
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

              {/* Amenities */}
              {amenities.length > 0 && (
                <section className={luxuryStyles.amenitiesSectionLuxury}>
                  <h2 className={luxuryStyles.sectionTitleLuxury}>
                    Amenities & Features
                  </h2>
                  <div className={luxuryStyles.amenitiesGridLuxury}>
                    {amenities.map((amenity: string, index: number) => (
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

              {/* House Rules - Industry Standard */}
              <section className={luxuryStyles.houseRulesSection}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>House Rules</h2>
                <div className={luxuryStyles.rulesGrid}>
                  <div className={luxuryStyles.ruleItem}>
                    <FiClock className={luxuryStyles.ruleIcon} />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>Check-in:</strong> After 2:00 PM
                    </div>
                  </div>
                  <div className={luxuryStyles.ruleItem}>
                    <FiClock className={luxuryStyles.ruleIcon} />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>Check-out:</strong> Before 11:00 AM
                    </div>
                  </div>
                  <div className={luxuryStyles.ruleItem}>
                    <FiUsers className={luxuryStyles.ruleIcon} />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>Max guests:</strong> {property.max_guests} guests
                    </div>
                  </div>
                  <div className={luxuryStyles.ruleItem}>
                    <FiX
                      className={`${luxuryStyles.ruleIcon} ${luxuryStyles.ruleIconDanger}`}
                    />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>No smoking</strong> inside the property
                    </div>
                  </div>
                  <div className={luxuryStyles.ruleItem}>
                    <FiX
                      className={`${luxuryStyles.ruleIcon} ${luxuryStyles.ruleIconDanger}`}
                    />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>No parties or events</strong> without permission
                    </div>
                  </div>
                  <div className={luxuryStyles.ruleItem}>
                    <FiCheck
                      className={`${luxuryStyles.ruleIcon} ${luxuryStyles.ruleIconSuccess}`}
                    />
                    <div className={luxuryStyles.ruleContent}>
                      <strong>Pets allowed</strong> with prior approval
                    </div>
                  </div>
                </div>
              </section>

              {/* Cancellation Policy - Industry Standard */}
              <section className={luxuryStyles.cancellationSection}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>
                  Cancellation Policy
                </h2>
                <div className={luxuryStyles.policyCard}>
                  <div className={luxuryStyles.policyHeader}>
                    <FiShield className={luxuryStyles.policyIcon} />
                    <h3 className={luxuryStyles.policyTitle}>
                      Flexible Cancellation
                    </h3>
                  </div>
                  <div className={luxuryStyles.policyContent}>
                    <p className={luxuryStyles.policyText}>
                      <strong>Free cancellation for 48 hours</strong> after
                      booking.
                    </p>
                    <p className={luxuryStyles.policyText}>
                      Cancel up to <strong>7 days before check-in</strong> for a
                      50% refund of the nightly rate.
                    </p>
                    <p className={luxuryStyles.policyText}>
                      Cancellations within 7 days are{" "}
                      <strong>non-refundable</strong>.
                    </p>
                    <p className={luxuryStyles.policyNote}>
                      <FiInfo /> Cleaning fees are always refundable. Service
                      fees are refundable if cancelled within 48 hours of
                      booking.
                    </p>
                  </div>
                </div>
              </section>

              {/* Host Information - Industry Standard */}
              <section className={luxuryStyles.hostSection}>
                <h2 className={luxuryStyles.sectionTitleLuxury}>Hosted By</h2>
                <div className={luxuryStyles.hostCard}>
                  <div className={luxuryStyles.hostHeader}>
                    <div className={luxuryStyles.hostAvatar}>
                      <FiUser />
                    </div>
                    <div className={luxuryStyles.hostInfo}>
                      <h3 className={luxuryStyles.hostName}>Zevio Villas</h3>
                      <p className={luxuryStyles.hostJoined}>Joined in 2024</p>
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
                    Zevio Villas specializes in luxury property rentals across
                    India&apos;s most beautiful destinations. We ensure every
                    stay is memorable with premium amenities and exceptional
                    service.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT SIDE - Property Header + Booking Card (Sticky) */}
          <div className={luxuryStyles.sidebarColumn}>
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
                            ₹{pendingBooking.total_amount.toLocaleString()}
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
                          ₹{property.price_per_night.toLocaleString()}
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

                        {/* Guests Dropdown */}
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
                            ₹{priceBreakdown.baseAmount.toLocaleString()}
                          </span>
                        </div>
                        {priceBreakdown.extraGuestCharges > 0 && (
                          <div className={luxuryStyles.breakdownItem}>
                            <span>Extra Guest Charges</span>
                            <span>
                              ₹
                              {priceBreakdown.extraGuestCharges.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {priceBreakdown.extraChildrenCharges > 0 && (
                          <div className={luxuryStyles.breakdownItem}>
                            <span>Extra Children Charges</span>
                            <span>
                              ₹
                              {priceBreakdown.extraChildrenCharges.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className={luxuryStyles.breakdownItem}>
                          <span>GST (18%)</span>
                          <span>
                            ₹{priceBreakdown.gstAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className={luxuryStyles.breakdownTotal}>
                          <span>Total</span>
                          <span>
                            ₹{priceBreakdown.totalAmount.toLocaleString()}
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
              <div className={luxuryStyles.mobilePriceAmount}>
                ₹{property.price_per_night.toLocaleString()}
              </div>
              <div className={luxuryStyles.mobilePriceLabel}>per night</div>
            </div>
            <button
              onClick={handleBooking}
              className={luxuryStyles.mobileReserveBtn}
            >
              Reserve
            </button>
          </div>
        </div>
      </div>

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
