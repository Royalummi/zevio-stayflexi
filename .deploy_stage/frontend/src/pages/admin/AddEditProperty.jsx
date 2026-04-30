import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import AdminPropertyForm from "../../components/admin/AdminPropertyForm";

const AddEditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists, it's edit mode
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(id);

  const handleSuccess = () => {
    toast.success(
      isEditMode
        ? "Property updated successfully"
        : "Property created successfully",
    );
    navigate("/admin/properties");
  };

  const handleCancel = () => {
    navigate("/admin/properties");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/properties")}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Property" : "Add New Property"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isEditMode
                ? "Update property information and settings"
                : "Create a new property listing with all required details"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminPropertyForm
            propertyId={id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEditProperty;
