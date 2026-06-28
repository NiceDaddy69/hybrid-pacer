import { notFound } from "next/navigation";
import Fueling from "../../fueling";
import { dict, locales } from "../../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://hybridstate.de";

const META = {
  de: {
    title: "HYROX Ernährung & Race-Week Fueling – Renntag-Plan | Hybridstate",
    description:
      "Kostenloser Ernährungs- und Race-Week-Fueling-Plan für HYROX: Carb-Loading, Hydration, Frühstück und Renntag-Verpflegung mit Gericht-Beispielen – skaliert nach Gewicht und Startzeit. Als PDF per E-Mail.",
  },
  en: {
    title: "HYROX Nutrition & Race-Week Fueling – race-day plan | Hybridstate",
    description:
      "Free nutrition & race-week fueling plan for HYROX: carb-loading, hydration, breakfast and race-day fueling with meal examples – scaled to your weight and start time. As PDF by email.",
  },
};

export function generateMetadata({ params }) {
  const locale = locales.includes(params.locale) ? params.locale : "de";
  const m = META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/fueling`,
      languages: { "de-DE": "/de/fueling", en: "/en/fueling", "x-default": "/de/fueling" },
    },
    openGraph: { title: m.title, description: m.description, locale, images: [{ url: "/api/race-card", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/api/race-card"] },
  };
}

export default function FuelingPage({ params }) {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();
  const t = dict[locale];

  const ld = {
    "@context": "https://schema.org", "@type": "WebApplication", name: "Hybridstate Race-Week Fueling",
    applicationCategory: "SportsApplication", operatingSystem: "Web", url: `${SITE}/${locale}/fueling`,
    inLanguage: locale, description: META[locale].description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 0" }}>
        <a href={`/${locale}`} style={{ color: "#8593A3", fontSize: 13, textDecoration: "none" }}>‹ {t.backHome}</a>
      </div>

      <Fueling locale={locale} />

      <footer style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 40px" }}>
        <div style={{ paddingTop: 16, borderTop: "1px solid #2A3543", fontSize: 13 }}>
          <a href={`/${locale}`} style={{ color: "#8593A3", marginRight: 18, textDecoration: "none" }}>{t.backHome}</a>
          <a href={`/${locale}/pacer`} style={{ color: "#8593A3", marginRight: 18, textDecoration: "none" }}>{t.pacerName}</a>
          <a href="/impressum" style={{ color: "#8593A3", marginRight: 18 }}>Impressum</a>
          <a href="/datenschutz" style={{ color: "#8593A3" }}>{locale === "en" ? "Privacy" : "Datenschutz"}</a>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#6B7785", lineHeight: 1.6 }}>{t.notAffiliated}</div>
      </footer>
    </main>
  );
}
