import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import "./VendorPropertyForm.css";

const VendorPropertyForm = ({
  propertyId = null,
  onSuccess,
  onCancel,
  propertyStatus = "draft", // draft, pending_approval, approved, inactive
  hasPendingChangeRequest = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  // Basic Information
  const [formData, setFormData] = useState({
    city_id: "",
    title: "",
    property_type: "Villa",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    check_in_time: "2:00 PM",
    check_out_time: "11:00 AM",
    price_per_night: "",
    gst_percentage: 18,
    status: "draft",

    // Advanced Pricing
    min_guests: 1,
    extra_guest_charge: 0,
    min_children: 0,
    max_children: 5,
    extra_child_charge: 0,

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
  const [photoUrls, setPhotoUrls] = useState("");
  const [errors, setErrors] = useState({});

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
    fetchCities();
    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId]);

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/public/cities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setCities(data.data.cities || data.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Use vendor endpoint
      const response = await fetch(`/api/vendor/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const property = data.data.property;
        const pendingChangeRequest = data.data.pendingChangeRequest;

        // Show warning if there's a pending change request
        if (pendingChangeRequest) {
          alert(
            `Note: This property has a pending change request. Your changes will create a new request once the current one is processed.`,
          );
        }

        setFormData({
          ...formData,
          ...property,
          city_id: property.city_id || "",
          property_type_id: property.property_type_id || "",
          amenities:
            typeof property.amenities === "string"
              ? JSON.parse(property.amenities || "[]")
              : data.data.amenities?.map((a) => a.id) || [],
          house_rules:
            typeof property.house_rules === "string"
              ? JSON.parse(property.house_rules || "{}")
              : property.house_rules || {},
          cancellation_policy:
            typeof property.cancellation_policy === "string"
              ? JSON.parse(property.cancellation_policy || "{}")
              : property.cancellation_policy || {},
          photos:
            typeof property.photos === "string"
              ? JSON.parse(property.photos || "[]")
              : property.photos || [],
        });

        setGuidelines({
          check_in_guidelines: property.check_in_guidelines || "",
          house_rules_text: property.house_rules_text || "",
          amenities_guide: property.amenities_guide || "",
          safety_information: property.safety_information || "",
          local_area_info: property.local_area_info || "",
          emergency_contacts: property.emergency_contacts || "",
        });

        const photoArray =
          typeof property.photos === "string"
            ? JSON.parse(property.photos || "[]")
            : property.photos || [];
        setPhotoUrls(photoArray.join("\n"));
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      alert("Failed to load property data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.city_id) newErrors.city_id = "City is required";
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

  const handleSubmit = async (e, submitForApproval = true) => {
    e?.preventDefault();

    if (!validateForm()) {
      alert("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);

      // Process photo URLs
      const photosArray = photoUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      // Prepare payload
      const payload = {
        ...formData,
        ...guidelines,
        // amenities should be array of IDs, not stringified
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        house_rules: formData.house_rules,
        cancellation_policy: formData.cancellation_policy,
        photos: photosArray,
      };

      const token = localStorage.getItem("token");

      if (propertyId) {
        // EDITING EXISTING PROPERTY
        // Update property (will create change request if approved)
        const response = await fetch(`/api/vendor/properties/${propertyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          if (data.data.changeRequestId) {
            alert(
              "Change request submitted for admin approval! Your property will remain live with current data until approved.",
            );
          } else {
            // Draft or pending_approval property updated directly
            alert("Property updated successfully!");
          }
          if (onSuccess) onSuccess();
        } else {
          alert("Error: " + data.message);
        }
      } else {
        // CREATING NEW PROPERTY
        // Step 1: Create as draft
        const createResponse = await fetch("/api/vendor/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const createData = await createResponse.json();

        if (createData.success) {
          const newPropertyId = createData.data.id;

          if (submitForApproval) {
            // Step 2: Submit for approval
            const submitResponse = await fetch(
              `/api/vendor/properties/${newPropertyId}/submit`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
              },
            );

            const submitData = await submitResponse.json();

            if (submitData.success) {
              alert("Property created and submitted for approval!");
              if (onSuccess) onSuccess();
            } else {
              alert(
                "Property created but submission failed: " + submitData.message,
              );
              if (onSuccess) onSuccess(); // Still call success to refresh
            }
          } else {
            alert("Property saved as draft!");
            if (onSuccess) onSuccess();
          }
        } else {
          alert("Error creating property: " + createData.message);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && propertyId) {
    return <div className="loading">Loading property data...</div>;
  }

  return (
    <div className="vendor-property-form">
      <div className="form-header">
        <h2>{propertyId ? "Edit Property" : "Add New Property"}</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <section className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Property Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Luxury Beach Villa - Goa"
                required
              />
              {errors.title && <span className="error">{errors.title}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Property Type</label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
              >
                <option value="Villa">Villa</option>
                <option value="Premium Villa">Premium Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="Cottage">Cottage</option>
                <option value="Farmhouse">Farmhouse</option>
                <option value="Bungalow">Bungalow</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe the property..."
              />
            </div>
          </div>
        </section>

        {/* Section 2: Location */}
        <section className="form-section">
          <h3>Location Details</h3>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City (Dropdown) *</label>
              <select
                name="city_id"
                value={formData.city_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}
                  </option>
                ))}
              </select>
              {errors.city_id && (
                <span className="error">{errors.city_id}</span>
              )}
            </div>

            <div className="form-group">
              <label>City (Text)</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Pincode"
                maxLength="10"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Property Specifications */}
        <section className="form-section">
          <h3>Property Specifications</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Max Guests</label>
              <input
                type="number"
                name="max_guests"
                value={formData.max_guests}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Check-in Time</label>
              <input
                type="text"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleInputChange}
                placeholder="e.g., 2:00 PM"
              />
            </div>

            <div className="form-group">
              <label>Check-out Time</label>
              <input
                type="text"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleInputChange}
                placeholder="e.g., 11:00 AM"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Pricing */}
        <section className="form-section">
          <h3>Pricing & GST</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Price Per Night (₹) *</label>
              <input
                type="number"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
              {errors.price_per_night && (
                <span className="error">{errors.price_per_night}</span>
              )}
            </div>

            <div className="form-group">
              <label>GST Percentage (%)</label>
              <input
                type="number"
                name="gst_percentage"
                value={formData.gst_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          <h4 style={{ marginTop: "20px" }}>Advanced Pricing</h4>

          <div className="form-row">
            <div className="form-group">
              <label>Min Guests (Included in Base Price)</label>
              <input
                type="number"
                name="min_guests"
                value={formData.min_guests}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Extra Guest Charge (₹ per night)</label>
              <input
                type="number"
                name="extra_guest_charge"
                value={formData.extra_guest_charge}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Children (Included in Base Price)</label>
              <input
                type="number"
                name="min_children"
                value={formData.min_children}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Max Children Allowed</label>
              <input
                type="number"
                name="max_children"
                value={formData.max_children}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Extra Child Charge (₹ per night)</label>
              <input
                type="number"
                name="extra_child_charge"
                value={formData.extra_child_charge}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <p className="info-text">
            <strong>Note:</strong> Infants (0-2 years) are always FREE and
            unlimited
          </p>
        </section>

        {/* Section 5: Primary Incharge */}
        <section className="form-section">
          <h3>Primary Property Incharge</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="primary_incharge_name"
                value={formData.primary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="primary_incharge_phone"
                value={formData.primary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+919876543210"
              />
              {errors.primary_incharge_phone && (
                <span className="error">{errors.primary_incharge_phone}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="primary_incharge_email"
                value={formData.primary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
              {errors.primary_incharge_email && (
                <span className="error">{errors.primary_incharge_email}</span>
              )}
            </div>

            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="text"
                name="primary_incharge_whatsapp"
                value={formData.primary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+919876543210"
              />
            </div>

            <div className="form-group">
              <label>Alternative Contact</label>
              <input
                type="text"
                name="primary_incharge_alt_contact"
                value={formData.primary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="+918765432109"
              />
            </div>
          </div>
        </section>

        {/* Section 6: Secondary Incharge */}
        <section className="form-section">
          <h3>Secondary Property Incharge (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="secondary_incharge_name"
                value={formData.secondary_incharge_name}
                onChange={handleInputChange}
                placeholder="Full name"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="secondary_incharge_phone"
                value={formData.secondary_incharge_phone}
                onChange={handleInputChange}
                placeholder="+919988776655"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="secondary_incharge_email"
                value={formData.secondary_incharge_email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
              {errors.secondary_incharge_email && (
                <span className="error">{errors.secondary_incharge_email}</span>
              )}
            </div>

            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="text"
                name="secondary_incharge_whatsapp"
                value={formData.secondary_incharge_whatsapp}
                onChange={handleInputChange}
                placeholder="+919988776655"
              />
            </div>

            <div className="form-group">
              <label>Alternative Contact</label>
              <input
                type="text"
                name="secondary_incharge_alt_contact"
                value={formData.secondary_incharge_alt_contact}
                onChange={handleInputChange}
                placeholder="+918877665544"
              />
            </div>
          </div>
        </section>

        {/* Section 7: Booking Rules */}
        <section className="form-section">
          <h3>Booking Rules</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="same_day_booking_allowed"
                  checked={formData.same_day_booking_allowed}
                  onChange={handleInputChange}
                />
                <span>Allow Same-Day Bookings</span>
              </label>
            </div>

            <div className="form-group">
              <label>Max Booking Days (Leave empty for unlimited)</label>
              <input
                type="number"
                name="max_booking_days"
                value={formData.max_booking_days || ""}
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 30"
              />
            </div>
          </div>
        </section>

        {/* Section 8: Amenities */}
        <section className="form-section">
          <h3>Amenities</h3>

          <div className="amenities-input">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Enter amenity (e.g., WiFi, Pool, AC)"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addAmenity())
              }
            />
            <button type="button" onClick={addAmenity} className="btn-add">
              Add Amenity
            </button>
          </div>

          <div className="tags-list">
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="tag">
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="tag-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 9: House Rules (JSON) */}
        <section className="form-section">
          <h3>House Rules (JSON Format)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Check-in After</label>
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
              />
            </div>

            <div className="form-group">
              <label>Check-out Before</label>
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
              />
            </div>

            <div className="form-group">
              <label>Quiet Hours</label>
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
              />
            </div>
          </div>

          <div className="form-row checkboxes">
            <label className="checkbox-label">
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
              />
              <span>No Smoking</span>
            </label>

            <label className="checkbox-label">
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
              />
              <span>No Parties</span>
            </label>

            <label className="checkbox-label">
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
              />
              <span>No Events</span>
            </label>

            <label className="checkbox-label">
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
              />
              <span>Pets Allowed</span>
            </label>

            {formData.house_rules.pets_allowed && (
              <label className="checkbox-label">
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
                />
                <span>Pets Approval Required</span>
              </label>
            )}
          </div>

          <div className="additional-rules">
            <label>Additional Rules</label>
            <div className="amenities-input">
              <input
                type="text"
                value={additionalRule}
                onChange={(e) => setAdditionalRule(e.target.value)}
                placeholder="Enter additional rule"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAdditionalRule())
                }
              />
              <button
                type="button"
                onClick={addAdditionalRule}
                className="btn-add"
              >
                Add Rule
              </button>
            </div>

            <div className="tags-list">
              {formData.house_rules.additional_rules.map((rule, index) => (
                <div key={index} className="tag">
                  {rule}
                  <button
                    type="button"
                    onClick={() => removeAdditionalRule(index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 10: Cancellation Policy (JSON) - ADMIN ONLY - Hidden from vendors */}
        {/* Cancellation policy is managed by admins. Default policy applies automatically. */}

        {/* Section 11: Rich Text Guidelines */}
        <section className="form-section">
          <h3>Property Guidelines (Rich Text)</h3>
          <p className="info-text">
            These guidelines will be sent to guests 24 hours before check-in
          </p>

          <div className="guideline-editor">
            <label>Check-In Guidelines</label>
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

          <div className="guideline-editor">
            <label>House Rules Text</label>
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

          <div className="guideline-editor">
            <label>Amenities Guide</label>
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

          <div className="guideline-editor">
            <label>Safety Information</label>
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

          <div className="guideline-editor">
            <label>Local Area Information</label>
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

          <div className="guideline-editor">
            <label>Emergency Contacts</label>
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
        </section>

        {/* Section 12: Photos */}
        <section className="form-section">
          <h3>Property Photos</h3>
          <p className="info-text">Enter one image URL per line</p>

          <textarea
            value={photoUrls}
            onChange={(e) => setPhotoUrls(e.target.value)}
            rows="6"
            placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;https://example.com/photo3.jpg"
            className="photos-textarea"
          />

          <p className="info-text">
            Total photos:{" "}
            {photoUrls.split("\n").filter((url) => url.trim()).length}
          </p>
        </section>

        {/* Submit Button(s) */}
        <div className="form-actions">
          {/* Show status-dependent buttons based on property state */}
          {propertyStatus === "draft" || !propertyId ? (
            // For DRAFT properties or NEW properties: Show TWO buttons
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || hasPendingChangeRequest}
                className="btn-secondary"
              >
                {loading ? "Saving..." : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || hasPendingChangeRequest}
                className="btn-submit"
              >
                {loading ? "Submitting..." : "Submit for Approval"}
              </button>
            </>
          ) : propertyStatus === "approved" ? (
            // For APPROVED properties: Single button that creates change request
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || hasPendingChangeRequest}
              className="btn-submit"
            >
              {loading ? "Submitting..." : "Submit Change Request"}
            </button>
          ) : (
            // For PENDING_APPROVAL or INACTIVE: Show disabled button
            <button type="button" disabled={true} className="btn-submit">
              {propertyStatus === "pending_approval"
                ? "Pending Admin Approval"
                : "Property Inactive"}
            </button>
          )}

          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
          )}

          {hasPendingChangeRequest && (
            <p className="info-text" style={{ color: "#d97706" }}>
              ⚠️ This property has a pending change request. Please wait for
              admin review before making new changes.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default VendorPropertyForm;
