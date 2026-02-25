import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./AdminPropertyFormQuill.css";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import {
  Loader2,
  Info,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  Image,
  Shield,
  FileText,
  Phone,
  Star,
  Building,
  UserCircle,
  Users,
} from "lucide-react";
import api from "../../lib/api";
import PropertyImageUpload from "./PropertyImageUpload";
import CityCombobox from "./CityCombobox";
import AmenitiesGrid from "./AmenitiesGrid";
import FormSection from "./FormSection";
import FormProgressBar from "./FormProgressBar";
import PropertyCalendarPricing from "../shared/PropertyCalendarPricing";
import CancellationPolicyInfoCard from "../shared/CancellationPolicyInfoCard";

const AdminPropertyForm = ({ propertyId = null, onSuccess, onCancel }) => {
  // Ensure propertyId is either null or a string
  const sanitizedPropertyId = propertyId ? String(propertyId) : null;

  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [pendingImageUpload, setPendingImageUpload] = useState(null);
  const [pendingCalendarPrices, setPendingCalendarPrices] = useState([]);
  const [hasSelectedImages, setHasSelectedImages] = useState(false);
  const [selectedImageCount, setSelectedImageCount] = useState(0);

  // Get property type from location state (passed from modal)
  const preSelectedPropertyType = location.state?.propertyTypeId || null;
  const preSelectedPropertyTypeName = location.state?.propertyTypeName || null;

  // Basic Information
  const [formData, setFormData] = useState({
    vendor_id: "",
    city_id: "",
    property_type_id: "",
    title: "",
    description: "",
    address: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    check_in_time: "2:00 PM",
    check_out_time: "11:00 AM",
    price_per_night: "",
    // GST is auto-calculated by backend: 5% if booking ≤₹7,500 | 18% if booking >₹7,500
    status: "draft",

    // Location
    maps_location: "",

    // Advanced Pricing
    min_guests: 1,
    extra_guest_charge: 0,
    min_children: 0,
    max_children: 5,
    extra_child_charge: 0,

    // Long-term Pricing & Discounts
    weekly_discount_percent: 15,
    monthly_discount_percent: 25,
    quarterly_discount_percent: 30,
    long_term_discount_percent: 35,
    allow_corporate_booking: false,
    corporate_discount_percent: 20,
    deposit_amount: 0,
    maintenance_charges: 0,
    notice_period_days: 30,
    // Session 70: Villa Duration Discount Slabs (admin-only)
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

    // Villa Specific Fields
    pool_type: "none",
    garden_type: "none",
    pets_allowed: false,
    events_allowed: false,
    event_capacity: null,

    // Recommendations
    is_recommended: false,
    recommended_priority: 0,

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
      no_events: false,
      pets_allowed: false,
      pets_approval_required: false,
      quiet_hours: "10:00 PM - 8:00 AM",
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
  });

  // Rich Text Guidelines
  const [guidelines, setGuidelines] = useState({
    check_in_guidelines: "",
    house_rules_text: "",
    amenities_guide: "",
    safety_information: "",
    local_area_info: "",
    emergency_contacts: "",
  });

  const [additionalRule, setAdditionalRule] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [photoUrls, setPhotoUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Dirty field tracking for optimized updates (Industry Standard)
  const [originalFormData, setOriginalFormData] = useState(null);
  const [originalGuidelines, setOriginalGuidelines] = useState(null);
  const [dirtyFields, setDirtyFields] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Default guideline templates by property type
  const guidelineTemplates = {
    "pt-001": {
      // Villa
      check_in_guidelines: `<h3>Check-In Guidelines</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Keys will be handed over by our property manager at the villa</li><li><strong>ID Proof:</strong> Please carry a valid government-issued ID</li><li><strong>Security Deposit:</strong> Refundable deposit will be collected at check-in</li><li><strong>Parking:</strong> Designated parking available on premises</li></ul>`,
      house_rules_text: `<h3>House Rules</h3><ul><li>No smoking inside the villa</li><li>Parties and events require prior approval</li><li>Quiet hours: 10:00 PM - 8:00 AM</li><li>Please respect the neighbors</li><li>Maximum occupancy must be maintained</li><li>Pets allowed with prior approval</li></ul>`,
      amenities_guide: `<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> Network name and password will be provided at check-in</li><li><strong>Air Conditioning:</strong> Remote controls available in all bedrooms</li><li><strong>Kitchen:</strong> Fully equipped with basic utensils, gas stove, microwave, and refrigerator</li><li><strong>Swimming Pool:</strong> Pool usage hours 7:00 AM - 8:00 PM. Children must be supervised</li><li><strong>TV:</strong> Smart TV with streaming services access</li><li><strong>Washing Machine:</strong> Available in utility area</li></ul>`,
      safety_information: `<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguisher located in the kitchen</li><li><strong>First Aid:</strong> Basic first aid kit available</li><li><strong>Emergency Exits:</strong> Clearly marked exit routes</li><li><strong>Swimming Pool:</strong> No lifeguard on duty - swim at your own risk</li><li><strong>Security:</strong> 24/7 CCTV surveillance for your safety</li></ul>`,
      local_area_info: `<h3>Local Area Information</h3><ul><li><strong>Restaurants:</strong> Several dining options within 2 km</li><li><strong>Grocery:</strong> Supermarket 1.5 km away</li><li><strong>ATM:</strong> Nearest ATM 1 km from the property</li><li><strong>Hospital:</strong> Multi-specialty hospital 5 km away</li><li><strong>Beach/Attractions:</strong> Popular tourist spots nearby</li></ul>`,
      emergency_contacts: `<h3>Emergency Contacts</h3><ul><li><strong>Property Manager:</strong> +91 XXXXX XXXXX</li><li><strong>Local Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire Department:</strong> 101</li><li><strong>Nearest Hospital:</strong> +91 XXXXX XXXXX</li></ul>`,
    },
    "pt-002": {
      // Service Apartment
      check_in_guidelines: `<h3>Check-In Guidelines</h3><ul><li><strong>Check-in Time:</strong> 2:00 PM onwards</li><li><strong>Check-out Time:</strong> 11:00 AM</li><li><strong>Key Collection:</strong> Collect keys from reception desk with valid ID</li><li><strong>ID Proof:</strong> Government-issued photo ID mandatory</li><li><strong>Rent Agreement:</strong> Will be provided for long-term stays</li><li><strong>Security Deposit:</strong> One month rent as refundable deposit</li><li><strong>Parking:</strong> Designated parking slot will be assigned</li></ul>`,
      house_rules_text: `<h3>House Rules</h3><ul><li>No smoking inside the apartment</li><li>No loud music or parties</li><li>Visitor hours: 8:00 AM - 10:00 PM (register at reception)</li><li>Monthly rent due on 1st of every month</li><li>30 days notice required for vacating</li><li>Pets not allowed</li><li>No alterations to the property without permission</li></ul>`,
      amenities_guide: `<h3>Amenities Guide</h3><ul><li><strong>WiFi:</strong> High-speed WiFi credentials at reception</li><li><strong>Air Conditioning:</strong> Available in all rooms</li><li><strong>Kitchen:</strong> Fully equipped with modular fittings</li><li><strong>Housekeeping:</strong> Weekly cleaning service included</li><li><strong>Laundry:</strong> Common laundry facilities available</li><li><strong>Gym:</strong> Access card required (obtain from reception)</li><li><strong>Power Backup:</strong> 100% power backup for essential appliances</li></ul>`,
      safety_information: `<h3>Safety Information</h3><ul><li><strong>Fire Safety:</strong> Fire extinguishers on every floor</li><li><strong>First Aid:</strong> First aid available at reception</li><li><strong>Emergency Exits:</strong> Marked on each floor</li><li><strong>Security:</strong> 24/7 security personnel and CCTV</li><li><strong>Elevator:</strong> Regular maintenance schedule followed</li></ul>`,
      local_area_info: `<h3>Local Area Information</h3><ul><li><strong>Public Transport:</strong> Bus stop/Metro within 500m</li><li><strong>Restaurants:</strong> Multiple dining options nearby</li><li><strong>Shopping:</strong> Supermarkets and malls within 2 km</li><li><strong>ATM/Banks:</strong> Within walking distance</li><li><strong>Hospital:</strong> 24/7 emergency care available nearby</li></ul>`,
      emergency_contacts: `<h3>Emergency Contacts</h3><ul><li><strong>Reception:</strong> +91 XXXXX XXXXX (24/7)</li><li><strong>Security:</strong> Extension 100</li><li><strong>Maintenance:</strong> Extension 200</li><li><strong>Police:</strong> 100</li><li><strong>Ambulance:</strong> 102 / 108</li><li><strong>Fire:</strong> 101</li></ul>`,
    },
  };

  // Helper functions to determine property type
  const isVilla = useMemo(() => {
    return formData.property_type_id === "pt-001";
  }, [formData.property_type_id]);

  const isServiceApartment = useMemo(() => {
    return formData.property_type_id === "pt-002";
  }, [formData.property_type_id]);

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const sections = [
      {
        name: "Basic Info",
        complete: !!(
          formData.vendor_id &&
          formData.city_id &&
          formData.property_type_id &&
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
        name: "Photos (Optional)",
        complete: true, // Images uploaded separately, always mark as complete
      },
      {
        name: "Policies",
        complete: !!(formData.house_rules && formData.cancellation_policy),
      },
    ];

    const completedCount = sections.filter((s) => s.complete).length;
    const percentage = Math.round((completedCount / sections.length) * 100);

    return { sections, percentage };
  }, [formData]); // Removed photoUrls dependency

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
  }, [propertyId, preSelectedPropertyType]);

  // Auto-load guideline templates when property type is selected (only for new properties)
  useEffect(() => {
    if (!propertyId && formData.property_type_id && !templatesLoaded) {
      const templates = guidelineTemplates[formData.property_type_id];
      if (templates) {
        setGuidelines(templates);
        setTemplatesLoaded(true);
        // Use setTimeout to avoid setState during render warning
        setTimeout(() => {
          toast.success(
            "Default guidelines loaded! You can customize them as needed.",
          );
        }, 0);
      }
    }
  }, [formData.property_type_id, propertyId, templatesLoaded]);

  const fetchDropdownData = async () => {
    try {
      // Fetch cities
      const citiesRes = await api.get("/admin/cities");
      if (citiesRes.data.success) setCities(citiesRes.data.data || []);

      // Fetch vendors
      const vendorsRes = await api.get("/admin/vendors");
      if (vendorsRes.data.success) setVendors(vendorsRes.data.data || []);

      // Fetch property types
      const propertyTypesRes = await api.get("/admin/property-types");
      if (propertyTypesRes.data.success)
        setPropertyTypes(propertyTypesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/properties/${propertyId}`);

      if (response.data.success) {
        const property = response.data.data;

        // Safe JSON parsing helper
        const safeJsonParse = (value, fallback) => {
          if (!value) return fallback;
          if (typeof value === "object") return value;
          try {
            return JSON.parse(value);
          } catch (e) {
            console.warn("JSON parse error:", e);
            return fallback;
          }
        };

        // Extract pricing data if it's nested
        const pricing = property.pricing || {};

        // Map API fields to form fields with proper field name corrections
        const loadedFormData = {
          ...formData,
          ...property,
          // FIX: Map city_name to city (API returns city_name, form expects city)
          city: property.city_name || property.city || "",
          // FIX: Map city_state to state (API returns city_state, form expects state)
          state: property.city_state || property.state || "",
          // FIX: Extract pricing fields from nested pricing object
          price_per_night:
            pricing.price_per_night || property.price_per_night || "",
          min_guests: pricing.min_guests || property.min_guests || 1,
          extra_guest_charge:
            pricing.extra_guest_charge || property.extra_guest_charge || 0,
          min_children: pricing.min_children || property.min_children || 0,
          max_children: pricing.max_children || property.max_children || 5,
          extra_child_charge:
            pricing.extra_child_charge || property.extra_child_charge || 0,
          weekly_discount_percent:
            pricing.weekly_discount_percent ||
            property.weekly_discount_percent ||
            15,
          monthly_discount_percent:
            pricing.monthly_discount_percent ||
            property.monthly_discount_percent ||
            25,
          quarterly_discount_percent:
            pricing.quarterly_discount_percent ||
            property.quarterly_discount_percent ||
            30,
          long_term_discount_percent:
            pricing.long_term_discount_percent ||
            property.long_term_discount_percent ||
            35,
          allow_corporate_booking:
            pricing.allow_corporate_booking ||
            property.allow_corporate_booking ||
            false,
          corporate_discount_percent:
            pricing.corporate_discount_percent ||
            property.corporate_discount_percent ||
            20,
          deposit_amount:
            pricing.deposit_amount || property.deposit_amount || 0,
          maintenance_charges:
            pricing.maintenance_charges || property.maintenance_charges || 0,
          notice_period_days:
            pricing.notice_period_days || property.notice_period_days || 30,
          // Session 70: Villa duration discount slabs
          discount_3_5_days:
            parseFloat(
              pricing.discount_3_5_days || property.discount_3_5_days,
            ) || 0,
          discount_6_14_days:
            parseFloat(
              pricing.discount_6_14_days || property.discount_6_14_days,
            ) || 0,
          discount_15_plus_days:
            parseFloat(
              pricing.discount_15_plus_days || property.discount_15_plus_days,
            ) || 0,
          // Parse JSON fields safely
          // API returns amenities as array of objects {id, name, ...} — extract IDs only
          amenities: Array.isArray(property.amenities)
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
        // Store original data for dirty field tracking
        setOriginalFormData(JSON.parse(JSON.stringify(loadedFormData)));

        const loadedGuidelines = {
          check_in_guidelines: property.check_in_guidelines || "",
          house_rules_text: property.house_rules_text || "",
          amenities_guide: property.amenities_guide || "",
          safety_information: property.safety_information || "",
          local_area_info: property.local_area_info || "",
          emergency_contacts: property.emergency_contacts || "",
        };

        setGuidelines(loadedGuidelines);
        // Store original guidelines for dirty field tracking
        setOriginalGuidelines(JSON.parse(JSON.stringify(loadedGuidelines)));

        // Parse photos as array safely
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let processedValue = type === "checkbox" ? checked : value;

    // Trim email fields
    if (
      name.includes("email") &&
      type !== "checkbox" &&
      typeof value === "string"
    ) {
      processedValue = value.trim();
    }

    // Clear dependent fields when master checkbox is unchecked
    if (type === "checkbox" && checked === false) {
      if (name === "allow_corporate_booking") {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
          corporate_discount_percent: 0,
        }));
        // Mark both fields as dirty
        setDirtyFields((prev) => ({
          ...prev,
          [name]: true,
          corporate_discount_percent: true,
        }));
        setHasUnsavedChanges(true);
        return;
      }
      if (name === "events_allowed") {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
          event_capacity: null,
        }));
        // Mark both fields as dirty
        setDirtyFields((prev) => ({
          ...prev,
          [name]: true,
          event_capacity: true,
        }));
        setHasUnsavedChanges(true);
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Mark field as dirty (changed from original)
    setDirtyFields((prev) => ({ ...prev, [name]: true }));
    setHasUnsavedChanges(true);
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
    // Mark guideline field as dirty
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
    setHasUnsavedChanges(true);
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity("");
    }
  };

  const removeAmenity = (index) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
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

  // Reset form to original values
  const handleResetForm = () => {
    if (!originalFormData || !originalGuidelines) {
      toast.error("No original data to reset to");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to reset all changes? This will discard all unsaved modifications.",
      )
    ) {
      return;
    }

    // Deep clone to avoid reference issues
    setFormData(JSON.parse(JSON.stringify(originalFormData)));
    setGuidelines(JSON.parse(JSON.stringify(originalGuidelines)));
    setDirtyFields({});
    setHasUnsavedChanges(false);
    toast.success("Form reset to original values");
  };

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.vendor_id) newErrors.vendor_id = "Vendor is required";
    if (!formData.city_id) newErrors.city_id = "City is required";
    if (!formData.property_type_id)
      newErrors.property_type_id = "Property type is required";
    if (
      !formData.price_per_night ||
      parseFloat(formData.price_per_night) < 0.01
    ) {
      newErrors.price_per_night = "Valid price (minimum ₹0.01) is required";
    }

    // Discount validation - each discount must be <= 100%
    const discounts = [
      {
        field: "weekly_discount_percent",
        value: formData.weekly_discount_percent,
        label: "Weekly discount",
      },
      {
        field: "monthly_discount_percent",
        value: formData.monthly_discount_percent,
        label: "Monthly discount",
      },
      {
        field: "quarterly_discount_percent",
        value: formData.quarterly_discount_percent,
        label: "Quarterly discount",
      },
      {
        field: "long_term_discount_percent",
        value: formData.long_term_discount_percent,
        label: "Long-term discount",
      },
      {
        field: "corporate_discount_percent",
        value: formData.corporate_discount_percent,
        label: "Corporate discount",
      },
    ];
    discounts.forEach(({ field, value, label }) => {
      const discount = parseFloat(value) || 0;
      if (discount < 0 || discount > 100) {
        newErrors[field] = `${label} must be between 0% and 100%`;
      }
    });

    // Cross-field validations
    if (formData.min_guests && formData.max_guests) {
      if (parseInt(formData.min_guests) > parseInt(formData.max_guests)) {
        newErrors.max_guests = "Maximum guests must be >= minimum guests";
      }
    }

    if (formData.min_children && formData.max_children) {
      if (parseInt(formData.min_children) > parseInt(formData.max_children)) {
        newErrors.max_children = "Maximum children must be >= minimum children";
      }
    }

    if (formData.min_stay_days && formData.max_stay_days) {
      if (parseInt(formData.min_stay_days) > parseInt(formData.max_stay_days)) {
        newErrors.max_stay_days = "Maximum stay must be >= minimum stay";
      }
    }

    // Pincode validation
    if (formData.pincode && formData.pincode.trim()) {
      const pincodeRegex = /^[0-9]{5,10}$|^[A-Z0-9]{6,10}$/i;
      if (!pincodeRegex.test(formData.pincode.trim())) {
        newErrors.pincode = "Invalid postal code format";
      }
    }

    // Email validations (with trim)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      formData.primary_incharge_email &&
      !emailRegex.test(formData.primary_incharge_email.trim())
    ) {
      newErrors.primary_incharge_email = "Invalid email format";
    }
    if (
      formData.secondary_incharge_email &&
      !emailRegex.test(formData.secondary_incharge_email.trim())
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[AdminPropertyForm] Form submitted");

    if (!validateForm()) {
      toast.error("Please fix validation errors before submitting");
      // Scroll to first error
      const firstError = document.querySelector(".error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setLoading(true);

      // Photos validation - images are uploaded separately via PropertyImageUpload
      // No need to validate here as images can be added after property creation

      // INDUSTRY STANDARD: Only send changed fields for updates
      // For new properties, send all fields
      let payload;

      if (sanitizedPropertyId && originalFormData) {
        // UPDATE: Always send the full payload.
        // The backend uses a full UPDATE...SET query with all columns — sending only
        // dirty fields would leave the rest as undefined → NULL, wiping out data.
        // dirtyFields is kept for the UI display count only.
        const { city, ...restFormData } = formData;
        payload = {
          ...restFormData,
          ...guidelines,
          amenities: formData.amenities || [],
          primary_incharge_name: formData.primary_incharge_name || "",
          primary_incharge_phone: formData.primary_incharge_phone || "",
          primary_incharge_email: formData.primary_incharge_email || "",
          primary_incharge_whatsapp: formData.primary_incharge_whatsapp || "",
          primary_incharge_alt_contact:
            formData.primary_incharge_alt_contact || "",
          secondary_incharge_name: formData.secondary_incharge_name || "",
          secondary_incharge_phone: formData.secondary_incharge_phone || "",
          secondary_incharge_email: formData.secondary_incharge_email || "",
          secondary_incharge_whatsapp:
            formData.secondary_incharge_whatsapp || "",
          secondary_incharge_alt_contact:
            formData.secondary_incharge_alt_contact || "",
          house_rules: JSON.stringify(formData.house_rules),
          cancellation_policy: JSON.stringify(formData.cancellation_policy),
        };

        console.log(
          "🎯 UPDATE - Sending full payload:",
          Object.keys(payload).length,
          "fields",
          `(${Object.keys(dirtyFields).length} changed)`,
        );
      } else {
        // CREATE: Send all fields
        const { city, ...restFormData } = formData;

        payload = {
          ...restFormData,
          ...guidelines,
          // Include amenities for new properties
          amenities: formData.amenities || [],
          // Include incharge contacts
          primary_incharge_name: formData.primary_incharge_name || "",
          primary_incharge_phone: formData.primary_incharge_phone || "",
          primary_incharge_email: formData.primary_incharge_email || "",
          primary_incharge_whatsapp: formData.primary_incharge_whatsapp || "",
          primary_incharge_alt_contact:
            formData.primary_incharge_alt_contact || "",
          secondary_incharge_name: formData.secondary_incharge_name || "",
          secondary_incharge_phone: formData.secondary_incharge_phone || "",
          secondary_incharge_email: formData.secondary_incharge_email || "",
          secondary_incharge_whatsapp:
            formData.secondary_incharge_whatsapp || "",
          secondary_incharge_alt_contact:
            formData.secondary_incharge_alt_contact || "",
          house_rules: JSON.stringify(formData.house_rules),
          cancellation_policy: JSON.stringify(formData.cancellation_policy),
          photos: JSON.stringify([]),
        };

        console.log(
          "📝 CREATE - Sending all fields:",
          Object.keys(payload).length,
          "fields",
        );
      }

      // Convert numeric fields (for both create and update)
      if (payload.price_per_night !== undefined) {
        payload.price_per_night = parseFloat(payload.price_per_night) || 0;
      }
      if (payload.weekly_discount_percent !== undefined) {
        payload.weekly_discount_percent =
          parseFloat(payload.weekly_discount_percent) || 0;
      }
      if (payload.monthly_discount_percent !== undefined) {
        payload.monthly_discount_percent =
          parseFloat(payload.monthly_discount_percent) || 0;
      }
      if (payload.quarterly_discount_percent !== undefined) {
        payload.quarterly_discount_percent =
          parseFloat(payload.quarterly_discount_percent) || 0;
      }
      if (payload.long_term_discount_percent !== undefined) {
        payload.long_term_discount_percent =
          parseFloat(payload.long_term_discount_percent) || 0;
      }
      if (payload.corporate_discount_percent !== undefined) {
        payload.corporate_discount_percent =
          parseFloat(payload.corporate_discount_percent) || 0;
      }
      if (payload.deposit_amount !== undefined) {
        payload.deposit_amount = parseFloat(payload.deposit_amount) || 0;
      }
      if (payload.maintenance_charges !== undefined) {
        payload.maintenance_charges =
          parseFloat(payload.maintenance_charges) || 0;
      }
      if (payload.bedrooms !== undefined) {
        payload.bedrooms = parseInt(payload.bedrooms) || 0;
      }
      if (payload.bathrooms !== undefined) {
        payload.bathrooms = parseInt(payload.bathrooms) || 0;
      }
      if (payload.max_guests !== undefined) {
        payload.max_guests = parseInt(payload.max_guests) || 2;
      }
      if (payload.min_stay_days !== undefined) {
        payload.min_stay_days = parseInt(payload.min_stay_days) || 1;
      }
      if (payload.max_stay_days !== undefined) {
        payload.max_stay_days = payload.max_stay_days
          ? parseInt(payload.max_stay_days)
          : null;
      }
      if (payload.parking_slots !== undefined) {
        payload.parking_slots = parseInt(payload.parking_slots) || 0;
      }
      if (payload.floor_number !== undefined) {
        payload.floor_number = payload.floor_number
          ? parseInt(payload.floor_number)
          : null;
      }
      if (payload.wifi_speed_mbps !== undefined) {
        payload.wifi_speed_mbps = payload.wifi_speed_mbps
          ? parseInt(payload.wifi_speed_mbps)
          : null;
      }
      if (payload.recommended_priority !== undefined) {
        payload.recommended_priority =
          parseInt(payload.recommended_priority) || 0;
      }
      if (payload.notice_period_days !== undefined) {
        payload.notice_period_days = parseInt(payload.notice_period_days) || 30;
      }

      // Use api.js module for consistent error handling
      let response;
      if (sanitizedPropertyId) {
        response = await api.put(
          `/admin/properties/${sanitizedPropertyId}`,
          payload,
        );
      } else {
        response = await api.post("/admin/properties", payload);
      }

      if (response.data.success) {
        const savedProperty = response.data.data;
        const isNewProperty = !sanitizedPropertyId;

        // Clear unsaved changes flag and reset baseline for future dirty tracking
        setHasUnsavedChanges(false);
        setDirtyFields({});
        setOriginalFormData(JSON.parse(JSON.stringify(formData)));
        setOriginalGuidelines(JSON.parse(JSON.stringify(guidelines)));

        // If creating new property and has pending images, upload them
        if (isNewProperty && hasSelectedImages && pendingImageUpload) {
          toast.success("Property created! Uploading images...");
          try {
            // Ensure we extract the ID properly
            const newPropertyId = savedProperty?.id || savedProperty;
            const uploadResult = await pendingImageUpload(
              String(newPropertyId),
            );
            if (uploadResult.success) {
              toast.success("Property and images saved successfully! 🎉");
            } else {
              toast.warning("Property saved but some images failed to upload");
            }
          } catch (uploadError) {
            console.error("Image upload error:", uploadError);
            toast.warning(
              "Property saved but image upload failed. You can upload them later.",
            );
          }
        } else {
          toast.success(
            propertyId
              ? "Property updated successfully! 🎉"
              : "Property created successfully! 🎉",
          );
        }

        // Flush staged calendar prices (set before property existed)
        if (isNewProperty && pendingCalendarPrices.length > 0) {
          try {
            const newPropertyId = savedProperty?.id || savedProperty;
            await api.post(
              `/admin/properties/${newPropertyId}/calendar-pricing`,
              {
                dates: pendingCalendarPrices,
              },
            );
          } catch {
            toast.warning(
              "Property saved but calendar pricing could not be saved. Set it in the property edit form.",
            );
          }
        }

        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || "Failed to save property");
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      // Better error messages
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Invalid data. Please check all fields.");
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
      {/* Progress Bar */}
      <FormProgressBar
        completionPercentage={formProgress.percentage}
        sections={formProgress.sections}
      />

      <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-border">
        <h2 className="text-3xl font-bold text-foreground">
          {propertyId ? "Edit Property" : "Create New Property"}
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
          icon={Info}
          required={true}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Vendor *
              </label>
              <select
                name="vendor_id"
                value={formData.vendor_id || ""}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Select Vendor</option>
                {(vendors || []).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {errors.vendor_id && (
                <span className="text-sm text-destructive mt-1">
                  {errors.vendor_id}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Property Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Luxury Beach Villa - Goa"
                required
                maxLength="200"
                aria-required="true"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-xs text-muted-foreground mt-1">
                {(formData.title || "").length}/200 characters
              </span>
              {errors.title && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.title}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                Property Type *
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
                {(propertyTypes || []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} -{" "}
                    {type.stay_type === "short_term"
                      ? "Short Term"
                      : type.stay_type === "long_term"
                        ? "Long Term"
                        : "Hybrid"}
                  </option>
                ))}
              </select>
              {errors.property_type_id && (
                <span className="text-sm text-destructive mt-1">
                  {errors.property_type_id}
                </span>
              )}
              {preSelectedPropertyTypeName && !propertyId && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Selected: {preSelectedPropertyTypeName}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status || "draft"}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe the property..."
                maxLength="2000"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
              />
              <span className="text-xs text-muted-foreground mt-1">
                {(formData.description || "").length}/2000 characters
              </span>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Location */}
        <FormSection
          title="Location Details"
          icon={MapPin}
          required={true}
          defaultOpen={false}
        >
          <div className="mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                required
                maxLength="500"
                aria-required="true"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-xs text-muted-foreground mt-1">
                {(formData.address || "").length}/500 characters
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                City *
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
                  // Clear error when city is selected
                  if (errors.city_id) {
                    setErrors((prev) => ({ ...prev, city_id: "" }));
                  }
                }}
                error={errors.city_id}
                required={true}
              />
              <small className="text-xs text-muted-foreground mt-1">
                {formData.city && formData.state ? (
                  <span className="text-primary font-medium">
                    Selected: {formData.city}, {formData.state}
                  </span>
                ) : (
                  "Search or add a new city"
                )}
              </small>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Area / Locality
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="e.g., Koramangala, Candolim Beach"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <small className="text-xs text-muted-foreground mt-1">
                Specific neighborhood or locality within the city
              </small>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="e.g., 560001 or SW1A 1AA"
                maxLength="10"
                pattern="[0-9]{5,10}|[A-Z0-9]{6,10}"
                aria-describedby="pincode-help"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span
                id="pincode-help"
                className="text-xs text-muted-foreground mt-1"
              >
                5-10 digits or alphanumeric postal code
              </span>
              {errors.pincode && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.pincode}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Google Maps Location
              </label>
              <input
                type="text"
                name="maps_location"
                value={formData.maps_location}
                onChange={handleInputChange}
                placeholder="https://www.google.com/maps?q=12.9352,77.6245"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <small className="text-xs text-muted-foreground mt-1">
                Google Maps URL or coordinates
              </small>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Property Specifications */}
        <FormSection
          title="Property Specifications"
          icon={Home}
          required={true}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                min="0"
                max="50"
                aria-describedby="bedrooms-help"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span
                id="bedrooms-help"
                className="text-xs text-muted-foreground mt-1"
              >
                Maximum 50 bedrooms
              </span>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                min="0"
                max="30"
                aria-describedby="bathrooms-help"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span
                id="bathrooms-help"
                className="text-xs text-muted-foreground mt-1"
              >
                Maximum 30 bathrooms
              </span>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Max Guests
              </label>
              <input
                type="number"
                name="max_guests"
                value={formData.max_guests}
                onChange={handleInputChange}
                min="1"
                max="100"
                aria-describedby="max-guests-help"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span
                id="max-guests-help"
                className="text-xs text-muted-foreground mt-1"
              >
                Maximum 100 guests
              </span>
              {errors.max_guests && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.max_guests}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Pricing */}
        <FormSection
          title="Pricing"
          icon={DollarSign}
          required={true}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Price Per Night (\u20b9) *
              </label>
              <input
                type="number"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
                aria-required="true"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="text-xs text-muted-foreground mt-1">
                Minimum \u20b90.01 per night
              </span>
              {errors.price_per_night && (
                <span className="text-sm text-destructive mt-1" role="alert">
                  {errors.price_per_night}
                </span>
              )}
            </div>

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

          <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
            Advanced Pricing
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Min Guests (Included in Base Price)
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

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Extra Guest Charge (₹ per night)
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Min Children (Included in Base Price)
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

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Max Children Allowed
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

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Extra Child Charge (₹ per night)
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

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong className="font-semibold">Note:</strong> Infants (0-2
              years) are always FREE and unlimited
            </p>
          </div>

          {!isVilla && (
            <>
              <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
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
            </>
          )}

          <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
            Corporate & Deposits
          </h4>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              name="allow_corporate_booking"
              checked={formData.allow_corporate_booking}
              onChange={handleInputChange}
              className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              id="allow_corporate_booking"
            />
            <label
              htmlFor="allow_corporate_booking"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Allow Corporate Bookings
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Corporate Discount (%)
              </label>
              <input
                type="number"
                name="corporate_discount_percent"
                value={formData.corporate_discount_percent}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                disabled={!formData.allow_corporate_booking}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Maintenance Charges (₹/month)
              </label>
              <input
                type="number"
                name="maintenance_charges"
                value={formData.maintenance_charges}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          {/* Villa Duration Discount Slabs – admin only */}
          {isVilla && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-foreground mb-1">
                Villa Duration Discount Slabs
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically applied based on total nights booked. Set to 0 to
                disable a slab.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    3–5 Nights Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount_3_5_days"
                    value={formData.discount_3_5_days}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    Applied for stays of 3 to 5 nights
                  </small>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    6–14 Nights Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount_6_14_days"
                    value={formData.discount_6_14_days}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    Applied for stays of 6 to 14 nights
                  </small>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    15+ Nights Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount_15_plus_days"
                    value={formData.discount_15_plus_days}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <small className="text-xs text-muted-foreground mt-1">
                    Applied for stays of 15 nights or more
                  </small>
                </div>
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
              useful for weekends, holidays, events, or seasonal peaks. Custom
              prices take precedence over the base rate at checkout.
            </p>
          </div>
          <PropertyCalendarPricing
            propertyId={sanitizedPropertyId}
            basePrice={parseFloat(formData.price_per_night) || 0}
            canEdit={true}
            role="admin"
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
              Services & Amenities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Housekeeping Frequency
                </label>
                <select
                  name="housekeeping_frequency"
                  value={formData.housekeeping_frequency || "weekly"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="on-demand">On-demand</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Laundry Frequency
                </label>
                <select
                  name="laundry_frequency"
                  value={formData.laundry_frequency || "weekly"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="on-demand">On-demand</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Furnishing Type
                </label>
                <select
                  name="furnishing_type"
                  value={formData.furnishing_type || "fully_furnished"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
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
                Utilities Included (Electricity, Water)
              </label>
            </div>

            <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
              Property Facilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  placeholder="Ground floor = 0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <small className="text-xs text-muted-foreground mt-1">
                  For apartments in buildings
                </small>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
              Internet & Connectivity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  WiFi Provider
                </label>
                <input
                  type="text"
                  name="wifi_provider"
                  value={formData.wifi_provider}
                  onChange={handleInputChange}
                  placeholder="e.g., ACT Fibernet, Airtel Xstream"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </FormSection>
        )}

        {/* Section 4.5B: Villa Details - Only for Villas */}
        {isVilla && (
          <FormSection title="Villa Features" icon={Home} defaultOpen={true}>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-900 dark:text-green-200">
                <strong className="font-semibold">Villa Specific:</strong> These
                features are tailored for vacation villas and short-term stays.
              </p>
            </div>

            <h4 className="text-lg font-semibold text-foreground mb-4">
              Outdoor & Recreational Facilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Pool Availability
                </label>
                <select
                  name="pool_type"
                  value={formData.pool_type || "none"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="none">No Pool</option>
                  <option value="private">Private Pool</option>
                  <option value="shared">Shared Pool</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-foreground mb-2">
                  Garden/Outdoor Space
                </label>
                <select
                  name="garden_type"
                  value={formData.garden_type || "none"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="none">No Garden</option>
                  <option value="private">Private Garden</option>
                  <option value="shared">Shared Garden</option>
                  <option value="terrace">Terrace/Balcony</option>
                </select>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground mt-6 mb-4">
              Guest Policies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="pets_allowed"
                  checked={formData.pets_allowed || false}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  id="pets_allowed"
                />
                <label
                  htmlFor="pets_allowed"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Pets Allowed
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="events_allowed"
                  checked={formData.events_allowed || false}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  id="events_allowed"
                />
                <label
                  htmlFor="events_allowed"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Events/Parties Allowed
                </label>
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <label className="text-sm font-medium text-foreground mb-2">
                Maximum Event Capacity (if allowed)
              </label>
              <input
                type="number"
                name="event_capacity"
                value={formData.event_capacity || ""}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 50"
                disabled={!formData.events_allowed}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <small className="text-xs text-muted-foreground mt-1">
                Leave empty if not applicable
              </small>
            </div>
          </FormSection>
        )}

        {/* Section 4.6: Recommendations */}
        <FormSection
          title="Property Recommendations"
          icon={Star}
          defaultOpen={true}
        >
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 dark:text-purple-200">
              <strong className="font-semibold">Admin Only:</strong> Mark
              properties as recommended to feature them prominently on the
              homepage
            </p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              name="is_recommended"
              checked={formData.is_recommended}
              onChange={handleInputChange}
              className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              id="is_recommended"
            />
            <label
              htmlFor="is_recommended"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Mark as Recommended Property
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Recommended Priority (1-12)
              </label>
              <input
                type="number"
                name="recommended_priority"
                value={formData.recommended_priority}
                onChange={handleInputChange}
                min="0"
                max="12"
                disabled={!formData.is_recommended}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <small className="text-xs text-muted-foreground mt-1">
                Higher number = shows first (1-12 range)
              </small>
            </div>
          </div>
        </FormSection>

        {/* Section 5: Primary Incharge */}
        <FormSection
          title="Primary Property Incharge"
          icon={UserCircle}
          defaultOpen={true}
          required
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                name="primary_incharge_name"
                value={formData.primary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <input
                type="text"
                name="primary_incharge_phone"
                value={formData.primary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+919876543210"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.primary_incharge_phone && (
                <span className="text-sm text-destructive mt-1">
                  {errors.primary_incharge_phone}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="primary_incharge_email"
                value={formData.primary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.primary_incharge_email && (
                <span className="text-sm text-destructive mt-1">
                  {errors.primary_incharge_email}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                name="primary_incharge_whatsapp"
                value={formData.primary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+919876543210"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Alternative Contact
              </label>
              <input
                type="text"
                name="primary_incharge_alt_contact"
                value={formData.primary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="+918765432109"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 6: Secondary Incharge */}
        <FormSection
          title="Secondary Property Incharge (Optional)"
          icon={Users}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                name="secondary_incharge_name"
                value={formData.secondary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <input
                type="text"
                name="secondary_incharge_phone"
                value={formData.secondary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+919988776655"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="secondary_incharge_email"
                value={formData.secondary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.secondary_incharge_email && (
                <span className="text-sm text-destructive mt-1">
                  {errors.secondary_incharge_email}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                name="secondary_incharge_whatsapp"
                value={formData.secondary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+919988776655"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Alternative Contact
              </label>
              <input
                type="text"
                name="secondary_incharge_alt_contact"
                value={formData.secondary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="+918877665544"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 7: Booking Rules */}
        <FormSection
          title="Booking Rules"
          icon={Shield}
          defaultOpen={true}
          required
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="same_day_booking_allowed"
                checked={formData.same_day_booking_allowed}
                onChange={handleInputChange}
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                id="same_day_booking_allowed"
              />
              <label
                htmlFor="same_day_booking_allowed"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Allow Same-Day Bookings
              </label>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Max Booking Days (Leave empty for unlimited)
              </label>
              <input
                type="number"
                name="max_booking_days"
                value={formData.max_booking_days || ""}
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 30"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 8: Amenities */}
        <FormSection
          title="Amenities"
          icon={Star}
          required={false}
          defaultOpen={true}
        >
          <AmenitiesGrid
            selectedAmenities={formData.amenities}
            onChange={(amenities) => {
              setFormData((prev) => ({ ...prev, amenities }));
            }}
          />
        </FormSection>

        {/* Section 9: House Rules (JSON) */}
        <FormSection
          title="House Rules (JSON Format)"
          icon={FileText}
          defaultOpen={true}
          required
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Quiet Hours
              </label>
              <input
                type="text"
                value={formData.house_rules.quiet_hours}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "quiet_hours",
                    e.target.value,
                  )
                }
                placeholder="10:00 PM - 8:00 AM"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3">
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
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                id="no_smoking"
              />
              <label
                htmlFor="no_smoking"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                No Smoking
              </label>
            </div>

            <div className="flex items-center gap-3">
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
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                id="no_parties"
              />
              <label
                htmlFor="no_parties"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                No Parties
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.house_rules.no_events}
                onChange={(e) =>
                  handleNestedChange(
                    "house_rules",
                    "no_events",
                    e.target.checked,
                  )
                }
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                id="no_events"
              />
              <label
                htmlFor="no_events"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                No Events
              </label>
            </div>

            <div className="flex items-center gap-3">
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
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                id="pets_allowed"
              />
              <label
                htmlFor="pets_allowed"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Pets Allowed
              </label>
            </div>

            {formData.house_rules.pets_allowed && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.house_rules.pets_approval_required}
                  onChange={(e) =>
                    handleNestedChange(
                      "house_rules",
                      "pets_approval_required",
                      e.target.checked,
                    )
                  }
                  className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  id="pets_approval_required"
                />
                <label
                  htmlFor="pets_approval_required"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Pets Approval Required
                </label>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Additional Rules
            </label>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={additionalRule}
                onChange={(e) => setAdditionalRule(e.target.value)}
                placeholder="Enter additional rule"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAdditionalRule())
                }
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={addAdditionalRule}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
              >
                Add Rule
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {(formData.house_rules?.additional_rules || []).map(
                (rule, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full border border-border shadow-sm hover:shadow transition-shadow"
                  >
                    <span className="text-sm font-medium">{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeAdditionalRule(index)}
                      className="text-destructive hover:text-destructive/80 font-bold text-lg leading-none transition-colors"
                      aria-label="Remove rule"
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 10: Per-Property Cancellation Settings */}
        <FormSection
          title="Per-Property Cancellation Settings"
          icon={FileText}
          defaultOpen={true}
          required
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Policy Type
              </label>
              <select
                value={formData.cancellation_policy.policy_type || "Flexible"}
                onChange={(e) =>
                  handleNestedChange(
                    "cancellation_policy",
                    "policy_type",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="Flexible">Flexible</option>
                <option value="Moderate">Moderate</option>
                <option value="Strict">Strict</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Free Cancellation Hours
              </label>
              <input
                type="number"
                value={formData.cancellation_policy.free_cancellation_hours}
                onChange={(e) =>
                  handleNestedChange(
                    "cancellation_policy",
                    "free_cancellation_hours",
                    parseInt(e.target.value),
                  )
                }
                min="0"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Partial Refund Days
              </label>
              <input
                type="number"
                value={formData.cancellation_policy.partial_refund_days}
                onChange={(e) =>
                  handleNestedChange(
                    "cancellation_policy",
                    "partial_refund_days",
                    parseInt(e.target.value),
                  )
                }
                min="0"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Partial Refund Percentage (%)
              </label>
              <input
                type="number"
                value={formData.cancellation_policy.partial_refund_percentage}
                onChange={(e) =>
                  handleNestedChange(
                    "cancellation_policy",
                    "partial_refund_percentage",
                    parseInt(e.target.value),
                  )
                }
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              checked={formData.cancellation_policy.cleaning_fee_refundable}
              onChange={(e) =>
                handleNestedChange(
                  "cancellation_policy",
                  "cleaning_fee_refundable",
                  e.target.checked,
                )
              }
              className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
              id="cleaning_fee_refundable"
            />
            <label
              htmlFor="cleaning_fee_refundable"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Cleaning Fee Refundable
            </label>
          </div>

          <div className="mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-foreground mb-2">
                Notes
              </label>
              <textarea
                value={formData.cancellation_policy.notes}
                onChange={(e) =>
                  handleNestedChange(
                    "cancellation_policy",
                    "notes",
                    e.target.value,
                  )
                }
                rows="2"
                placeholder="Additional cancellation policy notes..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 11: Rich Text Guidelines */}
        <FormSection
          title="Property Guidelines (Rich Text)"
          icon={FileText}
          defaultOpen={true}
          required
        >
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 dark:text-green-200">
              These guidelines will be sent to guests 24 hours before check-in
            </p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Check-In Guidelines
            </label>
            <ReactQuill
              value={guidelines.check_in_guidelines}
              onChange={(value) =>
                handleGuidelineChange("check_in_guidelines", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="Describe check-in process, timing, key collection, parking..."
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              House Rules Text
            </label>
            <ReactQuill
              value={guidelines.house_rules_text}
              onChange={(value) =>
                handleGuidelineChange("house_rules_text", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="No smoking, parties, quiet hours..."
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Amenities Guide
            </label>
            <ReactQuill
              value={guidelines.amenities_guide}
              onChange={(value) =>
                handleGuidelineChange("amenities_guide", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="WiFi details, AC usage, kitchen appliances..."
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Safety Information
            </label>
            <ReactQuill
              value={guidelines.safety_information}
              onChange={(value) =>
                handleGuidelineChange("safety_information", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="Fire extinguisher, first aid, emergency exits..."
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
              Local Area Information
            </label>
            <ReactQuill
              value={guidelines.local_area_info}
              onChange={(value) =>
                handleGuidelineChange("local_area_info", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="Nearby restaurants, ATMs, hospitals, attractions..."
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">
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
            />
          </div>
        </FormSection>

        {/* Section 12: Photos */}
        <FormSection
          title="Property Photos"
          icon={Image}
          required={true}
          defaultOpen={false}
        >
          <PropertyImageUpload
            propertyId={sanitizedPropertyId}
            allowPreUpload={!sanitizedPropertyId}
            onImagesChange={(data) => {
              if (data.hasPendingUploads) {
                setPendingImageUpload(() => data.uploadPending);
                setHasSelectedImages(true);
                setSelectedImageCount(data.selectedFiles?.length || 0);
              } else if (data.uploadedImages) {
                setHasSelectedImages(false);
                setPendingImageUpload(null);
                setSelectedImageCount(0);
              }
            }}
          />
          {!propertyId && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Info className="h-4 w-4 inline mr-1" />
              {hasSelectedImages ? (
                <span>
                  <strong>
                    ✓ {selectedImageCount} Image
                    {selectedImageCount !== 1 ? "s" : ""} Ready:
                  </strong>{" "}
                  Will be uploaded automatically when you save the property.
                </span>
              ) : (
                <span>
                  <strong>Tip:</strong> You can select images now. They'll be
                  uploaded automatically when you save the property.
                </span>
              )}
            </div>
          )}
        </FormSection>

        {/* Cancellation Policy Info */}
        <FormSection
          title="Cancellation Policy"
          icon={Shield}
          defaultOpen={true}
        >
          <p className="text-sm text-muted-foreground mb-4">
            The active cancellation policy for this property type will be shown
            to guests at the time of booking.
          </p>
          <CancellationPolicyInfoCard
            propertyTypeId={formData.property_type_id}
            isAdmin={true}
          />
        </FormSection>

        {/* Submit Button */}
        <div className="space-y-4 mt-8 pt-6 border-t-2 border-border">
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">
                You have unsaved changes ({Object.keys(dirtyFields).length}{" "}
                fields modified)
              </span>
            </div>
          )}

          <div className="flex justify-end gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-3 bg-muted text-foreground border border-border rounded-lg font-semibold hover:bg-muted/80 transition-all shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
            )}

            {/* Reset button - only show when editing with unsaved changes */}
            {sanitizedPropertyId && hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleResetForm}
                disabled={loading}
                className="px-8 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Changes
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {propertyId ? "Update Property" : "Create Property"}
                  {hasUnsavedChanges && " *"}
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminPropertyForm;
