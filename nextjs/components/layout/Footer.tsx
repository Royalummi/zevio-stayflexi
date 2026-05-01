import Image from "next/image";
import Link from "next/link";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const GopafyLogo = () => (
  <svg
    viewBox="0 -210 840 285"
    preserveAspectRatio="xMidYMid meet"
    aria-label="Gopafy"
    xmlns="http://www.w3.org/2000/svg"
    style={{ height: "16px", width: "auto" }}
  >
    <defs>
      <linearGradient
        id="fg-grad"
        x1="7"
        y1="0"
        x2="825"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="73.6%" stopColor="#06B6D4" />
        <stop offset="73.6%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path
      fill="url(#fg-grad)"
      d="M7-96.60C7-41.60 44.40 3 102.60 3C130.20 3 152.60-2 169-18.40L169-96.60L124-96.60L124-35.80C117.80-33.80 111.80-32.80 106.20-32.80C75.40-32.80 52-59.60 52-96.40C52-137.60 79.20-157.80 110-157.80C144.60-157.80 158.60-133.60 158.60-133.60C158.60-133.60 164.80-154.80 171.60-171.20C156.20-188.20 131-196 102.60-196C44.40-196 7-151.40 7-96.60Z"
    />
    <path
      fill="url(#fg-grad)"
      d="M249.40 3C290.20 3 317.40-26.20 317.40-70C317.40-113.80 290.20-143 249.40-143C208.80-143 181.60-113.80 181.60-70C181.60-26.20 208.80 3 249.40 3ZM223.60-69.80C223.60-91 233.40-105 249.40-105C265.40-105 275.40-91 275.40-69.80C275.40-48.80 265.40-34.80 249.40-34.80C233.40-34.80 223.60-48.80 223.60-69.80Z"
    />
    <path
      fill="url(#fg-grad)"
      d="M382.40 58C377.80 54 375.40 43.20 375.40 33.20L375.40-44.20L390.80-4.80C395.60 0 403.20 3 412.40 3C444.00 3 457.40-36.60 457.40-70C457.40-104.60 443.60-140 392.20-140L327.40-140C332.00-136 334.40-125.20 334.40-115.20L334.40 33.20C334.40 43.20 332.00 54 327.40 58ZM387.40-102C407.40-102 416.80-87 416.80-66.40C416.80-45.60 410.20-35 398.00-35C386.60-35 380.00-42.20 375.40-51.20L375.40-100.80C379.20-101.80 383.00-102 387.40-102Z"
    />
    <path
      fill="url(#fg-grad)"
      d="M465.40-120.20C473.20-109.60 478.80-101 485.20-88.60C492.60-100 504.20-105.20 518.60-105.20C534.40-105.20 545.80-95.80 549.20-80C543-82.80 536-84.20 528.20-84.20C497.40-84.20 468.80-61.80 468.80-33.80C468.80-13.40 478.80 3 503.80 3C514.60 3 523.40-3.40 525.40-6.60C531.20-15.80 542.40-33.20 550.20-45.20L550.20-24C550.20-11.80 555.80 3 565.80 3C570.80 3 591.40-9.60 607-17.80L607-18.80C592.60-18.80 591.20-31.80 591.20-43L591.20-83.20C591.20-122.40 556.40-143 518.20-143C495.40-143 478.00-135 465.40-120.20ZM511.40-49.20C511.40-61.40 524.60-78.60 541.40-78.60C544.60-78.60 547.40-77.80 549.80-76.60C550-74.60 550.20-72.40 550.20-70.20L550.20-52.40C544.40-42.20 535-36 525.80-36C515-36 511.40-42.80 511.40-49.20Z"
    />
    <path
      fill="url(#fg-grad)"
      d="M659 0C654.40-4 652-15 652-25L652-102L685.60-102L685.60-140L652.80-140C656.20-158.20 669.80-166.40 682.60-166.40C693.60-166.40 700.80-160.80 703.80-155.40L713.40-195.80C710.20-199 698-203 683.40-203C646-203 611-179 611-124.40L611-24.80C611-14.80 608.60-4 604 0Z"
    />
    <path
      fill="url(#fg-grad)"
      d="M737.40 0.20L718.60 58.20L760.60 58.20L825-139.80L783-139.80L758.80-65.40L735.40-139.80L693.40-139.80Z"
    />
  </svg>
);

export default function Footer() {
  const socialLinks = [
    { href: "https://facebook.com", label: "Facebook", icon: FiFacebook },
    { href: "https://x.com", label: "Twitter", icon: FiTwitter },
    { href: "https://instagram.com", label: "Instagram", icon: FiInstagram },
    { href: "https://linkedin.com", label: "LinkedIn", icon: FiLinkedin },
  ];

  return (
    <footer className="footer">
      <div className="container">
        {/* Top row: Brand + Nav + Contact in a compact grid */}
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <Link href="/" className="footer-brand" aria-label="Zevio home">
              <Image
                src="/brand/zevio-logo-white.png"
                alt="Zevio"
                width={210}
                height={52}
                className="footer-brand-image"
              />
            </Link>
            <p className="footer-description">
              Book verified villas &amp; service apartments across Bangalore.
              Not just a stay — a better living experience.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-social-icon"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li>
                <Link href="/about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/why-zevio" className="footer-link">
                  Why Zevio
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="footer-link">
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li>
                <Link href="/privacy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="footer-link">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="footer-link">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="footer-link">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="footer-title">Get in Touch</h3>
            <div className="footer-links">
              <a
                href="mailto:support@zevio.com"
                className="footer-link footer-contact-link"
              >
                <FiMail size={15} /> support@zevio.com
              </a>
              <a
                href="tel:+919980050909"
                className="footer-link footer-contact-link"
              >
                <FiPhone size={15} /> +91 99800 50909
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Zevio. All rights reserved.</span>
          <span className="footer-credit">
            Designed &amp; Developed by{" "}
            <a
              href="https://www.gopafy.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Gopafy"
            >
              <GopafyLogo />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
