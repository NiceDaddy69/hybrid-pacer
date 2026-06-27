"use client";

import { useEffect, useState } from "react";
import { buildPlan, LEVELS, DAYS, DEFAULTS, parseTime, fmtTime } from "./planmodel";

const C = {
  bg: "#0B0F14", panel: "#161C26", panel2: "#1D2531", line: "#2A3543",
  text: "#E9EEF3", muted: "#8593A3", run: "#4EA8DE", station: "#FF5A36", ink: "#0F1419",
};
const DISPLAY = "var(--font-display)";
const MONO = "var(--font-mono)";
const STORE = "hybridpacer:plan:v1";

const T = {
  de: {
    title: "TRAININGS\u200BPLAN", beta: "Beta",
    raceDate: "Renntag", level: "Level", days: "Tage / Woche", format: "Format", category: "Kategorie",
    targetTime: "Zielzeit (HYROX-Finish)", racePace: "Renntempo",
    levels: { beginner: "Einsteiger", intermediate: "Fortgeschritten", advanced: "Ambitioniert" },
    genders: { men: "Herren", women: "Damen", mixed: "Mixed" },
    generate: "Plan erstellen",
    pickDate: "Wähle deinen Renntag – dein Plan erscheint dann automatisch.",
    pastDate: "Das Datum liegt in der Vergangenheit – bitte einen späteren Renntag wählen.",
    capped: "Langer Vorlauf – angezeigt werden die letzten 24 Wochen.",
    weeksToRace: (n) => `${n} ${n === 1 ? "Woche" : "Wochen"} bis zum Renntag`,
    phases: "Phasen", week: "Woche", deload: "Deload",
    copy: "Plan kopieren", copied: "Kopiert", link: "Link", linkCopied: "Link kopiert",
    setup: (f, g) => `Setup: ${f} · ${g} – trainiere die Stationen mit deinem Wettkampf-Gewicht.`,
    disclaimer: "Strukturiertes Framework nach gängiger HYROX-Periodisierung – kein individuelles Coaching und kein ärztlicher Rat. Höre auf deinen Körper, passe Umfänge an und kläre im Zweifel ärztlich ab.",
    planHeading: "Trainingsplan",
  },
  en: {
    title: "TRAINING PLAN", beta: "Beta",
    raceDate: "Race day", level: "Level", days: "Days / week", format: "Format", category: "Category",
    targetTime: "Target time (HYROX finish)", racePace: "Race pace",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    genders: { men: "Men", women: "Women", mixed: "Mixed" },
    generate: "Build plan",
    pickDate: "Pick your race day – your plan appears automatically.",
    pastDate: "That date is in the past – please pick a later race day.",
    capped: "Long lead time – showing the last 24 weeks.",
    weeksToRace: (n) => `${n} ${n === 1 ? "week" : "weeks"} to race day`,
    phases: "Phases", week: "Week", deload: "Deload",
    copy: "Copy plan", copied: "Copied", link: "Link", linkCopied: "Link copied",
    setup: (f, g) => `Setup: ${f} · ${g} – train the stations with your competition weight.`,
    disclaimer: "A structured framework based on common HYROX periodization – not individual coaching and not medical advice. Listen to your body, adjust volume, and consult a professional if in doubt.",
    planHeading: "Training plan",
  },
};

const FORMATS = [{ k: "open", l: "Open" }, { k: "pro", l: "Pro" }, { k: "doubles", l: "Doubles" }];

function enc(obj) { try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch (e) { return ""; } }
function dec(s) { try { return JSON.parse(decodeURIComponent(atob(s))); } catch (e) { return null; } }

function weeksUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return 0;
  return Math.max(1, Math.ceil((diff + 1) / 7));
}

function defaultTarget(format, gender) {
  const f = DEFAULTS[format] || DEFAULTS.open;
  const sec = f[gender] != null ? f[gender] : f.men;
  return fmtTime(sec);
}

