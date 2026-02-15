import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";

const PropertyChangeRequests = () => {
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/change-requests?status=pending");
      setChangeRequests(response.data.data.changeRequests || []);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      toast.error("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setShowReviewDialog(true);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      await api.patch(`/admin/change-requests/${selectedRequest.id}/approve`);
      toast.success("Change request approved successfully!");
      setShowReviewDialog(false);
      setSelectedRequest(null);
      fetchChangeRequests(); // Refresh list
    } catch (error) {
      console.error("Error approving change request:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve change request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      await api.patch(`/admin/change-requests/${selectedRequest.id}/reject`, {
        rejection_reason: rejectionReason,
      });
      toast.success("Change request rejected");
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchChangeRequests(); // Refresh list
    } catch (error) {
      console.error("Error rejecting change request:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject change request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const renderChangeComparison = (changes) => {
    if (!changes) return null;

    const changesObj =
      typeof changes === "string" ? JSON.parse(changes) : changes;
    const fields = Object.keys(changesObj);

    return (
      <div className="space-y-4">
        {fields.map((field) => {
          const newValue = changesObj[field];
          const displayValue =
            typeof newValue === "object"
              ? JSON.stringify(newValue, null, 2)
              : String(newValue);

          return (
            <div
              key={field}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
            >
              <div className="font-medium text-gray-900 dark:text-white mb-2">
                {field.replace(/_/g, " ").toUpperCase()}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">New Value:</div>
                  <div className="text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-2 rounded">
                    {field === "amenities" && Array.isArray(newValue)
                      ? `${newValue.length} amenities selected`
                      : displayValue}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Property Change Requests
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and approve vendor property change requests
        </p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {changeRequests.length}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending Change Requests
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchChangeRequests}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Requests List */}
      {changeRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Pending Change Requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All change requests have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {changeRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {request.property_title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Vendor: {request.vendor_name}</span>
                      <span>•</span>
                      <span>Submitted: {formatDate(request.created_at)}</span>
                      <span>•</span>
                      <Badge variant="outline">{request.property_status}</Badge>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Requested Changes:
                    </h4>
                    {renderChangeComparison(request.requested_changes)}
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleReview(request, "approve")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={processingId === request.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReview(request, "reject")}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Navigate to property view
                        window.open(
                          `/admin/properties/${request.property_id}`,
                          "_blank",
                        );
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Property
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Change Request"
                : "Reject Change Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "approve" ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Confirm Approval
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      The changes will be applied to the property immediately.
                      Only the modified fields will be updated in the database.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                        Rejection Notice
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        The property will remain live with its current data.
                        Please provide a reason for the vendor.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <Textarea
                    placeholder="Explain why these changes cannot be approved..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {selectedRequest && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Changes Summary:
                </h4>
                {renderChangeComparison(selectedRequest.requested_changes)}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedRequest(null);
                setRejectionReason("");
              }}
              disabled={processingId}
            >
              Cancel
            </Button>
            {actionType === "approve" ? (
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={processingId}
              >
                {processingId ? "Processing..." : "Approve Changes"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processingId || !rejectionReason.trim()}
              >
                {processingId ? "Processing..." : "Reject Request"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyChangeRequests;
