import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Filter,
  Search,
  IndianRupee,
  CheckCircle,
  Clock,
  User,
  Home,
  Upload,
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

export default function VendorSettlements() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentProof, setPaymentProof] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchSettlements();
  }, [filters, pagination.page]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await api.get("/admin/settlements/vendor", { params });
      if (response.data.success) {
        setSettlements(response.data.data.settlements);
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.pagination.total,
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch settlements",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMarkAsPaid = async () => {
    if (!selectedSettlement || !paymentProof.trim()) {
      toast.error("Please enter payment proof");
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await api.post("/admin/settlements/vendor/mark-paid", {
        settlement_id: selectedSettlement.id,
        payment_proof: paymentProof,
      });

      if (response.data.success) {
        toast.success("Settlement marked as paid successfully");
        setShowPaymentDialog(false);
        setSelectedSettlement(null);
        setPaymentProof("");
        fetchSettlements();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to mark settlement as paid",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: {
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Pending",
        icon: Clock,
      },
      paid: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        label: "Paid",
        icon: CheckCircle,
      },
    };
    const config = variants[status] || {
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      label: status,
      icon: Clock,
    };
    const Icon = config.icon;
    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingAmount = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  const paidAmount = settlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Vendor Settlements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and process vendor payments
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by vendor name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Settlements
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settlements.filter((s) => s.status === "pending").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(pendingAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Paid Settlements
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settlements.filter((s) => s.status === "paid").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(paidAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Amount
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                settlements.reduce(
                  (sum, s) => sum + parseFloat(s.amount || 0),
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {settlements.length} settlements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading settlements...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No settlements found</p>
              <p className="text-gray-400 text-sm mt-2">
                {filters.status || filters.search
                  ? "Try adjusting your filters"
                  : "Settlements will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Settlement ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendor Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Guest Paid
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendor Gross
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Settlement Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      GST Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-mono text-xs text-gray-600">
                          {settlement.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {settlement.vendor_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {settlement.vendor_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {settlement.property_title || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Booking: {settlement.booking_id?.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          {formatCurrency(
                            settlement.booking_total_amount ||
                              settlement.booking_total,
                          )}
                        </div>
                        {settlement.booking_base_amount != null && (
                          <div className="text-xs text-gray-400">
                            Base:{" "}
                            {formatCurrency(settlement.booking_base_amount)} +
                            GST: {formatCurrency(settlement.booking_gst_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-blue-600">
                          {formatCurrency(
                            settlement.vendor_gross_amount || settlement.amount,
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {settlement.platform_fee != null ? (
                          <div>
                            <div className="text-red-500 text-xs">
                              Fee: -{formatCurrency(settlement.platform_fee)}
                            </div>
                            <div className="text-red-500 text-xs">
                              GST: -
                              {formatCurrency(settlement.platform_fee_gst)}
                            </div>
                            <div className="font-medium text-red-600 text-xs border-t border-gray-200 pt-1 mt-1">
                              Total: -
                              {formatCurrency(settlement.total_deduction)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Legacy</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(settlement.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Badge
                          className={
                            settlement.is_vendor_gst
                              ? "bg-green-50 text-green-700 border-green-300"
                              : "bg-gray-50 text-gray-600 border-gray-300"
                          }
                        >
                          {settlement.is_vendor_gst ? "GST" : "Non-GST"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getStatusBadge(settlement.status)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(settlement.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {settlement.status === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setShowPaymentDialog(true);
                            }}
                          >
                            Mark as Paid
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-default">
                            ✓ Paid
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && settlements.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} settlements
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

      {/* Mark as Paid Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Settlement as Paid</DialogTitle>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              {/* Settlement Details */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Settlement ID:</span>
                      <span className="font-mono">
                        {selectedSettlement.id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">
                        {selectedSettlement.vendor_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST Status:</span>
                      <Badge
                        className={
                          selectedSettlement.is_vendor_gst
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-600"
                        }
                      >
                        {selectedSettlement.is_vendor_gst
                          ? "GST Registered"
                          : "Non-GST"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span>{selectedSettlement.bank_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-mono">
                        {selectedSettlement.account_number || "N/A"}
                      </span>
                    </div>
                    {selectedSettlement.vendor_gross_amount != null && (
                      <>
                        <div className="border-t pt-2 mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Guest Paid:</span>
                            <span>
                              {formatCurrency(
                                selectedSettlement.booking_total_amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Vendor Gross:</span>
                            <span className="text-blue-600">
                              {formatCurrency(
                                selectedSettlement.vendor_gross_amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">
                              Platform Fee (3%):
                            </span>
                            <span className="text-red-500">
                              -{formatCurrency(selectedSettlement.platform_fee)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">
                              GST on Fee (18%):
                            </span>
                            <span className="text-red-500">
                              -
                              {formatCurrency(
                                selectedSettlement.platform_fee_gst,
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-600 font-medium">
                        Amount to Pay:
                      </span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(selectedSettlement.amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof / Transaction ID *
                </label>
                <Input
                  type="text"
                  placeholder="Enter UPI transaction ID, bank reference, etc."
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: UPI/123456789, NEFT/REF123, etc.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedSettlement(null);
                    setPaymentProof("");
                  }}
                  disabled={processingPayment}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleMarkAsPaid}
                  disabled={processingPayment || !paymentProof.trim()}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
