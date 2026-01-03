import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Filter,
  Search,
  Eye,
  X,
  IndianRupee,
  MapPin,
  User,
} from "lucide-react";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export default function AdminBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    from_date: "",
    to_date: "",
    search: "",
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get("/admin/bookings", { params });
      setBookings(response.data.data?.bookings || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_payment: { variant: "warning", label: "Pending Payment" },
      confirmed: { variant: "success", label: "Confirmed" },
      completed: { variant: "info", label: "Completed" },
      cancel_requested: { variant: "warning", label: "Cancel Requested" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = styles[status] || styles.pending_payment;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Manage Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all villa bookings
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Status</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancel_requested">Cancel Requested</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) =>
                  setFilters({ ...filters, from_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) =>
                  setFilters({ ...filters, to_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Search
              </label>
              <Input
                placeholder="Booking ID, User name..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Bookings ({bookings.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchBookings}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No bookings found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-700 transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          #{booking.id?.slice(0, 8) || "N/A"}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {booking.user_name} ({booking.user_email})
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Property
                      </p>
                      <p className="font-medium line-clamp-1 text-gray-900 dark:text-white">
                        {booking.property_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Check-in
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(booking.check_in_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Check-out
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Total Amount
                      </p>
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(booking.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Booking ID
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    #{selectedBooking.id?.slice(0, 8) || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Customer Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.user_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.user_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Property Details
                </h4>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedBooking.property_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedBooking.city_name}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Booking Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Check-in</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_in_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Check-out
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_out_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Nights</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.nights}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Created At
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Payment Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-900 dark:text-white">
                    <span>Base Amount</span>
                    <span>{formatCurrency(selectedBooking.base_amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white">
                    <span>GST</span>
                    <span>{formatCurrency(selectedBooking.gst_amount)}</span>
                  </div>
                  {selectedBooking.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>
                        -{formatCurrency(selectedBooking.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <span>Total Amount</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedBooking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                {selectedBooking.booking_status === "cancel_requested" && (
                  <Button variant="destructive" className="flex-1">
                    Process Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
