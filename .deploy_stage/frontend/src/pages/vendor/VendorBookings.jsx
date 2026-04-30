import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Search,
  Download,
  Eye,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";

const VendorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  // searchTerm and dateFilter are applied client-side on the fetched page data;
  // only re-fetch from API when page or server-side filter (status) change.
  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const response = await api.get("/vendor/bookings", { params });
      const {
        bookings: fetchedBookings,
        pagination: paginationData,
        stats: backendStats,
      } = response.data.data;

      // Use aggregate stats from backend (covers all pages, not just current)
      if (backendStats) {
        setStats({
          total: parseInt(backendStats.total || 0),
          confirmed: parseInt(backendStats.confirmed || 0),
          pending: parseInt(backendStats.pending_payment || 0),
          completed: parseInt(backendStats.completed || 0),
          cancelled: parseInt(backendStats.cancelled || 0),
        });
      }

      setBookings(fetchedBookings);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    const csvData = visibleBookings.map((b) => ({
      "Booking ID": b.id,
      Property: b.property_title,
      Guest: b.guest_name,
      Email: b.guest_email,
      Phone: b.guest_phone || "N/A",
      "Check-in": formatDate(b.check_in),
      "Check-out": formatDate(b.check_out),
      Nights: b.nights,
      Amount: b.total_amount,
      Status: b.status,
      "Booked On": formatDate(b.created_at),
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const config = {
      confirmed: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-300",
      },
      pending_payment: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      completed: {
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 border-blue-300",
      },
      cancelled: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-300",
      },
      cancel_requested: {
        icon: AlertCircle,
        className: "bg-orange-100 text-orange-800 border-orange-300",
      },
    };

    const { icon: Icon, className } = config[status] || config.pending_payment;

    // Fix: use the replaced string for both charAt and slice so all underscores are converted
    const label = status.replace(/_/g, " ");
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

    return (
      <Badge
        variant="outline"
        className={`${className} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {displayLabel}
      </Badge>
    );
  };

  const getBookingTypeLabel = (checkIn, checkOut) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate > today) {
      return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
    } else if (checkInDate <= today && checkOutDate >= today) {
      return <Badge className="bg-purple-100 text-purple-800">Ongoing</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Past</Badge>;
    }
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derive filtered list from raw API data using current filter state.
  // This runs on every render so search/dateFilter respond instantly without extra fetches.
  const visibleBookings = bookings.filter((b) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !b.property_title?.toLowerCase().includes(term) &&
        !b.guest_name?.toLowerCase().includes(term) &&
        !b.guest_email?.toLowerCase().includes(term) &&
        !b.id?.toString().includes(searchTerm)
      )
        return false;
    }
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      if (dateFilter === "upcoming")
        return checkIn > today && b.status === "confirmed";
      if (dateFilter === "ongoing")
        return (
          checkIn <= today && checkOut >= today && b.status === "confirmed"
        );
      if (dateFilter === "past")
        return checkOut < today || b.status === "completed";
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bookings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage guest bookings for your properties
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={visibleBookings.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.confirmed}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.cancelled}
            </div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="cancel_requested">
                  Cancel Requested
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {visibleBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "Bookings will appear here once guests book your properties"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleBookings.map((booking) => (
            <Card
              key={booking.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.property_title}
                      </h3>
                      {getStatusBadge(booking.status)}
                      {getBookingTypeLabel(booking.check_in, booking.check_out)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Guest Info */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Guest Details
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.guest_name || "N/A"}
                        </p>
                        {booking.guest_phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.guest_phone}
                          </p>
                        )}
                        {booking.guest_email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.guest_email}
                          </p>
                        )}
                      </div>

                      {/* Dates */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Stay Duration
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(booking.check_in)}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(booking.check_out)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.nights} night{booking.nights > 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Amount */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Booking Amount
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(booking.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Booked: {formatDate(booking.created_at)}
                        </p>
                      </div>

                      {/* Booking ID */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Booking ID
                        </p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          #{booking.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} bookings
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Property Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Property
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedBooking.property_title}
                </p>
              </div>

              {/* Guest Information */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Guest Information
                </h3>
                <div className="space-y-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Name:</span>{" "}
                    {selectedBooking.guest_name || "N/A"}
                  </p>
                  {selectedBooking.guest_email && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedBooking.guest_email}
                    </p>
                  )}
                  {selectedBooking.guest_phone && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedBooking.guest_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Stay Details */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Stay Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_in)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedBooking.check_out)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Nights</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedBooking.nights}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedBooking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Booking Information
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Booking ID:</span> #
                    {selectedBooking.id}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Booked On:</span>{" "}
                    {formatDate(selectedBooking.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorBookings;
