import { locales } from "./i18n";

export default function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://hybridstate.de").replace(/\/$/, "");
  const now = new Date();
  const urls = [];
  for (const l of locales) {
    urls.push({ url: `${base}/${l}`, lastModified: now, changeFrequency: "weekly", priority: 1 });
    urls.push({ url: `${base}/${l}/pacer`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    urls.push({ url: `${base}/${l}/trainingsplan`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
    urls.push({ url: `${base}/${l}/fueling`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  }
  return urls;
}
