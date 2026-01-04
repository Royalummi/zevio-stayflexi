import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface City {
  id: string;
  name: string;
  state: string;
  country?: string;
  status: "active" | "inactive";
  property_count?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  city_id: string;
  city_name: string;
  state: string;
  address: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: PropertyImage[];
  rating?: number;
  reviews_count?: number;
}

export interface PropertyImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

export interface PropertiesResponse {
  properties: Property[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// API Functions

/**
 * Get all cities
 */
export async function getCities(): Promise<City[]> {
  try {
    const response = await apiClient.get("/public/cities");
    return response.data.data.cities || []; // Backend returns {success, message, data: {cities: [...]}}
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

/**
 * Get properties with filters
 */
export async function getProperties(params?: {
  city?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  page?: number;
}): Promise<PropertiesResponse> {
  try {
    // Filter out empty/null/undefined values
    const filteredParams: Record<string, string | number> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          filteredParams[key] = value;
        }
      });
    }

    const response = await apiClient.get("/public/properties", {
      params: filteredParams,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return {
      properties: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

/**
 * Get single property by ID
 */
export async function getProperty(id: string): Promise<Property | null> {
  try {
    const response = await apiClient.get(`/public/property/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

/**
 * Check property availability
 */
export async function checkAvailability(
  propertyId: string,
  checkin: string,
  checkout: string
): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await apiClient.post("/public/check-availability", {
      property_id: propertyId,
      check_in: checkin,
      check_out: checkout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error checking availability:", error);
    const axiosError = error as { response?: { data?: { message?: string } } };
    return {
      available: false,
      message:
        axiosError.response?.data?.message || "Failed to check availability",
    };
  }
}

export default apiClient;
