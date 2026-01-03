import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  CreditCard,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  Receipt,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";

const UserPayments = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
  });

  // Fetch bookings with payment data
  useEffect(() => {
    fetchPayments();
  }, []);

  // Apply filters whenever search or status filter changes
  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings");
      const bookings = response.data.data || [];

      // Extract and flatten payments from bookings
      const allPayments = [];
      bookings.forEach((booking) => {
        if (booking.payments && booking.payments.length > 0) {
          booking.payments.forEach((payment) => {
            allPayments.push({
              ...payment,
              booking_id: booking.id,
              property_title: booking.property?.title || "N/A",
              check_in: booking.check_in,
              check_out: booking.check_out,
              booking_status: booking.status,
              nights: booking.nights,
            });
          });
        }
      });

      setPayments(allPayments);
      calculateStats(allPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error(
        error.response?.data?.message || "Failed to load payment history"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsList) => {
    const successful = paymentsList.filter(
      (p) => p.status === "success"
    ).length;
    const failed = paymentsList.filter((p) => p.status === "failed").length;
    const pending = paymentsList.filter((p) => p.status === "pending").length;
    const totalAmount = paymentsList
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    setStats({
      total: paymentsList.length,
      successful,
      failed,
      pending,
      totalAmount,
    });
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Search filter (property title, payment ID, gateway ID)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.property_title?.toLowerCase().includes(query) ||
          p.id?.toLowerCase().includes(query) ||
          p.gateway_payment_id?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredPayments(filtered);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsDialogOpen(true);
  };

  const handleDownloadInvoice = (payment) => {
    toast.info("Invoice download feature coming soon!");
    // Future: Implement PDF invoice generation/download
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payment History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View all your payment transactions and download invoices
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Payments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Successful
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.successful}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.failed}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by property, payment ID, or gateway ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {filteredPayments.length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No payments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {payments.length === 0
                  ? "You haven't made any payments yet."
                  : "No payments match your current filters."}
              </p>
              {payments.length === 0 && (
                <Button onClick={() => navigate("/properties")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(payment.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {payment.property_title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.nights} night(s)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {payment.id.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{payment.gateway}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {payment.status === "success" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(payment)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment Status
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Payment ID
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedPayment.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gateway
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                      {selectedPayment.gateway}
                    </p>
                  </div>
                  {selectedPayment.gateway_payment_id && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gateway Payment ID
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">
                        {selectedPayment.gateway_payment_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Transaction Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedPayment.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Booking ID
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedPayment.booking_id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Booking Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Property
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedPayment.property_title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check-in
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedPayment.check_in)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check-out
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedPayment.check_out)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nights
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedPayment.nights}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Booking Status
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                      {selectedPayment.booking_status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                {selectedPayment.status === "success" && (
                  <Button
                    onClick={() => handleDownloadInvoice(selectedPayment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPayments;
