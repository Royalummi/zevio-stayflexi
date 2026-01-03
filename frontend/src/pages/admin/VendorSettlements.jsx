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
import { Select } from "../../components/ui/select";
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
          total: response.data.data.total,
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch settlements"
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
        error.response?.data?.message || "Failed to mark settlement as paid"
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: "warning", label: "Pending", icon: Clock },
      paid: { variant: "success", label: "Paid", icon: CheckCircle },
    };
    const config = variants[status] || {
      variant: "default",
      label: status,
      icon: Clock,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingAmount = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.amount, 0);

  const paidAmount = settlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount, 0);

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
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </Select>
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
                settlements.reduce((sum, s) => sum + s.amount, 0)
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
                      Amount
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
                              {settlement.vendor?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {settlement.vendor?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {settlement.booking?.property?.title || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Booking: {settlement.booking?.id?.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(settlement.amount)}
                        </div>
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
                          <Badge variant="success" className="cursor-default">
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
                        {selectedSettlement.vendor?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span>
                        {selectedSettlement.vendor?.bank_details?.bank_name ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-mono">
                        {selectedSettlement.vendor?.bank_details
                          ?.account_number || "N/A"}
                      </span>
                    </div>
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
