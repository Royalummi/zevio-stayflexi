import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Users,
  Baby,
  CreditCard,
  Clock,
  RefreshCw,
  Download,
  Building2,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronUp,
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
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function AdminBookings() {
  const navigate = useNavigate();
  const { bookingId: urlBookingId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    payment_status: "",
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
    total: 0,
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [pagination.page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBookings();
  }, [filters]);

  // Auto-open booking detail dialog when navigated to /admin/bookings/:id
  useEffect(() => {
    if (!urlBookingId || loading) return;
    const found = bookings.find((b) => b.id === urlBookingId);
    if (found) {
      handleViewDetails(found);
    } else {
      // Booking not on current page — fetch it directly
      api
        .get(`/admin/bookings/${urlBookingId}`)
        .then((res) => {
          const b = res.data?.data || res.data;
          if (b) handleViewDetails(b);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBookingId, loading]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.payment_status && {
          payment_status: filters.payment_status,
        }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get("/admin/bookings", { params });
      setBookings(response.data.data?.bookings || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.data?.pagination?.totalPages || 1,
        total: response.data.data?.pagination?.total || 0,
      }));
    } catch (error) {
      toast.error("Failed to fetch bookings");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/bookings/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      payment_status: "",
      from_date: "",
      to_date: "",
      search: "",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_payment: {
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Pending Payment",
      },
      confirmed: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        label: "Confirmed",
      },
      completed: {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        label: "Completed",
      },
      cancel_requested: {
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        label: "Cancel Requested",
      },
      cancelled: {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Cancelled",
      },
    };

    const config = styles[status] || styles.pending_payment;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const styles = {
      pending: {
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        label: "Payment Pending",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      completed: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        label: "Paid",
        icon: <CreditCard className="w-3 h-3 mr-1" />,
      },
      failed: {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Payment Failed",
        icon: <X className="w-3 h-3 mr-1" />,
      },
      refunded: {
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        label: "Refunded",
        icon: <RefreshCw className="w-3 h-3 mr-1" />,
      },
    };

    const config = styles[paymentStatus] || styles.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
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
            View and manage all property bookings ({pagination.total} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_bookings || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <Activity className="w-3 h-3 mr-1" />
                Total Bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.confirmed_bookings || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.completed_bookings || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.cancel_requested || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                Cancel Requested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.cancelled_bookings || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <X className="w-3 h-3 mr-1" />
                Cancelled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_revenue || 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                Total Revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Filters</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Advanced
                {showAdvancedFilters ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Main Filters - Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Booking ID, Customer, Property..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Booking Status
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
                Payment Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={filters.payment_status}
                onChange={(e) =>
                  setFilters({ ...filters, payment_status: e.target.value })
                }
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Check-in From
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
                  Check-in To
                </label>
                <Input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) =>
                    setFilters({ ...filters, to_date: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Bookings ({bookings.length} of {pagination.total})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                No bookings found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Check-in → Check-out</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400 py-4">
                          #{booking.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {booking.user_name}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-gray-900 dark:text-white line-clamp-1 max-w-[200px]">
                            {booking.property_title}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(booking.check_in)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {formatDate(booking.check_out)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {booking.nights} night
                              {booking.nights !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(booking.total_amount)}
                            </span>
                            {booking.discount_amount > 0 && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                -{formatCurrency(booking.discount_amount)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5">
                            {getStatusBadge(booking.status)}
                            {getPaymentStatusBadge(booking.payment_status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking & Status Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Booking ID
                  </p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-white">
                    #{selectedBooking.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Created At
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Booking Status
                  </p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Payment Status
                  </p>
                  {getPaymentStatusBadge(selectedBooking.payment_status)}
                </div>
              </div>

              {/* Customer Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.user_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedBooking.user_email}
                    </p>
                  </div>
                  {selectedBooking.user_phone && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phone
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedBooking.user_phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-purple-500" />
                  Property Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-lg text-gray-900 dark:text-white">
                    {selectedBooking.property_title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {selectedBooking.city_name}
                  </p>
                  {selectedBooking.vendor_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Vendor:</strong> {selectedBooking.vendor_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-500" />
                  Stay Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check-in
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_in)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check-out
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_out)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nights
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedBooking.nights}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Count */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  Guest Information
                </h4>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedBooking.guest_count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Adults
                    </p>
                  </div>
                  <div className="text-center">
                    <User className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedBooking.children_count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Children
                    </p>
                  </div>
                  <div className="text-center">
                    <Baby className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedBooking.infants_count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Infants
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-indigo-500" />
                  Payment Breakdown
                </h4>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Base Amount
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedBooking.base_amount)}
                    </span>
                  </div>
                  {selectedBooking.extra_guest_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Extra Guest Charges
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        +{formatCurrency(selectedBooking.extra_guest_charges)}
                      </span>
                    </div>
                  )}
                  {selectedBooking.extra_children_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Extra Children Charges
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        +
                        {formatCurrency(selectedBooking.extra_children_charges)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      GST (18%)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      +{formatCurrency(selectedBooking.gst_amount)}
                    </span>
                  </div>
                  {selectedBooking.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="font-medium">Discount Applied</span>
                      <span className="font-medium">
                        -{formatCurrency(selectedBooking.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-300 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedBooking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expiry Info for Pending */}
              {selectedBooking.status === "pending_payment" &&
                selectedBooking.payment_expires_at && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <strong>Payment Expires:</strong>{" "}
                        {formatDate(selectedBooking.payment_expires_at)}
                      </p>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                {selectedBooking.status === "cancel_requested" && (
                  <Button variant="destructive" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
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
