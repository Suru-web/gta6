import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
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
  title: "HELP A BROTHER OUT TO PLAY GTA 6 | The Vice City Fund",
  description:
    "Rockstar took 12 years. My bank balance is ₹0. Donate ₹1 to ₹100 via UPI to help a brother play GTA 6 on day one. Live Hall of Fame & memes included!",
  keywords: ["GTA 6", "GTA VI", "Crowdfunding", "Vice City", "PS5", "Gamer Fund", "UPI Donation"],
  openGraph: {
    title: "HELP A BROTHER OUT TO PLAY GTA 6 🌴🎮",
    description: "Donate ₹1 to ₹100 via UPI and become a certified Vice City legend. Target: ₹69,900.",
    type: "website",
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
      </body>
    </html>
  );
}
