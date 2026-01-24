import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Building2,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

const AdminReports = () => {
  // State
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [period, setPeriod] = useState("daily");

  // Revenue Analytics State
  const [revenueData, setRevenueData] = useState(null);
  const [bookingTrends, setBookingTrends] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [propertyPerformance, setPropertyPerformance] = useState(null);
  const [vendorPerformance, setVendorPerformance] = useState(null);

  // Chart colors
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Fetch Revenue Analytics
  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/revenue", {
        params: { ...dateRange, period },
      });
      setRevenueData(response.data.data);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      toast.error("Failed to load revenue analytics");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Booking Trends
  const fetchBookingTrends = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/booking-trends", {
        params: dateRange,
      });
      setBookingTrends(response.data.data);
    } catch (error) {
      console.error("Error fetching booking trends:", error);
      toast.error("Failed to load booking trends");
    } finally {
      setLoading(false);
    }
  };

  // Fetch User Activity
  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/user-activity", {
        params: dateRange,
      });
      setUserActivity(response.data.data);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast.error("Failed to load user activity");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Property Performance
  const fetchPropertyPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/property-performance", {
        params: dateRange,
      });
      setPropertyPerformance(response.data.data);
    } catch (error) {
      console.error("Error fetching property performance:", error);
      toast.error("Failed to load property performance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vendor Performance
  const fetchVendorPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/vendor-performance", {
        params: dateRange,
      });
      setVendorPerformance(response.data.data);
    } catch (error) {
      console.error("Error fetching vendor performance:", error);
      toast.error("Failed to load vendor performance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === "revenue" && !revenueData) {
      fetchRevenueAnalytics();
    } else if (activeTab === "bookings" && !bookingTrends) {
      fetchBookingTrends();
    } else if (activeTab === "users" && !userActivity) {
      fetchUserActivity();
    } else if (activeTab === "properties" && !propertyPerformance) {
      fetchPropertyPerformance();
    } else if (activeTab === "vendors" && !vendorPerformance) {
      fetchVendorPerformance();
    }
  }, [activeTab]);

  // Refresh data
  const handleRefresh = () => {
    switch (activeTab) {
      case "revenue":
        fetchRevenueAnalytics();
        break;
      case "bookings":
        fetchBookingTrends();
        break;
      case "users":
        fetchUserActivity();
        break;
      case "properties":
        fetchPropertyPerformance();
        break;
      case "vendors":
        fetchVendorPerformance();
        break;
    }
  };

  // Apply date filter
  const handleApplyFilter = () => {
    setRevenueData(null);
    setBookingTrends(null);
    setUserActivity(null);
    setPropertyPerformance(null);
    setVendorPerformance(null);
    handleRefresh();
  };

  // Export to CSV (simplified - you can enhance this)
  const handleExport = () => {
    toast.success("Export feature coming soon");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">
                Start Date
              </label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start_date: e.target.value })
                }
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end_date: e.target.value })
                }
              />
            </div>
            {activeTab === "revenue" && (
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">Period</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleApplyFilter} disabled={loading}>
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {loading && !revenueData ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : revenueData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.total_revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {revenueData.summary.completed_bookings} completed
                      bookings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Booking Value
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.avg_booking_value)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per completed booking
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      GST Collected
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.gst_collected)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tax amount collected
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Refunds
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueData.summary.total_refunds)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {revenueData.summary.cancelled_bookings} cancellations
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Revenue over time ({period} view)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.revenue_by_period}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by City */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by City</CardTitle>
                  <CardDescription>Top 10 performing cities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.revenue_by_city}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city_name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Properties */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Properties</CardTitle>
                  <CardDescription>
                    Highest revenue generating properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueData.top_properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium">
                              {property.title}
                            </TableCell>
                            <TableCell>{property.city_name}</TableCell>
                            <TableCell>{property.bookings}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(property.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Click "Apply Filter" to load revenue analytics
              </p>
            </div>
          )}
        </TabsContent>

        {/* Booking Trends Tab */}
        <TabsContent value="bookings" className="space-y-6">
          {loading && !bookingTrends ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : bookingTrends ? (
            <>
              {/* Status Distribution */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Status Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by booking status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={bookingTrends.status_distribution}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {bookingTrends.status_distribution.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Lead Time */}
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Lead Time</CardTitle>
                    <CardDescription>
                      Days between booking and check-in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Average Lead Time
                        </span>
                        <span className="text-2xl font-bold">
                          {Math.round(
                            bookingTrends.lead_time.avg_lead_time_days,
                          )}{" "}
                          days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Minimum
                        </span>
                        <span className="text-lg font-semibold">
                          {bookingTrends.lead_time.min_lead_time} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Maximum
                        </span>
                        <span className="text-lg font-semibold">
                          {bookingTrends.lead_time.max_lead_time} days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Day of Week Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Day of Week</CardTitle>
                  <CardDescription>Busiest days for check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingTrends.day_of_week_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day_of_week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Duration Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Duration Patterns</CardTitle>
                  <CardDescription>Popular stay durations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingTrends.duration_patterns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nights"
                        label={{
                          value: "Nights",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Click "Apply Filter" to load booking trends
              </p>
            </div>
          )}
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-6">
          {loading && !userActivity ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : userActivity ? (
            <>
              {/* Active Users Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userActivity.active_users.active_users}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users who made bookings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Bookings
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userActivity.active_users.total_bookings}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      In selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Bookings/User
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userActivity.active_users.avg_bookings_per_user}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average per active user
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* New User Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
                  <CardDescription>Daily registration trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userActivity.new_users}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="new_users"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Highest spending customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead className="text-right">
                            Total Spent
                          </TableHead>
                          <TableHead>Last Booking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userActivity.top_customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {customer.name}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.total_bookings}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(customer.total_spent)}
                            </TableCell>
                            <TableCell>
                              {formatDate(customer.last_booking_date)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Role Distribution</CardTitle>
                  <CardDescription>Users by role and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Blocked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userActivity.role_distribution.map((role) => (
                          <TableRow key={role.role}>
                            <TableCell className="font-medium capitalize">
                              {role.role.replace("_", " ")}
                            </TableCell>
                            <TableCell>{role.count}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                {role.active}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700"
                              >
                                {role.blocked}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Click "Apply Filter" to load user activity
              </p>
            </div>
          )}
        </TabsContent>

        {/* Property Performance Tab */}
        <TabsContent value="properties" className="space-y-6">
          {loading && !propertyPerformance ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : propertyPerformance ? (
            <>
              {/* Overall Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Properties
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {propertyPerformance.overall_stats.total_properties}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Properties
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {propertyPerformance.overall_stats.active_properties}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      With Bookings
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        propertyPerformance.overall_stats
                          .properties_with_bookings
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Booking Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        propertyPerformance.overall_stats
                          .booking_rate_percentage
                      }
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property Occupancy Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Performance</CardTitle>
                  <CardDescription>Detailed property metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Nights Booked</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">
                            Avg Value
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {propertyPerformance.property_occupancy
                          .slice(0, 20)
                          .map((property) => (
                            <TableRow key={property.id}>
                              <TableCell className="font-medium">
                                {property.title}
                              </TableCell>
                              <TableCell>{property.city_name}</TableCell>
                              <TableCell>
                                {property.vendor_name || "N/A"}
                              </TableCell>
                              <TableCell>{property.bookings}</TableCell>
                              <TableCell>{property.nights_booked}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(property.revenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(property.avg_booking_value)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Click "Apply Filter" to load property performance
              </p>
            </div>
          )}
        </TabsContent>

        {/* Vendor Performance Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {loading && !vendorPerformance ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : vendorPerformance ? (
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance</CardTitle>
                <CardDescription>Comprehensive vendor metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Properties</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorPerformance.vendor_stats.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">
                            {vendor.name}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{vendor.email}</div>
                              <div className="text-muted-foreground">
                                {vendor.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{vendor.total_properties}</TableCell>
                          <TableCell>{vendor.active_properties}</TableCell>
                          <TableCell>{vendor.total_bookings}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(vendor.total_revenue)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(vendor.paid_settlements)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(vendor.pending_settlements)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Click "Apply Filter" to load vendor performance
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
