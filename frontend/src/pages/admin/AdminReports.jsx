import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  // Calendar range state (Date objects)
  const [calendarRange, setCalendarRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const isFirstRender = useRef(true);

  // Revenue Analytics State
  const [revenueData, setRevenueData] = useState(null);
  const [bookingTrends, setBookingTrends] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [propertyPerformance, setPropertyPerformance] = useState(null);
  const [vendorPerformance, setVendorPerformance] = useState(null);

  // Chart colors
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Helper: safe number parse (MySQL returns DECIMAL as string)
  const num = (v) => parseFloat(v) || 0;

  // Helper: format date label for charts (handle ISO datetime → clean date)
  const fmtDate = (d) => {
    if (!d) return "";
    const s = typeof d === "string" ? d : d.toISOString();
    return s.split("T")[0]; // keep YYYY-MM-DD
  };

  // Fetch all reports in parallel (used on mount + date change)
  const fetchAllReports = useCallback(async (range) => {
    const r = range || dateRange;
    setLoading(true);
    setRevenueData(null);
    setBookingTrends(null);
    setUserActivity(null);
    setPropertyPerformance(null);
    setVendorPerformance(null);
    try {
      const [rev, book, user, prop, vend] = await Promise.allSettled([
        api.get("/admin/reports/revenue", { params: r }),
        api.get("/admin/reports/booking-trends", { params: r }),
        api.get("/admin/reports/user-activity", { params: r }),
        api.get("/admin/reports/property-performance", { params: r }),
        api.get("/admin/reports/vendor-performance", { params: r }),
      ]);
      if (rev.status === "fulfilled") setRevenueData(rev.value.data.data);
      else toast.error("Failed to load revenue analytics");
      if (book.status === "fulfilled") setBookingTrends(book.value.data.data);
      else toast.error("Failed to load booking trends");
      if (user.status === "fulfilled") setUserActivity(user.value.data.data);
      else toast.error("Failed to load user activity");
      if (prop.status === "fulfilled")
        setPropertyPerformance(prop.value.data.data);
      else toast.error("Failed to load property performance");
      if (vend.status === "fulfilled")
        setVendorPerformance(vend.value.data.data);
      else toast.error("Failed to load vendor performance");
    } finally {
      setLoading(false);
    }
  }, []);

  // Individual fetch functions (kept for per-tab refresh)
  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reports/revenue", {
        params: dateRange,
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

  // Auto-load all tabs on mount (last 30 days)
  useEffect(() => {
    fetchAllReports();
  }, []);

  // Auto-refetch all when date range changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchAllReports(dateRange);
    }, 600);
    return () => clearTimeout(timer);
  }, [dateRange]);

  // When popover opens, sync calendarRange back to last applied dateRange
  // so a previously abandoned half-selection is cleared
  useEffect(() => {
    if (datePickerOpen) {
      setCalendarRange({
        from: new Date(dateRange.start_date),
        to: new Date(dateRange.end_date),
      });
    }
  }, [datePickerOpen]);

  // Refresh all data with current date range
  const handleRefresh = () => {
    fetchAllReports(dateRange);
  };

  // Export to CSV
  const handleExport = () => {
    let rows = [];
    let filename = "report.csv";

    if (activeTab === "revenue" && revenueData) {
      filename = "revenue-report.csv";
      rows = [
        ["Period", "Bookings", "Revenue (INR)", "Avg Value (INR)"],
        ...(revenueData.revenue_by_period || []).map((r) => [
          r.period,
          r.bookings,
          num(r.revenue).toFixed(2),
          num(r.avg_value).toFixed(2),
        ]),
      ];
    } else if (activeTab === "bookings" && bookingTrends) {
      filename = "booking-trends.csv";
      rows = [
        ["Status", "Count", "Percentage"],
        ...(bookingTrends.status_distribution || []).map((r) => [
          r.status,
          r.count,
          r.percentage + "%",
        ]),
      ];
    } else if (activeTab === "users" && userActivity) {
      filename = "user-activity.csv";
      rows = [
        ["Name", "Email", "Bookings", "Total Spent (INR)", "Last Booking"],
        ...(userActivity.top_customers || []).map((c) => [
          c.full_name,
          c.email,
          c.total_bookings,
          num(c.total_spent).toFixed(2),
          fmtDate(c.last_booking_date),
        ]),
      ];
    } else if (activeTab === "properties" && propertyPerformance) {
      filename = "property-performance.csv";
      rows = [
        [
          "Property",
          "City",
          "Vendor",
          "Bookings",
          "Nights",
          "Revenue (INR)",
          "Avg Value (INR)",
        ],
        ...(propertyPerformance.property_occupancy || []).map((p) => [
          p.title,
          p.city_name,
          p.vendor_name || "N/A",
          p.bookings,
          p.nights_booked,
          num(p.revenue).toFixed(2),
          num(p.avg_booking_value).toFixed(2),
        ]),
      ];
    } else if (activeTab === "vendors" && vendorPerformance) {
      filename = "vendor-performance.csv";
      rows = [
        [
          "Vendor",
          "Email",
          "Phone",
          "Properties",
          "Active",
          "Bookings",
          "Revenue (INR)",
          "Paid (INR)",
          "Pending (INR)",
        ],
        ...(vendorPerformance.vendor_stats || []).map((v) => [
          v.name,
          v.email,
          v.phone,
          v.total_properties,
          v.active_properties,
          v.total_bookings,
          num(v.total_revenue).toFixed(2),
          num(v.paid_settlements).toFixed(2),
          num(v.pending_settlements).toFixed(2),
        ]),
      ];
    } else {
      toast.error("No data to export. Please load a report first.");
      return;
    }

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length - 1} rows to ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 h-9 text-sm font-normal"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(dateRange.start_date), "MMM d, yyyy")}
                  {" – "}
                  {format(new Date(dateRange.end_date), "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              {/* Calendar — never auto-closes; user must click Apply */}
              <CalendarComponent
                mode="range"
                selected={calendarRange}
                onSelect={(range) => {
                  // Always update local picker state — never close here
                  setCalendarRange(range || { from: undefined, to: undefined });
                }}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                defaultMonth={
                  calendarRange?.from
                    ? new Date(
                        calendarRange.from.getFullYear(),
                        calendarRange.from.getMonth() - 1,
                      )
                    : new Date()
                }
              />
              {/* Footer with status + action buttons */}
              <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {calendarRange?.from && calendarRange?.to
                    ? `${format(calendarRange.from, "MMM d, yyyy")} → ${format(calendarRange.to, "MMM d, yyyy")}`
                    : calendarRange?.from
                      ? `From ${format(calendarRange.from, "MMM d, yyyy")} — pick end date`
                      : "Pick a start date"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => {
                      // Reset to last 30 days
                      const today = new Date();
                      const from = new Date(
                        Date.now() - 30 * 24 * 60 * 60 * 1000,
                      );
                      setCalendarRange({ from, to: today });
                      setDateRange({
                        start_date: from.toISOString().split("T")[0],
                        end_date: today.toISOString().split("T")[0],
                      });
                      setDatePickerOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-3"
                    disabled={!calendarRange?.from || !calendarRange?.to}
                    onClick={() => {
                      if (calendarRange?.from && calendarRange?.to) {
                        setDateRange({
                          start_date: calendarRange.from
                            .toISOString()
                            .split("T")[0],
                          end_date: calendarRange.to
                            .toISOString()
                            .split("T")[0],
                        });
                        setDatePickerOpen(false);
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
                      {formatCurrency(num(revenueData.summary.total_revenue))}
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
                      {revenueData.summary.completed_bookings > 0
                        ? formatCurrency(
                            num(revenueData.summary.avg_booking_value),
                          )
                        : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {revenueData.summary.completed_bookings > 0
                        ? "Per completed booking"
                        : "No completed bookings"}
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
                      {formatCurrency(num(revenueData.summary.gst_collected))}
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
                      {formatCurrency(num(revenueData.summary.total_refunds))}
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
                    Revenue over time (daily breakdown)
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
                              {formatCurrency(num(property.revenue))}
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
                Loading revenue analytics...
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
              {/* Booking Summary Cards */}
              {(() => {
                const sd = bookingTrends.status_distribution || [];
                const total = sd.reduce((s, r) => s + (r.count || 0), 0);
                const confirmed =
                  sd.find((r) => r.status === "confirmed")?.count || 0;
                const completed =
                  sd.find((r) => r.status === "completed")?.count || 0;
                const cancelled =
                  sd.find((r) => r.status === "cancelled")?.count || 0;
                const conversionRate =
                  total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Bookings
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{total}</div>
                        <p className="text-xs text-muted-foreground">
                          In selected period
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Confirmed
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {confirmed}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Active bookings
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Completed
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{completed}</div>
                        <p className="text-xs text-muted-foreground">
                          {conversionRate}% completion rate
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Cancelled
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {cancelled}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {total > 0
                            ? Math.round((cancelled / total) * 100)
                            : 0}
                          % cancellation rate
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                  <CardDescription>Breakdown by booking status</CardDescription>
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
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading booking trends...</p>
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
                    <LineChart
                      data={(userActivity.new_users || []).map((r) => ({
                        ...r,
                        date: fmtDate(r.date),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
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
                              {customer.full_name || customer.name}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.total_bookings}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(num(customer.total_spent))}
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
                          <TableHead>Blocked / Inactive</TableHead>
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
                                {role.blocked ?? role.inactive ?? 0}
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
              <p className="text-muted-foreground">Loading user activity...</p>
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
                                {formatCurrency(num(property.revenue))}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  num(property.avg_booking_value),
                                )}
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
                Loading property performance...
              </p>
            </div>
          )}
        </TabsContent>

        {/* Vendor Performance Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {loading && !vendorPerformance ? (
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
          ) : vendorPerformance ? (
            <>
              {/* Vendor Summary Cards */}
              {(() => {
                const vs = vendorPerformance.vendor_stats || [];
                const totalRevenue = vs.reduce(
                  (s, v) => s + num(v.total_revenue),
                  0,
                );
                const totalPaid = vs.reduce(
                  (s, v) => s + num(v.paid_settlements),
                  0,
                );
                const totalPending = vs.reduce(
                  (s, v) => s + num(v.pending_settlements),
                  0,
                );
                const totalBookings = vs.reduce(
                  (s, v) => s + (v.total_bookings || 0),
                  0,
                );
                return (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Vendors
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{vs.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {vs.filter((v) => v.active_properties > 0).length}{" "}
                          with active properties
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {totalBookings} bookings
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Settlements Paid
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalPaid)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Paid out to vendors
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Pending Settlements
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(totalPending)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Awaiting payout
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Vendor Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Performance</CardTitle>
                  <CardDescription>
                    Comprehensive vendor metrics
                  </CardDescription>
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
                              {formatCurrency(num(vendor.total_revenue))}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(num(vendor.paid_settlements))}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {formatCurrency(num(vendor.pending_settlements))}
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
                Loading vendor performance...
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
