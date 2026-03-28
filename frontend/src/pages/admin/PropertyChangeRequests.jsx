import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  ArrowRight,
  Building2,
  User,
  RefreshCw,
  Loader2,
  Wifi,
  Laptop,
  Snowflake,
  Car,
  Utensils,
  Tv,
  Droplet,
  Box,
  Zap,
  Bath,
  Dumbbell,
  Waves,
  Shield,
  Battery,
  MoveVertical,
  Sparkles,
  Package,
  Home,
  Trees,
  Heart,
  Monitor,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Skeleton } from "../../components/ui/skeleton";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";

// ─────────────────────────────────────────────────────────────────
// Field metadata
// ─────────────────────────────────────────────────────────────────
const FIELD_LABELS = {
  title: "Property Title",
  description: "Description",
  address: "Address",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  max_occupancy: "Max Guests",
  max_guests: "Max Guests",
  area_sqft: "Area (sq.ft.)",
  price_per_night: "Price per Night",
  gst_percentage: "GST %",
  min_guests: "Min Guests",
  extra_guest_charge: "Extra Guest Charge",
  min_children: "Min Children",
  max_children: "Max Children",
  extra_child_charge: "Extra Child Charge",
  weekly_discount_percent: "Weekly Discount",
  monthly_discount_percent: "Monthly Discount",
  quarterly_discount_percent: "Quarterly Discount",
  long_term_discount_percent: "Long-term Discount",
  maintenance_charges: "Maintenance Charges",
  notice_period_days: "Notice Period (days)",
  allow_corporate_booking: "Corporate Booking",
  corporate_discount_percent: "Corporate Discount",
  house_rules: "House Rules",
  cancellation_policy: "Cancellation Policy",
  check_in_time: "Check-in Time",
  check_out_time: "Check-out Time",
  amenities: "Amenities",
  area: "Area / Neighborhood",
  state: "State",
  pincode: "Pincode",
  maps_location: "Google Maps Link",
  discount_3_5_days: "Discount (3-5 Days)",
  discount_6_14_days: "Discount (6-14 Days)",
  discount_15_plus_days: "Discount (15+ Days)",
  min_stay_days: "Min Stay (Days)",
  max_stay_days: "Max Stay (Days)",
  housekeeping_frequency: "Housekeeping Frequency",
  laundry_frequency: "Laundry Frequency",
  utilities_included: "Utilities Included",
  parking_slots: "Parking Slots",
  floor_number: "Floor Number",
  wifi_speed_mbps: "WiFi Speed (Mbps)",
  wifi_provider: "WiFi Provider",
  furnishing_type: "Furnishing Type",
  primary_incharge_name: "Primary In-charge Name",
  primary_incharge_phone: "Primary In-charge Phone",
  primary_incharge_email: "Primary In-charge Email",
  primary_incharge_whatsapp: "Primary In-charge WhatsApp",
  primary_incharge_alt_contact: "Primary In-charge Alt Contact",
  secondary_incharge_name: "Secondary In-charge Name",
  secondary_incharge_phone: "Secondary In-charge Phone",
  secondary_incharge_email: "Secondary In-charge Email",
  secondary_incharge_whatsapp: "Secondary In-charge WhatsApp",
  secondary_incharge_alt_contact: "Secondary In-charge Alt Contact",
  same_day_booking_allowed: "Same Day Booking",
  max_booking_days: "Max Booking Days",
  photos: "Photos",
  pool_type: "Pool Type",
  garden_type: "Garden Type",
  pets_allowed: "Pets Allowed",
  events_allowed: "Events Allowed",
  event_capacity: "Event Capacity",
  emergency_contacts: "Emergency Contacts",
  local_area_info: "Local Area Info",
  safety_information: "Safety Information",
};

// Fields that should never appear in change request reviews (system/read-only/removed)
const SKIP_FIELDS = new Set([
  "id",
  "vendor_id",
  "employee_id",
  "created_at",
  "updated_at",
  "deleted_at",
  "rating",
  "reviews_count",
  "is_recommended",
  "recommended_priority",
  "recommended_at",
  "recommended_by",
  "city_name",
  "property_type_name",
  "city_id",
  "property_type_id",
  "status",
  "slug",
  // Removed fields
  "amenities_guide",
  "house_rules_text",
  "check_in_guidelines",
  "deposit_amount",
]);

