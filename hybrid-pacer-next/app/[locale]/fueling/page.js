import { notFound } from "next/navigation";
import Fueling from "../../fueling";
import { dict, locales } from "../../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META = {
  de: {
    title: "HYROX Race-Week Fueling – Carb-Loading & Renntag | Hybridstate",
    description:
      "Kostenloser Race-Week-Fueling-Plan für HYROX: Carb-Loading, Hydration, Frühstück und Renntag-Verpflegung – skaliert nach Gewicht und Startzeit.",
  },
  en: {
    title: "HYROX Race-Week Fueling – carb-loading & race day | Hybridstate",
    description:
      "Free race-week fueling plan for HYROX: carb-loading, hydration, breakfast and race-day fueling – scaled to your weight and start time.",
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

  return (
    <main>
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
