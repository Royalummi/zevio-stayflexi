import Link from "next/link";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiPhone,
} from "react-icons/fi";

export default function Footer() {
  const socialLinks = [
    { href: "https://facebook.com", label: "Facebook", icon: FiFacebook },
    { href: "https://x.com", label: "Twitter", icon: FiTwitter },
    { href: "https://instagram.com", label: "Instagram", icon: FiInstagram },
    { href: "https://linkedin.com", label: "LinkedIn", icon: FiLinkedin },
  ];

  const footerSections = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Why Zevio", href: "/why-zevio" },
        { label: "Destinations", href: "/destinations" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/support" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="footer">
      {/* Main Footer */}
      <div className="container">
        <div className="footer-grid">
          {/* Company Info */}
          <div>
            <div className="footer-brand">Zevio</div>
            <p className="footer-description">
              Discover and book stunning luxury villas across India&apos;s most
              beautiful destinations. Personalised stays, concierge support, and
              memorable experiences await.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    borderRadius: "50%",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "8px",
                    transition: "all 0.2s",
                  }}
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="footer-title">{section.title}</h3>
              <ul className="footer-links">
                {section.links.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="footer-link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="footer-title">Contact</h3>
            <div className="footer-links">
              <p>
                Talk to our concierge team for personalised recommendations,
                booking assistance, or trip planning support.
              </p>
              <a
                href="mailto:stay@zevio.com"
                className="footer-link flex gap-4"
              >
                <FiMail size={18} /> stay@zevio.com
              </a>
              <a href="tel:+918000123456" className="footer-link flex gap-4">
                <FiPhone size={18} /> +91 8000 123 456
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div
            className="flex flex-col items-center justify-center gap-4"
            style={{ fontSize: "14px" }}
          >
            <p>© {new Date().getFullYear()} Zevio. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/sitemap" className="footer-link">
                Sitemap
              </Link>
              <Link href="/accessibility" className="footer-link">
                Accessibility
              </Link>
              <Link href="/cookies" className="footer-link">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
