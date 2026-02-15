import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Request tracking to prevent duplicate simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle rate limiting
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 (Too Many Requests)
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Extract retry-after header or use default backoff
      const retryAfter = error.response.headers["retry-after"];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000;

      console.warn(`Rate limited. Retrying after ${waitTime}ms...`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

// Types
export interface City {
  id: string;
  name: string;
  state: string;
  country?: string;
  status: "active" | "inactive";
  property_count?: number;
  area?: string; // For service apartments: specific area/locality within city
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
 * Returns fallback cities if backend is unavailable
 */
export async function getCities(): Promise<City[]> {
  try {
    const response = await apiClient.get("/public/cities", {
      timeout: 3000, // 3 second timeout
    });
    return response.data.data.cities || [];
  } catch {
    // Silently return fallback cities when backend is unavailable
    // This prevents errors during development when backend/database is down
    return [
      {
        id: "1",
        name: "Goa",
        state: "Goa",
        country: "India",
        status: "active" as const,
      },
      {
        id: "2",
        name: "Jaipur",
        state: "Rajasthan",
        country: "India",
        status: "active" as const,
      },
      {
        id: "3",
        name: "Alibaug",
        state: "Maharashtra",
        country: "India",
        status: "active" as const,
      },
      {
        id: "4",
        name: "Lonavala",
        state: "Maharashtra",
        country: "India",
        status: "active" as const,
      },
      {
        id: "5",
        name: "Udaipur",
        state: "Rajasthan",
        country: "India",
        status: "active" as const,
      },
      {
        id: "6",
        name: "Rishikesh",
        state: "Uttarakhand",
        country: "India",
        status: "active" as const,
      },
    ];
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
  } catch {
    // Return empty result when backend is unavailable
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
  } catch {
    // Return null when backend is unavailable
    return null;
  }
}

/**
 * Check property availability
 */
export async function checkAvailability(
  propertyId: string,
  checkin: string,
  checkout: string,
): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await apiClient.post("/public/check-availability", {
      property_id: propertyId,
      check_in: checkin,
      check_out: checkout,
    });
    return response.data;
  } catch {
    // Return unavailable when backend is unavailable
    return {
      available: false,
      message: "Service temporarily unavailable. Please try again later.",
    };
  }
}

export default apiClient;
