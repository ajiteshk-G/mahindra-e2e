import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-red-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
