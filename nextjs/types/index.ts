/**
 * Centralized TypeScript type definitions for Zevio Application
 * This file contains all shared interfaces and types used across the application
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive" | "blocked";
  role?: "user" | "vendor" | "employee" | "admin";
  corporate_verified?: boolean;
  created_at?: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export interface Property {
  id: string;
  name: string;
  title?: string; // Backend sometimes sends 'title'
  description: string;
  address: string;
  area?: string; // Specific area/locality within city
  city: string;
  state: string;
  pincode: string;
  maps_location?: string; // Google Maps URL for property location
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[] | string; // Can be array or JSON string
  photos: string[] | string; // Can be array or JSON string
  rating: number;
  reviews_count: number;
  status: "active" | "inactive" | "maintenance";
  corporate_discount_percentage?: number; // Corporate discount percentage
  created_at?: string;
  updated_at?: string;
}

export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  checkIn?: string;
  checkOut?: string;
}

// ============================================================================
// CITY & LOCATION TYPES
// ============================================================================

export interface City {
  id: string;
  name: string;
  state: string;
  country?: string;
  status: "active" | "inactive";
  property_count?: number;
  area?: string; // For area-wise search: specific area/locality within city
  city?: string; // City name when area is present (from areas API)
  city_id?: string; // City ID when area is present (from areas API)
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  property_name?: string;
  property_location?: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  base_amount: number;
  gst_amount: number;
  discount_amount: number;
  total_amount: number;
  status:
    | "pending_payment"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "refunded";
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at?: string;
}

export interface BookingRequest {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  coupon_code?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment {
  id: string;
  booking_id: string;
  gateway: "razorpay" | "stripe" | "cash";
  gateway_payment_id: string | null;
  amount: number;
  status: "pending" | "success" | "failed" | "refunded";
  created_at: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface SearchParams {
  city?: string;
  checkin?: string;
  checkout?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
}

// ============================================================================
// DASHBOARD & STATS TYPES
// ============================================================================

export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  pastBookings: number;
  totalSpent?: number;
  savedAmount?: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: "booking" | "payment" | "cancellation" | "system";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}
