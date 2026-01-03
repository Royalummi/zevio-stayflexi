"use client";

import { useState } from "react";
import {
  FiX,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiPhone,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import ModalPortal from "@/components/ui/ModalPortal";
import Button from "@/components/ui/Button";
import { validateEmail, validatePhone, validatePassword } from "@/lib/utils";
import "./auth-modals.css";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignupModalProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    // Email validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Phone validation
    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      onClose();
      // Clear form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Registration failed. Please try again.");
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
            <h2 className="auth-modal-title">Create Account</h2>
            <p className="auth-modal-subtitle">
              Join Zevio and book amazing villas
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-modal-form">
            {/* Error Message */}
            {error && <div className="auth-error-message">{error}</div>}

            {/* Full Name Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiUser />
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="auth-form-input"
                required
                autoFocus
              />
            </div>

            {/* Email Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiMail />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="auth-form-input"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiPhone />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="auth-form-input"
                maxLength={10}
                required
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
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
              <p className="auth-input-hint">Minimum 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <FiLock />
                Confirm Password
              </label>
              <div className="auth-password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="auth-form-input"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </Button>

            {/* Terms */}
            <p className="auth-terms">
              By signing up, you agree to our{" "}
              <a href="/terms" className="auth-link">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="auth-link">
                Privacy Policy
              </a>
            </p>

            {/* Divider */}
            <div className="auth-divider">
              <span>Or</span>
            </div>

            {/* Switch to Login */}
            <div className="auth-switch">
              <span>Already have an account?</span>
              <button
                type="button"
                className="auth-switch-btn"
                onClick={onSwitchToLogin}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
