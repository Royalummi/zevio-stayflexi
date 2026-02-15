"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { api } from "@/lib/axios";
import Image from "next/image";
import {
  FiCalendar,
  FiUsers,
  FiMoon,
  FiMapPin,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";
import styles from "./booking-review.module.css";
// SESSION 64: New components for coupon and price breakdown
import CouponInput from "@/components/booking/CouponInput";
import PriceBreakdown from "@/components/booking/PriceBreakdown";

// Declare Cashfree global for TypeScript
declare global {
  interface Window {
    Cashfree: (config: { mode: string }) => {
      checkout: (options: {
        paymentSessionId: string;
        returnUrl: string;
        customerDetails: {
          customerName: string;
          customerEmail: string;
          customerPhone: string;
        };
      }) => Promise<{
        error?: { message: string };
        paymentDetails?: { orderId: string };
      }>;
    };
  }
}

// Load Cashfree SDK script
const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function BookingReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { bookingData, setBookingData, clearBookingData } = useBooking();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [lateCheckOut, setLateCheckOut] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // SESSION 64: Coupon system state
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>("");
  const [appliedCouponId, setAppliedCouponId] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // SESSION 31: Fetch existing booking if bookingId parameter is present
  useEffect(() => {
    const bookingId = searchParams.get("bookingId");

    if (bookingId && !bookingData) {
      const fetchExistingBooking = async () => {
        try {
          setFetchingBooking(true);
          const response = await api.get(`/bookings/${bookingId}`);
          const booking = response.data?.data || response.data;

          // Check if booking is still pending
          if (
            booking.status !== "pending" &&
            booking.status !== "pending_payment"
          ) {
            toast.error("This booking is no longer pending");
            router.push("/dashboard");
            return;
          }

          // Check if booking has expired
          if (booking.expires_at) {
            const expiryDate = new Date(booking.expires_at);
            const now = new Date();
            if (expiryDate <= now) {
              toast.error("This booking has expired");
              router.push("/dashboard");
              return;
            }
          }

          // Set booking data in context (matching BookingData interface)
          setBookingData({
            propertyId: booking.property_id,
            propertyTypeId: booking.property_type_id, // Added from backend
            propertyName: booking.property_title,
            propertyLocation: `${booking.city_name}, ${booking.city_state}`,
            propertyImage:
              booking.property_images?.[0]?.image_url ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E",
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            adults: booking.guest_count, // guest_count is adults only
            children: booking.children_count || 0,
            infants: booking.infants_count || 0,
            nights: booking.nights,
            baseAmount: booking.base_amount,
            extraGuestCharges: booking.extra_guest_charges || 0,
            extraChildrenCharges: booking.extra_children_charges || 0,
            gstAmount: booking.gst_amount,
            totalAmount: booking.total_amount,
            pricePerNight: Math.round(booking.base_amount / booking.nights),
            minGuests: booking.min_guests || 2,
            maxGuests: booking.max_guests || 10,
            minChildren: booking.min_children || 0,
            maxChildren: booking.max_children || 5,
            extraGuestCharge: booking.extra_guest_charge || 0,
            extraChildCharge: booking.extra_child_charge || 0,
            // SESSION 64: Restore coupon data if present
            couponCode: booking.coupon_code,
            couponDiscount: booking.discount_amount || 0,
          });

          // SESSION 64: Set coupon state if coupon was applied
          if (booking.coupon_code) {
            setAppliedCouponCode(booking.coupon_code);
            setCouponDiscount(booking.discount_amount || 0);
          }
        } catch (error: unknown) {
          console.error("Error fetching booking:", error);
          toast.error("Failed to load booking details");
          router.push("/dashboard");
        } finally {
          setFetchingBooking(false);
        }
      };

      fetchExistingBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast.error("Please login to continue booking");
      router.push("/");
      return;
    }

    // Only redirect if no booking data AND not currently fetching
    if (!bookingData && !fetchingBooking && !searchParams.get("bookingId")) {
      toast.error("No booking data found");
      router.push("/properties");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookingData, fetchingBooking, router]);

  // SESSION 64: Coupon event handlers
  const handleCouponApplied = (
    couponCode: string,
    discountAmount: number,
    couponId: string,
  ) => {
    setAppliedCouponCode(couponCode);
    setAppliedCouponId(couponId);
    setCouponDiscount(discountAmount);

    // Update booking data with coupon
    if (bookingData) {
      setBookingData({
        ...bookingData,
        couponCode,
        couponId,
        couponDiscount: discountAmount,
      });
    }

    toast.success(`Coupon ${couponCode} applied successfully!`);
  };

  const handleCouponRemoved = () => {
    setAppliedCouponCode("");
    setAppliedCouponId("");
    setCouponDiscount(0);

    // Update booking data to remove coupon
    if (bookingData) {
      setBookingData({
        ...bookingData,
        couponCode: undefined,
        couponId: undefined,
        couponDiscount: 0,
      });
    }

    toast.success("Coupon removed");
  };

  const handlePayment = async () => {
    // Validation
    if (!fullName || !email || !phone) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Load Cashfree SDK script
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        setLoading(false);
        return;
      }

      // Create booking and get Cashfree order
      let response;
      try {
        response = await api.post("/bookings", {
          property_id: bookingData?.propertyId,
          property_type_id: bookingData?.propertyTypeId,
          check_in: bookingData?.checkIn,
          check_out: bookingData?.checkOut,
          guest_count: bookingData?.adults,
          children_count: bookingData?.children,
          infants_count: 0,
          // SESSION 64: Include coupon data if applied
          coupon_code: appliedCouponCode || undefined,
          coupon_id: appliedCouponId || undefined,
        });
      } catch (bookingError: unknown) {
        let errorMsg = "Failed to create booking";
        if (
          bookingError &&
          typeof bookingError === "object" &&
          "response" in bookingError
        ) {
          const axiosErr = bookingError as {
            response?: { data?: { message?: string; error?: string } };
          };
          errorMsg =
            axiosErr.response?.data?.message ||
            axiosErr.response?.data?.error ||
            errorMsg;
        }
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const { booking_id, isUpdate } = response.data.data;

      // Show appropriate message if booking was updated
      if (isUpdate) {
        toast.info(
          "Your pending booking has been updated with new dates/guests",
        );
      }

      // Create payment order
      let paymentResponse;
      try {
        paymentResponse = await api.post("/payments/create-order", {
          booking_id: booking_id,
        });
      } catch (paymentError: unknown) {
        let errorMsg = "Failed to create payment order";
        if (
          paymentError &&
          typeof paymentError === "object" &&
          "response" in paymentError
        ) {
          const axiosErr = paymentError as {
            response?: { data?: { message?: string; error?: string } };
          };
          errorMsg =
            axiosErr.response?.data?.message ||
            axiosErr.response?.data?.error ||
            errorMsg;
        }
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const { order_id, payment_session_id } = paymentResponse.data.data;

      // Initialize Cashfree Drop-in checkout @ts-ignore - Cashfree SDK is loaded dynamically from CDN
      const cashfree = window.Cashfree({
        mode: "sandbox", // Use "sandbox" for TEST, "production" for PROD
      });

      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        returnUrl: `${window.location.origin}/booking-success?bookingId=${booking_id}`,
        redirectTarget: "_modal", // Open in modal instead of redirect
        customerDetails: {
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
        },
      };

      // Open Cashfree payment modal
      cashfree
        .checkout(checkoutOptions)
        .then(
          async (result: {
            error?: { message: string };
            paymentDetails?: { orderId: string };
          }) => {
            if (result.error) {
              console.error("Payment error:", result.error);
              toast.error(result.error.message || "Payment failed");
              setLoading(false);
              return;
            }

            if (result.paymentDetails) {
              console.log("✅ Payment successful:", result.paymentDetails);

              // Verify payment with backend
              try {
                const verifyResponse = await api.post("/payments/verify", {
                  order_id: order_id,
                  booking_id: booking_id,
                });

                if (verifyResponse.data.success) {
                  toast.success("Payment successful! Redirecting...");
                  clearBookingData();
                  setTimeout(() => {
                    router.push(`/booking-success?bookingId=${booking_id}`);
                  }, 1500);
                } else {
                  toast.error(
                    verifyResponse.data.message ||
                      "Payment verification failed",
                  );
                  setLoading(false);
                }
              } catch (verifyError: unknown) {
                let errorMsg = "Payment verification failed";
                if (
                  verifyError &&
                  typeof verifyError === "object" &&
                  "response" in verifyError
                ) {
                  const axiosErr = verifyError as {
                    response?: { data?: { message?: string; error?: string } };
                  };
                  errorMsg =
                    axiosErr.response?.data?.message ||
                    axiosErr.response?.data?.error ||
                    errorMsg;
                } else if (verifyError instanceof Error) {
                  errorMsg = verifyError.message;
                }
                toast.error(errorMsg);
                setLoading(false);
              }
            }
          },
        )
        .catch((error: Error) => {
          console.error("Cashfree checkout error:", error);
          toast.error(
            error.message || "Payment gateway error. Please try again.",
          );
          setLoading(false);
        });
    } catch (error: unknown) {
      console.error("Booking error:", error);

      // Extract error message from Axios error
      let errorMessage = "Failed to create booking";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
            };
          };
        };
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          errorMessage;

        // Log full error details for debugging
        console.error("Full booking error details:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          bookingData: bookingData,
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (!bookingData) {
    // SESSION 31: Show loading state when fetching existing booking
    if (fetchingBooking) {
      return (
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading booking details...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.innerContainer}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <button
              onClick={() => {
                // SESSION 32 + 39.3: Back to correct property type with URL params
                const params = new URLSearchParams();
                params.set("checkIn", bookingData.checkIn);
                params.set("checkOut", bookingData.checkOut);
                params.set("adults", bookingData.adults.toString());
                params.set("children", bookingData.children.toString());

                // Route to correct property type page
                const propertyPath =
                  bookingData.propertyType === "service-apartment"
                    ? "service-apartments"
                    : "properties";

                router.push(
                  `/${propertyPath}/${bookingData.propertyId}?${params.toString()}`,
                );
              }}
              className={styles.backButton}
              type="button"
            >
              <FiArrowLeft /> Back to Property
            </button>
            <h1 className={styles.pageTitle}>Review Your Booking</h1>
            <p className={styles.pageSubtitle}>
              Please review your details before confirming
            </p>
          </div>

          <div className={styles.contentGrid}>
            {/* Left: Property Summary */}
            <div className={styles.leftColumn}>
              {/* Property Card */}
              <div className={styles.propertyCard}>
                <h2 className={styles.sectionTitle}>Property Details</h2>
                <div className={styles.propertyContent}>
                  <Image
                    src={bookingData.propertyImage}
                    alt={bookingData.propertyName}
                    width={120}
                    height={90}
                    className={styles.propertyImage}
                    unoptimized
                  />
                  <div className={styles.propertyInfo}>
                    <h3 className={styles.propertyName}>
                      {bookingData.propertyName}
                    </h3>
                    <p className={styles.propertyLocation}>
                      <FiMapPin /> {bookingData.propertyLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details Card */}
              <div className={styles.detailsCard}>
                <h2 className={styles.sectionTitle}>Booking Details</h2>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <FiCalendar className={styles.detailIcon} />
                    <div>
                      <p className={styles.detailLabel}>Check-in</p>
                      <p className={styles.detailValue}>
                        {new Date(bookingData.checkIn).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <FiCalendar className={styles.detailIcon} />
                    <div>
                      <p className={styles.detailLabel}>Check-out</p>
                      <p className={styles.detailValue}>
                        {new Date(bookingData.checkOut).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <FiMoon className={styles.detailIcon} />
                    <div>
                      <p className={styles.detailLabel}>Nights</p>
                      <p className={styles.detailValue}>
                        {bookingData.nights}{" "}
                        {bookingData.nights === 1 ? "Night" : "Nights"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <FiUsers className={styles.detailIcon} />
                    <div>
                      <p className={styles.detailLabel}>Guests</p>
                      <p className={styles.detailValue}>
                        {bookingData.adults}{" "}
                        {bookingData.adults === 1 ? "Adult" : "Adults"}
                        {bookingData.children > 0 &&
                          `, ${bookingData.children} ${
                            bookingData.children === 1 ? "Child" : "Children"
                          }`}
                        {bookingData.infants > 0 &&
                          `, ${bookingData.infants} ${
                            bookingData.infants === 1 ? "Infant" : "Infants"
                          }`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SESSION 64: New Price Breakdown Component with Tiered GST & Service Charges */}
              <PriceBreakdown
                baseAmount={bookingData.baseAmount}
                extraGuestCharges={bookingData.extraGuestCharges}
                extraChildrenCharges={bookingData.extraChildrenCharges}
                nights={bookingData.nights}
                pricePerNight={bookingData.pricePerNight}
                minGuests={bookingData.minGuests}
                minChildren={bookingData.minChildren}
                adults={bookingData.adults}
                childrenCount={bookingData.children}
                extraGuestCharge={bookingData.extraGuestCharge}
                extraChildCharge={bookingData.extraChildCharge}
                couponDiscount={couponDiscount}
                couponCode={appliedCouponCode}
                showDetails={true}
              />
            </div>

            {/* Right: Guest Details Form */}
            <div className={styles.rightColumn}>
              {/* Guest Information */}
              <div className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Guest Information</h2>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Phone Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Special Requests</h2>
                <p className={styles.requestsSubtitle}>
                  Let us know if you have any special requirements
                </p>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={earlyCheckIn}
                      onChange={(e) => setEarlyCheckIn(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Early Check-in (Subject to availability)</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={lateCheckOut}
                      onChange={(e) => setLateCheckOut(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Late Check-out (Subject to availability)</span>
                  </label>
                </div>
              </div>

              {/* SESSION 64: Coupon Input Component */}
              <CouponInput
                propertyId={bookingData.propertyId}
                bookingAmount={
                  bookingData.baseAmount +
                  bookingData.extraGuestCharges +
                  bookingData.extraChildrenCharges
                }
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
                appliedCouponCode={appliedCouponCode}
                appliedDiscount={couponDiscount}
              />

              {/* Terms & Conditions */}
              <div className={styles.termsCard}>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="/cancellation-policy"
                      target="_blank"
                      className={styles.termsLink}
                    >
                      Cancellation Policy
                    </a>{" "}
                    and Terms & Conditions
                  </span>
                </label>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={loading || !agreeToTerms}
                className={styles.paymentButton}
              >
                {loading ? (
                  <span className={styles.loadingWrapper}>
                    <span className={styles.spinner}></span>
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    <FiCheck /> Confirm & Pay ₹
                    {/* SESSION 64: Calculate total with Session 64 pricing logic */}
                    {(() => {
                      const subtotal =
                        bookingData.baseAmount +
                        bookingData.extraGuestCharges +
                        bookingData.extraChildrenCharges;
                      const bookingAmount = subtotal - couponDiscount;
                      const gstRate = bookingAmount <= 7500 ? 5 : 18;
                      const gstAmount = Math.round(
                        (bookingAmount * gstRate) / 100,
                      );
                      const serviceCharge = Math.round(
                        (bookingAmount * 5) / 100,
                      );
                      const totalAmount =
                        bookingAmount + gstAmount + serviceCharge;
                      return totalAmount.toLocaleString("en-IN");
                    })()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  );
}

export default function BookingReviewPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading...</p>
          </div>
        </div>
      }
    >
      <BookingReviewContent />
    </Suspense>
  );
}
