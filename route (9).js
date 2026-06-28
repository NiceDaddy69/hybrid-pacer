"use client";

import { useEffect, useState } from "react";
import { dict } from "./i18n";

const DISMISS_KEY = "hybridpacer:install-dismissed";

export default function InstallPrompt({ locale = "de" }) {
  const t = dict[locale] || dict.de;
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch (e) {}

    // Already installed / running as an app?
    const standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
    if (standalone) return;

    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari has no beforeinstallprompt – show a manual hint instead.
    const ua = window.navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    const isWebkit = /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua);
    if (isIOS && isWebkit) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) {}
    setDeferred(null);
    setShow(false);
  }

  function dismiss() {
    setShow(false);
    setIosHint(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
  }

  if (!show && !iosHint) return null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "14px 16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#161C26", border: "1px solid #2A3543", borderRadius: 10, padding: "10px 12px", boxShadow: "0 10px 28px rgba(0,0,0,0.45)" }}>
        <img src="/icons/icon-192.png" width="34" height="34" alt="" style={{ borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 13, color: "#E9EEF3", lineHeight: 1.45 }}>
          {show ? t.installApp : t.iosInstall}
        </div>
        {show ? (
          <button onClick={install} style={{ background: "#FF5A36", color: "#0F1419", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {t.install}
          </button>
        ) : null}
        <button onClick={dismiss} aria-label="Close" style={{ background: "none", border: "none", color: "#8593A3", fontSize: 18, lineHeight: 1, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>
          ✕
        </button>
      </div>
    </div>
  );
}
