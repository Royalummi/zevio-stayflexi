import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  IndianRupee,
  Calendar,
  MapPin,
} from "lucide-react";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    loadRazorpayScript();
  }, [bookingId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data.data);
    } catch (error) {
      toast.error("Failed to load booking details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await api.post("/payments/create-order", {
        booking_id: bookingId,
      });

      const { order_id, amount, currency, razorpay_key } =
        orderResponse.data.data;

      // Razorpay options
      const options = {
        key: razorpay_key,
        amount: amount,
        currency: currency,
        name: "Zevio Villa Bookings",
        description: `Booking for ${booking.property_title}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: bookingId,
            });

            toast.success("Payment successful! Booking confirmed.");
            navigate("/booking-success", {
              state: { bookingId: bookingId },
            });
          } catch (error) {
            toast.error("Payment verification failed");
            setProcessing(false);
          }
        },
        prefill: {
          name: booking.user_name,
          email: booking.user_email,
          contact: booking.user_phone,
        },
        theme: {
          color: "#8B5CF6",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment initiation failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <CreditCard className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Secure payment powered by Razorpay
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {booking.property_title}
                </h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{booking.city_name}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Check-in
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(booking.check_in_date)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Check-out
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(booking.check_out_date)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Nights
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {booking.nights}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Base Amount</span>
                  <span>{formatCurrency(booking.base_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>GST</span>
                  <span>{formatCurrency(booking.gst_amount)}</span>
                </div>
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(booking.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-primary dark:text-blue-400">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
                  Secure Payment
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your payment is processed securely through Razorpay. We accept
                  credit cards, debit cards, net banking, UPI, and wallets.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <span>PCI DSS compliant</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <span>Instant booking confirmation</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <span>Email invoice & receipt</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  "Processing..."
                ) : (
                  <>
                    <IndianRupee className="h-5 w-5 mr-2" />
                    Pay {formatCurrency(booking.total_amount)}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By proceeding, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cancellation Policy */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Free cancellation up to 7 days before check-in</li>
              <li>• 50% refund if cancelled 3-7 days before check-in</li>
              <li>• No refund if cancelled within 3 days of check-in</li>
              <li>• Refunds are processed within 5-7 business days</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
