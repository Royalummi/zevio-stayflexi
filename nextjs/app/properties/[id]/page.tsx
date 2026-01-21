"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return <FiWifi />;
  if (lower.includes("tv") || lower.includes("television")) return <FiTv />;
  if (lower.includes("coffee") || lower.includes("kitchen"))
    return <FiCoffee />;
  if (lower.includes("ac") || lower.includes("air")) return <FiWind />;
  return <FiCheck />;
};

export default function PropertyDetailPage() {
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
    const checkWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await api.get(`/wishlist/check/${propertyId}`);
        setIsSaved(response.data.data.isSaved || false);
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    checkWishlist();
  }, [propertyId]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/public/property/${propertyId}`);
        const data = response.data.data;

        // Map backend fields to frontend Property interface
        const mappedProperty: Property = {
          id: data.id,
          name: data.title || data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
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
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
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

    if (adults + children > (property?.max_guests || 0)) {
      toast.warning(`Maximum ${property?.max_guests} guests allowed`);
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
        propertyName: property.name,
        propertyLocation: `${property.city}, ${property.state}`,
        propertyImage: property.photos[0] || "/placeholder.jpg",
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

  const photos = photosArray.length > 0 ? photosArray : defaultPhotos;

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
              <p className={propertyStyles.propertyLocationNav}>
                <FiMapPin />
                <span>
                  {property.city}, {property.state}
                </span>
              </p>
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
                          {new Date(pendingBooking.check_in).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}{" "}
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
                    {/* Row 1: Check-in and Check-out Dates */}
                    <div className={luxuryStyles.dateSelectionGrid}>
                      <div className={luxuryStyles.formGroup}>
                        <label>
                          <FiCalendar />
                          Check-in
                        </label>
                        <DatePicker
                          selected={checkIn}
                          onChange={(date: Date | null) => setCheckIn(date)}
                          selectsStart
                          startDate={checkIn}
                          endDate={checkOut}
                          minDate={new Date()}
                          placeholderText="Select check-in"
                          dateFormat="MMM d, yyyy"
                          className={luxuryStyles.formInput}
                        />
                      </div>

                      <div className={luxuryStyles.formGroup}>
                        <label>
                          <FiCalendar />
                          Check-out
                        </label>
                        <DatePicker
                          selected={checkOut}
                          onChange={(date: Date | null) => setCheckOut(date)}
                          selectsEnd
                          startDate={checkIn}
                          endDate={checkOut}
                          minDate={checkIn || new Date()}
                          placeholderText="Select check-out"
                          dateFormat="MMM d, yyyy"
                          className={luxuryStyles.formInput}
                        />
                      </div>
                    </div>

                    {/* Row 2: Adults and Children Counters */}
                    <div className={luxuryStyles.guestsSelectionGrid}>
                      <div className={luxuryStyles.guestsIncrementer}>
                        <label className={luxuryStyles.guestsLabel}>
                          <FiUsers />
                          Adults
                        </label>
                        <div className={luxuryStyles.guestsControls}>
                          <button
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1}
                            className={`${luxuryStyles.guestBtn} ${luxuryStyles.guestDecrement}`}
                            aria-label="Decrease adults"
                          >
                            −
                          </button>
                          <span className={luxuryStyles.guestsCount}>
                            {adults} {adults === 1 ? "Adult" : "Adults"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAdults(
                                Math.min(property.max_guests, adults + 1),
                              )
                            }
                            disabled={adults >= property.max_guests}
                            className={`${luxuryStyles.guestBtn} ${luxuryStyles.guestIncrement}`}
                            aria-label="Increase adults"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={luxuryStyles.guestsIncrementer}>
                        <label className={luxuryStyles.guestsLabel}>
                          <FiUsers />
                          Children (Ages 2-12)
                        </label>
                        <div className={luxuryStyles.guestsControls}>
                          <button
                            type="button"
                            onClick={() =>
                              setChildren(Math.max(0, children - 1))
                            }
                            disabled={children <= 0}
                            className={`${luxuryStyles.guestBtn} ${luxuryStyles.guestDecrement}`}
                            aria-label="Decrease children"
                          >
                            −
                          </button>
                          <span className={luxuryStyles.guestsCount}>
                            {children} {children === 1 ? "Child" : "Children"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setChildren(
                                Math.min(
                                  propertyPricing.max_children,
                                  children + 1,
                                ),
                              )
                            }
                            disabled={children >= propertyPricing.max_children}
                            className={`${luxuryStyles.guestBtn} ${luxuryStyles.guestIncrement}`}
                            aria-label="Increase children"
                          >
                            +
                          </button>
                        </div>
                      </div>
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
                            ₹{priceBreakdown.extraGuestCharges.toLocaleString()}
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
