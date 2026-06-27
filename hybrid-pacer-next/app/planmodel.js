// Pure, deterministic HYROX training-plan generator.
// No personalization claims – a structured framework based on common periodization.

export const LEVELS = ["beginner", "intermediate", "advanced"];
export const DAYS = [3, 4, 5, 6];

// Default HYROX finish times (seconds) – mirrors the Hybrid Pacer.
export const DEFAULTS = {
  open: { men: 88 * 60, women: 100 * 60, mixed: 94 * 60 },
  pro: { men: 75 * 60, women: 85 * 60, mixed: 80 * 60 },
  doubles: { men: 62 * 60, women: 72 * 60, mixed: 66 * 60 },
};

export function parseTime(str) {
  if (typeof str !== "string") return null;
  const p = str.trim().split(":").map((x) => x.trim());
  if (!p.length || p.some((x) => x === "" || isNaN(Number(x)))) return null;
  let sec = 0;
  if (p.length === 3) sec = +p[0] * 3600 + +p[1] * 60 + +p[2];
  else if (p.length === 2) sec = +p[0] * 60 + +p[1];
  else if (p.length === 1) sec = +p[0] * 60;
  else return null;
  return sec;
}

export function fmtTime(sec) {
  if (sec == null || isNaN(sec) || sec < 0) return "";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Average race run pace (sec per km) – same split the Pacer uses at neutral bias:
// running total = (finish − roxzone) × 0.5, spread over 8 km.
export function racePaceSec(targetSec) {
  if (!targetSec || targetSec <= 0) return null;
  const rox = Math.max(targetSec * 0.06, 180);
  const running = (targetSec - rox) * 0.5;
  if (running <= 0) return null;
  return running / 8;
}

export function fmtPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0) return null;
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}/km`;
}

function pick(level, a, b, c) {
  return level === "beginner" ? a : level === "advanced" ? c : b;
}

// ---- localized session + phase content ----
const C = {
  de: {
    phase: { base: "Grundlage", build: "Aufbau", peak: "Spezifik", taper: "Tapering", race: "Renntag" },
    deload: "Deload",
    raceTitle: "Renntag 🏁",
    raceDetail: "Vertrau dem Plan, pace gleichmäßig, iss & wärm dich gewohnt auf. Deinen Rennplan erstellst du im Hybrid Pacer.",
    sessions: {
      run_easy: (ph, lv) => ({ title: "Lockerer Dauerlauf", detail: `${pick(lv, "35–45", "45–60", "55–70")} min ruhig, RPE 3–4 (du kannst durchsprechen). Aerobe Basis.` }),
      run_intervals: (ph, lv, p) => {
        if (ph === "base") return { title: "Tempo-Dauerlauf (Schwelle)", detail: `Einlaufen, dann ${pick(lv, "3", "4", "4")}×6 min im Renntempo${p.race ? ` (≈ ${p.race})` : ""}, RPE 7, je 90 s Trab-Pause. Auslaufen.` };
        if (ph === "peak") return { title: "Renntempo-Intervalle", detail: `${pick(lv, "4", "5", "5")}×1.000 m exakt im Renntempo${p.race ? ` (≈ ${p.race})` : ""}, 2 min Geh-/Trab-Pause. Race-Pace verankern.` };
        return { title: "VO2max-Intervalle", detail: `${pick(lv, "5", "6", "7")}×1.000 m schneller als Renntempo${p.vo2 ? ` (≈ ${p.vo2})` : " (~20 s/km schneller)"}, RPE 8–9, 2 min Pause.` };
      },
      run_long: (ph, lv, p) => ({ title: "Langer Dauerlauf", detail: `${pick(lv, "50–60", "65–80", "80–95")} min, RPE 4.${ph === "build" || ph === "peak" ? ` Die letzten ${pick(lv, "10", "12", "15")} min im Renntempo${p.race ? ` (≈ ${p.race})` : ""}.` : ""}` }),
      compromised: (ph, lv, p) => ({ title: "Compromised Running", detail: `${pick(lv, "4", "5", "6")} Runden: je 400 m im Renntempo${p.race ? ` (≈ ${p.race})` : ""} + sofort 1 Station (im Wechsel: 20 Wall Balls / 15 Burpee Broad Jumps / 500 m Row). Pause nur für den Wechsel.` }),
      strength_lower: (ph, lv) => ({ title: "Kraft – Unterkörper", detail: `${pick(lv, "3", "3–4", "4")} Sätze: Kniebeuge 5–8 Whd · Ausfallschritte 10–12/Seite · Rumänisches Kreuzheben 8–10 · Wadenheben 12–15. 90 s Pause, schwer & sauber.` }),
      strength_pull: (ph, lv) => ({ title: "Kraft – Zug & Grip", detail: `${pick(lv, "3", "3–4", "4")} Sätze: Klimmzüge/Rudern 6–10 · Kreuzheben 5 · Farmer's Carry 2×40 m schwer · Unterarm-Curls 12–15. Für Sled Pull, Farmers & Rudern.` }),
      stations: (ph, lv) => ({ title: "Stationstechnik", detail: `${pick(lv, "2", "3", "3")} Durchgänge: 500 m SkiErg + 500 m Row ökonomisch · 20 Wall Balls am Stück · 15 Burpee Broad Jumps flüssig. Wettkampf-Gewicht, Technik vor Tempo.` }),
      simulation: (ph, lv, p) => {
        if (ph === "peak") return { title: "HYROX-Simulation", detail: `${pick(lv, "6", "6", "8")} Stationen + 1.000-m-Läufe am Stück nahe Renntempo${p.race ? ` (≈ ${p.race})` : ""}. Pacing, Roxzone-Übergänge & Verpflegung testen.` };
        return { title: "Teilsimulation", detail: `4×(1.000 m im Renntempo${p.race ? ` (≈ ${p.race})` : ""} + 1 Station mit Wettkampf-Reps) am Stück. Übergänge üben.` };
      },
      recovery: () => ({ title: "Aktive Erholung", detail: `20–30 min sehr locker (Rad/Schwimmen/Gehen), RPE 2, + 10 min Mobility.` }),
      taper_sharp: () => ({ title: "Kurze Schärfe", detail: `Einlaufen + 4×200 m flott (RPE 8) mit 200 m Geh-Pause. Auslaufen. Beine wach, kein Reiz mehr.` }),
      taper_easy: () => ({ title: "Locker & Mobility", detail: `20–25 min sehr locker (RPE 3) + Mobility. Schlaf & Essen priorisieren.` }),
    },
  },
  en: {
    phase: { base: "Base", build: "Build", peak: "Specific", taper: "Taper", race: "Race day" },
    deload: "Deload",
    raceTitle: "Race day 🏁",
    raceDetail: "Trust the plan, pace evenly, eat & warm up as usual. Build your race plan in the Hybrid Pacer.",
    sessions: {
      run_easy: (ph, lv) => ({ title: "Easy run", detail: `${pick(lv, "35–45", "45–60", "55–70")} min easy, RPE 3–4 (you can talk). Aerobic base.` }),
      run_intervals: (ph, lv, p) => {
        if (ph === "base") return { title: "Tempo run (threshold)", detail: `Warm up, then ${pick(lv, "3", "4", "4")}×6 min at race pace${p.race ? ` (≈ ${p.race})` : ""}, RPE 7, 90 s jog between. Cool down.` };
        if (ph === "peak") return { title: "Race-pace intervals", detail: `${pick(lv, "4", "5", "5")}×1,000 m at race pace${p.race ? ` (≈ ${p.race})` : ""}, 2 min walk/jog rest. Lock in race pace.` };
        return { title: "VO2max intervals", detail: `${pick(lv, "5", "6", "7")}×1,000 m faster than race pace${p.vo2 ? ` (≈ ${p.vo2})` : " (~20 s/km faster)"}, RPE 8–9, 2 min rest.` };
      },
      run_long: (ph, lv, p) => ({ title: "Long run", detail: `${pick(lv, "50–60", "65–80", "80–95")} min, RPE 4.${ph === "build" || ph === "peak" ? ` Last ${pick(lv, "10", "12", "15")} min at race pace${p.race ? ` (≈ ${p.race})` : ""}.` : ""}` }),
      compromised: (ph, lv, p) => ({ title: "Compromised running", detail: `${pick(lv, "4", "5", "6")} rounds: 400 m at race pace${p.race ? ` (≈ ${p.race})` : ""} + straight into 1 station (rotate: 20 wall balls / 15 burpee broad jumps / 500 m row). Rest only to switch.` }),
      strength_lower: (ph, lv) => ({ title: "Strength – lower body", detail: `${pick(lv, "3", "3–4", "4")} sets: squat 5–8 reps · lunges 10–12/side · Romanian deadlift 8–10 · calf raises 12–15. 90 s rest, heavy & clean.` }),
      strength_pull: (ph, lv) => ({ title: "Strength – pull & grip", detail: `${pick(lv, "3", "3–4", "4")} sets: pull-ups/rows 6–10 · deadlift 5 · farmer's carry 2×40 m heavy · forearm curls 12–15. For sled pull, farmers & rowing.` }),
      stations: (ph, lv) => ({ title: "Station technique", detail: `${pick(lv, "2", "3", "3")} rounds: 500 m SkiErg + 500 m row economical · 20 wall balls unbroken · 15 burpee broad jumps smooth. Competition weight, technique before speed.` }),
      simulation: (ph, lv, p) => {
        if (ph === "peak") return { title: "HYROX simulation", detail: `${pick(lv, "6", "6", "8")} stations + 1,000 m runs unbroken near race pace${p.race ? ` (≈ ${p.race})` : ""}. Test pacing, roxzone transitions & fueling.` };
        return { title: "Partial simulation", detail: `4×(1,000 m at race pace${p.race ? ` (≈ ${p.race})` : ""} + 1 station at competition reps) unbroken. Practice transitions.` };
      },
      recovery: () => ({ title: "Active recovery", detail: `20–30 min very easy (bike/swim/walk), RPE 2, + 10 min mobility.` }),
      taper_sharp: () => ({ title: "Short sharpener", detail: `Warm up + 4×200 m brisk (RPE 8) with 200 m walk rest. Cool down. Legs awake, no new stimulus.` }),
      taper_easy: () => ({ title: "Easy & mobility", detail: `20–25 min very easy (RPE 3) + mobility. Prioritise sleep & food.` }),
    },
  },
};

