/**
 * Amenity Icon Mapping System
 * Maps amenity names from API to React Icons with proper styling
 */

import {
  FiWifi,
  FiTruck,
  FiShield,
  FiBriefcase,
  FiZap,
  FiDroplet,
  FiWind,
  FiSun,
  FiTv,
  FiHome,
} from "react-icons/fi";
import {
  MdOutlineElevator,
  MdOutlineLocalLaundryService,
  MdOutlineCleaningServices,
  MdOutlineKitchen,
  MdOutlineFitnessCenter,
  MdOutlinePool,
} from "react-icons/md";
import { TbAirConditioning } from "react-icons/tb";
import { BiDumbbell } from "react-icons/bi";
import { GiElectric } from "react-icons/gi";

export type AmenityIconType = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color?: string;
};

export const AMENITY_ICON_MAP: Record<string, AmenityIconType> = {
  // Network & Connectivity
  wifi: { icon: FiWifi, label: "WiFi" },
  WiFi: { icon: FiWifi, label: "WiFi" },
  "High-Speed WiFi": { icon: FiWifi, label: "High-Speed WiFi" },

  // Climate Control
  ac: { icon: TbAirConditioning, label: "AC" },
  AC: { icon: TbAirConditioning, label: "AC" },
  "Air Conditioning": { icon: TbAirConditioning, label: "AC" },

  // Security
  security: { icon: FiShield, label: "Security" },
  Security: { icon: FiShield, label: "Security" },
  "24/7 Security": { icon: FiShield, label: "24/7 Security" },

  // Workspace
  workspace: { icon: FiBriefcase, label: "Workspace" },
  Workspace: { icon: FiBriefcase, label: "Workspace" },
  "Dedicated Workspace": { icon: FiBriefcase, label: "Workspace" },

  // Parking
  parking: { icon: FiTruck, label: "Parking" },
  Parking: { icon: FiTruck, label: "Parking" },
  "Free Parking": { icon: FiTruck, label: "Free Parking" },

  // Power & Utilities
  "power backup": { icon: FiZap, label: "Power Backup" },
  "Power Backup": { icon: FiZap, label: "Power Backup" },
  Generator: { icon: GiElectric, label: "Generator" },

  // Water
  water: { icon: FiDroplet, label: "Water Supply" },
  "24/7 Water": { icon: FiDroplet, label: "24/7 Water" },
  geyser: { icon: FiSun, label: "Geyser" },
  Geyser: { icon: FiSun, label: "Geyser" },

  // Appliances & Equipment
  tv: { icon: FiTv, label: "TV" },
  TV: { icon: FiTv, label: "TV" },
  "Smart TV": { icon: FiTv, label: "Smart TV" },
  kitchen: { icon: MdOutlineKitchen, label: "Kitchen" },
  Kitchen: { icon: MdOutlineKitchen, label: "Kitchen" },
  "Fully Equipped Kitchen": { icon: MdOutlineKitchen, label: "Kitchen" },

  // Cleaning & Maintenance
  housekeeping: { icon: MdOutlineCleaningServices, label: "Housekeeping" },
  Housekeeping: { icon: MdOutlineCleaningServices, label: "Housekeeping" },
  "Daily Housekeeping": {
    icon: MdOutlineCleaningServices,
    label: "Housekeeping",
  },
  laundry: { icon: MdOutlineLocalLaundryService, label: "Laundry" },
  Laundry: { icon: MdOutlineLocalLaundryService, label: "Laundry" },
  "Washing Machine": { icon: MdOutlineLocalLaundryService, label: "Laundry" },

  // Building Features
  elevator: { icon: MdOutlineElevator, label: "Elevator" },
  Elevator: { icon: MdOutlineElevator, label: "Elevator" },
  Lift: { icon: MdOutlineElevator, label: "Lift" },

  // Recreation
  gym: { icon: MdOutlineFitnessCenter, label: "Gym" },
  Gym: { icon: MdOutlineFitnessCenter, label: "Gym" },
  Fitness: { icon: BiDumbbell, label: "Fitness Center" },
  pool: { icon: MdOutlinePool, label: "Pool" },
  Pool: { icon: MdOutlinePool, label: "Swimming Pool" },
  "Swimming Pool": { icon: MdOutlinePool, label: "Swimming Pool" },

  // Comfort
  furnished: { icon: FiHome, label: "Fully Furnished" },
  "Fully Furnished": { icon: FiHome, label: "Fully Furnished" },
  balcony: { icon: FiWind, label: "Balcony" },
  Balcony: { icon: FiWind, label: "Balcony" },
};

/**
 * Get icon component for an amenity
 * Returns default icon if not found
 */
export const getAmenityIcon = (amenityName: string): AmenityIconType => {
  // Try exact match first
  if (AMENITY_ICON_MAP[amenityName]) {
    return AMENITY_ICON_MAP[amenityName];
  }

  // Try case-insensitive match
  const lowerName = amenityName.toLowerCase();
  const matchedKey = Object.keys(AMENITY_ICON_MAP).find(
    (key) => key.toLowerCase() === lowerName,
  );

  if (matchedKey) {
    return AMENITY_ICON_MAP[matchedKey];
  }

  // Default icon
  return { icon: FiHome, label: amenityName };
};

/**
 * Get top N amenities to display (prioritized)
 */
export const getPriorityAmenities = (
  amenities: string[],
  limit: number = 4,
): string[] => {
  const priority = [
    "WiFi",
    "wifi",
    "AC",
    "ac",
    "Workspace",
    "workspace",
    "Parking",
    "parking",
    "Security",
    "security",
    "Elevator",
    "elevator",
    "Housekeeping",
    "housekeeping",
  ];

  const prioritized: string[] = [];
  const remaining: string[] = [];

  amenities.forEach((amenity) => {
    const isPriority = priority.some(
      (p) => p.toLowerCase() === amenity.toLowerCase(),
    );
    if (isPriority) {
      prioritized.push(amenity);
    } else {
      remaining.push(amenity);
    }
  });

  return [...prioritized, ...remaining].slice(0, limit);
};
