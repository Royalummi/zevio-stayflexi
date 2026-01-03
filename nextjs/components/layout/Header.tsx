"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiMenu, FiX, FiUser, FiLogOut, FiHome } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = useMemo(
    () => [
      { href: "/properties", label: "Properties" },
      { href: "#destinations", label: "Destinations" },
      { href: "#why-zevio", label: "Why Zevio" },
      { href: "#support", label: "Support" },
    ],
    []
  );

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <Link href="/" className="logo">
            Zevio
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-link"
                scroll={item.href.startsWith("#")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="header-actions">
            {isAuthenticated && user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="user-menu-button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background:
                      "linear-gradient(135deg, #9333ea 0%, #6366f1 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(147, 51, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FiUser size={18} />
                  <span>{user.full_name}</span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      style={{
                        position: "fixed",
                        inset: "0",
                        zIndex: "998",
                      }}
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: "0",
                        background: "white",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                        minWidth: "220px",
                        zIndex: "999",
                        overflow: "hidden",
                        border: "1px solid var(--gray-200)",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid var(--gray-200)",
                          background:
                            "linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "4px",
                          }}
                        >
                          {user.full_name}
                        </p>
                        <p style={{ fontSize: "13px", color: "#6b7280" }}>
                          {user.email}
                        </p>
                      </div>

                      <div style={{ padding: "8px" }}>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            color: "#374151",
                            textDecoration: "none",
                            borderRadius: "8px",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f3f4f6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <FiHome size={18} />
                          <span>My Dashboard</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            color: "#dc2626",
                            background: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fef2f2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <FiLogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="nav-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  <FiUser size={20} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="btn btn-primary"
                  style={{
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            style={{
              padding: "8px",
              borderRadius: "8px",
              transition: "all 0.2s",
              background: mobileMenuOpen ? "var(--gray-100)" : "transparent",
            }}
            className="md-hidden"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{ display: "block" }} className="md-hidden">
          <div
            style={{
              position: "fixed",
              inset: "0",
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: "-1",
            }}
            onClick={closeMobileMenu}
          />
          <div
            style={{
              background: "white",
              borderTop: "1px solid var(--gray-200)",
              padding: "16px",
            }}
          >
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  scroll={item.href.startsWith("#")}
                  className="nav-link"
                  onClick={closeMobileMenu}
                  style={{ padding: "8px 12px" }}
                >
                  {item.label}
                </Link>
              ))}
              <hr
                style={{
                  margin: "8px 0",
                  border: "none",
                  borderTop: "1px solid var(--gray-200)",
                }}
              />

              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="nav-link"
                    onClick={closeMobileMenu}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#9333ea",
                      fontWeight: "600",
                    }}
                  >
                    <FiUser size={18} />
                    <span>{user.full_name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#dc2626",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      textAlign: "left",
                    }}
                  >
                    <FiLogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      closeMobileMenu();
                    }}
                    className="nav-link"
                    style={{
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "left",
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setShowSignup(true);
                      closeMobileMenu();
                    }}
                    className="btn btn-primary"
                    style={{
                      textAlign: "center",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Authentication Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </header>
  );
}
