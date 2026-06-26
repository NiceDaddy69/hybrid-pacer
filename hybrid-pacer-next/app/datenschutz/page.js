const C = { bg: "#0F1419", panel: "#161C26", line: "#2A3543", text: "#E9EEF3", muted: "#8593A3", station: "#FF5A36" };

export const metadata = { title: "Datenschutzerklärung | Hybrid Pacer", robots: { index: false } };

function H2({ children }) { return <h2 style={{ fontSize: 16, marginTop: 22 }}>{children}</h2>; }
function P({ children }) { return <p style={{ color: C.muted }}>{children}</p>; }

export default function Datenschutz() {
  return (
    <main style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 64px", lineHeight: 1.7 }}>
        <a href="/" style={{ color: C.muted, fontSize: 13 }}>← zurück</a>
        <h1 style={{ fontSize: 24, marginTop: 16 }}>Datenschutzerklärung</h1>

        <div style={{ background: C.panel, border: `1px solid ${C.station}`, borderRadius: 8, padding: "10px 14px", color: C.muted, fontSize: 13, margin: "14px 0 8px" }}>
          Vorlage – bitte an deine tatsächlichen Verhältnisse anpassen und rechtlich prüfen. Dies ist keine Rechtsberatung.
        </div>

        <H2>1. Verantwortlicher</H2>
        <P>[Vorname Nachname / Firma], [Anschrift], E-Mail: [E-Mail-Adresse]. Verantwortlich i. S. d. Art. 4 Nr. 7 DSGVO.</P>

        <H2>2. Hosting</H2>
        <P>
          Diese Website wird bei der Vercel Inc. (USA) gehostet. Beim Aufruf werden technisch notwendige Daten
          (u. a. IP-Adresse, Zeitpunkt, abgerufene Ressource, User-Agent) verarbeitet, um die Auslieferung und
          Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
          einem sicheren Betrieb). Die Übermittlung in die USA erfolgt auf Grundlage geeigneter Garantien
          (Standardvertragsklauseln). [Ggf. Auftragsverarbeitungsvertrag mit Vercel ergänzen.]
        </P>

        <H2>3. Server-Logfiles</H2>
        <P>Der Hosting-Anbieter erhebt automatisch Server-Logfiles. Diese werden ausschließlich zur Sicherstellung des Betriebs ausgewertet und nach [Zeitraum] gelöscht.</P>

        <H2>4. Rechner-Funktion (lokal)</H2>
        <P>Die Eingaben im Pace-Rechner werden im Browser verarbeitet. Ein geteilter Link enthält deine Eingaben kodiert in der Adresse (URL); es werden dafür keine Daten auf einem Server gespeichert.</P>

        <H2>5. Versand des Rennplans per E-Mail</H2>
        <P>
          Wenn du dir deinen Rennplan per E-Mail schicken lässt, verarbeiten wir deine E-Mail-Adresse, um dir diese
          eine angeforderte E-Mail zuzusenden (Art. 6 Abs. 1 lit. b DSGVO). Für den Versand nutzen wir Resend, Inc.
          (USA) als Auftragsverarbeiter; die Übermittlung in die USA erfolgt auf Grundlage geeigneter Garantien.
        </P>

        <H2>6. Newsletter (Double-Opt-in)</H2>
        <P>
          Für den Newsletter setzen wir das Double-Opt-in-Verfahren ein: Nach deiner Anmeldung erhältst du eine
          E-Mail mit einem Bestätigungslink. Erst nach Klick wird deine Adresse in den Verteiler aufgenommen.
          Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Versand und Verwaltung erfolgen über
          Resend, Inc. (USA). Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, z. B.
          über den Abmeldelink in jeder E-Mail oder per Nachricht an [E-Mail-Adresse].
        </P>

        <H2>7. Deine Rechte</H2>
        <P>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          sowie Widerspruch (Art. 15–21 DSGVO) und das Recht, eine erteilte Einwilligung zu widerrufen. Außerdem steht
          dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.
        </P>

        <H2>8. Kontakt</H2>
        <P>Für Anfragen zum Datenschutz: [E-Mail-Adresse].</P>

        <p style={{ color: C.muted, fontSize: 12, marginTop: 22 }}>Stand: [Datum]. Diese Erklärung wird bei Änderungen aktualisiert.</p>
      </div>
    </main>
  );
}
