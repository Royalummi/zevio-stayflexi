import { FiCheck, FiX, FiInfo } from "react-icons/fi";
import styles from "./cancellation-policy.module.css";

export default function CancellationPolicyPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Cancellation Policy</h1>
          <p className={styles.pageSubtitle}>
            Please read our cancellation and refund policy carefully before
            booking
          </p>
        </div>

        {/* Policy Content */}
        <div className={styles.policyCard}>
          {/* Standard Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Standard Cancellation Policy
            </h2>
            <div className={styles.policyGrid}>
              <div className={styles.policyItem}>
                <div className={styles.iconSuccess}>
                  <FiCheck />
                </div>
                <div>
                  <h3 className={styles.itemTitle}>7+ Days Before Check-in</h3>
                  <p className={styles.itemText}>
                    <strong>100% Refund</strong> - Full refund of booking amount
                    (excluding payment gateway charges)
                  </p>
                </div>
              </div>

              <div className={styles.policyItem}>
                <div className={styles.iconWarning}>
                  <FiInfo />
                </div>
                <div>
                  <h3 className={styles.itemTitle}>3-6 Days Before Check-in</h3>
                  <p className={styles.itemText}>
                    <strong>50% Refund</strong> - 50% of total booking amount
                    will be refunded
                  </p>
                </div>
              </div>

              <div className={styles.policyItem}>
                <div className={styles.iconDanger}>
                  <FiX />
                </div>
                <div>
                  <h3 className={styles.itemTitle}>
                    Less Than 3 Days / No Show
                  </h3>
                  <p className={styles.itemText}>
                    <strong>No Refund</strong> - No refund will be provided for
                    late cancellations or no-shows
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Important Notes</h2>
            <ul className={styles.notesList}>
              <li>
                Cancellation requests must be made through your Zevio account or
                by contacting our support team
              </li>
              <li>
                Refunds will be processed within 7-10 business days to the
                original payment method
              </li>
              <li>
                Payment gateway charges (2-3%) are non-refundable as per payment
                processor policy
              </li>
              <li>
                In case of property-initiated cancellations, 100% refund will be
                provided regardless of timing
              </li>
              <li>
                Force majeure events (natural disasters, government
                restrictions) may qualify for special consideration
              </li>
            </ul>
          </section>

          {/* Modification Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Booking Modification Policy</h2>
            <div className={styles.modificationBox}>
              <p>
                <strong>Date Changes:</strong> You can request to modify your
                check-in/check-out dates up to 3 days before check-in, subject
                to property availability.
              </p>
              <p>
                <strong>Guest Count Changes:</strong> Additional charges may
                apply if guest count increases beyond the original booking.
              </p>
              <p>
                <strong>How to Modify:</strong> Contact our support team at{" "}
                <a href="mailto:support@zevio.com">support@zevio.com</a> or call{" "}
                <a href="tel:+911234567890">+91 123-456-7890</a>
              </p>
            </div>
          </section>

          {/* Special Requests */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Special Requests</h2>
            <div className={styles.requestsBox}>
              <p>
                <strong>Early Check-in:</strong> Subject to availability and may
                incur additional charges. Cannot be guaranteed.
              </p>
              <p>
                <strong>Late Check-out:</strong> Subject to availability and may
                incur additional charges. Cannot be guaranteed.
              </p>
              <p className={styles.noteText}>
                Special requests are noted but not guaranteed. The property will
                do its best to accommodate when possible.
              </p>
            </div>
          </section>

          {/* Disputes */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Disputes & Support</h2>
            <p className={styles.disputeText}>
              If you have any concerns about your booking or cancellation,
              please contact our customer support team:
            </p>
            <div className={styles.contactBox}>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@zevio.com">support@zevio.com</a>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <a href="tel:+911234567890">+91 123-456-7890</a>
              </p>
              <p>
                <strong>Hours:</strong> Monday - Sunday, 9:00 AM - 9:00 PM IST
              </p>
            </div>
          </section>

          {/* Terms Agreement */}
          <section className={styles.section}>
            <div className={styles.agreementBox}>
              <p>
                By making a booking on Zevio, you acknowledge that you have
                read, understood, and agree to be bound by this Cancellation
                Policy.
              </p>
              <p>
                <strong>Last Updated:</strong> January 14, 2026
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