const FIELD_CATEGORIES = [
  {
    label: "Basic Info",
    fields: [
      "title",
      "description",
      "address",
      "area",
      "state",
      "pincode",
      "maps_location",
      "bedrooms",
      "bathrooms",
      "max_occupancy",
      "max_guests",
      "area_sqft",
      "furnishing_type",
      "floor_number",
      "pool_type",
      "garden_type",
    ],
  },
  {
    label: "Pricing",
    fields: [
      "price_per_night",
      "gst_percentage",
      "min_guests",
      "extra_guest_charge",
      "min_children",
      "max_children",
      "extra_child_charge",
      "maintenance_charges",
    ],
  },
  {
    label: "Discounts",
    fields: [
      "weekly_discount_percent",
      "monthly_discount_percent",
      "quarterly_discount_percent",
      "long_term_discount_percent",
      "discount_3_5_days",
      "discount_6_14_days",
      "discount_15_plus_days",
    ],
  },
  {
    label: "Corporate",
    fields: [
      "allow_corporate_booking",
      "corporate_discount_percent",
      "notice_period_days",
    ],
  },
  {
    label: "Rules & Policies",
    fields: [
      "house_rules",
      "cancellation_policy",
      "check_in_time",
      "check_out_time",
      "pets_allowed",
      "events_allowed",
      "event_capacity",
    ],
  },
  {
    label: "Booking Settings",
    fields: [
      "min_stay_days",
      "max_stay_days",
      "same_day_booking_allowed",
      "max_booking_days",
    ],
  },
  {
    label: "Property Details",
    fields: [
      "wifi_speed_mbps",
      "wifi_provider",
      "parking_slots",
      "utilities_included",
      "housekeeping_frequency",
      "laundry_frequency",
      "photos",
    ],
  },
  {
    label: "In-charge Contacts",
    fields: [
      "primary_incharge_name",
      "primary_incharge_phone",
      "primary_incharge_email",
      "primary_incharge_whatsapp",
      "primary_incharge_alt_contact",
      "secondary_incharge_name",
      "secondary_incharge_phone",
      "secondary_incharge_email",
      "secondary_incharge_whatsapp",
      "secondary_incharge_alt_contact",
    ],
  },
  {
    label: "Guest Information",
    fields: ["emergency_contacts", "local_area_info", "safety_information"],
  },
  { label: "Amenities", fields: ["amenities"] },
];

const CURRENCY_FIELDS = new Set([
  "price_per_night",
  "extra_guest_charge",
  "extra_child_charge",
  "maintenance_charges",
]);
const PERCENT_FIELDS = new Set([
  "gst_percentage",
  "weekly_discount_percent",
  "monthly_discount_percent",
  "quarterly_discount_percent",
  "long_term_discount_percent",
  "corporate_discount_percent",
]);
const BOOL_FIELDS = new Set([
  "allow_corporate_booking",
  "pets_allowed",
  "events_allowed",
  "same_day_booking_allowed",
  "utilities_included",
]);

// Fields with HTML content that should be shown as plain text summary
const HTML_FIELDS = new Set([
  "emergency_contacts",
  "local_area_info",
  "safety_information",
]);

// Fields with structured JSON that need human-readable formatting
const JSON_DISPLAY_FIELDS = new Set(["house_rules", "cancellation_policy"]);

// Amenity icon name → Lucide component
const AMENITY_ICON_MAP = {
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
};

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatJsonField(field, value) {
  if (!value) return "—";
  let obj = value;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return String(value);
    }
  }
  if (typeof obj !== "object") return String(obj);

  if (field === "house_rules") {
    const parts = [];
    if (obj.check_in_after) parts.push(`Check-in: ${obj.check_in_after}`);
    if (obj.check_out_before) parts.push(`Check-out: ${obj.check_out_before}`);
    if (obj.no_smoking) parts.push("No Smoking");
    if (obj.no_parties) parts.push("No Parties");
    if (obj.pets_allowed) parts.push("Pets Allowed");
    if (obj.quiet_hours) parts.push(`Quiet Hours: ${obj.quiet_hours}`);
    return parts.join(" · ") || "—";
  }
  if (field === "cancellation_policy") {
    const parts = [];
    if (obj.policy_type) parts.push(obj.policy_type);
    if (obj.free_cancellation_hours)
      parts.push(`Free cancel: ${obj.free_cancellation_hours}h`);
    if (obj.partial_refund_percentage)
      parts.push(
        `${obj.partial_refund_percentage}% refund up to ${obj.partial_refund_days}d`,
      );
    return parts.join(" · ") || "—";
  }
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(value);
  }
}

