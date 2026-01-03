"use client";

import Link from "next/link";
import { FiHome, FiSearch, FiArrowLeft } from "react-icons/fi";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* 404 Illustration */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: "800",
            color: "rgba(255, 255, 255, 0.9)",
            lineHeight: "1",
            marginBottom: "24px",
            textShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          404
        </div>

        {/* Error Message Card */}
        <div
          className="card"
          style={{
            padding: "48px 32px",
            textAlign: "center",
            background: "white",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <FiSearch size={40} color="white" />
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "12px",
            }}
          >
            Page Not Found
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--gray-600)",
              marginBottom: "32px",
              lineHeight: "1.6",
            }}
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might
            have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "stretch",
            }}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <button
                className="btn btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <FiHome size={20} />
                Back to Home
              </button>
            </Link>

            <button
              onClick={() => window.history.back()}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--gray-700)",
                background: "var(--gray-100)",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--gray-200)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "var(--gray-100)";
              }}
            >
              <FiArrowLeft size={20} />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div
            style={{
              marginTop: "32px",
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
