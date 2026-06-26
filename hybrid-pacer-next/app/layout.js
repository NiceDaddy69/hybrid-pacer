import "./globals.css";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";

const display = localFont({
  src: "./fonts/Anton-Regular.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display",
});
const mono = localFont({
  src: [
    { path: "./fonts/DMMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/DMMono-Medium.ttf", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "HYROX Rechner – Pace Calculator & Split-Analyse | Hybrid Pacer",
  description:
    "Kostenloser HYROX Rechner: Wandle deine Zielzeit in einen Rennplan mit Split-Zeiten pro Lauf und Station um – oder analysiere deine Zeiten und finde deine größten Schwachstellen. Für Open, Pro und Doubles.",
  keywords: [
    "HYROX Rechner",
    "HYROX Pace Calculator",
    "HYROX Splits",
    "HYROX Rennplan",
    "Hybrid Training",
    "HYROX Zeiten",
  ],
  openGraph: {
    title: "HYROX Rechner – Pace Calculator & Split-Analyse",
    description:
      "Zielzeit in einen Rennplan umrechnen oder deine Splits analysieren. Open, Pro und Doubles.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${display.variable} ${mono.variable}`}>
      <body>{children}<Analytics /></body>
    </html>
  );
}
