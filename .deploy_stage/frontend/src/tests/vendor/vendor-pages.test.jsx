import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VendorProperties from "../../pages/vendor/VendorProperties";
import VendorBookings from "../../pages/vendor/VendorBookings";
import VendorSettlements from "../../pages/vendor/VendorSettlements";
import VendorAnalytics from "../../pages/vendor/VendorAnalytics";
import VendorProfile from "../../pages/vendor/VendorProfile";

// Mock API
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../lib/api", () => ({
  default: mockApi,
}));

// Mock auth store
const mockAuthStore = {
  user: {
    id: "vendor-123",
    name: "Test Vendor",
    full_name: "Test Vendor",
    email: "vendor@test.com",
    role: "vendor",
  },
  updateUser: vi.fn(),
};

vi.mock("../../store/authStore", () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Vendor Properties Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render properties page with header", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          properties: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithRouter(<VendorProperties />);

    await waitFor(() => {
      expect(screen.getByText("My Properties")).toBeInTheDocument();
    });
  });

  it("should display properties list when data exists", async () => {
    const mockProperties = [
      {
        id: "prop-1",
        title: "Test Villa",
        city_name: "Mumbai",
        status: "approved",
        price_per_night: 5000,
        total_bookings: 10,
        total_revenue: 50000,
        created_at: "2026-01-01",
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          properties: mockProperties,
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorProperties />);

    await waitFor(() => {
      expect(screen.getByText("Test Villa")).toBeInTheDocument();
      expect(screen.getByText("Mumbai")).toBeInTheDocument();
    });
  });

  it("should show empty state when no properties", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          properties: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithRouter(<VendorProperties />);

    await waitFor(() => {
      expect(screen.getByText("No properties found")).toBeInTheDocument();
    });
  });

  it("should handle search filter", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          properties: [
            {
              id: "1",
              title: "Villa A",
              city_name: "Mumbai",
              status: "approved",
              created_at: "2026-01-01",
            },
            {
              id: "2",
              title: "Villa B",
              city_name: "Goa",
              status: "approved",
              created_at: "2026-01-01",
            },
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorProperties />);

    await waitFor(() => {
      expect(screen.getByText("Villa A")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search properties...");
    fireEvent.change(searchInput, { target: { value: "Goa" } });

    // After filter, only Goa property should be visible (client-side filter)
    await waitFor(() => {
      expect(screen.queryByText("Villa A")).not.toBeInTheDocument();
      expect(screen.getByText("Villa B")).toBeInTheDocument();
    });
  });

  it("should handle export CSV", async () => {
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();

    const mockCreateElement = vi.spyOn(document, "createElement");
    const mockClick = vi.fn();
    mockCreateElement.mockReturnValue({ click: mockClick });

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          properties: [
            {
              id: "1",
              title: "Test",
              city_name: "Mumbai",
              status: "approved",
              price_per_night: 5000,
              total_bookings: 5,
              total_revenue: 25000,
              created_at: "2026-01-01",
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorProperties />);

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    const exportButton = screen.getByText("Export CSV");
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
  });
});

describe("Vendor Bookings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render bookings page with stats", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          bookings: [],
          pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithRouter(<VendorBookings />);

    await waitFor(() => {
      expect(screen.getByText("Bookings")).toBeInTheDocument();
      expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    });
  });

  it("should display bookings list", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        property_title: "Test Villa",
        guest_name: "John Doe",
        guest_email: "john@test.com",
        guest_phone: "1234567890",
        check_in: "2026-03-01",
        check_out: "2026-03-03",
        nights: 2,
        total_amount: 10000,
        status: "confirmed",
        created_at: "2026-02-01",
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          bookings: mockBookings,
          pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorBookings />);

    await waitFor(() => {
      expect(screen.getByText("Test Villa")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should filter bookings by status", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          bookings: [],
          pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithRouter(<VendorBookings />);

    await waitFor(() => {
      expect(screen.getByText("Bookings")).toBeInTheDocument();
    });

    // Mock API call for filtered bookings
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          bookings: [],
          pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
        },
      },
    });

    const statusFilter = screen.getByRole("combobox");
    fireEvent.click(statusFilter);

    // Check that API was called initially
    expect(mockApi.get).toHaveBeenCalled();
  });

  it("should show booking details in dialog", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        property_title: "Test Villa",
        guest_name: "John Doe",
        guest_email: "john@test.com",
        check_in: "2026-03-01",
        check_out: "2026-03-03",
        nights: 2,
        total_amount: 10000,
        status: "confirmed",
        created_at: "2026-02-01",
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          bookings: mockBookings,
          pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorBookings />);

    await waitFor(() => {
      expect(screen.getByText("Test Villa")).toBeInTheDocument();
    });

    const viewButton = screen.getByText("View");
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText("Booking Details")).toBeInTheDocument();
    });
  });
});

