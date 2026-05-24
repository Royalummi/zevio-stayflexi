"use client";

import React, { useState } from "react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiMessageCircle,
} from "react-icons/fi";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [formStatus, setFormStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        setTimeout(() => setFormStatus("idle"), 6000);
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <div className={styles.contactPage}>
      {/* Hero Section */}
      <section className={styles.contactHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Get in Touch</h1>
          <p className={styles.heroDescription}>
            Have a question or need assistance? We&apos;re here to help. Reach
            out to us and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection}>
        <div className={styles.contactContainer}>
          {/* Contact Info */}
          <div className={styles.contactInfoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FiMail />
              </div>
              <h3 className={styles.infoTitle}>Email Us</h3>
              <p className={styles.infoText}>support@zevio.in</p>
              <p className={styles.infoDescription}>
                We&apos;ll respond within 24 hours
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FiPhone />
              </div>
              <h3 className={styles.infoTitle}>Call Us</h3>
              <p className={styles.infoText}>+91 99800 50909</p>
              <p className={styles.infoDescription}>
                Available 24/7 for support
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <FiMapPin />
              </div>
              <h3 className={styles.infoTitle}>Visit Us</h3>
              <p className={styles.infoText}>Bengaluru, Karnataka</p>
              <p className={styles.infoDescription}>India</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className={styles.contactFormSection}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Send us a Message</h2>
              <p className={styles.formSubtitle}>
                Fill out the form below and we&apos;ll get back to you as soon
                as possible
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                    placeholder="John Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="+91 99800 50909"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.formLabel}>
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="booking">Booking Support</option>
                    <option value="property">Property Listing</option>
                    <option value="payment">Payment Issue</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={styles.formTextarea}
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              {formStatus === "success" && (
                <div className={styles.formSuccess}>
                  <p>
                    ✓ Thank you for contacting us! We&apos;ve received your
                    message and will respond within 24 hours.
                  </p>
                </div>
              )}

              {formStatus === "error" && (
                <div className={styles.formError}>
                  <p>
                    ✗ Something went wrong. Please try again or contact us
                    directly at support@zevio.in
                  </p>
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={formStatus === "sending"}
              >
                {formStatus === "sending" ? (
                  <>
                    <span className={styles.spinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>


    </div>
  );
}
