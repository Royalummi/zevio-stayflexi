import Image from "next/image";
import Link from "next/link";
import { getCities } from "@/lib/api";
import { FiShield, FiDollarSign, FiHeadphones } from "react-icons/fi";
import SearchBar from "@/components/home/SearchBar";
import FloatingElements from "@/components/home/FloatingElements";

const destinations = [
  {
    name: "Goa",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
  },
  {
    name: "Jaipur",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
  },
  {
    name: "Alibaug",
    image:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
  },
  {
    name: "Lonavala",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  },
];

export default async function Home() {
  // Fetch cities with graceful fallback if backend is unavailable
  const cities = await getCities();

  return (
    <>
      {/* Hero Section */}
      <section
        id="hero"
        className="hero"
        style={{ position: "relative", overflow: "visible" }}
      >
        {/* Background Pattern */}

        {/* Floating Animated Elements */}
        <FloatingElements />

        <div
          className="container hero-content"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="hero-text">
            <p className="hero-badge">Discover your dream villa with Zevio</p>
            <h1 className="hero-title">
              Find your perfect{" "}
              <span
                className="hero-title-gradient"
                style={{
                  display: "inline-block",
                }}
              >
                getaway
              </span>
            </h1>
          </div>

          {/* Unified Search Bar */}
          <SearchBar cities={cities} />
        </div>
      </section>

      {/* Popular Destinations */}
      <section id="destinations" className="section bg-gray">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Top picks</span>
            <h2 className="section-title">Inspiration for your next trip</h2>
            <p className="section-description">
              Discover villas in India&apos;s most sought-after destinations
              curated for unforgettable stays.
            </p>
          </div>

          <div className="grid grid-2 grid-4">
            {destinations.map((destination) => (
              <Link
                key={destination.name}
                href={`/properties?city=${destination.name.toLowerCase()}`}
                className="destination-card"
              >
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
                />
                <div className="destination-overlay" />
                <div className="destination-name">{destination.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Zevio */}
      <section id="why-zevio" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">The Zevio promise</span>
            <h2 className="section-title">Why guests choose Zevio</h2>
            <p className="section-description">
              We&apos;re committed to providing exceptional experiences with
              verified stays, transparent pricing, and dedicated support.
            </p>
          </div>

          <div className="grid grid-3">
            <article className="card">
              <div className="card-icon card-icon-blue">
                <FiShield size={28} />
              </div>
              <div>
                <h3 className="card-title">Verified Properties</h3>
                <p className="card-text">
                  Every villa is personally inspected and certified to meet our
                  hospitality, safety, and design standards.
                </p>
              </div>
            </article>

            <article className="card">
              <div className="card-icon card-icon-green">
                <FiDollarSign size={28} />
              </div>
              <div>
                <h3 className="card-title">Best Price Guarantee</h3>
                <p className="card-text">
                  Transparent pricing with no hidden fees, curated offers, and
                  flexible payment options for every stay.
                </p>
              </div>
            </article>

            <article className="card">
              <div className="card-icon card-icon-blue">
                <FiHeadphones size={28} />
              </div>
              <div>
                <h3 className="card-title">24/7 Guest Support</h3>
                <p className="card-text">
                  A dedicated concierge team to handle planning, in-stay
                  assistance, and last-minute requests around the clock.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="support"
        className="section cta-section"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div className="container flex flex-col gap-6 md:gap-8 items-center px-4 md:px-8">
          <h2 className="cta-title">Ready to start your adventure?</h2>
          <p className="cta-description">
            Browse thousands of verified luxury villas, create tailored
            itineraries, and enjoy a seamless booking experience from search to
            stay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/properties"
              className="btn btn-white btn-lg w-full sm:w-auto"
            >
              Explore Properties
            </Link>
            <Link
              href="#why-zevio"
              className="btn btn-lg w-full sm:w-auto"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(10px)",
              }}
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
