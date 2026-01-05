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
            Oops! The page you're looking for doesn't exist. It might have been
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
              paddingTop: "24px",
              borderTop: "1px solid var(--gray-200)",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--gray-900)",
                marginBottom: "12px",
              }}
            >
              Quick Links
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/properties"
                style={{
                  fontSize: "14px",
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Browse Properties
              </Link>
              <span style={{ color: "var(--gray-300)" }}>•</span>
              <Link
                href="/profile"
                style={{
                  fontSize: "14px",
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                My Profile
              </Link>
              <span style={{ color: "var(--gray-300)" }}>•</span>
              <Link
                href="/dashboard"
                style={{
                  fontSize: "14px",
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          Need help? Contact our support team
        </p>
      </div>
    </div>
  );
}
