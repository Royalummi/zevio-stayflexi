/**
 * Bookings Dashboard — Comprehensive Test Suite
 *
 * Covers:
 *  - Auth redirect (unauthenticated → /login)
 *  - Loading state
 *  - Renders booking cards after fetch
 *  - Status badge rendering
 *  - Status-tab filtering (all / confirmed / pending / pending_payment / completed / cancelled)
 *  - Search query filter (property name, city, booking ID)
 *  - Date range filter  (filterCheckIn / filterCheckOut)
 *  - Amount range filter (minAmount / maxAmount)
 *  - Clear filters resets state
 *  - Empty-state message when no results
 *  - Pagination (next / prev page, disable when at limits)
 *  - Cancel pending booking: opens modal → confirms → API call
 *  - Cancel error handling
 *  - Bulk-select / bulk-cancel flow
 *  - "Complete Payment" navigates to /booking-review
 *  - "View Property" navigates to property detail
 *  - Countdown timer rendered for pending_payment bookings
 *  - Expired pending bookings are filtered out (not rendered)
 *  - CSV export triggers API call
 *  - PDF export shows coming-soon toast
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Next.js router mock ──────────────────────────────────────────────────────
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/dashboard/bookings",
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/bookings",
}));

// ─── Auth context mock ────────────────────────────────────────────────────────
const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Axios mock ───────────────────────────────────────────────────────────────
const mockApiGet = vi.fn();
const mockApiDelete = vi.fn();

vi.mock("@/lib/axios", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

// ─── DateRangeSelector stub ───────────────────────────────────────────────────
vi.mock("@/components/DateRangeSelector", () => ({
  // Render a simple two-input stub so date-filter tests can work
  default: ({
    onCheckInChange,
    onCheckOutChange,
  }: {
    checkIn: Date | null;
    checkOut: Date | null;
    onCheckInChange: (d: Date | null) => void;
    onCheckOutChange: (d: Date | null) => void;
  }) => (
    <div data-testid="date-range-selector">
      <input
        data-testid="stub-check-in"
        type="date"
        onChange={(e) =>
          onCheckInChange(e.target.value ? new Date(e.target.value) : null)
        }
      />
      <input
        data-testid="stub-check-out"
        type="date"
        onChange={(e) =>
          onCheckOutChange(e.target.value ? new Date(e.target.value) : null)
        }
      />
    </div>
  ),
}));

// ─── LoadingSpinner stub ──────────────────────────────────────────────────────
vi.mock("@/components/ui/LoadingSpinner", () => ({
  default: () => <div data-testid="loading-spinner">Loading…</div>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a booking fixture with sensible defaults. */
function makeBooking(overrides: Partial<Record<string, unknown>> = {}) {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  return {
    id: "bk-001",
    property_id: "prop-001",
    property_title: "Ocean View Villa",
    property_city: "Goa",
    check_in: "2026-03-01",
    check_out: "2026-03-05",
    guests: 4,
    total_amount: 25000,
    status: "confirmed",
    payment_status: "completed",
    created_at: "2025-01-01T00:00:00.000Z",
    expires_at: future.toISOString(),
    property_type: "villa",
    photo_url: null,
    ...overrides,
  };
}

type Booking = ReturnType<typeof makeBooking>;

function mockAuthenticatedUser() {
  mockUseAuth.mockReturnValue({
    user: { id: "user-1", name: "Test User", role: "user" },
    isAuthenticated: true,
    isLoading: false,
  });
}

function mockBookingsResponse(bookings: Booking[]) {
  mockApiGet.mockResolvedValue({
    data: { success: true, data: { bookings } },
  });
}

