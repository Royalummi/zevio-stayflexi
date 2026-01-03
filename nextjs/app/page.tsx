import Image from "next/image";
import Link from "next/link";
import { getCities } from "@/lib/api";
import SearchBar from "@/components/home/SearchBar";
import { FiShield, FiDollarSign, FiHeadphones } from "react-icons/fi";

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
  const cities = await getCities();
  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="hero">
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            opacity: "0.1",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "16rem",
              height: "16rem",
              top: "0",
              left: "0",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%)",
              background: "white",
              filter: "blur(48px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "24rem",
              height: "24rem",
              bottom: "0",
              right: "0",
              transform: "translate(50%, 50%)",
              borderRadius: "50%",
              background: "white",
              filter: "blur(48px)",
            }}
          />
        </div>

        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">Premium Villa Stays</span>
            <h1 className="hero-title">
              Find your perfect{" "}
              <span
                className="hero-title-gradient"
                style={{
                  display: "inline-block",
                }}
              >
                villa getaway
              </span>
            </h1>
            <p className="hero-description">
              Discover handpicked luxury villas across India&apos;s most
              beautiful destinations. Book with confidence and enjoy
              concierge-level support at every step.
            </p>
          </div>

          {/* Search Bar */}
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
              <div className="card-icon card-icon-primary">
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
        className="section"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div className="container flex flex-col gap-8 items-center">
          <h2
            style={{
              fontSize: "48px",
              fontWeight: "900",
              lineHeight: "1.2",
              maxWidth: "900px",
            }}
          >
            Ready to start your adventure?
          </h2>
          <p
            style={{
              fontSize: "20px",
              lineHeight: "1.8",
              opacity: "0.95",
              maxWidth: "800px",
            }}
          >
            Browse thousands of verified luxury villas, create tailored
            itineraries, and enjoy a seamless booking experience from search to
            stay.
          </p>
          <div className="flex gap-4">
            <Link href="/properties" className="btn btn-secondary btn-lg">
              Explore Properties
            </Link>
            <Link
              href="#why-zevio"
              className="btn btn-lg"
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
