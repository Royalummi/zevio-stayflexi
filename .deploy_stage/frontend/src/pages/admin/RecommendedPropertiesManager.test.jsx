import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RecommendedPropertiesManager from "./RecommendedPropertiesManager";

// Mock the api module
vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

// Import the mocked api
import api from "../../lib/api";

// Mock the toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProperties = [
  {
    id: "prop-1",
    title: "Luxury Villa in Goa",
    city: "Goa",
    state: "Goa",
    price_per_night: 5000,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    rating: 4.8,
    status: "approved",
    property_type_id: "pt-001",
    is_recommended: true,
    recommended_priority: 1,
    images: [{ image_url: "/villa1.jpg", display_order: 1 }],
  },
  {
    id: "prop-2",
    title: "Beachfront Villa",
    city: "North Goa",
    state: "Goa",
    price_per_night: 7000,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    rating: 4.9,
    status: "approved",
    property_type_id: "pt-001",
    is_recommended: true,
    recommended_priority: 2,
    images: [{ image_url: "/villa2.jpg", display_order: 1 }],
  },
  {
    id: "prop-3",
    title: "Modern Service Apartment",
    city: "Mumbai",
    state: "Maharashtra",
    price_per_night: 3000,
    max_guests: 3,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.5,
    status: "approved",
    property_type_id: "pt-002",
    is_recommended: true,
    recommended_priority: 1,
    images: [{ image_url: "/apt1.jpg", display_order: 1 }],
  },
  {
    id: "prop-4",
    title: "Cozy Villa in Manali",
    city: "Manali",
    state: "Himachal Pradesh",
    price_per_night: 4000,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    rating: null,
    status: "pending",
    property_type_id: "pt-001",
    is_recommended: false,
    recommended_priority: 0,
    images: [],
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <RecommendedPropertiesManager />
    </BrowserRouter>,
  );
};

