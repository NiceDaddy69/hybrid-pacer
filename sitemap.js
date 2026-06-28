import { notFound } from "next/navigation";
import Home from "../home";
import { locales } from "../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META = {
  de: {
    title: "Hybridstate – Tools für HYROX & Hybrid-Athleten",
    description:
      "Hybridstate bündelt kostenlose Tools für HYROX- und Hybrid-Athleten: der Hybrid Pacer für Rennplan & Split-Analyse, bald Trainingspläne und Race-Week Fueling.",
  },
  en: {
    title: "Hybridstate – Tools for HYROX & hybrid athletes",
    description:
      "Hybridstate brings together free tools for HYROX and hybrid athletes: the Hybrid Pacer for race plans & split analysis, with training plans and race-week fueling coming soon.",
  },
};

export function generateMetadata({ params }) {
  const locale = locales.includes(params.locale) ? params.locale : "de";
  const m = META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { "de-DE": "/de", en: "/en", "x-default": "/de" },
    },
    openGraph: { title: m.title, description: m.description, locale, images: [{ url: "/api/race-card", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/api/race-card"] },
  };
}

export default function Page({ params }) {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();
  return <Home locale={locale} />;
}
