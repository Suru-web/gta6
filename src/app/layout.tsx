import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gta6-two-dun.vercel.app"),
  title: "Can The Internet Buy Me GTA 6 For ₹1? 🎮💀",
  description:
    "Rockstar waited 12 years. My wallet has ₹0.00. Test cheat codes, hear retro sounds, and get immortalized on the live Wall of Legends.",
  keywords: [
    "GTA 6",
    "GTA VI",
    "Crowdfunding",
    "Vice City",
    "PS5 Pro",
    "Gamer Fund",
    "UPI Donation",
    "HESOYAM",
    "Wall of Legends",
  ],
  openGraph: {
    title: "Can The Internet Buy Me GTA 6 For ₹1? 🎮💀",
    description:
      "Rockstar waited 12 years. My wallet has ₹0.00. Test cheat codes, hear retro sounds, and get immortalized on the live Wall of Legends.",
    url: "https://gta6-two-dun.vercel.app",
    siteName: "GTA VI Vice City Fund",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Can The Internet Buy Me GTA 6 For ₹1? 🎮💀",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Can The Internet Buy Me GTA 6 For ₹1? 🎮💀",
    description:
      "Rockstar waited 12 years. My wallet has ₹0.00. Test cheat codes, hear retro sounds, and get immortalized on the live Wall of Legends.",
    images: ["/og-image.png"],
    creator: "@SurajGMeharwade",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${outfit.variable} dark`}>
      <body className="vice-bg min-h-screen text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
