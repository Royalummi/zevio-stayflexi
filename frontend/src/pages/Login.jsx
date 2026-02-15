import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import PasswordChangeModal from "../components/auth/PasswordChangeModal";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState({
    email: "",
    tempToken: "",
  });
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data, event) => {
    // Prevent any default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setLoading(true);
      console.log("Login attempt:", { email: data.email });

      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      console.log("Login response:", response.data);

      // Check if password change is required
      if (response.data.data.requirePasswordChange) {
        // Store temp data and show password change modal
        setTempPasswordData({
          email: data.email,
          tempToken: response.data.data.tempToken,
        });
        setShowPasswordChange(true);
        toast.warning("Password change required for first-time login");
        return;
      }

      // Normal login flow
      const { user, accessToken, refreshToken } = response.data.data;

      // Store in Zustand store
      setAuth(user, accessToken, refreshToken);

      // Store in localStorage for API interceptor
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Show success message
      toast.success(`Welcome back, ${user.name || user.full_name}!`);

      // Redirect based on role
      if (user.role === "admin" || user.role === "super_admin") {
        console.log("Redirecting admin to /admin");
        navigate("/admin", { replace: true });
      } else if (user.role === "vendor") {
        navigate("/vendor/dashboard", { replace: true });
      } else if (user.role === "user") {
        // Redirect users to Next.js dashboard
        toast.info("Redirecting to customer dashboard...");
        setTimeout(() => {
          window.location.href = "http://localhost:3000/dashboard";
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle password changed successfully
  const handlePasswordChanged = (authData) => {
    const { user, accessToken, refreshToken } = authData;

    // Store in Zustand store
    setAuth(user, accessToken, refreshToken);

    // Store in localStorage for API interceptor
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Close modal
    setShowPasswordChange(false);

    // Show success and redirect
    toast.success(`Welcome, ${user.name || user.full_name}!`);

    if (user.role === "admin" || user.role === "super_admin") {
      navigate("/admin", { replace: true });
    } else if (user.role === "vendor") {
      navigate("/vendor/dashboard", { replace: true });
    } else if (user.role === "user") {
      toast.info("Redirecting to customer dashboard...");
      setTimeout(() => {
        window.location.href = "http://localhost:3000/dashboard";
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Back to Home Link */}
      <a
        href="http://localhost:8000/"
        className="absolute top-4 left-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to Home
      </a>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Zevio</CardTitle>
          <p className="text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <PasswordChangeModal
        open={showPasswordChange}
        onOpenChange={setShowPasswordChange}
        email={tempPasswordData.email}
        tempToken={tempPasswordData.tempToken}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  );
}
