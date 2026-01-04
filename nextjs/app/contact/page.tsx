"use client";

import React, { useState } from "react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiMessageCircle,
} from "react-icons/fi";
import "./contact.css";

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
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");

    // Simulate API call
    setTimeout(() => {
      setFormStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setFormStatus("idle");
      }, 5000);
    }, 1500);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-content">
          <h1 className="hero-title">Get in Touch</h1>
          <p className="hero-description">
            Have a question or need assistance? We&apos;re here to help. Reach
            out to us and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          {/* Contact Info */}
          <div className="contact-info-cards">
            <div className="info-card">
              <div className="info-icon">
                <FiMail />
              </div>
              <h3 className="info-title">Email Us</h3>
              <p className="info-text">support@zevio.com</p>
              <p className="info-description">
                We&apos;ll respond within 24 hours
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiPhone />
              </div>
              <h3 className="info-title">Call Us</h3>
              <p className="info-text">+91 98765 43210</p>
              <p className="info-description">Available 24/7 for support</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiMapPin />
              </div>
              <h3 className="info-title">Visit Us</h3>
              <p className="info-text">Mumbai, Maharashtra</p>
              <p className="info-description">India</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiMessageCircle />
              </div>
              <h3 className="info-title">Live Chat</h3>
              <p className="info-text">Chat with our team</p>
              <p className="info-description">
                Instant responses during business hours
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="form-header">
              <h2 className="form-title">Send us a Message</h2>
              <p className="form-subtitle">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible
              </p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="form-input"
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

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="form-textarea"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              {formStatus === "success" && (
                <div className="form-success">
                  <p>
                    ✓ Thank you for contacting us! We&apos;ve received your
                    message and will respond within 24 hours.
                  </p>
                </div>
              )}

              {formStatus === "error" && (
                <div className="form-error">
                  <p>
                    ✗ Something went wrong. Please try again or contact us
                    directly at support@zevio.com
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={formStatus === "sending"}
              >
                {formStatus === "sending" ? (
                  <>
                    <span className="spinner"></span>
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

      {/* Map Section (Placeholder) */}
      <section className="map-section">
        <div className="map-placeholder">
          <FiMapPin className="map-icon" />
          <p className="map-text">Map Integration Coming Soon</p>
        </div>
      </section>
    </div>
  );
}
