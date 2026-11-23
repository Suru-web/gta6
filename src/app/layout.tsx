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
  title: "GTA Legends Arena",
  description: "Pick a GTA legend, choose your rival, and fight it out in this fan-made browser game.",
  keywords: ["GTA", "GTA Legends Arena", "fighting game", "Vice City"],
  openGraph: {
    title: "GTA Legends Arena",
    description: "Pick a GTA legend, choose your rival, and fight it out in this fan-made browser game.",
    url: "https://gta6-two-dun.vercel.app",
    siteName: "GTA Legends Arena",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA Legends Arena",
    description: "Pick a GTA legend, choose your rival, and fight it out in this fan-made browser game.",
    creator: "@SurajGMeharwade",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
