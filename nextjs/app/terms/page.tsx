"use client";

import React from "react";
import "./terms.css";

export default function TermsPage() {
  return (
    <div className="terms-page">
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="hero-content">
          <h1 className="hero-title">Terms of Service</h1>
          <p className="hero-subtitle">Last updated: January 4, 2026</p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="terms-content">
        <div className="terms-container">
          <div className="terms-intro">
            <p>
              Welcome to Zevio. These Terms of Service (&quot;Terms&quot;)
              govern your use of our website and services. By accessing or using
              Zevio, you agree to be bound by these Terms. Please read them
              carefully.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Zevio platform, you accept and agree to
              be bound by these Terms and our Privacy Policy. If you do not
              agree to these Terms, please do not use our services.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use Zevio services. By
              agreeing to these Terms, you represent and warrant that:
            </p>
            <ul>
              <li>You are at least 18 years of age</li>
              <li>
                You have the legal capacity to enter into binding contracts
              </li>
              <li>You will use the services only for lawful purposes</li>
              <li>All information you provide is accurate and complete</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">3. Account Registration</h2>
            <p>To book properties, you must create an account. You agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Keep your password confidential and secure</li>
              <li>
                Accept responsibility for all activities under your account
              </li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">4. Bookings and Reservations</h2>
            <h3 className="subsection-title">4.1 Booking Process</h3>
            <p>
              When you make a booking through Zevio, you enter into a direct
              contractual relationship with the property owner. Zevio acts as a
              facilitator and is not a party to the rental agreement.
            </p>
            <h3 className="subsection-title">4.2 Payment</h3>
            <p>
              All payments must be made through Zevio&apos;s secure payment
              gateway. By making a booking, you authorize us to charge your
              payment method for:
            </p>
            <ul>
              <li>Total accommodation cost</li>
              <li>Service fees</li>
              <li>Applicable taxes (GST)</li>
              <li>Any additional services requested</li>
            </ul>
            <h3 className="subsection-title">4.3 Booking Confirmation</h3>
            <p>
              Your booking is confirmed once payment is successfully processed.
              You will receive a confirmation email with booking details,
              property information, and check-in instructions.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">5. Cancellation and Refunds</h2>
            <p>
              Cancellation policies vary by property. Common policies include:
            </p>
            <ul>
              <li>
                <strong>Flexible:</strong> Free cancellation within 48 hours of
                booking. 50% refund if cancelled 7+ days before check-in.
              </li>
              <li>
                <strong>Moderate:</strong> Free cancellation within 48 hours of
                booking. 50% refund if cancelled 14+ days before check-in.
              </li>
              <li>
                <strong>Strict:</strong> Free cancellation within 48 hours of
                booking. No refund for cancellations after 48 hours.
              </li>
            </ul>
            <p>
              Cleaning fees are always refundable. Service fees are refundable
              only if cancelled within 48 hours of booking. Refunds are
              processed within 5-7 business days.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">6. Guest Responsibilities</h2>
            <p>As a guest, you agree to:</p>
            <ul>
              <li>Treat the property with respect and care</li>
              <li>
                Comply with all house rules specified by the property owner
              </li>
              <li>Not exceed the maximum number of guests</li>
              <li>Report any damages or issues immediately</li>
              <li>Leave the property in the same condition as received</li>
              <li>Not engage in illegal activities or disturb neighbors</li>
              <li>Provide valid identification at check-in</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">
              7. Property Owner Responsibilities
            </h2>
            <p>Property owners listing on Zevio agree to:</p>
            <ul>
              <li>Provide accurate property descriptions and photos</li>
              <li>Maintain properties to advertised standards</li>
              <li>Comply with all local laws and regulations</li>
              <li>Respond promptly to guest inquiries and issues</li>
              <li>Honor confirmed bookings</li>
              <li>Ensure property safety and cleanliness</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">8. Prohibited Activities</h2>
            <p>You may not use Zevio to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Post false or misleading information</li>
              <li>Harass, abuse, or harm others</li>
              <li>Transmit viruses or malicious code</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Engage in fraudulent activities</li>
              <li>Circumvent fees or payment systems</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">9. Intellectual Property</h2>
            <p>
              All content on Zevio, including text, graphics, logos, images, and
              software, is owned by or licensed to Zevio and protected by
              copyright and trademark laws. You may not:
            </p>
            <ul>
              <li>
                Copy, modify, or distribute our content without permission
              </li>
              <li>Use our trademarks or branding without authorization</li>
              <li>Create derivative works from our platform</li>
              <li>Use automated systems to access our services</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">10. Liability and Disclaimers</h2>
            <h3 className="subsection-title">10.1 Service &quot;As Is&quot;</h3>
            <p>
              Zevio provides services &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied. We do not guarantee uninterrupted or error-free service.
            </p>
            <h3 className="subsection-title">10.2 Limitation of Liability</h3>
            <p>
              Zevio shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of our
              services. Our total liability shall not exceed the amount you paid
              for the booking.
            </p>
            <h3 className="subsection-title">10.3 Third-Party Services</h3>
            <p>
              We are not responsible for third-party services, including payment
              processors, property owners, or external links. Your interactions
              with third parties are solely between you and them.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">11. Dispute Resolution</h2>
            <p>
              In the event of a dispute between guests and property owners,
              Zevio will attempt to facilitate resolution. However, we are not
              obligated to resolve disputes and may not be held liable for
              outcomes.
            </p>
            <p>
              Any disputes arising from these Terms shall be governed by the
              laws of India and subject to the exclusive jurisdiction of courts
              in [Your City], India.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">12. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting. Continued use of Zevio
              after changes constitutes acceptance of modified Terms. We will
              notify users of significant changes via email.
            </p>
          </div>

          <div className="terms-section">
            <h2 className="section-title">13. Termination</h2>
            <p>
              We may suspend or terminate your account at our discretion if you
              violate these Terms or engage in prohibited activities. Upon
              termination:
            </p>
            <ul>
              <li>Your right to use Zevio immediately ceases</li>
              <li>We may delete your account and data</li>
              <li>
                Existing bookings may be cancelled with appropriate refunds
              </li>
              <li>You remain liable for outstanding obligations</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2 className="section-title">14. Contact Information</h2>
            <p>If you have questions about these Terms, please contact us:</p>
            <div className="contact-info">
              <p>
                <strong>Zevio</strong>
              </p>
              <p>Email: legal@zevio.com</p>
              <p>Phone: +91 98765 43210</p>
              <p>Address: [Your Business Address]</p>
            </div>
          </div>

          <div className="terms-footer">
            <p>
              By using Zevio, you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
