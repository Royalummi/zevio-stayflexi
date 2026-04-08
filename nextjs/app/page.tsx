import Image from "next/image";
import Link from "next/link";
import { FiShield, FiDollarSign, FiHeadphones } from "react-icons/fi";
import SearchBar from "@/components/home/SearchBar";
import FloatingElements from "@/components/home/FloatingElements";
import RecommendedProperties from "@/components/home/RecommendedProperties";

const destinations = [
  {
    name: "Nandi Hills",
    image:
      "https://images.unsplash.com/photo-1606145005479-747938dfd432?w=800&q=80",
  },
  {
    name: "Bangalore Airport",
    area: "Bangalore International Airport",
    image:
      "https://images.unsplash.com/photo-1664892843718-186acc045805?w=800&q=80",
  },
  {
    name: "Ramanagar",
    image:
      "https://images.unsplash.com/photo-1675780385252-14b6a7287a22?w=800&q=80",
  },
  {
    name: "Koramangala",
    image:
      "https://images.unsplash.com/photo-1708067077797-74f83eaa8231?w=800&q=80",
  },
  {
    name: "Whitefield",
    image:
      "https://images.unsplash.com/photo-1627306036351-036986f292a9?w=800&q=80",
  },
  {
    name: "Electronic City",
    image:
      "https://images.unsplash.com/photo-1741769971460-aad286ffe96b?w=800&q=80",
  },
  {
    name: "Indiranagar",
    image:
      "https://images.unsplash.com/photo-1737450768947-30d0abebe63e?w=800&q=80",
    comingSoon: true,
  },
];

export default async function Home() {
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
              Stay Beyond Ordinary{" "}
              <span
                className="hero-title-gradient"
                style={{
                  display: "inline-block",
                }}
              >
                Book Your Stay
              </span>
            </h1>
          </div>

          {/* Unified Search Bar */}
          <SearchBar />
        </div>
      </section>

      {/* Popular Destinations */}
      <section id="destinations" className="section bg-gray">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Top picks</span>
            <h2 className="section-title">Inspiration for your next trip</h2>
            <p className="section-description">
              Discover villas near Bangalore&apos;s most sought-after locations
              curated for unforgettable stays.
            </p>
          </div>

          <div className="grid grid-2 grid-4">
            {destinations.map((destination) => (
              <Link
                key={destination.name}
                href={`/properties?area=${encodeURIComponent(destination.area || destination.name)}`}
                className="destination-card"
              >
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
                />
                <div className="destination-overlay" />
                {destination.comingSoon && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      background: "#1F3A5F",
                      color: "#fff",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "50px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      zIndex: 2,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
                <div className="destination-name">{destination.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Villas */}
      <RecommendedProperties
        className="bg-white"
        propertyType="villa"
        title="Recommended Villas for You"
        description="Hand-picked luxury villas curated by our experts for exceptional experiences"
      />

      {/* Recommended Service Apartments */}
      <RecommendedProperties
        className="bg-gray"
        propertyType="service_apartment"
        title="Recommended Service Apartments"
        description="Premium service apartments perfect for extended stays and corporate bookings"
      />

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
