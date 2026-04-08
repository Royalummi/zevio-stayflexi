import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminDashboardNew from "./pages/admin/AdminDashboardNew";
import AdminBookings from "./pages/admin/ManageBookings";
import ProcessRefunds from "./pages/admin/ProcessRefunds";
import VendorSettlements from "./pages/admin/VendorSettlements";
import AdminProperties from "./pages/admin/AdminProperties";
import AddEditProperty from "./pages/admin/AddEditProperty";
import RecommendedPropertiesManager from "./pages/admin/RecommendedPropertiesManager";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import PropertyChangeRequests from "./pages/admin/PropertyChangeRequests";
import CouponManagement from "./pages/admin/CouponManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";
import BannerManagement from "./pages/admin/BannerManagement";
import CancellationPolicies from "./pages/admin/CancellationPolicies";
import AdminCalendarPricing from "./pages/admin/AdminCalendarPricing";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProperties from "./pages/vendor/VendorProperties";
import AddEditVendorProperty from "./pages/vendor/AddEditVendorProperty";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorSettlementsPage from "./pages/vendor/VendorSettlements";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorCalendarPricing from "./pages/vendor/VendorCalendarPricing";
import VendorTerms from "./pages/vendor/VendorTerms";

// Protected Route Component
const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, accessToken, refreshToken, clearAuth } =
    useAuthStore();

  // If both tokens are expired the user cannot be silently refreshed —
  // clear stale auth state immediately and redirect to login.
  if (
    isAuthenticated &&
    isJwtExpired(accessToken) &&
    isJwtExpired(refreshToken)
  ) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes - Auth Only */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Dashboard with Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardNew />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="refunds" element={<ProcessRefunds />} />
          <Route path="settlements" element={<VendorSettlements />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<AddEditProperty />} />
          <Route path="properties/:id/edit" element={<AddEditProperty />} />
          <Route path="change-requests" element={<PropertyChangeRequests />} />
          <Route
            path="recommended-properties"
            element={<RecommendedPropertiesManager />}
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<CouponManagement />} />
          <Route path="reviews" element={<ReviewManagement />} />
          <Route path="banners" element={<BannerManagement />} />
          <Route
            path="cancellation-policies"
            element={<CancellationPolicies />}
          />
          <Route
            path="vendor-terms"
            element={<Navigate to="/admin/settings" replace />}
          />
          <Route path="calendar-pricing" element={<AdminCalendarPricing />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Vendor Dashboard with Layout */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="properties" element={<VendorProperties />} />
          <Route path="properties/add" element={<AddEditVendorProperty />} />
          <Route
            path="properties/:id/edit"
            element={<AddEditVendorProperty />}
          />
          {/* Service Apartment routes (alias) */}
          <Route
            path="service-apartments/add"
            element={<AddEditVendorProperty />}
          />
          <Route
            path="service-apartments/:id/edit"
            element={<AddEditVendorProperty />}
          />
          <Route path="bookings" element={<VendorBookings />} />
          <Route path="settlements" element={<VendorSettlementsPage />} />
          <Route path="analytics" element={<VendorAnalytics />} />
          <Route path="calendar-pricing" element={<VendorCalendarPricing />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="terms" element={<VendorTerms />} />
          <Route path="settings" element={<VendorSettings />} />
        </Route>

        {/* Default Route - Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unauthorized Access Page */}
        <Route
          path="/unauthorized"
          element={
            <div className="flex items-center justify-center h-screen">
              <p className="text-2xl">Unauthorized Access</p>
            </div>
          }
        />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
