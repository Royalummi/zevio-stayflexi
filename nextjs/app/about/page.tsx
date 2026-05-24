"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiShield,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiMapPin,
  FiChevronDown,
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
    year: "2025",
    title: "Zevio Founded",
    description:
      "Built to simplify the discovery of trusted villas and service apartments across Bangalore.",
  },
  {
    year: "2025",
    title: "25+ Properties",
    description:
      "Expanded our portfolio to 3 different locations in Bangalore.",
  },
  {
    year: "2025",
    title: "150+ Happy Customers",
    description:
      "Crossed our first 150 happy customers who trusted Zevio for their vacations.",
  },
  {
    year: "2026",
    title: "All Over Bangalore Presence",
    description:
      "Operating in 3+ locations with 25+ verified luxury properties.",
  },
];

const faqs = [
  {
    question: "Are properties verified?",
    answer:
      "Yes! Every property undergoes rigorous safety and quality checks by our team. We ensure secure locks on all entry points. Host identity is also verified.",
  },
  {
    question: "What if I face issues during my stay?",
    answer:
      "Our 24/7 support team is always available to assist you. Contact us immediately if you face any issues. We'll work with the host to resolve problems quickly.",
  },
  {
    question: "Can I cancel or modify my booking? Do you offer refunds?",
    answer:
      "Yes, you can cancel or modify your booking. A 5% cancellation fee applies on all cancellations. If you cancel 10 or more days before check-in, you receive a full refund. If you cancel 7–9 days before check-in, you receive a partial refund. Cancellations within 48 hours of check-in are non-refundable.",
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

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={styles.faqSection}>
      <div className={styles.faqContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Got questions? We&apos;ve got answers
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${openIndex === index ? styles.faqOpen : ""}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <FiChevronDown className={styles.faqIcon} />
              </button>
              {openIndex === index && (
                <div className={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.aboutHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>About Zevio</h1>
          <p className={styles.heroSubtitle}>
            Redefining Villa &amp; Service Apartment Experiences Across
            Bangalore
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
                experiences. We realized that discovering reliable villas and
                service apartments in Bangalore was unnecessarily complicated,
                time-consuming, and often disappointing.
              </p>
              <p>
                Our founders, passionate travelers themselves, experienced
                firsthand the frustration of dealing with unverified properties,
                hidden charges, and poor customer service. They envisioned a
                platform where trust, quality, and transparency would be the
                foundation.
              </p>
              <p>
                Zevio is a next-generation villa booking platform built for
                modern travellers who want more than just a stay. We bring
                together villas and service apartments with verified hosts on
                one trusted platform, making holiday planning smooth and
                stress-free.
              </p>
              <p>
                Today, Zevio is one of Bengaluru&apos;s fastest-growing master
                brands for experiencing truly verified villas and service
                apartments. We personally inspect every property and verify each
                host to ensure every booking meets our highest quality
                standards. With 10+ locations across Bangalore, Zevio delivers
                exactly what you see — and exactly what you experience.
              </p>
              <p>
                Our commitment goes beyond bookings. We&apos;re nurturing a
                community of travelers who seek authenticity, hosts who take
                pride in genuine hospitality, and local partners who share our
                vision for sustainable tourism.
              </p>
              <p>
                Our goal is to become the most loved villa booking platform by
                offering handpicked properties, transparent pricing, and
                personalised support for both guests and hosts.
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
              <div key={index} className={styles.valueGridItem}>
                <div className={styles.valueIconWrap}>
                  <div className={styles.valueIcon}>{value.icon}</div>
                </div>
                <div className={styles.valueContent}>
                  <h3 className={styles.valueTitle}>{value.title}</h3>
                  <p className={styles.valueDescription}>{value.description}</p>
                </div>
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
              <div className={styles.statNumber}>3+</div>
              <div className={styles.statLabel}>Locations</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <FiShield className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>25+</div>
              <div className={styles.statLabel}>Verified Properties</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <FiUsers className={styles.statIcon} />
            <div className={styles.statContent}>
              <div className={styles.statNumber}>150+</div>
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

      {/* FAQ Section */}
      <FaqSection />

      {/* CTA Section */}
      <section className={styles.aboutCta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Join the Zevio Community</h2>
          <p className={styles.ctaDescription}>
            Experience the difference of verified villa stays curated with care.
            Start planning your perfect getaway today.
          </p>
          <div className={styles.ctaButtons}>
            <button
              onClick={() => router.push("/villas")}
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
