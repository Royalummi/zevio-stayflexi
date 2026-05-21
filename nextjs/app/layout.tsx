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
