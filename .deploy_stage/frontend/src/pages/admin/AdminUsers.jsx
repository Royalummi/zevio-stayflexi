import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Separator } from "../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Textarea } from "../../components/ui/textarea";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Eye,
  ShieldBan,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Calendar,
  DollarSign,
  Award,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  KeyRound,
  MoreHorizontal,
  Building2,
  FileText,
  CreditCard,
  Landmark,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";
import CreateUserDialog from "../../components/admin/CreateUserDialog";

const AdminUsers = () => {
  // State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    vendors: 0,
    active: 0,
    blocked: 0,
  });
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users?limit=1000");
      setUsers(response.data.data.users);
      setFilteredUsers(response.data.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/users/stats");
      const d = response.data.data;
      setStats({
        total: d.total_users || 0,
        customers: d.customers || 0,
        vendors: d.vendors || 0,
        active: d.active_users || 0,
        blocked: d.blocked_users || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query),
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, roleFilter, statusFilter, searchQuery]);

  // View user details
  const handleViewDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Use setTimeout to avoid React warnings when toast is triggered during state update
      setTimeout(() => {
        toast.error("Failed to load user details");
      }, 0);
    }
  };

  // Block user
  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockReason("");
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/users/${selectedUser.id}/status`, {
        status: "blocked",
        reason: blockReason,
      });
      toast.success("User blocked successfully");
      setShowBlockModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(error.response?.data?.error || "Failed to block user");
    } finally {
      setActionLoading(false);
    }
  };

  // Unblock user
  const handleUnblockClick = (user) => {
    setSelectedUser(user);
    setShowUnblockModal(true);
  };

  // Reset temporary password
  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/users/${selectedUser.id}/reset-password`);
      toast.success(`Temporary password sent to ${selectedUser.email}`);
      setShowResetPasswordModal(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmUnblock = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/users/${selectedUser.id}/status`, {
        status: "active",
      });
      toast.success("User unblocked successfully");
      setShowUnblockModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(error.response?.data?.error || "Failed to unblock user");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions
  const getRoleColor = (role) => {
    const colors = {
      customer: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        dark: "dark:bg-blue-900 dark:text-blue-300",
      },
      vendor: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        dark: "dark:bg-purple-900 dark:text-purple-300",
      },
      admin: {
        bg: "bg-red-100",
        text: "text-red-800",
        dark: "dark:bg-red-900 dark:text-red-300",
      },
      super_admin: {
        bg: "bg-gray-900",
        text: "text-white",
        dark: "dark:bg-gray-100 dark:text-gray-900",
      },
    };
    return colors[role] || colors.customer;
  };

  const getRoleLabel = (role) => {
    const labels = {
      customer: "Customer",
      vendor: "Vendor",
      admin: "Admin",
      super_admin: "Super Admin",
    };
    return labels[role] || role;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: {
        bg: "bg-green-100",
        text: "text-green-800",
        dark: "dark:bg-green-900 dark:text-green-300",
      },
      blocked: {
        bg: "bg-red-100",
        text: "text-red-800",
        dark: "dark:bg-red-900 dark:text-red-300",
      },
    };
    return colors[status] || colors.active;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: "Active",
      blocked: "Blocked",
    };
    return labels[status] || status;
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, view details, and control access
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {currentUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Users will appear here once they register"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.phone || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getRoleColor(user.role).bg} ${
                              getRoleColor(user.role).text
                            } ${getRoleColor(user.role).dark}`}
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(user.status).bg} ${
                              getStatusColor(user.status).text
                            } ${getStatusColor(user.status).dark}`}
                          >
                            {getStatusLabel(user.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {user.total_bookings || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatCurrency(user.total_spent || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(user.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleBlockClick(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <ShieldBan className="h-4 w-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUnblockClick(user)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Unblock User
                                </DropdownMenuItem>
                              )}
                              {["customer", "vendor"].includes(user.role) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleResetPasswordClick(user)
                                  }
                                  className="text-amber-600 focus:text-amber-600"
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredUsers.length)} of{" "}
                    {filteredUsers.length} users
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center gap-1">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
            <DialogDescription className="sr-only">
              Complete information about {selectedUser.user?.name}
            </DialogDescription>

            {/* Profile Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white ring-2 ring-white/20">
                  {(selectedUser.user?.name || "?").charAt(0).toUpperCase()}
                </div>
                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-white text-xl font-semibold leading-tight truncate">
                    {selectedUser.user?.name || "—"}
                  </DialogTitle>
                  <p className="mt-0.5 text-sm text-slate-300 truncate">
                    {selectedUser.user?.email}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge className={`${getRoleColor(selectedUser.user?.role).bg} ${getRoleColor(selectedUser.user?.role).text} border-0`}>
                      {getRoleLabel(selectedUser.user?.role)}
                    </Badge>
                    <Badge className={`${getStatusColor(selectedUser.user?.status).bg} ${getStatusColor(selectedUser.user?.status).text} border-0`}>
                      {getStatusLabel(selectedUser.user?.status)}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(selectedUser.user?.created_at)}
                    </span>
                    {selectedUser.user?.profile_completed ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-300">
                        <CheckCircle className="h-3 w-3" /> Profile complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <XCircle className="h-3 w-3" /> Profile incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-4 divide-x border-b bg-muted/30">
              {selectedUser.user?.role === "vendor" ? (
                <>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-indigo-600">{selectedUser.stats?.total_properties || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Properties</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-teal-600">{selectedUser.stats?.active_properties || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Active</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-blue-600">{selectedUser.stats?.total_bookings || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Bookings</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-purple-600">{selectedUser.stats?.completed_bookings || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Completed</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-blue-600">{selectedUser.stats?.total_bookings || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Total</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-yellow-600">{selectedUser.stats?.confirmed_bookings || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Confirmed</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-green-600">{selectedUser.stats?.completed_bookings || 0}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Completed</span>
                  </div>
                  <div className="flex flex-col items-center py-3">
                    <span className="text-2xl font-bold text-purple-600">{formatCurrency(selectedUser.stats?.total_spent || 0)}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Spent</span>
                  </div>
                </>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Contact & Account row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Info */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact Information
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedUser.user?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{selectedUser.user?.phone || "—"}</p>
                      </div>
                    </div>
                    {(selectedUser.user?.address || selectedUser.user?.city) && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">
                            {[selectedUser.user.address, selectedUser.user.city, selectedUser.user.state].filter(Boolean).join(", ")}
                            {selectedUser.user.pincode && ` – ${selectedUser.user.pincode}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedUser.user?.bio && (
                      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground italic">
                        "{selectedUser.user.bio}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Information
                  </p>
                  <div className="space-y-2">
                    {selectedUser.user?.role === "customer" && selectedUser.user?.is_corporate_user === 1 && (
                      <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                        <span className="text-sm text-muted-foreground">Account type</span>
                        <span className="text-sm font-medium text-indigo-600">Corporate</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                      <span className="text-sm text-muted-foreground">Profile</span>
                      <span className={`text-sm font-medium ${selectedUser.user?.profile_completed ? "text-green-600" : "text-gray-400"}`}>
                        {selectedUser.user?.profile_completed ? "Complete" : "Incomplete"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Corporate Details */}
              {selectedUser.user?.role === "customer" && selectedUser.user?.is_corporate_user === 1 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Corporate Details
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border bg-card px-4 py-3">
                        <p className="text-[11px] text-muted-foreground">Company Name</p>
                        <p className="mt-0.5 text-sm font-medium">{selectedUser.user.company_name || "—"}</p>
                      </div>
                      <div className="rounded-md border bg-card px-4 py-3">
                        <p className="text-[11px] text-muted-foreground">Company GST</p>
                        <p className="mt-0.5 text-sm font-medium font-mono">{selectedUser.user.company_gst || "—"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Customer Bank Details */}
              {selectedUser.user?.role === "customer" && selectedUser.user?.bank_details && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5" /> Bank Details
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Bank", value: selectedUser.user.bank_details.bank_name },
                        { label: "Account Holder", value: selectedUser.user.bank_details.account_holder_name },
                        { label: "Account No.", value: selectedUser.user.bank_details.account_number, mono: true },
                        { label: "IFSC", value: selectedUser.user.bank_details.ifsc_code, mono: true },
                        { label: "Branch", value: selectedUser.user.bank_details.branch_name },
                      ].map(({ label, value, mono }) => (
                        <div key={label} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Vendor Business & Bank Details */}
              {selectedUser.user?.role === "vendor" && (
                <>
                  <Separator />
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Business */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Business Information
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "Company", value: selectedUser.user.company_name },
                          { label: "GST Number", value: selectedUser.user.gst_number, mono: true },
                          { label: "PAN Number", value: selectedUser.user.pan_number, mono: true },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                          <span className="text-sm text-muted-foreground">GST Registered</span>
                          <Badge variant="outline" className={`text-xs ${selectedUser.user.is_gst_registered ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"}`}>
                            {selectedUser.user.is_gst_registered ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Bank */}
                    {selectedUser.user.bank_details && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5" /> Bank Details
                        </p>
                        <div className="space-y-2">
                          {[
                            { label: "Bank", value: selectedUser.user.bank_details.bank_name },
                            { label: "Account Holder", value: selectedUser.user.bank_details.account_holder_name || selectedUser.user.bank_details.account_holder },
                            { label: "Account No.", value: selectedUser.user.bank_details.account_number, mono: true },
                            { label: "IFSC", value: selectedUser.user.bank_details.ifsc_code || selectedUser.user.bank_details.ifsc, mono: true },
                            { label: "Branch", value: selectedUser.user.bank_details.branch_name },
                          ].map(({ label, value, mono }) => (
                            <div key={label} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                              <span className="text-sm text-muted-foreground">{label}</span>
                              <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Recent Bookings */}
              {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Bookings
                    </p>
                    <div className="space-y-2">
                      {selectedUser.bookings.slice(0, 4).map((booking) => (
                        <div key={booking.id} className="flex items-center gap-3 rounded-md border bg-card px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{booking.property_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(booking.check_in)} — {formatDate(booking.check_out)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{formatCurrency(booking.total_amount)}</p>
                            <Badge variant="outline" className="mt-0.5 text-[10px] capitalize">{booking.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Block User Modal */}
      {selectedUser && (
        <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Block User</DialogTitle>
              <DialogDescription>
                Are you sure you want to block this user? They won't be able to
                access their account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-4">
                  <div className="text-sm">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    <p className="mt-2 text-xs">
                      <strong>Role:</strong> {getRoleLabel(selectedUser.role)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason for blocking <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Please provide a reason for blocking this user..."
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This reason will be sent to the user via notification
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBlockModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBlock}
                disabled={actionLoading || !blockReason.trim()}
              >
                {actionLoading ? "Blocking..." : "Block User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unblock User Modal */}
      {selectedUser && (
        <Dialog open={showUnblockModal} onOpenChange={setShowUnblockModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">Unblock User</DialogTitle>
              <DialogDescription>
                Are you sure you want to unblock this user? They will regain
                access to their account.
              </DialogDescription>
            </DialogHeader>

            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="text-sm">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <p className="mt-2 text-xs">
                    <strong>Role:</strong> {getRoleLabel(selectedUser.role)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUnblockModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={confirmUnblock}
                disabled={actionLoading}
              >
                {actionLoading ? "Unblocking..." : "Unblock User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Modal */}
      {selectedUser && (
        <Dialog
          open={showResetPasswordModal}
          onOpenChange={setShowResetPasswordModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <KeyRound className="h-5 w-5" />
                Reset Temporary Password
              </DialogTitle>
              <DialogDescription>
                A new temporary password will be generated and sent to the
                user's email. They will be required to change it on their next
                login.
              </DialogDescription>
            </DialogHeader>

            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <CardContent className="pt-4">
                <div className="text-sm">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <p className="mt-2 text-xs">
                    <strong>Role:</strong> {getRoleLabel(selectedUser.role)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowResetPasswordModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={confirmResetPassword}
                disabled={actionLoading}
              >
                {actionLoading ? "Sending..." : "Reset & Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
};

export default AdminUsers;
