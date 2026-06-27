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
      run_easy: (ph, lv) => ({ title: "Lockerer Dauerlauf", detail: `${pick(lv, "35–45", "45–60", "55–70")} min im Gesprächstempo. Aerobe Basis, ruhige Atmung.` }),
      run_intervals: (ph, lv, pace) => {
        if (ph === "base") return { title: "Tempo-Intervalle", detail: `${pick(lv, "4", "5", "6")}×3 min zügig (Schwelle), 90 s Trab dazwischen.` };
        if (ph === "peak") return { title: "Renntempo-Intervalle", detail: `${pick(lv, "4", "4", "5")}×1 km im HYROX-Renntempo${pace ? ` (≈ ${pace})` : ""}, 2 min Pause. Race-Pace verankern.` };
        return { title: "VO2max-Intervalle", detail: `${pick(lv, "6", "7", "8")}×400 m schnell (≈5-km-Pace), 90 s Pause. Laufökonomie unter Last.` };
      },
      run_long: (ph, lv, pace) => ({ title: "Langer Lauf", detail: `${pick(lv, "50–60", "65–80", "80–95")} min ruhig.${ph === "build" || ph === "peak" ? ` Letzte 10–15 min im Renntempo${pace ? ` (≈ ${pace})` : ""}.` : ""}` }),
      compromised: (ph, lv) => ({ title: "Compromised Running", detail: `${pick(lv, "4", "5", "6")} Runden à 400 m Lauf + 1 Station (Wall Balls, Burpee Broad Jumps, Rudern im Wechsel). Simuliert die Beine-zu-Lauf-Umstellung.` }),
      strength_lower: (ph, lv) => ({ title: "Kraft – Unterkörper", detail: `Kniebeuge, Ausfallschritte, Rumänisches Kreuzheben, Wadenheben. ${pick(lv, "3", "3–4", "4")} Sätze, schwer & sauber. Basis für Sled Push/Pull & Lunges.` }),
      strength_pull: (ph, lv) => ({ title: "Kraft – Zug & Grip", detail: `Klimmzüge/Rudern, Farmer's Carry, Kreuzheben, Unterarme. Zahlt auf Sled Pull, Farmers & Rudern ein.` }),
      stations: (ph, lv) => ({ title: "Stationstechnik", detail: `SkiErg & Rudern ökonomisch, Wall-Ball-Rhythmus, Burpee Broad Jumps effizient. Technik vor Tempo – mit Wettkampf-Gewicht (Open/Pro beachten).` }),
      simulation: (ph, lv) => {
        if (ph === "peak") return { title: "HYROX-Simulation", detail: `6–8 Stationen + Läufe nahe Renntempo am Stück. Pacing, Übergänge (Roxzone) und Verpflegung testen.` };
        return { title: "Teilsimulation", detail: `4 Stationen + Läufe am Stück im Zieltempo. Roxzone-Übergänge bewusst üben.` };
      },
      recovery: () => ({ title: "Aktive Erholung", detail: `20–30 min locker (Rad/Gehen/Schwimmen) + Mobility. Regeneration ist Teil des Trainings.` }),
      taper_sharp: () => ({ title: "Kurze Schärfe", detail: `Einlaufen + 3–4×200 m flott mit langer Pause. Beine wach halten, keinen Reiz mehr setzen.` }),
      taper_easy: () => ({ title: "Locker & Mobility", detail: `20–30 min sehr locker, dazu Mobility. Schlaf & Essen priorisieren.` }),
    },
  },
  en: {
    phase: { base: "Base", build: "Build", peak: "Specific", taper: "Taper", race: "Race day" },
    deload: "Deload",
    raceTitle: "Race day 🏁",
    raceDetail: "Trust the plan, pace evenly, eat & warm up as usual. Build your race plan in the Hybrid Pacer.",
    sessions: {
      run_easy: (ph, lv) => ({ title: "Easy run", detail: `${pick(lv, "35–45", "45–60", "55–70")} min at conversational pace. Aerobic base, calm breathing.` }),
      run_intervals: (ph, lv, pace) => {
        if (ph === "base") return { title: "Tempo intervals", detail: `${pick(lv, "4", "5", "6")}×3 min strong (threshold), 90 s jog between.` };
        if (ph === "peak") return { title: "Race-pace intervals", detail: `${pick(lv, "4", "4", "5")}×1 km at HYROX race pace${pace ? ` (≈ ${pace})` : ""}, 2 min rest. Lock in race pace.` };
        return { title: "VO2max intervals", detail: `${pick(lv, "6", "7", "8")}×400 m fast (≈5k pace), 90 s rest. Running economy under load.` };
      },
      run_long: (ph, lv, pace) => ({ title: "Long run", detail: `${pick(lv, "50–60", "65–80", "80–95")} min easy.${ph === "build" || ph === "peak" ? ` Last 10–15 min at race pace${pace ? ` (≈ ${pace})` : ""}.` : ""}` }),
      compromised: (ph, lv) => ({ title: "Compromised running", detail: `${pick(lv, "4", "5", "6")} rounds of 400 m run + 1 station (wall balls, burpee broad jumps, row). Trains the legs-to-run switch.` }),
      strength_lower: (ph, lv) => ({ title: "Strength – lower body", detail: `Squats, lunges, Romanian deadlift, calf raises. ${pick(lv, "3", "3–4", "4")} sets, heavy & clean. Base for sled push/pull & lunges.` }),
      strength_pull: (ph, lv) => ({ title: "Strength – pull & grip", detail: `Pull-ups/rows, farmer's carry, deadlift, forearms. Feeds sled pull, farmers & rowing.` }),
      stations: (ph, lv) => ({ title: "Station technique", detail: `Economical SkiErg & row, wall-ball rhythm, efficient burpee broad jumps. Technique before speed – use competition weight (mind Open/Pro).` }),
      simulation: (ph, lv) => {
        if (ph === "peak") return { title: "HYROX simulation", detail: `6–8 stations + runs unbroken near race pace. Test pacing, transitions (roxzone) and fueling.` };
        return { title: "Partial simulation", detail: `4 stations + runs unbroken at target pace. Practice roxzone transitions.` };
      },
      recovery: () => ({ title: "Active recovery", detail: `20–30 min easy (bike/walk/swim) + mobility. Recovery is part of training.` }),
      taper_sharp: () => ({ title: "Short sharpener", detail: `Warm up + 3–4×200 m brisk with long rest. Keep the legs awake, no new stimulus.` }),
      taper_easy: () => ({ title: "Easy & mobility", detail: `20–30 min very easy plus mobility. Prioritise sleep & food.` }),
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

function roleToSession(role, phase, level, loc, pace) {
  const S = C[loc].sessions;
  switch (role) {
    case "intervals": return S.run_intervals(phase, level, pace);
    case "long": return S.run_long(phase, level, pace);
    case "compromised": return phase === "base" ? S.run_easy(phase, level) : S.compromised(phase, level);
    case "strength_lower": return S.strength_lower(phase, level);
    case "stations": return phase === "peak" ? S.simulation(phase, level) : S.stations(phase, level);
    case "strength_stations": return phase === "base" ? S.strength_lower(phase, level) : S.compromised(phase, level);
    case "pull_recovery": return S.strength_pull(phase, level);
    default: return S.run_easy(phase, level);
  }
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

export function buildPlan({ weeks, daysPerWeek, level, locale, targetSec }) {
  const loc = C[locale] ? locale : "de";
  const lv = LEVELS.includes(level) ? level : "intermediate";
  const dpw = DAYS.includes(daysPerWeek) ? daysPerWeek : 4;
  const w = Math.max(1, Math.min(24, weeks | 0));
  const paceStr = fmtPace(racePaceSec(targetSec));

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
      days = roles.map((r) => roleToSession(r, phase, lv, loc, paceStr));
      if (deload) {
        // soften a deload week: swap the hardest run for easy, add recovery feel
        days = days.map((s, idx) => (idx === 0 ? C[loc].sessions.run_easy(phase, lv) : s));
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

  return { weeks: out, summary, racePace: paceStr || null };
}
