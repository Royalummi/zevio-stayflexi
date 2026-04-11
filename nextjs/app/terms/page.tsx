"use client";

import React from "react";
import styles from "./terms.module.css";

export default function TermsPage() {
  return (
    <div className={styles.termsPage}>
      {/* Hero Section */}
      <section className={styles.termsHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Terms &amp; Conditions</h1>
          <p className={styles.heroSubtitle}>Last updated: April 12, 2026</p>
        </div>
      </section>

      {/* Terms Content */}
      <section className={styles.termsContent}>
        <div className={styles.termsContainer}>
          <div className={styles.termsIntro}>
            <p>
              Zevio (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;) is a technology-based online accommodation
              booking platform available via website and mobile application. We
              provide a marketplace that enables registered property owners
              (&quot;Hosts&quot;) to publish their properties
              (&quot;Listings&quot;) and allows users searching for
              accommodation (&quot;Guests&quot;) to book these stays.
            </p>
            <p>
              <strong>Clarification of Status:</strong> Zevio is an Electronic
              Commerce Operator (ECO) under Indian GST laws and an
              &quot;Intermediary&quot; under the Information Technology Act,
              2000. We do not own, lease, or manage the properties listed. We
              are not a real estate broker or travel agency.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p>
              By accessing, registering, or using Zevio, you legally agree to
              these Terms. This constitutes a binding electronic contract
              between you and Zevio.
            </p>
            <ul>
              <li>
                <strong>Scope:</strong> These terms apply to all visitors,
                regardless of whether they register an account.
              </li>
              <li>
                <strong>Updates:</strong> If you do not agree to the current or
                future modifications of these terms, you must immediately
                discontinue the use of the Platform.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>2. Eligibility</h2>
            <ul>
              <li>
                <strong>Age Requirement:</strong> You must be at least 18 years
                old. By using Zevio, you represent and warrant that you have the
                right, authority, and capacity to enter into this Agreement.
              </li>
              <li>
                <strong>Legal Competence:</strong> You must not be disqualified
                from contracting under the Indian Contract Act, 1872 (e.g.,
                undischarged insolvent).
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>3. User Accounts</h2>
            <ul>
              <li>
                <strong>Registration:</strong> To access booking features, you
                must create an account using a valid email or phone number.
              </li>
              <li>
                <strong>Security:</strong> You are responsible for all
                activities that occur under your account. You must notify Zevio
                immediately of any breach of security.
              </li>
              <li>
                <strong>Account Transfer:</strong> Accounts are non-transferable.
                You may not sell or assign your account to another party.
              </li>
              <li>
                <strong>One Account Policy:</strong> Users may generally only
                maintain one active account. Duplicate accounts created to
                bypass restrictions or reviews will be suspended.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>4. Bookings and Pricing</h2>
            <h3 className={styles.subsectionTitle}>4.1 Booking Confirmation</h3>
            <p>
              A booking is officially confirmed only upon the successful
              processing of the Total Price and the issuance of a booking
              confirmation notification by Zevio. Upon confirmation, a legally
              binding agreement is formed directly between the Guest and the
              Host. This agreement grants the Guest a limited, revocable license
              to enter, occupy, and use the Accommodation for the agreed
              duration. Zevio remains strictly an intermediary and is not a
              party to this agreement. Any subsequent modifications to the
              booking must be processed through the Platform.
            </p>
            <h3 className={styles.subsectionTitle}>4.2 Pricing Components</h3>
            <p>
              The &quot;Total Price&quot; displayed includes:
            </p>
            <ul>
              <li>
                <strong>Accommodation Fee:</strong> Set by the Host.
              </li>
              <li>
                <strong>Zevio Service Fee:</strong> A fee charged to the Guest
                for platform use.
              </li>
              <li>
                <strong>Taxes:</strong> GST and other applicable taxes based on
                the location and price bracket.
              </li>
              <li>
                <strong>Cleaning / Security Fees:</strong> (If applicable) set
                by the Host.
              </li>
              <li>
                <strong>Dynamic Pricing:</strong> Hosts may change prices at any
                time. The price applicable is the one displayed at the moment of
                booking confirmation.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>5. Payment</h2>
            <ul>
              <li>
                <strong>Payment Processing:</strong> Zevio acts as the Limited
                Payment Collection Agent for the Host. When a Guest pays Zevio,
                the Guest&apos;s payment obligation to the Host is extinguished.
              </li>
              <li>
                <strong>Methods:</strong> We accept Credit/Debit Cards, UPI, and
                Net Banking via RBI compliant gateways.
              </li>
              <li>
                <strong>Currency:</strong> All transactions are processed in
                Indian Rupees (INR) unless otherwise stated.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>6. Cancellation and Refunds</h2>
            <p>
              Hosts select a cancellation policy that applies to their listing.
              Common policies include:
            </p>
            <ul>
              <li>
                <strong>Flexible:</strong> Full refund if cancelled 10 or more
                days before check-in.
              </li>
              <li>
                <strong>Moderate:</strong> Full refund if cancelled 7 days
                before check-in date/time; 50% refund thereafter.
              </li>
              <li>
                <strong>Strict:</strong> No refund within 48 hours of check-in
                time.
              </li>
            </ul>
            <ul>
              <li>
                Cancellation fees may be applicable depending on the policy
                selected by the Host.
              </li>
              <li>
                <strong>Zevio Service Fee:</strong> Generally non-refundable
                unless the cancellation is due to a Host&apos;s failure or a
                Force Majeure event.
              </li>
              <li>
                <strong>Refund Timeline:</strong> Approved refunds are credited
                to the original payment source within 7–14 business days.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              7. Check-In, Stay &amp; Guest Responsibilities
            </h2>
            <h3 className={styles.subsectionTitle}>7.1 Use of Property</h3>
            <p>
              The Accommodation shall be used strictly for personal, residential,
              and lawful accommodation purposes for the duration of the booked
              stay. Guests are expressly prohibited from using the property for
              any commercial activities, illegal enterprises, subletting, or
              transferring the booking to any third party without the prior
              written consent of the Host. The Guest acknowledges that the
              booking constitutes a temporary license to use the property and
              does not create any tenancy, leasehold, or other real property
              rights under Indian law.
            </p>
            <h3 className={styles.subsectionTitle}>7.2 House Rules</h3>
            <p>
              Guests must adhere to specific rules set by the Host (e.g.,
              &quot;No Shoes Inside&quot;, &quot;Quiet Hours after 10 PM&quot;).
            </p>
            <h3 className={styles.subsectionTitle}>7.3 Overstaying</h3>
            <p>
              If a Guest stays past the checkout time without consent, the Host
              is entitled to make the Guest leave and charge a penalty (e.g., 2x
              the nightly rate) for the additional time.
            </p>
            <h3 className={styles.subsectionTitle}>
              7.4 Guest Responsibility and Liability
            </h3>
            <p>
              Guests assume full legal and financial responsibility for their
              own acts and omissions, as well as those of any co-guests or
              invitees permitted onto the property. This includes:
            </p>
            <ul>
              <li>
                <strong>Duty of Care:</strong> Maintaining the property,
                furniture, and fixtures in good condition. Guests must
                immediately report any pre-existing damage or safety issues to
                the Host upon check-in.
              </li>
              <li>
                <strong>Liability for Damage:</strong> Bearing the full cost of
                repair or replacement for any damages caused beyond normal wear
                and tear. The Guest authorizes Zevio to charge their payment
                method or deduct from the Security Deposit to cover such proven
                damages.
              </li>
              <li>
                <strong>Compliance:</strong> Strictly adhering to all
                Host-specific House Rules, local municipal laws, and community
                guidelines.
              </li>
              <li>
                <strong>Timely Departure:</strong> Vacating the property along
                with all personal belongings by the designated checkout time.
                Failure to do so will result in overstay penalties.
              </li>
            </ul>
            <h3 className={styles.subsectionTitle}>7.5 Prohibited Conduct</h3>
            <ul>
              <li>Hosting unauthorized parties or events.</li>
              <li>Smoking in non-smoking zones.</li>
              <li>Bringing pets without prior approval.</li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>8. Host Obligations</h2>
            <ul>
              <li>
                <strong>Listing Accuracy:</strong> Hosts warrant that the
                property description, photos, and amenities are current and
                accurate. Misrepresentation (e.g., listing a pool that
                doesn&apos;t exist) allows the Guest to claim a full refund.
              </li>
              <li>
                <strong>Legal Compliance:</strong> Hosts must obtain all
                necessary licences (e.g., Homestay Registration, Fire Safety
                Certificate) required by local municipal authorities.
              </li>
              <li>
                <strong>Safety:</strong> Hosts must ensure the property is safe,
                free of hazards, and equipped with basic safety measures
                (working locks, emergency contacts).
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              9. Role and Limitations of Zevio
            </h2>
            <ul>
              <li>
                <strong>Intermediary Status:</strong> Zevio is not a party to
                the rental agreement between Host and Guest.
              </li>
              <li>
                <strong>Dispute Resolution:</strong> While Zevio may offer a
                &quot;Resolution Centre&quot; to help mediate disputes, we are
                not obligated to resolve them. The final legal recourse lies
                between the Guest and the Host.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              10. Intellectual Property Rights
            </h2>
            <ul>
              <li>
                <strong>Zevio Content:</strong> All text, graphics, logos, code,
                and software on the Platform are owned by Zevio.
              </li>
              <li>
                <strong>User Content:</strong> By uploading photos or reviews,
                Users grant Zevio a non-exclusive, worldwide, royalty-free
                licence to use, display, and reproduce that content for
                marketing and platform purposes.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>11. Prohibited Activities</h2>
            <p>Users shall not:</p>
            <ul>
              <li>
                <strong>Circumvention:</strong> Attempt to book a property
                outside the Platform to avoid paying Service Fees.
              </li>
              <li>
                <strong>Discrimination:</strong> Refuse service or harass users
                based on race, religion, caste, gender, or sexual orientation.
              </li>
              <li>
                <strong>Spam:</strong> Use the platform to send unsolicited
                commercial messages.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              12. Termination and Suspension
            </h2>
            <ul>
              <li>
                <strong>For Cause:</strong> Zevio may suspend accounts for
                fraud, safety concerns, or high cancellation rates by Hosts.
              </li>
              <li>
                <strong>Without Cause:</strong> Zevio may terminate this
                Agreement with 30 days&apos; notice via email.
              </li>
              <li>
                <strong>Effect:</strong> Upon termination, all future bookings
                may be cancelled and refunds issued to Guests.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>13. Reviews and Ratings</h2>
            <p>
              After a stay, Guests and Hosts may review each other. Reviews must
              be accurate and may not contain discriminatory, offensive, or
              defamatory language. Zevio does not verify the accuracy of reviews
              but reserves the right to remove reviews that violate our Content
              Policy. Users may not manipulate the rating system.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              14. Damage Protection &amp; Security Deposits
            </h2>
            <p>
              Hosts may require a Security Deposit. If a Host reports damage
              within 48 hours of checkout with evidence (photos), Zevio reserves
              the right to claim the amount from the Guest&apos;s Security
              Deposit or payment method. Zevio acts as the final arbiter in
              damage disputes.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              15. Disclaimer and Limitation of Liability
            </h2>
            <ul>
              <li>
                <strong>&quot;As Is&quot; Service:</strong> The Platform is
                provided on an &quot;as is&quot; basis without warranties of
                uninterrupted service.
              </li>
              <li>
                <strong>Liability Cap:</strong> To the extent permitted by law,
                Zevio&apos;s total liability for any claim arising out of these
                terms is limited to the Service Fees paid by the User in the 12
                months preceding the event giving rise to the liability.
              </li>
              <li>
                <strong>Exclusions:</strong> Zevio is not liable for personal
                injury or death at a property, theft of Guest&apos;s personal
                belongings, or the behaviour or conduct of any third party.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>16. Indemnity</h2>
            <p>
              You agree to release, defend, indemnify, and hold Zevio and its
              affiliates harmless from and against any claims, liabilities,
              damages, losses, and expenses, including legal fees, arising out
              of:
            </p>
            <ul>
              <li>Your breach of these Terms.</li>
              <li>Your improper use of the Platform.</li>
              <li>
                Your interaction with any Member or stay at an Accommodation.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>17. Taxes (GST &amp; TCS)</h2>
            <p>
              Zevio collects and remits GST on the Service Fee. For the
              Accommodation Fee:
            </p>
            <ul>
              <li>
                If the Host is registered for GST, the Host is responsible for
                remitting GST.
              </li>
              <li>
                If the Host is not registered, Zevio may be required to collect
                and deposit GST under Section 9(5) of the CGST Act.
              </li>
              <li>
                Zevio will deduct Tax Collected at Source (TCS) under the Income
                Tax Act / GST Act where applicable.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              18. Force Majeure (Unforeseeable Events)
            </h2>
            <p>
              Neither Zevio nor the Host shall be liable for failure to perform
              obligations (including providing accommodation) due to Force
              Majeure events beyond reasonable control. These include natural
              disasters (floods, earthquakes), pandemics, government lockdowns,
              war, riots, or strikes. In such cases, Zevio may offer a credit
              note or refund as per the specific Extenuating Circumstances
              Policy.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>
              19. Governing Law and Jurisdiction
            </h2>
            <ul>
              <li>
                <strong>Law:</strong> These Terms are governed by the laws of
                India.
              </li>
              <li>
                <strong>Jurisdiction:</strong> The courts in Bengaluru,
                Karnataka shall have exclusive jurisdiction over any disputes.
              </li>
            </ul>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>20. Amendments</h2>
            <p>
              Zevio reserves the right to modify these Terms. We will provide
              notice of material changes via email or a platform notification.
              Continued use after the effective date implies acceptance.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h2 className={styles.sectionTitle}>Contact Details</h2>
            <div className={styles.contactInfo}>
              <p>
                <strong>Zevio</strong>
              </p>
              <p>
                Email:{" "}
                <a href="mailto:support@zevio.com">support@zevio.com</a>
              </p>
              <p>Phone: +91 99800 50909</p>
            </div>
          </div>

          <div className={styles.termsFooter}>
            <p>
              By using Zevio, you acknowledge that you have read, understood,
              and agree to be bound by these Terms &amp; Conditions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
