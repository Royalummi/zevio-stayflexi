"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FiShield,
  FiDollarSign,
  FiUsers,
  FiHome,
  FiStar,
  FiClock,
  FiHeart,
  FiCheckCircle,
} from "react-icons/fi";
import "./why-zevio.css";

const features = [
  {
    icon: <FiShield />,
    title: "Verified Properties",
    description:
      "Every property is personally inspected and verified by our team to ensure premium quality standards.",
  },
  {
    icon: <FiDollarSign />,
    title: "Best Price Guarantee",
    description:
      "We guarantee the lowest prices. Find a lower price elsewhere and we'll match it.",
  },
  {
    icon: <FiUsers />,
    title: "24/7 Support",
    description:
      "Our dedicated support team is available round the clock to assist you with any queries or issues.",
  },
  {
    icon: <FiHome />,
    title: "Luxury Villas",
    description:
      "Handpicked luxury villas with premium amenities, private pools, and stunning locations.",
  },
  {
    icon: <FiStar />,
    title: "Trusted by Thousands",
    description:
      "Join thousands of satisfied customers who've experienced unforgettable stays with Zevio.",
  },
  {
    icon: <FiClock />,
    title: "Instant Booking",
    description:
      "Book your dream villa in minutes with our simple and secure online booking system.",
  },
  {
    icon: <FiHeart />,
    title: "Personalized Service",
    description:
      "Dedicated concierge service to help you plan activities, meals, and special occasions.",
  },
  {
    icon: <FiCheckCircle />,
    title: "Flexible Cancellation",
    description:
      "Life happens. We offer flexible cancellation policies for your peace of mind.",
  },
];

const benefits = [
  {
    number: "1000+",
    label: "Happy Customers",
  },
  {
    number: "150+",
    label: "Luxury Villas",
  },
  {
    number: "20+",
    label: "Destinations",
  },
  {
    number: "4.8",
    label: "Average Rating",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Search & Discover",
    description:
      "Browse our curated collection of luxury villas across India. Filter by location, amenities, and price.",
  },
  {
    step: "2",
    title: "Book Securely",
    description:
      "Select your dates and guests. Complete your booking with our secure payment gateway.",
  },
  {
    step: "3",
    title: "Pack Your Bags",
    description:
      "Receive instant confirmation. Our team will contact you with check-in details and local tips.",
  },
  {
    step: "4",
    title: "Enjoy Your Stay",
    description:
      "Arrive, relax, and enjoy. Our 24/7 support team is always available if you need anything.",
  },
];

export default function WhyZevioPage() {
  const router = useRouter();

  return (
    <div className="why-zevio-page">
      {/* Hero Section */}
      <section className="why-hero">
        <div className="hero-content">
          <h1 className="hero-title">Why Choose Zevio?</h1>
          <p className="hero-description">
            Experience luxury villa stays with unmatched quality, security, and
            service. Discover what makes Zevio India&apos;s most trusted villa
            booking platform.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {benefits.map((benefit, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{benefit.number}</div>
              <div className="stat-label">{benefit.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">What Makes Us Different</h2>
            <p className="section-subtitle">
              We&apos;re committed to providing exceptional villa experiences
              with these core principles
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Booking your dream villa is simple and hassle-free
            </p>
          </div>

          <div className="steps-grid">
            {howItWorks.map((item, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{item.step}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-content">
            <h2 className="trust-title">Your Trust is Our Priority</h2>
            <p className="trust-description">
              Every property listed on Zevio undergoes rigorous quality checks.
              We verify ownership, inspect amenities, and ensure safety
              standards are met. Your perfect vacation starts with our
              commitment to quality.
            </p>
            <div className="trust-features">
              <div className="trust-feature">
                <FiCheckCircle className="trust-icon" />
                <span>Property Verification</span>
              </div>
              <div className="trust-feature">
                <FiCheckCircle className="trust-icon" />
                <span>Secure Payments</span>
              </div>
              <div className="trust-feature">
                <FiCheckCircle className="trust-icon" />
                <span>24/7 Support</span>
              </div>
              <div className="trust-feature">
                <FiCheckCircle className="trust-icon" />
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Experience Luxury?</h2>
          <p className="cta-description">
            Browse our collection of handpicked luxury villas and start planning
            your perfect getaway.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className="cta-button"
          >
            Explore Properties
          </button>
        </div>
      </section>
    </div>
  );
}
