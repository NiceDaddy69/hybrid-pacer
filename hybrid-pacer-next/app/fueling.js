"use client";

import { useEffect, useState } from "react";
import { buildFueling } from "./fuelingmodel";

const C = {
  bg: "#0B0F14", panel: "#161C26", panel2: "#1D2531", line: "#2A3543",
  text: "#E9EEF3", muted: "#8593A3", run: "#4EA8DE", station: "#FF5A36", ink: "#0F1419",
};
const DISPLAY = "var(--font-display)";
const MONO = "var(--font-mono)";
const STORE = "hybridpacer:fuel:v1";

const T = {
  de: {
    title: "RACE-WEEK FUELING", beta: "Beta",
    weight: "Körpergewicht (kg)", startTime: "Startzeit", caffeine: "Koffein einplanen",
    on: "An", off: "Aus",
    hint: "Gib dein Gewicht und die Startzeit ein – dein Verpflegungsplan erscheint dann automatisch.",
    setup: (w, s) => `${w} kg${s ? ` · Start ${s}` : ""}`,
    copy: "Plan kopieren", copied: "Kopiert", link: "Link", linkCopied: "Link kopiert",
    emailPh: "Deine E-Mail-Adresse", sendBtn: "Als PDF schicken", sending: "Senden…",
    sentOk: "Ist unterwegs – schau in dein Postfach.", sentErr: "Hat nicht geklappt – bitte E-Mail prüfen.",
    unconfigured: "E-Mail-Versand ist noch nicht aktiv.", consentLabel: "Schick mir auch Updates (optional)",
    pacerLink: "Rennplan im Hybrid Pacer erstellen →", heading: "Race-Week Fueling",
  },
  en: {
    title: "RACE-WEEK FUELING", beta: "Beta",
    weight: "Body weight (kg)", startTime: "Start time", caffeine: "Plan caffeine",
    on: "On", off: "Off",
    hint: "Enter your weight and start time – your fueling plan appears automatically.",
    setup: (w, s) => `${w} kg${s ? ` · start ${s}` : ""}`,
    copy: "Copy plan", copied: "Copied", link: "Link", linkCopied: "Link copied",
    pacerLink: "Build your race plan in the Hybrid Pacer →", heading: "Race-week fueling",
  },
};

function enc(obj) { try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch (e) { return ""; } }
function dec(s) { try { return JSON.parse(decodeURIComponent(atob(s))); } catch (e) { return null; } }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);

