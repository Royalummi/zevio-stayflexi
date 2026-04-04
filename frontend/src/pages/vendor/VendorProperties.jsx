import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Calendar,
  IndianRupee,
  MapPin,
  TrendingUp,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Home,
  CalendarOff,
  MoreHorizontal,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
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
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";

// Import Shared Components
import StatsCard from "../../components/shared/StatsCard";
import ViewModeToggle from "../../components/shared/ViewModeToggle";
import PropertyTypeModal from "../../components/shared/PropertyTypeModal";
import PropertyBlockoutCalendar from "../../components/vendor/PropertyBlockoutCalendar";

const VendorProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState(null);

  // Stats Dashboard
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending_approval: 0,
    approved: 0,
    active_bookings: 0,
    total_revenue: 0,
    avg_rating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState([]);

  // View Mode
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"

  // Property Type Modal
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);

  // Blocking Calendar
  const [blockingProperty, setBlockingProperty] = useState(null); // { id, title }

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchCities();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, searchTerm, cityFilter]);

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, statusFilter, searchTerm, sortBy, cityFilter]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get("/vendor/dashboard");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get("/public/cities");
      const data = response.data.data;
      setCities(Array.isArray(data) ? data : data?.cities || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(cityFilter !== "all" && { city: cityFilter }),
      };

      const response = await api.get("/vendor/properties", { params });
      const { properties: fetchedProperties, pagination: paginationData } =
        response.data.data;

      // Client-side filtering for search and advanced filters
      let filteredProperties = fetchedProperties;

      // Search filter
      if (searchTerm) {
        filteredProperties = filteredProperties.filter(
          (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.city_name?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // City filter
      if (cityFilter && cityFilter !== "all") {
        filteredProperties = filteredProperties.filter(
          (p) => p.city_name === cityFilter,
        );
      }

      // Client-side sorting
      if (sortBy === "newest") {
        filteredProperties.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
      } else if (sortBy === "oldest") {
        filteredProperties.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
      } else if (sortBy === "revenue") {
        filteredProperties.sort(
          (a, b) => parseFloat(b.total_revenue) - parseFloat(a.total_revenue),
        );
      } else if (sortBy === "bookings") {
        filteredProperties.sort((a, b) => b.total_bookings - a.total_bookings);
      }

      setProperties(filteredProperties);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    setShowPropertyTypeModal(true);
  };

  const handleSelectPropertyType = (type) => {
    if (type === "villa") {
      navigate("/vendor/properties/add", {
        state: { propertyTypeId: "pt-001", propertyTypeName: "Villa" },
      });
    } else if (type === "service_apartment") {
      navigate("/vendor/service-apartments/add", {
        state: {
          propertyTypeId: "pt-002",
          propertyTypeName: "Service Apartment",
        },
      });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
    setCityFilter("all");
  };

  const handleEditProperty = (propertyId) => {
    navigate(`/vendor/properties/${propertyId}/edit`);
  };

  const handleDeleteProperty = async () => {
    try {
      await api.delete(`/vendor/properties/${deletingPropertyId}`);
      toast.success("Property deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingPropertyId(null);
      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error(error.response?.data?.message || "Failed to delete property");
    }
  };

  const handleExportCSV = () => {
    const csvData = properties.map((p) => ({
      Title: p.title,
      City: p.city_name || "N/A",
      Status: p.status,
      "Price/Night": p.price_per_night || 0,
      Bookings: p.total_bookings,
      Revenue: p.total_revenue,
      "Created At": formatDate(p.created_at),
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "bg-gray-100 text-gray-800 border-gray-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Content Skeleton */}
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Properties
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your property listings and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={properties.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
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

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Properties"
          value={statsLoading ? "..." : stats.total}
          icon={Building2}
          iconColor="text-blue-600"
          valueColor="text-gray-900 dark:text-white"
        />
        <StatsCard
          title="Active Bookings"
          value={statsLoading ? "..." : stats.active_bookings}
          icon={Calendar}
          iconColor="text-green-600"
          valueColor="text-green-600"
        />
        <StatsCard
          title="Total Revenue"
          value={statsLoading ? "..." : formatCurrency(stats.total_revenue)}
          icon={TrendingUp}
          iconColor="text-purple-600"
          valueColor="text-purple-600"
        />
        <StatsCard
          title="Average Rating"
          value={statsLoading ? "..." : `${stats.avg_rating} ⭐`}
          icon={Star}
          iconColor="text-yellow-600"
          valueColor="text-yellow-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by property name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="revenue">Highest Revenue</SelectItem>
                  <SelectItem value="bookings">Most Bookings</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== "all" || cityFilter !== "all") && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Properties List/Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
              {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                ? "No properties match your current filters. Try adjusting your search criteria."
                : "Get started by adding your first property to showcase your rental offerings"}
            </p>
            {!searchTerm && statusFilter === "all" && cityFilter === "all" && (
              <Button
                onClick={handleAddProperty}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List View (Table) */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price/Night</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow
                          key={property.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center overflow-hidden">
                                {property.thumbnail ? (
                                  <img
                                    src={property.thumbnail}
                                    alt={property.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-6 w-6 text-blue-600" />
                                )}
                              </div>
                              <div className="max-w-xs">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {property.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Created {formatDate(property.created_at)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {property.city_name || "Not specified"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-medium text-gray-900 dark:text-white">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatCurrency(property.price_per_night || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {property.total_bookings || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center font-semibold text-green-600">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              {formatCurrency(property.total_revenue || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(property.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditProperty(property.id)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Property
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setBlockingProperty({
                                      id: property.id,
                                      title: property.title,
                                    })
                                  }
                                >
                                  <CalendarOff className="h-4 w-4 mr-2" />
                                  Block Calendar Dates
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setDeletingPropertyId(property.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Property
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid View (Cards) */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 gap-4">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className="hover:shadow-lg transition-shadow duration-200 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Property Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                            {property.thumbnail ? (
                              <img
                                src={property.thumbnail}
                                alt={property.title}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {property.title}
                            </h3>
                          </div>
                          {getStatusBadge(property.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            {property.city_name || "Not specified"}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <IndianRupee className="h-4 w-4 mr-2 flex-shrink-0" />
                            {formatCurrency(property.price_per_night || 0)}
                            /night
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            {property.total_bookings || 0} bookings
                          </div>
                          <div className="flex items-center text-sm font-semibold text-green-600">
                            <IndianRupee className="h-4 w-4 mr-1 flex-shrink-0" />
                            {formatCurrency(property.total_revenue || 0)}{" "}
                            revenue
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                          Created on {formatDate(property.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditProperty(property.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Property
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setBlockingProperty({
                                  id: property.id,
                                  title: property.title,
                                })
                              }
                            >
                              <CalendarOff className="h-4 w-4 mr-2" />
                              Block Calendar Dates
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setDeletingPropertyId(property.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Property
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} properties
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone. All associated bookings and data will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocking Calendar Dialog */}
      <Dialog
        open={!!blockingProperty}
        onOpenChange={(open) => {
          if (!open) setBlockingProperty(null);
        }}
      >
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-orange-500" />
              Block Calendar Dates
            </DialogTitle>
          </DialogHeader>
          {blockingProperty && (
            <PropertyBlockoutCalendar
              propertyId={blockingProperty.id}
              propertyTitle={blockingProperty.title}
              onClose={() => setBlockingProperty(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Property Type Modal */}
      <PropertyTypeModal
        open={showPropertyTypeModal}
        onClose={() => setShowPropertyTypeModal(false)}
        onSelectType={handleSelectPropertyType}
      />
    </div>
  );
};

export default VendorProperties;
