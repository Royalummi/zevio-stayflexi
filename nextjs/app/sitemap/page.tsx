"use client";

import React from "react";
import Link from "next/link";
import styles from "./sitemap.module.css";

const sitemapSections = [
  {
    title: "Main Pages",
    links: [
      { name: "Home", href: "/" },
      { name: "Villas", href: "/villas" },
      { name: "Destinations", href: "/destinations" },
      { name: "Service Apartments", href: "/service-apartments" },
      { name: "About Us", href: "/about" },
      { name: "Why Zevio", href: "/why-zevio" },
      { name: "Contact Us", href: "/contact" },
      { name: "Corporate Offers", href: "/corporate-offers" },
    ],
  },
  {
    title: "Your Account",
    links: [
      { name: "Login / Sign Up", href: "/login" },
      { name: "Your Profile", href: "/profile" },
      { name: "Your Bookings", href: "/dashboard/bookings" },
      { name: "Notifications", href: "/notifications" },
      { name: "Change Password", href: "/change-password" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help & Support", href: "/support" },
      { name: "Cancellation Policy", href: "/cancellation-policy" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className={styles.sitemapPage}>
      {/* Hero Section */}
      <section className={styles.sitemapHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Sitemap</h1>
          <p className={styles.heroSubtitle}>
            A complete overview of all pages on Zevio
          </p>
        </div>
      </section>

      {/* Sitemap Content */}
      <section className={styles.sitemapContent}>
        <div className={styles.sitemapContainer}>
          <div className={styles.sitemapGrid}>
            {sitemapSections.map((section) => (
              <div key={section.title} className={styles.sitemapSection}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <ul className={styles.linkList}>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={styles.sitemapLink}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
