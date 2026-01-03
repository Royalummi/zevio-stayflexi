"use client";

import { useState } from "react";
import { FiX, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import Button from "@/components/ui/Button";
import { validateEmail } from "@/lib/utils";
import "./auth-modals.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToSignup,
}: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      onClose();
      // Clear form
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="auth-modal-overlay" onClick={handleOverlayClick}>
        <div className="auth-modal">
          {/* Close Button */}
          <button className="auth-modal-close" onClick={onClose}>
            <FiX />
          </button>

          {/* Header */}
          <div className="auth-modal-header">
            <h2 className="auth-modal-title">Welcome Back</h2>
            <p className="auth-modal-subtitle">
              Sign in to book your dream villa
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-modal-form">
            {/* Error Message */}
            {error && <div className="auth-error-message">{error}</div>}

            {/* Email Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiMail />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="auth-form-input"
                required
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiLock />
                Password
              </label>
              <div className="auth-password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="auth-form-input"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="auth-forgot-password">
              <button type="button" className="auth-link-btn">
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Sign In
            </Button>

            {/* Divider */}
            <div className="auth-divider">
              <span>Or</span>
            </div>

            {/* Switch to Signup */}
            <div className="auth-switch">
              <span>Don&apos;t have an account?</span>
              <button
                type="button"
                className="auth-switch-btn"
                onClick={onSwitchToSignup}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
