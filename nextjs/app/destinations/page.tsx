"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMapPin, FiArrowRight, FiClock } from "react-icons/fi";
import { api } from "@/lib/axios";
import styles from "./destinations.module.css";

interface Destination {
  id: number;
  name: string;
  area: string;
  description: string;
  image: string;
  properties: number;
  highlights: string[];
  comingSoon?: boolean;
}

const destinationsData: Destination[] = [
  {
    id: 1,
    name: "Nandi Hills",
    area: "Nandi Hills",
    description:
      "Scenic hilltop retreat perfect for sunrise views and weekend getaways",
    image:
      "https://images.unsplash.com/photo-1606145005479-747938dfd432?w=800&q=80",
    properties: 0,
    highlights: [
      "Hilltop Views",
      "Sunrise Point",
      "Nature Trails",
      "Weekend Getaway",
    ],
  },
  {
    id: 2,
    name: "Bangalore Airport",
    area: "Bangalore International Airport",
    description:
      "Convenient stays near Kempegowda International Airport for travellers",
    image:
      "https://images.unsplash.com/photo-1664892843718-186acc045805?w=800&q=80",
    properties: 0,
    highlights: [
      "Airport Proximity",
      "Transit Stays",
      "Business Travel",
      "Connectivity",
    ],
  },
  {
    id: 3,
    name: "Hosur",
    area: "Hosur",
    description:
      "Fast-growing city on the Bangalore-Chennai highway with scenic green surroundings",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    properties: 0,
    highlights: [
      "Highway Connectivity",
      "Near Bangalore",
      "Industrial Hub",
      "Scenic Surroundings",
    ],
  },
  {
    id: 4,
    name: "Whitefield",
    area: "Whitefield",
    description:
      "Thriving tech corridor with modern amenities and green spaces",
    image:
      "https://images.unsplash.com/photo-1627306036351-036986f292a9?w=800&q=80",
    properties: 0,
    highlights: ["Tech Hub", "Modern Living", "Parks", "Corporate Stays"],
  },
  {
    id: 5,
    name: "Koramangala",
    area: "Koramangala",
    description:
      "Vibrant urban neighbourhood with cafes, startups, and nightlife",
    image:
      "https://images.unsplash.com/photo-1708067077797-74f83eaa8231?w=800&q=80",
    properties: 0,
    highlights: ["Cafes", "Nightlife", "Shopping", "Urban Living"],
  },
  // HIDDEN: re-enable when needed
  // {
  //   id: 6,
  //   name: "Ramanagar",
  //   area: "Ramanagar",
  //   description: "Adventure hub famous for rocky hills, trekking, and rappelling",
  //   image: "https://images.unsplash.com/photo-1675780385252-14b6a7287a22?w=800&q=80",
  //   properties: 0,
  //   highlights: ["Rock Climbing", "Trekking", "Adventure Sports", "Nature"],
  // },
  // {
  //   id: 7,
  //   name: "Electronic City",
  //   area: "Electronic City",
  //   description: "Major IT hub with excellent connectivity and modern infrastructure",
  //   image: "https://images.unsplash.com/photo-1741769971460-aad286ffe96b?w=800&q=80",
  //   properties: 0,
  //   highlights: ["IT Corridor", "Business Hub", "Metro Access", "Modern Amenities"],
  // },
  // {
  //   id: 8,
  //   name: "Indiranagar",
  //   area: "Indiranagar",
  //   description: "Upscale neighbourhood known for trendy restaurants and boutiques",
  //   image: "https://images.unsplash.com/photo-1737450768947-30d0abebe63e?w=800&q=80",
  //   properties: 0,
  //   highlights: ["Restaurants", "Boutiques", "Pubs", "Art & Culture"],
  //   comingSoon: true,
  // },
];

export default function DestinationsPage() {
  const router = useRouter();
  const [destinations, setDestinations] =
    useState<Destination[]>(destinationsData);

  // Fetch dynamic property counts from API
  useEffect(() => {
    const fetchAreaCounts = async () => {
      try {
        const response = await api.get("/public/areas");
        const areas = response.data?.data?.areas || [];

        setDestinations((prev) =>
          prev.map((dest) => {
            const match = areas.find(
              (a: { area: string; property_count: number }) =>
                a.area.toLowerCase() === dest.area.toLowerCase(),
            );
            return match ? { ...dest, properties: match.property_count } : dest;
          }),
        );
      } catch (error) {
        console.error("Error fetching area counts:", error);
      }
    };

    fetchAreaCounts();
  }, []);

  const handleDestinationClick = (destination: Destination) => {
    if (destination.comingSoon) {
      router.push(`/villas?area=${encodeURIComponent(destination.area)}`);
      return;
    }
    router.push(`/villas?area=${encodeURIComponent(destination.area)}`);
  };

  return (
    <div className={styles.destinationsPage}>
      {/* Hero Section */}
      <section className={styles.destinationsHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Explore Destinations</h1>
          <p className={styles.heroDescription}>
            Discover luxury villas and service apartments near Bangalore&apos;s
            most popular locations, curated for unforgettable stays.
          </p>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className={styles.destinationsSection}>
        <div className={styles.destinationsContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Popular Destinations</h2>
            <p className={styles.sectionSubtitle}>
              {destinations.length} destinations near Bangalore
            </p>
          </div>

          <div className={styles.destinationsGrid}>
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className={`${styles.destinationCard} ${destination.comingSoon ? styles.comingSoonCard : ""}`}
                onClick={() => handleDestinationClick(destination)}
              >
                <div className={styles.destinationImageWrapper}>
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    width={400}
                    height={300}
                    className={styles.destinationImage}
                    style={{ objectFit: "cover" }}
                  />
                  {destination.comingSoon && (
                    <div className={styles.comingSoonBadge}>
                      <FiClock />
                      Coming Soon
                    </div>
                  )}
                  <div className={styles.destinationOverlay}>
                    <button className={styles.exploreBtn}>
                      {destination.comingSoon ? "Coming Soon" : "Explore"}{" "}
                      <FiArrowRight />
                    </button>
                  </div>
                </div>

                <div className={styles.destinationContent}>
                  <div className={styles.destinationHeader}>
                    <div className={styles.destinationLocation}>
                      <FiMapPin className={styles.locationIcon} />
                      <div>
                        <h3 className={styles.destinationCity}>
                          {destination.name}
                        </h3>
                        <p className={styles.destinationState}>
                          Bengaluru, Karnataka
                        </p>
                      </div>
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
                      {destination.comingSoon
                        ? "Coming Soon"
                        : `${destination.properties} ${destination.properties === 1 ? "property" : "properties"}`}
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
