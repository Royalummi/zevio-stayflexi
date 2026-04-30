import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import api from "../lib/api";

// Mock the API module
vi.mock("../lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form correctly", () => {
    renderLogin();

    expect(screen.getByText("Welcome to Zevio")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    renderLogin();

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "12345");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters"),
      ).toBeInTheDocument();
    });
  });

  it("successfully logs in admin user", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        data: {
          user: {
            id: "1",
            email: "admin@zevio.com",
            name: "Admin User",
            role: "admin",
          },
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        },
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "admin@zevio.com");
    await user.type(passwordInput, "admin123");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "accessToken",
        "mock-access-token",
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "refreshToken",
        "mock-refresh-token",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
    });
  });

  it("successfully logs in vendor user", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        data: {
          user: {
            id: "2",
            email: "vendor@zevio.com",
            name: "Vendor User",
            role: "vendor",
          },
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        },
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "vendor@zevio.com");
    await user.type(passwordInput, "vendor123");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "accessToken",
        "mock-access-token",
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "refreshToken",
        "mock-refresh-token",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/vendor/dashboard", {
        replace: true,
      });
    });
  });

  it("handles login error correctly", async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          message: "Invalid email or password",
        },
      },
    };

    api.post.mockRejectedValueOnce(mockError);
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "wrong@example.com");
    await user.type(passwordInput, "wrongpassword");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).not.toBeDisabled();
    });
  });

  it("disables submit button during loading", async () => {
    const user = userEvent.setup();

    // Make API call hang
    api.post.mockImplementation(() => new Promise(() => {}));
    renderLogin();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    await user.type(emailInput, "admin@zevio.com");
    await user.type(passwordInput, "admin123");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /signing in/i }),
      ).toBeDisabled();
    });
  });
});
