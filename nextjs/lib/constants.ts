/**
 * Application Constants
 * Centralized configuration values and enums
 */

// ======================
// API CONFIGURATION
// ======================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const API_ENDPOINTS = {
  // Public (no auth required)
  PUBLIC: {
    CITIES: "/public/cities",
    PROPERTIES: "/public/properties",
    PROPERTY_DETAILS: (id: string) => `/public/properties/${id}`,
  },

  // Authentication
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Users
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    UPLOAD_AVATAR: "/users/avatar",
  },

  // Cities
  CITIES: {
    LIST: "/cities",
    DETAILS: (id: number) => `/cities/${id}`,
  },

  // Properties
  PROPERTIES: {
    LIST: "/properties",
    DETAILS: (id: number) => `/properties/${id}`,
    SEARCH: "/properties/search",
    AVAILABLE: "/properties/available",
    BY_CITY: (cityId: number) => `/properties/city/${cityId}`,
  },

  // Bookings
  BOOKINGS: {
    LIST: "/bookings",
    DETAILS: (id: number) => `/bookings/${id}`,
    CREATE: "/bookings",
    CANCEL: (id: number) => `/bookings/${id}/cancel`,
    MY_BOOKINGS: "/bookings/my",
    USER_BOOKINGS: "/bookings/my",
    CHECK_AVAILABILITY: "/bookings/check-availability",
  },

  // Wishlist
  WISHLIST: {
    ADD: "/wishlist",
    REMOVE: (propertyId: string) => `/wishlist/${propertyId}`,
    MY_WISHLIST: "/wishlist/my",
    CHECK: (propertyId: string) => `/wishlist/check/${propertyId}`,
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: "/payments/create-order",
    VERIFY: "/payments/verify",
    DETAILS: (id: number) => `/payments/${id}`,
    REFUND: (id: number) => `/payments/${id}/refund`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
  },
} as const;

// ======================
// APPLICATION CONFIG
// ======================

export const APP_CONFIG = {
  APP_NAME: "Zevio Villa",
  APP_DESCRIPTION: "Premium villa rentals for your perfect getaway",
  COMPANY_NAME: "Zevio",
  SUPPORT_EMAIL: "support@zeviovilla.com",
  CONTACT_PHONE: "+91 1234567890",

  // Social Media
  SOCIAL: {
    FACEBOOK: "https://facebook.com/zeviovilla",
    INSTAGRAM: "https://instagram.com/zeviovilla",
    TWITTER: "https://twitter.com/zeviovilla",
    LINKEDIN: "https://linkedin.com/company/zeviovilla",
  },

  // SEO
  SEO: {
    DEFAULT_TITLE: "Zevio Villa - Premium Villa Rentals",
    DEFAULT_DESCRIPTION:
      "Discover and book luxurious villas for your perfect vacation. Explore our curated collection of premium properties.",
    DEFAULT_KEYWORDS:
      "villa rental, luxury villas, vacation homes, holiday rentals, premium properties",
    DEFAULT_OG_IMAGE: "/images/og-image.jpg",
  },
} as const;

// ======================
// ENUMS & STATUS VALUES
// ======================

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  DELETED: "deleted",
} as const;

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  VENDOR: "vendor",
} as const;

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_GATEWAY = {
  RAZORPAY: "razorpay",
  STRIPE: "stripe",
  PAYPAL: "paypal",
} as const;

export const PROPERTY_STATUS = {
  AVAILABLE: "available",
  BOOKED: "booked",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
} as const;

export const NOTIFICATION_TYPE = {
  BOOKING: "booking",
  PAYMENT: "payment",
  SYSTEM: "system",
  PROMOTION: "promotion",
} as const;

// ======================
// PAGINATION & LIMITS
// ======================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  PROPERTIES_PER_PAGE: 12,
  BOOKINGS_PER_PAGE: 10,
  NOTIFICATIONS_PER_PAGE: 20,
} as const;

