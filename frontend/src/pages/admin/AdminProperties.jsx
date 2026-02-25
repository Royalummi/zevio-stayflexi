import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import PropertyViewEditModal from "../../components/admin/PropertyViewEditModal";
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
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Grid3x3,
  List,
  SlidersHorizontal,
  Home,
  Bed,
  Bath,
  Users,
  Wifi,
  Car,
  CalendarDays,
  Sparkles,
  Shield,
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
import PropertyTypeSelectionModal from "../../components/admin/PropertyTypeSelectionModal";

const AdminProperties = () => {
  const navigate = useNavigate();

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
  const [cityFilter, setCityFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [bedroomsFilter, setBedroomsFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dropdown data
  const [cities, setCities] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Modal states
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Villa duration discount modal states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountProperty, setDiscountProperty] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discount_3_5_days: 0,
    discount_6_14_days: 0,
    discount_15_plus_days: 0,
  });
  const [discountSaving, setDiscountSaving] = useState(false);

  // Fetch properties and stats with staggered delays to avoid rate limiting
  useEffect(() => {
    fetchProperties();
    // Stagger API calls to avoid rate limiting
    setTimeout(() => fetchStats(), 300);
    setTimeout(() => fetchCities(), 600);
    setTimeout(() => fetchVendors(), 900);
  }, []);

  // Filter properties when filters change
  useEffect(() => {
    filterProperties();
  }, [
    properties,
    statusFilter,
    cityFilter,
    vendorFilter,
    bedroomsFilter,
    priceRange,
    searchQuery,
  ]);

  const fetchProperties = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await api.get("/admin/properties?limit=1000");

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data.properties)
      ) {
        setProperties(response.data.data.properties);
      } else {
        console.warn("Unexpected API response format:", response.data);
        setProperties([]);
        setTimeout(() => {
          toast.warning("Properties data format unexpected");
        }, 0);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (status === 429) {
          // Rate limit exceeded - retry with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(
              `Rate limited. Retrying in ${delay}ms... Attempt ${retryCount + 1}`,
            );
            setTimeout(() => {
              toast.info("Too many requests. Retrying...");
            }, 0);
            setTimeout(() => {
              fetchProperties(retryCount + 1);
            }, delay);
          } else {
            setProperties([]);
            setTimeout(() => {
              toast.error(
                "Rate limit exceeded. Please wait a moment and refresh.",
              );
            }, 0);
          }
        } else if (status === 401) {
          setProperties([]);
          setTimeout(() => {
            toast.error("Session expired. Please login again.");
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }, 0);
        } else if (status === 500 && retryCount < 2) {
          console.log(`Retrying... Attempt ${retryCount + 1}`);
          setTimeout(() => {
            toast.info("Retrying to fetch properties...");
          }, 0);
          setTimeout(() => {
            fetchProperties(retryCount + 1);
          }, 1000);
        } else if (status === 500) {
          setProperties([]);
          setTimeout(() => {
            toast.error("Server error. Please contact support.");
          }, 0);
        } else {
          setProperties([]);
          setTimeout(() => {
            toast.error(`Failed to fetch properties: ${message}`);
          }, 0);
        }
      } else if (error.request) {
        setProperties([]);
        setTimeout(() => {
          toast.error(
            "Cannot connect to server. Please check your connection.",
          );
        }, 0);
      } else {
        setProperties([]);
        setTimeout(() => {
          toast.error("Failed to fetch properties");
        }, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (retryCount = 0) => {
    try {
      const response = await api.get("/admin/properties/stats");
      const stats = response.data.data;
      setStats({
        total: stats.total_properties || 0,
        pending_approval: stats.pending_approval || 0,
        approved: stats.approved || 0,
        inactive: stats.inactive || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Handle 429 rate limit errors
      if (error.response?.status === 429 && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchStats(retryCount + 1), delay);
      }
    }
  };

  const fetchCities = async (retryCount = 0) => {
    try {
      const response = await api.get("/admin/cities");
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
      // Handle 429 rate limit errors
      if (error.response?.status === 429 && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchCities(retryCount + 1), delay);
      }
    }
  };

  const fetchVendors = async (retryCount = 0) => {
    try {
      const response = await api.get("/admin/vendors");
      setVendors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      // Handle 429 rate limit errors
      if (error.response?.status === 429 && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchVendors(retryCount + 1), delay);
      }
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
        (property) => property.status === statusFilter,
      );
    }

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((property) => property.city_id === cityFilter);
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter(
        (property) => property.vendor_id === vendorFilter,
      );
    }

    // Bedrooms filter
    if (bedroomsFilter !== "all") {
      filtered = filtered.filter(
        (property) => property.bedrooms === parseInt(bedroomsFilter),
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(
        (property) => property.price_per_night >= parseFloat(priceRange.min),
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(
        (property) => property.price_per_night <= parseFloat(priceRange.max),
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(query) ||
          property.vendor_name?.toLowerCase().includes(query) ||
          property.city_name?.toLowerCase().includes(query),
      );
    }

    setFilteredProperties(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
    setVendorFilter("all");
    setBedroomsFilter("all");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
  };

  const handleViewDetails = (property) => {
    // New smart modal fetches its own data
    setSelectedProperty(property);
    setShowDetailsModal(true);
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
        error.response?.data?.message || "Failed to approve property",
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

  const handleAddProperty = () => {
    // Open property type selection modal instead of direct navigation
    setShowPropertyTypeModal(true);
  };

  const handleEditProperty = (property) => {
    navigate(`/admin/properties/${property.id}/edit`);
  };

  const handleDeleteProperty = async (property) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${property.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/admin/properties/${property.id}`);
      toast.success("Property deleted successfully");
      fetchProperties();
      fetchStats();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error(error.response?.data?.message || "Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Villa Duration Discounts ──
  const handleEditDiscounts = (property) => {
    setDiscountProperty(property);
    setDiscountForm({
      discount_3_5_days: parseFloat(property.discount_3_5_days) || 0,
      discount_6_14_days: parseFloat(property.discount_6_14_days) || 0,
      discount_15_plus_days: parseFloat(property.discount_15_plus_days) || 0,
    });
    setShowDiscountModal(true);
  };

  const handleSaveDiscounts = async () => {
    if (!discountProperty) return;
    try {
      setDiscountSaving(true);
      await api.patch(`/admin/properties/${discountProperty.id}/pricing`, {
        discount_3_5_days: parseFloat(discountForm.discount_3_5_days) || 0,
        discount_6_14_days: parseFloat(discountForm.discount_6_14_days) || 0,
        discount_15_plus_days:
          parseFloat(discountForm.discount_15_plus_days) || 0,
      });
      toast.success("Villa duration discounts updated!");
      setShowDiscountModal(false);
      fetchProperties();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update discounts",
      );
    } finally {
      setDiscountSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Properties Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all properties, approve submissions, and monitor performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/cancellation-policies")}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
            size="lg"
          >
            <Shield className="h-5 w-5 mr-2" />
            Cancellation Policies
          </Button>
          <Button
            onClick={handleAddProperty}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </Button>
        </div>
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
          <div className="space-y-4">
            {/* Main Filter Row */}
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

              {/* Advanced Filters Toggle */}
              <Button
                variant={showAdvancedFilters ? "default" : "outline"}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full md:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? "Hide" : "Show"} Filters
              </Button>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="w-full md:w-auto"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="w-full md:w-auto"
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
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

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vendor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor
                  </label>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bedrooms
                  </label>
                  <Select
                    value={bedroomsFilter}
                    onValueChange={setBedroomsFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Properties List or Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Properties {viewMode === "list" ? "List" : "Grid"}
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
          ) : viewMode === "list" ? (
            <>
              {/* List View (Table) */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Vendor</TableHead>
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
                                  src={
                                    property.thumbnail.startsWith("http://") ||
                                    property.thumbnail.startsWith("https://")
                                      ? property.thumbnail
                                      : `${import.meta.env.VITE_API_URL || "https://api.zevio.cloud"}${property.thumbnail}`
                                  }
                                  alt={property.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling?.classList.remove(
                                      "hidden",
                                    );
                                  }}
                                />
                              ) : null}
                              <ImageIcon
                                className={`h-6 w-6 text-gray-400 ${property.thumbnail ? "hidden" : ""}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {property.bedrooms || 0} Bed •{" "}
                                {property.bathrooms || 0} Bath
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {property.property_type_name && (
                            <Badge className="bg-primary/90 text-white border-0">
                              {property.property_type_name}
                            </Badge>
                          )}
                          {property.is_recommended && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/90 text-white mt-1"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>
                              {property.area || property.city_name || "N/A"}
                            </span>
                          </div>
                          {property.min_stay_days &&
                            property.min_stay_days > 1 && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Min {property.min_stay_days} days
                              </div>
                            )}
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
                          <div className="font-medium text-gray-900 dark:text-white">
                            {property.price_per_night
                              ? formatCurrency(property.price_per_night)
                              : "Not set"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {property.gst_percentage
                              ? `+${property.gst_percentage}% GST`
                              : "No GST"}
                          </div>
                          {(property.discount_3_5_days > 0 ||
                            property.discount_6_14_days > 0 ||
                            property.discount_15_plus_days > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {property.discount_3_5_days > 0 && (
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                  3-5N: {property.discount_3_5_days}%
                                </span>
                              )}
                              {property.discount_6_14_days > 0 && (
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                  6-14N: {property.discount_6_14_days}%
                                </span>
                              )}
                              {property.discount_15_plus_days > 0 && (
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                  15+N: {property.discount_15_plus_days}%
                                </span>
                              )}
                            </div>
                          )}
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
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProperty(property)}
                              className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {property.property_type_id === "pt-001" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditDiscounts(property)}
                                title="Edit Villa Duration Discounts"
                                className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            )}
                            {property.status === "pending_approval" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(property)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(property)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProperty(property)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <>
              {/* Grid View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Property Image */}
                    <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {property.thumbnail ? (
                        <img
                          src={
                            property.thumbnail.startsWith("http://") ||
                            property.thumbnail.startsWith("https://")
                              ? property.thumbnail
                              : `${import.meta.env.VITE_API_URL || "https://api.zevio.cloud"}${property.thumbnail}`
                          }
                          alt={property.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center"><svg class="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(property.status)}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </div>
                      {/* Property Type Badge */}
                      {property.property_type_name && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary/90 text-white border-0 backdrop-blur-sm">
                            {property.property_type_name}
                          </Badge>
                        </div>
                      )}
                      {/* Image Count */}
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {property.image_count || 0}
                      </div>
                      {/* Recommended Badge */}
                      {property.is_recommended && (
                        <div className="absolute bottom-2 right-2 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1 backdrop-blur-sm">
                          <Sparkles className="h-3 w-3" />
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 truncate">
                        {property.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {property.area || property.city_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {property.vendor_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Bed className="h-4 w-4 mr-2 flex-shrink-0" />
                          {property.bedrooms || 0} Bed •{" "}
                          {property.bathrooms || 0} Bath
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                          Up to {property.max_guests || 0} guests
                        </div>
                        {/* Service Apartment Info */}
                        {property.min_stay_days &&
                          property.min_stay_days > 1 && (
                            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                              <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                              Min {property.min_stay_days} days
                            </div>
                          )}
                      </div>

                      {/* Price */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {property.price_per_night
                            ? formatCurrency(property.price_per_night)
                            : "Not set"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {property.gst_percentage
                            ? `+${property.gst_percentage}% GST`
                            : "per night"}
                        </div>
                        {(property.discount_3_5_days > 0 ||
                          property.discount_6_14_days > 0 ||
                          property.discount_15_plus_days > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {property.discount_3_5_days > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                3-5N: {property.discount_3_5_days}%
                              </span>
                            )}
                            {property.discount_6_14_days > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                6-14N: {property.discount_6_14_days}%
                              </span>
                            )}
                            {property.discount_15_plus_days > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                15+N: {property.discount_15_plus_days}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(property)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProperty(property)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>

                      {/* Villa Duration Discounts Button */}
                      {property.property_type_id === "pt-001" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDiscounts(property)}
                          className="w-full mt-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950/20"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Edit Duration Discounts
                        </Button>
                      )}

                      {/* Additional Actions for Pending */}
                      {property.status === "pending_approval" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(property)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(property)}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {currentProperties.length > 0 && totalPages > 1 && (
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
                          variant={currentPage === page ? "default" : "outline"}
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
        </CardContent>
      </Card>

      {/* Property View/Edit Modal - Session 52 Smart Modal */}
      <PropertyViewEditModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        property={selectedProperty}
        onPropertyUpdated={() => {
          fetchProperties();
          fetchStats();
        }}
      />

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

      {/* Property Type Selection Modal */}
      <PropertyTypeSelectionModal
        open={showPropertyTypeModal}
        onClose={() => setShowPropertyTypeModal(false)}
      />

      {/* Villa Duration Discount Edit Modal */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Villa Duration Discounts
            </DialogTitle>
            <DialogDescription>
              Set automatic percentage discounts applied at checkout based on
              booking length for <strong>{discountProperty?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3–5 Nights Discount (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountForm.discount_3_5_days}
                  onChange={(e) =>
                    setDiscountForm((p) => ({
                      ...p,
                      discount_3_5_days: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  % off
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied when booking duration is 3 to 5 nights
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                6–14 Nights Discount (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountForm.discount_6_14_days}
                  onChange={(e) =>
                    setDiscountForm((p) => ({
                      ...p,
                      discount_6_14_days: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  % off
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied when booking duration is 6 to 14 nights
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                15+ Nights Discount (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountForm.discount_15_plus_days}
                  onChange={(e) =>
                    setDiscountForm((p) => ({
                      ...p,
                      discount_15_plus_days: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  % off
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied when booking duration is 15 or more nights
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> Discounts are applied to the base nightly
              rate subtotal before GST. Set to 0 to disable a tier.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiscountModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDiscounts}
              disabled={discountSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {discountSaving ? "Saving..." : "Save Discounts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
