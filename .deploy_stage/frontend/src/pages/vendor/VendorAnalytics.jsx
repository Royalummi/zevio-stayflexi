import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  Building2,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import api from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

const VendorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenue_by_property: [],
    booking_trends: [],
  });

  // Date filters
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {};

      if (dateRange !== "all") {
        const endDate = new Date();
        let startDate = new Date();

        switch (dateRange) {
          case "7days":
            startDate.setDate(endDate.getDate() - 7);
            break;
          case "30days":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "90days":
            startDate.setDate(endDate.getDate() - 90);
            break;
          case "year":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            break;
        }

        params.start_date = startDate.toISOString().split("T")[0];
        params.end_date = endDate.toISOString().split("T")[0];
      }

      const response = await api.get("/vendor/analytics", { params });
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Combine all data into CSV
    const propertyData = analyticsData.revenue_by_property.map((p) => ({
      Type: "Property",
      Name: p.title,
      Bookings: p.total_bookings,
      Revenue: p.total_revenue,
    }));

    const trendData = analyticsData.booking_trends.map((t) => ({
      Type: "Monthly Trend",
      Month: t.month,
      Bookings: t.bookings,
      Revenue: t.revenue,
    }));

    const csvData = [...propertyData, ...trendData];

    // Guard against empty data
    if (csvData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary stats
  const totalRevenue = analyticsData.revenue_by_property.reduce(
    (sum, p) => sum + parseFloat(p.total_revenue || 0),
    0,
  );
  const totalBookings = analyticsData.revenue_by_property.reduce(
    (sum, p) => sum + parseInt(p.total_bookings || 0),
    0,
  );
  const avgRevenuePerProperty =
    analyticsData.revenue_by_property.length > 0
      ? totalRevenue / analyticsData.revenue_by_property.length
      : 0;
  const avgRevenuePerBooking =
    totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Top performing property
  const topProperty =
    analyticsData.revenue_by_property.length > 0
      ? analyticsData.revenue_by_property.reduce((max, p) =>
          parseFloat(p.total_revenue) > parseFloat(max.total_revenue) ? p : max,
        )
      : null;

  // Calculate trend (comparing last 2 months)
  const recentTrends = analyticsData.booking_trends.slice(0, 2);
  const prevRevenue =
    recentTrends.length === 2 ? parseFloat(recentTrends[1].revenue) : 0;
  const trendPercentage =
    recentTrends.length === 2 && prevRevenue > 0
      ? ((parseFloat(recentTrends[0].revenue) - prevRevenue) / prevRevenue) *
        100
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Insights and performance metrics for your properties
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={
              analyticsData.revenue_by_property.length === 0 &&
              analyticsData.booking_trends.length === 0
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="h-6 w-6 text-blue-600" />
              {trendPercentage !== 0 && (
                <div className="flex items-center gap-1">
                  {trendPercentage > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        {trendPercentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">
                        {Math.abs(trendPercentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-sm text-blue-600">Total Revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Calendar className="h-6 w-6 text-purple-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalBookings}
            </div>
            <div className="text-sm text-gray-500">Total Bookings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Building2 className="h-6 w-6 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(avgRevenuePerProperty)}
            </div>
            <div className="text-sm text-gray-500">Avg Revenue/Property</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(avgRevenuePerBooking)}
            </div>
            <div className="text-sm text-gray-500">Avg Revenue/Booking</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer */}
      {topProperty && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  🏆 Top Performing Property
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {topProperty.title}
                </h3>
                <div className="flex items-center gap-6 mt-2">
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(topProperty.total_revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="text-xl font-bold text-blue-600">
                      {topProperty.total_bookings}
                    </p>
                  </div>
                </div>
              </div>
              <Building2 className="h-16 w-16 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue by Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.revenue_by_property.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.revenue_by_property.map((property, index) => {
                  const maxRevenue = Math.max(
                    ...analyticsData.revenue_by_property.map((p) =>
                      parseFloat(p.total_revenue),
                    ),
                  );
                  const percentage =
                    (parseFloat(property.total_revenue) / maxRevenue) * 100;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {property.title}
                        </span>
                        <span className="text-green-600 font-bold ml-2">
                          {formatCurrency(property.total_revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {property.total_bookings} bookings
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Trends (Monthly) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Monthly Booking Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.booking_trends.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.booking_trends.map((trend, index) => {
                  const maxRevenue = Math.max(
                    ...analyticsData.booking_trends.map((t) =>
                      parseFloat(t.revenue),
                    ),
                  );
                  const percentage =
                    (parseFloat(trend.revenue) / maxRevenue) * 100;

                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(trend.month + "-02").toLocaleDateString(
                            "en-IN",
                            { month: "long", year: "numeric" },
                          )}
                        </span>
                        <span className="text-sm text-gray-600">
                          {trend.bookings} bookings
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                          {formatCurrency(trend.revenue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No booking trends available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-2">
                Performance Insights
              </h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>
                  • Your properties have generated{" "}
                  <strong>{formatCurrency(totalRevenue)}</strong> in total
                  revenue
                </li>
                <li>
                  • Average revenue per booking is{" "}
                  <strong>{formatCurrency(avgRevenuePerBooking)}</strong>
                </li>
                {topProperty && (
                  <li>
                    • <strong>{topProperty.title}</strong> is your best
                    performer with {topProperty.total_bookings} bookings
                  </li>
                )}
                {trendPercentage > 0 && (
                  <li className="text-green-700">
                    • Revenue is{" "}
                    <strong>up {trendPercentage.toFixed(1)}%</strong> compared
                    to last month 📈
                  </li>
                )}
                {trendPercentage < 0 && (
                  <li className="text-orange-700">
                    • Revenue is{" "}
                    <strong>
                      down {Math.abs(trendPercentage).toFixed(1)}%
                    </strong>{" "}
                    compared to last month 📉
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;
