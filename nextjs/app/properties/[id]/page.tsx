"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { api } from "@/lib/axios";
import { formatDateForAPI } from "@/lib/utils";
import type { Property } from "@/types";
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
  FiMessageSquare,
} from "react-icons/fi";
import { IoBed } from "react-icons/io5";
import "./property-detail.css";
import "./luxury-property.css";

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

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  // Pre-fill guests from SearchBar URL params, default to 1
  const [guests, setGuests] = useState(() => {
    const guestsParam = searchParams.get("guests");
    return guestsParam ? parseInt(guestsParam) : 1;
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

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
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, router]);

  // Calculate total price when dates change
  useEffect(() => {
    if (checkIn && checkOut && property) {
      const start = checkIn;
      const end = checkOut;
      const calculatedNights = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (calculatedNights > 0) {
        setNights(calculatedNights);
        setTotalPrice(calculatedNights * property.price_per_night);
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkIn, checkOut, property]);

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    if (guests > (property?.max_guests || 0)) {
      alert(`Maximum ${property?.max_guests} guests allowed`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to book this property");
        router.push("/login");
        return;
      }

      await api.post("/bookings", {
        property_id: propertyId,
        check_in_date: checkIn ? formatDateForAPI(checkIn) : "",
        check_out_date: checkOut ? formatDateForAPI(checkOut) : "",
        guest_count: guests,
        total_amount: totalPrice,
      });

      alert("Booking request sent successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage =
        error instanceof Error
          ? (error as Error & { response?: { data?: { message?: string } } })
              .response?.data?.message || "Failed to create booking"
          : "Failed to create booking";
      alert(errorMessage);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save to wishlist API
    console.log(`Property ${propertyId} saved: ${!isSaved}`);
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
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner-detail"></div>
        <p className="loading-text-detail">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="not-found-page">
        <div className="not-found-card">
          <div className="not-found-icon">
            <FiHome />
          </div>
          <h2 className="not-found-title">Property Not Found</h2>
          <p className="not-found-message">
            The property you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className="not-found-btn"
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

  const gstAmount = totalPrice * 0.18;
  const grandTotal = totalPrice + gstAmount;

  return (
    <div className="property-detail-page">
      {/* Navigation Bar */}
      <div className="property-nav">
        <div className="nav-container">
          <div className="nav-content">
            <button
              onClick={() => router.push("/properties")}
              className="back-btn"
            >
              <FiArrowLeft />
              <span>Back to Properties</span>
            </button>

            <div className="nav-actions">
              <button
                onClick={handleShare}
                className="action-btn"
                aria-label="Share property"
              >
                <FiShare2 />
              </button>
              <button
                onClick={handleSave}
                className={`action-btn ${isSaved ? "active" : ""}`}
                aria-label={
                  isSaved ? "Remove from wishlist" : "Save to wishlist"
                }
              >
                <FiHeart />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-container">
        {/* Luxury Two-Column Layout: Gallery LEFT + Property Details | Header + Booking RIGHT */}
        <div className="luxury-villa-layout">
          {/* LEFT SIDE - Photo Gallery + Property Details */}
          <div className="gallery-section">
            <div className="main-photo-wrapper">
              <Image
                src={photos[selectedPhoto]}
                alt={property.name}
                className="main-photo-luxury"
                width={1200}
                height={800}
                priority
                style={{ objectFit: "cover" }}
              />
              <div className="photo-counter-badge">
                <span>{selectedPhoto + 1}</span>
                <span className="separator">/</span>
                <span>{photos.length}</span>
              </div>
            </div>

            {/* Thumbnails Grid - ALL Photos */}
            <div className="thumbnails-luxury-grid">
              {photos.map((photo: string, index: number) => (
                <div
                  key={index}
                  onClick={() => setSelectedPhoto(index)}
                  className={`luxury-thumbnail ${
                    selectedPhoto === index ? "active" : ""
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`${property.name} - Photo ${index + 1}`}
                    width={200}
                    height={150}
                    style={{ objectFit: "cover" }}
                  />
                  {selectedPhoto === index && (
                    <div className="active-indicator"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Property Details - Inside LEFT Column */}
            <div className="property-details-left">
              {/* Property Overview */}
              <section className="overview-section-luxury">
                <h2 className="section-title-luxury">Property Overview</h2>
                <div className="stats-grid-luxury">
                  <div className="stat-card-luxury">
                    <div className="stat-icon-luxury">
                      <FiUsers />
                    </div>
                    <div className="stat-content-luxury">
                      <div className="stat-value-luxury">
                        {property.max_guests}
                      </div>
                      <div className="stat-label-luxury">Guests</div>
                    </div>
                  </div>
                  <div className="stat-card-luxury">
                    <div className="stat-icon-luxury">
                      <IoBed />
                    </div>
                    <div className="stat-content-luxury">
                      <div className="stat-value-luxury">
                        {property.bedrooms}
                      </div>
                      <div className="stat-label-luxury">Bedrooms</div>
                    </div>
                  </div>
                  <div className="stat-card-luxury">
                    <div className="stat-icon-luxury">
                      <FiHome />
                    </div>
                    <div className="stat-content-luxury">
                      <div className="stat-value-luxury">
                        {property.bathrooms}
                      </div>
                      <div className="stat-label-luxury">Bathrooms</div>
                    </div>
                  </div>
                  <div className="stat-card-luxury">
                    <div className="stat-icon-luxury">
                      <FiStar />
                    </div>
                    <div className="stat-content-luxury">
                      <div className="stat-value-luxury">
                        {Number(property.rating).toFixed(1)}
                      </div>
                      <div className="stat-label-luxury">Rating</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* About This Place */}
              <section className="about-section-luxury">
                <h2 className="section-title-luxury">About This Place</h2>
                <p className="description-text-luxury">
                  {property.description}
                </p>
              </section>

              {/* Amenities */}
              {amenities.length > 0 && (
                <section className="amenities-section-luxury">
                  <h2 className="section-title-luxury">Amenities & Features</h2>
                  <div className="amenities-grid-luxury">
                    {amenities.map((amenity: string, index: number) => (
                      <div key={index} className="amenity-item-luxury">
                        <div className="amenity-icon-luxury">
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className="amenity-text-luxury">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* House Rules - Industry Standard */}
              <section className="house-rules-section">
                <h2 className="section-title-luxury">House Rules</h2>
                <div className="rules-grid">
                  <div className="rule-item">
                    <FiClock className="rule-icon" />
                    <div className="rule-content">
                      <strong>Check-in:</strong> After 2:00 PM
                    </div>
                  </div>
                  <div className="rule-item">
                    <FiClock className="rule-icon" />
                    <div className="rule-content">
                      <strong>Check-out:</strong> Before 11:00 AM
                    </div>
                  </div>
                  <div className="rule-item">
                    <FiUsers className="rule-icon" />
                    <div className="rule-content">
                      <strong>Max guests:</strong> {property.max_guests} guests
                    </div>
                  </div>
                  <div className="rule-item">
                    <FiX className="rule-icon rule-icon-danger" />
                    <div className="rule-content">
                      <strong>No smoking</strong> inside the property
                    </div>
                  </div>
                  <div className="rule-item">
                    <FiX className="rule-icon rule-icon-danger" />
                    <div className="rule-content">
                      <strong>No parties or events</strong> without permission
                    </div>
                  </div>
                  <div className="rule-item">
                    <FiCheck className="rule-icon rule-icon-success" />
                    <div className="rule-content">
                      <strong>Pets allowed</strong> with prior approval
                    </div>
                  </div>
                </div>
              </section>

              {/* Cancellation Policy - Industry Standard */}
              <section className="cancellation-section">
                <h2 className="section-title-luxury">Cancellation Policy</h2>
                <div className="policy-card">
                  <div className="policy-header">
                    <FiShield className="policy-icon" />
                    <h3 className="policy-title">Flexible Cancellation</h3>
                  </div>
                  <div className="policy-content">
                    <p className="policy-text">
                      <strong>Free cancellation for 48 hours</strong> after
                      booking.
                    </p>
                    <p className="policy-text">
                      Cancel up to <strong>7 days before check-in</strong> for a
                      50% refund of the nightly rate.
                    </p>
                    <p className="policy-text">
                      Cancellations within 7 days are{" "}
                      <strong>non-refundable</strong>.
                    </p>
                    <p className="policy-note">
                      <FiInfo /> Cleaning fees are always refundable. Service
                      fees are refundable if cancelled within 48 hours of
                      booking.
                    </p>
                  </div>
                </div>
              </section>

              {/* Host Information - Industry Standard */}
              <section className="host-section">
                <h2 className="section-title-luxury">Hosted By</h2>
                <div className="host-card">
                  <div className="host-header">
                    <div className="host-avatar">
                      <FiUser />
                    </div>
                    <div className="host-info">
                      <h3 className="host-name">Zevio Villas</h3>
                      <p className="host-joined">Joined in 2024</p>
                    </div>
                    {property.rating >= 4.8 && (
                      <div className="superhost-badge">
                        <FiStar /> Superhost
                      </div>
                    )}
                  </div>
                  <div className="host-stats">
                    <div className="host-stat">
                      <FiStar className="stat-icon-host" />
                      <div>
                        <strong>{property.reviews_count}</strong> Reviews
                      </div>
                    </div>
                    <div className="host-stat">
                      <FiShield className="stat-icon-host" />
                      <div>
                        <strong>Identity verified</strong>
                      </div>
                    </div>
                    <div className="host-stat">
                      <FiCheck className="stat-icon-host" />
                      <div>
                        <strong>92%</strong> Response rate
                      </div>
                    </div>
                  </div>
                  <p className="host-description">
                    Zevio Villas specializes in luxury property rentals across
                    India&apos;s most beautiful destinations. We ensure every
                    stay is memorable with premium amenities and exceptional
                    service.
                  </p>
                  <button className="contact-host-btn">
                    <FiMessageSquare /> Contact Host
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT SIDE - Property Header + Booking Card (Sticky) */}
          <aside className="booking-sidebar">
            {/* Booking Card */}
            <div className="booking-card">
              <div className="booking-card-content">
                <div className="">
                  <h1 className="property-name-sidebar">{property.name}</h1>
                  <div className="property-meta-sidebar">
                    <div className="meta-location">
                      <FiMapPin />
                      <span>
                        {property.address}, {property.city}, {property.state} -{" "}
                        {property.pincode}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="booking-header">
                  <div className="price-display">
                    <span className="booking-price">
                      ₹{property.price_per_night.toLocaleString()}
                    </span>
                    <span className="booking-period">/ night</span>
                  </div>
                  {property.rating > 0 && (
                    <div className="meta-rating">
                      <div className="rating-box">
                        <FiStar />
                        <span>{Number(property.rating).toFixed(1)}</span>
                      </div>
                      <span className="reviews-count">
                        ({property.reviews_count} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <div className="booking-form">
                  {/* Check-in Date */}
                  <div className="date-selection">
                    <div className="form-group">
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
                        className="form-input"
                      />
                    </div>

                    {/* Check-out Date */}
                    <div className="form-group">
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
                        className="form-input"
                      />
                    </div>
                  </div>
                  {/* Guests - Incrementer */}
                  <div className="form-group">
                    <div className="guests-incrementer">
                      <label className="guests-label">
                        <FiUsers />
                        Guests
                      </label>
                      <div className="guests-controls">
                        <button
                          type="button"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          disabled={guests <= 1}
                          className="guest-btn guest-decrement"
                          aria-label="Decrease guests"
                        >
                          −
                        </button>
                        <span className="guests-count">
                          {guests} {guests === 1 ? "Guest" : "Guests"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setGuests(Math.min(property.max_guests, guests + 1))
                          }
                          disabled={guests >= property.max_guests}
                          className="guest-btn guest-increment"
                          aria-label="Increase guests"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {totalPrice > 0 && (
                  <div className="price-breakdown">
                    <h4 className="breakdown-title">Price Breakdown</h4>
                    <div className="breakdown-items">
                      <div className="breakdown-item">
                        <span>
                          ₹{property.price_per_night.toLocaleString()} ×{" "}
                          {nights} {nights === 1 ? "night" : "nights"}
                        </span>
                        <span>₹{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>GST (18%)</span>
                        <span>₹{gstAmount.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-total">
                        <span>Total</span>
                        <span>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={handleBooking} className="reserve-btn-luxury">
                  <span>Reserve Now</span>
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Floating Booking Button */}
        <div className="mobile-booking-float">
          <div className="mobile-booking-content">
            <div className="mobile-booking-price">
              <div className="mobile-price-amount">
                ₹{property.price_per_night.toLocaleString()}
              </div>
              <div className="mobile-price-label">per night</div>
            </div>
            <button onClick={handleBooking} className="mobile-reserve-btn">
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
