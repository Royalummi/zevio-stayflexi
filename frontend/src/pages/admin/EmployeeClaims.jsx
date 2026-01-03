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
  XCircle,
  User,
  TrendingUp,
  AlertCircle,
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

export default function EmployeeClaims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [action, setAction] = useState(""); // 'approve' or 'reject'
  const [paymentProof, setPaymentProof] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchClaims();
  }, [filters, pagination.page]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await api.get("/admin/claims/employee", { params });
      if (response.data.success) {
        setClaims(response.data.data.claims);
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.total,
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch employee claims"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleProcessClaim = async () => {
    if (!selectedClaim || !action) return;

    if (action === "pay" && !paymentProof.trim()) {
      toast.error("Please enter payment proof");
      return;
    }

    try {
      setProcessing(true);
      const response = await api.post("/admin/claims/employee/process", {
        claim_id: selectedClaim.id,
        action,
        payment_proof: action === "pay" ? paymentProof : undefined,
      });

      if (response.data.success) {
        toast.success(`Claim ${action}d successfully`);
        setShowActionDialog(false);
        setSelectedClaim(null);
        setAction("");
        setPaymentProof("");
        fetchClaims();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} claim`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: "warning", label: "Pending", icon: Clock },
      approved: { variant: "info", label: "Approved", icon: CheckCircle },
      paid: { variant: "success", label: "Paid", icon: CheckCircle },
      rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
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

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");
  const totalPendingAmount = pendingClaims.reduce(
    (sum, c) => sum + c.points_claimed,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Employee Claims
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee incentive claims and payouts
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by employee name..."
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
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Claims
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(totalPendingAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved Claims
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedClaims.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(
                approvedClaims.reduce((sum, c) => sum + c.points_claimed, 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Paid Claims
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "paid").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(
                claims
                  .filter((c) => c.status === "paid")
                  .reduce((sum, c) => sum + c.points_claimed, 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Amount
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                claims.reduce((sum, c) => sum + c.points_claimed, 0)
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{claims.length} claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No claims found</p>
              <p className="text-gray-400 text-sm mt-2">
                {filters.status || filters.search
                  ? "Try adjusting your filters"
                  : "Claims will appear here when employees submit them"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Claim ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Points Claimed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payout Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-mono text-xs text-gray-600">
                          {claim.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {claim.employee?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {claim.employee?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-gray-400" />
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(claim.points_claimed)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-xs">
                          {claim.payout_details?.method || "N/A"}
                          {claim.payout_details?.upi_id && (
                            <div className="text-gray-500">
                              UPI: {claim.payout_details.upi_id}
                            </div>
                          )}
                          {claim.payout_details?.account_number && (
                            <div className="text-gray-500">
                              A/C: {claim.payout_details.account_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(claim.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {claim.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setAction("approve");
                                setShowActionDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setAction("reject");
                                setShowActionDialog(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : claim.status === "approved" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setAction("pay");
                              setShowActionDialog(true);
                            }}
                          >
                            Mark as Paid
                          </Button>
                        ) : (
                          <Badge
                            variant={
                              claim.status === "paid"
                                ? "success"
                                : "destructive"
                            }
                            className="cursor-default"
                          >
                            {claim.status === "paid" ? "✓ Paid" : "✗ Rejected"}
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
          {!loading && claims.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} claims
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

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Approve Claim"}
              {action === "reject" && "Reject Claim"}
              {action === "pay" && "Mark Claim as Paid"}
            </DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              {/* Claim Details */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim ID:</span>
                      <span className="font-mono">
                        {selectedClaim.id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee:</span>
                      <span className="font-medium">
                        {selectedClaim.employee?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedClaim.employee?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{selectedClaim.employee?.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-600 font-medium">
                        Points to Pay:
                      </span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(selectedClaim.points_claimed)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Details */}
              {selectedClaim.payout_details && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Payout Details</h4>
                    <div className="space-y-1 text-sm">
                      {selectedClaim.payout_details.method && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium">
                            {selectedClaim.payout_details.method}
                          </span>
                        </div>
                      )}
                      {selectedClaim.payout_details.upi_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">UPI ID:</span>
                          <span className="font-mono">
                            {selectedClaim.payout_details.upi_id}
                          </span>
                        </div>
                      )}
                      {selectedClaim.payout_details.account_number && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account:</span>
                            <span className="font-mono">
                              {selectedClaim.payout_details.account_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">IFSC:</span>
                            <span className="font-mono">
                              {selectedClaim.payout_details.ifsc}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Proof (only for 'pay' action) */}
              {action === "pay" && (
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
              )}

              {/* Warning/Info Messages */}
              {action === "approve" && (
                <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Approving this claim will allow you to process payment. The
                    employee will be notified.
                  </p>
                </div>
              )}

              {action === "reject" && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Rejecting this claim is permanent. The employee will be
                    notified and will need to submit a new claim.
                  </p>
                </div>
              )}

              {action === "pay" && (
                <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Make sure you have transferred the amount to the employee
                    before marking as paid. This action cannot be undone.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowActionDialog(false);
                    setSelectedClaim(null);
                    setAction("");
                    setPaymentProof("");
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleProcessClaim}
                  disabled={
                    processing || (action === "pay" && !paymentProof.trim())
                  }
                  variant={action === "reject" ? "destructive" : "default"}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {action === "approve" && (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {action === "reject" && (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {action === "pay" && (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
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
