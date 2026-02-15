import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  Edit3,
  Eye,
  Save,
  X,
  AlertTriangle,
  Building2,
  MapPin,
  Users,
  Bed,
  Bath,
  DollarSign,
  Clock,
  Wifi,
  Car,
  Home,
  FileEdit,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

/**
 * PropertyViewEditModal Component
 *
 * Smart modal with two modes:
 * 1. VIEW MODE (default) - Read-only property details
 * 2. EDIT MODE - Quick edit for basic fields
 *
 * Features:
 * - Toggle between view/edit with button
 * - Quick edit: Basic fields only
 * - Advanced Edit: Button to full page for complex changes
 * - Unsaved changes warning
 * - Real-time validation
 * - Mobile responsive
 *
 * Session 52 - Smart Property Editing
 */
const PropertyViewEditModal = ({
  open,
  onClose,
  property,
  onPropertyUpdated,
}) => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fullPropertyData, setFullPropertyData] = useState(null);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    price_per_night: "",
    max_guests: "",
    bedrooms: "",
    bathrooms: "",
    check_in_time: "",
    check_out_time: "",
    wifi_available: false,
    parking_available: false,
    is_featured: false,
    recommended_priority: 0,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch full property details when modal opens
  useEffect(() => {
    if (open && property?.id) {
      fetchPropertyDetails();
    }
  }, [open, property]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/properties/${property.id}`);
      const data = response.data.data;
      setFullPropertyData(data);

      // Initialize form with current values
      setFormData({
        title: data.title || "",
        description: data.description || "",
        status: data.status || "draft",
        price_per_night: data.price_per_night || "",
        max_guests: data.max_guests || "",
        bedrooms: data.bedrooms || "",
        bathrooms: data.bathrooms || "",
        check_in_time: data.check_in_time || "2:00 PM",
        check_out_time: data.check_out_time || "11:00 AM",
        wifi_available: data.wifi_available || false,
        parking_available: data.parking_available || false,
        is_featured: data.is_featured || false,
        recommended_priority: data.recommended_priority || 0,
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.price_per_night || formData.price_per_night <= 0) {
      newErrors.price_per_night = "Valid price is required";
    }
    if (!formData.max_guests || formData.max_guests <= 0) {
      newErrors.max_guests = "At least 1 guest required";
    }
    if (!formData.bedrooms || formData.bedrooms <= 0) {
      newErrors.bedrooms = "At least 1 bedroom required";
    }
    if (!formData.bathrooms || formData.bathrooms <= 0) {
      newErrors.bathrooms = "At least 1 bathroom required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);

      const updatePayload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        price_per_night: parseFloat(formData.price_per_night),
        max_guests: parseInt(formData.max_guests),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        wifi_available: formData.wifi_available,
        parking_available: formData.parking_available,
        is_featured: formData.is_featured,
        recommended_priority: parseInt(formData.recommended_priority),
      };

      await api.put(`/admin/properties/${property.id}`, updatePayload);

      toast.success("Property updated successfully! 🎉");
      setHasUnsavedChanges(false);
      setIsEditMode(false);

      // Notify parent to refresh data
      if (onPropertyUpdated) {
        onPropertyUpdated();
      }

      // Refresh property data
      await fetchPropertyDetails();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error(error.response?.data?.message || "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedEdit = () => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Do you want to discard them and go to advanced edit?",
        )
      ) {
        return;
      }
    }
    onClose();
    navigate(`/admin/properties/${property.id}/edit`);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to close?",
        )
      ) {
        return;
      }
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleToggleEditMode = () => {
    if (isEditMode && hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Discard them?")) {
        return;
      }
      // Reset form to original values
      if (fullPropertyData) {
        setFormData({
          title: fullPropertyData.title || "",
          description: fullPropertyData.description || "",
          status: fullPropertyData.status || "draft",
          price_per_night: fullPropertyData.price_per_night || "",
          max_guests: fullPropertyData.max_guests || "",
          bedrooms: fullPropertyData.bedrooms || "",
          bathrooms: fullPropertyData.bathrooms || "",
          check_in_time: fullPropertyData.check_in_time || "2:00 PM",
          check_out_time: fullPropertyData.check_out_time || "11:00 AM",
          wifi_available: fullPropertyData.wifi_available || false,
          parking_available: fullPropertyData.parking_available || false,
          is_featured: fullPropertyData.is_featured || false,
          recommended_priority: fullPropertyData.recommended_priority || 0,
        });
      }
      setHasUnsavedChanges(false);
    }
    setIsEditMode(!isEditMode);
    setErrors({});
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      pending_approval:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.draft;
  };

  if (!fullPropertyData && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <Edit3 className="h-5 w-5 text-primary" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
                {isEditMode ? "Edit Property" : "Property Details"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditMode
                  ? "Quick edit basic property information"
                  : fullPropertyData?.title}
              </DialogDescription>
            </div>

            {/* Edit Mode Toggle Button */}
            <Button
              variant={isEditMode ? "outline" : "default"}
              size="sm"
              onClick={handleToggleEditMode}
              disabled={loading}
              className="ml-4"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View Mode
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
            </Button>
          </div>

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </h3>

                  {isEditMode ? (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Title */}
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            handleInputChange("title", e.target.value)
                          }
                          className={errors.title ? "border-red-500" : ""}
                        />
                        {errors.title && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.title}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          rows={4}
                          className={errors.description ? "border-red-500" : ""}
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.description}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            handleInputChange("status", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending_approval">
                              Pending Approval
                            </SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Title
                        </p>
                        <p className="font-medium">{fullPropertyData.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Description
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {fullPropertyData.description}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <Badge
                          className={getStatusColor(fullPropertyData.status)}
                        >
                          {fullPropertyData.status
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Pricing & Capacity Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Capacity
                  </h3>

                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Price */}
                      <div>
                        <Label htmlFor="price">Price per Night (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price_per_night}
                          onChange={(e) =>
                            handleInputChange("price_per_night", e.target.value)
                          }
                          className={
                            errors.price_per_night ? "border-red-500" : ""
                          }
                        />
                        {errors.price_per_night && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.price_per_night}
                          </p>
                        )}
                      </div>

                      {/* Max Guests */}
                      <div>
                        <Label htmlFor="max_guests">Max Guests *</Label>
                        <Input
                          id="max_guests"
                          type="number"
                          value={formData.max_guests}
                          onChange={(e) =>
                            handleInputChange("max_guests", e.target.value)
                          }
                          className={errors.max_guests ? "border-red-500" : ""}
                        />
                        {errors.max_guests && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.max_guests}
                          </p>
                        )}
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms *</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) =>
                            handleInputChange("bedrooms", e.target.value)
                          }
                          className={errors.bedrooms ? "border-red-500" : ""}
                        />
                        {errors.bedrooms && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.bedrooms}
                          </p>
                        )}
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <Label htmlFor="bathrooms">Bathrooms *</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          value={formData.bathrooms}
                          onChange={(e) =>
                            handleInputChange("bathrooms", e.target.value)
                          }
                          className={errors.bathrooms ? "border-red-500" : ""}
                        />
                        {errors.bathrooms && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.bathrooms}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Price/Night
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(fullPropertyData.price_per_night)}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Max Guests
                        </p>
                        <p className="text-lg font-bold">
                          {fullPropertyData.max_guests}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Bed className="h-3 w-3" /> Bedrooms
                        </p>
                        <p className="text-lg font-bold">
                          {fullPropertyData.bedrooms}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Bath className="h-3 w-3" /> Bathrooms
                        </p>
                        <p className="text-lg font-bold">
                          {fullPropertyData.bathrooms}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Check-in/Check-out & Amenities */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timing & Features
                  </h3>

                  {isEditMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Check-in Time */}
                        <div>
                          <Label htmlFor="check_in">Check-in Time</Label>
                          <Input
                            id="check_in"
                            value={formData.check_in_time}
                            onChange={(e) =>
                              handleInputChange("check_in_time", e.target.value)
                            }
                          />
                        </div>

                        {/* Check-out Time */}
                        <div>
                          <Label htmlFor="check_out">Check-out Time</Label>
                          <Input
                            id="check_out"
                            value={formData.check_out_time}
                            onChange={(e) =>
                              handleInputChange(
                                "check_out_time",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.wifi_available}
                            onChange={(e) =>
                              handleInputChange(
                                "wifi_available",
                                e.target.checked,
                              )
                            }
                            className="rounded"
                          />
                          <Wifi className="h-4 w-4" />
                          <span>WiFi Available</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.parking_available}
                            onChange={(e) =>
                              handleInputChange(
                                "parking_available",
                                e.target.checked,
                              )
                            }
                            className="rounded"
                          />
                          <Car className="h-4 w-4" />
                          <span>Parking Available</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) =>
                              handleInputChange("is_featured", e.target.checked)
                            }
                            className="rounded"
                          />
                          <Home className="h-4 w-4" />
                          <span>Featured Property</span>
                        </label>
                      </div>

                      {/* Recommended Priority */}
                      <div>
                        <Label htmlFor="priority">
                          Recommended Priority (0-100)
                        </Label>
                        <Input
                          id="priority"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.recommended_priority}
                          onChange={(e) =>
                            handleInputChange(
                              "recommended_priority",
                              e.target.value,
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Higher values appear first
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" /> Check-in
                          </p>
                          <p className="font-medium">
                            {fullPropertyData.check_in_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" /> Check-out
                          </p>
                          <p className="font-medium">
                            {fullPropertyData.check_out_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {fullPropertyData.wifi_available && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Wifi className="h-3 w-3" /> WiFi
                          </Badge>
                        )}
                        {fullPropertyData.parking_available && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Car className="h-3 w-3" /> Parking
                          </Badge>
                        )}
                        {fullPropertyData.is_featured && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Home className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Location Info (Read-only in modal) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>
                        {fullPropertyData.city_name},{" "}
                        {fullPropertyData.city_state}
                      </strong>
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {fullPropertyData.address ||
                        fullPropertyData.area ||
                        "Address not provided"}
                    </p>
                  </div>
                </div>

                {/* Info about Advanced Editing */}
                {!isEditMode && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                          Need to edit more fields?
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          To edit images, amenities, guidelines, or advanced
                          settings, use the
                          <strong> Advanced Edit</strong> button below to open
                          the full editing page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            {/* Advanced Edit Button */}
            <Button
              variant="outline"
              onClick={handleAdvancedEdit}
              disabled={loading}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Advanced Edit
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Cancel/Close */}
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              {isEditMode ? "Cancel" : "Close"}
            </Button>

            {/* Save Changes (only in edit mode) */}
            {isEditMode && (
              <Button
                onClick={handleSaveChanges}
                disabled={loading || !hasUnsavedChanges}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyViewEditModal;