export default function TrainingPlan({ locale = "de" }) {
  const t = T[locale] || T.de;

  const [raceDate, setRaceDate] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [format, setFormat] = useState("open");
  const [gender, setGender] = useState("men");
  const [targetStr, setTargetStr] = useState("");
  const [targetTouched, setTargetTouched] = useState(false);
  const [open, setOpen] = useState(() => new Set([1]));
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // restore from URL or localStorage
  useEffect(() => {
    let init = null;
    try {
      const qs = new URLSearchParams(window.location.search);
      const p = qs.get("p");
      if (p) init = dec(p);
    } catch (e) {}
    if (!init) { try { const s = localStorage.getItem(STORE); if (s) init = JSON.parse(s); } catch (e) {} }
    if (init) {
      if (init.d) setRaceDate(init.d);
      if (LEVELS.includes(init.lv)) setLevel(init.lv);
      if (DAYS.includes(init.dpw)) setDaysPerWeek(init.dpw);
      if (init.f) setFormat(init.f);
      if (init.g) setGender(init.g);
      if (init.t) { setTargetStr(init.t); setTargetTouched(true); }
    }
    setHydrated(true);
  }, []);

  // Prefill the target time from the format/category default until the user edits it.
  useEffect(() => {
    if (!hydrated || targetTouched) return;
    setTargetStr(defaultTarget(format, gender));
  }, [hydrated, targetTouched, format, gender]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE, JSON.stringify({ d: raceDate, lv: level, dpw: daysPerWeek, f: format, g: gender, t: targetStr })); } catch (e) {}
  }, [hydrated, raceDate, level, daysPerWeek, format, gender, targetStr]);

  const rawWeeks = weeksUntil(raceDate);
  const capped = rawWeeks && rawWeeks > 24;
  const weeks = rawWeeks ? Math.min(24, rawWeeks) : null;
  const targetSec = parseTime(targetStr);
  const plan = weeks && weeks >= 1 ? buildPlan({ weeks, daysPerWeek, level, locale, targetSec }) : null;

  function toggle(n) {
    setOpen((prev) => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });
  }

  function shareLink() {
    const obj = { d: raceDate, lv: level, dpw: daysPerWeek, f: format, g: gender, t: targetStr };
    const e = enc(obj);
    try { window.history.replaceState(null, "", `?p=${e}`); } catch (err) {}
    const url = `${window.location.origin}${window.location.pathname}?p=${e}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800);
  }

  function planText() {
    if (!plan) return "";
    const lines = [`HYBRIDSTATE – ${t.planHeading}`, t.weeksToRace(weeks)];
    if (plan.racePace) lines.push(`${t.racePace}: ≈ ${plan.racePace}`);
    lines.push("");
    plan.weeks.forEach((w) => {
      const ph = `${t.week} ${w.num} · ${w.phaseLabel}${w.deload ? " · " + t.deload : ""}`;
      lines.push(ph);
      w.days.forEach((d) => lines.push(`  – ${d.title}: ${d.detail}`));
      lines.push("");
    });
    return lines.join("\n");
  }

  function copyPlan() {
    navigator.clipboard?.writeText(planText());
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  const fmtLabel = FORMATS.find((f) => f.k === format)?.l || "Open";
  const genLabel = t.genders[gender] || "";

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "9px 6px", fontSize: 13, cursor: "pointer", borderRadius: 8,
      fontFamily: DISPLAY, letterSpacing: "0.03em", textTransform: "uppercase",
      background: active ? C.station : "transparent", color: active ? C.ink : C.muted,
      border: `1px solid ${active ? C.station : C.line}`,
    }}>{children}</button>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 16px 40px", color: C.text }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `2px solid ${C.line}`, paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 28, letterSpacing: "0.02em", lineHeight: 1, margin: 0 }}>{t.title}</h1>
          <span style={{ fontSize: 10, color: C.run, border: `1px solid ${C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.beta}</span>
        </div>
        <div style={{ display: "flex", gap: 6, fontSize: 12, fontFamily: DISPLAY }}>
          <a href="/de/trainingsplan" style={{ color: locale === "de" ? C.text : C.muted, textDecoration: "none" }}>DE</a>
          <span style={{ color: C.line }}>|</span>
          <a href="/en/trainingsplan" style={{ color: locale === "en" ? C.text : C.muted, textDecoration: "none" }}>EN</a>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Field label={t.raceDate}>
          <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)}
            style={{ width: "100%", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 12px", color: C.text, fontSize: 15, fontFamily: MONO, outline: "none", colorScheme: "dark" }} />
        </Field>

        <Field label={t.targetTime}>
          <input type="text" inputMode="numeric" value={targetStr}
            onChange={(e) => { setTargetStr(e.target.value); setTargetTouched(true); }}
            placeholder="1:25:00"
            style={{ width: "100%", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 12px", color: C.text, fontSize: 15, fontFamily: MONO, outline: "none" }} />
        </Field>

        <Field label={t.level}>
          <div style={{ display: "flex", gap: 8 }}>
            {LEVELS.map((lv) => <Pill key={lv} active={level === lv} onClick={() => setLevel(lv)}>{t.levels[lv]}</Pill>)}
          </div>
        </Field>

        <Field label={t.days}>
          <div style={{ display: "flex", gap: 8 }}>
            {DAYS.map((d) => <Pill key={d} active={daysPerWeek === d} onClick={() => setDaysPerWeek(d)}>{d}</Pill>)}
          </div>
        </Field>

        <Field label={t.format}>
          <div style={{ display: "flex", gap: 8 }}>
            {FORMATS.map((f) => <Pill key={f.k} active={format === f.k} onClick={() => setFormat(f.k)}>{f.l}</Pill>)}
          </div>
        </Field>

        <Field label={t.category}>
          <div style={{ display: "flex", gap: 8 }}>
            {["men", "women", "mixed"].map((g) => <Pill key={g} active={gender === g} onClick={() => setGender(g)}>{t.genders[g]}</Pill>)}
          </div>
        </Field>
      </div>

      {/* Result */}
      {!plan ? (
        <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "8px 0 4px" }}>
          {rawWeeks === 0 ? t.pastDate : t.pickDate}
        </div>
      ) : (
        <>
          <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, marginBottom: 10 }}>{t.weeksToRace(weeks)}</div>
            {plan.racePace ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.station}`, borderRadius: 999, padding: "5px 12px", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.racePace}</span>
                <span style={{ fontFamily: MONO, fontSize: 14, color: C.station }}>≈ {plan.racePace}</span>
              </div>
            ) : null}
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>{t.setup(fmtLabel, genLabel)}</div>
            {capped ? <div style={{ fontSize: 12, color: C.run, marginBottom: 12 }}>{t.capped}</div> : null}
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{t.phases}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {plan.summary.map((p) => (
                <span key={p.key} style={{ fontSize: 12, color: C.text, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 11px" }}>
                  {p.label} · {p.weeks}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={copyPlan} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.station, color: C.ink, fontFamily: DISPLAY, letterSpacing: "0.05em", textTransform: "uppercase", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                {copied ? t.copied : t.copy}
              </button>
              <button onClick={shareLink} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: C.text, fontFamily: DISPLAY, letterSpacing: "0.05em", textTransform: "uppercase", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                {linkCopied ? t.linkCopied : t.link}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {plan.weeks.map((w) => {
              const isOpen = open.has(w.num);
              return (
                <div key={w.num} style={{ background: C.panel, border: `1px solid ${w.raceWeek ? C.station : C.line}`, borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => toggle(w.num)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "transparent", border: "none", color: C.text, padding: "13px 14px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 15 }}>{t.week} {w.num}</span>
                      <span style={{ fontSize: 11, color: w.raceWeek ? C.station : C.run, border: `1px solid ${w.raceWeek ? C.station : C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{w.phaseLabel}</span>
                      {w.deload ? <span style={{ fontSize: 11, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 999, padding: "2px 8px", textTransform: "uppercase" }}>{t.deload}</span> : null}
                    </span>
                    <span style={{ color: C.muted, fontSize: 13, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
                  </button>
                  {isOpen ? (
                    <div style={{ padding: "0 14px 12px" }}>
                      {w.days.map((d, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: `1px solid ${C.line}` }}>
                          <div style={{ width: 22, flexShrink: 0, color: C.muted, fontFamily: MONO, fontSize: 12, paddingTop: 1 }}>{i + 1}</div>
                          <div>
                            <div style={{ fontSize: 14, color: d.race ? C.station : C.text, fontWeight: 600 }}>{d.title}</div>
                            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 2 }}>{d.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: 20, fontSize: 11.5, color: "#6B7785", lineHeight: 1.6 }}>{t.disclaimer}</div>
    </div>
  );
}
