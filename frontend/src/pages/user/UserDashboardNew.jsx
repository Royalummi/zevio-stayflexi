import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Package,
  TrendingUp,
  Building2,
  Heart,
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

const UserDashboardNew = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes] = await Promise.all([
        api.get("/bookings/my?limit=5"),
      ]);

      setBookings(bookingsRes.data.data.bookings || []);

      // Calculate stats from bookings
      const confirmed = bookingsRes.data.data.bookings.filter(
        (b) => b.status === "confirmed"
      ).length;
      const completed = bookingsRes.data.data.bookings.filter(
        (b) => b.status === "completed"
      ).length;
      const total = bookingsRes.data.data.pagination.total;

      setStats({
        total_bookings: total,
        upcoming_bookings: confirmed,
        completed_bookings: completed,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      cancel_requested:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return colors[status] || colors.pending_payment;
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
      title: "Total Bookings",
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Trips",
      value: stats?.upcoming_bookings || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Completed",
      value: stats?.completed_bookings || 0,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Favorites",
      value: "5",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ready to plan your next adventure?
          </p>
        </div>
        <Button
          onClick={() => navigate("/properties")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Browse Properties
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

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/bookings")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start exploring amazing properties and book your first stay!
              </p>
              <Button
                onClick={() => navigate("/properties")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {booking.property_title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {booking.city_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(booking.check_in)} -{" "}
                          {formatDate(booking.check_out)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.nights} nights
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/properties")}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Browse Properties
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Discover amazing places
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/bookings")}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  My Bookings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View all your trips
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/dashboard/profile")}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Profile Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboardNew;
