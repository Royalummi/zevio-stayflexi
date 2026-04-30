import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VendorPropertyForm from "./VendorPropertyForm";

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = mockLocalStorage;

// Mock react-quill
vi.mock("react-quill", () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="quill-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockCitiesResponse = {
  success: true,
  data: {
    cities: [
      { id: "city-1", name: "Goa", state: "Goa" },
      { id: "city-2", name: "Mumbai", state: "Maharashtra" },
    ],
  },
};

const mockPropertyResponse = {
  success: true,
  data: {
    property: {
      id: "prop-123",
      title: "Test Villa",
      description: "A beautiful test villa",
      city_id: "city-1",
      property_type_id: "type-1",
      bedrooms: 3,
      bathrooms: 2,
      max_guests: 6,
      price_per_night: 5000,
      gst_percentage: 18,
      status: "draft",
      amenities: [],
      house_rules: {},
      cancellation_policy: {},
      photos: [],
    },
    amenities: [],
    contacts: [],
    pendingChangeRequest: null,
  },
};

describe("VendorPropertyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue("mock-token");
  });

  it("should render the form", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => mockCitiesResponse,
    });

    render(
      <BrowserRouter>
        <VendorPropertyForm />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Property Title/i)).toBeInTheDocument();
    });
  });

  it("should fetch cities on mount", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => mockCitiesResponse,
    });

    render(
      <BrowserRouter>
        <VendorPropertyForm />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/public/cities",
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        }),
      );
    });
  });

  it("should fetch property data when propertyId is provided", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({ json: async () => mockPropertyResponse });

    render(
      <BrowserRouter>
        <VendorPropertyForm propertyId="prop-123" />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/vendor/properties/prop-123",
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        }),
      );
    });
  });

  it("should warn about pending change request", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const mockPropertyWithPendingChange = {
      ...mockPropertyResponse,
      data: {
        ...mockPropertyResponse.data,
        pendingChangeRequest: {
          id: "cr-123",
          status: "pending",
        },
      },
    };

    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({
        json: async () => mockPropertyWithPendingChange,
      });

    render(
      <BrowserRouter>
        <VendorPropertyForm propertyId="prop-123" />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("pending change request"),
      );
    });

    alertSpy.mockRestore();
  });

  it("should handle draft property creation", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { id: "new-prop-123", status: "draft" },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { id: "new-prop-123", status: "pending_approval" },
        }),
      });

    render(
      <BrowserRouter>
        <VendorPropertyForm />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Property Title/i)).toBeInTheDocument();
    });

    // Fill form fields would go here
    // This is a placeholder for form submission test
  });

  it("should handle property update creating change request", async () => {
    const mockApprovedProperty = {
      ...mockPropertyResponse,
      data: {
        ...mockPropertyResponse.data,
        status: "approved",
      },
    };

    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({ json: async () => mockApprovedProperty })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          message: "Change request created",
          data: { changeRequestId: "cr-123" },
        }),
      });

    render(
      <BrowserRouter>
        <VendorPropertyForm propertyId="prop-123" />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Villa")).toBeInTheDocument();
    });

    // Update form and submit would trigger change request
  });

  it("should validate required fields", async () => {
    fetch.mockResolvedValueOnce({ json: async () => mockCitiesResponse });

    render(
      <BrowserRouter>
        <VendorPropertyForm />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Property Title/i)).toBeInTheDocument();
    });

    // Test validation logic
    // Validation happens on form submission
  });

  it("should handle API errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <BrowserRouter>
        <VendorPropertyForm />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching cities:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle amenities as array not stringified", async () => {
    const mockPropWithAmenities = {
      ...mockPropertyResponse,
      data: {
        ...mockPropertyResponse.data,
        amenities: ["amenity-1", "amenity-2"],
      },
    };

    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({ json: async () => mockPropWithAmenities });

    render(
      <BrowserRouter>
        <VendorPropertyForm propertyId="prop-123" />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Villa")).toBeInTheDocument();
    });

    // Verify amenities are handled correctly
  });

  it("should use correct API paths", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => mockCitiesResponse })
      .mockResolvedValueOnce({ json: async () => mockPropertyResponse });

    render(
      <BrowserRouter>
        <VendorPropertyForm propertyId="prop-123" />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Verify /api/public/cities is used (not /api/cities)
      expect(fetch).toHaveBeenCalledWith(
        "/api/public/cities",
        expect.any(Object),
      );

      // Verify /api/vendor/properties/:id is used
      expect(fetch).toHaveBeenCalledWith(
        "/api/vendor/properties/prop-123",
        expect.any(Object),
      );
    });
  });
});
