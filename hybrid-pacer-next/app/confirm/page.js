"use client";

import { useEffect, useState } from "react";

const C = { bg: "#0F1419", panel: "#161C26", line: "#2A3543", text: "#E9EEF3", muted: "#8593A3", run: "#4EA8DE", station: "#FF5A36", ink: "#0F1419" };
const DISPLAY = "'Arial Black','Helvetica Neue',Helvetica,sans-serif";

export default function ConfirmPage() {
  const [token, setToken] = useState(null);
  const [state, setState] = useState("idle"); // idle | sending | ok | error
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("token");
      setToken(t);
    } catch {
      setToken(null);
    }
  }, []);

  async function confirm() {
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/confirm-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState("ok");
        setMsg("Danke! Deine Anmeldung ist bestätigt.");
      } else {
        setState("error");
        setMsg(data.error || "Bestätigung fehlgeschlagen.");
      }
    } catch {
      setState("error");
      setMsg("Netzwerkfehler.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 440, width: "100%", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 28, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26 }}>HYBRID <span style={{ color: C.station }}>PACER</span></div>

        {state === "ok" ? (
          <p style={{ color: C.run, fontSize: 16, marginTop: 18 }}>{msg}</p>
        ) : (
          <>
            <h1 style={{ fontSize: 18, marginTop: 16 }}>Anmeldung bestätigen</h1>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
              Klicke einmal, um deine Newsletter-Anmeldung abzuschließen.
            </p>
            <button onClick={confirm} disabled={!token || state === "sending"}
              style={{ marginTop: 16, width: "100%", background: token ? C.station : C.line, color: C.ink, border: "none", borderRadius: 8,
                padding: "12px", fontFamily: DISPLAY, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", cursor: token ? "pointer" : "default" }}>
              {state === "sending" ? "…" : "Jetzt bestätigen"}
            </button>
            {!token ? <p style={{ color: C.station, fontSize: 12, marginTop: 10 }}>Kein gültiger Bestätigungslink.</p> : null}
            {state === "error" ? <p style={{ color: C.station, fontSize: 13, marginTop: 10 }}>{msg}</p> : null}
          </>
        )}

        <p style={{ marginTop: 20 }}>
          <a href="/" style={{ color: C.muted, fontSize: 13 }}>← zurück zum Rechner</a>
        </p>
      </div>
    </main>
  );
}
