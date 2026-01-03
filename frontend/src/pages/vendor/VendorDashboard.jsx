import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Eye,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";

const VendorDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats from API
      const statsResponse = await api.get("/vendor/dashboard");
      setStats(statsResponse.data.data);

      // Fetch properties
      const propertiesResponse = await api.get("/vendor/properties?limit=5");
      setProperties(propertiesResponse.data.data.properties);

      // Fetch recent bookings
      const bookingsResponse = await api.get("/vendor/bookings?limit=5");
      setBookings(bookingsResponse.data.data.bookings);

      // Fetch pending settlements
      const settlementsResponse = await api.get(
        "/vendor/settlements?status=pending&limit=5"
      );
      setSettlements(settlementsResponse.data.data.settlements);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Properties",
      value: stats?.total_properties || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Bookings",
      value: stats?.active_bookings || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.total_revenue || 0),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Settlements",
      value: formatCurrency(stats?.pending_settlements || 0),
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Vendor Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your properties and track earnings
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Building2 className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.title}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Properties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {property.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {property.views} views
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {property.bookings} bookings
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={
                      property.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {property.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {booking.property}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Guest: {booking.guest}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(booking.check_in)} -{" "}
                      {formatDate(booking.check_out)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">
                      {booking.status}
                    </Badge>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(booking.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;
