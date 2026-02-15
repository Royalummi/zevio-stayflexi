/**
 * SESSION 64: ADMIN COUPON MANAGEMENT
 * Create, edit, and manage discount coupons
 */

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Ticket,
  Plus,
  Search,
  Edit,
  Trash2,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

const CouponManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    discount_percentage: "",
    discount_amount: "",
    max_discount_cap: "",
    min_booking_amount: "",
    usage_limit: "",
    per_user_limit: "",
    valid_from: "",
    valid_until: "",
    description: "",
    applicable_properties: "",
  });

  // Fetch coupons
  const fetchCoupons = async () => {
    // Check permission before making API call
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/admin/coupons");
      setCoupons(response.data.data.coupons);
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error fetching coupons:", error);

      // Handle 403 Forbidden specifically
      if (error.response?.status === 403) {
        setPermissionDenied(true);
        toast.error("Access Denied: Admin permission required");
      } else {
        toast.error("Failed to load coupons");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    // Check permission
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      return;
    }

    try {
      const response = await api.get("/admin/coupons/analytics");
      setAnalytics(response.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Don't show error toast for analytics, as it's not critical
    }
  };

  useEffect(() => {
    // Wait for user to be loaded from storage before fetching
    if (!user) return;

    fetchCoupons();
    fetchAnalytics();
  }, [user]);

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && coupon.is_active) ||
      (statusFilter === "inactive" && !coupon.is_active);

    const matchesType = typeFilter === "all" || coupon.type === typeFilter;

    const matchesSearch =
      searchQuery === "" ||
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.description &&
        coupon.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Handle create coupon
  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      type: "percentage",
      discount_percentage: "",
      discount_amount: "",
      max_discount_cap: "",
      min_booking_amount: "",
      usage_limit: "",
      per_user_limit: "",
      valid_from: "",
      valid_until: "",
      description: "",
      applicable_properties: "",
    });
    setShowCouponDialog(true);
  };

  // Handle edit coupon
  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      discount_percentage: coupon.discount_percentage || "",
      discount_amount: coupon.discount_amount || "",
      max_discount_cap: coupon.max_discount_cap || "",
      min_booking_amount: coupon.min_booking_amount || "",
      usage_limit: coupon.usage_limit || "",
      per_user_limit: coupon.per_user_limit || "",
      valid_from: coupon.valid_from
        ? new Date(coupon.valid_from).toISOString().split("T")[0]
        : "",
      valid_until: coupon.valid_until
        ? new Date(coupon.valid_until).toISOString().split("T")[0]
        : "",
      description: coupon.description || "",
      applicable_properties: coupon.applicable_properties
        ? JSON.parse(coupon.applicable_properties).join(", ")
        : "",
    });
    setShowCouponDialog(true);
  };

  // Handle submit coupon
  const handleSubmitCoupon = async () => {
    try {
      setActionLoading(true);

      // Validate
      if (!formData.code) {
        toast.error("Coupon code is required");
        return;
      }

      if (formData.type === "percentage" || formData.type === "first_time") {
        if (
          !formData.discount_percentage ||
          formData.discount_percentage <= 0
        ) {
          toast.error(
            "Discount percentage is required and must be greater than 0",
          );
          return;
        }
      } else if (formData.type === "flat") {
        if (!formData.discount_amount || formData.discount_amount <= 0) {
          toast.error("Discount amount is required and must be greater than 0");
          return;
        }
      }

      // Prepare data
      const submitData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        discount_percentage: formData.discount_percentage
          ? parseFloat(formData.discount_percentage)
          : null,
        discount_amount: formData.discount_amount
          ? parseFloat(formData.discount_amount)
          : null,
        max_discount_cap: formData.max_discount_cap
          ? parseFloat(formData.max_discount_cap)
          : null,
        min_booking_amount: formData.min_booking_amount
          ? parseFloat(formData.min_booking_amount)
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        per_user_limit: formData.per_user_limit
          ? parseInt(formData.per_user_limit)
          : 1,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        description: formData.description || null,
        applicable_properties: formData.applicable_properties
          ? formData.applicable_properties
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : null,
      };

      if (editingCoupon) {
        // Update
        await api.patch(`/admin/coupons/${editingCoupon.id}`, submitData);
        toast.success("Coupon updated successfully");
      } else {
        // Create
        await api.post("/admin/coupons", submitData);
        toast.success("Coupon created successfully");
      }

      setShowCouponDialog(false);
      fetchCoupons();
      fetchAnalytics();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error(error.response?.data?.message || "Failed to save coupon");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete coupon
  const handleDeleteCoupon = async (couponId) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await api.delete(`/admin/coupons/${couponId}`);
      toast.success("Coupon deleted successfully");
      fetchCoupons();
      fetchAnalytics();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (coupon) => {
    try {
      await api.patch(`/admin/coupons/${coupon.id}`, {
        is_active: !coupon.is_active,
      });
      toast.success(
        `Coupon ${!coupon.is_active ? "activated" : "deactivated"}`,
      );
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast.error("Failed to update coupon status");
    }
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const types = {
      percentage: { label: "Percentage", variant: "default" },
      flat: { label: "Flat Amount", variant: "secondary" },
      first_time: { label: "First Time", variant: "outline" },
    };
    const config = types[type] || types.percentage;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Permission Denied UI
  if (permissionDenied) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto bg-red-100 dark:bg-red-900/20 rounded-full p-3 w-fit mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center text-2xl">
              Access Denied
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Required Role:</strong> Admin or Super Admin
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Your Role:</strong> {user?.role || "Unknown"}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please contact your system administrator if you believe this is an
              error.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button onClick={() => navigate("/admin")} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={handleCreateCoupon}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Coupons
              </CardTitle>
              <Ticket className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.overall?.total_coupons || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {analytics.overall?.active_coupons || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.usage?.total_redemptions || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {analytics.usage?.unique_users || 0} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Discount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.usage?.total_discount_given || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Given to customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.overall?.expired_coupons || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Past validity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search coupons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="flat">Flat Amount</SelectItem>
                <SelectItem value="first_time">First Time</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              {filteredCoupons.length} of {coupons.length} coupons
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupon List</CardTitle>
          <CardDescription>
            Manage your discount coupons and track usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
              <p className="text-gray-600 mb-4">
                Create your first coupon to get started
              </p>
              <Button onClick={handleCreateCoupon}>Create Coupon</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono font-semibold">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {coupon.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                      <TableCell>
                        {coupon.type === "percentage" ||
                        coupon.type === "first_time" ? (
                          <div>
                            <div className="font-semibold">
                              {coupon.discount_percentage}%
                            </div>
                            {coupon.max_discount_cap && (
                              <div className="text-xs text-gray-600">
                                Max: {formatCurrency(coupon.max_discount_cap)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-semibold">
                            {formatCurrency(coupon.discount_amount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {coupon.actual_usage || 0}
                          </div>
                          {coupon.usage_limit && (
                            <div className="text-xs text-gray-600">
                              / {coupon.usage_limit} limit
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>From: {formatDate(coupon.valid_from)}</div>
                          <div>To: {formatDate(coupon.valid_until)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={coupon.is_active ? "default" : "secondary"}
                        >
                          {coupon.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Coupon Dialog */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription>
              Configure discount coupon settings and validity
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Coupon Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER2026"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="font-mono"
                disabled={editingCoupon !== null}
              />
              <p className="text-xs text-gray-600">
                Unique code users will enter at checkout
              </p>
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    Percentage Discount
                  </SelectItem>
                  <SelectItem value="flat">Flat Amount Discount</SelectItem>
                  <SelectItem value="first_time">
                    First Time User Discount
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value - Conditional based on type */}
            {formData.type === "percentage" ||
            formData.type === "first_time" ? (
              <div className="grid gap-2">
                <Label htmlFor="discount_percentage">
                  Discount Percentage *
                </Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  placeholder="10"
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percentage: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-600">
                  Enter value between 1-100
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="discount_amount">Discount Amount *</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  placeholder="500"
                  min="1"
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_amount: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-600">Flat discount in rupees</p>
              </div>
            )}

            {/* Max Discount (Percentage only) */}
            {(formData.type === "percentage" ||
              formData.type === "first_time") && (
              <div className="grid gap-2">
                <Label htmlFor="max_discount_cap">Maximum Discount Cap</Label>
                <Input
                  id="max_discount_cap"
                  type="number"
                  placeholder="1000"
                  value={formData.max_discount_cap}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_discount_cap: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-gray-600">
                  Cap the maximum discount amount (optional)
                </p>
              </div>
            )}

            {/* Min Booking Amount */}
            <div className="grid gap-2">
              <Label htmlFor="min_booking_amount">Minimum Booking Amount</Label>
              <Input
                id="min_booking_amount"
                type="number"
                placeholder="2000"
                value={formData.min_booking_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_booking_amount: e.target.value,
                  })
                }
              />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usage_limit">Total Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="100"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="per_user_limit">Per User Limit</Label>
                <Input
                  id="per_user_limit"
                  type="number"
                  placeholder="1"
                  value={formData.per_user_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, per_user_limit: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Short description of the offer..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Applicable Properties */}
            <div className="grid gap-2">
              <Label htmlFor="applicable_properties">
                Applicable Property IDs (Optional)
              </Label>
              <Input
                id="applicable_properties"
                placeholder="prop-id-1, prop-id-2, prop-id-3"
                value={formData.applicable_properties}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicable_properties: e.target.value,
                  })
                }
              />
              <p className="text-xs text-gray-600">
                Leave blank to apply to all properties. Comma-separated IDs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCouponDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitCoupon} disabled={actionLoading}>
              {actionLoading
                ? "Saving..."
                : editingCoupon
                  ? "Update Coupon"
                  : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManagement;
