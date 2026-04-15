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
  Images,
  Phone,
  Star,
  Shield,
  Calendar,
  Tag,
  BarChart3,
  ScrollText,
  Percent,
  Monitor,
  Snowflake,
  Utensils,
  Tv,
  Droplet,
  Box,
  Zap,
  Dumbbell,
  Waves,
  Battery,
  MoveVertical,
  Sparkles,
  Package,
  Trees,
  Heart,
  Laptop,
  Mountain,
  BellRing,
  CheckCircle,
  XOctagon,
  PawPrint,
  PartyPopper,
} from "lucide-react";

// Amenity icon-name → Lucide component map (same as AmenitiesGrid)
const amenityIconMap = {
  wifi: Wifi,
  desk: Laptop,
  snowflake: Snowflake,
  car: Car,
  utensils: Utensils,
  tv: Tv,
  "washing-machine": Droplet,
  refrigerator: Box,
  microwave: Zap,
  "hot-tub": Bath,
  dumbbell: Dumbbell,
  "swimming-pool": Waves,
  shield: Shield,
  battery: Battery,
  elevator: MoveVertical,
  broom: Sparkles,
  laundry: Package,
  balcony: Home,
  tree: Trees,
  paw: Heart,
  monitor: Monitor,
  "private-pool": Waves,
  jacuzzi: Bath,
  mountain: Mountain,
  "smoke-alarm": BellRing,
};

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
        price_per_night:
          data.price_per_night || data.pricing?.price_per_night || "",
        max_guests: data.max_guests || "",
        bedrooms: data.bedrooms || "",
        bathrooms: data.bathrooms || "",
        check_in_time: data.check_in_time || "1:00 PM",
        check_out_time: data.check_out_time || "11:00 AM",
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

      const d = fullPropertyData;

      // Build a complete payload so the backend full-UPDATE doesn't wipe unedited fields.
      // Only the fields exposed in this quick-edit form override; everything else is
      // passed through from the already-fetched fullPropertyData.
      const updatePayload = {
        // ── Identity (required by backend, never edited here) ──
        vendor_id: d.vendor_id,
        city_id: d.city_id,
        property_type_id: d.property_type_id,
        // ── Quick-edit fields ──
        title: formData.title,
        description: formData.description,
        status: formData.status,
        price_per_night: parseFloat(formData.price_per_night),
        original_price: d.original_price ?? d.pricing?.original_price ?? null,
        gst_percentage: d.gst_percentage ?? d.pricing?.gst_percentage ?? 0,
        max_guests: parseInt(formData.max_guests),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        // ── Recommendation (pass through; recommended_priority editable) ──
        is_recommended: d.is_recommended || false,
        recommended_priority: parseInt(formData.recommended_priority),
        // ── Pass-through: location ──
        address: d.address ?? null,
        area: d.area ?? null,
        state: d.state ?? null,
        pincode: d.pincode ?? null,
        maps_location: d.maps_location ?? null,
        // ── Pass-through: property features ──
        pool_type: d.pool_type ?? "none",
        garden_type: d.garden_type ?? "none",
        pets_allowed: d.pets_allowed ?? false,
        events_allowed: d.events_allowed ?? false,
        event_capacity: d.event_capacity ?? null,
        living_area: d.living_area ?? 1,
        furnishing_type: d.furnishing_type ?? "fully_furnished",
        floor_number: d.floor_number ?? null,
        parking_slots: d.parking_slots ?? 0,
        wifi_speed_mbps: d.wifi_speed_mbps ?? null,
        wifi_provider: d.wifi_provider ?? null,
        // ── Pass-through: stay settings ──
        min_stay_days: d.min_stay_days ?? 1,
        max_stay_days: d.max_stay_days ?? null,
        housekeeping_frequency: d.housekeeping_frequency ?? "weekly",
        laundry_frequency: d.laundry_frequency ?? "weekly",
        utilities_included: d.utilities_included ?? false,
        same_day_booking_allowed: d.same_day_booking_allowed ?? true,
        max_booking_days: d.max_booking_days ?? null,
        // ── Pass-through: pricing extras ──
        min_guests: d.pricing?.min_guests ?? d.min_guests ?? 1,
        extra_guest_charge: d.pricing?.extra_guest_charge ?? 0,
        min_children: d.pricing?.min_children ?? 0,
        max_children: d.pricing?.max_children ?? 5,
        extra_child_charge: d.pricing?.extra_child_charge ?? 0,
        weekly_discount_percent: d.pricing?.weekly_discount_percent ?? 0,
        monthly_discount_percent: d.pricing?.monthly_discount_percent ?? 0,
        quarterly_discount_percent: d.pricing?.quarterly_discount_percent ?? 0,
        long_term_discount_percent: d.pricing?.long_term_discount_percent ?? 0,
        allow_corporate_booking: d.pricing?.allow_corporate_booking ?? false,
        corporate_discount_percent: d.pricing?.corporate_discount_percent ?? 0,
        maintenance_charges: d.pricing?.maintenance_charges ?? 0,
        discount_3_5_days: d.pricing?.discount_3_5_days ?? 0,
        discount_6_14_days: d.pricing?.discount_6_14_days ?? 0,
        discount_15_plus_days: d.pricing?.discount_15_plus_days ?? 0,
        // ── Pass-through: incharge contacts (contacts live in property_contacts table,
        //    returned as an array by getPropertyDetails — map back to flat fields) ──
        ...(() => {
          const primary = d.contacts?.find((c) => c.contact_type_id === 1);
          const secondary = d.contacts?.find((c) => c.contact_type_id === 2);
          return {
            primary_incharge_name: primary?.name ?? "",
            primary_incharge_phone: primary?.phone ?? "",
            primary_incharge_email: primary?.email ?? "",
            primary_incharge_whatsapp: primary?.whatsapp ?? "",
            primary_incharge_alt_contact: primary?.alt_contact ?? "",
            secondary_incharge_name: secondary?.name ?? "",
            secondary_incharge_phone: secondary?.phone ?? "",
            secondary_incharge_email: secondary?.email ?? "",
            secondary_incharge_whatsapp: secondary?.whatsapp ?? "",
            secondary_incharge_alt_contact: secondary?.alt_contact ?? "",
          };
        })(),
        // ── Pass-through: rich text guidelines ──
        safety_information: d.safety_information ?? "",
        local_area_info: d.local_area_info ?? "",
        emergency_contacts: d.emergency_contacts ?? "",
        // ── Pass-through: JSON policies ──
        house_rules: d.house_rules ? JSON.stringify(d.house_rules) : "{}",
        cancellation_policy: d.cancellation_policy
          ? JSON.stringify(d.cancellation_policy)
          : "{}",
      };

      // Save main property fields
      await api.put(`/admin/properties/${property.id}`, updatePayload);

      // Save is_featured separately via dedicated endpoint (if changed)
      const featuredChanged = formData.is_featured !== (d.is_featured || false);
      if (featuredChanged) {
        await api.patch(`/admin/properties/${property.id}/featured`, {
          is_featured: formData.is_featured,
        });
      }

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
          check_in_time: fullPropertyData.check_in_time || "1:00 PM",
          check_out_time: fullPropertyData.check_out_time || "11:00 AM",
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

  // Helper: render a label-value field (skips if value is null/undefined/"")
  const Field = ({ label, value, full }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className={full ? "col-span-full" : ""}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium whitespace-pre-line">{value}</p>
      </div>
    );
  };

  const fmtEnum = (v) =>
    v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  const fmtBool = (v) => (v ? "Yes" : "No");
  const fmtPct = (v) => (v && parseFloat(v) > 0 ? `${v}%` : null);

  // Try to parse a JSON-stringified policy field into readable key-value pairs
  const renderPolicyContent = (raw) => {
    if (!raw) return null;

    // If already a parsed object, render key/value pairs directly
    if (typeof raw === "object" && !Array.isArray(raw)) {
      const entries = Object.entries(raw).filter(
        ([, v]) =>
          v !== "" &&
          v !== null &&
          v !== undefined &&
          !(Array.isArray(v) && v.length === 0),
      );
      if (entries.length > 0) {
        return (
          <div className="space-y-2">
            {entries.map(([k, v]) => {
              const label = k
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              const display =
                typeof v === "boolean"
                  ? v
                    ? "Yes"
                    : "No"
                  : Array.isArray(v)
                    ? v.join(", ")
                    : String(v);
              return (
                <div key={k} className="flex items-start gap-2">
                  <span className="text-gray-500 dark:text-gray-400 min-w-[140px] shrink-0">
                    {label}:
                  </span>
                  <span className="font-medium">{display}</span>
                </div>
              );
            })}
          </div>
        );
      }
      return null;
    }

    let str = typeof raw === "string" ? raw : String(raw);
    // Strip wrapping quotes if double-encoded
    if (str.startsWith('"') && str.endsWith('"')) {
      try {
        str = JSON.parse(str);
      } catch {
        /* keep as-is */
      }
    }
    // Try JSON parse
    try {
      const obj = typeof str === "string" ? JSON.parse(str) : str;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const entries = Object.entries(obj).filter(
          ([, v]) =>
            v !== "" &&
            v !== null &&
            v !== undefined &&
            !(Array.isArray(v) && v.length === 0),
        );
        if (entries.length > 0) {
          return (
            <div className="space-y-2">
              {entries.map(([k, v]) => {
                const label = k
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const display =
                  typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
                return (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 min-w-[140px] shrink-0">
                      {label}:
                    </span>
                    <span className="font-medium">{display}</span>
                  </div>
                );
              })}
            </div>
          );
        }
      }
    } catch {
      /* not JSON */
    }
    // If it contains HTML tags, render as HTML
    if (/<[a-z][\s\S]*>/i.test(str)) {
      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: str }}
        />
      );
    }
    // Plain text fallback
    return <span className="whitespace-pre-line">{str}</span>;
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
                          {formatCurrency(
                            fullPropertyData.price_per_night ||
                              fullPropertyData.pricing?.price_per_night,
                          )}
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
                        {fullPropertyData.amenities?.some(
                          (a) => a.icon === "wifi",
                        ) && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Wifi className="h-3 w-3" /> WiFi
                          </Badge>
                        )}
                        {fullPropertyData.amenities?.some(
                          (a) => a.icon === "car",
                        ) && (
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
                    {fullPropertyData.pincode && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        PIN: {fullPropertyData.pincode}
                      </p>
                    )}
                    {fullPropertyData.maps_location && (
                      <a
                        href={fullPropertyData.maps_location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View on Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* ─── Additional View-Only Sections ─── */}
                {!isEditMode && fullPropertyData && (
                  <>
                    {/* Photos */}
                    {fullPropertyData.images?.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Images className="h-5 w-5" />
                            Photos ({fullPropertyData.images.length})
                          </h3>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {fullPropertyData.images.map((img) => (
                              <a
                                key={img.id}
                                href={img.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition"
                              >
                                <img
                                  src={img.image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Vendor & Property Type */}
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Vendor & Property Type
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                        <Field
                          label="Vendor Name"
                          value={fullPropertyData.vendor_name}
                        />
                        <Field
                          label="Vendor Email"
                          value={fullPropertyData.vendor_email}
                        />
                        <Field
                          label="Vendor Phone"
                          value={fullPropertyData.vendor_phone}
                        />
                        <Field
                          label="GST Number"
                          value={fullPropertyData.vendor_gst}
                        />
                        <Field
                          label="Property Type"
                          value={fullPropertyData.property_type_name}
                        />
                        <Field
                          label="Stay Type"
                          value={fmtEnum(fullPropertyData.property_stay_type)}
                        />
                        <Field
                          label="Rating"
                          value={
                            fullPropertyData.rating &&
                            parseFloat(fullPropertyData.rating) > 0
                              ? `${fullPropertyData.rating} ★ (${fullPropertyData.reviews_count} reviews)`
                              : null
                          }
                        />
                        <Field
                          label="Created"
                          value={
                            fullPropertyData.created_at
                              ? formatDate(fullPropertyData.created_at)
                              : null
                          }
                        />
                      </div>
                    </div>

                    {/* Property Details — shown as icon chips for booleans + grid for values */}
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Property Details
                      </h3>

                      {/* Feature badges row */}
                      <div className="flex flex-wrap gap-2">
                        {fullPropertyData.pets_allowed ? (
                          <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" /> Pets Allowed
                          </Badge>
                        ) : null}
                        {fullPropertyData.events_allowed ? (
                          <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" /> Events Allowed
                            {fullPropertyData.event_capacity
                              ? ` (up to ${fullPropertyData.event_capacity})`
                              : ""}
                          </Badge>
                        ) : null}
                        {fullPropertyData.utilities_included ? (
                          <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" /> Utilities
                            Included
                          </Badge>
                        ) : null}
                        {fullPropertyData.pool_type &&
                          fullPropertyData.pool_type !== "none" && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1">
                              <Waves className="h-3 w-3" />{" "}
                              {fmtEnum(fullPropertyData.pool_type)} Pool
                            </Badge>
                          )}
                        {fullPropertyData.garden_type &&
                          fullPropertyData.garden_type !== "none" && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1">
                              <Trees className="h-3 w-3" />{" "}
                              {fmtEnum(fullPropertyData.garden_type)} Garden
                            </Badge>
                          )}
                      </div>

                      {/* Key-value grid — only show meaningful values */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                        <Field
                          label="Living Area (sq ft)"
                          value={
                            fullPropertyData.living_area &&
                            fullPropertyData.living_area > 1
                              ? fullPropertyData.living_area
                              : null
                          }
                        />
                        <Field
                          label="Furnishing"
                          value={fmtEnum(fullPropertyData.furnishing_type)}
                        />
                        <Field
                          label="Floor Number"
                          value={fullPropertyData.floor_number}
                        />
                        <Field
                          label="WiFi Speed"
                          value={
                            fullPropertyData.wifi_speed_mbps
                              ? `${fullPropertyData.wifi_speed_mbps} Mbps`
                              : null
                          }
                        />
                        <Field
                          label="WiFi Provider"
                          value={fullPropertyData.wifi_provider}
                        />
                        <Field
                          label="Parking Slots"
                          value={
                            fullPropertyData.parking_slots > 0
                              ? fullPropertyData.parking_slots
                              : null
                          }
                        />
                        <Field
                          label="Housekeeping"
                          value={fmtEnum(
                            fullPropertyData.housekeeping_frequency,
                          )}
                        />
                        <Field
                          label="Laundry"
                          value={fmtEnum(fullPropertyData.laundry_frequency)}
                        />
                      </div>
                    </div>

                    {/* Booking Settings */}
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Booking Settings
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                        <Field
                          label="Same-Day Booking"
                          value={fmtBool(
                            fullPropertyData.same_day_booking_allowed,
                          )}
                        />
                        <Field
                          label="Min Stay (days)"
                          value={fullPropertyData.min_stay_days}
                        />
                        <Field
                          label="Max Stay (days)"
                          value={fullPropertyData.max_stay_days}
                        />
                        <Field
                          label="Max Booking Days"
                          value={fullPropertyData.max_booking_days}
                        />
                      </div>
                    </div>

                    {/* Detailed Pricing */}
                    {fullPropertyData.pricing && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Percent className="h-5 w-5" />
                            Detailed Pricing
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                            <Field
                              label="GST"
                              value={fmtPct(
                                fullPropertyData.pricing.gst_percentage,
                              )}
                            />
                            <Field
                              label="Min Guests (included)"
                              value={fullPropertyData.pricing.min_guests}
                            />
                            <Field
                              label="Extra Guest Charge"
                              value={
                                parseFloat(
                                  fullPropertyData.pricing.extra_guest_charge,
                                ) > 0
                                  ? formatCurrency(
                                      fullPropertyData.pricing
                                        .extra_guest_charge,
                                    )
                                  : null
                              }
                            />
                            <Field
                              label="Children (min–max)"
                              value={`${fullPropertyData.pricing.min_children ?? 0} – ${fullPropertyData.pricing.max_children ?? 0}`}
                            />
                            <Field
                              label="Extra Child Charge"
                              value={
                                parseFloat(
                                  fullPropertyData.pricing.extra_child_charge,
                                ) > 0
                                  ? formatCurrency(
                                      fullPropertyData.pricing
                                        .extra_child_charge,
                                    )
                                  : null
                              }
                            />
                            <Field
                              label="Deposit"
                              value={
                                fullPropertyData.pricing.deposit_amount &&
                                parseFloat(
                                  fullPropertyData.pricing.deposit_amount,
                                ) > 0
                                  ? formatCurrency(
                                      fullPropertyData.pricing.deposit_amount,
                                    )
                                  : null
                              }
                            />
                            <Field
                              label="Maintenance Charges"
                              value={
                                parseFloat(
                                  fullPropertyData.pricing.maintenance_charges,
                                ) > 0
                                  ? formatCurrency(
                                      fullPropertyData.pricing
                                        .maintenance_charges,
                                    )
                                  : null
                              }
                            />
                            <Field
                              label="Corporate Booking"
                              value={
                                fullPropertyData.pricing.allow_corporate_booking
                                  ? `Yes (${fullPropertyData.pricing.corporate_discount_percent}% discount)`
                                  : "No"
                              }
                            />
                          </div>

                          {/* Discount table */}
                          {(() => {
                            const p = fullPropertyData.pricing;
                            const discounts = [
                              {
                                label: "3–5 Days",
                                value: fmtPct(p.discount_3_5_days),
                              },
                              {
                                label: "6–14 Days",
                                value: fmtPct(p.discount_6_14_days),
                              },
                              {
                                label: "15+ Days",
                                value: fmtPct(p.discount_15_plus_days),
                              },
                              {
                                label: "Weekly",
                                value: fmtPct(p.weekly_discount_percent),
                              },
                              {
                                label: "Monthly",
                                value: fmtPct(p.monthly_discount_percent),
                              },
                              {
                                label: "Quarterly",
                                value: fmtPct(p.quarterly_discount_percent),
                              },
                              {
                                label: "Long Term",
                                value: fmtPct(p.long_term_discount_percent),
                              },
                            ].filter((d) => d.value);
                            if (discounts.length === 0) return null;
                            return (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  Discounts
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {discounts.map((d) => (
                                    <Badge key={d.label} variant="secondary">
                                      {d.label}: {d.value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    {/* Amenities */}
                    {fullPropertyData.amenities?.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Amenities ({fullPropertyData.amenities.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {fullPropertyData.amenities.map((a) => {
                              const Icon = amenityIconMap[a.icon] || Monitor;
                              return (
                                <Badge
                                  key={a.id}
                                  variant="outline"
                                  className="px-3 py-1.5 text-sm gap-1.5"
                                >
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                  {a.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Contacts */}
                    {fullPropertyData.contacts?.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Property Contacts
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {fullPropertyData.contacts.map((c) => (
                              <div
                                key={c.id}
                                className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-1"
                              >
                                <p className="font-medium">{c.name}</p>
                                {c.contact_type_name && (
                                  <p className="text-xs text-gray-500">
                                    {c.contact_type_name}
                                  </p>
                                )}
                                {c.phone && (
                                  <p className="text-sm">📞 {c.phone}</p>
                                )}
                                {c.email && (
                                  <p className="text-sm">✉️ {c.email}</p>
                                )}
                                {c.whatsapp && (
                                  <p className="text-sm">💬 {c.whatsapp}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Policies & Guidelines */}
                    {(fullPropertyData.house_rules ||
                      fullPropertyData.cancellation_policy ||
                      fullPropertyData.safety_information ||
                      fullPropertyData.local_area_info ||
                      fullPropertyData.emergency_contacts ||
                      fullPropertyData.check_in_guidelines) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ScrollText className="h-5 w-5" />
                            Policies & Guidelines
                          </h3>
                          <div className="space-y-4">
                            {fullPropertyData.house_rules && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  House Rules
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.house_rules,
                                  )}
                                </div>
                              </div>
                            )}
                            {fullPropertyData.cancellation_policy && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Cancellation Policy
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.cancellation_policy,
                                  )}
                                </div>
                              </div>
                            )}
                            {fullPropertyData.check_in_guidelines && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Check-in Guidelines
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.check_in_guidelines,
                                  )}
                                </div>
                              </div>
                            )}
                            {fullPropertyData.safety_information && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Safety Information
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.safety_information,
                                  )}
                                </div>
                              </div>
                            )}
                            {fullPropertyData.local_area_info && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Local Area Info
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.local_area_info,
                                  )}
                                </div>
                              </div>
                            )}
                            {fullPropertyData.emergency_contacts && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Emergency Contacts
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                                  {renderPolicyContent(
                                    fullPropertyData.emergency_contacts,
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Booking Stats */}
                    {fullPropertyData.booking_stats && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Booking Stats
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold">
                                {fullPropertyData.booking_stats
                                  .total_bookings ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total Bookings
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {fullPropertyData.booking_stats
                                  .confirmed_bookings ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">Confirmed</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {fullPropertyData.booking_stats
                                  .completed_bookings ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">Completed</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(
                                  fullPropertyData.booking_stats
                                    .total_revenue ?? 0,
                                )}
                              </p>
                              <p className="text-xs text-gray-500">Revenue</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Blackout Dates */}
                    {fullPropertyData.blackout_dates?.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Blackout Dates (
                            {fullPropertyData.blackout_dates.length})
                          </h3>
                          <div className="space-y-2">
                            {fullPropertyData.blackout_dates.map((bd) => (
                              <div
                                key={bd.id}
                                className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm"
                              >
                                <span className="font-medium">
                                  {formatDate(bd.start_date)} →{" "}
                                  {formatDate(bd.end_date)}
                                </span>
                                {bd.reason && (
                                  <span className="text-gray-500">
                                    {bd.reason}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

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
