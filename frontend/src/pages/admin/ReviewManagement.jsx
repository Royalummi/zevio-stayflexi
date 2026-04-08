/**
 * SESSION 64: ADMIN REVIEW MANAGEMENT
 * Moderate, approve, and edit user reviews
 */

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Star,
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

const ReviewManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const itemsPerPage = 20;

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    review_text: "",
    cleanliness_rating: 5,
    accuracy_rating: 5,
    communication_rating: 5,
    location_rating: 5,
    check_in_rating: 5,
    value_rating: 5,
    admin_edit_reason: "",
  });

  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch reviews
  const fetchReviews = async () => {
    // Check permission before making API call
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await api.get(`/admin/reviews?${params.toString()}`);
      setReviews(response.data.data.reviews);
      setTotalPages(response.data.data.pagination.total_pages);
      setTotalReviews(response.data.data.pagination.total_reviews);
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);

      // Handle 403 Forbidden specifically
      if (error.response?.status === 403) {
        setPermissionDenied(true);
        toast.error("Access Denied: Admin permission required");
      } else {
        toast.error("Failed to load reviews");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for user to be loaded from storage before fetching
    if (!user) return;

    fetchReviews();
  }, [currentPage, statusFilter, searchQuery, user]);

  // Handle view details
  const handleViewDetails = async (reviewId) => {
    try {
      const response = await api.get(`/admin/reviews/${reviewId}`);
      setSelectedReview(response.data.data.review);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching review details:", error);
      toast.error("Failed to load review details");
    }
  };

  // Handle edit review
  const handleEditReview = (review) => {
    setSelectedReview(review);
    setEditFormData({
      review_text: review.review_text || "",
      cleanliness_rating: review.cleanliness_rating || 5,
      accuracy_rating: review.accuracy_rating || 5,
      communication_rating: review.communication_rating || 5,
      location_rating: review.location_rating || 5,
      check_in_rating: review.check_in_rating || 5,
      value_rating: review.value_rating || 5,
      admin_edit_reason: "",
    });
    setShowEditModal(true);
  };

  // Handle submit edit
  const handleSubmitEdit = async () => {
    try {
      setActionLoading(true);

      if (!editFormData.admin_edit_reason) {
        toast.error("Please provide a reason for editing");
        return;
      }

      await api.patch(`/admin/reviews/${selectedReview.id}`, editFormData);
      toast.success("Review updated successfully");
      setShowEditModal(false);
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve review
  const handleApproveReview = async (reviewId) => {
    try {
      await api.post(`/admin/reviews/${reviewId}/approve`);
      toast.success("Review approved successfully");
      fetchReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      toast.error("Failed to approve review");
    }
  };

  // Handle reject review
  const handleOpenReject = (review) => {
    setSelectedReview(review);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleSubmitReject = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/reviews/${selectedReview.id}/reject`, {
        rejection_reason: rejectionReason || "Rejected by admin",
      });
      toast.success("Review rejected successfully");
      setShowRejectModal(false);
      fetchReviews();
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Failed to reject review");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = (reviewId) => {
    setDeleteReviewId(reviewId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewId) return;
    try {
      await api.delete(`/admin/reviews/${deleteReviewId}`);
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setShowDeleteDialog(false);
      setDeleteReviewId(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: "Pending", icon: Clock, variant: "secondary" },
      published: { label: "Published", icon: CheckCircle, variant: "default" },
      flagged: { label: "Flagged", icon: Flag, variant: "destructive" },
      removed: { label: "Removed", icon: XCircle, variant: "outline" },
    };
    const config = statuses[status] || statuses.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Render editable star rating
  const renderEditableStars = (rating, onChange) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              } hover:scale-110 transition-transform`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Permission Denied UI
  if (permissionDenied) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto bg-red-100 dark:bg-red-900/20 rounded-full p-3 w-fit mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center text-2xl">
              Access Denied
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Required Role:</strong> Admin or Super Admin
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Your Role:</strong> {user?.role || "Unknown"}
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please contact your system administrator if you believe this is an
              error.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button onClick={() => navigate("/admin")} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-gray-600 mt-1">
          Moderate and manage property reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "published").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "flagged").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews, users, or properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              {totalReviews} total reviews
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            Approve, edit, or reject user reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-gray-600">
                Reviews will appear here when users submit them
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {review.property_name}
                          </div>
                          {review.photo_count > 0 && (
                            <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <ImageIcon className="w-3 h-3" />
                              {review.photo_count} photos
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {review.guest_name || review.user_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {review.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {renderStars(
                            Math.round(Number(review.overall_rating)),
                          )}
                          <span className="text-xs text-gray-600">
                            {Number(review.overall_rating).toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm line-clamp-2">
                            {review.review_text || "No text provided"}
                          </p>
                          {review.is_edited_by_admin && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Edited by Admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {formatDate(review.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(review.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveReview(review.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReject(review)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              {/* Property & User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property</Label>
                  <p className="font-semibold">
                    {selectedReview.property_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReview.city}</p>
                </div>
                <div>
                  <Label>Reviewer</Label>
                  <p className="font-semibold">
                    {selectedReview.guest_name || selectedReview.user_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReview.user_email}
                  </p>
                </div>
              </div>

              {/* Booking Info */}
              {selectedReview.check_in_date && (
                <div>
                  <Label>Stay Period</Label>
                  <p className="text-sm">
                    {formatDate(selectedReview.check_in_date)} -{" "}
                    {formatDate(selectedReview.check_out_date)}
                  </p>
                </div>
              )}

              {/* Overall Rating */}
              <div>
                <Label>Overall Rating</Label>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(
                    Math.round(Number(selectedReview.overall_rating)),
                  )}
                  <span className="font-semibold text-lg">
                    {Number(selectedReview.overall_rating).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Category Ratings */}
              <div>
                <Label>Category Ratings</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    {
                      label: "Cleanliness",
                      value: selectedReview.cleanliness_rating,
                    },
                    {
                      label: "Accuracy",
                      value: selectedReview.accuracy_rating,
                    },
                    {
                      label: "Communication",
                      value: selectedReview.communication_rating,
                    },
                    {
                      label: "Location",
                      value: selectedReview.location_rating,
                    },
                    {
                      label: "Check-in",
                      value: selectedReview.check_in_rating,
                    },
                    { label: "Value", value: selectedReview.value_rating },
                  ].map((category) => (
                    <div
                      key={category.label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{category.label}:</span>
                      <div className="flex items-center gap-1">
                        {renderStars(Number(category.value))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label>Review Text</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {selectedReview.review_text || "No review text provided"}
                </p>
              </div>

              {/* Admin Edit Info */}
              {selectedReview.is_edited_by_admin && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-sm">
                      Edited by Admin
                    </span>
                  </div>
                  {selectedReview.admin_edit_reason && (
                    <p className="text-sm text-gray-600">
                      Reason: {selectedReview.admin_edit_reason}
                    </p>
                  )}
                  {selectedReview.reviewed_by_name && (
                    <p className="text-xs text-gray-600 mt-1">
                      By: {selectedReview.reviewed_by_name} on{" "}
                      {formatDate(selectedReview.reviewed_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Photos */}
              {selectedReview.photo_urls &&
                selectedReview.photo_urls.length > 0 && (
                  <div>
                    <Label>Photos ({selectedReview.photo_urls.length})</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedReview.photo_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Status */}
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedReview.status)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Review (Full Edit Powers)</DialogTitle>
            <DialogDescription>
              You can edit both the review text and all ratings. Changes will be
              marked as "Edited by Admin" for transparency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Review Text */}
            <div>
              <Label>Review Text</Label>
              <Textarea
                value={editFormData.review_text}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    review_text: e.target.value,
                  })
                }
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Rating Categories */}
            <div className="space-y-3">
              <Label>Edit Ratings</Label>
              {[
                { label: "Cleanliness", key: "cleanliness_rating" },
                { label: "Accuracy", key: "accuracy_rating" },
                { label: "Communication", key: "communication_rating" },
                { label: "Location", key: "location_rating" },
                { label: "Check-in", key: "check_in_rating" },
                { label: "Value for Money", key: "value_rating" },
              ].map((category) => (
                <div
                  key={category.key}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{category.label}:</span>
                  {renderEditableStars(editFormData[category.key], (value) =>
                    setEditFormData({ ...editFormData, [category.key]: value }),
                  )}
                </div>
              ))}
            </div>

            {/* Admin Edit Reason */}
            <div>
              <Label>Reason for Editing *</Label>
              <Textarea
                value={editFormData.admin_edit_reason}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    admin_edit_reason: e.target.value,
                  })
                }
                placeholder="E.g., Removed inappropriate language, corrected factual errors..."
                rows={2}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                This reason will be logged for audit purposes
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Transparency Notice</p>
                  <p className="text-gray-600">
                    This review will be marked as "Edited by Admin" and
                    displayed with a transparency badge to users. Your admin
                    name and edit timestamp will be logged.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Review Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>
              This review will be hidden from public view. Please provide a
              reason.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>Rejection Reason</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Contains inappropriate content, violates guidelines..."
              rows={3}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitReject}
              disabled={actionLoading}
            >
              {actionLoading ? "Rejecting..." : "Reject Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteReviewId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewManagement;
