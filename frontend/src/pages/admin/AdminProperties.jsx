import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  Building2,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  TrendingUp,
  Clock,
  Ban,
} from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";

const AdminProperties = () => {
  // State management
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending_approval: 0,
    approved: 0,
    inactive: 0,
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch properties and stats
  useEffect(() => {
    fetchProperties();
    fetchStats();
  }, []);

  // Filter properties when filters change
  useEffect(() => {
    filterProperties();
  }, [properties, statusFilter, searchQuery]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/properties?limit=1000");
      setProperties(response.data.properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/properties/stats");
      setStats({
        total: response.data.total_properties || 0,
        pending_approval: response.data.pending_approval || 0,
        approved: response.data.approved || 0,
        inactive: response.data.inactive || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filterProperties = () => {
    if (!properties || !Array.isArray(properties)) {
      setFilteredProperties([]);
      return;
    }

    let filtered = [...properties];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (property) => property.status === statusFilter
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(query) ||
          property.vendor_name?.toLowerCase().includes(query) ||
          property.city_name?.toLowerCase().includes(query)
      );
    }

    setFilteredProperties(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewDetails = async (property) => {
    try {
      const response = await api.get(`/admin/properties/${property.id}`);
      setSelectedProperty(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching property details:", error);
      toast.error("Failed to fetch property details");
    }
  };

  const handleApprove = (property) => {
    setSelectedProperty(property);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/properties/${selectedProperty.id}/status`, {
        status: "approved",
      });
      toast.success("Property approved successfully");
      setShowApproveModal(false);
      fetchProperties();
      fetchStats();
    } catch (error) {
      console.error("Error approving property:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve property"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (property) => {
    setSelectedProperty(property);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/properties/${selectedProperty.id}/status`, {
        status: "inactive",
        rejection_reason: rejectionReason,
      });
      toast.success("Property marked as inactive");
      setShowRejectModal(false);
      setRejectionReason("");
      fetchProperties();
      fetchStats();
    } catch (error) {
      console.error("Error rejecting property:", error);
      toast.error(error.response?.data?.message || "Failed to reject property");
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      pending_approval:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: "Draft",
      pending_approval: "Pending Approval",
      approved: "Approved",
      inactive: "Inactive",
    };
    return labels[status] || status;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
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
          Properties Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage all properties, approve submissions, and monitor performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
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
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending_approval}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Inactive
            </CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by property name, vendor, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items per page */}
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Properties List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "No properties found"
                  : "No properties yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Properties will appear here once vendors add them"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                              {property.thumbnail ? (
                                <img
                                  src={property.thumbnail}
                                  alt={property.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {property.image_count || 0} images
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{property.city_name || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {property.vendor_name || "N/A"}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {property.vendor_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {property.employee_name || "Not assigned"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(property.price_per_night)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{property.gst_percentage}% GST
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(property.status)}>
                            {getStatusLabel(property.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(property.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(property)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {property.status === "pending_approval" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(property)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(property)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
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
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredProperties.length)} of{" "}
                    {filteredProperties.length} properties
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
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
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Property Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
            <DialogDescription>
              Complete information about this property
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6">
              {/* Image Gallery */}
              {selectedProperty.images &&
                selectedProperty.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Images ({selectedProperty.images.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedProperty.images.map((image, index) => (
                        <div
                          key={image.id}
                          className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.image_url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Property Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Property Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Title
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.title}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Location
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.city_name},{" "}
                        {selectedProperty.city_state}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Price per Night
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(selectedProperty.price_per_night)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">GST</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.gst_percentage}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      <dd>
                        <Badge
                          className={getStatusColor(selectedProperty.status)}
                        >
                          {getStatusLabel(selectedProperty.status)}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Vendor & Employee</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Vendor Name
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.vendor_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Vendor Email
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.vendor_email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Vendor Phone
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.vendor_phone || "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Employee (Onboarded by)
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedProperty.employee_name || "Not assigned"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedProperty.description || "No description provided"}
                </p>
              </div>

              {/* Booking Stats */}
              {selectedProperty.booking_stats && (
                <div>
                  <h3 className="font-semibold mb-2">Booking Statistics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Bookings
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedProperty.booking_stats.total_bookings || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Confirmed
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {selectedProperty.booking_stats.confirmed_bookings || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Completed
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {selectedProperty.booking_stats.completed_bookings || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Revenue
                      </div>
                      <div className="text-lg font-semibold text-purple-600">
                        {formatCurrency(
                          selectedProperty.booking_stats.total_revenue || 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedProperty.status === "pending_approval" && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedProperty);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Property
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprove(selectedProperty);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Property
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this property? It will become
              visible to users on the platform.
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    {selectedProperty.title}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    by {selectedProperty.vendor_name} •{" "}
                    {selectedProperty.city_name}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(selectedProperty.price_per_night)}/night
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={confirmApprove}
              disabled={actionLoading}
            >
              {actionLoading ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property. The vendor
              will be notified.
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      {selectedProperty.title}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      by {selectedProperty.vendor_name}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <Textarea
                  placeholder="Explain why this property is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
