import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = location.state?.bookingId;

  useEffect(() => {
    if (!bookingId) {
      navigate("/dashboard");
    }
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed!
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your payment was successful and your villa booking has been
              confirmed.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>What's next?</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Check your email for booking confirmation</li>
                <li>• View booking details in your dashboard</li>
                <li>• Download your invoice</li>
                <li>• Contact us for any queries</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/dashboard")}
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/properties")}
              >
                Book Another Villa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
