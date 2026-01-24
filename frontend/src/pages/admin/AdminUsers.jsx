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
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

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
      setStats({
        total: response.data.data.total_users || 0,
        customers: response.data.data.customers || 0,
        vendors: response.data.data.vendors || 0,
        active: response.data.data.active_users || 0,
        blocked: response.data.data.blocked_users || 0,
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
      toast.error("Failed to load user details");
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, view details, and control access
          </CardDescription>
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.status === "active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBlockClick(user)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <ShieldBan className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblockClick(user)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete information about the user
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* User Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.user?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.user?.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">City</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.user?.city_name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <Badge
                        className={`mt-1 ${
                          getRoleColor(selectedUser.user?.role).bg
                        } ${getRoleColor(selectedUser.user?.role).text} ${
                          getRoleColor(selectedUser.user?.role).dark
                        }`}
                      >
                        {getRoleLabel(selectedUser.user?.role)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge
                        className={`mt-1 ${
                          getStatusColor(selectedUser.user?.status).bg
                        } ${getStatusColor(selectedUser.user?.status).text} ${
                          getStatusColor(selectedUser.user?.status).dark
                        }`}
                      >
                        {getStatusLabel(selectedUser.user?.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Points</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedUser.user?.points || 0} points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Joined</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedUser.user?.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Booking Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="mb-1 text-2xl font-bold text-blue-600">
                        {selectedUser.stats?.total_bookings || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Bookings
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="mb-1 text-2xl font-bold text-yellow-600">
                        {selectedUser.stats?.confirmed_bookings || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confirmed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="mb-1 text-2xl font-bold text-green-600">
                        {selectedUser.stats?.completed_bookings || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="mb-1 text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedUser.stats?.total_spent || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Spent
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedUser.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between border-b pb-3 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {booking.property_title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.city_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(booking.check_in)} -{" "}
                              {formatDate(booking.check_out)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(booking.total_amount)}
                            </div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
    </div>
  );
};

export default AdminUsers;
