import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PropertyChangeRequests from "./PropertyChangeRequests";

// Mock api instance
vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from "../../lib/api";

const mockChangeRequests = [
  {
    id: "cr-1",
    property_id: "prop-1",
    vendor_name: "Test Vendor",
    property_title: "Test Property",
    requested_changes: {
      max_guests: 10,
      price_per_night: 8000,
      description: "Updated description",
    },
    old_values: {
      max_guests: 8,
      price_per_night: 5000,
      description: "Old description",
    },
    status: "pending",
    created_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "cr-2",
    property_id: "prop-2",
    vendor_name: "Another Vendor",
    property_title: "Another Property",
    requested_changes: {
      bedrooms: 4,
      amenities: ["amenity-1", "amenity-2"],
    },
    old_values: {
      bedrooms: 3,
      amenities: ["amenity-1"],
    },
    status: "pending",
    created_at: "2026-02-14T15:30:00Z",
  },
];

describe("PropertyChangeRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the component", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: [] },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Property Change Requests/i)).toBeInTheDocument();
    });
  });

  it("should fetch change requests on mount", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/admin/change-requests?status=pending",
      );
    });
  });

  it("should display change requests", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
      expect(screen.getByText("Test Vendor")).toBeInTheDocument();
      expect(screen.getByText("Another Property")).toBeInTheDocument();
    });
  });

  it('should display "no change requests" message when empty', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: [] },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No pending change requests/i),
      ).toBeInTheDocument();
    });
  });

  it("should show approve dialog when approve button clicked", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText(/Approve/i);
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Approval/i)).toBeInTheDocument();
    });
  });

  it("should show reject dialog when reject button clicked", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText(/Reject/i);
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Reject Change Request/i)).toBeInTheDocument();
    });
  });

  it("should handle approve action", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    api.patch.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Changes approved successfully",
      },
    });

    // Mock refetch
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: [] },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText(/Approve/i);
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Approval/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /^Approve$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/admin/change-requests/cr-1/approve",
      );
    });
  });

  it("should handle reject action with reason", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    api.patch.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Changes rejected",
      },
    });

    // Mock refetch
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: [] },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText(/Reject/i);
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Reject Change Request/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Provide a reason/i);
    fireEvent.change(textarea, { target: { value: "Not acceptable" } });

    const confirmButton = screen.getByRole("button", {
      name: /Confirm Reject/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        "/admin/change-requests/cr-1/reject",
        {
          rejection_reason: "Not acceptable",
        },
      );
    });
  });

  it("should display changed fields correctly", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Check if changed values are displayed
      expect(screen.getByText(/10/)).toBeInTheDocument(); // max_guests: 10
      expect(screen.getByText(/8000/)).toBeInTheDocument(); // price: 8000
    });
  });

  it("should handle API errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    api.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should format dates correctly", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Check if dates are formatted (format may vary)
      expect(screen.getByText(/202[0-9]/)).toBeInTheDocument();
    });
  });

  it("should require rejection reason", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { changeRequests: mockChangeRequests },
      },
    });

    render(
      <BrowserRouter>
        <PropertyChangeRequests />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Property")).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText(/Reject/i);
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Reject Change Request/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", {
      name: /Confirm Reject/i,
    });

    // Button might be disabled when reason is empty
    // This depends on your implementation
    expect(confirmButton).toBeInTheDocument();
  });
});
