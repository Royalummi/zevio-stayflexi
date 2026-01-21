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
import styles from "./about.module.css";

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
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.aboutHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>About Zevio</h1>
          <p className={styles.heroSubtitle}>
            Redefining Luxury Villa Experiences Across India
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.storySection}>
        <div className={styles.storyContainer}>
          <div className={styles.storyContent}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <div className={styles.storyText}>
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
      <section className={styles.valuesSection}>
        <div className={styles.valuesContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <p className={styles.sectionSubtitle}>
              The principles that guide everything we do
            </p>
          </div>

          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div key={index} className={styles.valueCard}>
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className={styles.milestonesSection}>
        <div className={styles.milestonesContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Journey</h2>
            <p className={styles.sectionSubtitle}>
              Key milestones in our growth story
            </p>
          </div>

          <div className={styles.timeline}>
            {milestones.map((milestone, index) => (
              <div key={index} className={styles.milestoneItem}>
                <div className={styles.milestoneYear}>{milestone.year}</div>
                <div className={styles.milestoneContent}>
                  <h3 className={styles.milestoneTitle}>{milestone.title}</h3>
                  <p className={styles.milestoneDescription}>
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.teamContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Team</h2>
            <p className={styles.sectionSubtitle}>
              The people behind your perfect vacation
            </p>
          </div>

          <div className={styles.teamGrid}>
            {team.map((dept, index) => (
              <div key={index} className={styles.teamCard}>
                <div className={styles.teamIcon}>
                  <FiUsers />
                </div>
                <h3 className={styles.teamName}>{dept.name}</h3>
                <p className={styles.teamDescription}>{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsBanner}>
        <div className={styles.statsBannerContainer}>
          <div className={styles.statItem}>
            <FiMapPin className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>20+</div>
              <div className={styles.statLabel}>Destinations</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <FiShield className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>150+</div>
              <div className={styles.statLabel}>Verified Properties</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <FiUsers className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>Happy Customers</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <FiTrendingUp className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>4.8</div>
              <div className={styles.statLabel}>Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.aboutCta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Join the Zevio Community</h2>
          <p className={styles.ctaDescription}>
            Experience the difference of luxury villa stays curated with care.
            Start planning your perfect getaway today.
          </p>
          <div className={styles.ctaButtons}>
            <button
              onClick={() => router.push("/properties")}
              className={`${styles.ctaButton} ${styles.primary}`}
            >
              Explore Villas
            </button>
            <button
              onClick={() => router.push("/contact")}
              className={`${styles.ctaButton} ${styles.secondary}`}
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
