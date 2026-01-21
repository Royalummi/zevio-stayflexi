"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMapPin, FiArrowRight, FiStar } from "react-icons/fi";
import styles from "./destinations.module.css";

const destinations = [
  {
    id: 1,
    city: "Goa",
    state: "Goa",
    description: "Beaches, nightlife, and Portuguese heritage",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
    properties: 45,
    rating: 4.8,
    highlights: ["Beaches", "Water Sports", "Nightlife", "Heritage Sites"],
  },
  {
    id: 2,
    city: "Udaipur",
    state: "Rajasthan",
    description: "City of lakes and royal palaces",
    image:
      "https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80",
    properties: 32,
    rating: 4.9,
    highlights: ["Lake Views", "Palaces", "Culture", "Romantic Getaways"],
  },
  {
    id: 3,
    city: "Manali",
    state: "Himachal Pradesh",
    description: "Mountain paradise for adventure lovers",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    properties: 38,
    rating: 4.7,
    highlights: ["Mountains", "Trekking", "Skiing", "Nature"],
  },
  {
    id: 4,
    city: "Coorg",
    state: "Karnataka",
    description: "Scotland of India with coffee plantations",
    image:
      "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800&q=80",
    properties: 28,
    rating: 4.8,
    highlights: ["Coffee Estates", "Waterfalls", "Wildlife", "Trekking"],
  },
  {
    id: 5,
    city: "Jaipur",
    state: "Rajasthan",
    description: "Pink city with magnificent forts",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
    properties: 41,
    rating: 4.7,
    highlights: ["Forts", "Markets", "Heritage", "Architecture"],
  },
  {
    id: 6,
    city: "Ooty",
    state: "Tamil Nadu",
    description: "Queen of hill stations",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
    properties: 35,
    rating: 4.6,
    highlights: ["Tea Gardens", "Toy Train", "Hills", "Gardens"],
  },
  {
    id: 7,
    city: "Rishikesh",
    state: "Uttarakhand",
    description: "Yoga capital and adventure hub",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    properties: 26,
    rating: 4.8,
    highlights: ["Yoga", "Rafting", "Spirituality", "Adventure"],
  },
  {
    id: 8,
    city: "Shimla",
    state: "Himachal Pradesh",
    description: "Colonial charm and scenic beauty",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    properties: 33,
    rating: 4.6,
    highlights: ["Colonial Architecture", "Mall Road", "Hills", "Snow"],
  },
  {
    id: 9,
    city: "Munnar",
    state: "Kerala",
    description: "Tea plantations and misty mountains",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80",
    properties: 29,
    rating: 4.7,
    highlights: ["Tea Estates", "Waterfalls", "Wildlife", "Honeymoon"],
  },
  {
    id: 10,
    city: "Alleppey",
    state: "Kerala",
    description: "Venice of the East with backwaters",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
    properties: 24,
    rating: 4.8,
    highlights: ["Houseboats", "Backwaters", "Beach", "Cuisine"],
  },
  {
    id: 11,
    city: "Lonavala",
    state: "Maharashtra",
    description: "Hill station near Mumbai and Pune",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    properties: 31,
    rating: 4.5,
    highlights: ["Waterfalls", "Caves", "Forts", "Weekend Getaway"],
  },
  {
    id: 12,
    city: "Nainital",
    state: "Uttarakhand",
    description: "Lake district of India",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    properties: 27,
    rating: 4.7,
    highlights: ["Naini Lake", "Boating", "Hills", "Cable Car"],
  },
];

export default function DestinationsPage() {
  const router = useRouter();

  const handleDestinationClick = (city: string) => {
    router.push(`/properties?city=${city.toLowerCase()}`);
  };

  return (
    <div className={styles.destinationsPage}>
      {/* Hero Section */}
      <section className={styles.destinationsHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Explore Destinations</h1>
          <p className={styles.heroDescription}>
            Discover luxury villas across India&apos;s most beautiful locations.
            From serene beaches to majestic mountains, find your perfect
            getaway.
          </p>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className={styles.destinationsSection}>
        <div className={styles.destinationsContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Popular Destinations</h2>
            <p className={styles.sectionSubtitle}>
              {destinations.length} incredible destinations across India
            </p>
          </div>

          <div className={styles.destinationsGrid}>
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className={styles.destinationCard}
                onClick={() => handleDestinationClick(destination.city)}
              >
                <div className={styles.destinationImageWrapper}>
                  <Image
                    src={destination.image}
                    alt={`${destination.city}, ${destination.state}`}
                    width={400}
                    height={300}
                    className={styles.destinationImage}
                    style={{ objectFit: "cover" }}
                  />
                  <div className={styles.destinationOverlay}>
                    <button className={styles.exploreBtn}>
                      Explore <FiArrowRight />
                    </button>
                  </div>
                </div>

                <div className={styles.destinationContent}>
                  <div className={styles.destinationHeader}>
                    <div className={styles.destinationLocation}>
                      <FiMapPin className={styles.locationIcon} />
                      <div>
                        <h3 className={styles.destinationCity}>
                          {destination.city}
                        </h3>
                        <p className={styles.destinationState}>
                          {destination.state}
                        </p>
                      </div>
                    </div>
                    <div className={styles.destinationRating}>
                      <FiStar className={styles.starIcon} />
                      <span>{destination.rating}</span>
                    </div>
                  </div>

                  <p className={styles.destinationDescription}>
                    {destination.description}
                  </p>

                  <div className={styles.destinationHighlights}>
                    {destination.highlights.map((highlight, index) => (
                      <span key={index} className={styles.highlightTag}>
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className={styles.destinationFooter}>
                    <span className={styles.propertiesCount}>
                      {destination.properties} properties
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.destinationsCta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Can&apos;t Find Your Destination?</h2>
          <p className={styles.ctaDescription}>
            We&apos;re constantly adding new locations. Contact us to request a
            destination.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className={styles.ctaButton}
          >
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
}
