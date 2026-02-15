import { useState, useEffect } from "react";
import {
  Wifi,
  Monitor,
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
  Laptop,
  Check,
} from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

// Icon mapping
const iconMap = {
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

// Category labels
const categoryLabels = {
  connectivity: "Connectivity",
  comfort: "Comfort",
  facility: "Facilities",
  entertainment: "Entertainment",
  appliance: "Appliances",
  safety: "Safety",
  service: "Services",
  feature: "Features",
  policy: "Policies",
  workspace: "Workspace",
  general: "General",
};

const AmenitiesGrid = ({ selectedAmenities = [], onChange }) => {
  const [amenities, setAmenities] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const response = await api.get("/admin/amenities");
      setAmenities(response.data.data || { all: [], grouped: {} });
    } catch (error) {
      console.error("Error fetching amenities:", error);
      toast.error("Failed to load amenities");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (amenityId, amenityName) => {
    // Ensure amenityName is always a string
    const nameStr = String(amenityName || "");
    if (!nameStr) return;

    let newSelected;

    if (selectedAmenities.includes(nameStr)) {
      // Remove amenity
      newSelected = selectedAmenities.filter((a) => a !== nameStr);
    } else {
      // Add amenity
      newSelected = [...selectedAmenities, nameStr];
    }

    onChange(newSelected);
  };

  const isSelected = (amenityName) => {
    // Handle both string and object amenities
    return selectedAmenities.some((a) =>
      typeof a === "string" ? a === amenityName : a?.name === amenityName,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading amenities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(amenities.grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((amenity) => {
              // Validate amenity object
              if (!amenity || typeof amenity !== "object") return null;

              const amenityName = String(amenity.name || "Unknown");
              const amenityId = amenity.id || amenityName;
              const IconComponent = iconMap[amenity.icon] || Monitor;
              const selected = isSelected(amenityName);

              return (
                <button
                  key={amenityId}
                  type="button"
                  onClick={() => handleToggle(amenityId, amenityName)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${
                      selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  {selected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                  <IconComponent
                    className={`h-6 w-6 ${selected ? "text-primary" : "text-gray-600"}`}
                  />
                  <span
                    className={`text-sm font-medium text-center ${
                      selected ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    {amenityName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedAmenities.length > 0 && (
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-foreground mb-2">
            Selected Amenities ({selectedAmenities.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map((amenity, index) => {
              // Handle both string and object amenities
              const amenityName =
                typeof amenity === "string"
                  ? amenity
                  : amenity?.name || "Unknown";
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                >
                  {amenityName}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesGrid;
