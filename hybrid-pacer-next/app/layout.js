import "./globals.css";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import PwaRegister from "./pwa-register";

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
  title: "Hybridstate – kostenlose HYROX Tools",
  description:
    "Hybridstate bündelt kostenlose Tools für HYROX- und Hybrid-Athleten: Pace-Rechner, periodisierte Trainingspläne und Race-Week Fueling.",
  keywords: [
    "HYROX Rechner",
    "HYROX Pace Calculator",
    "HYROX Splits",
    "HYROX Rennplan",
    "Hybrid Training",
    "HYROX Zeiten",
  ],
  openGraph: {
    title: "Hybridstate – kostenlose HYROX Tools",
    description:
      "Pace-Rechner, Trainingspläne und Race-Week Fueling für HYROX- und Hybrid-Athleten. Kostenlos im Browser.",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icons/icon-192.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hybrid Pacer" },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0B0F14" };

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${display.variable} ${mono.variable}`}>
      <body>{children}<Analytics /><PwaRegister /></body>
    </html>
  );
}
