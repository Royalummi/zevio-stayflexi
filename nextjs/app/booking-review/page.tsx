"use client";

import { useEffect, useState } from "react";
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

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BookingReviewPage() {
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
            propertyName: booking.property_title,
            propertyLocation: `${booking.city_name}, ${booking.city_state}`,
            propertyImage:
              booking.property_images?.[0]?.image_url || "/placeholder.jpg",
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
          });
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
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        setLoading(false);
        return;
      }

      // Create booking and get Razorpay order
      const response = await api.post("/bookings", {
        property_id: bookingData?.propertyId,
        check_in: bookingData?.checkIn,
        check_out: bookingData?.checkOut,
        guest_count: bookingData?.adults,
        children_count: bookingData?.children,
        infants_count: 0,
      });

      const { booking_id, razorpay_order_id, amount, isUpdate } =
        response.data.data;

      // Show appropriate message if booking was updated
      if (isUpdate) {
        toast.info(
          "Your pending booking has been updated with new dates/guests",
        );
      }

      // ============================================
      // TEST MODE: Bypass Razorpay for local testing
      // Only trigger test mode if using dummy key or test order
      // ============================================
      const isTestMode =
        razorpay_order_id?.startsWith("test_order_") ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "rzp_test_dummykey123456";

      console.log("Payment mode:", isTestMode ? "TEST" : "LIVE");
      console.log("Razorpay Key:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      console.log("Order ID:", razorpay_order_id);

      if (isTestMode) {
        console.log("🧪 TEST MODE: Simulating successful payment");

        // Simulate payment success directly
        try {
          const verifyResponse = await api.post("/payments/verify", {
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: `test_payment_${Date.now()}`,
            razorpay_signature: "test_signature",
            booking_id: booking_id,
          });

          if (verifyResponse.data.success) {
            toast.success("Payment successful! (Test Mode)");
            clearBookingData();
            router.push(`/booking-success?bookingId=${booking_id}`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Payment verification failed";
          toast.error(errorMessage);
        }
        setLoading(false);
        return;
      }

      // ============================================
      // LIVE MODE: Use real Razorpay
      // ============================================

      // Initialize Razorpay
      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummykey123456", // Use environment variable
        amount: amount, // Amount in paise
        currency: "INR",
        name: "Zevio",
        description: `Booking for ${bookingData?.propertyName}`,
        order_id: razorpay_order_id,
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#2FA4A9",
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Verify payment
            const verifyResponse = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking_id,
            });

            if (verifyResponse.data.success) {
              toast.success("Payment successful!");
              clearBookingData();
              router.push(`/booking-success?bookingId=${booking_id}`);
            }
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Payment verification failed";
            toast.error(errorMessage);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.warning("Payment cancelled");
            setLoading(false);
          },
        },
      };

      interface RazorpayOptions {
        key: string;
        amount: number;
        currency: string;
        name: string;
        description: string;
        order_id: string;
        prefill: {
          name: string;
          email: string;
          contact: string;
        };
        theme: {
          color: string;
        };
        handler: (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => void;
        modal: {
          ondismiss: () => void;
        };
      }

      interface RazorpayWindow extends Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
      }
      const razorpay = new (window as unknown as RazorpayWindow).Razorpay(
        options,
      );
      razorpay.open();
    } catch (error: unknown) {
      console.error("Booking error:", error);

      // Extract error message from Axios error
      let errorMessage = "Failed to create booking";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              error?: string;
            };
          };
          message?: string;
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
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

              {/* Price Breakdown Card */}
              <div className={styles.priceCard}>
                <h2 className={styles.sectionTitle}>Price Breakdown</h2>
                <div className={styles.priceBreakdown}>
                  <div className={styles.priceRow}>
                    <span>
                      ₹{bookingData.pricePerNight.toLocaleString("en-IN")} ×{" "}
                      {bookingData.nights}{" "}
                      {bookingData.nights === 1 ? "night" : "nights"}
                      <span className={styles.priceNote}>
                        {" "}
                        (Base price for {bookingData.minGuests}{" "}
                        {bookingData.minGuests === 1 ? "guest" : "guests"}
                        {bookingData.minChildren > 0 &&
                          ` + ${bookingData.minChildren} ${
                            bookingData.minChildren === 1 ? "child" : "children"
                          }`}
                        )
                      </span>
                    </span>
                    <span>
                      ₹{bookingData.baseAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {bookingData.extraGuestCharges > 0 && (
                    <div className={styles.priceRow}>
                      <span>
                        Extra guest charges
                        <span className={styles.priceNote}>
                          {" "}
                          (
                          {Math.max(
                            0,
                            bookingData.adults - bookingData.minGuests,
                          )}{" "}
                          additional{" "}
                          {Math.max(
                            0,
                            bookingData.adults - bookingData.minGuests,
                          ) === 1
                            ? "adult"
                            : "adults"}{" "}
                          × ₹
                          {bookingData.extraGuestCharge.toLocaleString("en-IN")}{" "}
                          × {bookingData.nights}{" "}
                          {bookingData.nights === 1 ? "night" : "nights"})
                        </span>
                      </span>
                      <span>
                        ₹{bookingData.extraGuestCharges.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {bookingData.extraChildrenCharges > 0 && (
                    <div className={styles.priceRow}>
                      <span>
                        Extra children charges
                        <span className={styles.priceNote}>
                          {" "}
                          (
                          {Math.max(
                            0,
                            bookingData.children - bookingData.minChildren,
                          )}{" "}
                          additional{" "}
                          {Math.max(
                            0,
                            bookingData.children - bookingData.minChildren,
                          ) === 1
                            ? "child"
                            : "children"}{" "}
                          × ₹
                          {bookingData.extraChildCharge.toLocaleString("en-IN")}{" "}
                          × {bookingData.nights}{" "}
                          {bookingData.nights === 1 ? "night" : "nights"})
                        </span>
                      </span>
                      <span>
                        ₹
                        {bookingData.extraChildrenCharges.toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  )}
                  <div className={styles.priceRow}>
                    <span>GST (18%)</span>
                    <span>
                      ₹{bookingData.gstAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={styles.priceRowTotal}>
                    <span>Total Amount</span>
                    <span>
                      ₹{bookingData.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
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
                    {bookingData.totalAmount.toLocaleString("en-IN")}
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
