"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, ReferenceLine } from "recharts";
import { Timer, Activity, Dumbbell, Copy, Check, Link2, Download, ChevronDown, ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import { dict } from "./i18n";

const C = {
  bg: "#0F1419", panel: "#161C26", panel2: "#1D2531", line: "#2A3543",
  text: "#E9EEF3", muted: "#8593A3",
  run: "#4EA8DE", runDim: "#16303f",
  station: "#FF5A36", stationDim: "#3a1d14",
  ink: "#0F1419",
};
const DISPLAY = "var(--font-display),'Arial Black','Helvetica Neue',Helvetica,sans-serif";
const MONO = "var(--font-mono),ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace";
const SHADOW = "0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)";
const STORE_KEY = "hybridpacer:v1";

const ORDER = [
  { type: "run", n: 1 },
  { type: "station", key: "ski", name: "SkiErg", detail: "1000 m" },
  { type: "run", n: 2 },
  { type: "station", key: "push", name: "Sled Push", detail: "50 m" },
  { type: "run", n: 3 },
  { type: "station", key: "pull", name: "Sled Pull", detail: "50 m" },
  { type: "run", n: 4 },
  { type: "station", key: "burpee", name: "Burpee Broad Jumps", detail: "80 m" },
  { type: "run", n: 5 },
  { type: "station", key: "row", name: "Rowing", detail: "1000 m" },
  { type: "run", n: 6 },
  { type: "station", key: "farmer", name: "Farmers Carry", detail: "200 m" },
  { type: "run", n: 7 },
  { type: "station", key: "lunge", name: "Sandbag Lunges", detail: "100 m" },
  { type: "run", n: 8 },
  { type: "station", key: "wall", name: "Wall Balls", detail: "100 / 75 Reps" },
];

const DEFAULTS = {
  open: { men: 88 * 60, women: 100 * 60 },
  pro: { men: 75 * 60, women: 85 * 60 },
  doubles: { men: 62 * 60, women: 72 * 60, mixed: 66 * 60 },
};

function fmt(sec) {
  if (sec == null || isNaN(sec) || sec < 0) return "–";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function parseTime(str) {
  if (typeof str !== "string") return null;
  const p = str.trim().split(":").map((x) => x.trim());
  if (p.some((x) => x === "" || isNaN(Number(x)))) return null;
  let sec = 0;
  if (p.length === 3) sec = +p[0] * 3600 + +p[1] * 60 + +p[2];
  else if (p.length === 2) sec = +p[0] * 60 + +p[1];
  else if (p.length === 1) sec = +p[0] * 60;
  else return null;
  return sec;
}

function computeReference(finishSec, format, gender, bias) {
  const rox = Math.max(finishSec * 0.06, 180);
  const work = finishSec - rox;
  const runW = 0.47 + 0.1 * bias;
  const stW = 0.47 - 0.1 * bias;
  const runningTotal = work * (runW / (runW + stW));
  const stationsTotal = work - runningTotal;
  const rf = [];
  for (let i = 0; i < 8; i++) rf.push(0.93 + 0.14 * (i / 7));
  const rfSum = rf.reduce((a, b) => a + b, 0);
  const w = { ski: 1.0, push: 1.2, pull: 1.05, burpee: 1.15, row: 1.05, farmer: 0.8, lunge: 1.0, wall: 1.3 };
  if (format === "pro") { w.push += 0.2; w.pull += 0.1; }
  const wSum = Object.values(w).reduce((a, b) => a + b, 0);
  let runIdx = 0;
  const segs = ORDER.map((seg) => {
    if (seg.type === "run") {
      const sec = runningTotal * (rf[runIdx] / rfSum);
      runIdx++;
      return { ...seg, sec };
    }
    return { ...seg, sec: stationsTotal * (w[seg.key] / wSum) };
  });
  return { segs, rox, runningTotal, stationsTotal };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function encodeState(obj) {
  try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch (e) { return ""; }
}
function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch (e) { return null; }
}
function ev(name, data) { try { track(name, data); } catch (e) {} }

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: DISPLAY, letterSpacing: "0.08em", textTransform: "uppercase",
      fontSize: 12, padding: "8px 12px", borderRadius: 6, cursor: "pointer",
      background: active ? C.text : "transparent", color: active ? C.ink : C.muted,
      border: `1px solid ${active ? C.text : C.line}`,
    }}>{children}</button>
  );
}

