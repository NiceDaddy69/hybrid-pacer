import { notFound } from "next/navigation";
import TrainingPlan from "../../trainingplan";
import { dict, locales } from "../../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META = {
  de: {
    title: "HYROX Trainingsplan – kostenlos & periodisiert | Hybridstate",
    description:
      "Kostenloser HYROX Trainingsplan: Renntag, Level und Tage pro Woche eingeben – und einen periodisierten Plan von der Grundlage bis zum Tapering erhalten. Open, Pro, Doubles.",
  },
  en: {
    title: "HYROX Training Plan – free & periodized | Hybridstate",
    description:
      "Free HYROX training plan: enter your race day, level and days per week – and get a periodized plan from base to taper. Open, Pro, Doubles.",
  },
};

export function generateMetadata({ params }) {
  const locale = locales.includes(params.locale) ? params.locale : "de";
  const m = META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/trainingsplan`,
      languages: { "de-DE": "/de/trainingsplan", en: "/en/trainingsplan", "x-default": "/de/trainingsplan" },
    },
    openGraph: { title: m.title, description: m.description, locale, images: [{ url: "/api/race-card", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/api/race-card"] },
  };
}

export default function TrainingPlanPage({ params }) {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();
  const t = dict[locale];

  return (
    <main>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 0" }}>
        <a href={`/${locale}`} style={{ color: "#8593A3", fontSize: 13, textDecoration: "none" }}>‹ {t.backHome}</a>
      </div>

      <TrainingPlan locale={locale} />

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
