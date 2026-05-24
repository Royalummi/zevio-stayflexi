import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Filter,
  Search,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Home,
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

export default function ProcessRefunds() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    from_date: "",
    to_date: "",
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(80);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchCancellationRequests();
  }, [filters, pagination.page, activeTab]);

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab === "pending" ? "cancel_requested" : "cancelled",
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await api.get("/admin/bookings", { params });
      if (response.data.success) {
        setBookings(response.data.data.bookings);
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch cancellation requests",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleProcessRefund = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingRefund(true);
      const response = await api.post("/admin/refund", {
        booking_id: selectedBooking.id,
        refund_percentage: refundPercentage,
        notes: notes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success("Booking cancelled. Please complete the bank transfer manually.");
        setShowRefundDialog(false);
        setSelectedBooking(null);
        setNotes("");
        fetchCancellationRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process refund");
    } finally {
      setProcessingRefund(false);
    }
  };

  const calculateRefundAmount = () => {
    if (!selectedBooking) return 0;
    return (
      (parseFloat(selectedBooking.total_amount || 0) * refundPercentage) / 100
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      cancel_requested: { variant: "warning", label: "Cancellation Requested" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Process Refunds
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Handle cancellation requests and process refunds
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by booking ID or user..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) =>
                  handleFilterChange("from_date", e.target.value)
                }
                placeholder="From Date"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange("to_date", e.target.value)}
                placeholder="To Date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Requests
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Refund Amount
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                bookings.reduce(
                  (sum, booking) => sum + parseFloat(booking.total_amount || 0),
                  0,
                ),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Est. Pending Refund
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                bookings.reduce(
                  (sum, booking) =>
                    sum + parseFloat(booking.total_amount || 0),
                  0,
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{activeTab === "pending" ? "Pending Cancellation Requests" : "Processed Refunds"}</CardTitle>
            <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden">
              <button
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "pending" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => { setActiveTab("pending"); setPagination(prev => ({ ...prev, page: 1 })); }}
              >
                Pending
              </button>
              <button
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "processed" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => { setActiveTab("processed"); setPagination(prev => ({ ...prev, page: 1 })); }}
              >
                Processed
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">
                Loading cancellation requests...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No pending cancellation requests
              </p>
              <p className="text-gray-400 text-sm mt-2">
                All refunds have been processed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Check-in
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-mono text-xs text-gray-600">
                          {booking.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {booking.user_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {booking.property_title || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.city_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {formatDate(booking.check_in)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.nights} nights
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(booking.total_amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Paid amount
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {activeTab === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowRefundDialog(true);
                            }}
                          >
                            Process Refund
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" /> Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && bookings.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} {activeTab === "pending" ? "pending requests" : "processed refunds"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={
                    pagination.page * pagination.limit >= pagination.total
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Processing Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Booking Summary */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-mono">
                        {selectedBooking.id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-medium">
                        {selectedBooking.user_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium">
                        {selectedBooking.property_title || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span>{formatDate(selectedBooking.check_in)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedBooking.total_amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refund Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Percentage
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={refundPercentage}
                    onChange={(e) =>
                      setRefundPercentage(Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-600">%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRefundPercentage(50)}
                  >
                    50%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRefundPercentage(75)}
                  >
                    75%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRefundPercentage(80)}
                  >
                    80%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRefundPercentage(100)}
                  >
                    100%
                  </Button>
                </div>
              </div>

              {/* Refund Amount */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Refund Amount:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateRefundAmount())}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* User Bank Details */}
              {selectedBooking.user_bank_details ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                  <p className="font-semibold text-blue-800 flex items-center gap-1 mb-1">
                    <IndianRupee className="h-3.5 w-3.5" /> User Bank Details
                  </p>
                  <p className="text-blue-700"><span className="font-medium">Name:</span> {selectedBooking.user_bank_details.account_holder_name}</p>
                  <p className="text-blue-700"><span className="font-medium">Bank:</span> {selectedBooking.user_bank_details.bank_name}</p>
                  <p className="text-blue-700"><span className="font-medium">Account:</span> {selectedBooking.user_bank_details.account_number}</p>
                  <p className="text-blue-700"><span className="font-medium">IFSC:</span> {selectedBooking.user_bank_details.ifsc_code}</p>
                  {selectedBooking.user_bank_details.branch_name && (
                    <p className="text-blue-700"><span className="font-medium">Branch:</span> {selectedBooking.user_bank_details.branch_name}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  ⚠️ User has not added bank details yet. Contact them before processing the refund.
                </div>
              )}

              {/* Notes / Bank Transfer Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Bank Transfer Reference{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., NEFT transfer ref: XYZ, UPI: 123456..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRefundDialog(false);
                    setSelectedBooking(null);
                    setNotes("");
                  }}
                  disabled={processingRefund}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleProcessRefund}
                  disabled={processingRefund || refundPercentage <= 0}
                >
                  {processingRefund ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process Refund
                    </>
                  )}
                </Button>
              </div>

              {/* Warning */}
              <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  This will cancel the booking and record the refund as pending.
                  Please complete the bank transfer manually using the user's
                  bank details above. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
