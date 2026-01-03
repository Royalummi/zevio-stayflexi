import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Award, DollarSign, TrendingUp, Calendar } from "lucide-react";
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

const EmployeeDashboard = () => {
  const [points, setPoints] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats from API
      const statsResponse = await api.get("/employee/dashboard");
      setStats(statsResponse.data.data);

      // Fetch recent points
      const pointsResponse = await api.get("/employee/points?limit=5");
      setPoints(pointsResponse.data.data.points);

      // Fetch pending claims
      const claimsResponse = await api.get("/employee/claims?status=pending");
      setClaims(claimsResponse.data.data.claims);
    } catch (error) {
      console.error("Error fetching employee data:", error);
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
      title: "Total Points",
      value: formatCurrency(stats?.total_points || 0),
      icon: Award,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Points",
      value: formatCurrency(stats?.pending_points || 0),
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Redeemed",
      value: formatCurrency(stats?.redeemed_points || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Claims",
      value: stats?.pending_claims || 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Employee Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your incentive points and earnings
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <DollarSign className="h-4 w-4 mr-2" />
          Request Payout
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

      {/* Recent Points */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incentive Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {points.map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {point.property}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Booking: {formatCurrency(point.booking_amount)} • Date:{" "}
                    {formatDate(point.date)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    className={
                      point.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {point.status}
                  </Badge>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(point.points)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