describe("RecommendedPropertiesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { properties: mockProperties },
      },
    });
  });

  describe("Component Rendering", () => {
    it("should render the page title and description", async () => {
      renderComponent();

      expect(
        screen.getByText("Recommended Properties Manager"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Control which properties appear in the homepage recommended sections/i,
        ),
      ).toBeInTheDocument();
    });

    it("should display stats cards with correct counts", async () => {
      renderComponent();

      await waitFor(() => {
        // 2 recommended villas (pt-001)
        expect(screen.getByText(/2\/12/)).toBeInTheDocument();
        // 1 recommended service apartment (pt-002)
        expect(screen.getByText(/1\/12/)).toBeInTheDocument();
        // 4 total properties
        expect(screen.getByText("4")).toBeInTheDocument();
      });
    });

    it("should display Villa and Service Apartments tabs", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /villa/i })).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /service apartments/i }),
        ).toBeInTheDocument();
      });
    });

    it("should display search and filter controls", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/search by property name or city/i),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /refresh/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch properties on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/admin/properties");
      });
    });

    it("should show loading state while fetching", () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      api.get.mockRejectedValue(new Error("API Error"));

      renderComponent();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe("Villa Tab", () => {
    it("should display villa properties in Villa tab", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
        expect(screen.getByText("Beachfront Villa")).toBeInTheDocument();
      });
    });

    it("should show priority badges for recommended villas", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByText("#2")).toBeInTheDocument();
      });
    });

    it("should display property details correctly", async () => {
      renderComponent();

      await waitFor(() => {
        const luxuryVilla = screen
          .getByText("Luxury Villa in Goa")
          .closest("tr");
        expect(
          within(luxuryVilla).getByText("2 BR • 4 Guests"),
        ).toBeInTheDocument();
        expect(within(luxuryVilla).getByText("4.8 ⭐")).toBeInTheDocument();
        expect(within(luxuryVilla).getByText("Approved")).toBeInTheDocument();
      });
    });

    it('should show "No ratings yet" for properties without ratings', async () => {
      renderComponent();

      await waitFor(() => {
        const cozyVilla = screen
          .getByText("Cozy Villa in Manali")
          .closest("tr");
        expect(
          within(cozyVilla).getByText("No ratings yet"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Service Apartments Tab", () => {
    it("should switch to Service Apartments tab and display correct properties", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
      });

      // Click Service Apartments tab
      const serviceApartmentsTab = screen.getByRole("tab", {
        name: /service apartments/i,
      });
      await user.click(serviceApartmentsTab);

      await waitFor(() => {
        expect(
          screen.getByText("Modern Service Apartment"),
        ).toBeInTheDocument();
        expect(
          screen.queryByText("Luxury Villa in Goa"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("should filter properties by property name", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /search by property name or city/i,
      );
      await user.type(searchInput, "Beachfront");

      await waitFor(() => {
        expect(screen.getByText("Beachfront Villa")).toBeInTheDocument();
        expect(
          screen.queryByText("Luxury Villa in Goa"),
        ).not.toBeInTheDocument();
      });
    });

    it("should filter properties by city", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /search by property name or city/i,
      );
      await user.type(searchInput, "Manali");

      await waitFor(() => {
        expect(screen.getByText("Cozy Villa in Manali")).toBeInTheDocument();
        expect(
          screen.queryByText("Luxury Villa in Goa"),
        ).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /search by property name or city/i,
      );
      await user.type(searchInput, "GOA");

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
        expect(screen.getByText("Beachfront Villa")).toBeInTheDocument();
      });
    });
  });

  describe("Status Filter", () => {
    it("should filter by recommended status", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
        expect(screen.getByText("Cozy Villa in Manali")).toBeInTheDocument();
      });

      // Find and click the status filter
      const statusCombobox = screen.getByRole("combobox");
      await user.click(statusCombobox);

      // Select "Recommended Only"
      const recommendedOption = await screen.findByRole("option", {
        name: /recommended only/i,
      });
      await user.click(recommendedOption);

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
        expect(screen.getByText("Beachfront Villa")).toBeInTheDocument();
        expect(
          screen.queryByText("Cozy Villa in Manali"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Toggle Recommended Status", () => {
    it("should toggle property as recommended", async () => {
      const user = userEvent.setup();
      api.put.mockResolvedValue({
        data: { ...mockProperties[3], is_recommended: true },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Cozy Villa in Manali")).toBeInTheDocument();
      });

      // Find the toggle switch for non-recommended property
      const cozyVillaRow = screen
        .getByText("Cozy Villa in Manali")
        .closest("tr");
      const toggleSwitch = within(cozyVillaRow).getByRole("switch");

      await user.click(toggleSwitch);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          "/admin/properties/prop-4/recommended",
          { isRecommended: true },
        );
      });
    });

    it("should prevent recommending more than 12 properties per type", async () => {
      const user = userEvent.setup();

      // Mock 12 recommended villas already
      const manyVillas = Array.from({ length: 12 }, (_, i) => ({
        id: `villa-${i + 1}`,
        title: `Villa ${i + 1}`,
        city: "Goa",
        state: "Goa",
        price_per_night: 5000,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 2,
        rating: 4.5,
        status: "approved",
        property_type_id: "pt-001",
        is_recommended: true,
        recommended_priority: i + 1,
        images: [],
      }));

      const newVilla = {
        id: "villa-13",
        title: "Villa 13",
        city: "Goa",
        state: "Goa",
        price_per_night: 5000,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 2,
        rating: 4.5,
        status: "approved",
        property_type_id: "pt-001",
        is_recommended: false,
        recommended_priority: 0,
        images: [],
      };

      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { properties: [...manyVillas, newVilla] },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("12/12")).toBeInTheDocument();
      });

      // Try to toggle the 13th villa
      const villa13Row = screen.getByText("Villa 13").closest("tr");
      const toggleSwitch = within(villa13Row).getByRole("switch");

      await user.click(toggleSwitch);

      // Should show error toast (mocked)
      const { toast } = await import("sonner");
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Cannot recommend more than 12"),
        );
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refetch properties when refresh button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to edit page when Edit button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Luxury Villa in Goa")).toBeInTheDocument();
      });

      const luxuryVillaRow = screen
        .getByText("Luxury Villa in Goa")
        .closest("tr");
      const editButton = within(luxuryVillaRow).getByRole("button", {
        name: /edit/i,
      });

      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/admin/properties/prop-1/edit",
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole("tablist")).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /villa/i })).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: /service apartments/i }),
        ).toBeInTheDocument();
      });
    });

    it("should have accessible form controls", async () => {
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          /search by property name or city/i,
        );
        expect(searchInput).toHaveAttribute("type", "text");

        const refreshButton = screen.getByRole("button", { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });
});
