"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiShield,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiMapPin,
} from "react-icons/fi";
import "./about.css";

const values = [
  {
    icon: <FiHeart />,
    title: "Customer First",
    description:
      "Every decision we make prioritizes our customers' comfort, safety, and satisfaction. Your perfect vacation is our mission.",
  },
  {
    icon: <FiShield />,
    title: "Trust & Transparency",
    description:
      "We believe in honest communication, verified properties, and transparent pricing. No surprises, only delightful experiences.",
  },
  {
    icon: <FiUsers />,
    title: "Community Driven",
    description:
      "We build lasting relationships with property owners, local communities, and travelers. Together, we create memorable experiences.",
  },
  {
    icon: <FiAward />,
    title: "Quality Excellence",
    description:
      "We maintain the highest standards in property selection, customer service, and overall experience. Excellence is our baseline.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "Zevio Founded",
    description:
      "Started with a vision to make luxury villa stays accessible across India.",
  },
  {
    year: "2024",
    title: "50+ Properties",
    description:
      "Expanded our portfolio across Goa, Rajasthan, Himachal Pradesh, and more.",
  },
  {
    year: "2024",
    title: "1000+ Bookings",
    description:
      "Crossed our first thousand happy customers who trusted Zevio for their vacations.",
  },
  {
    year: "2025",
    title: "Pan-India Presence",
    description:
      "Operating in 20+ destinations with 150+ verified luxury properties.",
  },
];

const team = [
  {
    name: "Leadership Team",
    description:
      "Experienced professionals from hospitality, technology, and real estate sectors driving Zevio's vision.",
  },
  {
    name: "Operations Team",
    description:
      "Dedicated specialists ensuring seamless bookings, property verifications, and customer support.",
  },
  {
    name: "Customer Support",
    description:
      "24/7 support team committed to resolving queries and ensuring every stay is perfect.",
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">About Zevio</h1>
          <p className="hero-subtitle">
            Redefining Luxury Villa Experiences Across India
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-content">
            <h2 className="section-title">Our Story</h2>
            <div className="story-text">
              <p>
                Zevio was born from a simple observation: travelers deserved
                better. Better properties, better service, and better
                experiences. We noticed that finding reliable, luxury villas in
                India was complicated, time-consuming, and often disappointing.
              </p>
              <p>
                Our founders, passionate travelers themselves, experienced
                firsthand the frustration of dealing with unverified properties,
                hidden charges, and poor customer service. They envisioned a
                platform where trust, quality, and transparency would be the
                foundation.
              </p>
              <p>
                Today, Zevio is India&apos;s fastest-growing luxury villa
                booking platform. We personally inspect every property, verify
                every host, and ensure every booking meets our rigorous quality
                standards. From serene beaches in Goa to majestic palaces in
                Rajasthan, from mountain retreats in Manali to backwater havens
                in Kerala - we bring you the finest accommodations with
                unmatched service.
              </p>
              <p>
                Our commitment goes beyond bookings. We&apos;re building a
                community of travelers who value authenticity, property owners
                who take pride in hospitality, and local partners who share our
                vision of sustainable tourism.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-container">
          <div className="section-header">
            <h2 className="section-title">Our Values</h2>
            <p className="section-subtitle">
              The principles that guide everything we do
            </p>
          </div>

          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="milestones-section">
        <div className="milestones-container">
          <div className="section-header">
            <h2 className="section-title">Our Journey</h2>
            <p className="section-subtitle">
              Key milestones in our growth story
            </p>
          </div>

          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={index} className="milestone-item">
                <div className="milestone-year">{milestone.year}</div>
                <div className="milestone-content">
                  <h3 className="milestone-title">{milestone.title}</h3>
                  <p className="milestone-description">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-container">
          <div className="section-header">
            <h2 className="section-title">Our Team</h2>
            <p className="section-subtitle">
              The people behind your perfect vacation
            </p>
          </div>

          <div className="team-grid">
            {team.map((dept, index) => (
              <div key={index} className="team-card">
                <div className="team-icon">
                  <FiUsers />
                </div>
                <h3 className="team-name">{dept.name}</h3>
                <p className="team-description">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-banner">
        <div className="stats-banner-container">
          <div className="stat-item">
            <FiMapPin className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">20+</div>
              <div className="stat-label">Destinations</div>
            </div>
          </div>
          <div className="stat-item">
            <FiShield className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">150+</div>
              <div className="stat-label">Verified Properties</div>
            </div>
          </div>
          <div className="stat-item">
            <FiUsers className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
          </div>
          <div className="stat-item">
            <FiTrendingUp className="stat-icon" />
            <div className="stat-content">
              <div className="stat-number">4.8</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h2 className="cta-title">Join the Zevio Community</h2>
          <p className="cta-description">
            Experience the difference of luxury villa stays curated with care.
            Start planning your perfect getaway today.
          </p>
          <div className="cta-buttons">
            <button
              onClick={() => router.push("/properties")}
              className="cta-button primary"
            >
              Explore Villas
            </button>
            <button
              onClick={() => router.push("/contact")}
              className="cta-button secondary"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
