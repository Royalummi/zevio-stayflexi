"use client";

import Link from "next/link";
import { FiHome, FiSearch, FiArrowLeft } from "react-icons/fi";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        {/* 404 Illustration */}
        <div className={styles.notFoundNumber}>404</div>

        {/* Error Message Card */}
        <div className={styles.notFoundCard}>
          <div className={styles.notFoundIcon}>
            <FiSearch size={40} />
          </div>

          <h1 className={styles.notFoundTitle}>Page Not Found</h1>
          <p className={styles.notFoundMessage}>
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might
            have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className={styles.notFoundActions}>
            <Link href="/" className={styles.btnHome}>
              <FiHome size={20} />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className={styles.btnBack}
            >
              <FiArrowLeft size={20} />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className={styles.quickLinks}>
            <p className={styles.quickLinksTitle}>Quick Links</p>
            <div className={styles.quickLinksGrid}>
              <Link href="/villas" className={styles.quickLink}>
                Browse Villas
              </Link>
              <Link href="/destinations" className={styles.quickLink}>
                Destinations
              </Link>
              <Link href="/support" className={styles.quickLink}>
                Contact Support
              </Link>
              <Link href="/about" className={styles.quickLink}>
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
