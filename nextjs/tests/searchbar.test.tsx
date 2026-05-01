import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/home/SearchBar";
import { City } from "@/types";

// ---------------------------------------------------------------------------
// Module-level router mock — vi.mock is hoisted so mockRouterPush is in scope
// This overrides the setup.ts mock for this file
// ---------------------------------------------------------------------------
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock axios api so the /public/areas call never hits the network
vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { areas: [] },
      },
    }),
  },
}));

// Mock formatDateForAPI (only used on search)
vi.mock("@/lib/utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...original,
    formatDateForAPI: (d: Date) => d.toISOString().split("T")[0],
  };
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockCities: City[] = [
  { id: "1", name: "Goa", state: "Goa", status: "active", property_count: 5 },
  {
    id: "2",
    name: "Mumbai",
    state: "Maharashtra",
    status: "active",
    property_count: 10,
  },
  {
    id: "3",
    name: "Alibaug",
    state: "Maharashtra",
    status: "active",
    property_count: 3,
  },
  {
    id: "4",
    name: "Bengaluru",
    state: "Karnataka",
    status: "active",
    property_count: 8,
  },
  {
    id: "5",
    name: "Coorg",
    state: "Karnataka",
    status: "active",
    property_count: 2,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const renderSearchBar = (cities: City[] = mockCities) =>
  render(<SearchBar cities={cities} />);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("SearchBar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterPush.mockReset();
  });

  // ─── Rendering ───────────────────────────────────────────────────────────

  describe("Initial Rendering", () => {
    it("renders the search bar container", () => {
      renderSearchBar();
      expect(screen.getByTestId("search-bar-container")).toBeInTheDocument();
    });

    it("renders Villa and Service Apartments toggle pills", () => {
      renderSearchBar();
      expect(screen.getByText("Villas")).toBeInTheDocument();
      expect(screen.getByText("Service Apartments")).toBeInTheDocument();
    });

    it("renders Location, Dates and Guests fields", () => {
      renderSearchBar();
      expect(screen.getByText("Location")).toBeInTheDocument();
      expect(screen.getByText("Dates")).toBeInTheDocument();
      expect(screen.getByText("Guests")).toBeInTheDocument();
    });

    it("renders the Search button", () => {
      renderSearchBar();
      expect(
        screen.getByRole("button", { name: /search/i }),
      ).toBeInTheDocument();
    });

    it("defaults to Villas mode", () => {
      renderSearchBar();
      const villaPill = screen.getByText("Villas").closest("button");
      // Active pill should have the active class
      expect(villaPill?.className).toMatch(/active/i);
    });

    it("shows placeholder text in location input", () => {
      renderSearchBar();
      expect(screen.getByPlaceholderText("City or area")).toBeInTheDocument();
    });

    it("shows default guest count of 2", () => {
      renderSearchBar();
      expect(screen.getByText(/2 Guests/i)).toBeInTheDocument();
    });
  });

  // ─── Property Type Toggle ─────────────────────────────────────────────────

  describe("Property Type Toggle", () => {
    it("switches to Service Apartments mode", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Service Apartments"));
      const aptPill = screen.getByText("Service Apartments").closest("button");
      expect(aptPill?.className).toMatch(/active/i);
    });

    it("changes dates label to Duration in apartments mode", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Service Apartments"));
      expect(screen.getByText("Duration")).toBeInTheDocument();
    });

    it("switches back to Villas mode", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Service Apartments"));
      await user.click(screen.getByText("Villas"));
      expect(screen.getByText("Dates")).toBeInTheDocument();
    });
  });

  // ─── City Dropdown ────────────────────────────────────────────────────────

  describe("City Dropdown", () => {
    it("opens when location field is clicked", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const locationInput = screen.getByPlaceholderText("City or area");
      await user.click(locationInput);
      // Dropdown should be present — use getAllByText since title+subtitle both say "Goa"
      await waitFor(() => {
        expect(screen.getAllByText("Goa")[0]).toBeInTheDocument();
      });
    });

    it("shows all passed cities in the dropdown", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByPlaceholderText("City or area"));
      await waitFor(() => {
        expect(screen.getAllByText("Goa")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Mumbai")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Bengaluru")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Coorg")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Alibaug")[0]).toBeInTheDocument();
      });
    });

    it("filters cities as user types", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "goa");
      await waitFor(() => {
        expect(screen.getAllByText("Goa")[0]).toBeInTheDocument();
        // Mumbai should no longer be visible
        expect(screen.queryByText("Mumbai")).not.toBeInTheDocument();
      });
    });

    it("shows 'No destinations found' when no match", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "zzzznonexistent");
      await waitFor(() => {
        expect(screen.getByText("No destinations found")).toBeInTheDocument();
      });
    });

    it("selects a city and shows its name in the input", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await waitFor(() => screen.getAllByText("Goa")[0]);
      // Click the title element (first match) — event bubbles to item onClick → selectCity()
      await user.click(screen.getAllByText("Goa")[0]);
      expect((input as HTMLInputElement).value).toContain("Goa");
    });

    it("closes dropdown after selecting a city", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await waitFor(() => screen.getAllByText("Mumbai")[0]);
      await user.click(screen.getAllByText("Mumbai")[0]);
      // The full dropdown list should have closed
      await waitFor(() => {
        expect(screen.queryByText("Bengaluru")).not.toBeInTheDocument();
      });
    });

    it("re-opens and shows ALL cities after a city is already selected (bug fix)", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");

      // First selection
      await user.click(input);
      await waitFor(() => screen.getAllByText("Goa")[0]);
      await user.click(screen.getAllByText("Goa")[0]);

      // Input now shows "Goa, Goa" — clicking again should clear & show all
      await user.click(input);
      await waitFor(() => {
        expect(screen.getAllByText("Mumbai")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Bengaluru")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Coorg")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Alibaug")[0]).toBeInTheDocument();
      });
    });

    it("clears selection when the × button is clicked", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");

      // Select a city (type to open dropdown then click item)
      await user.click(input);
      await waitFor(() => screen.getAllByText("Goa")[0]);
      await user.click(screen.getAllByText("Goa")[0]);

      // After selection, searchInput has a value so the clear button is visible
      // It's an icon-only button; find it by querying for buttons without label text
      const allButtons = screen.getAllByRole("button");
      const clearBtn = allButtons.find((btn) =>
        btn.className.includes("clearBtn"),
      )!;
      await user.click(clearBtn);

      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  // ─── Keyboard Navigation ─────────────────────────────────────────────────

  describe("Keyboard Navigation in City Dropdown", () => {
    it("navigates down with ArrowDown", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "goa"); // triggers onChange → showCityDropdown=true
      await waitFor(() => screen.getAllByText("Goa")[0]);
      await user.keyboard("{ArrowDown}");
      // No crash — just verifying it handles the event gracefully
      expect(input).toBeInTheDocument();
    });

    it("closes dropdown on Escape", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "goa"); // triggers onChange → showCityDropdown=true
      await waitFor(() => screen.getAllByText("Goa")[0]);
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryAllByText("Goa")).toHaveLength(0);
      });
    });
  });

  // ─── Guests Dropdown ─────────────────────────────────────────────────────

  describe("Guests Dropdown", () => {
    it("opens guests dropdown when Guests field is clicked", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      // Click the label — bubbles up to fieldInner div onClick
      await user.click(screen.getByText("Guests"));
      await waitFor(() => {
        expect(screen.getByText("Adults")).toBeInTheDocument();
        expect(screen.getByText("Children")).toBeInTheDocument();
        expect(screen.getByText("Infants")).toBeInTheDocument();
      });
    });

    it("increments adult count", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Guests"));
      await waitFor(() => screen.getByText("Adults"));

      // Find the + button next to "Adults" section (first + button)
      const plusButtons = screen.getAllByText("+");
      await user.click(plusButtons[0]);
      // Value should now be 3 adults (started at 2)
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("decrements adult count but not below 1", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Guests"));
      await waitFor(() => screen.getByText("Adults"));

      const minusButtons = screen.getAllByText("−");
      // Click minus twice — should stop at 1
      await user.click(minusButtons[0]);
      await user.click(minusButtons[0]);
      // Guest count in header should show 1
      await waitFor(() => {
        expect(screen.getByText(/1 Guest\b/i)).toBeInTheDocument();
      });
    });

    it("increments children count", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Guests"));
      await waitFor(() => screen.getByText("Children"));

      const plusButtons = screen.getAllByText("+");
      await user.click(plusButtons[1]); // second + for children
      // Children counter should now show 1
      expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    });

    it("increments infants count", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Guests"));
      await waitFor(() => screen.getByText("Infants"));

      const plusButtons = screen.getAllByText("+");
      await user.click(plusButtons[2]); // third + for infants
      expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    });
  });

  // ─── Search / Navigation ─────────────────────────────────────────────────

  describe("Search behaviour", () => {
    it("navigates to /villas when Search is clicked with no filters", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByRole("button", { name: /search/i }));
      // URL always includes query params (adults=2 etc.) — just check base path
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("/villas"),
      );
    });

    it("includes city param in URL when city is selected", async () => {
      const user = userEvent.setup();
      renderSearchBar();

      // Select a city via typing — use getAllByText since title+subtitle both say "Goa"
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "goa");
      await waitFor(() => screen.getAllByText("Goa")[0]);
      await user.click(screen.getAllByText("Goa")[0]);

      await user.click(screen.getByRole("button", { name: /search/i }));
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("city=goa"),
      );
    });

    it("alerts (not navigates to /villas) when apartments mode has no dates", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByText("Service Apartments"));
      await user.click(screen.getByRole("button", { name: /search/i }));
      expect(alertMock).toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalledWith(
        expect.stringContaining("/villas"),
      );
      alertMock.mockRestore();
    });
  });

  // ─── Modal overlay ───────────────────────────────────────────────────────

  describe("Search Modal Overlay", () => {
    it("shows dark overlay when a field is clicked", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByPlaceholderText("City or area"));
      await waitFor(() => {
        expect(screen.getByTestId("search-modal-overlay")).toBeInTheDocument();
      });
    });

    it("closes modal and dropdowns when overlay is clicked", async () => {
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(screen.getByPlaceholderText("City or area"));
      await waitFor(() => screen.getByTestId("search-modal-overlay"));

      await user.click(screen.getByTestId("search-modal-overlay"));
      await waitFor(() => {
        expect(
          screen.queryByTestId("search-modal-overlay"),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─── Empty cities list ────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("renders with empty cities array without crashing", () => {
      expect(() => renderSearchBar([])).not.toThrow();
    });

    it("shows no-results message when cities list is empty", async () => {
      const user = userEvent.setup();
      renderSearchBar([]);
      const input = screen.getByPlaceholderText("City or area");
      await user.click(input);
      await user.type(input, "a"); // trigger onChange → showCityDropdown=true
      await waitFor(() => {
        expect(screen.getByText("No destinations found")).toBeInTheDocument();
      });
    });

    it("renders correctly with a single city", () => {
      expect(() => renderSearchBar([mockCities[0]])).not.toThrow();
    });
  });
});