// Weekly skeletons: ordered "roles" per days/week.
function skeleton(days) {
  if (days <= 3) return ["intervals", "strength_stations", "long"];
  if (days === 4) return ["intervals", "strength_lower", "compromised", "long"];
  if (days === 5) return ["intervals", "strength_lower", "stations", "compromised", "long"];
  return ["intervals", "strength_lower", "stations", "compromised", "long", "pull_recovery"];
}

function roleToSession(role, phase, level, loc, p) {
  const S = C[loc].sessions;
  switch (role) {
    case "intervals": return S.run_intervals(phase, level, p);
    case "long": return S.run_long(phase, level, p);
    case "compromised": return phase === "base" ? S.run_easy(phase, level, p) : S.compromised(phase, level, p);
    case "strength_lower": return S.strength_lower(phase, level, p);
    case "stations": return phase === "peak" ? S.simulation(phase, level, p) : S.stations(phase, level, p);
    case "strength_stations": return phase === "base" ? S.strength_lower(phase, level, p) : S.compromised(phase, level, p);
    case "pull_recovery": return S.strength_pull(phase, level, p);
    default: return S.run_easy(phase, level, p);
  }
}

// Derive the recommended training frequency from goal + background.
export function recommendedDays({ targetSec, level, format, gender }) {
  const baseByLevel = { beginner: 3, intermediate: 4, advanced: 5 };
  let d = baseByLevel[level] || 4;
  const ref = (DEFAULTS[format] || DEFAULTS.open)[gender] ?? (DEFAULTS[format] || DEFAULTS.open).men;
  if (targetSec && targetSec > 0 && targetSec < ref) d += 1; // ambitious goal -> more volume
  return Math.max(3, Math.min(6, d));
}

