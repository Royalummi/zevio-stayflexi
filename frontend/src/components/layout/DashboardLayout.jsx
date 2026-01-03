import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Home,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Building2,
  Wallet,
  FileText,
  BarChart3,
  UserCircle,
  Award,
  Package,
  ShoppingCart,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile only
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, initializeTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const handleLogout = () => {
    logout();
    // Redirect to Astro homepage after logout
    window.location.href = "http://localhost:4322/";
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const role = user?.role;

    const navItems = {
      admin: [
        { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { name: "Bookings", icon: Calendar, path: "/admin/bookings" },
        { name: "Refunds", icon: CreditCard, path: "/admin/refunds" },
        { name: "Settlements", icon: Wallet, path: "/admin/settlements" },
        { name: "Employee Claims", icon: Award, path: "/admin/claims" },
        { name: "Properties", icon: Building2, path: "/admin/properties" },
        { name: "Users", icon: Users, path: "/admin/users" },
        { name: "Reports", icon: BarChart3, path: "/admin/reports" },
      ],
      super_admin: [
        { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { name: "Bookings", icon: Calendar, path: "/admin/bookings" },
        { name: "Refunds", icon: CreditCard, path: "/admin/refunds" },
        { name: "Settlements", icon: Wallet, path: "/admin/settlements" },
        { name: "Employee Claims", icon: Award, path: "/admin/claims" },
        { name: "Properties", icon: Building2, path: "/admin/properties" },
        { name: "Users", icon: Users, path: "/admin/users" },
        { name: "Reports", icon: BarChart3, path: "/admin/reports" },
      ],
      user: [
        { name: "Dashboard", icon: Home, path: "/dashboard" },
        { name: "My Bookings", icon: Calendar, path: "/dashboard/bookings" },
        { name: "Browse Properties", icon: Building2, path: "/properties" },
        { name: "Favorites", icon: Package, path: "/dashboard/favorites" },
        { name: "Profile", icon: UserCircle, path: "/dashboard/profile" },
        { name: "Payments", icon: CreditCard, path: "/dashboard/payments" },
      ],
      employee: [
        { name: "Dashboard", icon: Home, path: "/employee/dashboard" },
        { name: "My Points", icon: Award, path: "/employee/points" },
        { name: "Claims", icon: Wallet, path: "/employee/claims" },
        { name: "Properties", icon: Building2, path: "/employee/properties" },
        { name: "Profile", icon: UserCircle, path: "/employee/profile" },
      ],
      vendor: [
        { name: "Dashboard", icon: Home, path: "/vendor/dashboard" },
        { name: "My Properties", icon: Building2, path: "/vendor/properties" },
        { name: "Bookings", icon: Calendar, path: "/vendor/bookings" },
        { name: "Settlements", icon: Wallet, path: "/vendor/settlements" },
        { name: "Analytics", icon: BarChart3, path: "/vendor/analytics" },
        { name: "Profile", icon: UserCircle, path: "/vendor/profile" },
      ],
    };

    return navItems[role] || navItems.user;
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    // Exact match for single-level paths
    if (location.pathname === path) {
      return true;
    }
    // For dashboard paths, only match if it's the exact path or a direct sub-route
    if (
      path === "/dashboard" ||
      path === "/admin" ||
      path === "/employee/dashboard" ||
      path === "/vendor/dashboard"
    ) {
      return location.pathname === path;
    }
    // For other paths, check if current path starts with it
    return location.pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Always visible on desktop, toggle on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl transition-transform duration-300 ease-in-out",
          "lg:translate-x-0", // Always visible on desktop
          sidebarOpen ? "translate-x-0" : "-translate-x-full" // Toggle on mobile
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <a
            href="http://localhost:4322/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Zevio
            </span>
          </a>
          {/* Close button only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={user?.avatar}
                alt={user?.name || user?.full_name}
              />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                {(user?.name || user?.full_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || user?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role?.replace("_", " ") || "Guest"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Offset for sidebar on desktop */}
      <div className="lg:ml-64 transition-all duration-300 ease-in-out">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {/* Hamburger menu - mobile only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="relative"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
              </Button>

              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.avatar}
                        alt={user?.name || user?.full_name}
                      />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                        {(user?.name || user?.full_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm font-medium">
                      {user?.name || user?.full_name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.name || user?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
