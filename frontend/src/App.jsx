import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import PropertyListing from "./pages/PropertyListing";
import PropertyDetail from "./pages/PropertyDetail";
import Payment from "./pages/Payment";
import BookingSuccess from "./pages/BookingSuccess";

// User Pages
import UserDashboardNew from "./pages/user/UserDashboardNew";
import MyBookings from "./pages/user/MyBookings";
import UserProfile from "./pages/user/UserProfile";
import UserPayments from "./pages/user/UserPayments";

// Admin Pages
import AdminDashboardNew from "./pages/admin/AdminDashboardNew";
import AdminBookings from "./pages/admin/ManageBookings";
import ProcessRefunds from "./pages/admin/ProcessRefunds";
import VendorSettlements from "./pages/admin/VendorSettlements";
import EmployeeClaims from "./pages/admin/EmployeeClaims";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";

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
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/properties" element={<PropertyListing />} />
        <Route path="/property/:id" element={<PropertyDetail />} />

        {/* User Dashboard with Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboardNew />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="payments" element={<UserPayments />} />
          <Route path="favorites" element={<div>User Favorites Page</div>} />
        </Route>

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
          <Route path="claims" element={<EmployeeClaims />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Employee Dashboard with Layout */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="points" element={<div>Employee Points Page</div>} />
          <Route path="claims" element={<div>Employee Claims Page</div>} />
          <Route
            path="properties"
            element={<div>Employee Properties Page</div>}
          />
          <Route path="profile" element={<div>Employee Profile Page</div>} />
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
          <Route
            path="properties"
            element={<div>Vendor Properties Page</div>}
          />
          <Route path="bookings" element={<div>Vendor Bookings Page</div>} />
          <Route
            path="settlements"
            element={<div>Vendor Settlements Page</div>}
          />
          <Route path="analytics" element={<div>Vendor Analytics Page</div>} />
          <Route path="profile" element={<div>Vendor Profile Page</div>} />
        </Route>

        {/* Other Protected Routes */}
        <Route
          path="/payment/:bookingId"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-success"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/properties" replace />} />
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
