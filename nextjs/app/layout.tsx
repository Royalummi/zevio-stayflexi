import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PopBanner from "@/components/ui/PopBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { BookingProvider } from "@/contexts/BookingContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zevio.in"),
  title:
    "Zevio - Luxury Villa Rentals near Bangalore | Nandi Hills, Hosur, Whitefield",
  description:
    "Discover and book stunning luxury villas near Bangalore. Premium properties in Nandi Hills, Bangalore Airport, Hosur, and Whitefield — with private pools, scenic views, and top amenities.",
  keywords:
    "luxury villas near Bangalore, Nandi Hills villas, Bangalore Airport villas, Hosur villas, Whitefield villas, villa rentals Bengaluru, weekend getaway Bangalore, luxury stay near Bangalore",
  icons: {
    icon: "/brand/zevio-logo-color-20260501.png",
    apple: "/brand/zevio-logo-color-20260501.png",
    shortcut: "/brand/zevio-logo-color-20260501.png",
  },
  openGraph: {
    title: "Zevio - Luxury Villa Rentals near Bangalore",
    description:
      "Discover and book stunning luxury villas near Bangalore. Premium properties in Nandi Hills, Bangalore Airport, Hosur, and Whitefield.",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/brand/zevio-logo-color-20260501.png",
        width: 1200,
        height: 630,
        alt: "Zevio - Luxury Villa Rentals near Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Zevio - Luxury Villa Rentals near Bangalore",
    description:
      "Discover and book stunning luxury villas near Bangalore. Premium properties in Nandi Hills, Bangalore Airport, Hosur, and Whitefield.",
    images: ["/brand/zevio-logo-color-20260501.png"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Zevio",
  url: "https://zevio.in",
  description:
    "Discover and book luxury villas near Bangalore — Nandi Hills, Bangalore Airport, Hosur, and Whitefield.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://zevio.in/villas?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  hasPart: [
    {
      "@type": "WebPage",
      name: "Luxury Villa Rentals",
      url: "https://zevio.in/villas",
      description: "Browse and book luxury villas near Bangalore",
    },
    {
      "@type": "WebPage",
      name: "Destinations",
      url: "https://zevio.in/destinations",
      description:
        "Explore top destinations — Nandi Hills, Bangalore Airport, Hosur, and more",
    },
    {
      "@type": "WebPage",
      name: "About Us",
      url: "https://zevio.in/about",
      description: "Learn about Zevio and our mission",
    },
    {
      "@type": "WebPage",
      name: "Contact Us",
      url: "https://zevio.in/contact",
      description: "Get in touch with the Zevio team",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={inter.className}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className="antialiased min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AuthModalProvider>
            <BookingProvider>
              <PopBanner />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </BookingProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
