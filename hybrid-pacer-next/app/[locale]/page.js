import { notFound } from "next/navigation";
import Home from "../home";
import { locales } from "../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://hybridstate.de";

const META = {
  de: {
    title: "Kostenlose HYROX Tools: Pace-Rechner, Trainingsplan & Fueling | Hybridstate",
    description:
      "Hybridstate bündelt kostenlose Tools für HYROX- und Hybrid-Athleten: Hybrid Pacer für Rennplan & Split-Analyse, periodisierte HYROX-Trainingspläne und einen Race-Week-Fueling-Plan – alles gratis im Browser.",
  },
  en: {
    title: "Free HYROX tools: pace calculator, training plan & fueling | Hybridstate",
    description:
      "Hybridstate brings together free tools for HYROX and hybrid athletes: Hybrid Pacer for race plans & split analysis, periodized HYROX training plans and a race-week fueling plan – all free in your browser.",
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
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Hybridstate", url: SITE, description: "Kostenlose Tools für HYROX- und Hybrid-Athleten." },
      { "@type": "WebSite", name: "Hybridstate", url: SITE, inLanguage: locale },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Home locale={locale} />
    </>
  );
}
