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
  title: "Zevio - Luxury Villa Rentals | Book Your Perfect Getaway",
  description:
    "Discover and book stunning luxury villas in Goa, Lonavala, Alibaug and more. Premium properties with pools, beaches, and mountain views.",
  keywords:
    "luxury villas, villa rentals, vacation homes, Goa villas, Lonavala villas, Alibaug villas, India vacation rentals",
  icons: {
    icon: "/brand/zevio-logo-color.png",
    apple: "/brand/zevio-logo-color.png",
    shortcut: "/brand/zevio-logo-color.png",
  },
  openGraph: {
    title: "Zevio - Luxury Villa Rentals",
    description: "Discover and book stunning luxury villas in Bangalore",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/brand/zevio-logo-color.png",
        width: 1200,
        height: 630,
        alt: "Zevio - Luxury Villa Rentals",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Zevio - Luxury Villa Rentals",
    description: "Discover and book stunning luxury villas in Bangalore",
    images: ["/brand/zevio-logo-color.png"],
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
