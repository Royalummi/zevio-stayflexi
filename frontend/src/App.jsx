import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

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
import CancellationPolicies from "./pages/admin/CancellationPolicies";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProperties from "./pages/vendor/VendorProperties";
import AddEditVendorProperty from "./pages/vendor/AddEditVendorProperty";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorSettlementsPage from "./pages/vendor/VendorSettlements";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorProfile from "./pages/vendor/VendorProfile";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

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
        <Route path="/register" element={<Register />} />

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
          <Route
            path="cancellation-policies"
            element={<CancellationPolicies />}
          />
          <Route path="reports" element={<AdminReports />} />
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
          <Route path="profile" element={<VendorProfile />} />
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
