"use client";

import Link from "next/link";
import { FiHome, FiSearch, FiArrowLeft } from "react-icons/fi";
import "./not-found.css";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* 404 Illustration */}
        <div className="not-found-number">404</div>

        {/* Error Message Card */}
        <div className="not-found-card">
          <div className="not-found-icon">
            <FiSearch size={40} />
          </div>

          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-message">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been
            moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <Link href="/" className="btn-home">
              <FiHome size={20} />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="btn-back"
            >
              <FiArrowLeft size={20} />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <p className="quick-links-title">Quick Links</p>
            <div className="quick-links-grid">
              <Link href="/properties" className="quick-link">
                Browse Properties
              </Link>
              <Link href="/destinations" className="quick-link">
                Destinations
              </Link>
              <Link href="/support" className="quick-link">
                Contact Support
              </Link>
              <Link href="/about" className="quick-link">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
