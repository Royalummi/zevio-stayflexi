import { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  XCircle,
  MapPin,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchQuery]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings/my");
      const bookingsData = response.data.data || [];
      setBookings(bookingsData);
      calculateStats(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const total = bookingsData.length;
    const confirmed = bookingsData.filter(
      (b) => b.status === "confirmed"
    ).length;
    const completed = bookingsData.filter(
      (b) => b.status === "completed"
    ).length;
    const cancelled = bookingsData.filter(
      (b) => b.status === "cancelled" || b.status === "cancel_requested"
    ).length;

    setStats({
      total,
      upcoming: confirmed,
      completed,
      cancelled,
    });
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => {
        if (statusFilter === "upcoming") {
          return booking.status === "confirmed";
        }
        if (statusFilter === "cancelled") {
          return (
            booking.status === "cancelled" ||
            booking.status === "cancel_requested"
          );
        }
        return booking.status === statusFilter;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((booking) =>
        booking.property?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleCancelRequest = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel-request`);
      toast.success("Cancellation request submitted successfully");
      setShowCancelModal(false);
      fetchBookings();
    } catch (error) {
      console.error("Error canceling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      confirmed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      completed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancel_requested:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_payment: "Pending Payment",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      cancel_requested: "Cancel Requested",
    };
    return labels[status] || status;
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Bookings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and track all your villa bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Upcoming Trips
            </CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.upcoming}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Cancelled
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending_payment">
                    Pending Payment
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          {currentBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No bookings found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start exploring our properties and make your first booking!"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => (window.location.href = "/properties")}>
                  Browse Properties
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {booking.property?.title || "Property"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Booking ID: {booking.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(booking.check_in)}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {new Date(booking.check_in).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                }
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(booking.check_out)}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {new Date(booking.check_out).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                }
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {booking.nights}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {formatCurrency(booking.total_amount)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Base: {formatCurrency(booking.base_amount)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCancelModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredBookings.length)} of{" "}
                    {filteredBookings.length} bookings
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about your booking
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Property
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.property?.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {getStatusLabel(selectedBooking.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Check In
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.check_in)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Check Out
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.check_out)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Number of Nights
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedBooking.nights}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Booking Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.created_at)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Payment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Base Amount
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedBooking.base_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      GST (18%)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedBooking.gst_amount)}
                    </span>
                  </div>
                  {selectedBooking.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>
                        -{formatCurrency(selectedBooking.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {formatCurrency(selectedBooking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                {selectedBooking.status === "confirmed" && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowCancelModal(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Cancellation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to request cancellation for this booking?
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Important:</strong> Cancellation is subject to our
                  refund policy. Refund amount will be calculated based on the
                  number of days before check-in.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Booking ID: {selectedBooking.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Property: {selectedBooking.property?.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount: {formatCurrency(selectedBooking.total_amount)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleCancelRequest(selectedBooking.id)}
                >
                  Request Cancellation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