// ======================
// VALIDATION RULES
// ======================

export const VALIDATION = {
  // User
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  PHONE_LENGTH: 10,

  // Property
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 2000,
  MIN_GUESTS: 1,
  MAX_GUESTS: 50,
  MIN_BEDROOMS: 1,
  MAX_BEDROOMS: 20,
  MIN_BATHROOMS: 1,
  MAX_BATHROOMS: 20,

  // Booking
  MIN_BOOKING_DAYS: 1,
  MAX_BOOKING_DAYS: 90,
  ADVANCE_BOOKING_DAYS: 365,

  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// ======================
// DATE & TIME FORMATS
// ======================

export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy", // Jan 01, 2024
  DISPLAY_LONG: "MMMM dd, yyyy", // January 01, 2024
  DISPLAY_WITH_TIME: "MMM dd, yyyy HH:mm", // Jan 01, 2024 14:30
  API: "yyyy-MM-dd", // 2024-01-01
  API_WITH_TIME: "yyyy-MM-dd HH:mm:ss", // 2024-01-01 14:30:00
  TIME_ONLY: "HH:mm", // 14:30
  TIME_12H: "hh:mm a", // 02:30 PM
} as const;

// ======================
// CURRENCY SETTINGS
// ======================

export const CURRENCY = {
  CODE: "INR",
  SYMBOL: "₹",
  LOCALE: "en-IN",
  DECIMAL_PLACES: 0, // No decimal for INR
} as const;

// ======================
// LOCAL STORAGE KEYS
// ======================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "zevio_access_token",
  REFRESH_TOKEN: "zevio_refresh_token",
  USER_DATA: "zevio_user_data",
  SEARCH_HISTORY: "zevio_search_history",
  THEME: "zevio_theme",
  LANGUAGE: "zevio_language",
} as const;

// ======================
// ERROR MESSAGES
// ======================

export const ERROR_MESSAGES = {
  // Network
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",

  // Authentication
  AUTH_REQUIRED: "Please login to continue.",
  AUTH_INVALID: "Invalid credentials. Please try again.",
  AUTH_EXPIRED: "Your session has expired. Please login again.",

  // Validation
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_PASSWORD: "Password must be at least 8 characters.",
  PASSWORD_MISMATCH: "Passwords do not match.",

  // Booking
  BOOKING_UNAVAILABLE: "This property is not available for selected dates.",
  BOOKING_FAILED: "Failed to create booking. Please try again.",

  // Payment
  PAYMENT_FAILED: "Payment failed. Please try again.",
  PAYMENT_CANCELLED: "Payment was cancelled.",

  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  NO_DATA_FOUND: "No data found.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
} as const;

// ======================
// SUCCESS MESSAGES
// ======================

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: "Login successful!",
  LOGOUT_SUCCESS: "Logout successful!",
  REGISTER_SUCCESS: "Registration successful! Please login.",
  PASSWORD_CHANGED: "Password changed successfully!",

  // Booking
  BOOKING_SUCCESS: "Booking created successfully!",
  BOOKING_CANCELLED: "Booking cancelled successfully!",

  // Payment
  PAYMENT_SUCCESS: "Payment completed successfully!",

  // Profile
  PROFILE_UPDATED: "Profile updated successfully!",

  // Generic
  SAVE_SUCCESS: "Saved successfully!",
  DELETE_SUCCESS: "Deleted successfully!",
  UPDATE_SUCCESS: "Updated successfully!",
} as const;

// ======================
// BREAKPOINTS
// ======================

export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// ======================
// Z-INDEX LAYERS
// ======================

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const;

// ======================
// ANIMATION DURATIONS
// ======================

export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ======================
// REGEX PATTERNS
// ======================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_IN: /^[6-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  NUMERIC: /^\d+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
} as const;

// ======================
// TYPE EXPORTS
// ======================

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PropertyStatus =
  (typeof PROPERTY_STATUS)[keyof typeof PROPERTY_STATUS];
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
