import ExcelJS from "exceljs";
import { buildPlan, racePaceSec, fmtPace, DEFAULTS } from "./planmodel";

// ---- palette ----
const DARK = "FF0F1419", PANEL = "FF161C26", CORAL = "FFFF5A36", BLUE = "FF4EA8DE",
  LIGHT = "FFE9EEF3", MUTED = "FF8593A3", LINE = "FF2A3543", WHITE = "FFFFFFFF",
  BASE = "FF274B63", BUILD = "FF2E6B5E", PEAK = "FF7A2E1E", TAPER = "FF3A3F49";

const PHASE_FILL = { base: BASE, build: BUILD, peak: PEAK, taper: TAPER, race: CORAL };

function ms(sec) { sec = Math.round(sec); const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, "0")}`; }

// Official HYROX station weights by division (verified 2026).
function weights(format, gender) {
  const T = {
    openMen: { push: "152 kg", pull: "103 kg", far: "2 × 24 kg", lun: "20 kg", wb: "6 kg / 10 ft" },
    openWomen: { push: "102 kg", pull: "78 kg", far: "2 × 16 kg", lun: "10 kg", wb: "4 kg / 9 ft" },
    proMen: { push: "202 kg", pull: "153 kg", far: "2 × 32 kg", lun: "30 kg", wb: "9 kg / 10 ft" },
    proWomen: { push: "152 kg", pull: "103 kg", far: "2 × 24 kg", lun: "20 kg", wb: "6 kg / 9 ft" },
  };
  const pro = format === "pro";
  const w = gender === "women" || gender === "mixed"
    ? (pro ? T.proWomen : T.openWomen)
    : (pro ? T.proMen : T.openMen);
  return w;
}

const L = {
  de: {
    sheets: { ov: "Übersicht", plan: "Wochenplan", struct: "Wochenstruktur", st: "Stationsplan", race: "Race Day" },
    title: (cat, w) => `HYROX ${cat} – ${w}-Wochen Trainingsplan`,
    meta: (race, cat, goal, pace, days) => `Renntag: ${race || "—"}  |  Kategorie: ${cat}  |  Zielzeit: ${goal || "—"}  |  Renntempo: ${pace || "—"}  |  Empfohlen: ${days} Tage/Woche`,
    phaseOv: "PHASENÜBERSICHT", phaseCols: ["Phase", "Wochen", "Trainingsfokus", "Ziel"],
    stOv: "STATIONEN & GEWICHTE (deine Division)", stCols: ["#", "Station", "Distanz / Reps", "Gewicht", "Technik-Tipp"],
    weekTitle: (w) => `${w}-WOCHEN TRAININGSPLAN`,
    weekCols: ["Woche", "Phase"], dayCol: "Tag",
    structTitle: "DETAILLIERTE WOCHENSTRUKTUR PRO PHASE", structCols: ["Tag", "Einheit", "Details"],
    stPlanTitle: "STATIONSTRAINING – PROGRESSION PRO PHASE", stPlanCols: ["Station", "Gewicht", "Base", "Build", "Peak", "Key-Tipp"],
    stratTitle: "TOP-STRATEGIEN FÜR DEN RENNTAG",
    raceTitle: "RACE DAY – SPLIT-ZEITEN & STRATEGIE",
    raceSub: (goal) => `Zielzeit: ${goal || "—"}  |  Renntempo pro 1 km: ${goal ? "siehe Splits" : "—"}`,
    raceCols: ["Abschnitt", "Ziel-Split", "Strategie / Tipp", "Meine Zeit"],
    checkTitle: "CHECKLISTE TAG VOR DEM RENNEN",
    disclaimer: "Strukturiertes Framework nach gängiger HYROX-Periodisierung – kein individuelles Coaching und kein ärztlicher Rat. Gewichte sind offizielle HYROX-Richtwerte; prüfe die Standards deiner genauen Division. Höre auf deinen Körper und passe Umfänge an.",
    deload: "Deload", run: "Lauf", finish: "FINISH", transitions: "Übergänge (Roxzone) gesamt",
    phaseFokus: { base: "Aerobe Basis, Technik der 8 Stationen, Laufvolumen steigern", build: "Kraft-Ausdauer kombinieren, HYROX-Blöcke, Renntempo einführen", peak: "Voll-Simulationen, maximale Intensität, Übergänge optimieren", taper: "Volumen reduzieren, Schärfe halten, Regeneration vor dem Wettkampf" },
    phaseZiel: { base: "Körper vorbereiten", build: "Wettkampfform aufbauen", peak: "Höchstform erreichen", taper: "Frisch & scharf starten" },
    strategies: [
      ["Wall Balls nie absetzen", "Der größte Zeitfresser. Lieber Tempo rausnehmen als den Ball ablegen."],
      ["Übergänge < 15 Sekunden", "Direkt nach der Station losrennen – die Roxzone-Zeit zählt voll mit."],
      ["Läufe nicht überpacen", "Zone 3–4, nicht sprinten. Sonst leiden alle folgenden Stationen."],
      ["Sled: Grip nutzen", "Schuhe mit gutem Grip, tiefe Position, kurze explosive Schritte."],
      ["Verpflegung üben", "Carb-Strategie im Training testen – nichts Neues am Renntag."],
    ],
    checklist: ["Ausrüstung: Schuhe, ggf. Handschuhe (Sled), Trinkgürtel", "Verpflegung & Gels vorbereiten (im Training getestet)", "Startnummer & Check-in-Infos prüfen", "Frühstück 3 h vorher, Hydration aufbauen", "Warm-up-Routine planen", "Früh schlafen, Wettkampftasche packen"],
  },
  en: {
    sheets: { ov: "Overview", plan: "Week plan", struct: "Weekly structure", st: "Station plan", race: "Race Day" },
    title: (cat, w) => `HYROX ${cat} – ${w}-week training plan`,
    meta: (race, cat, goal, pace, days) => `Race day: ${race || "—"}  |  Category: ${cat}  |  Target: ${goal || "—"}  |  Race pace: ${pace || "—"}  |  Recommended: ${days} days/week`,
    phaseOv: "PHASE OVERVIEW", phaseCols: ["Phase", "Weeks", "Training focus", "Goal"],
    stOv: "STATIONS & WEIGHTS (your division)", stCols: ["#", "Station", "Distance / reps", "Weight", "Technique tip"],
    weekTitle: (w) => `${w}-WEEK TRAINING PLAN`,
    weekCols: ["Week", "Phase"], dayCol: "Day",
    structTitle: "DETAILED WEEKLY STRUCTURE PER PHASE", structCols: ["Day", "Session", "Details"],
    stPlanTitle: "STATION TRAINING – PROGRESSION PER PHASE", stPlanCols: ["Station", "Weight", "Base", "Build", "Peak", "Key tip"],
    stratTitle: "TOP RACE-DAY STRATEGIES",
    raceTitle: "RACE DAY – SPLIT TIMES & STRATEGY",
    raceSub: (goal) => `Target: ${goal || "—"}`,
    raceCols: ["Segment", "Target split", "Strategy / tip", "My time"],
    checkTitle: "DAY-BEFORE CHECKLIST",
    disclaimer: "A structured framework based on common HYROX periodization – not individual coaching or medical advice. Weights are official HYROX references; verify the standards for your exact division. Listen to your body and adjust volume.",
    deload: "Deload", run: "Run", finish: "FINISH", transitions: "Transitions (roxzone) total",
    phaseFokus: { base: "Aerobic base, station technique, build run volume", build: "Strength-endurance, HYROX blocks, introduce race pace", peak: "Full simulations, max intensity, optimise transitions", taper: "Reduce volume, keep sharpness, recover before race day" },
    phaseZiel: { base: "Prepare the body", build: "Build race form", peak: "Reach peak form", taper: "Start fresh & sharp" },
    strategies: [
      ["Never drop the wall ball", "The biggest time sink. Slow the pace rather than setting the ball down."],
      ["Transitions < 15 seconds", "Run off the moment you finish – roxzone time counts fully."],
      ["Don't overpace the runs", "Zone 3–4, no sprinting, or every following station suffers."],
      ["Sled: use grip", "Grippy shoes, low position, short explosive steps."],
      ["Practise fueling", "Test your carb strategy in training – nothing new on race day."],
    ],
    checklist: ["Gear: shoes, gloves (sled) if used, hydration belt", "Prep fuel & gels (tested in training)", "Check bib number & check-in info", "Breakfast 3 h before, build hydration", "Plan your warm-up routine", "Sleep early, pack your race bag"],
  },
};

// Race-day station order + share of total station time + tips
const RACE_STATIONS = [
  { key: "ski", de: "1. SkiErg 1.000 m", en: "1. SkiErg 1,000 m", frac: 0.11, tde: "Langer gleichmäßiger Zug, Atemrhythmus.", ten: "Long even pull, find your breathing rhythm." },
  { key: "push", de: "2. Sled Push 50 m", en: "2. Sled Push 50 m", frac: 0.07, tde: "Tiefe Position, kurze explosive Schritte.", ten: "Low position, short explosive steps." },
  { key: "pull", de: "3. Sled Pull 50 m", en: "3. Sled Pull 50 m", frac: 0.08, tde: "Aufrecht, gleichmäßige Züge, Seil managen.", ten: "Upright, steady pulls, manage the rope." },
  { key: "burpee", de: "4. Burpee Broad Jump 80 m", en: "4. Burpee Broad Jump 80 m", frac: 0.14, tde: "Rhythmus finden, weite Sprünge.", ten: "Find a rhythm, jump far." },
  { key: "row", de: "5. Rowing 1.000 m", en: "5. Rowing 1,000 m", frac: 0.11, tde: "Beine zuerst, ~26–28 spm.", ten: "Legs first, ~26–28 spm." },
  { key: "far", de: "6. Farmers Carry 200 m", en: "6. Farmers Carry 200 m", frac: 0.09, tde: "Schultern zurück, nie absetzen.", ten: "Shoulders back, don't set down." },
  { key: "lun", de: "7. Sandbag Lunges 100 m", en: "7. Sandbag Lunges 100 m", frac: 0.17, tde: "Knie bodennah, gleichmäßiger Schritt.", ten: "Knee to floor, even steps." },
  { key: "wb", de: "8. Wall Balls ×100", en: "8. Wall Balls ×100", frac: 0.23, tde: "Nie absetzen! Tempo reduzieren statt ablegen.", ten: "Never drop! Slow down rather than rest." },
];

const STATION_ROWS = (w, lang) => ([
  ["SkiErg", "–", "3×500 m, 2 min P.", "4×750 m, 90 s P.", "5×1.000 m, 90 s P.", lang === "de" ? "Langer Zug, Hüfte mitnehmen" : "Long pull, drive the hip"],
  ["Sled Push", w.push, "3×25 m Technik", "4×25 m zügig", "5×25 m Speed", lang === "de" ? "Tief, kurze Schritte" : "Low, short steps"],
  ["Sled Pull", w.pull, "3×25 m sauber", "4×25 m gleichmäßig", "5×25 m Race-Pace", lang === "de" ? "Aufrecht, rhythmisch" : "Upright, rhythmic"],
  ["Burpee Broad Jump", "–", "3×15", "4×20 ohne Stopp", "5×20 max. Distanz", lang === "de" ? "Explosiv, weit landen" : "Explosive, land far"],
  ["Rowing", "–", "3×1.000 m", "4×1.000 m", "5×1.000 m", lang === "de" ? "Beine→Körper→Arme" : "Legs→body→arms"],
  ["Farmers Carry", w.far, "4×50 m", "5×50 m", "6×50 m Race-Pace", lang === "de" ? "Schultern zurück" : "Shoulders back"],
  ["Sandbag Lunges", w.lun, "3×25 m", "3×50 m", "4×50 m Race-Pace", lang === "de" ? "Knie bodennah" : "Knee to floor"],
  ["Wall Balls", w.wb, "3×20", "4×25, 1 Pause", "5×30, nie absetzen", lang === "de" ? "Tief→explosiv→Ziel" : "Deep→explosive→target"],
]);

const STATION_OV = (w, lang) => ([
  ["1", "SkiErg", "1.000 m", "–", lang === "de" ? "Zugfrequenz, langer Zug" : "Stroke rate, long pull"],
  ["2", "Sled Push", "50 m (4×12,5)", w.push, lang === "de" ? "Tiefe Position, Fersendruck" : "Low position, drive heels"],
  ["3", "Sled Pull", "50 m (4×12,5)", w.pull, lang === "de" ? "Rücken gerade, gleichmäßig" : "Back straight, steady"],
  ["4", "Burpee Broad Jump", "80 m", "–", lang === "de" ? "Explosiv, weiter Sprung" : "Explosive, far jump"],
  ["5", "Rowing", "1.000 m", "–", lang === "de" ? "Beine zuerst, 26–28 spm" : "Legs first, 26–28 spm"],
  ["6", "Farmers Carry", "200 m", w.far, lang === "de" ? "Schultern zurück, nie absetzen" : "Shoulders back, don't set down"],
  ["7", "Sandbag Lunges", "100 m", w.lun, lang === "de" ? "Knie bodennah, aufrecht" : "Knee to floor, upright"],
  ["8", "Wall Balls", "100 Reps", w.wb, lang === "de" ? "Nie absetzen, tiefer Squat" : "Never drop, deep squat"],
]);

function styleHeaderRow(row, fill = DARK, color = LIGHT) {
  row.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    c.font = { bold: true, color: { argb: color }, size: 11 };
    c.alignment = { vertical: "middle", wrapText: true };
    c.border = { bottom: { style: "thin", color: { argb: LINE } } };
  });
}
function sectionRow(ws, ncol, text, fill = CORAL) {
  const r = ws.addRow([text]);
  ws.mergeCells(r.number, 1, r.number, ncol);
  const c = ws.getCell(r.number, 1);
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  c.font = { bold: true, color: { argb: WHITE }, size: 12 };
  c.alignment = { vertical: "middle" };
  r.height = 22;
  return r;
}

export async function buildPlanWorkbook({ weeks, level, locale, targetSec, format, gender, raceDateStr, targetStr }) {
  const lang = L[locale] ? locale : "de";
  const t = L[lang];
  const plan = buildPlan({ weeks, level, locale: lang, targetSec, format, gender });
  const w = weights(format, gender);
  const fmtCat = { open: "Open", pro: "Pro", doubles: "Doubles" }[format] || "Open";
  const genCat = { men: lang === "de" ? "Herren" : "Men", women: lang === "de" ? "Damen" : "Women", mixed: "Mixed" }[gender] || "";
  const catLabel = `${fmtCat} ${genCat}`.trim();
  const pace = plan.racePace;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Hybridstate";

  // ===== Sheet 1: Overview =====
  const ov = wb.addWorksheet(t.sheets.ov, { properties: { tabColor: { argb: CORAL } } });
  ov.columns = [{ width: 16 }, { width: 16 }, { width: 46 }, { width: 18 }, { width: 40 }];
  const tRow = ov.addRow([t.title(catLabel, weeks)]);
  ov.mergeCells(tRow.number, 1, tRow.number, 5);
  ov.getCell(tRow.number, 1).font = { bold: true, size: 16, color: { argb: LIGHT } };
  ov.getCell(tRow.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  tRow.height = 30;
  const mRow = ov.addRow([t.meta(raceDateStr, catLabel, targetStr, pace, plan.daysPerWeek)]);
  ov.mergeCells(mRow.number, 1, mRow.number, 5);
  ov.getCell(mRow.number, 1).font = { color: { argb: MUTED }, size: 10 };
  ov.addRow([]);
  sectionRow(ov, 5, t.phaseOv, BLUE);
  const phHead = ov.addRow(t.phaseCols); styleHeaderRow(phHead);
  let acc = 0;
  plan.summary.forEach((p) => {
    const from = acc + 1, to = acc + p.weeks; acc = to;
    const r = ov.addRow([p.label, `${from}–${to}`, t.phaseFokus[p.key], t.phaseZiel[p.key]]);
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PHASE_FILL[p.key] || PANEL } };
    r.getCell(1).font = { bold: true, color: { argb: LIGHT } };
    r.alignment = { wrapText: true, vertical: "top" };
  });
  ov.addRow([]);
  sectionRow(ov, 5, t.stOv, BLUE);
  const stHead = ov.addRow(t.stCols); styleHeaderRow(stHead);
  STATION_OV(w, lang).forEach((row) => { const r = ov.addRow(row); r.alignment = { wrapText: true, vertical: "top" }; });

  // ===== Sheet 2: Week plan =====
  const dpw = plan.daysPerWeek;
  const wp = wb.addWorksheet(t.sheets.plan, { properties: { tabColor: { argb: BLUE } } });
  wp.columns = [{ width: 8 }, { width: 12 }, ...Array.from({ length: dpw }, () => ({ width: 30 }))];
  const wpT = wp.addRow([t.weekTitle(weeks)]);
  wp.mergeCells(wpT.number, 1, wpT.number, 2 + dpw);
  wp.getCell(wpT.number, 1).font = { bold: true, size: 14, color: { argb: LIGHT } };
  wp.getCell(wpT.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  wpT.height = 26;
  const wpHead = wp.addRow([...t.weekCols, ...Array.from({ length: dpw }, (_, i) => `${t.dayCol} ${i + 1}`)]);
  styleHeaderRow(wpHead);
  plan.weeks.forEach((week) => {
    const cells = [week.num, week.phaseLabel + (week.deload ? `\n(${t.deload})` : "")];
    for (let i = 0; i < dpw; i++) {
      const d = week.days[i];
      cells.push(d ? `${d.title}\n${d.detail}` : "");
    }
    const r = wp.addRow(cells);
    r.alignment = { wrapText: true, vertical: "top" };
    r.height = 64;
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PHASE_FILL[week.raceWeek ? "race" : week.phase] || PANEL } };
    r.getCell(2).font = { bold: true, color: { argb: WHITE } };
  });

  // ===== Sheet 3: Weekly structure (one representative week per phase) =====
  const struct = wb.addWorksheet(t.sheets.struct, { properties: { tabColor: { argb: BLUE } } });
  struct.columns = [{ width: 8 }, { width: 26 }, { width: 80 }];
  const sT = struct.addRow([t.structTitle]);
  struct.mergeCells(sT.number, 1, sT.number, 3);
  struct.getCell(sT.number, 1).font = { bold: true, size: 14, color: { argb: LIGHT } };
  struct.getCell(sT.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  sT.height = 26;
  ["base", "build", "peak", "taper"].forEach((pk) => {
    const wkOfPhase = plan.weeks.find((x) => x.phase === pk && !x.raceWeek);
    if (!wkOfPhase) return;
    sectionRow(struct, 3, (lang === "de" ? "PHASE: " : "PHASE: ") + (plan.summary.find((s) => s.key === pk)?.label || pk).toUpperCase(), PHASE_FILL[pk]);
    const h = struct.addRow(t.structCols); styleHeaderRow(h);
    wkOfPhase.days.forEach((d, i) => {
      const r = struct.addRow([`${t.dayCol} ${i + 1}`, d.title, d.detail]);
      r.alignment = { wrapText: true, vertical: "top" };
    });
    struct.addRow([]);
  });

  // ===== Sheet 4: Station plan =====
  const st = wb.addWorksheet(t.sheets.st, { properties: { tabColor: { argb: CORAL } } });
  st.columns = [{ width: 18 }, { width: 14 }, { width: 20 }, { width: 20 }, { width: 22 }, { width: 32 }];
  const stT = st.addRow([t.stPlanTitle]);
  st.mergeCells(stT.number, 1, stT.number, 6);
  st.getCell(stT.number, 1).font = { bold: true, size: 14, color: { argb: LIGHT } };
  st.getCell(stT.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  stT.height = 26;
  const stH = st.addRow(t.stPlanCols); styleHeaderRow(stH);
  STATION_ROWS(w, lang).forEach((row) => { const r = st.addRow(row); r.alignment = { wrapText: true, vertical: "top" }; });
  st.addRow([]);
  sectionRow(st, 6, t.stratTitle, CORAL);
  t.strategies.forEach((s, i) => {
    const r = st.addRow([`${i + 1}`, s[0], s[1]]);
    st.mergeCells(r.number, 3, r.number, 6);
    r.getCell(2).font = { bold: true };
    r.alignment = { wrapText: true, vertical: "top" };
  });

  // ===== Sheet 5: Race Day =====
  const rd = wb.addWorksheet(t.sheets.race, { properties: { tabColor: { argb: CORAL } } });
  rd.columns = [{ width: 28 }, { width: 14 }, { width: 52 }, { width: 14 }];
  const rT = rd.addRow([t.raceTitle]);
  rd.mergeCells(rT.number, 1, rT.number, 4);
  rd.getCell(rT.number, 1).font = { bold: true, size: 14, color: { argb: LIGHT } };
  rd.getCell(rT.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  rT.height = 26;
  rd.addRow([t.raceSub(targetStr)]);
  rd.addRow([]);
  const rH = rd.addRow(t.raceCols); styleHeaderRow(rH);

  const runSec = racePaceSec(targetSec);
  const rox = targetSec ? Math.max(targetSec * 0.06, 180) : 0;
  const stationTotal = targetSec ? (targetSec - rox) * 0.5 : 0;
  const runSplit = runSec ? ms(runSec) : "—";
  for (let i = 0; i < RACE_STATIONS.length; i++) {
    const runLabel = `${t.run} ${i + 1} (1 km)`;
    const rr = rd.addRow([runLabel, runSplit, lang === "de" ? "Gleichmäßig, Zone 3–4." : "Even effort, zone 3–4.", ""]);
    rr.alignment = { wrapText: true, vertical: "top" };
    const s = RACE_STATIONS[i];
    const split = stationTotal ? ms(stationTotal * s.frac) : "—";
    const sr = rd.addRow([lang === "de" ? s.de : s.en, split, lang === "de" ? s.tde : s.ten, ""]);
    sr.getCell(2).font = { bold: true, color: { argb: CORAL } };
    sr.alignment = { wrapText: true, vertical: "top" };
  }
  const fr = rd.addRow([t.finish, "", lang === "de" ? "Letzte 1 km – alles geben!" : "Final 1 km – empty the tank!", ""]);
  fr.getCell(1).font = { bold: true, color: { argb: CORAL } };
  if (rox) rd.addRow([t.transitions, ms(rox), lang === "de" ? "Übergänge < 15 s halten." : "Keep transitions < 15 s.", ""]);
  rd.addRow([]);
  sectionRow(rd, 4, t.checkTitle, BLUE);
  t.checklist.forEach((c) => { const r = rd.addRow([`☐  ${c}`]); rd.mergeCells(r.number, 1, r.number, 4); r.alignment = { wrapText: true }; });
  rd.addRow([]);
  const dr = rd.addRow([t.disclaimer]);
  rd.mergeCells(dr.number, 1, dr.number, 4);
  dr.getCell(1).font = { italic: true, color: { argb: MUTED }, size: 9 };
  dr.alignment = { wrapText: true };
  dr.height = 40;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
