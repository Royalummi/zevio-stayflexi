"use client";

import React from "react";
import styles from "./privacy.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.privacyPage}>
      {/* Hero Section */}
      <section className={styles.privacyHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSubtitle}>Last updated: January 4, 2026</p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className={styles.privacyContent}>
        <div className={styles.privacyContainer}>
          <div className={styles.privacyIntro}>
            <p>
              At Zevio, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our platform. Please read this policy
              carefully.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
            <h3 className={styles.subsectionTitle}>
              1.1 Information You Provide
            </h3>
            <p>We collect information you voluntarily provide when you:</p>
            <ul>
              <li>Create an account (name, email, phone, password)</li>
              <li>Make a booking (payment details, guest information)</li>
              <li>List a property (property details, photos, banking info)</li>
              <li>Contact support (messages, feedback, complaints)</li>
              <li>Participate in surveys or promotions</li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              1.2 Automatically Collected Information
            </h3>
            <p>When you use Zevio, we automatically collect:</p>
            <ul>
              <li>
                Device information (IP address, browser type, operating system)
              </li>
              <li>Usage data (pages visited, time spent, clicks)</li>
              <li>Location data (with your permission)</li>
              <li>Cookies and tracking technologies</li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              1.3 Information from Third Parties
            </h3>
            <p>We may receive information from:</p>
            <ul>
              <li>Payment processors (transaction details)</li>
              <li>Social media platforms (if you connect accounts)</li>
              <li>Identity verification services</li>
              <li>Analytics providers</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>
              2. How We Use Your Information
            </h2>
            <p>We use collected information to:</p>
            <ul>
              <li>
                <strong>Provide Services:</strong> Process bookings, manage
                accounts, facilitate communications
              </li>
              <li>
                <strong>Improve Experience:</strong> Personalize content,
                recommend properties, enhance functionality
              </li>
              <li>
                <strong>Security:</strong> Detect fraud, prevent abuse, protect
                users
              </li>
              <li>
                <strong>Communication:</strong> Send confirmations, updates,
                marketing (with consent)
              </li>
              <li>
                <strong>Analytics:</strong> Understand usage patterns, improve
                services
              </li>
              <li>
                <strong>Legal Compliance:</strong> Meet regulatory requirements,
                enforce Terms
              </li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>3. Information Sharing</h2>
            <h3 className={styles.subsectionTitle}>
              3.1 When We Share Information
            </h3>
            <p>We may share your information with:</p>
            <ul>
              <li>
                <strong>Property Owners:</strong> When you make a booking (name,
                contact, guest count)
              </li>
              <li>
                <strong>Service Providers:</strong> Payment processors, hosting
                services, analytics tools
              </li>
              <li>
                <strong>Legal Authorities:</strong> When required by law or to
                protect rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In case of merger,
                acquisition, or sale
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly agree to
                sharing
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>
              3.2 What We Don&apos;t Share
            </h3>
            <p>We will never:</p>
            <ul>
              <li>Sell your personal information to third parties</li>
              <li>Share payment details with property owners</li>
              <li>Disclose sensitive information without consent</li>
              <li>Use your data for purposes other than stated here</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              information:
            </p>
            <ul>
              <li>
                <strong>Encryption:</strong> SSL/TLS encryption for data
                transmission
              </li>
              <li>
                <strong>Secure Storage:</strong> Encrypted databases with access
                controls
              </li>
              <li>
                <strong>Payment Security:</strong> PCI-DSS compliant payment
                processing
              </li>
              <li>
                <strong>Access Controls:</strong> Limited employee access on
                need-to-know basis
              </li>
              <li>
                <strong>Regular Audits:</strong> Security assessments and
                vulnerability testing
              </li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100%
              secure. While we strive to protect your data, we cannot guarantee
              absolute security.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>5. Your Privacy Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                data
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing
                communications
              </li>
              <li>
                <strong>Data Portability:</strong> Receive your data in a
                structured format
              </li>
              <li>
                <strong>Restrict Processing:</strong> Limit how we use your data
              </li>
              <li>
                <strong>Object:</strong> Object to certain types of data
                processing
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@zevio.com. We will
              respond within 30 days.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>6. Cookies and Tracking</h2>
            <h3 className={styles.subsectionTitle}>
              6.1 Types of Cookies We Use
            </h3>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> Required for platform
                functionality (login, cart)
              </li>
              <li>
                <strong>Performance Cookies:</strong> Analyze usage and improve
                services
              </li>
              <li>
                <strong>Functional Cookies:</strong> Remember preferences and
                settings
              </li>
              <li>
                <strong>Marketing Cookies:</strong> Deliver relevant ads and
                track campaigns
              </li>
            </ul>

            <h3 className={styles.subsectionTitle}>6.2 Managing Cookies</h3>
            <p>
              You can control cookies through your browser settings. Note that
              disabling certain cookies may affect functionality. Most browsers
              allow you to:
            </p>
            <ul>
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Set preferences for specific websites</li>
              <li>Clear cookies on browser close</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>7. Data Retention</h2>
            <p>We retain your information for as long as necessary to:</p>
            <ul>
              <li>Provide services and support bookings</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain business records</li>
            </ul>
            <p>
              When data is no longer needed, we securely delete or anonymize it.
              Specific retention periods:
            </p>
            <ul>
              <li>Account data: Retained until account deletion + 90 days</li>
              <li>Booking records: 7 years for tax and legal purposes</li>
              <li>Payment data: As required by payment processors</li>
              <li>Marketing consent: Until you opt out</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>8. Third-Party Links</h2>
            <p>
              Our platform may contain links to third-party websites, services,
              or applications. We are not responsible for their privacy
              practices. We encourage you to review the privacy policies of any
              third-party services you access.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>9. Children&apos;s Privacy</h2>
            <p>
              Zevio is not intended for users under 18 years of age. We do not
              knowingly collect personal information from children. If we
              discover that a child under 18 has provided personal information,
              we will delete it immediately. If you believe a child has provided
              us with information, please contact us at privacy@zevio.com.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>
              10. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your country of residence. These countries may have
              different data protection laws. When we transfer data
              internationally, we ensure appropriate safeguards are in place:
            </p>
            <ul>
              <li>Standard contractual clauses</li>
              <li>Data processing agreements</li>
              <li>Compliance with local regulations</li>
              <li>Adequate security measures</li>
            </ul>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or legal requirements. We will notify you
              of significant changes by:
            </p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices on the platform</li>
            </ul>
            <p>
              Continued use of Zevio after changes constitutes acceptance of the
              updated Privacy Policy. We encourage you to review this policy
              periodically.
            </p>
          </div>

          <div className={styles.privacySection}>
            <h2 className={styles.sectionTitle}>12. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>Zevio - Privacy Team</strong>
              </p>
              <p>Email: privacy@zevio.com</p>
              <p>Phone: +91 98765 43210</p>
              <p>Address: [Your Business Address]</p>
            </div>
            <p>
              We take privacy concerns seriously and will respond to your
              inquiry within 30 business days.
            </p>
          </div>

          <div className={styles.privacyFooter}>
            <p>
              By using Zevio, you acknowledge that you have read, understood,
              and agree to this Privacy Policy and our data practices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
