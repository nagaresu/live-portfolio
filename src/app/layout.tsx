import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: {
    default: "Keisuke Sunagare | Photographer",
    template: "%s | Keisuke Sunagare",
  },
  description: "Professional photographer based in Tokyo, Japan. Specializing in concert, portrait, and lifestyle photography.",
  openGraph: {
    title: "Keisuke Sunagare | Live Music Photographer",
    description: "Capturing the raw energy of live music. Tokyo based, world ready.",
    url: "https://keisukesunagare.com",
    siteName: "Keisuke Sunagare Portfolio",
    images: [
      {
        url: "/images/og-image.jpg", // We should ideally create this
        width: 1200,
        height: 630,
        alt: "Keisuke Sunagare Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keisuke Sunagare | Live Music Photographer",
    description: "Capturing the raw energy of live music. Tokyo based, world ready.",
    creator: "@keisukesunagare", // Placeholder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${inter.variable} font-sans bg-white text-black`}>
        <Header />
        <main className="pt-24 min-h-screen">
          <div className="w-full px-4 md:px-8">
            {children}
          </div>
        </main>
        <footer className="py-12 text-center text-xs tracking-widest text-gray-400 uppercase">
          © 2025 Keisuke Sunagare. All Rights Reserved.
        </footer>
      </body>
    </html>
  );
}