function assignPhases(weeks) {
  // weeks counted from start (0) to race week (weeks-1).
  const taper = weeks >= 9 ? 2 : 1;
  const remaining = Math.max(1, weeks - taper);
  let base = Math.max(1, Math.round(remaining * 0.42));
  let build = Math.max(1, Math.round(remaining * 0.34));
  let peak = remaining - base - build;
  if (peak < 1) { peak = 1; if (base + build + peak > remaining) base = Math.max(1, remaining - build - peak); }
  const seq = [];
  for (let i = 0; i < base; i++) seq.push("base");
  for (let i = 0; i < build; i++) seq.push("build");
  for (let i = 0; i < Math.max(0, remaining - base - build); i++) seq.push("peak");
  for (let i = 0; i < taper; i++) seq.push("taper");
  // safety: pad/truncate to weeks
  while (seq.length < weeks) seq.splice(seq.length - taper, 0, "build");
  return seq.slice(0, weeks);
}

export function buildPlan({ weeks, level, locale, targetSec, format, gender }) {
  const loc = C[locale] ? locale : "de";
  const lv = LEVELS.includes(level) ? level : "intermediate";
  const w = Math.max(1, Math.min(24, weeks | 0));
  const dpw = recommendedDays({ targetSec, level: lv, format: format || "open", gender: gender || "men" });
  const ps = racePaceSec(targetSec);
  const paces = { race: fmtPace(ps), vo2: ps ? fmtPace(ps - 20) : null };

  const phaseSeq = assignPhases(w);
  const out = [];

  for (let i = 0; i < w; i++) {
    const phase = phaseSeq[i];
    const isRaceWeek = i === w - 1;
    const deload = !isRaceWeek && (phase === "base" || phase === "build") && (i + 1) % 4 === 0;

    let days = [];
    if (isRaceWeek) {
      days = [
        C[loc].sessions.taper_sharp(),
        C[loc].sessions.taper_easy(),
        { title: C[loc].raceTitle, detail: C[loc].raceDetail, race: true },
      ];
    } else if (phase === "taper") {
      const n = Math.max(3, dpw - 1);
      days = [];
      for (let d = 0; d < n; d++) {
        days.push(d % 2 === 0 ? C[loc].sessions.taper_sharp() : C[loc].sessions.taper_easy());
      }
      days[n - 1] = C[loc].sessions.recovery();
    } else {
      const roles = skeleton(dpw);
      days = roles.map((r) => roleToSession(r, phase, lv, loc, paces));
      if (deload) {
        // soften a deload week: swap the hardest run for easy, add recovery feel
        days = days.map((s, idx) => (idx === 0 ? C[loc].sessions.run_easy(phase, lv, paces) : s));
      }
    }

    out.push({
      num: i + 1,
      weeksToRace: w - i,
      phase,
      phaseLabel: isRaceWeek ? C[loc].phase.race : (C[loc].phase[phase] || ""),
      deload,
      raceWeek: isRaceWeek,
      days,
    });
  }

  // phase summary (counts)
  const counts = {};
  phaseSeq.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
  const summary = ["base", "build", "peak", "taper"]
    .filter((k) => counts[k])
    .map((k) => ({ key: k, label: C[loc].phase[k], weeks: counts[k] }));

  return { weeks: out, summary, racePace: paces.race || null, daysPerWeek: dpw };
}