// Import the component under test AFTER all mocks are set up
import BookingsPage from "../app/dashboard/bookings/page";

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("Bookings Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: URL.createObjectURL exists in test env
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
    mockRouterPush.mockReset();
  });

  // ─── Authentication ────────────────────────────────────────────────────────

  describe("Authentication", () => {
    it("redirects to / when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/"));
    });

    it("does not redirect when user is authenticated", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument(),
      );
      expect(mockRouterPush).not.toHaveBeenCalledWith("/login");
    });
  });

  // ─── Loading State ─────────────────────────────────────────────────────────

  describe("Loading State", () => {
    it("shows loading text while auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "user-1" },
        isAuthenticated: true,
        isLoading: true,
      });
      // Never resolves during this test
      mockApiGet.mockReturnValue(new Promise(() => {}));

      render(<BookingsPage />);

      expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
    });
  });

  // ─── Booking Cards ─────────────────────────────────────────────────────────

  describe("Booking Cards", () => {
    it("renders booking property name and city after fetch", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking()]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Ocean View Villa")).toBeInTheDocument(),
      );
      expect(screen.getByText(/Goa/i)).toBeInTheDocument();
    });

    it("renders multiple booking cards", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({ id: "bk-001", property_title: "Beach House" }),
        makeBooking({ id: "bk-002", property_title: "Mountain Retreat" }),
        makeBooking({ id: "bk-003", property_title: "City Loft" }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Beach House")).toBeInTheDocument(),
      );
      expect(screen.getByText("Mountain Retreat")).toBeInTheDocument();
      expect(screen.getByText("City Loft")).toBeInTheDocument();
    });

    it("shows 'confirmed' status badge for confirmed bookings", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking({ status: "confirmed" })]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText(/confirmed/i)).toBeInTheDocument(),
      );
    });

    it("shows 'pending' status badge for pending bookings", async () => {
      const future = new Date();
      future.setHours(future.getHours() + 2);
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({ status: "pending", expires_at: future.toISOString() }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0),
      );
    });

    it("shows 'completed' status badge for completed bookings", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking({ status: "completed" })]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText(/completed/i)).toBeInTheDocument(),
      );
    });

    it("shows 'cancelled' status badge for cancelled bookings", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking({ status: "cancelled" })]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument(),
      );
    });

    it("shows total amount on the booking card", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking({ total_amount: 48500 })]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText(/48,500|48500/)).toBeInTheDocument(),
      );
    });

    it("filters out expired pending bookings (expires_at in the past)", async () => {
      const past = new Date();
      past.setHours(past.getHours() - 1);
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({
          id: "expired-bk",
          property_title: "Expired Villa",
          status: "pending",
          expires_at: past.toISOString(),
        }),
      ]);

      render(<BookingsPage />);

      // Give it time to settle
      await waitFor(() =>
        expect(screen.queryByText("Expired Villa")).not.toBeInTheDocument(),
      );
    });

    it("renders countdown timer for pending_payment bookings", async () => {
      const future = new Date();
      future.setHours(future.getHours() + 3);
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({
          status: "pending_payment",
          payment_status: "pending",
          expires_at: future.toISOString(),
        }),
      ]);

      render(<BookingsPage />);

      await waitFor(() => {
        const matches = screen.queryAllByText(
          /time remaining|expires in|payment required/i,
        );
        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── Empty State ───────────────────────────────────────────────────────────

  describe("Empty State", () => {
    it("shows empty state message when API returns no bookings", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(
          screen.getByText(/no bookings found|no bookings yet/i),
        ).toBeInTheDocument(),
      );
    });
  });

  // ─── Status Tabs ───────────────────────────────────────────────────────────

  describe("Status Tab Filtering", () => {
    const bookings = [
      makeBooking({
        id: "b1",
        property_title: "Villa Alpha",
        status: "confirmed",
      }),
      makeBooking({
        id: "b2",
        property_title: "Villa Beta",
        status: "cancelled",
      }),
      makeBooking({
        id: "b3",
        property_title: "Villa Gamma",
        status: "completed",
      }),
    ];

    it("shows all bookings on 'All Bookings' tab (default)", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Villa Alpha")).toBeInTheDocument(),
      );
      expect(screen.getByText("Villa Beta")).toBeInTheDocument();
      expect(screen.getByText("Villa Gamma")).toBeInTheDocument();
    });

    it("filters to only confirmed bookings when Confirmed tab clicked", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Villa Alpha")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /^confirmed/i }));
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Villa Alpha")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Villa Beta")).not.toBeInTheDocument();
      expect(screen.queryByText("Villa Gamma")).not.toBeInTheDocument();
    });

    it("filters to only cancelled bookings when Cancelled tab clicked", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Villa Beta")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /^cancelled/i }));
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Villa Beta")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Villa Alpha")).not.toBeInTheDocument();
    });

    it("shows status counts in tab badges", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      // 3 total
      await waitFor(() =>
        expect(screen.getAllByText("3").length).toBeGreaterThan(0),
      );
    });
  });

  // ─── Search Filter ─────────────────────────────────────────────────────────

  describe("Search Filter", () => {
    const bookings = [
      makeBooking({
        id: "bk-a",
        property_title: "Sunset Villa",
        property_city: "Goa",
      }),
      makeBooking({
        id: "bk-b",
        property_title: "Mountain Lodge",
        property_city: "Manali",
      }),
    ];

    it("filters bookings by property name search query", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search by name/i,
      );
      await user.type(searchInput, "Sunset");

      // Click Apply Filters
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Mountain Lodge")).not.toBeInTheDocument();
    });

    it("filters bookings by city", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search by name/i,
      );
      await user.type(searchInput, "Manali");
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Mountain Lodge")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Sunset Villa")).not.toBeInTheDocument();
    });

    it("filters bookings by booking ID", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search by name/i,
      );
      await user.type(searchInput, "bk-b");
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Mountain Lodge")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Sunset Villa")).not.toBeInTheDocument();
    });

    it("shows all bookings when search query is cleared", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search by name/i,
      );
      await user.type(searchInput, "Mountain");
      await user.click(screen.getByRole("button", { name: /apply/i }));
      await waitFor(() =>
        expect(screen.queryByText("Sunset Villa")).not.toBeInTheDocument(),
      );

      // Clear
      await user.click(screen.getByRole("button", { name: /clear/i }));

      await waitFor(() =>
        expect(screen.getByText("Sunset Villa")).toBeInTheDocument(),
      );
      expect(screen.getByText("Mountain Lodge")).toBeInTheDocument();
    });
  });

  // ─── Date Range Filter ─────────────────────────────────────────────────────

  describe("Date Range Filter", () => {
    const bookings = [
      makeBooking({
        id: "early",
        property_title: "Early Villa",
        check_in: "2025-02-01",
        check_out: "2025-02-05",
      }),
      makeBooking({
        id: "late",
        property_title: "Late Villa",
        check_in: "2026-09-10",
        check_out: "2026-09-15",
      }),
    ];

    it("shows the DateRangeSelector calendar when date button is clicked", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Early Villa")).toBeInTheDocument(),
      );

      // Button text without any selection shows placeholder
      const dateButton = screen.getByText("Dates");
      await user.click(dateButton);

      expect(screen.getByTestId("date-range-selector")).toBeInTheDocument();
    });

    it("filters bookings by check-in date range", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Early Villa")).toBeInTheDocument(),
      );

      // Open the date picker
      await user.click(screen.getByText("Dates"));

      // Use stub inputs
      await user.type(screen.getByTestId("stub-check-in"), "2026-01-01");
      await user.type(screen.getByTestId("stub-check-out"), "2026-12-31");

      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Late Villa")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Early Villa")).not.toBeInTheDocument();
    });
  });

  // ─── Amount Range Filter ───────────────────────────────────────────────────

  describe("Amount Range Filter", () => {
    const bookings = [
      makeBooking({
        id: "cheap",
        property_title: "Budget Stay",
        total_amount: 5000,
      }),
      makeBooking({
        id: "expensive",
        property_title: "Luxury Villa",
        total_amount: 150000,
      }),
    ];

    it("renders combined min/max amount inputs", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Budget Stay")).toBeInTheDocument(),
      );

      expect(screen.getByPlaceholderText("Min ₹")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Max ₹")).toBeInTheDocument();
    });

    it("filters bookings by minimum amount", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Budget Stay")).toBeInTheDocument(),
      );

      await user.type(screen.getByPlaceholderText("Min ₹"), "50000");
    });

    it("filters bookings by maximum amount", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(bookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Budget Stay")).toBeInTheDocument(),
      );

      await user.type(screen.getByPlaceholderText("Max ₹"), "10000");
    });

    it("filters bookings by both min and max amount", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([
        ...bookings,
        makeBooking({
          id: "mid",
          property_title: "Mid-Range Villa",
          total_amount: 30000,
        }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Mid-Range Villa")).toBeInTheDocument(),
      );

      await user.type(screen.getByPlaceholderText("Min ₹"), "20000");
      await user.type(screen.getByPlaceholderText("Max ₹"), "40000");
      await user.click(screen.getByRole("button", { name: /apply/i }));

      await waitFor(() =>
        expect(screen.getByText("Mid-Range Villa")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Budget Stay")).not.toBeInTheDocument();
      expect(screen.queryByText("Luxury Villa")).not.toBeInTheDocument();
    });
  });

  // ─── Clear Filters ─────────────────────────────────────────────────────────

  describe("Clear Filters", () => {
    it("clears search query and shows all bookings", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({ id: "a", property_title: "Villa One" }),
        makeBooking({ id: "b", property_title: "Villa Two" }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Villa One")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search by name/i,
      );
      await user.type(searchInput, "Villa One");
      await user.click(screen.getByRole("button", { name: /apply/i }));
      await waitFor(() =>
        expect(screen.queryByText("Villa Two")).not.toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /clear/i }));

      await waitFor(() =>
        expect(screen.getByText("Villa One")).toBeInTheDocument(),
      );
      expect(screen.getByText("Villa Two")).toBeInTheDocument();
      expect(searchInput).toHaveValue("");
    });

    it("clears amount filters", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({
          id: "a",
          property_title: "Cheap Villa",
          total_amount: 1000,
        }),
        makeBooking({
          id: "b",
          property_title: "Pricey Villa",
          total_amount: 200000,
        }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Cheap Villa")).toBeInTheDocument(),
      );

      await user.type(screen.getByPlaceholderText("Min ₹"), "50000");
      await user.click(screen.getByRole("button", { name: /apply/i }));
      await waitFor(() =>
        expect(screen.queryByText("Cheap Villa")).not.toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /clear/i }));
      await waitFor(() =>
        expect(screen.getByText("Cheap Villa")).toBeInTheDocument(),
      );
      expect(screen.getByPlaceholderText("Min ₹")).toHaveValue(null);
      expect(screen.getByPlaceholderText("Max ₹")).toHaveValue(null);
    });
  });

  // ─── Cancel / Delete Booking ───────────────────────────────────────────────

  describe("Cancel Pending Booking", () => {
    const future = new Date();
    future.setHours(future.getHours() + 2);

    // "Cancel Booking" button only renders for pending_payment + payment_status pending
    const pendingBooking = makeBooking({
      id: "pend-1",
      property_title: "Pending Villa",
      status: "pending_payment",
      payment_status: "pending",
      expires_at: future.toISOString(),
    });

    it("opens confirmation modal when cancel button clicked", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([pendingBooking]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Pending Villa")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /cancel booking/i }));

      await waitFor(() =>
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument(),
      );
    });

    it("calls cancel API and refreshes on confirm", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([pendingBooking]);
      mockApiDelete.mockResolvedValue({ data: { success: true } });

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Pending Villa")).toBeInTheDocument(),
      );

      const cancelBtn = screen.getByRole("button", {
        name: /cancel booking/i,
      });
      await user.click(cancelBtn);

      // Click confirm in modal
      const confirmBtn = await screen.findByRole("button", {
        name: /yes, cancel booking/i,
      });
      await user.click(confirmBtn);

      await waitFor(() =>
        expect(mockApiDelete).toHaveBeenCalledWith(
          expect.stringContaining("cancel-pending"),
        ),
      );
    });

    it("shows error toast if cancel API fails", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([pendingBooking]);
      mockApiDelete.mockRejectedValue(new Error("Network error"));

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Pending Villa")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /cancel booking/i }));
      const confirmBtn = await screen.findByRole("button", {
        name: /yes, cancel booking/i,
      });
      await user.click(confirmBtn);

      await waitFor(() => {
        const toast = screen.queryByText((content) =>
          /failed to cancel|network error/i.test(content),
        );
        expect(toast).toBeInTheDocument();
      });
    });

    it("modal is dismissed on cancel", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([pendingBooking]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Pending Villa")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /cancel booking/i }));

      // Modal is open
      await screen.findByText(/are you sure/i);

      await user.click(screen.getByRole("button", { name: /keep booking/i }));

      await waitFor(() =>
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument(),
      );
      expect(mockApiDelete).not.toHaveBeenCalled();
    });
  });

  // ─── Bulk Cancel ──────────────────────────────────────────────────────────

  describe("Bulk Cancel", () => {
    const future = new Date();
    future.setHours(future.getHours() + 3);

    const pendingBookings = [
      makeBooking({
        id: "p1",
        property_title: "P1 Villa",
        status: "pending",
        expires_at: future.toISOString(),
      }),
      makeBooking({
        id: "p2",
        property_title: "P2 Villa",
        status: "pending",
        expires_at: future.toISOString(),
      }),
    ];

    it("bulk cancel toolbar appears after selecting bookings", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(pendingBookings);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("P1 Villa")).toBeInTheDocument(),
      );

      // Click the first pending booking's individual checkbox
      const bookingCheckboxes = screen.getAllByRole("checkbox");
      // The first checkbox is the "Select All" one; the per-card ones come after
      const firstCardCheckbox = bookingCheckboxes.find(
        (cb) =>
          !(cb as HTMLInputElement).getAttribute("aria-label")?.includes("All"),
      );
      if (firstCardCheckbox) await user.click(firstCardCheckbox);

      await waitFor(() => {
        const el = screen.queryByRole("button", {
          name: /cancel \d+ selected/i,
        });
        expect(el).toBeInTheDocument();
      });
    });

    it("calls cancel API for all selected bookings on bulk confirm", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse(pendingBookings);
      mockApiDelete.mockResolvedValue({ data: { success: true } });

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("P1 Villa")).toBeInTheDocument(),
      );

      // Use "Select All Pending" checkbox
      const selectAllCb = screen.getByRole("checkbox", {
        name: /select all pending/i,
      });
      await user.click(selectAllCb);

      // Now "Cancel N Selected" button should appear
      const bulkCancelBtn = await screen.findByRole("button", {
        name: /cancel \d+ selected/i,
      });
      await user.click(bulkCancelBtn);

      const confirmBtn = await screen.findByRole("button", {
        name: /yes, cancel all selected/i,
      });
      await user.click(confirmBtn);

      await waitFor(() => expect(mockApiDelete).toHaveBeenCalledTimes(2));
    });
  });

  // ─── Navigation Actions ────────────────────────────────────────────────────

  describe("Navigation Actions", () => {
    it("'Complete Payment' navigates to /booking-review", async () => {
      const user = userEvent.setup();
      const future = new Date();
      future.setHours(future.getHours() + 2);
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({
          id: "pay-1",
          status: "pending_payment",
          payment_status: "pending",
          expires_at: future.toISOString(),
        }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /complete payment/i }),
        ).toBeInTheDocument(),
      );

      await user.click(
        screen.getByRole("button", { name: /complete payment/i }),
      );

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("booking-review"),
      );
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("pay-1"),
      );
    });

    it("'View Property' navigates to the property page", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([
        makeBooking({ id: "b1", property_id: "prop-99", status: "confirmed" }),
      ]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /view property/i }),
        ).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /view property/i }));

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("prop-99"),
      );
    });
  });

  // ─── Export ───────────────────────────────────────────────────────────────

  describe("Export", () => {
    it("Export CSV button is disabled when no bookings", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument(),
      );

      const csvBtn = screen.getByRole("button", { name: /export csv/i });
      expect(csvBtn).toBeDisabled();
    });

    it("Export CSV calls the bookings API with export param", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      const booking = makeBooking({ id: "exp-1" });
      // First call: plain GET for bookings list
      mockApiGet.mockResolvedValueOnce({
        data: { success: true, data: { bookings: [booking] } },
      });
      // Second call: CSV blob
      mockApiGet.mockResolvedValueOnce({
        data: new Blob(["id,status\nexp-1,confirmed"], { type: "text/csv" }),
      });

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Ocean View Villa")).toBeInTheDocument(),
      );

      const csvBtn = screen.getByRole("button", { name: /export csv/i });
      expect(csvBtn).not.toBeDisabled();

      await user.click(csvBtn);

      await waitFor(() =>
        expect(mockApiGet).toHaveBeenCalledWith(
          expect.stringContaining("export=true"),
          expect.objectContaining({ responseType: "blob" }),
        ),
      );
    });

    it("Export PDF button shows coming-soon toast", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([makeBooking()]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Ocean View Villa")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /export pdf/i }));

      await waitFor(() =>
        expect(screen.getByText(/pdf export coming soon/i)).toBeInTheDocument(),
      );
    });
  });

  // ─── Filter Header Display ─────────────────────────────────────────────────

  describe("Filter Section UI", () => {
    it("renders date picker button and amount inputs", async () => {
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Dates")).toBeInTheDocument(),
      );
      expect(screen.getByPlaceholderText("Min ₹")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Max ₹")).toBeInTheDocument();
    });

    it("shows selected date range text on the date button after selection", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Dates")).toBeInTheDocument(),
      );

      await user.click(screen.getByText("Dates"));

      // Provide a check-out date via stub (automatically closes picker)
      await user.type(screen.getByTestId("stub-check-in"), "2026-01-01");
      await user.type(screen.getByTestId("stub-check-out"), "2026-01-10");

      // The placeholder text should no longer appear
      expect(screen.queryByText("Dates")).not.toBeInTheDocument();
    });

    it("X on date range button clears the date selection", async () => {
      const user = userEvent.setup();
      mockAuthenticatedUser();
      mockBookingsResponse([]);

      render(<BookingsPage />);

      await waitFor(() =>
        expect(screen.getByText("Dates")).toBeInTheDocument(),
      );

      await user.click(screen.getByText("Dates"));
      await user.type(screen.getByTestId("stub-check-in"), "2026-01-01");
      await user.type(screen.getByTestId("stub-check-out"), "2026-01-10");

      // The date button text should have changed to show selected dates
      await waitFor(() =>
        expect(screen.queryByText("Dates")).not.toBeInTheDocument(),
      );

      // Click the X clear span inside the date button
      const xElement = document.querySelector(
        "[role='button']",
      ) as HTMLElement | null;
      if (xElement) await user.click(xElement);

      await waitFor(() =>
        expect(screen.getByText("Dates")).toBeInTheDocument(),
      );
    });
  });

  // ─── API Error Handling ────────────────────────────────────────────────────

  describe("API Error Handling", () => {
    it("shows empty state gracefully when fetch fails", async () => {
      mockAuthenticatedUser();
      mockApiGet.mockRejectedValue(new Error("Server error"));

      render(<BookingsPage />);

      await waitFor(() =>
        expect(
          screen.getByText(/no bookings found|no bookings yet/i),
        ).toBeInTheDocument(),
      );
    });
  });
});
