"use client";

import React from "react";
import styles from "./cookies.module.css";

export default function CookiePolicyPage() {
  return (
    <div className={styles.privacyPage}>
      {/* Hero Section */}
      <section className={styles.privacyHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Cookie Policy</h1>
          <p className={styles.heroSubtitle}>Last updated: April 8, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className={styles.privacyContent}>
        <div className={styles.privacyContainer}>
          <div className={styles.privacyIntro}>
            <p>
              This Cookie Policy explains how Zevio (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) uses cookies and similar
              tracking technologies when you visit our website at{" "}
              <strong>www.zevio.in</strong>. By continuing to browse our site,
              you consent to the use of cookies as described in this policy.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device
              (computer, tablet, or mobile) when you visit a website. They help
              the website recognize your device and remember information about
              your visit, such as your preferred language, login status, and
              other settings.
            </p>
            <p>
              Cookies can be &quot;session cookies&quot; (deleted when you close
              your browser) or &quot;persistent cookies&quot; (remain on your
              device for a set period or until you delete them).
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>2. Types of Cookies We Use</h2>

            <h3 className={styles.subsectionTitle}>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly.
              They enable core functionality such as security, account
              authentication, and session management. You cannot opt out of
              these cookies.
            </p>
            <ul>
              <li>User authentication and login sessions</li>
              <li>Security tokens and CSRF protection</li>
              <li>Load balancing and server routing</li>
              <li>Cookie consent preferences</li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              2.2 Performance & Analytics Cookies
            </h3>
            <p>
              These cookies help us understand how visitors interact with our
              website by collecting anonymous, aggregated data. This helps us
              improve our platform.
            </p>
            <ul>
              <li>Pages visited and time spent on each page</li>
              <li>Error messages encountered</li>
              <li>Traffic sources and referral data</li>
              <li>Device type, browser, and operating system</li>
            </ul>

            <h3 className={styles.subsectionTitle}>2.3 Functional Cookies</h3>
            <p>
              These cookies remember your preferences and choices to provide a
              more personalized experience.
            </p>
            <ul>
              <li>Language and region preferences</li>
              <li>Recently viewed properties</li>
              <li>Search filters and sorting preferences</li>
              <li>Display settings (e.g., map view vs list view)</li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              2.4 Marketing & Advertising Cookies
            </h3>
            <p>
              These cookies are used to deliver relevant advertisements and
              track the effectiveness of our marketing campaigns. They may be
              set by us or third-party advertising partners.
            </p>
            <ul>
              <li>Ad targeting and retargeting</li>
              <li>Campaign performance measurement</li>
              <li>Social media sharing functionality</li>
              <li>Cross-site user tracking for ad relevance</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>3. Third-Party Cookies</h2>
            <p>
              Some cookies on our site are placed by third-party services we
              use. These may include:
            </p>
            <ul>
              <li>
                <strong>Google Analytics:</strong> Website traffic analysis and
                user behaviour insights
              </li>
              <li>
                <strong>Cashfree Payments:</strong> Secure payment processing
                and fraud prevention
              </li>
              <li>
                <strong>Google Maps:</strong> Location services and property
                mapping
              </li>
              <li>
                <strong>Social Media Platforms:</strong> Share buttons and
                social login functionality
              </li>
            </ul>
            <p>
              These providers have their own privacy and cookie policies. We
              recommend reviewing their policies for more information.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>4. How to Manage Cookies</h2>
            <p>
              You have the right to control and manage cookies. Most browsers
              allow you to:
            </p>
            <ul>
              <li>View and delete existing cookies</li>
              <li>Block all or certain types of cookies</li>
              <li>Set preferences for specific websites</li>
              <li>Block third-party cookies while allowing first-party</li>
              <li>Automatically clear cookies when you close the browser</li>
            </ul>
            <p>
              Please note that blocking or disabling certain cookies may affect
              the functionality of our website and your user experience. For
              example, you may not be able to log in or complete bookings if
              essential cookies are blocked.
            </p>

            <h3 className={styles.subsectionTitle}>Browser Settings</h3>
            <p>To manage cookies in your browser:</p>
            <ul>
              <li>
                <strong>Chrome:</strong> Settings → Privacy and Security →
                Cookies and other site data
              </li>
              <li>
                <strong>Firefox:</strong> Settings → Privacy & Security →
                Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website
                Data
              </li>
              <li>
                <strong>Edge:</strong> Settings → Cookies and site permissions →
                Manage and delete cookies
              </li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>5. Cookie Retention</h2>
            <p>
              The retention period for cookies varies depending on their type:
            </p>
            <ul>
              <li>
                <strong>Session Cookies:</strong> Deleted when you close your
                browser
              </li>
              <li>
                <strong>Persistent Cookies:</strong> Retained for up to 12
                months, unless you delete them earlier
              </li>
              <li>
                <strong>Third-Party Cookies:</strong> Retention periods are set
                by the respective third-party providers
              </li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in technology, regulation, or our business practices. We
              will notify you of significant changes by posting the updated
              policy on our website with a new &quot;Last updated&quot; date.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>7. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>Email:</strong> support@zevio.com
              </p>
              <p>
                <strong>Website:</strong> www.zevio.in
              </p>
              <p>
                <strong>Address:</strong> Navarathna Agrahara, Bettahalasur
                Post, Bangalore North - 562157
              </p>
            </div>
          </div>

          <div className={styles.privacyFooter}>
            <p>
              By using Zevio, you acknowledge that you have read and understand
              this Cookie Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
