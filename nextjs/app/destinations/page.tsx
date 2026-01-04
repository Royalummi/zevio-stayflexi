"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMapPin, FiArrowRight, FiStar } from "react-icons/fi";
import "./destinations.css";

const destinations = [
  {
    id: 1,
    city: "Goa",
    state: "Goa",
    description: "Beaches, nightlife, and Portuguese heritage",
    image: "/images/destinations/goa.jpg",
    properties: 45,
    rating: 4.8,
    highlights: ["Beaches", "Water Sports", "Nightlife", "Heritage Sites"],
  },
  {
    id: 2,
    city: "Udaipur",
    state: "Rajasthan",
    description: "City of lakes and royal palaces",
    image: "/images/destinations/udaipur.jpg",
    properties: 32,
    rating: 4.9,
    highlights: ["Lake Views", "Palaces", "Culture", "Romantic Getaways"],
  },
  {
    id: 3,
    city: "Manali",
    state: "Himachal Pradesh",
    description: "Mountain paradise for adventure lovers",
    image: "/images/destinations/manali.jpg",
    properties: 38,
    rating: 4.7,
    highlights: ["Mountains", "Trekking", "Skiing", "Nature"],
  },
  {
    id: 4,
    city: "Coorg",
    state: "Karnataka",
    description: "Scotland of India with coffee plantations",
    image: "/images/destinations/coorg.jpg",
    properties: 28,
    rating: 4.8,
    highlights: ["Coffee Estates", "Waterfalls", "Wildlife", "Trekking"],
  },
  {
    id: 5,
    city: "Jaipur",
    state: "Rajasthan",
    description: "Pink city with magnificent forts",
    image: "/images/destinations/jaipur.jpg",
    properties: 41,
    rating: 4.7,
    highlights: ["Forts", "Markets", "Heritage", "Architecture"],
  },
  {
    id: 6,
    city: "Ooty",
    state: "Tamil Nadu",
    description: "Queen of hill stations",
    image: "/images/destinations/ooty.jpg",
    properties: 35,
    rating: 4.6,
    highlights: ["Tea Gardens", "Toy Train", "Hills", "Gardens"],
  },
  {
    id: 7,
    city: "Rishikesh",
    state: "Uttarakhand",
    description: "Yoga capital and adventure hub",
    image: "/images/destinations/rishikesh.jpg",
    properties: 26,
    rating: 4.8,
    highlights: ["Yoga", "Rafting", "Spirituality", "Adventure"],
  },
  {
    id: 8,
    city: "Shimla",
    state: "Himachal Pradesh",
    description: "Colonial charm and scenic beauty",
    image: "/images/destinations/shimla.jpg",
    properties: 33,
    rating: 4.6,
    highlights: ["Colonial Architecture", "Mall Road", "Hills", "Snow"],
  },
  {
    id: 9,
    city: "Munnar",
    state: "Kerala",
    description: "Tea plantations and misty mountains",
    image: "/images/destinations/munnar.jpg",
    properties: 29,
    rating: 4.7,
    highlights: ["Tea Estates", "Waterfalls", "Wildlife", "Honeymoon"],
  },
  {
    id: 10,
    city: "Alleppey",
    state: "Kerala",
    description: "Venice of the East with backwaters",
    image: "/images/destinations/alleppey.jpg",
    properties: 24,
    rating: 4.8,
    highlights: ["Houseboats", "Backwaters", "Beach", "Cuisine"],
  },
  {
    id: 11,
    city: "Lonavala",
    state: "Maharashtra",
    description: "Hill station near Mumbai and Pune",
    image: "/images/destinations/lonavala.jpg",
    properties: 31,
    rating: 4.5,
    highlights: ["Waterfalls", "Caves", "Forts", "Weekend Getaway"],
  },
  {
    id: 12,
    city: "Nainital",
    state: "Uttarakhand",
    description: "Lake district of India",
    image: "/images/destinations/nainital.jpg",
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
    <div className="destinations-page">
      {/* Hero Section */}
      <section className="destinations-hero">
        <div className="hero-content">
          <h1 className="hero-title">Explore Destinations</h1>
          <p className="hero-description">
            Discover luxury villas across India&apos;s most beautiful locations.
            From serene beaches to majestic mountains, find your perfect
            getaway.
          </p>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="destinations-section">
        <div className="destinations-container">
          <div className="section-header">
            <h2 className="section-title">Popular Destinations</h2>
            <p className="section-subtitle">
              {destinations.length} incredible destinations across India
            </p>
          </div>

          <div className="destinations-grid">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="destination-card"
                onClick={() => handleDestinationClick(destination.city)}
              >
                <div className="destination-image-wrapper">
                  <Image
                    src={destination.image}
                    alt={`${destination.city}, ${destination.state}`}
                    width={400}
                    height={300}
                    className="destination-image"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="destination-overlay">
                    <button className="explore-btn">
                      Explore <FiArrowRight />
                    </button>
                  </div>
                </div>

                <div className="destination-content">
                  <div className="destination-header">
                    <div className="destination-location">
                      <FiMapPin className="location-icon" />
                      <div>
                        <h3 className="destination-city">{destination.city}</h3>
                        <p className="destination-state">{destination.state}</p>
                      </div>
                    </div>
                    <div className="destination-rating">
                      <FiStar className="star-icon" />
                      <span>{destination.rating}</span>
                    </div>
                  </div>

                  <p className="destination-description">
                    {destination.description}
                  </p>

                  <div className="destination-highlights">
                    {destination.highlights.map((highlight, index) => (
                      <span key={index} className="highlight-tag">
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="destination-footer">
                    <span className="properties-count">
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
      <section className="destinations-cta">
        <div className="cta-content">
          <h2 className="cta-title">Can&apos;t Find Your Destination?</h2>
          <p className="cta-description">
            We&apos;re constantly adding new locations. Contact us to request a
            destination.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="cta-button"
          >
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
}
