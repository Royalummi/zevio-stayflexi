import Image from "next/image";
import Link from "next/link";
import { getCities } from "@/lib/api";
import { FiShield, FiDollarSign, FiHeadphones } from "react-icons/fi";
import SearchBar from "@/components/home/SearchBar";

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

        {/* Decorative Elements - Bottom Left */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            opacity: 0.08,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Modern Villa Outline */}
            <path
              d="M50 200 L200 120 L350 200 L350 350 L50 350 Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Roof Detail */}
            <path
              d="M200 120 L200 80 L240 80 L240 100"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Main Entrance */}
            <rect
              x="170"
              y="280"
              width="60"
              height="70"
              stroke="white"
              strokeWidth="2.5"
              rx="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Windows - Left Side */}
            <rect
              x="80"
              y="220"
              width="50"
              height="50"
              stroke="white"
              strokeWidth="2"
              rx="4"
            />
            <line
              x1="105"
              y1="220"
              x2="105"
              y2="270"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="80"
              y1="245"
              x2="130"
              y2="245"
              stroke="white"
              strokeWidth="2"
            />

            <rect
              x="80"
              y="285"
              width="50"
              height="50"
              stroke="white"
              strokeWidth="2"
              rx="4"
            />
            <line
              x1="105"
              y1="285"
              x2="105"
              y2="335"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="80"
              y1="310"
              x2="130"
              y2="310"
              stroke="white"
              strokeWidth="2"
            />

            {/* Windows - Right Side */}
            <rect
              x="270"
              y="220"
              width="50"
              height="50"
              stroke="white"
              strokeWidth="2"
              rx="4"
            />
            <line
              x1="295"
              y1="220"
              x2="295"
              y2="270"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="270"
              y1="245"
              x2="320"
              y2="245"
              stroke="white"
              strokeWidth="2"
            />

            <rect
              x="270"
              y="285"
              width="50"
              height="50"
              stroke="white"
              strokeWidth="2"
              rx="4"
            />
            <line
              x1="295"
              y1="285"
              x2="295"
              y2="335"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="270"
              y1="310"
              x2="320"
              y2="310"
              stroke="white"
              strokeWidth="2"
            />

            {/* Palm Trees */}
            <g transform="translate(20, 250)">
              <line
                x1="15"
                y1="80"
                x2="15"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M15 20 Q5 15 0 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 20 Q10 10 8 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 20 Q20 10 22 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 20 Q25 15 30 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            <g transform="translate(350, 260)">
              <line
                x1="15"
                y1="70"
                x2="15"
                y2="15"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M15 15 Q5 12 0 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 15 Q10 8 8 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 15 Q20 8 22 0"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 15 Q25 12 30 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Decorative circles */}
            <circle
              cx="30"
              cy="180"
              r="4"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="370"
              cy="200"
              r="3"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="340"
              cy="150"
              r="5"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

        {/* Decorative Elements - Bottom Right */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            opacity: 0.08,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <svg
            width="450"
            height="400"
            viewBox="0 0 450 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Modern Geometric Buildings */}
            <path
              d="M50 150 L50 350 L140 350 L140 150 Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M160 120 L160 350 L270 350 L270 120 Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M290 180 L290 350 L370 350 L370 180 Z"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Building Details - Grid Windows */}
            {/* Building 1 */}
            <line
              x1="70"
              y1="170"
              x2="120"
              y2="170"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="200"
              x2="120"
              y2="200"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="230"
              x2="120"
              y2="230"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="260"
              x2="120"
              y2="260"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="290"
              x2="120"
              y2="290"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="70"
              y1="320"
              x2="120"
              y2="320"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="95"
              y1="150"
              x2="95"
              y2="350"
              stroke="white"
              strokeWidth="2"
            />

            {/* Building 2 - Tallest */}
            <line
              x1="180"
              y1="140"
              x2="250"
              y2="140"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="170"
              x2="250"
              y2="170"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="200"
              x2="250"
              y2="200"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="230"
              x2="250"
              y2="230"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="260"
              x2="250"
              y2="260"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="290"
              x2="250"
              y2="290"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="320"
              x2="250"
              y2="320"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="215"
              y1="120"
              x2="215"
              y2="350"
              stroke="white"
              strokeWidth="2"
            />

            {/* Building 3 */}
            <line
              x1="305"
              y1="200"
              x2="355"
              y2="200"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="305"
              y1="230"
              x2="355"
              y2="230"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="305"
              y1="260"
              x2="355"
              y2="260"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="305"
              y1="290"
              x2="355"
              y2="290"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="305"
              y1="320"
              x2="355"
              y2="320"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="330"
              y1="180"
              x2="330"
              y2="350"
              stroke="white"
              strokeWidth="2"
            />

            {/* Location Pin Icon */}
            <g transform="translate(380, 40)">
              <path
                d="M30 15 Q30 0 15 0 Q0 0 0 15 Q0 25 15 45 Q30 25 30 15 Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle
                cx="15"
                cy="15"
                r="6"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
            </g>

            {/* Key Icon */}
            <g transform="translate(390, 120)">
              <circle
                cx="15"
                cy="15"
                r="12"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="15"
                cy="15"
                r="5"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
              <line
                x1="24"
                y1="15"
                x2="50"
                y2="15"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="38"
                y1="10"
                x2="38"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="46"
                y1="10"
                x2="46"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Decorative elements */}
            <circle
              cx="400"
              cy="250"
              r="5"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="420"
              cy="280"
              r="3"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="30"
              cy="120"
              r="4"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />

            {/* Stars/Sparkles */}
            <path
              d="M40 80 L42 85 L47 87 L42 89 L40 94 L38 89 L33 87 L38 85 Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M410 220 L411 223 L414 224 L411 225 L410 228 L409 225 L406 224 L409 223 Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

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
              color: "white",
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
            <Link href="/properties" className="btn btn-white btn-lg">
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
