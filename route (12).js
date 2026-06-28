const C = { bg: "#0F1419", panel: "#161C26", line: "#2A3543", text: "#E9EEF3", muted: "#8593A3", station: "#FF5A36" };

export const metadata = { title: "Impressum | Hybrid Pacer", robots: { index: false } };

export default function Impressum() {
  return (
    <main style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 64px", lineHeight: 1.7 }}>
        <a href="/" style={{ color: C.muted, fontSize: 13 }}>← zurück</a>
        <h1 style={{ fontSize: 24, marginTop: 16 }}>Impressum</h1>

        <div style={{ background: C.panel, border: `1px solid ${C.station}`, borderRadius: 8, padding: "10px 14px", color: C.muted, fontSize: 13, margin: "14px 0 22px" }}>
          Vorlage – bitte vollständig ausfüllen und vor Veröffentlichung rechtlich prüfen. Dies ist keine Rechtsberatung.
        </div>

        <h2 style={{ fontSize: 16 }}>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz, vormals § 5 TMG)</h2>
        <p style={{ color: C.muted }}>
          [Vorname Nachname / Firmenname]<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]<br />
          [Land]
        </p>

        <h2 style={{ fontSize: 16 }}>Kontakt</h2>
        <p style={{ color: C.muted }}>
          Telefon: [Telefonnummer]<br />
          E-Mail: [E-Mail-Adresse]
        </p>

        <h2 style={{ fontSize: 16 }}>Vertreten durch / Rechtsform</h2>
        <p style={{ color: C.muted }}>[z. B. Einzelunternehmer / GmbH, Geschäftsführer, Handelsregister &amp; -nummer, USt-IdNr. falls vorhanden]</p>

        <h2 style={{ fontSize: 16 }}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p style={{ color: C.muted }}>[Vorname Nachname, Anschrift wie oben]</p>

        <p style={{ color: C.muted, fontSize: 12, marginTop: 24 }}>
          Hinweis: Bei rein privaten/nichtkommerziellen Angeboten kann die Impressumspflicht abweichen. Sobald du
          Newsletter und/oder ein Bezahlprodukt anbietest, gilt das Angebot als geschäftsmäßig und ein vollständiges
          Impressum ist erforderlich.
        </p>
      </div>
    </main>
  );
}