const INIT = { format: "pro", gender: "men" };
const initDef = DEFAULTS[INIT.format][INIT.gender];
const initRef = computeReference(initDef, INIT.format, INIT.gender, 0);

export default function Pacer({ locale = "de" }) {
  const t = dict[locale] || dict.de;
  const segLabel = (s) => (s.type === "run" ? `${t.run} ${s.n}` : s.name);

  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState("plan");
  const [format, setFormat] = useState(INIT.format);
  const [gender, setGender] = useState(INIT.gender);
  const [targetStr, setTargetStr] = useState(fmt(initDef));
  const [bias, setBias] = useState(0);
  const [runDist, setRunDist] = useState(10);
  const [runTimeStr, setRunTimeStr] = useState("");
  const [estOpen, setEstOpen] = useState(false);
  const [splits, setSplits] = useState(initRef.segs.map((s) => fmt(s.sec)));
  const [roxStr, setRoxStr] = useState(fmt(initRef.rox));
  const [goalStr, setGoalStr] = useState(fmt(initDef));
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailStr, setEmailStr] = useState("");
  const [sendState, setSendState] = useState("idle");
  const [sendMsg, setSendMsg] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [contribState, setContribState] = useState("idle");
  const [contribMsg, setContribMsg] = useState("");
  const [benchmark, setBenchmark] = useState({ n: 0 });
  const [compareSrc, setCompareSrc] = useState("model");

  const genders = format === "doubles" ? ["men", "women", "mixed"] : ["men", "women"];
  const safeGender = genders.includes(gender) ? gender : "men";

  // Load shared state from URL (?p=) or, failing that, from localStorage.
  useEffect(() => {
    setMounted(true);
    try { document.documentElement.lang = locale; } catch (e) {}
    const apply = (o) => {
      if (!o) return;
      if (o.mode || o.m) setMode(o.mode || o.m);
      if (o.format || o.f) setFormat(o.format || o.f);
      if (o.gender || o.g) setGender(o.gender || o.g);
      if (typeof (o.t) === "string") setTargetStr(o.t);
      if (typeof o.b === "number") setBias(o.b);
      if (Array.isArray(o.s) && o.s.length === 16) setSplits(o.s);
      if (typeof o.r === "string") setRoxStr(o.r);
      if (typeof o.go === "string") setGoalStr(o.go);
      if (o.rd === 5 || o.rd === 10) setRunDist(o.rd);
      if (typeof o.rt === "string") setRunTimeStr(o.rt);
    };
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      if (p) {
        apply(decodeState(p));
      } else {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (raw) apply(JSON.parse(raw));
      }
    } catch (e) {}
    setHydrated(true);
  }, [locale]);

  // Persist inputs (no email/PII) once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({
        mode, format, gender, t: targetStr, b: bias, s: splits, r: roxStr, go: goalStr, rd: runDist, rt: runTimeStr,
      }));
    } catch (e) {}
  }, [hydrated, mode, format, gender, targetStr, bias, splits, roxStr, goalStr, runDist, runTimeStr]);

  // Fetch community benchmarks for the current division (data flywheel).
  useEffect(() => {
    let active = true;
    fetch(`/api/benchmarks?fmt=${format}&gender=${safeGender}`)
      .then((r) => r.json())
      .then((d) => { if (active) { setBenchmark(d || { n: 0 }); if ((d?.n || 0) < 10) setCompareSrc("model"); } })
      .catch(() => { if (active) setBenchmark({ n: 0 }); });
    return () => { active = false; };
  }, [format, safeGender]);

  function applyFormatGender(newFormat, newGender) {
    const g = newFormat === "doubles"
      ? (["men", "women", "mixed"].includes(newGender) ? newGender : "men")
      : (["men", "women"].includes(newGender) ? newGender : "men");
    const df = DEFAULTS[newFormat][g] || DEFAULTS[newFormat].men;
    const br = computeReference(df, newFormat, g, 0);
    setFormat(newFormat); setGender(g);
    setTargetStr(fmt(df));
    setSplits(br.segs.map((s) => fmt(s.sec)));
    setRoxStr(fmt(br.rox));
    setGoalStr(fmt(df));
  }

  const targetSec = parseTime(targetStr);
  const plan = useMemo(
    () => (targetSec ? computeReference(targetSec, format, safeGender, bias) : null),
    [targetSec, format, safeGender, bias]
  );
  const planRows = useMemo(() => {
    if (!plan) return [];
    let cum = 0;
    const roxEach = plan.rox / ORDER.length;
    return plan.segs.map((s) => { cum += s.sec + roxEach; return { ...s, cum }; });
  }, [plan]);

  const runEstimate = useMemo(() => {
    const tt = parseTime(runTimeStr);
    if (tt == null || tt <= 0) return null;
    const pace = tt / runDist;
    const offset = runDist <= 5 ? 45 : 28;
    const hyroxPace = pace + offset;
    const runningTotal = hyroxPace * 8;
    const runW = 0.47 + 0.1 * bias, stW = 0.47 - 0.1 * bias;
    const ratio = runW / (runW + stW);
    const finish = runningTotal / (0.94 * ratio);
    return { pace, offset, hyroxPace, finish };
  }, [runTimeStr, runDist, bias]);

  function applyEstimate() {
    if (runEstimate) { setTargetStr(fmt(runEstimate.finish)); ev("estimate_applied", { dist: runDist }); }
  }

  const benchAvg = DEFAULTS[format][safeGender] || DEFAULTS[format].men;
  const analysis = useMemo(() => {
    const actual = splits.map((x) => parseTime(x));
    const roxA = parseTime(roxStr);
    const goalSec = parseTime(goalStr);
    if (!actual.every((x) => x != null) || roxA == null) return null;
    const predicted = actual.reduce((a, b) => a + b, 0) + roxA;
    const useCommunity = compareSrc === "community" && benchmark.n >= 10 && Array.isArray(benchmark.medians);
    const modelRef = goalSec ? computeReference(goalSec, format, safeGender, 0) : null;
    const refSeg = (i) => (useCommunity ? benchmark.medians[i] : (modelRef ? modelRef.segs[i].sec : null));
    const rows = ORDER.map((seg, i) => {
      const rv = refSeg(i);
      return { label: segLabel(seg), type: seg.type, actual: actual[i], ref: rv, delta: rv != null ? actual[i] - rv : 0 };
    });
    const losses = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
    return { predicted, goalSec, rows, losses };
  }, [splits, roxStr, goalStr, format, safeGender, locale, compareSrc, benchmark]);

  function buildPlanText() {
    if (!plan) return "";
    const lines = [`HYBRID PACER — ${t.tabPlan} (${format.toUpperCase()} ${safeGender})`, `${t.targetArrow} ${fmt(targetSec)}`, ""];
    planRows.forEach((s) => lines.push(`${segLabel(s).padEnd(20)} ${fmt(s.sec)}   @ ${fmt(s.cum)}`));
    lines.push("", `${t.sumRoxzone}: ${fmt(plan.rox)}`);
    return lines.join("\n");
  }
  function buildAnalysisText() {
    if (!analysis) return "";
    const lines = [`HYBRID PACER — ${t.tabAnalyse} (${format.toUpperCase()} ${safeGender})`, `${t.predicted}: ${fmt(analysis.predicted)}`];
    if (analysis.goalSec != null) {
      lines.push(`${analysis.predicted <= analysis.goalSec ? t.under : t.over} ${t.targetBy} ${fmt(Math.abs(analysis.predicted - analysis.goalSec))}`);
    }
    lines.push("", `${t.biggestLosses}:`);
    analysis.losses.forEach((r, i) => lines.push(`${i + 1}. ${r.label}  +${fmt(r.delta)}`));
    return lines.join("\n");
  }
  function buildShareUrl() {
    const obj = { m: mode, f: format, g: safeGender, t: targetStr, b: bias, s: splits, r: roxStr, go: goalStr };
    const enc = encodeState(obj);
    window.history.replaceState(null, "", `?p=${enc}`);
    return `${window.location.origin}${window.location.pathname}?p=${enc}`;
  }
  function copyPlan() {
    if (!plan) return;
    navigator.clipboard?.writeText(buildPlanText());
    setCopied(true); setTimeout(() => setCopied(false), 1800);
    ev("plan_copied", { format });
  }
  function shareLink() {
    navigator.clipboard?.writeText(buildShareUrl());
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800);
    ev("link_shared", { mode });
  }
  function downloadCard(size) {
    const obj = { m: mode, f: format, g: safeGender, t: targetStr, b: bias, s: splits, r: roxStr, go: goalStr };
    const enc = encodeState(obj);
    const story = size === "story";
    const a = document.createElement("a");
    a.href = `/api/race-card?p=${enc}${story ? "&size=story" : ""}`;
    a.download = story ? "hybrid-pacer-story.png" : "hybrid-pacer-race-card.png";
    document.body.appendChild(a); a.click(); a.remove();
    ev("card_downloaded", { format, size: story ? "story" : "landscape" });
  }
  async function sendEmail(getBody, subject, heading) {
    const body = typeof getBody === "function" ? getBody() : getBody;
    if (!body) return;
    if (!EMAIL_RE.test(emailStr)) { setSendState("error"); setSendMsg(t.invalidEmail); return; }
    setSendState("sending"); setSendMsg("");
    try {
      const res = await fetch("/api/send-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailStr, subject, heading, planText: body, shareUrl: buildShareUrl(), newsletter, lang: locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSendState("ok");
        setSendMsg(newsletter && data.optin ? t.sentOkOptin : t.sentOk);
        ev("email_submitted", { newsletter: !!newsletter, mode });
      } else { setSendState("error"); setSendMsg(data.error || t.sendFail); }
    } catch { setSendState("error"); setSendMsg(t.netErr); }
  }
  const sendPlanEmail = () => sendEmail(buildPlanText, `${t.planSubject} (${fmt(targetSec)})`, t.planSubject);
  const sendAnalysisEmail = () => sendEmail(buildAnalysisText, t.analysisSubject, t.analysisHeading);

  async function contributeResult() {
    if (!analysis) return;
    const segs = splits.map((x) => parseTime(x));
    const rox = parseTime(roxStr);
    if (segs.some((x) => x == null) || rox == null) return;
    setContribState("sending"); setContribMsg("");
    try {
      const res = await fetch("/api/results", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fmt: format, gender: safeGender, finish: Math.round(analysis.predicted), rox: Math.round(rox), segs: segs.map((x) => Math.round(x)) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setContribState("ok"); setContribMsg(t.contribThanks);
        setBenchmark((b) => ({ ...b, n: data.n }));
        ev("result_contributed", { format });
      } else { setContribState("error"); setContribMsg(data.error || t.contribFail); }
    } catch { setContribState("error"); setContribMsg(t.contribFail); }
  }

  const ghost = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: C.muted, fontFamily: DISPLAY, letterSpacing: "0.04em", border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 6px", fontSize: 12, cursor: "pointer", textTransform: "uppercase" };

  const ShareBtn = () => (
    <button onClick={shareLink} style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: "transparent", color: C.text, fontFamily: DISPLAY, letterSpacing: "0.06em",
      border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 13, cursor: "pointer", textTransform: "uppercase" }}>
      {linkCopied ? <Check size={16} /> : <Link2 size={16} />}{linkCopied ? t.linkCopied : t.shareLink}
    </button>
  );

  // Returned as plain JSX (called, not mounted as a component) to keep input focus.
  const emailPanel = (title, onSend) => (
    <div style={{ marginTop: 14, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={emailStr} onChange={(e) => setEmailStr(e.target.value)} inputMode="email" type="email" placeholder={t.emailPlaceholder} aria-label="email"
          style={{ flex: 1, minWidth: 0, background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none" }} />
        <button onClick={onSend} disabled={sendState === "sending"}
          style={{ background: C.run, color: C.ink, border: "none", borderRadius: 8, padding: "0 16px", fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", opacity: sendState === "sending" ? 0.6 : 1 }}>
          {sendState === "sending" ? "…" : t.send}
        </button>
      </div>
      {sendMsg ? <div style={{ marginTop: 8, fontSize: 12, color: sendState === "ok" ? C.run : C.station }}>{sendMsg}</div> : null}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, color: C.muted, fontSize: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ marginTop: 2, accentColor: C.run }} />
        <span>{t.consent}</span>
      </label>
      <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
        {t.emailNotePre}<a href="/datenschutz" style={{ color: C.run }}>{t.privacy}</a>.
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `2px solid ${C.line}`, paddingBottom: 14, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 30, letterSpacing: "0.02em", lineHeight: 1, margin: 0 }}>
            HYBRID <span style={{ color: C.station }}>PACER</span>
          </h1>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6, letterSpacing: "0.04em" }}>{t.brandSub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, fontSize: 12, fontFamily: DISPLAY }}>
            <a href="/de" style={{ color: locale === "de" ? C.text : C.muted, textDecoration: "none" }}>DE</a>
            <span style={{ color: C.line }}>|</span>
            <a href="/en" style={{ color: locale === "en" ? C.text : C.muted, textDecoration: "none" }}>EN</a>
          </div>
          <Timer size={26} color={C.run} aria-hidden />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Pill active={mode === "plan"} onClick={() => setMode("plan")}>{t.tabPlan}</Pill>
        <Pill active={mode === "analyse"} onClick={() => setMode("analyse")}>{t.tabAnalyse}</Pill>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.format}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {["open", "pro", "doubles"].map((f) => (
            <Pill key={f} active={format === f} onClick={() => applyFormatGender(f, gender)}>{f}</Pill>
          ))}
        </div>
        <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.category}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {genders.map((g) => (
            <Pill key={g} active={safeGender === g} onClick={() => applyFormatGender(format, g)}>
              {g === "men" ? t.men : g === "women" ? t.women : t.mixed}
            </Pill>
          ))}
        </div>
      </div>

      {mode === "plan" && (
        <>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: SHADOW }}>
            <label htmlFor="target" style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.targetLabel}</label>
            <input id="target" value={targetStr} onChange={(e) => setTargetStr(e.target.value)} inputMode="numeric"
              style={{ width: "100%", marginTop: 8, background: C.bg, border: `1px solid ${targetSec == null ? C.station : C.line}`,
                color: C.text, fontFamily: MONO, fontSize: 30, padding: "10px 14px", borderRadius: 8, outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 11, marginTop: 14 }}>
              <span style={{ color: C.run }}>{t.runnerStrong}</span>
              <span style={{ color: C.station }}>{t.stationStrong}</span>
            </div>
            <input type="range" className="bias" min={-1} max={1} step={0.05} value={bias} onChange={(e) => setBias(parseFloat(e.target.value))} aria-label="bias" />
            <div style={{ color: C.muted, fontSize: 11, textAlign: "center" }}>{t.biasHint}</div>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, marginBottom: 16, boxShadow: SHADOW }}>
            <button onClick={() => setEstOpen((o) => !o)} aria-expanded={estOpen}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer", color: C.text }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.estTitle} <span style={{ color: C.muted, fontWeight: 400 }}>{t.optional}</span></span>
              <ChevronDown size={18} color={C.muted} style={{ transform: estOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {estOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>{t.estHint}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <Pill active={runDist === 5} onClick={() => setRunDist(5)}>5 km</Pill>
                  <Pill active={runDist === 10} onClick={() => setRunDist(10)}>10 km</Pill>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={runTimeStr} onChange={(e) => setRunTimeStr(e.target.value)} inputMode="numeric"
                    placeholder={runDist === 5 ? t.runPh5 : t.runPh10} aria-label="run time"
                    style={{ flex: 1, minWidth: 0, background: C.bg, color: C.text, fontFamily: MONO, fontSize: 18,
                      border: `1px solid ${runTimeStr && !runEstimate ? C.station : C.line}`, borderRadius: 8, padding: "8px 12px", outline: "none" }} />
                  <button onClick={applyEstimate} disabled={!runEstimate}
                    style={{ background: runEstimate ? C.run : C.line, color: C.ink, border: "none", borderRadius: 8, padding: "0 16px",
                      fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", cursor: runEstimate ? "pointer" : "default" }}>
                    {t.apply}
                  </button>
                </div>
                {runEstimate ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: C.muted }}>
                    <span>{t.freshPace} <b style={{ color: C.text }}>{fmt(runEstimate.pace)}/km</b></span>
                    <span>+{runEstimate.offset}s {t.fatigue}</span>
                    <span>{t.hyroxPaceLabel} <b style={{ color: C.run }}>{fmt(runEstimate.hyroxPace)}/km</b></span>
                    <span>{t.targetArrow} <b style={{ color: C.station }}>{fmt(runEstimate.finish)}</b></span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {plan ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
                {[{ l: t.sumRun, v: plan.runningTotal, c: C.run }, { l: t.sumStations, v: plan.stationsTotal, c: C.station }, { l: t.sumRoxzone, v: plan.rox, c: C.muted }].map((x) => (
                  <div key={x.l} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 8px", textAlign: "center", boxShadow: SHADOW }}>
                    <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{x.l}</div>
                    <div style={{ fontFamily: MONO, fontSize: 18, color: x.c, marginTop: 4 }}>{fmt(x.v)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: SHADOW }}>
                {planRows.map((s, i) => {
                  const isRun = s.type === "run";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", background: isRun ? C.runDim : C.stationDim, borderBottom: `1px solid ${C.bg}`, padding: "10px 12px" }}>
                      <div style={{ width: 26, color: isRun ? C.run : C.station }}>{isRun ? <Activity size={16} /> : <Dumbbell size={16} />}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{segLabel(s)}</div>
                        <div style={{ color: C.muted, fontSize: 11 }}>{isRun ? "1000 m" : s.detail}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: MONO, fontSize: 16, color: isRun ? C.run : C.station }}>{isRun ? `${fmt(s.sec)}/km` : fmt(s.sec)}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>@ {fmt(s.cum)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={copyPlan} style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: C.station, color: C.ink, fontFamily: DISPLAY, letterSpacing: "0.06em", border: "none", borderRadius: 8, padding: "13px", fontSize: 15, cursor: "pointer", textTransform: "uppercase", boxShadow: SHADOW }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? t.copied : t.copyPlan}
              </button>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={shareLink} style={ghost}>{linkCopied ? <Check size={15} /> : <Link2 size={15} />} {t.shareShort}</button>
                <button onClick={() => downloadCard("landscape")} style={ghost}><Download size={15} /> {t.cardShort}</button>
                <button onClick={() => downloadCard("story")} style={ghost}><Download size={15} /> {t.storyShort}</button>
              </div>

              {emailPanel(t.emailTitle, sendPlanEmail)}
            </>
          ) : (
            <div style={{ color: C.station, fontSize: 13, padding: 12 }}>{t.invalidTarget}</div>
          )}
        </>
      )}

      {mode === "analyse" && (
        <>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{t.analyseHint}</div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {ORDER.map((seg, i) => {
                const isRun = seg.type === "run";
                const bad = parseTime(splits[i]) == null;
                return (
                  <div key={i}>
                    <label style={{ color: isRun ? C.run : C.station, fontSize: 11 }}>{segLabel(seg)}</label>
                    <input value={splits[i]} inputMode="numeric" onChange={(e) => { const c = [...splits]; c[i] = e.target.value; setSplits(c); }}
                      style={{ width: "100%", background: C.bg, color: C.text, fontFamily: MONO, fontSize: 15, border: `1px solid ${bad ? C.station : C.line}`, borderRadius: 6, padding: "6px 8px", marginTop: 3 }} />
                  </div>
                );
              })}
              <div>
                <label style={{ color: C.muted, fontSize: 11 }}>{t.roxTotal}</label>
                <input value={roxStr} inputMode="numeric" onChange={(e) => setRoxStr(e.target.value)}
                  style={{ width: "100%", background: C.bg, color: C.text, fontFamily: MONO, fontSize: 15, border: `1px solid ${parseTime(roxStr) == null ? C.station : C.line}`, borderRadius: 6, padding: "6px 8px", marginTop: 3 }} />
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 11 }}>{t.compareTarget}</label>
                <input value={goalStr} inputMode="numeric" onChange={(e) => setGoalStr(e.target.value)}
                  style={{ width: "100%", background: C.bg, color: C.text, fontFamily: MONO, fontSize: 15, border: `1px solid ${parseTime(goalStr) == null ? C.station : C.line}`, borderRadius: 6, padding: "6px 8px", marginTop: 3 }} />
              </div>
            </div>
          </div>

          {analysis ? (
            <>
              <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "center", boxShadow: SHADOW }}>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.predicted}</div>
                <div style={{ fontFamily: MONO, fontSize: 40, marginTop: 4 }}>{fmt(analysis.predicted)}</div>
                {analysis.goalSec != null && (
                  <div style={{ fontSize: 13, marginTop: 6, color: analysis.predicted <= analysis.goalSec ? C.run : C.station }}>
                    {(analysis.predicted <= analysis.goalSec ? t.under : t.over)} {t.targetBy} {fmt(Math.abs(analysis.predicted - analysis.goalSec))}
                  </div>
                )}
              </div>

              {benchmark.n > 0 ? (
                <div style={{ color: C.muted, fontSize: 11, textAlign: "center", marginBottom: 12 }}>
                  {t.basedOnPre}{benchmark.n}{t.basedOnPost}
                  {benchmark.n >= 10 ? (
                    <span style={{ marginLeft: 10 }}>
                      {t.compareSrc}{" "}
                      <button onClick={() => setCompareSrc("model")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0,
                          color: compareSrc === "model" ? C.text : C.muted, textDecoration: compareSrc === "model" ? "underline" : "none" }}>{t.srcModel}</button>
                      {" · "}
                      <button onClick={() => setCompareSrc("community")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0,
                          color: compareSrc === "community" ? C.run : C.muted, textDecoration: compareSrc === "community" ? "underline" : "none" }}>{t.srcCommunity}</button>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {analysis.losses.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, letterSpacing: "0.04em", marginBottom: 8, textTransform: "uppercase" }}>{t.biggestLosses}</div>
                  {analysis.losses.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: r.type === "run" ? C.run : C.station, fontFamily: MONO, fontSize: 12 }}>{i + 1}</span>
                        <span style={{ fontSize: 14 }}>{r.label}</span>
                      </div>
                      <span style={{ fontFamily: MONO, color: C.station }}>+{fmt(r.delta)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontFamily: DISPLAY, fontSize: 14, letterSpacing: "0.04em", marginBottom: 8, textTransform: "uppercase" }}>{t.deviation}</div>
              <div style={{ height: 360, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 6px" }}>
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={analysis.rows} margin={{ left: 8, right: 18, top: 4, bottom: 4 }}>
                      <ReferenceLine x={0} stroke={C.muted} />
                      <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} tickFormatter={(v) => `${v > 0 ? "+" : ""}${Math.round(v)}s`} />
                      <YAxis type="category" dataKey="label" width={108} tick={{ fill: C.text, fontSize: 10 }} />
                      <Bar dataKey="delta" radius={2}>
                        {analysis.rows.map((r, i) => (<Cell key={i} fill={r.delta > 0 ? C.station : C.run} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>{t.chartNote}</div>

              <div style={{ marginTop: 14, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.contribTitle}</div>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>{t.contribHint}</div>
                <button onClick={contributeResult} disabled={contribState === "sending" || contribState === "ok"}
                  style={{ width: "100%", background: contribState === "ok" ? C.line : C.run, color: C.ink, border: "none", borderRadius: 8, padding: "11px",
                    fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", cursor: contribState === "ok" ? "default" : "pointer" }}>
                  {contribState === "sending" ? "…" : t.contribBtn}
                </button>
                {contribMsg ? <div style={{ marginTop: 8, fontSize: 12, color: contribState === "ok" ? C.run : C.station }}>{contribMsg}</div> : null}
              </div>

              <ShareBtn />
              {emailPanel(t.emailTitleAnalysis, sendAnalysisEmail)}
            </>
          ) : (
            <div style={{ color: C.station, fontSize: 13 }}>{t.fillAll}</div>
          )}
        </>
      )}

      <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.line}`, color: C.muted, fontSize: 11, lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, marginBottom: 6 }}>
          <ArrowRight size={14} color={C.station} /><span style={{ fontWeight: 600 }}>{t.nextStep}</span>
        </div>
        {t.membership}
      </div>
    </div>
  );
}