export default function Fueling({ locale = "de" }) {
  const t = T[locale] || T.de;

  const [weight, setWeight] = useState("75");
  const [startTime, setStartTime] = useState("");
  const [caffeine, setCaffeine] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sendState, setSendState] = useState("idle");
  const [sendMsg, setSendMsg] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let init = null;
    try { const p = new URLSearchParams(window.location.search).get("p"); if (p) init = dec(p); } catch (e) {}
    if (!init) { try { const s = localStorage.getItem(STORE); if (s) init = JSON.parse(s); } catch (e) {} }
    if (init) {
      if (init.w) setWeight(String(init.w));
      if (init.s) setStartTime(init.s);
      if (typeof init.c === "boolean") setCaffeine(init.c);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE, JSON.stringify({ w: weight, s: startTime, c: caffeine })); } catch (e) {}
  }, [hydrated, weight, startTime, caffeine]);

  const wNum = Number(weight);
  const valid = wNum >= 35 && wNum <= 160;
  const plan = valid ? buildFueling({ weightKg: wNum, startTime, caffeine, locale }) : null;

  function shareLink() {
    const e = enc({ w: weight, s: startTime, c: caffeine });
    try { window.history.replaceState(null, "", `?p=${e}`); } catch (err) {}
    navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?p=${e}`);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800);
  }

  async function sendExport() {
    if (!EMAIL_RE.test(email)) { setSendState("error"); setSendMsg(t.sentErr); return; }
    if (!plan) return;
    setSendState("sending"); setSendMsg("");
    try {
      const res = await fetch("/api/export-fueling", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, lang: locale, weight: wNum, startTime, caffeine }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setSendState("ok"); setSendMsg(t.sentOk); }
      else if (data && data.configured === false) { setSendState("error"); setSendMsg(t.unconfigured); }
      else { setSendState("error"); setSendMsg(t.sentErr); }
    } catch (e) { setSendState("error"); setSendMsg(t.sentErr); }
  }

  const inputStyle = { width: "100%", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 12px", color: C.text, fontSize: 15, fontFamily: MONO, outline: "none", colorScheme: "dark" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "10px 16px 40px", color: C.text }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `2px solid ${C.line}`, paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: "0.02em", lineHeight: 1, margin: 0 }}>{t.title}</h1>
          <span style={{ fontSize: 10, color: C.run, border: `1px solid ${C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.beta}</span>
        </div>
        <div style={{ display: "flex", gap: 6, fontSize: 12, fontFamily: DISPLAY }}>
          <a href="/de/fueling" style={{ color: locale === "de" ? C.text : C.muted, textDecoration: "none" }}>DE</a>
          <span style={{ color: C.line }}>|</span>
          <a href="/en/fueling" style={{ color: locale === "en" ? C.text : C.muted, textDecoration: "none" }}>EN</a>
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}>
            <Field label={t.weight}>
              <input type="number" inputMode="numeric" min={35} max={160} value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <Field label={t.startTime}>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 13, color: C.text }}>{t.caffeine}</span>
          <button onClick={() => setCaffeine((v) => !v)} style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: caffeine ? C.station : "transparent",
            color: caffeine ? C.ink : C.muted, border: `1px solid ${caffeine ? C.station : C.line}`, borderRadius: 999,
            padding: "6px 14px", fontSize: 12, fontFamily: DISPLAY, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
          }}>{caffeine ? t.on : t.off}</button>
        </div>
      </div>

      {!plan ? (
        <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "8px 0" }}>{t.hint}</div>
      ) : (
        <>
          <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18 }}>{t.setup(plan.weightKg, plan.startTime || "")}</div>
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh}
                  style={{ flex: "1 1 200px", minWidth: 0, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 12px", color: C.text, fontSize: 15, outline: "none" }} />
                <button onClick={sendExport} disabled={sendState === "sending"}
                  style={{ background: C.station, color: C.ink, fontFamily: DISPLAY, letterSpacing: "0.05em", textTransform: "uppercase", border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 13, cursor: sendState === "sending" ? "default" : "pointer", opacity: sendState === "sending" ? 0.7 : 1 }}>
                  {sendState === "sending" ? t.sending : t.sendBtn}
                </button>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.muted, cursor: "pointer" }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                {t.consentLabel}
              </label>
              {sendMsg ? <div style={{ fontSize: 13, color: sendState === "ok" ? C.run : C.station }}>{sendMsg}</div> : null}
              <button onClick={shareLink} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: C.text, fontFamily: DISPLAY, letterSpacing: "0.05em", textTransform: "uppercase", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 13, cursor: "pointer" }}>{linkCopied ? t.linkCopied : t.link}</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {plan.items.map((it) => (
              <div key={it.key} style={{ background: C.panel, border: `1px solid ${it.key === "during" ? C.station : C.line}`, borderRadius: 10, padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 7 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.run }}>{it.when}</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 15 }}>{it.title}</span>
                </div>
                {it.lines.map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, color: C.muted, lineHeight: 1.55, padding: "2px 0" }}>
                    <span style={{ color: C.station }}>·</span><span>{l}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <a href={`/${locale}/pacer`} style={{ display: "inline-block", marginTop: 16, color: C.run, fontSize: 13.5, textDecoration: "none", fontFamily: DISPLAY, letterSpacing: "0.04em" }}>{t.pacerLink}</a>
        </>
      )}

      <div style={{ marginTop: 20, fontSize: 11.5, color: "#6B7785", lineHeight: 1.6 }}>{plan ? plan.disclaimer : buildFueling({ weightKg: 75, startTime: "", caffeine: true, locale }).disclaimer}</div>
    </div>
  );
}
