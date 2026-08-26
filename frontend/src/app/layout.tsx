import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Mahindra Auto — Explore SUVs & Born Electric Origins with MIA Live Avatar",
  description: "Official Mahindra Virtual Experience Center featuring Live AI Avatar, 3D Co-Browsing, and Real-Time Specs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-red-600 selection:text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
