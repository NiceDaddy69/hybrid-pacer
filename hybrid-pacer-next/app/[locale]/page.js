import { notFound } from "next/navigation";
import Pacer from "../pacer";
import { dict, locales } from "../i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META = {
  de: {
    title: "HYROX Rechner – Pace Calculator & Split-Analyse | Hybrid Pacer",
    description:
      "Kostenloser HYROX Rechner: Zielzeit in einen Rennplan mit Splits pro Lauf und Station umrechnen – oder Zeiten analysieren und Schwachstellen finden. Open, Pro, Doubles.",
  },
  en: {
    title: "HYROX Pace Calculator – Race Plan & Split Analysis | Hybrid Pacer",
    description:
      "Free HYROX pace calculator: turn your target time into a race plan with splits per run and station – or analyse your times and find your weak spots. Open, Pro, Doubles.",
  },
};

export function generateMetadata({ params, searchParams }) {
  const locale = locales.includes(params.locale) ? params.locale : "de";
  const m = META[locale];
  const p = typeof searchParams?.p === "string" ? searchParams.p : null;
  const img = p ? `/api/race-card?p=${encodeURIComponent(p)}` : "/api/race-card";
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { "de-DE": "/de", en: "/en", "x-default": "/de" },
    },
    openGraph: { title: m.title, description: m.description, locale, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [img] },
  };
}

export default function Page({ params }) {
  const locale = params.locale;
  if (!locales.includes(locale)) notFound();
  const t = dict[locale];

  return (
    <main>
      <Pacer locale={locale} />

      <section style={{ maxWidth: 680, margin: "0 auto", padding: "8px 16px 40px", color: "#8593A3", fontSize: 14, lineHeight: 1.7 }}>
        <h2 style={{ color: "#E9EEF3", fontSize: 18, marginTop: 24 }}>{t.seoH2}</h2>
        <p>{t.seoP1}</p>
        <h3 style={{ color: "#E9EEF3", fontSize: 15, marginTop: 18 }}>{t.seoQ1}</h3>
        <p>{t.seoA1}</p>
        <h3 style={{ color: "#E9EEF3", fontSize: 15, marginTop: 18 }}>{t.seoQ2}</h3>
        <p>{t.seoA2}</p>
      </section>

      <footer style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 40px" }}>
        <div style={{ paddingTop: 16, borderTop: "1px solid #2A3543", fontSize: 13 }}>
          <a href="/impressum" style={{ color: "#8593A3", marginRight: 18 }}>Impressum</a>
          <a href="/datenschutz" style={{ color: "#8593A3" }}>{locale === "en" ? "Privacy" : "Datenschutz"}</a>
        </div>
      </footer>
    </main>
  );
}
