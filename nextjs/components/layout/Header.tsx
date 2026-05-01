"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiHome,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModals } from "@/contexts/AuthModalContext";
import styles from "./Header.module.css";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { openLoginModal, openSignupModal } = useAuthModals();

  // Fix hydration mismatch by waiting for client mount
  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Auto-open login modal when redirected with ?login=true (e.g. after password reset)
  useEffect(() => {
    if (!isMounted || isLoading) return;
    if (!isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("login") === "true") {
        openLoginModal();
        // Clean the param from URL without triggering a navigation
        const url = new URL(window.location.href);
        url.searchParams.delete("login");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [isMounted, isLoading, isAuthenticated, openLoginModal]);

  const navItems = useMemo(
    () => [
      { href: "/villas", label: "Villas" },
      { href: "/service-apartments", label: "Service Apartments" },
      { href: "/corporate-offers", label: "Corporate" },
      { href: "/destinations", label: "Destinations" },
      { href: "/why-zevio", label: "Why Zevio" },
      { href: "/support", label: "Support" },
      { href: "/about", label: "About Us" },
    ],
    [],
  );

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowMobileProfileMenu(false);
  };

  const userAvatar =
    (user as unknown as { profile_picture?: string; avatar_url?: string })
      ?.profile_picture ||
    (user as unknown as { profile_picture?: string; avatar_url?: string })
      ?.avatar_url ||
    "";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerInner}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/brand/zevio-logo-color.png"
              alt="Zevio"
              width={220}
              height={52}
              priority
              className={styles.logoImage}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={styles.navLink}
                scroll={item.href.startsWith("#")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className={styles.headerActions} suppressHydrationWarning>
            {!isMounted || isLoading ? (
              // Loading skeleton to prevent hydration mismatch
              <div className={styles.authLoadingSkeleton}>
                <div className={styles.skeletonButton}></div>
                <div className={styles.skeletonButton}></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className={styles.userMenuContainer}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={styles.userMenuButton}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <FiUser size={18} />
                  <span>{user.full_name?.split(" ")[0]}</span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className={styles.userMenuOverlay}
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className={styles.userMenuDropdown}>
                      <div className={styles.userMenuHeader}>
                        <p className={styles.userMenuName}>{user.full_name}</p>
                        <p className={styles.userMenuEmail}>{user.email}</p>
                      </div>

                      <div className={styles.userMenuBody}>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className={styles.userMenuLink}
                        >
                          <FiHome size={18} />
                          <span>My Dashboard</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className={styles.userMenuLogout}
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
                  onClick={openLoginModal}
                  className={styles.signInButton}
                  aria-label="Sign in"
                >
                  <FiUser size={20} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={openSignupModal}
                  className={styles.signUpButton}
                  aria-label="Sign up"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          <div className={styles.mobileActions}>
            <div className={styles.mobileProfileWrap}>
              <button
                type="button"
                onClick={() => setShowMobileProfileMenu((prev) => !prev)}
                aria-label="Profile options"
                aria-expanded={showMobileProfileMenu}
                className={styles.mobileProfileButton}
              >
                {isAuthenticated && userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="User profile"
                    className={styles.mobileProfileImage}
                  />
                ) : (
                  <FiUser size={20} />
                )}
                <FiChevronDown
                  size={12}
                  className={`${styles.mobileProfileChevron} ${
                    showMobileProfileMenu ? styles.open : ""
                  }`}
                />
              </button>

              {showMobileProfileMenu && (
                <>
                  <div
                    className={styles.mobileProfileOverlay}
                    onClick={() => setShowMobileProfileMenu(false)}
                    aria-hidden="true"
                  />
                  <div className={styles.mobileProfileDropdown}>
                    {!isMounted || isLoading ? (
                      <div className={styles.mobileLoadingSkeleton}>
                        <div className={styles.mobileSkeletonButton}></div>
                        <div className={styles.mobileSkeletonButton}></div>
                      </div>
                    ) : isAuthenticated && user ? (
                      <>
                        <div className={styles.mobileProfileHeader}>
                          <p className={styles.mobileProfileName}>
                            Hi, {user.full_name?.split(" ")[0] || "Guest"}
                          </p>
                          <p className={styles.mobileProfileEmail}>
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowMobileProfileMenu(false)}
                          className={styles.mobileProfileMenuLink}
                        >
                          <FiHome size={16} />
                          <span>My Dashboard</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className={styles.mobileProfileMenuLogout}
                        >
                          <FiLogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            openLoginModal();
                            setShowMobileProfileMenu(false);
                          }}
                          className={styles.mobileProfileMenuLink}
                        >
                          <FiUser size={16} />
                          <span>Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            openSignupModal();
                            setShowMobileProfileMenu(false);
                          }}
                          className={styles.mobileProfileMenuPrimary}
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className={`${styles.mobileMenuButton} ${
                mobileMenuOpen ? styles.active : ""
              }`}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.mobileMenuOverlay}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              <nav className={styles.mobileNav}>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    scroll={item.href.startsWith("#")}
                    className={styles.mobileNavLink}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}

                <hr className={styles.mobileDivider} />

                {!isMounted || isLoading ? (
                  <div className={styles.mobileLoadingSkeleton}>
                    <div className={styles.mobileSkeletonButton}></div>
                    <div className={styles.mobileSkeletonButton}></div>
                  </div>
                ) : isAuthenticated && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={styles.mobileUserLink}
                      onClick={closeMobileMenu}
                    >
                      <FiUser size={18} />
                      <span>{user.full_name?.split(" ")[0]}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className={styles.mobileLogoutButton}
                    >
                      <FiLogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        openLoginModal();
                        closeMobileMenu();
                      }}
                      className={styles.mobileSignInButton}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        openSignupModal();
                        closeMobileMenu();
                      }}
                      className={styles.mobileSignUpButton}
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
    </header>
  );
}
