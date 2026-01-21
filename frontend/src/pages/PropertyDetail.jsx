import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  Calendar,
  Users,
  Check,
  Home,
  Star,
} from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { formatCurrency, formatDate } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingData, setBookingData] = useState({
    check_in: "",
    check_out: "",
    coupon_code: "",
    guest_count: 1,
    children_count: 0,
    infants_count: 0,
  });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (bookingData.check_in && bookingData.check_out) {
      checkAvailability();
    }
  }, [bookingData.check_in, bookingData.check_out]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await api.get(`/public/property/${id}`);
      setProperty(response.data.data);
    } catch (error) {
      toast.error("Failed to load property details");
      navigate("/properties");
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const response = await api.get("/public/availability", {
        params: {
          property_id: id,
          check_in: bookingData.check_in,
          check_out: bookingData.check_out,
        },
      });
      setAvailability(response.data.data);
    } catch (error) {
      console.error("Availability check failed:", error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const calculateNights = () => {
    if (!bookingData.check_in || !bookingData.check_out) return 0;
    const checkIn = new Date(bookingData.check_in);
    const checkOut = new Date(bookingData.check_out);
    const diff = checkOut - checkIn;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (!nights || !property) return { base: 0, gst: 0, total: 0 };

    const base = property.price_per_night * nights;

    // Calculate extra guest charges
    let extraGuestCharges = 0;
    if (property.min_guests && property.extra_guest_charge) {
      const extraGuests = Math.max(
        0,
        bookingData.guest_count - property.min_guests
      );
      extraGuestCharges = extraGuests * property.extra_guest_charge * nights;
    }

    // Calculate extra children charges
    let extraChildrenCharges = 0;
    if (property.min_children !== undefined && property.extra_child_charge) {
      const extraChildren = Math.max(
        0,
        bookingData.children_count - (property.min_children || 0)
      );
      extraChildrenCharges =
        extraChildren * property.extra_child_charge * nights;
    }

    // Infants are always FREE - no charges

    const subtotal = base + extraGuestCharges + extraChildrenCharges;
    const gst = (subtotal * property.gst_percentage) / 100;
    const total = subtotal + gst;

    return {
      base,
      extraGuestCharges,
      extraChildrenCharges,
      subtotal,
      gst,
      total,
      nights,
    };
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to make a booking");
      navigate("/login");
      return;
    }

    if (!bookingData.check_in || !bookingData.check_out) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (!availability?.available) {
      toast.error("Property is not available for selected dates");
      return;
    }

    // Validate guest count
    if (bookingData.guest_count < 1) {
      toast.error("At least 1 guest is required");
      return;
    }

    if (property.max_guests && bookingData.guest_count > property.max_guests) {
      toast.error(`Maximum ${property.max_guests} guests allowed`);
      return;
    }

    if (
      property.max_children &&
      bookingData.children_count > property.max_children
    ) {
      toast.error(`Maximum ${property.max_children} children allowed`);
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post("/bookings", {
        property_id: id,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guest_count: bookingData.guest_count,
        children_count: bookingData.children_count,
        infants_count: bookingData.infants_count,
        coupon_code: bookingData.coupon_code || undefined,
      });

      const bookingId = response.data.data.id;
      toast.success("Booking created! Redirecting to payment...");
      navigate(`/payment/${bookingId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Property not found</p>
      </div>
    );
  }

  const pricing = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                {/* Main Image */}
                <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[selectedImage]?.image_url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-white text-gray-900">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Verified Property
                  </Badge>
                </div>

                {/* Thumbnails */}
                {property.images && property.images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {property.images.map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                          selectedImage === index
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={img.image_url}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {property.title}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="text-lg">{property.city_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Starting from
                    </p>
                    <p className="text-3xl font-bold text-primary dark:text-blue-400">
                      {formatCurrency(property.price_per_night)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      per night
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    About this property
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {property.description}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      WiFi
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Pool
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Parking
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Kitchen
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book Your Stay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Check-in
                  </label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingData.check_in}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_in: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Check-out
                  </label>
                  <Input
                    type="date"
                    min={
                      bookingData.check_in ||
                      new Date().toISOString().split("T")[0]
                    }
                    value={bookingData.check_out}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_out: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Guest Counters */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Adults/Guests */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Users className="h-4 w-4 inline mr-1" />
                        Adults
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Age 13+
                        {property.min_guests &&
                          ` • Minimum ${property.min_guests} required`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            guest_count: Math.max(
                              1,
                              bookingData.guest_count - 1
                            ),
                          })
                        }
                        disabled={bookingData.guest_count <= 1}
                      >
                        -
                      </Button>
                      <span className="text-base font-medium min-w-[2rem] text-center text-gray-900 dark:text-white">
                        {bookingData.guest_count}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            guest_count: bookingData.guest_count + 1,
                          })
                        }
                        disabled={
                          property.max_guests &&
                          bookingData.guest_count >= property.max_guests
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Children
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Age 3-12
                        {property.extra_child_charge > 0 &&
                          ` • ₹${property.extra_child_charge}/night extra`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            children_count: Math.max(
                              0,
                              bookingData.children_count - 1
                            ),
                          })
                        }
                        disabled={bookingData.children_count <= 0}
                      >
                        -
                      </Button>
                      <span className="text-base font-medium min-w-[2rem] text-center text-gray-900 dark:text-white">
                        {bookingData.children_count}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            children_count: bookingData.children_count + 1,
                          })
                        }
                        disabled={
                          property.max_children &&
                          bookingData.children_count >= property.max_children
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Infants
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Age 0-2 •{" "}
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          FREE
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            infants_count: Math.max(
                              0,
                              bookingData.infants_count - 1
                            ),
                          })
                        }
                        disabled={bookingData.infants_count <= 0}
                      >
                        -
                      </Button>
                      <span className="text-base font-medium min-w-[2rem] text-center text-gray-900 dark:text-white">
                        {bookingData.infants_count}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() =>
                          setBookingData({
                            ...bookingData,
                            infants_count: bookingData.infants_count + 1,
                          })
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Availability Status */}
                {bookingData.check_in && bookingData.check_out && (
                  <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-700">
                    {checkingAvailability ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Checking availability...
                      </p>
                    ) : availability ? (
                      availability.available ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Available for booking
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Not available for selected dates
                        </p>
                      )
                    ) : null}
                  </div>
                )}

                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Coupon Code (Optional)
                  </label>
                  <Input
                    placeholder="Enter coupon code"
                    value={bookingData.coupon_code}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        coupon_code: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Price Breakdown */}
                {pricing.nights > 0 && (
                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        {formatCurrency(property.price_per_night)} ×{" "}
                        {pricing.nights}{" "}
                        {pricing.nights === 1 ? "night" : "nights"}
                      </span>
                      <span>{formatCurrency(pricing.base)}</span>
                    </div>

                    {pricing.extraGuestCharges > 0 && (
                      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>
                          Extra guest charges (
                          {Math.max(
                            0,
                            bookingData.guest_count - (property.min_guests || 0)
                          )}{" "}
                          × ₹{property.extra_guest_charge} × {pricing.nights})
                        </span>
                        <span>{formatCurrency(pricing.extraGuestCharges)}</span>
                      </div>
                    )}

                    {pricing.extraChildrenCharges > 0 && (
                      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>
                          Extra children charges (
                          {Math.max(
                            0,
                            bookingData.children_count -
                              (property.min_children || 0)
                          )}{" "}
                          × ₹{property.extra_child_charge} × {pricing.nights})
                        </span>
                        <span>
                          {formatCurrency(pricing.extraChildrenCharges)}
                        </span>
                      </div>
                    )}

                    {bookingData.infants_count > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Infants ({bookingData.infants_count})</span>
                        <span className="font-medium">FREE</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>GST ({property.gst_percentage}%)</span>
                      <span>{formatCurrency(pricing.gst)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>{formatCurrency(pricing.total)}</span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    !availability?.available ||
                    bookingLoading ||
                    !bookingData.check_in ||
                    !bookingData.check_out
                  }
                  onClick={handleBooking}
                >
                  {bookingLoading ? "Processing..." : "Book Now"}
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  You won't be charged yet. Payment will be processed on the
                  next screen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
