import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manhole Tracker — Command Center",
  description:
    "Geospatial infrastructure command center for manhole records, field technician logs, and inspection operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 antialiased">{children}</body>
    </html>
  );
}