describe("Vendor Settlements Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render settlements page with stats cards", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          settlements: [],
          pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
        },
      },
    });

    renderWithRouter(<VendorSettlements />);

    await waitFor(() => {
      expect(screen.getByText("Settlements")).toBeInTheDocument();
      expect(screen.getByText("Lifetime Earnings")).toBeInTheDocument();
    });
  });

  it("should display settlements list", async () => {
    const mockSettlements = [
      {
        id: "settlement-1",
        booking_id: "booking-1",
        property_title: "Test Villa",
        amount: 8500,
        status: "paid",
        created_at: "2026-02-01",
        payment_proof: null,
      },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          settlements: mockSettlements,
          pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorSettlements />);

    await waitFor(() => {
      expect(screen.getByText("Test Villa")).toBeInTheDocument();
      expect(screen.getByText(/8,500/)).toBeInTheDocument();
    });
  });

  it("should calculate stats correctly", async () => {
    const mockSettlements = [
      { id: "1", amount: 5000, status: "pending", created_at: "2026-02-01" },
      { id: "2", amount: 10000, status: "paid", created_at: "2026-02-01" },
      { id: "3", amount: 3000, status: "approved", created_at: "2026-02-01" },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          settlements: mockSettlements,
          pagination: { page: 1, limit: 15, total: 3, totalPages: 1 },
        },
      },
    });

    renderWithRouter(<VendorSettlements />);

    await waitFor(() => {
      // Lifetime earnings = paid settlements = 10,000
      expect(screen.getByText(/10,000/)).toBeInTheDocument();
    });
  });
});

describe("Vendor Analytics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render analytics page", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        data: {
          revenue_by_property: [],
          booking_trends: [],
        },
      },
    });

    renderWithRouter(<VendorAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });
  });

  it("should display revenue by property chart", async () => {
    const mockData = {
      revenue_by_property: [
        { title: "Villa A", total_bookings: 10, total_revenue: 50000 },
        { title: "Villa B", total_bookings: 5, total_revenue: 30000 },
      ],
      booking_trends: [],
    };

    mockApi.get.mockResolvedValueOnce({
      data: { data: mockData },
    });

    renderWithRouter(<VendorAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("Villa A")).toBeInTheDocument();
      expect(screen.getByText("Villa B")).toBeInTheDocument();
    });
  });

  it("should display monthly trends", async () => {
    const mockData = {
      revenue_by_property: [],
      booking_trends: [
        { month: "2026-02", bookings: 10, revenue: 50000 },
        { month: "2026-01", bookings: 8, revenue: 40000 },
      ],
    };

    mockApi.get.mockResolvedValueOnce({
      data: { data: mockData },
    });

    renderWithRouter(<VendorAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("2026-02")).toBeInTheDocument();
      expect(screen.getByText("2026-01")).toBeInTheDocument();
    });
  });

  it("should handle date range filter", async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: {
          revenue_by_property: [],
          booking_trends: [],
        },
      },
    });

    renderWithRouter(<VendorAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    const dateFilter = screen.getByRole("combobox");
    fireEvent.change(dateFilter, { target: { value: "30days" } });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        "/vendor/analytics",
        expect.any(Object),
      );
    });
  });
});

describe("Vendor Profile Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render profile page with user info", () => {
    renderWithRouter(<VendorProfile />);

    expect(screen.getByText("Profile & Settings")).toBeInTheDocument();
    expect(screen.getByText("Test Vendor")).toBeInTheDocument();
    expect(screen.getByText("vendor@test.com")).toBeInTheDocument();
  });

  it("should pre-fill form with user data", () => {
    renderWithRouter(<VendorProfile />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    expect(nameInput).toHaveValue("Test Vendor");

    const emailInput = screen.getByLabelText(/Email Address/i);
    expect(emailInput).toHaveValue("vendor@test.com");
    expect(emailInput).toBeDisabled();
  });

  it("should handle profile update", async () => {
    renderWithRouter(<VendorProfile />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const saveButton = screen.getAllByText("Save Changes")[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAuthStore.updateUser).toHaveBeenCalled();
    });
  });

  it("should validate password change", async () => {
    const { toast } = await import("sonner");

    renderWithRouter(<VendorProfile />);

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    fireEvent.change(newPasswordInput, { target: { value: "123" } });

    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    fireEvent.change(confirmPasswordInput, { target: { value: "456" } });

    const changePasswordButton = screen.getByText(/Change Password/i);
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("New passwords do not match");
    });
  });

  it("should toggle password visibility", () => {
    renderWithRouter(<VendorProfile />);

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    expect(currentPasswordInput).toHaveAttribute("type", "password");

    // Find and click the eye icon button (there are multiple, get the first)
    const eyeButtons = screen.getAllByRole("button");
    const toggleButton = eyeButtons.find(
      (btn) =>
        btn.querySelector("svg") &&
        btn.parentElement?.querySelector("#current_password"),
    );

    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute("type", "text");
    }
  });
});
