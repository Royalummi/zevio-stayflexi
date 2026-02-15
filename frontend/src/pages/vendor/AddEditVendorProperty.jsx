import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import VendorPropertyForm from "../../components/vendor/VendorPropertyForm";
import api from "../../lib/api";

const AddEditVendorProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState(null);
  const [pendingChangeRequest, setPendingChangeRequest] = useState(null);
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      fetchPropertyDetails();
      checkPendingChangeRequests();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendor/properties/${id}`);
      setProperty(response.data.data);
    } catch (error) {
      toast.error("Failed to load property details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingChangeRequests = async () => {
    try {
      const response = await api.get(
        `/vendor/properties/${id}/change-requests`,
      );
      const pending = response.data.data?.find((cr) => cr.status === "pending");
      setPendingChangeRequest(pending);
    } catch (error) {
      console.error("Failed to check change requests:", error);
    }
  };

  const handleSuccess = (data) => {
    const isApproved = property?.status === "approved";

    if (isApproved && isEditMode) {
      toast.success("Change request submitted successfully");
      toast.info("Changes will be live after admin approval");
    } else {
      toast.success(
        isEditMode
          ? "Property saved successfully"
          : "Property created successfully",
      );
    }

    navigate("/vendor/properties");
  };

  const handleCancel = () => {
    navigate("/vendor/properties");
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!property) return null;

    const badges = {
      draft: { color: "bg-gray-100 text-gray-800", text: "Draft" },
      pending_approval: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Pending Approval",
      },
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      inactive: { color: "bg-red-100 text-red-800", text: "Inactive" },
    };

    const badge = badges[property.status] || badges.draft;

    return (
      <Badge className={badge.color}>
        <span className="font-medium">{badge.text}</span>
      </Badge>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/vendor/properties")}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Property" : "Add New Property"}
              </h1>
              {isEditMode && getStatusBadge()}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isEditMode
                ? property?.status === "approved"
                  ? "Editing an approved property will create a change request for admin review"
                  : "Update property information and settings"
                : "Create a new property listing with all required details"}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Change Request Alert */}
      {pendingChangeRequest && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Pending Change Request
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  This property has a pending change request submitted on{" "}
                  {new Date(
                    pendingChangeRequest.created_at,
                  ).toLocaleDateString()}
                  . The property cannot be edited until the admin reviews your
                  changes.
                </p>
                {pendingChangeRequest.requested_changes?.reason && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    <strong>Reason:</strong>{" "}
                    {pendingChangeRequest.requested_changes.reason}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason Alert */}
      {property?.rejection_reason && property.status === "inactive" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Property Rejected
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  <strong>Admin Feedback:</strong> {property.rejection_reason}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  Please update the property based on the feedback and resubmit
                  for approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorPropertyForm
            propertyId={id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            propertyStatus={property?.status}
            hasPendingChangeRequest={!!pendingChangeRequest}
          />
        </CardContent>
      </Card>

      {/* Help Text */}
      {!isEditMode && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Property Submission Process
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Save as Draft:</strong> Save your progress without
                    submitting for review
                  </li>
                  <li>
                    <strong>Submit for Approval:</strong> Send property to admin
                    for review and approval
                  </li>
                  <li>
                    Once approved, your property will be live on the website
                  </li>
                  <li>
                    Future edits to approved properties will require admin
                    approval
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddEditVendorProperty;
