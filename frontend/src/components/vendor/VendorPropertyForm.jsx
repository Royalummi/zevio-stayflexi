import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../admin/AdminPropertyFormQuill.css";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import {
  Loader2,
  Info,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  Image as ImageIcon,
  Shield,
  FileText,
  Phone,
  Star,
  Building,
  UserCircle,
  Users,
} from "lucide-react";
import api from "../../lib/api";
import PropertyImageUpload from "../admin/PropertyImageUpload";
import CityCombobox from "../admin/CityCombobox";
import AmenitiesGrid from "../admin/AmenitiesGrid";
import FormSection from "../admin/FormSection";
import FormProgressBar from "../admin/FormProgressBar";
import PropertyCalendarPricing from "../shared/PropertyCalendarPricing";
import CancellationPolicyInfoCard from "../shared/CancellationPolicyInfoCard";

const VendorPropertyForm = ({
  propertyId = null,
  onSuccess,
  onCancel,
  propertyStatus = "draft", // draft, pending_approval, approved, inactive
  hasPendingChangeRequest = false,
}) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [dropdownLoadError, setDropdownLoadError] = useState(false);

  // Terms & Conditions modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);

  // Get property type from navigation state (passed from property type modal)
  const preSelectedPropertyType = location.state?.propertyTypeId || null;
  const preSelectedPropertyTypeName = location.state?.propertyTypeName || null;

  // Basic Information
  const [formData, setFormData] = useState({
    city_id: "",
    property_type_id: "",
    title: "",
    description: "",
    address: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    maps_location: "",
    bedrooms: 1,
    bathrooms: 1,
    living_area: "",
    max_guests: 2,
    check_in_time: "2:00 PM",
    check_out_time: "11:00 AM",
    price_per_night: "",
    // GST is auto-calculated by backend: 5% if booking ≤₹7,500 | 18% if booking >₹7,500
    status: "draft",

    // Advanced Pricing
    min_guests: 1,
    extra_guest_charge: 0,
    min_children: 0,
    max_children: 5,
    extra_child_charge: 0,

    // Long-term Stay Discounts
    weekly_discount_percent: 15,
    monthly_discount_percent: 25,
    quarterly_discount_percent: 30,
    long_term_discount_percent: 35,
    allow_corporate_booking: false,
    corporate_discount_percent: 20,
    maintenance_charges: 0,
    notice_period_days: 30,
    // Session 70: Villa duration discount slabs (read-only view for vendor)
    discount_3_5_days: 0,
    discount_6_14_days: 0,
    discount_15_plus_days: 0,

    // Service Apartment Fields
    min_stay_days: 1,
    max_stay_days: null,
    housekeeping_frequency: "weekly",
    laundry_frequency: "weekly",
    utilities_included: false,
    parking_slots: 0,
    floor_number: null,
    wifi_speed_mbps: null,
    wifi_provider: "",
    furnishing_type: "fully_furnished",

    // Primary Incharge
    primary_incharge_name: "",
    primary_incharge_phone: "",
    primary_incharge_email: "",
    primary_incharge_whatsapp: "",
    primary_incharge_alt_contact: "",

    // Secondary Incharge
    secondary_incharge_name: "",
    secondary_incharge_phone: "",
    secondary_incharge_email: "",
    secondary_incharge_whatsapp: "",
    secondary_incharge_alt_contact: "",

    // Booking Rules
    same_day_booking_allowed: false,
    max_booking_days: null,

    // Amenities
    amenities: [],

    // House Rules (JSON)
    house_rules: {
      check_in_after: "2:00 PM",
      check_out_before: "11:00 AM",
      no_smoking: true,
      no_parties: true,
      pets_allowed: false,
      quiet_hours: "12:00 PM - 6:00 AM",
      additional_rules: [],
    },

    // Cancellation Policy (JSON)
    cancellation_policy: {
      policy_type: "Flexible",
      free_cancellation_hours: 48,
      free_cancellation_text: "Free cancellation for 48 hours after booking",
      partial_refund_days: 7,
      partial_refund_percentage: 50,
      partial_refund_text:
        "Cancel up to 7 days before check-in for a 50% refund",
      no_refund_text: "Cancellations within 7 days are non-refundable",
      cleaning_fee_refundable: true,
      service_fee_refundable_hours: 48,
      notes: "",
    },

    // Photos
    photos: [],

    // Property features
    pool_type: "none",
    garden_type: "none",
    pets_allowed: false,
    events_allowed: false,
    event_capacity: null,
  });

  // Rich Text Guidelines
  const [guidelines, setGuidelines] = useState({
    safety_information: "",
    local_area_info: "",
    emergency_contacts: "",
  });

  const [additionalRule, setAdditionalRule] = useState("");
  const [photoUrls, setPhotoUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [pendingImageUpload, setPendingImageUpload] = useState(null);
  const [pendingCalendarPrices, setPendingCalendarPrices] = useState([]);
  const [hasSelectedImages, setHasSelectedImages] = useState(false);
  const [selectedImageCount, setSelectedImageCount] = useState(0);

  // Default guideline templates by property type (same as admin)
  const guidelineTemplates = {
    "pt-001": {
      // Villa
      safety_information: `<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>`,
      local_area_info: `<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>`,
      emergency_contacts: `<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>`,
    },
    "pt-002": {
      // Service Apartment
      safety_information: `<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguishers on every floor</li><li><strong>First Aid:</strong> First aid available at reception</li><li><strong>Emergency Exits:</strong> Marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel and CCTV</li><li><strong>Elevator:</strong> Regular maintenance schedule followed</li></ul>`,
      local_area_info: `<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Bus stop/Metro within 500m</li><li><strong>Restaurants:</strong> Multiple dining options nearby</li><li><strong>Shopping:</strong> Supermarkets and malls within 2 km</li><li><strong>ATM/Banks:</strong> Within walking distance</li><li><strong>Hospital:</strong> 24/7 emergency care available nearby</li></ul>`,
      emergency_contacts: `<h3>Emergency Contacts</h3><ul><li><strong>Reception:</strong> +91 XXXXX XXXXX (24/7)</li><li><strong>Security:</strong> Extension 100</li><li><strong>Maintenance:</strong> Extension 200</li><li><strong>Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire:</strong> 101</li></ul>`,
    },
  };

  // Helper: determine property type
  const isVilla = useMemo(
    () => formData.property_type_id === "pt-001",
    [formData.property_type_id],
  );
  const isServiceApartment = useMemo(
    () => formData.property_type_id === "pt-002",
    [formData.property_type_id],
  );

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const sections = [
      {
        name: "Basic Info",
        complete: !!(
          formData.city_id &&
          formData.title &&
          formData.description
        ),
      },
      {
        name: "Location",
        complete: !!(
          formData.address &&
          formData.city &&
          formData.state &&
          formData.pincode
        ),
      },
      {
        name: "Property Details",
        complete: !!(
          formData.bedrooms &&
          formData.bathrooms &&
          formData.max_guests
        ),
      },
      {
        name: "Pricing",
        complete: !!formData.price_per_night,
      },
      {
        name: "Amenities",
        complete: formData.amenities && formData.amenities.length > 0,
      },
      {
        name: "Contact",
        complete: !!(
          formData.primary_incharge_name && formData.primary_incharge_phone
        ),
      },
      {
        name: "Policies",
        complete: !!(formData.house_rules && formData.cancellation_policy),
      },
    ];

    const completedCount = sections.filter((s) => s.complete).length;
    const percentage = Math.round((completedCount / sections.length) * 100);

    return { sections, percentage };
  }, [formData]);

  const quillModules = {
    toolbar: [
      [{ header: [3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  // Define fetch functions BEFORE the useEffects that call them
  const fetchDropdownData = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1500;
    try {
      setDropdownLoadError(false);
      // Fetch cities and property types in parallel
      const [citiesRes, typesRes] = await Promise.all([
        api.get("/public/cities"),
        api.get("/public/property-types"),
      ]);
      if (citiesRes.data.success) {
        const cityData = citiesRes.data.data;
        setCities(Array.isArray(cityData) ? cityData : cityData.cities || []);
      }
      if (typesRes.data.success) setPropertyTypes(typesRes.data.data || []);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Auto-retry with increasing delay (1.5s, 3s, 4.5s)
        setTimeout(
          () => fetchDropdownData(retryCount + 1),
          RETRY_DELAY_MS * (retryCount + 1),
        );
      } else {
        console.error("Error fetching dropdown data after retries:", error);
        setDropdownLoadError(true);
      }
    }
  };

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendor/properties/${propertyId}`);

      if (response.data.success) {
        const property = response.data.data.property || response.data.data;
        const pendingChangeRequest = response.data.data.pendingChangeRequest;
        const apiAmenities = response.data.data.amenities || [];

        if (pendingChangeRequest) {
          toast.warning(
            "This property has a pending change request. Your changes will create a new request once processed.",
          );
        }

        // Safe JSON parsing helper
        const safeJsonParse = (value, fallback) => {
          if (!value) return fallback;
          if (typeof value === "object") return value;
          try {
            return JSON.parse(value);
          } catch (e) {
            return fallback;
          }
        };

        // Extract pricing data if nested
        const pricing = property.pricing || {};

        const loadedFormData = {
          ...formData,
          ...property,
          // Map API field names to form field names
          city: property.city_name || property.city || "",
          state: property.city_state || property.state || "",
          // Extract pricing from nested object (use ?? to preserve 0 values)
          price_per_night:
            pricing.price_per_night ?? property.price_per_night ?? "",
          min_guests: pricing.min_guests ?? property.min_guests ?? 1,
          extra_guest_charge:
            pricing.extra_guest_charge ?? property.extra_guest_charge ?? 0,
          min_children: pricing.min_children ?? property.min_children ?? 0,
          max_children: pricing.max_children ?? property.max_children ?? 5,
          extra_child_charge:
            pricing.extra_child_charge ?? property.extra_child_charge ?? 0,
          weekly_discount_percent:
            pricing.weekly_discount_percent ??
            property.weekly_discount_percent ??
            0,
          monthly_discount_percent:
            pricing.monthly_discount_percent ??
            property.monthly_discount_percent ??
            0,
          quarterly_discount_percent:
            pricing.quarterly_discount_percent ??
            property.quarterly_discount_percent ??
            0,
          long_term_discount_percent:
            pricing.long_term_discount_percent ??
            property.long_term_discount_percent ??
            0,
          allow_corporate_booking:
            pricing.allow_corporate_booking ??
            property.allow_corporate_booking ??
            false,
          corporate_discount_percent:
            pricing.corporate_discount_percent ??
            property.corporate_discount_percent ??
            0,
          maintenance_charges:
            pricing.maintenance_charges ?? property.maintenance_charges ?? 0,
          notice_period_days:
            pricing.notice_period_days ?? property.notice_period_days ?? 30,
          // Villa duration discount slabs (set by admin, read-only for vendor)
          discount_3_5_days:
            parseFloat(
              pricing.discount_3_5_days ?? property.discount_3_5_days,
            ) || 0,
          discount_6_14_days:
            parseFloat(
              pricing.discount_6_14_days ?? property.discount_6_14_days,
            ) || 0,
          discount_15_plus_days:
            parseFloat(
              pricing.discount_15_plus_days ?? property.discount_15_plus_days,
            ) || 0,
          // Parse JSON fields — amenities from API are returned as sibling array of {id,name,...}, extract IDs
          amenities:
            Array.isArray(apiAmenities) && apiAmenities.length > 0
              ? apiAmenities
                  .map((a) =>
                    typeof a === "object" && a !== null && a.id ? a.id : a,
                  )
                  .filter(Boolean)
              : Array.isArray(property.amenities)
                ? property.amenities
                    .map((a) =>
                      typeof a === "object" && a !== null && a.id ? a.id : a,
                    )
                    .filter(Boolean)
                : safeJsonParse(property.amenities, []),
          house_rules: (() => {
            const parsed = safeJsonParse(property.house_rules, {});
            return {
              ...formData.house_rules,
              ...parsed,
              additional_rules: Array.isArray(parsed?.additional_rules)
                ? parsed.additional_rules
                : [],
            };
          })(),
          cancellation_policy: safeJsonParse(
            property.cancellation_policy,
            formData.cancellation_policy,
          ),
          photos: safeJsonParse(property.photos, []),
        };

        setFormData(loadedFormData);

        // Map contacts array back to incharge fields
        const contacts = response.data.data.contacts || [];
        const primary = contacts.find((c) => c.contact_type_id === 1) || {};
        const secondary = contacts.find((c) => c.contact_type_id === 2) || {};
        setFormData((prev) => ({
          ...prev,
          primary_incharge_name: primary.name || "",
          primary_incharge_phone: primary.phone || "",
          primary_incharge_email: primary.email || "",
          secondary_incharge_name: secondary.name || "",
          secondary_incharge_phone: secondary.phone || "",
          secondary_incharge_email: secondary.email || "",
          // Map 5 new property feature fields
          pool_type: property.pool_type || "none",
          garden_type: property.garden_type || "none",
          pets_allowed: !!property.pets_allowed,
          events_allowed: !!property.events_allowed,
          event_capacity: property.event_capacity || null,
        }));

        const loadedGuidelines = {
          safety_information: property.safety_information || "",
          local_area_info: property.local_area_info || "",
          emergency_contacts: property.emergency_contacts || "",
        };
        setGuidelines(loadedGuidelines);

        // Set photo URLs as array
        const parsedPhotos = safeJsonParse(property.photos, []);
        setPhotoUrls(Array.isArray(parsedPhotos) ? parsedPhotos : []);
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    if (propertyId) {
      fetchPropertyData();
    } else if (preSelectedPropertyType) {
      // Set property type from modal selection
      setFormData((prev) => ({
        ...prev,
        property_type_id: preSelectedPropertyType,
      }));
    }
  }, [propertyId, preSelectedPropertyType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load guideline templates when property type is selected (only for new properties)
  useEffect(() => {
    if (!propertyId && formData.property_type_id && !templatesLoaded) {
      const templates = guidelineTemplates[formData.property_type_id];
      if (templates) {
        setGuidelines(templates);
        setTemplatesLoaded(true);
        setTimeout(() => {
          toast.success(
            "Default guidelines loaded! You can customize them as needed.",
          );
        }, 0);
      }
    }
  }, [formData.property_type_id, propertyId, templatesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleGuidelineChange = (field, value) => {
    // Sanitize HTML
    const sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        "h3",
        "h4",
        "p",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "u",
        "a",
        "br",
      ],
      ALLOWED_ATTR: ["href", "target"],
    });
    setGuidelines((prev) => ({ ...prev, [field]: sanitized }));
  };

  const addAdditionalRule = () => {
    if (additionalRule.trim()) {
      setFormData((prev) => ({
        ...prev,
        house_rules: {
          ...prev.house_rules,
          additional_rules: [
            ...prev.house_rules.additional_rules,
            additionalRule.trim(),
          ],
        },
      }));
      setAdditionalRule("");
    }
  };

  const removeAdditionalRule = (index) => {
    setFormData((prev) => ({
      ...prev,
      house_rules: {
        ...prev.house_rules,
        additional_rules: prev.house_rules.additional_rules.filter(
          (_, i) => i !== index,
        ),
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.city_id) newErrors.city_id = "City is required";
    if (!formData.area?.trim()) newErrors.area = "Area / Locality is required";
    if (!formData.pincode?.trim()) newErrors.pincode = "Pincode is required";
    if (!formData.maps_location?.trim())
      newErrors.maps_location = "Google Maps Location is required";
    if (!formData.price_per_night || formData.price_per_night <= 0) {
      newErrors.price_per_night = "Valid price is required";
    }

    // Email validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      formData.primary_incharge_email &&
      !emailRegex.test(formData.primary_incharge_email)
    ) {
      newErrors.primary_incharge_email = "Invalid email format";
    }
    if (
      formData.secondary_incharge_email &&
      !emailRegex.test(formData.secondary_incharge_email)
    ) {
      newErrors.secondary_incharge_email = "Invalid email format";
    }

    // Phone validations (basic)
    const phoneRegex = /^[+]?[\d\s()-]{10,15}$/;
    if (
      formData.primary_incharge_phone &&
      !phoneRegex.test(formData.primary_incharge_phone)
    ) {
      newErrors.primary_incharge_phone = "Invalid phone format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show T&C modal before submitting new property for approval
  const handleShowTermsModal = async (e) => {
    e?.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix validation errors before submitting");
      return;
    }
    try {
      setTermsLoading(true);
      const response = await api.get("/public/vendor-terms");
      if (response.data.success) {
        setTermsContent(response.data.data?.content || "");
      }
    } catch (error) {
      console.error("Error fetching vendor terms:", error);
      setTermsContent(
        "<p>Please agree to Zevio's vendor terms to proceed with your property listing.</p>",
      );
    } finally {
      setTermsLoading(false);
    }
    setTermsAgreed(false);
    setShowTermsModal(true);
  };

  const handleTermsConfirm = () => {
    if (!termsAgreed) {
      toast.error("Please agree to the Terms & Conditions to proceed");
      return;
    }
    setShowTermsModal(false);
    handleSubmit(null, true);
  };

  const handleSubmit = async (e, submitForApproval = true) => {
    e?.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      setLoading(true);

      // Prepare payload
      const { city, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        ...guidelines,
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        house_rules: JSON.stringify(formData.house_rules),
        cancellation_policy: JSON.stringify(formData.cancellation_policy),
        photos: JSON.stringify(
          photoUrls.length > 0
            ? photoUrls
            : Array.isArray(formData.photos)
              ? formData.photos
              : [],
        ),
        // Numeric conversions
        price_per_night: parseFloat(formData.price_per_night) || 0,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        living_area: formData.living_area
          ? parseInt(formData.living_area)
          : null,
        max_guests: parseInt(formData.max_guests) || 2,
        weekly_discount_percent:
          parseFloat(formData.weekly_discount_percent) || 0,
        monthly_discount_percent:
          parseFloat(formData.monthly_discount_percent) || 0,
        quarterly_discount_percent:
          parseFloat(formData.quarterly_discount_percent) || 0,
        long_term_discount_percent:
          parseFloat(formData.long_term_discount_percent) || 0,
        corporate_discount_percent:
          parseFloat(formData.corporate_discount_percent) || 0,
        maintenance_charges: parseFloat(formData.maintenance_charges) || 0,
        notice_period_days: parseInt(formData.notice_period_days) || 30,
        min_stay_days: parseInt(formData.min_stay_days) || 1,
        max_stay_days: formData.max_stay_days
          ? parseInt(formData.max_stay_days)
          : null,
        parking_slots: parseInt(formData.parking_slots) || 0,
        floor_number: formData.floor_number
          ? parseInt(formData.floor_number)
          : null,
        wifi_speed_mbps: formData.wifi_speed_mbps
          ? parseInt(formData.wifi_speed_mbps)
          : null,
        event_capacity: formData.event_capacity
          ? parseInt(formData.event_capacity)
          : null,
        pets_allowed: !!formData.pets_allowed,
        events_allowed: !!formData.events_allowed,
      };

      if (propertyId) {
        // EDITING EXISTING PROPERTY (change request if approved)
        const response = await api.patch(
          `/vendor/properties/${propertyId}`,
          payload,
        );

        if (response.data.success) {
          if (response.data.data?.changeRequestId) {
            toast.success("Change request submitted for admin approval!");
            toast.info(
              "Property will remain live with current data until approved.",
            );
          } else if (response.data.data?.message === "No changes detected") {
            toast.info("No changes detected — property is already up to date.");
          } else {
            toast.success("Property updated successfully!");
          }
          if (onSuccess) onSuccess(response.data);
        } else {
          toast.error(response.data.message || "Failed to update property");
        }
      } else {
        // CREATING NEW PROPERTY
        const createResponse = await api.post("/vendor/properties", payload);

        if (createResponse.data.success) {
          const newPropertyId = createResponse.data.data.id;

          if (submitForApproval) {
            // Submit for approval
            try {
              await api.patch(`/vendor/properties/${newPropertyId}/submit`, {});
              toast.success("Property created and submitted for approval! 🎉");
            } catch {
              toast.warning(
                "Property created but submission failed. You can submit from your properties list.",
              );
            }
          } else {
            toast.success("Property saved as draft!");
          }

          // Upload pending images if any
          if (hasSelectedImages && pendingImageUpload) {
            try {
              await pendingImageUpload(String(newPropertyId));
            } catch {
              toast.warning(
                "Property saved but image upload failed. You can upload them later.",
              );
            }
          }

          // Flush pending calendar prices if any were staged pre-creation
          if (pendingCalendarPrices.length > 0) {
            try {
              await api.post(
                `/vendor/properties/${newPropertyId}/calendar-pricing`,
                {
                  dates: pendingCalendarPrices,
                },
              );
            } catch {
              toast.warning(
                "Property saved but calendar pricing could not be saved. You can set it later.",
              );
            }
          }

          if (onSuccess) onSuccess(createResponse.data);
        } else {
          toast.error(
            createResponse.data.message || "Failed to create property",
          );
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else {
        toast.error("Failed to save property. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && propertyId) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading property data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Form Progress Bar */}
      <FormProgressBar
        completionPercentage={formProgress.percentage}
        sections={formProgress.sections}
      />

      {/* Backend connection error banner */}
      {dropdownLoadError && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>
            ⚠️ Could not connect to the server. Cities and property types may
            not load.
          </span>
          <button
            type="button"
            onClick={() => fetchDropdownData()}
            className="shrink-0 rounded-md bg-destructive px-3 py-1 text-xs font-medium text-white hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Form Header */}
      <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-border">
        <h2 className="text-3xl font-bold text-foreground">
          {propertyId ? "Edit Property" : "Add New Property"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-muted text-foreground border border-border rounded-lg font-semibold hover:bg-muted/80 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <FormSection
          title="Basic Information"
          icon={Building}
          required={true}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* City Selection - Using CityCombobox */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                City <span className="text-destructive">*</span>
              </label>
              <CityCombobox
                value={formData.city_id}
                onChange={(cityId, cityData) => {
                  setFormData((prev) => ({
                    ...prev,
                    city_id: cityId,
                    city: cityData?.name || "",
                    state: cityData?.state || "",
                  }));
                  if (errors.city_id)
                    setErrors((prev) => ({ ...prev, city_id: "" }));
                }}
                error={errors.city_id}
                required={true}
                externalCities={cities}
              />
              {errors.city_id && (
                <span className="text-sm text-destructive mt-1">
                  {errors.city_id}
                </span>
              )}
              {formData.city && formData.state && (
                <small className="text-xs text-primary font-medium mt-1">
                  Selected: {formData.city}, {formData.state}
                </small>
              )}
            </div>

            {/* Property Type - from DB, locked once selected */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                Property Type <span className="text-destructive">*</span>
                {(propertyId || preSelectedPropertyType) && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                    (Cannot be changed)
                  </span>
                )}
              </label>
              <select
                name="property_type_id"
                value={formData.property_type_id || ""}
                onChange={handleInputChange}
                required
                disabled={!!(propertyId || preSelectedPropertyType)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Property Type</option>
                {propertyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                    {type.stay_type === "short_term"
                      ? " — Short Term"
                      : type.stay_type === "long_term"
                        ? " — Long Term"
                        : ""}
                  </option>
                ))}
              </select>
              {errors.property_type_id && (
                <span className="text-sm text-destructive mt-1">
                  {errors.property_type_id}
                </span>
              )}
              {preSelectedPropertyTypeName && !propertyId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {preSelectedPropertyTypeName}
                </p>
              )}
            </div>
          </div>

          {/* Property Title */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Property Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Luxury Beach Villa - Goa"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {errors.title && (
              <span className="text-sm text-destructive mt-1">
                {errors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="5"
              placeholder="Describe your property in detail..."
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all"
            />
          </div>
        </FormSection>

        {/* Section 2: Location Details */}
        <FormSection title="Location Details" icon={MapPin} required={true}>
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Street Address <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Full street address"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Area / Locality */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Area / Locality *
              </label>
              <input
                type="text"
                name="area"
                value={formData.area || ""}
                onChange={handleInputChange}
                placeholder="e.g., Koramangala, Candolim Beach"
                required
                aria-required="true"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <small className="text-xs text-muted-foreground mt-1">
                Specific neighborhood or locality within the city
              </small>
              {errors.area && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.area}
                </span>
              )}
            </div>

            {/* Pincode */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="6-digit pincode"
                required
                aria-required="true"
                maxLength="10"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.pincode && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.pincode}
                </span>
              )}
            </div>
          </div>

          {/* Google Maps URL */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Google Maps Location *
            </label>
            <input
              type="text"
              name="maps_location"
              value={formData.maps_location || ""}
              onChange={handleInputChange}
              placeholder="https://www.google.com/maps?q=12.9352,77.6245"
              required
              aria-required="true"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <small className="text-xs text-muted-foreground mt-1">
              Google Maps URL or coordinates for easy guest navigation
            </small>
            {errors.maps_location && (
              <span className="text-sm text-destructive mt-1" role="alert">
                {errors.maps_location}
              </span>
            )}
          </div>
        </FormSection>

        {/* Section 3: Property Specifications */}
        <FormSection
          title="Property Specifications"
          icon={Home}
          required={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Bedrooms */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Bedrooms <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Bathrooms */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Bathrooms <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Max Guests */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Max Guests <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                name="max_guests"
                value={formData.max_guests}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Living Area */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Living Area (sq ft)
              </label>
              <input
                type="number"
                name="living_area"
                value={formData.living_area || ""}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 1200"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-xs text-muted-foreground mt-1">
                Total living area in square feet
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in Time */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Check-in Time
              </label>
              <input
                type="text"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleInputChange}
                placeholder="e.g., 2:00 PM"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Check-out Time */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Check-out Time
              </label>
              <input
                type="text"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleInputChange}
                placeholder="e.g., 11:00 AM"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Pricing */}
        <FormSection title="Pricing" icon={DollarSign} required={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Price Per Night */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Price Per Night (₹) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.price_per_night && (
                <span className="text-sm text-destructive mt-1">
                  {errors.price_per_night}
                </span>
              )}
            </div>

            {/* GST Info Banner */}
            <div className="flex flex-col">
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 h-full">
                <svg
                  className="h-4 w-4 text-blue-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    GST Auto-Calculated
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                    <strong>5%</strong> GST for bookings ≤ ₹7,500
                    <br />
                    <strong>18%</strong> GST for bookings &gt; ₹7,500
                    <br />
                    Applied on total booking amount at checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Pricing */}
          <div className="p-4 bg-muted/30 border border-border rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guest & Children Pricing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Guests */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Minimum Guests
                </label>
                <input
                  type="number"
                  name="min_guests"
                  value={formData.min_guests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Extra Guest Charge */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Extra Guest Charge (₹)
                </label>
                <input
                  type="number"
                  name="extra_guest_charge"
                  value={formData.extra_guest_charge}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Min Children */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Min Children
                </label>
                <input
                  type="number"
                  name="min_children"
                  value={formData.min_children}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Max Children */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Max Children
                </label>
                <input
                  type="number"
                  name="max_children"
                  value={formData.max_children}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Extra Child Charge */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-2">
                  Extra Child Charge (₹)
                </label>
                <input
                  type="number"
                  name="extra_child_charge"
                  value={formData.extra_child_charge}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Long-term Stay Discounts – only for Service Apartments */}
          {!isVilla && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Long-term Stay Discounts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Weekly Discount (%)
                  </label>
                  <input
                    type="number"
                    name="weekly_discount_percent"
                    value={formData.weekly_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    7+ days stays
                  </small>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Monthly Discount (%)
                  </label>
                  <input
                    type="number"
                    name="monthly_discount_percent"
                    value={formData.monthly_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    30+ days stays
                  </small>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Quarterly Discount (%)
                  </label>
                  <input
                    type="number"
                    name="quarterly_discount_percent"
                    value={formData.quarterly_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    90+ days stays
                  </small>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Long-term Discount (%)
                  </label>
                  <input
                    type="number"
                    name="long_term_discount_percent"
                    value={formData.long_term_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    180+ days stays
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Notice Period */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Notice Period
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  name="notice_period_days"
                  value={formData.notice_period_days}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <small className="text-xs text-muted-foreground mt-1">
                  Required notice for cancellation/checkout
                </small>
              </div>
            </div>
          </div>

          {/* Villa Duration Discount Slabs – read-only for vendor */}
          {isVilla &&
            (formData.discount_3_5_days > 0 ||
              formData.discount_6_14_days > 0 ||
              formData.discount_15_plus_days > 0) && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-foreground mb-1">
                  Villa Duration Discounts
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Discounts set by admin — automatically applied at checkout.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "3–5 Nights", val: formData.discount_3_5_days },
                    { label: "6–14 Nights", val: formData.discount_6_14_days },
                    {
                      label: "15+ Nights",
                      val: formData.discount_15_plus_days,
                    },
                  ].map(
                    ({ label, val }) =>
                      val > 0 && (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-lg border border-border bg-green-50 dark:bg-green-950/20 px-4 py-3"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {label}
                          </span>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            {val}% off
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            )}
        </FormSection>

        {/* Section 4.6: Calendar Day-wise Pricing */}
        <FormSection
          title="📅 Calendar Pricing"
          icon={Calendar}
          defaultOpen={false}
        >
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Override the base nightly rate for specific dates or ranges —
              useful for weekends, holidays, or seasonal peaks. Custom prices
              take precedence over the base rate at checkout.
            </p>
          </div>
          <PropertyCalendarPricing
            propertyId={propertyId || null}
            basePrice={parseFloat(formData.price_per_night) || 0}
            canEdit={true}
            role="vendor"
            onPendingChange={setPendingCalendarPrices}
          />
        </FormSection>

        {/* Section 4.5: Service Apartment Details - Only for Service Apartments */}
        {isServiceApartment && (
          <FormSection
            title="Service Apartment Details"
            icon={Building}
            defaultOpen={true}
          >
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong className="font-semibold">
                  Service Apartment Specific:
                </strong>{" "}
                These fields are tailored for long-term stays (30+ days).
              </p>
            </div>

            <h4 className="text-lg font-semibold text-foreground mb-4">
              Stay Duration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Minimum Stay (Days)
                </label>
                <input
                  type="number"
                  name="min_stay_days"
                  value={formData.min_stay_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <small className="text-xs text-muted-foreground mt-1">
                  Required minimum booking duration
                </small>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Maximum Stay (Days)
                </label>
                <input
                  type="number"
                  name="max_stay_days"
                  value={formData.max_stay_days || ""}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <small className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited
                </small>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
              Services & Facilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Housekeeping Frequency
                </label>
                <select
                  name="housekeeping_frequency"
                  value={formData.housekeeping_frequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="on_request">On Request</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Laundry Frequency
                </label>
                <select
                  name="laundry_frequency"
                  value={formData.laundry_frequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="on_request">On Request</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Furnishing Type
                </label>
                <select
                  name="furnishing_type"
                  value={formData.furnishing_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Parking Slots
                </label>
                <input
                  type="number"
                  name="parking_slots"
                  value={formData.parking_slots}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Floor Number
                </label>
                <input
                  type="number"
                  name="floor_number"
                  value={formData.floor_number || ""}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Ground = 0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  WiFi Speed (Mbps)
                </label>
                <input
                  type="number"
                  name="wifi_speed_mbps"
                  value={formData.wifi_speed_mbps || ""}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="e.g., 100"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  WiFi Provider
                </label>
                <input
                  type="text"
                  name="wifi_provider"
                  value={formData.wifi_provider || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Airtel Fiber, Jio"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  name="utilities_included"
                  checked={formData.utilities_included}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  id="utilities_included"
                />
                <label
                  htmlFor="utilities_included"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Utilities Included (Electricity, Water, Gas)
                </label>
              </div>
            </div>
          </FormSection>
        )}

        {/* Section 5: Primary Property Incharge */}
        <FormSection
          title="Primary Property Incharge"
          icon={Phone}
          required={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="primary_incharge_name"
                value={formData.primary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="primary_incharge_phone"
                value={formData.primary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+91XXXXXXXXXX"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.primary_incharge_phone && (
                <span className="text-sm text-destructive mt-1">
                  {errors.primary_incharge_phone}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="primary_incharge_email"
                value={formData.primary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.primary_incharge_email && (
                <span className="text-sm text-destructive mt-1">
                  {errors.primary_incharge_email}
                </span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="primary_incharge_whatsapp"
                value={formData.primary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+91XXXXXXXXXX"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Alternative Contact */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2">
                Alternative Contact
              </label>
              <input
                type="text"
                name="primary_incharge_alt_contact"
                value={formData.primary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="Alternative phone number"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 6: Secondary Property Incharge */}
        <FormSection
          title="Secondary Property Incharge (Optional)"
          icon={UserCircle}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="secondary_incharge_name"
                value={formData.secondary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="secondary_incharge_phone"
                value={formData.secondary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+91XXXXXXXXXX"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="secondary_incharge_email"
                value={formData.secondary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.secondary_incharge_email && (
                <span className="text-sm text-destructive mt-1">
                  {errors.secondary_incharge_email}
                </span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="secondary_incharge_whatsapp"
                value={formData.secondary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+91XXXXXXXXXX"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Alternative Contact */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2">
                Alternative Contact
              </label>
              <input
                type="text"
                name="secondary_incharge_alt_contact"
                value={formData.secondary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="Alternative phone number"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 7: Booking Rules */}
        <FormSection title="Booking Rules" icon={Calendar} defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Same Day Booking */}
            <div className="flex items-center space-x-3 p-4 bg-muted/30 border border-border rounded-lg">
              <input
                type="checkbox"
                name="same_day_booking_allowed"
                checked={formData.same_day_booking_allowed}
                onChange={handleInputChange}
                className="h-5 w-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium text-foreground cursor-pointer">
                Allow Same-Day Bookings
              </label>
            </div>

            {/* Max Booking Days */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Maximum Booking Days
              </label>
              <input
                type="number"
                name="max_booking_days"
                value={formData.max_booking_days || ""}
                onChange={handleInputChange}
                min="1"
                placeholder="Leave empty for unlimited"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited booking duration
              </span>
            </div>
          </div>
        </FormSection>

        {/* Section 8: Amenities */}
        <FormSection title="Amenities" icon={Star} required={true}>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select all amenities available at your property
            </p>
            <AmenitiesGrid
              selectedAmenities={formData.amenities}
              onChange={(selected) =>
                setFormData({ ...formData, amenities: selected })
              }
            />
          </div>
        </FormSection>

        {/* Section 9: House Rules */}
        <FormSection title="House Rules" icon={Shield} defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Check-in After */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Check-in After
              </label>
              <input
                type="text"
                value={formData.house_rules.check_in_after}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "check_in_after",
                    e.target.value,
                  )
                }
                placeholder="2:00 PM"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Check-out Before */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Check-out Before
              </label>
              <input
                type="text"
                value={formData.house_rules.check_out_before}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "check_out_before",
                    e.target.value,
                  )
                }
                placeholder="11:00 AM"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Rule Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-4 bg-muted/30 border border-border rounded-lg">
              <input
                type="checkbox"
                checked={formData.house_rules.no_smoking}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "no_smoking",
                    e.target.checked,
                  )
                }
                className="h-5 w-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium text-foreground">
                No Smoking
              </label>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/30 border border-border rounded-lg">
              <input
                type="checkbox"
                checked={formData.house_rules.no_parties}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "no_parties",
                    e.target.checked,
                  )
                }
                className="h-5 w-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium text-foreground">
                No Parties/Events
              </label>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/30 border border-border rounded-lg">
              <input
                type="checkbox"
                checked={formData.house_rules.pets_allowed}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "pets_allowed",
                    e.target.checked,
                  )
                }
                className="h-5 w-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium text-foreground">
                Pets Allowed
              </label>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Quiet Hours
            </label>
            <input
              type="text"
              value={formData.house_rules.quiet_hours}
              onChange={(e) =>
                handleNestedChange("house_rules", "quiet_hours", e.target.value)
              }
              placeholder="12:00 PM - 6:00 AM"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Additional Rules */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Additional Rules
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={additionalRule}
                onChange={(e) => setAdditionalRule(e.target.value)}
                placeholder="Enter additional rule"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAdditionalRule())
                }
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={addAdditionalRule}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.house_rules.additional_rules?.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg"
                >
                  <span className="text-sm text-foreground">{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeAdditionalRule(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FormSection>

        {/* Section 10: Property Images */}
        <FormSection title="Property Images" icon={ImageIcon}>
          <PropertyImageUpload
            propertyId={propertyId}
            onImagesChange={({ uploadPending, hasPendingUploads }) => {
              setPendingImageUpload(() => uploadPending);
              setHasSelectedImages(hasPendingUploads);
            }}
            allowPreUpload={!propertyId}
            apiBasePath="/vendor/properties"
          />
        </FormSection>

        {/* Section 11: Rich Text Guidelines */}
        <FormSection
          title="Property Guidelines & Information"
          icon={FileText}
          defaultOpen={false}
        >
          <div className="space-y-6">
            {/* Safety Information */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Safety Information
              </label>
              <ReactQuill
                value={guidelines.safety_information}
                onChange={(value) =>
                  handleGuidelineChange("safety_information", value)
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Fire safety, emergency exits, first aid..."
                className="bg-background border border-border rounded-lg"
              />
            </div>

            {/* Local Area Information */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Local Area Information
              </label>
              <ReactQuill
                value={guidelines.local_area_info}
                onChange={(value) =>
                  handleGuidelineChange("local_area_info", value)
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Nearby restaurants, ATMs, hospitals..."
                className="bg-background border border-border rounded-lg"
              />
            </div>

            {/* Emergency Contacts */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Emergency Contacts
              </label>
              <ReactQuill
                value={guidelines.emergency_contacts}
                onChange={(value) =>
                  handleGuidelineChange("emergency_contacts", value)
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Police, ambulance, fire, property manager..."
                className="bg-background border border-border rounded-lg"
              />
            </div>
          </div>
        </FormSection>

        {/* Cancellation Policy Info */}
        <FormSection
          title="Cancellation Policy"
          icon={Shield}
          defaultOpen={true}
        >
          <p className="text-sm text-muted-foreground mb-4">
            The active cancellation policy for this property type is set by the
            admin and shown to guests at the time of booking.
          </p>
          <CancellationPolicyInfoCard
            propertyTypeId={formData.property_type_id}
            isAdmin={false}
          />
        </FormSection>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 p-6 bg-card border border-border rounded-lg">
          {propertyStatus === "draft" || !propertyId ? (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || hasPendingChangeRequest}
                className="flex-1 px-6 py-3 bg-muted text-foreground border border-border rounded-lg font-semibold hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save as Draft"
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleShowTermsModal(e)}
                disabled={loading || hasPendingChangeRequest || termsLoading}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading || termsLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {termsLoading ? "Loading T&C..." : "Submitting..."}
                  </span>
                ) : (
                  "Submit for Approval"
                )}
              </button>
            </>
          ) : propertyStatus === "approved" ? (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || hasPendingChangeRequest}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Change Request"
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className="flex-1 px-6 py-3 bg-muted text-muted-foreground border border-border rounded-lg font-semibold cursor-not-allowed"
            >
              {propertyStatus === "pending_approval"
                ? "Pending Admin Approval"
                : "Property Inactive"}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-muted text-foreground border border-border rounded-lg font-semibold hover:bg-muted/80 transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {hasPendingChangeRequest && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This property has a pending change request. Please wait for
                admin review before making new changes.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default VendorPropertyForm;
