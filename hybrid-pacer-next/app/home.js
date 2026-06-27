"use client";

import { useState } from "react";
import { dict } from "./i18n";

const C = {
  bg: "#0B0F14", panel: "#161C26", panel2: "#1D2531", line: "#2A3543",
  text: "#E9EEF3", muted: "#8593A3", run: "#4EA8DE", station: "#FF5A36", ink: "#0F1419",
};
const DISPLAY = "var(--font-display)";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Home({ locale = "de" }) {
  const t = dict[locale] || dict.de;
  const other = locale === "de" ? "en" : "de";
  const pacerHref = `/${locale}/pacer`;

  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | ok | error
  const [msg, setMsg] = useState("");

  async function subscribe() {
    if (!EMAIL_RE.test(email)) { setState("error"); setMsg(t.notifyErr); return; }
    setState("sending"); setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang: locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setState("ok"); setMsg(t.notifyOk); setEmail(""); }
      else if (data && data.configured === false) { setState("error"); setMsg(t.notifyUnconfigured); }
      else { setState("error"); setMsg(t.notifyErr); }
    } catch (e) {
      setState("error"); setMsg(t.notifyErr);
    }
  }

  const ComingCard = ({ name, desc }) => (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, opacity: 0.92 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: "0.02em" }}>{name}</span>
        <span style={{ fontSize: 10, color: C.run, border: `1px solid ${C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.homeComing}</span>
      </div>
      <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", color: C.text }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: "0.04em" }}>
            HYBRID<span style={{ color: C.station }}>STATE</span>
          </span>
          <div style={{ display: "flex", gap: 6, fontSize: 12, fontFamily: DISPLAY }}>
            <a href="/de" style={{ color: locale === "de" ? C.text : C.muted, textDecoration: "none" }}>DE</a>
            <span style={{ color: C.line }}>|</span>
            <a href="/en" style={{ color: locale === "en" ? C.text : C.muted, textDecoration: "none" }}>EN</a>
          </div>
        </div>

        {/* Hero */}
        <section style={{ marginBottom: 34 }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 40, lineHeight: 1.05, letterSpacing: "0.01em", margin: "0 0 14px" }}>
            {t.homeTagline}
          </h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: "0 0 20px" }}>{t.homeIntro}</p>
          <a href={pacerHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.station, color: C.ink, fontFamily: DISPLAY, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", borderRadius: 8, padding: "13px 22px", fontSize: 15, boxShadow: "0 12px 30px rgba(255,90,54,0.25)" }}>
            {t.heroCta} →
          </a>
        </section>

        {/* Available now */}
        <section style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{t.homeAvailable}</div>
          <div style={{ display: "grid", gap: 10 }}>
            <a href={pacerHref} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 100% 0%, rgba(78,168,222,0.10), transparent 60%)" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 20, marginBottom: 6 }}>{t.pacerName}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 14 }}>{t.pacerDesc}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.station, fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {t.openPacer} →
                  </span>
                </div>
              </div>
            </a>

            <a href={`/${locale}/trainingsplan`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 100% 0%, rgba(255,90,54,0.10), transparent 60%)" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 20 }}>{t.planName}</span>
                    <span style={{ fontSize: 10, color: C.run, border: `1px solid ${C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Beta</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 14 }}>{t.planDesc}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.station, fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {t.planName} →
                  </span>
                </div>
              </div>
            </a>

            <a href={`/${locale}/fueling`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 100% 0%, rgba(78,168,222,0.10), transparent 60%)" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 20 }}>{t.fuelName}</span>
                    <span style={{ fontSize: 10, color: C.run, border: `1px solid ${C.run}`, borderRadius: 999, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Beta</span>
                  </div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 14 }}>{t.fuelDesc}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.station, fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {t.fuelName} →
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* Roadmap */}
        <section style={{ marginBottom: 34 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{t.homeComing}</div>
          <div style={{ display: "grid", gap: 10 }}>
            <ComingCard name={t.appName} desc={t.appDesc} />
          </div>
        </section>

        {/* Notify signup */}
        <section style={{ marginBottom: 30 }}>
          <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, lineHeight: 1.25, marginBottom: 8 }}>{t.notifyTitle}</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{t.notifyDesc}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") subscribe(); }}
                placeholder={t.notifyPlaceholder}
                style={{ flex: "1 1 220px", minWidth: 0, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 15, outline: "none" }}
              />
              <button
                onClick={subscribe}
                disabled={state === "sending"}
                style={{ background: C.station, color: C.ink, fontFamily: DISPLAY, letterSpacing: "0.05em", textTransform: "uppercase", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, cursor: state === "sending" ? "default" : "pointer", opacity: state === "sending" ? 0.7 : 1 }}
              >
                {state === "sending" ? t.notifySending : t.notifyBtn}
              </button>
            </div>
            {msg ? (
              <div style={{ marginTop: 12, fontSize: 13.5, color: state === "ok" ? C.run : C.station }}>{msg}</div>
            ) : null}
            <div style={{ marginTop: 12, fontSize: 11.5, color: "#6B7785", lineHeight: 1.6 }}>
              {t.notifyConsentPre}
              <a href="/datenschutz" style={{ color: C.muted }}>{t.notifyConsentLink}</a>.
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div style={{ paddingTop: 16, borderTop: `1px solid ${C.line}`, fontSize: 13 }}>
            <a href="/impressum" style={{ color: C.muted, marginRight: 18, textDecoration: "none" }}>Impressum</a>
            <a href="/datenschutz" style={{ color: C.muted, textDecoration: "none" }}>{locale === "en" ? "Privacy" : "Datenschutz"}</a>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: "#6B7785", lineHeight: 1.6 }}>{t.notAffiliated}</div>
        </footer>

      </div>
    </main>
  );
}
