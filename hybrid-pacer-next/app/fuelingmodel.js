// Race-week fueling – general, evidence-informed guidance scaled by body weight
// and race start time. NOT individual dietary or medical advice.

function toMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
function fromMin(min) {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const LOC = {
  de: {
    rel: { bf: "≈ 3 h vor Start", caff: "≈ 45–60 min vorher", snack: "≈ 30–40 min vorher", during: "Während des Rennens", after: "Danach", d23: "2–3 Tage vorher", d1: "Vortag" },
    build: (n, times) => [
      {
        key: "d23", when: LOC.de.rel.d23, title: "Auftanken beginnt",
        lines: [
          "Normal weiteressen, Kohlenhydrate leicht betonen.",
          "Flüssigkeit & Elektrolyte aufbauen, Alkohol reduzieren.",
          "Nichts Neues ausprobieren – bei vertrauten Lebensmitteln bleiben.",
        ],
      },
      {
        key: "d1", when: LOC.de.rel.d1, title: "Carb-Loading (Top-up)",
        lines: [
          `Über den Tag ~${n.carbDayLo}–${n.carbDayHi} g Kohlenhydrate (≈ 6–8 g/kg) – kein Marathon-Loading, einfach gut gefüllt reingehen.`,
          "Eher fett- & ballaststoffarm, besonders abends. Frühes, leichtes Abendessen.",
          "Beispiele: Nudeln mit magerer Tomatensauce, Reis mit Hähnchen, Pfannkuchen, Weißbrot mit Honig – wenig Salat, Vollkorn & Frittiertes.",
          "Gut hydrieren, eine Prise mehr Salz schadet nicht.",
        ],
      },
      {
        key: "bf", when: times.bf || LOC.de.rel.bf, title: "Frühstück",
        lines: [
          `~${n.bfLo}–${n.bfHi} g Kohlenhydrate (≈ 1–2 g/kg), wenig Fett/Ballaststoffe, nichts Neues.`,
          "Z. B. Haferflocken oder Weißbrot mit Honig/Marmelade + Banane.",
          `Trinken: ~${n.hydroLo}–${n.hydroHi} ml über die nächsten 2–4 h, mit Elektrolyten.`,
        ],
      },
      n.caffeine && {
        key: "caff", when: times.caff || LOC.de.rel.caff, title: "Koffein (optional)",
        lines: [
          `~${n.caffMg} mg (≈ 3 mg/kg) – nur, wenn du es gewohnt bist. Nicht neu am Renntag testen.`,
        ],
      },
      {
        key: "snack", when: times.snack || LOC.de.rel.snack, title: "Letzter kleiner Snack",
        lines: [
          "~20–30 g Kohlenhydrate (z. B. Banane oder Gel) + ein paar Schluck Wasser.",
        ],
      },
      {
        key: "during", when: LOC.de.rel.during, title: "Im Rennen",
        lines: [
          "Meist reichen Wasser/Elektrolyte in Schlucken, wo möglich.",
          "Bei Zielzeiten über ~75–90 min ggf. 1 Gel (~25 g) etwa zur Hälfte.",
        ],
      },
      {
        key: "after", when: LOC.de.rel.after, title: "Regeneration",
        lines: [
          "In den ersten ~30–60 min: Kohlenhydrate + Protein, weiter trinken.",
        ],
      },
    ].filter(Boolean),
    disclaimer: "Allgemeine, sportwissenschaftlich orientierte Richtwerte zur Renn-Verpflegung – keine individuelle Ernährungs- oder medizinische Beratung. Individuelle Verträglichkeit variiert; teste alles im Training, nichts Neues am Renntag. Bei Vorerkrankungen oder Unsicherheit fachkundig beraten lassen.",
  },
  en: {
    rel: { bf: "≈ 3 h before start", caff: "≈ 45–60 min before", snack: "≈ 30–40 min before", during: "During the race", after: "After", d23: "2–3 days before", d1: "Day before" },
    build: (n, times) => [
      {
        key: "d23", when: LOC.en.rel.d23, title: "Start topping up",
        lines: [
          "Eat normally, lean slightly toward carbs.",
          "Build up fluids & electrolytes, cut back on alcohol.",
          "Don't try anything new – stick to familiar foods.",
        ],
      },
      {
        key: "d1", when: LOC.en.rel.d1, title: "Carb-load (top-up)",
        lines: [
          `Across the day ~${n.carbDayLo}–${n.carbDayHi} g carbs (≈ 6–8 g/kg) – not marathon loading, just go in well-fuelled.`,
          "Lower fat & fibre, especially in the evening. Early, light dinner.",
          "Examples: pasta with lean tomato sauce, rice with chicken, pancakes, white bread with honey – go easy on salad, wholegrain & fried food.",
          "Hydrate well; a little extra salt won't hurt.",
        ],
      },
      {
        key: "bf", when: times.bf || LOC.en.rel.bf, title: "Breakfast",
        lines: [
          `~${n.bfLo}–${n.bfHi} g carbs (≈ 1–2 g/kg), low fat/fibre, nothing new.`,
          "E.g. oats or white bread with honey/jam + a banana.",
          `Drink ~${n.hydroLo}–${n.hydroHi} ml over the next 2–4 h, with electrolytes.`,
        ],
      },
      n.caffeine && {
        key: "caff", when: times.caff || LOC.en.rel.caff, title: "Caffeine (optional)",
        lines: [
          `~${n.caffMg} mg (≈ 3 mg/kg) – only if you're used to it. Don't trial it on race day.`,
        ],
      },
      {
        key: "snack", when: times.snack || LOC.en.rel.snack, title: "Last small snack",
        lines: [
          "~20–30 g carbs (e.g. banana or gel) + a few sips of water.",
        ],
      },
      {
        key: "during", when: LOC.en.rel.during, title: "In the race",
        lines: [
          "Sips of water/electrolytes where possible are usually enough.",
          "For target times over ~75–90 min, consider 1 gel (~25 g) around halfway.",
        ],
      },
      {
        key: "after", when: LOC.en.rel.after, title: "Recovery",
        lines: [
          "Within the first ~30–60 min: carbs + protein, keep drinking.",
        ],
      },
    ].filter(Boolean),
    disclaimer: "General, sports-science-informed race fueling guidance – not individual dietary or medical advice. Individual tolerance varies; practise everything in training, nothing new on race day. If you have any condition or doubt, consult a professional.",
  },
};

export function buildFueling({ weightKg, startTime, caffeine, locale }) {
  const loc = LOC[locale] ? locale : "de";
  const w = Math.max(35, Math.min(160, Number(weightKg) || 75));
  const n = {
    carbDayLo: Math.round(w * 6), carbDayHi: Math.round(w * 8),
    bfLo: Math.round(w * 1), bfHi: Math.round(w * 2),
    caffMg: Math.round(w * 3),
    hydroLo: Math.round(w * 5), hydroHi: Math.round(w * 7),
    caffeine: !!caffeine,
  };
  const start = toMin(startTime);
  const times = {};
  if (start != null) {
    times.bf = `${fromMin(start - 180)} (${LOC[loc].rel.bf})`;
    times.caff = `${fromMin(start - 50)} (${LOC[loc].rel.caff})`;
    times.snack = `${fromMin(start - 40)} (${LOC[loc].rel.snack})`;
  }
  return { items: LOC[loc].build(n, times), disclaimer: LOC[loc].disclaimer, weightKg: w, startTime: start != null ? startTime : null };
}
