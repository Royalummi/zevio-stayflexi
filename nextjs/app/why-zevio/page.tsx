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
import styles from "./why-zevio.module.css";

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
    <div className={styles.whyZevioPage}>
      {/* Hero Section */}
      <section className={styles.whyHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Why Choose Zevio?</h1>
          <p className={styles.heroDescription}>
            Experience luxury villa stays with unmatched quality, security, and
            service. Discover what makes Zevio India&apos;s most trusted villa
            booking platform.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          {benefits.map((benefit, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statNumber}>{benefit.number}</div>
              <div className={styles.statLabel}>{benefit.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What Makes Us Different</h2>
            <p className={styles.sectionSubtitle}>
              We&apos;re committed to providing exceptional villa experiences
              with these core principles
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.howItWorksContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>
              Booking your dream villa is simple and hassle-free
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {howItWorks.map((item, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className={styles.trustSection}>
        <div className={styles.trustContainer}>
          <div className={styles.trustContent}>
            <h2 className={styles.trustTitle}>Your Trust is Our Priority</h2>
            <p className={styles.trustDescription}>
              Every property listed on Zevio undergoes rigorous quality checks.
              We verify ownership, inspect amenities, and ensure safety
              standards are met. Your perfect vacation starts with our
              commitment to quality.
            </p>
            <div className={styles.trustFeatures}>
              <div className={styles.trustFeature}>
                <FiCheckCircle className={styles.trustIcon} />
                <span>Property Verification</span>
              </div>
              <div className={styles.trustFeature}>
                <FiCheckCircle className={styles.trustIcon} />
                <span>Secure Payments</span>
              </div>
              <div className={styles.trustFeature}>
                <FiCheckCircle className={styles.trustIcon} />
                <span>24/7 Support</span>
              </div>
              <div className={styles.trustFeature}>
                <FiCheckCircle className={styles.trustIcon} />
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Experience Luxury?</h2>
          <p className={styles.ctaDescription}>
            Browse our collection of handpicked luxury villas and start planning
            your perfect getaway.
          </p>
          <button
            onClick={() => router.push("/properties")}
            className={styles.ctaButton}
          >
            Explore Properties
          </button>
        </div>
      </section>
    </div>
  );
}
