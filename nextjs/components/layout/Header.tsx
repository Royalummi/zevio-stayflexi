"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiMenu, FiX, FiUser, FiLogOut, FiHome } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import "./Header.css";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = useMemo(
    () => [
      { href: "/properties", label: "Properties" },
      { href: "/destinations", label: "Destinations" },
      { href: "/why-zevio", label: "Why Zevio" },
      { href: "/support", label: "Support" },
      { href: "/about", label: "About Us" },
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
              <div className="user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="user-menu-button"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <FiUser size={18} />
                  <span>{user.full_name}</span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="user-menu-overlay"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="user-menu-dropdown">
                      <div className="user-menu-header">
                        <p className="user-menu-name">{user.full_name}</p>
                        <p className="user-menu-email">{user.email}</p>
                      </div>

                      <div className="user-menu-body">
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="user-menu-link"
                        >
                          <FiHome size={18} />
                          <span>My Dashboard</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="user-menu-logout"
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
                  className="sign-in-button"
                  aria-label="Sign in"
                >
                  <FiUser size={20} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="sign-up-button"
                  aria-label="Sign up"
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
            className={`mobile-menu-button ${mobileMenuOpen ? "active" : ""}`}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              <nav className="mobile-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    scroll={item.href.startsWith("#")}
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}

                <hr className="mobile-divider" />

                {isAuthenticated && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="mobile-user-link"
                      onClick={closeMobileMenu}
                    >
                      <FiUser size={18} />
                      <span>{user.full_name}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="mobile-logout-button"
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
                      className="mobile-sign-in-button"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowSignup(true);
                        closeMobileMenu();
                      }}
                      className="mobile-sign-up-button"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </>
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
