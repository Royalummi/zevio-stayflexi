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
  Mountain,
  BellRing,
} from "lucide-react";
import api from "../../lib/api";

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
  "private-pool": Waves,
  jacuzzi: Bath,
  mountain: Mountain,
  "smoke-alarm": BellRing,
};

// Explicit category rendering order — Facilities first, then others
const CATEGORY_ORDER = [
  "facility",
  "connectivity",
  "comfort",
  "entertainment",
  "appliance",
  "safety",
  "service",
  "feature",
  "workspace",
  "policy",
  "general",
];

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

const SERVICE_APARTMENT_TYPE_ID = "pt-002";

const AmenitiesGrid = ({
  selectedAmenities = [],
  onChange,
  propertyTypeId,
}) => {
  const [amenities, setAmenities] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1500;
    try {
      setLoadError(false);
      const response = await api.get("/public/amenities");
      setAmenities(response.data.data || { all: [], grouped: {} });
      setLoading(false);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Auto-retry with increasing delay
        setTimeout(
          () => fetchAmenities(retryCount + 1),
          RETRY_DELAY_MS * (retryCount + 1),
        );
      } else {
        console.error("Error fetching amenities after retries:", error);
        setLoadError(true);
        setLoading(false);
      }
    }
  };

  const handleToggle = (amenityId, amenityName) => {
    // Ensure amenityId is always a string
    const idStr = String(amenityId || "");
    if (!idStr) return;

    let newSelected;

    if (selectedAmenities.includes(idStr)) {
      // Remove amenity
      newSelected = selectedAmenities.filter((a) => a !== idStr);
    } else {
      // Add amenity
      newSelected = [...selectedAmenities, idStr];
    }

    onChange(newSelected);
  };

  const isSelected = (amenityId) => {
    const idStr = String(amenityId || "");
    return selectedAmenities.some((a) => String(a) === idStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading amenities...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-sm text-muted-foreground">
          Failed to load amenities. Check that the server is running.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchAmenities();
          }}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {[...Object.entries(amenities.grouped)]
        .sort(([a], [b]) => {
          const ai = CATEGORY_ORDER.indexOf(a);
          const bi = CATEGORY_ORDER.indexOf(b);
          if (ai === -1 && bi === -1) return a.localeCompare(b);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        })
        .map(([category, items]) => {
          const isServiceApartment =
            propertyTypeId === SERVICE_APARTMENT_TYPE_ID;
          const filteredItems = items.filter(
            (amenity) => !amenity.apartment_only || isServiceApartment,
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                {categoryLabels[category] || category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map((amenity) => {
                  // Validate amenity object
                  if (!amenity || typeof amenity !== "object") return null;

                  const amenityName = String(amenity.name || "Unknown");
                  const amenityId = amenity.id || amenityName;
                  const IconComponent = iconMap[amenity.icon] || Monitor;
                  const selected = isSelected(amenityId);

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
          );
        })}
    </div>
  );
};

export default AmenitiesGrid;
