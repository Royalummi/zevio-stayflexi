import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wallet,
  Download,
  Search,
  Clock,
  CheckCircle,
  IndianRupee,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
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
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";

const VendorSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    total: 0,
    totalCount: 0,
    pendingCount: 0,
    lifetime: 0,
  });

  // searchTerm is applied client-side; only re-fetch when page or server-side filter (status) change.
  useEffect(() => {
    fetchSettlements();
  }, [pagination.page, statusFilter]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const response = await api.get("/vendor/settlements", { params });
      const {
        settlements: fetchedSettlements,
        pagination: paginationData,
        stats: backendStats,
      } = response.data.data;

      // Use aggregate stats from backend (covers all pages, not just current)
      if (backendStats) {
        setStats({
          pending: parseFloat(backendStats.pending_amount || 0),
          total: parseFloat(backendStats.total_amount || 0),
          totalCount: parseInt(backendStats.total || 0),
          pendingCount: parseInt(backendStats.pending || 0),
          lifetime: parseFloat(backendStats.paid_amount || 0),
        });
      }

      setSettlements(fetchedSettlements);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      toast.error("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = visibleSettlements.map((s) => ({
      "Settlement ID": s.id,
      "Booking ID": s.booking_id || "N/A",
      Property: s.property_title || "N/A",
      "Guest Paid": s.booking_total_amount || "N/A",
      "Base Amount": s.booking_base_amount || "N/A",
      "GST Amount": s.booking_gst_amount || "N/A",
      "Vendor Gross": s.vendor_gross_amount || "N/A",
      "Platform Fee": s.platform_fee || "N/A",
      "Platform Fee GST": s.platform_fee_gst || "N/A",
      "Total Deduction": s.total_deduction || "N/A",
      "Settlement Amount": s.amount,
      "GST Registered": s.is_vendor_gst ? "Yes" : "No",
      Status: s.status,
      "Created On": formatDate(s.created_at),
      "Payment Proof": s.payment_proof || "N/A",
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlements-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      paid: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-300",
      },
    };

    const { icon: Icon, className } = config[status] || config.pending;

    return (
      <Badge
        variant="outline"
        className={`${className} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Derive filtered list from raw API data so search bar responds instantly without extra fetches.
  const visibleSettlements = settlements.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.property_title?.toLowerCase().includes(term) ||
      s.booking_id?.toString().includes(searchTerm) ||
      s.id?.toString().includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settlements
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your payment settlements and earnings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={visibleSettlements.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(stats.lifetime)}
            </div>
            <div className="text-sm text-green-600">Lifetime Earnings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.total)}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pending)}
            </div>
            <div className="text-sm text-gray-500">Pending Payout</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalCount}
            </div>
            <div className="text-sm text-gray-500">Total Records</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {stats.pendingCount}
            </div>
            <div className="text-sm text-gray-500">Pending Count</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search settlements..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlements List */}
      {visibleSettlements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No settlements found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Settlements will appear here once bookings are completed"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleSettlements.map((settlement) => (
            <Card
              key={settlement.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Settlement Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Settlement #{settlement.id.slice(0, 8)}
                      </h3>
                      {getStatusBadge(settlement.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Property & Booking */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Property & Booking
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {settlement.property_title || "N/A"}
                        </p>
                        {settlement.booking_id && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Booking: #{settlement.booking_id.slice(0, 8)}
                          </p>
                        )}
                      </div>

                      {/* Settlement Amount */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Settlement Amount
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(settlement.amount)}
                        </p>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Created On
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(settlement.created_at)}
                        </p>
                      </div>

                      {/* Payment Proof */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Payment Proof
                        </p>
                        {settlement.payment_proof ? (
                          <a
                            href={settlement.payment_proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            View Document
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">Not available</p>
                        )}
                      </div>
                    </div>

                    {/* Settlement Breakdown */}
                    {settlement.vendor_gross_amount != null && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Settlement Breakdown
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              Guest Paid
                            </p>
                            <p className="font-medium">
                              {formatCurrency(settlement.booking_total_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              Base Price
                            </p>
                            <p className="font-medium">
                              {formatCurrency(settlement.booking_base_amount)}
                            </p>
                          </div>
                          {parseFloat(settlement.booking_discount_amount) >
                            0 && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Coupon Discount
                              </p>
                              <p className="font-medium text-orange-500">
                                -
                                {formatCurrency(
                                  settlement.booking_discount_amount,
                                )}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              GST
                            </p>
                            <p className="font-medium">
                              {formatCurrency(settlement.booking_gst_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              Your Gross
                            </p>
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(settlement.vendor_gross_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              Service Fee
                            </p>
                            <p className="font-medium text-red-500">
                              -
                              {formatCurrency(
                                settlement.total_deduction ||
                                  parseFloat(settlement.platform_fee || 0) +
                                    parseFloat(
                                      settlement.platform_fee_gst || 0,
                                    ),
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              You Receive
                            </p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(settlement.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={
                              settlement.is_vendor_gst
                                ? "bg-green-50 text-green-700 border-green-300"
                                : "bg-gray-50 text-gray-600 border-gray-300"
                            }
                          >
                            {settlement.is_vendor_gst
                              ? "GST Registered Owner"
                              : "Non-GST Owner"}
                          </Badge>
                        </div>
                      </div>
                    )}
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
            {pagination.total} settlements
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

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Settlement Process
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Settlements are processed after booking completion. Pending
                settlements will be reviewed and approved by admin, then payment
                will be transferred to your registered account within 3-5
                business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettlements;
