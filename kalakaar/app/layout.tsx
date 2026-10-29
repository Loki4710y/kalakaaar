import "./globals.css";
import { Providers } from "./providers";
import { PageTransition } from "@/src/components/transition/PageTransition";
import { RouteCurtain } from "@/src/components/transition/RouteCurtain";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { JsonLd } from "@/src/components/seo/JsonLd";
import { Viewport, Metadata } from "next";

import { Playfair_Display, Crimson_Pro } from 'next/font/google';

import { BRANDING } from "@/src/config/assets";
import Script from "next/script";
import { SITE_URL } from "@/src/lib/site";

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const crimson = Crimson_Pro({ subsets: ['latin'], variable: '--font-crimson' });

const baseUrl = SITE_URL;
export const viewport: Viewport = {
  themeColor: "#6B1E2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Kalakaar: Discover Indian Folk Artists & Original Paintings",
    template: "%s | Kalakaar",
  },
  description: "Discover original Madhubani, Warli, Pattachitra and Gond paintings by Indian folk artists. Meet the artists, read their stories and contact them directly on Kalakaar.",
  keywords: [
    "Indian Art",
    "Madhubani Painting",
    "Pattachitra",
    "Warli Folk Art",
    "Gond Painting",
    "Living Heritage Platform",
    "Master Artisans India",
    "Indian Folk Heritage",
    "Traditional Indian Crafts"
  ],
  authors: [{ name: "Kalakaar Cultural Art Collective" }],
  creator: "Kalakaar",
  publisher: "Kalakaar Cultural Collective",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: baseUrl,
    siteName: "Kalakaar - India's Living Heritage Platform",
    title: "Kalakaar: Discover Indian Folk Artists & Original Paintings",
    description: "Empowering traditional Indian master artisans. Discover one-of-a-kind Madhubani, Pattachitra, Warli, and Gond masterworks.",
    images: [
      {
        url: `${baseUrl}${BRANDING.appIcon}`,
        width: 512,
        height: 512,
        alt: "Kalakaar Traditional Indian Art Exhibition",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalakaar: Discover Indian Folk Artists & Original Paintings",
    description: "Discover original traditional Indian paintings and contact the artists directly.",
    creator: "@kalakaar_art",
    images: [`${baseUrl}${BRANDING.appIcon}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: BRANDING.favicon,
    apple: BRANDING.appIcon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-text-primary selection:bg-[#6B1E2E] selection:text-white">
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        )}
        <JsonLd type="Website" />
        <JsonLd type="Organization" />
        <Providers>
            <RouteCurtain />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 text-text-primary bg-background focus:outline-hidden" id="main-content">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}