function formatFieldValue(field, value, amenityNames) {
  if (value === null || value === undefined || value === "") return "—";
  if (BOOL_FIELDS.has(field)) return Number(value) ? "Yes" : "No";
  if (CURRENCY_FIELDS.has(field))
    return `₹${Number(value).toLocaleString("en-IN")}`;
  if (PERCENT_FIELDS.has(field)) return `${value}%`;
  if (JSON_DISPLAY_FIELDS.has(field)) return formatJsonField(field, value);
  if (HTML_FIELDS.has(field)) {
    const text = stripHtml(typeof value === "string" ? value : String(value));
    return text.length > 200 ? text.slice(0, 200) + "…" : text || "—";
  }
  if (field === "amenities" && Array.isArray(value)) {
    if (amenityNames && Object.keys(amenityNames).length > 0) {
      return value.map((id) => {
        const amenity = amenityNames[id];
        return amenity ? amenity.name : id;
      });
    }
    return `${value.length} selected`;
  }
  if (field === "photos") {
    if (Array.isArray(value))
      return `${value.length} photo${value.length !== 1 ? "s" : ""}`;
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr))
        return `${arr.length} photo${arr.length !== 1 ? "s" : ""}`;
    } catch {}
    return String(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function buildCurrentValues(propertyDetail) {
  if (!propertyDetail) return {};
  const cv = { ...propertyDetail };
  if (propertyDetail.pricing) Object.assign(cv, propertyDetail.pricing);
  if (Array.isArray(propertyDetail.amenities)) {
    cv.amenities = propertyDetail.amenities.map((a) => a.id);
  }
  return cv;
}

function buildAmenityMap(allAmenities) {
  if (!allAmenities || !Array.isArray(allAmenities)) return {};
  const map = {};
  allAmenities.forEach((a) => {
    map[a.id] = { name: a.name, icon: a.icon };
  });
  return map;
}

function parseChanges(raw) {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

function normalizeForCompare(field, value) {
  if (value === null || value === undefined || value === "") return "";
  // For JSON fields, compare stringified
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  // Normalize numbers: "12000.00" vs "12000" vs 12000
  const num = Number(value);
  if (!isNaN(num) && String(value).trim() !== "") return String(num);
  return String(value).trim();
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
const PropertyChangeRequests = () => {
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Review dialog state
  const [reviewRequest, setReviewRequest] = useState(null);
  const [propertyDetail, setPropertyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [allAmenities, setAllAmenities] = useState([]);

  // Fetch all amenities once on mount
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const res = await api.get("/public/amenities");
        const amenitiesData = res.data.data;
        setAllAmenities(amenitiesData?.all || amenitiesData || []);
      } catch (err) {
        console.error("Failed to fetch amenities:", err);
      }
    };
    fetchAmenities();
  }, []);

  useEffect(() => {
    fetchChangeRequests(activeTab);
  }, [activeTab]);

  const fetchChangeRequests = async (status) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/change-requests?status=${status}`);
      setChangeRequests(response.data.data.requests || []);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      toast.error("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  };

  const openReview = async (request) => {
    setReviewRequest(request);
    setShowRejectionForm(false);
    setRejectionReason("");
    setPropertyDetail(null);

    // Only fetch property details if we have a valid property_id
    if (request.property_id) {
      setLoadingDetail(true);
      try {
        const res = await api.get(`/admin/properties/${request.property_id}`);
        setPropertyDetail(res.data.data);
      } catch {
        // Property may be deleted — diff will show proposed values only
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const closeReview = () => {
    setReviewRequest(null);
    setPropertyDetail(null);
    setRejectionReason("");
    setShowRejectionForm(false);
  };

  const handleApprove = async () => {
    if (!reviewRequest) return;
    try {
      setProcessingId(reviewRequest.id);
      await api.patch(`/admin/change-requests/${reviewRequest.id}/approve`);
      toast.success("Change request approved!");
      closeReview();
      fetchChangeRequests(activeTab);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve change request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!reviewRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setProcessingId(reviewRequest.id);
      await api.patch(`/admin/change-requests/${reviewRequest.id}/reject`, {
        rejection_reason: rejectionReason,
      });
      toast.success("Change request rejected");
      closeReview();
      fetchChangeRequests(activeTab);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reject change request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Group pending requests by property
  const groupedPending = useMemo(() => {
    const map = {};
    changeRequests.forEach((req) => {
      if (!map[req.property_id]) {
        map[req.property_id] = {
          property_id: req.property_id,
          property_title: req.property_title,
          property_status: req.property_status,
          vendor_name: req.vendor_name,
          vendor_email: req.vendor_email,
          requests: [],
        };
      }
      map[req.property_id].requests.push(req);
    });
    return Object.values(map);
  }, [changeRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Property Change Requests
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review vendor-requested property updates before they go live
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchChangeRequests(activeTab)}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          setChangeRequests([]);
        }}
      >
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </TabsTrigger>
        </TabsList>

        {/* ── PENDING ───────────────────────────────────────────── */}
        <TabsContent value="pending" className="mt-6 space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : groupedPending.length === 0 ? (
            <EmptyState
              icon={
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              }
              title="No Pending Change Requests"
              desc="All change requests have been processed."
            />
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {groupedPending.length} propert
                {groupedPending.length === 1 ? "y" : "ies"} with pending changes
              </p>
              {groupedPending.map((group) =>
                group.requests.map((req) => (
                  <PropertyRequestCard
                    key={req.id}
                    request={req}
                    group={group}
                    onReview={() => openReview(req)}
                    processingId={processingId}
                  />
                )),
              )}
            </>
          )}
        </TabsContent>

        {/* ── APPROVED ──────────────────────────────────────────── */}
        <TabsContent value="approved" className="mt-6 space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : changeRequests.length === 0 ? (
            <EmptyState
              icon={
                <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              }
              title="No Approved Requests Yet"
              desc="Approved change requests will appear here."
            />
          ) : (
            changeRequests.map((req) => (
              <HistoryCard
                key={req.id}
                request={req}
                onView={() => openReview(req)}
                type="approved"
              />
            ))
          )}
        </TabsContent>

        {/* ── REJECTED ──────────────────────────────────────────── */}
        <TabsContent value="rejected" className="mt-6 space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : changeRequests.length === 0 ? (
            <EmptyState
              icon={
                <XCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              }
              title="No Rejected Requests"
              desc="Rejected change requests will appear here."
            />
          ) : (
            changeRequests.map((req) => (
              <HistoryCard
                key={req.id}
                request={req}
                onView={() => openReview(req)}
                type="rejected"
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Review Dialog ─────────────────────────────────────── */}
      <ReviewDialog
        request={reviewRequest}
        propertyDetail={propertyDetail}
        loadingDetail={loadingDetail}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        showRejectionForm={showRejectionForm}
        setShowRejectionForm={setShowRejectionForm}
        processingId={processingId}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={closeReview}
        isPending={activeTab === "pending"}
        allAmenities={allAmenities}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Property Request Card  (Pending tab)
// ─────────────────────────────────────────────────────────────────
const PropertyRequestCard = ({ request, group, onReview, processingId }) => {
  const changes = parseChanges(request.requested_changes);
  const changedFields = Object.keys(changes).filter((f) => !SKIP_FIELDS.has(f));

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Property header stripe */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-6 py-4 border-b border-amber-100 dark:border-amber-900/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg mt-0.5 flex-shrink-0">
              <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                {group.property_title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {group.vendor_name}
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{group.vendor_email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PropertyStatusBadge status={group.property_status} />
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
              <span>Submitted {formatDate(request.created_at)}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {changedFields.length} field
                {changedFields.length !== 1 ? "s" : ""} changed
              </span>
            </div>
            {/* Changed fields chips */}
            <div className="flex flex-wrap gap-2">
              {changedFields.slice(0, 6).map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {FIELD_LABELS[field] || field.replace(/_/g, " ")}
                </span>
              ))}
              {changedFields.length > 6 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  +{changedFields.length - 6} more
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={onReview}
            disabled={processingId === request.id}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Review Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────
// History Card  (Approved / Rejected tabs)
// ─────────────────────────────────────────────────────────────────
const HistoryCard = ({ request, onView, type }) => {
  const changes = parseChanges(request.requested_changes);
  const changedFields = Object.keys(changes).filter((f) => !SKIP_FIELDS.has(f));
  const isApproved = type === "approved";

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2 rounded-lg flex-shrink-0 ${
                isApproved
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {isApproved ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {request.property_title}
                </span>
                <PropertyStatusBadge status={request.property_status} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {request.vendor_name}
                {request.reviewed_at &&
                  ` • Reviewed ${formatDate(request.reviewed_at)}`}
                {request.reviewed_by_name && ` by ${request.reviewed_by_name}`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {changedFields.slice(0, 5).map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {FIELD_LABELS[field] || field.replace(/_/g, " ")}
                  </span>
                ))}
                {changedFields.length > 5 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{changedFields.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────
// Review Dialog — Before / After diff
// ─────────────────────────────────────────────────────────────────
const ReviewDialog = ({
  request,
  propertyDetail,
  loadingDetail,
  rejectionReason,
  setRejectionReason,
  showRejectionForm,
  setShowRejectionForm,
  processingId,
  onApprove,
  onReject,
  onClose,
  isPending,
  allAmenities,
}) => {
  if (!request) return null;

  const changes = parseChanges(request.requested_changes);
  const currentValues = buildCurrentValues(propertyDetail);
  const amenityMap = buildAmenityMap(allAmenities);

  // Filter: remove skipped fields; for pending requests also hide unchanged fields
  const changedFields = Object.keys(changes).filter((field) => {
    if (SKIP_FIELDS.has(field)) return false;
    if (!isPending) return true; // approved/rejected: show all stored fields
    const currentVal = currentValues[field];
    const newVal = changes[field];
    // Normalize for comparison: stringify both sides
    const curStr = normalizeForCompare(field, currentVal);
    const newStr = normalizeForCompare(field, newVal);
    return curStr !== newStr;
  });

  // Group changed fields by category, skip empty categories
  const categorizedChanges = FIELD_CATEGORIES.map((cat) => ({
    ...cat,
    active: cat.fields.filter((f) => changedFields.includes(f)),
  })).filter((cat) => cat.active.length > 0);

  // Catch-all for fields not in FIELD_CATEGORIES
  const categorizedSet = new Set(FIELD_CATEGORIES.flatMap((c) => c.fields));
  const uncategorized = changedFields.filter((f) => !categorizedSet.has(f));

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[760px] max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-0">
          <DialogTitle className="text-xl">Review Change Request</DialogTitle>

          {/* Property info bar */}
          <div className="flex items-start gap-3 mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex-shrink-0">
              <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {request.property_title}
              </h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <span>Vendor: {request.vendor_name}</span>
                <span>•</span>
                <span>Submitted: {formatDate(request.created_at)}</span>
                <span>•</span>
                <span>
                  {changedFields.length} field
                  {changedFields.length !== 1 ? "s" : ""} changed
                </span>
              </div>
            </div>
            <PropertyStatusBadge status={request.property_status} />
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 min-h-0">
          {/* Impact notice */}
          {isPending && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
              <span>
                If approved, these changes will be{" "}
                <strong>applied immediately</strong> to the live listing visible
                to guests.
              </span>
            </div>
          )}

          {/* Before / After table */}
          {loadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-5">
              {categorizedChanges.map((cat) => (
                <ChangeCategorySection
                  key={cat.label}
                  label={cat.label}
                  fields={cat.active}
                  changes={changes}
                  currentValues={currentValues}
                  amenityMap={amenityMap}
                />
              ))}
              {uncategorized.length > 0 && (
                <ChangeCategorySection
                  label="Other Changes"
                  fields={uncategorized}
                  changes={changes}
                  currentValues={currentValues}
                  amenityMap={amenityMap}
                />
              )}
              {!propertyDetail && !loadingDetail && (
                <p className="text-xs text-gray-400 text-center italic">
                  Current values unavailable — showing proposed changes only
                </p>
              )}
            </div>
          )}

          {/* Rejection reason form (two-step) */}
          {isPending && showRejectionForm && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Explain why these changes cannot be approved — the vendor will receive this message."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {isPending ? (
          <DialogFooter className="flex-shrink-0 flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={!!processingId}
              className="mr-auto"
            >
              Cancel
            </Button>
            {!showRejectionForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  disabled={!!processingId}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={onApprove}
                  disabled={!!processingId}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {processingId ? "Processing…" : "Approve Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowRejectionForm(false)}
                  disabled={!!processingId}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={onReject}
                  disabled={!!processingId || !rejectionReason.trim()}
                >
                  {processingId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {processingId ? "Processing…" : "Confirm Rejection"}
                </Button>
              </>
            )}
          </DialogFooter>
        ) : (
          <DialogFooter className="flex-shrink-0 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────
// Change Category Section  — diff table
// ─────────────────────────────────────────────────────────────────
// Render amenities as icon + name chips
const AmenityChips = ({ ids, amenityMap }) => {
  if (!Array.isArray(ids) || ids.length === 0)
    return <span className="text-gray-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const amenity = amenityMap[id];
        const name = amenity?.name || id;
        const IconComp = amenity?.icon ? AMENITY_ICON_MAP[amenity.icon] : Tag;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            {IconComp && <IconComp className="h-3 w-3" />}
            {name}
          </span>
        );
      })}
    </div>
  );
};

const ChangeCategorySection = ({
  label,
  fields,
  changes,
  currentValues,
  amenityMap,
}) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
      {label}
    </h4>
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Column header */}
      <div className="grid grid-cols-[160px_1fr_20px_1fr] text-xs font-medium bg-gray-50 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span>Field</span>
        <span>Current Value</span>
        <span />
        <span className="text-blue-600 dark:text-blue-400">
          Proposed Change
        </span>
      </div>

      {fields.map((field, idx) => {
        const currentVal = currentValues[field];
        const newVal = changes[field];
        const isModified = String(currentVal) !== String(newVal);
        const isAmenities = field === "amenities";

        return (
          <div
            key={field}
            className={`grid grid-cols-[160px_1fr_20px_1fr] items-start px-4 py-3 gap-2 text-sm ${
              idx % 2 === 0
                ? "bg-white dark:bg-gray-900"
                : "bg-gray-50/60 dark:bg-gray-800/20"
            }`}
          >
            <span className="font-medium text-gray-700 dark:text-gray-300 pt-0.5 break-words">
              {FIELD_LABELS[field] || field.replace(/_/g, " ")}
            </span>
            {isAmenities ? (
              <AmenityChips
                ids={Array.isArray(currentVal) ? currentVal : []}
                amenityMap={amenityMap}
              />
            ) : (
              <span className="text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap">
                {formatFieldValue(field, currentVal, amenityMap)}
              </span>
            )}
            <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 self-center mt-0.5" />
            {isAmenities ? (
              <div
                className={
                  isModified
                    ? "bg-blue-50 dark:bg-blue-950/30 -mx-1 px-1 rounded py-1"
                    : ""
                }
              >
                <AmenityChips
                  ids={Array.isArray(newVal) ? newVal : []}
                  amenityMap={amenityMap}
                />
              </div>
            ) : (
              <span
                className={`break-words whitespace-pre-wrap font-medium ${
                  isModified
                    ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 -mx-1 px-1 rounded"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {formatFieldValue(field, newVal, amenityMap)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────────────
const PropertyStatusBadge = ({ status }) => {
  const cls = {
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
        cls[status] || cls.inactive
      }`}
    >
      {status}
    </span>
  );
};

const EmptyState = ({ icon, title, desc }) => (
  <Card>
    <CardContent className="p-12 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">{desc}</p>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <Card key={i} className="overflow-hidden">
        <div className="px-6 py-4 border-b">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default PropertyChangeRequests;
