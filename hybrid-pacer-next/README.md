# Hybrid Pacer

HYROX & Hybrid Rennplan- und Split-Analyse-Tool. Next.js (App Router), ohne Backend –
der geteilte Zustand steckt in der URL (`?p=...`), funktioniert also sofort und kostenlos.

## E-Mail-Versand (Resend) einrichten

Der „Plan per Mail schicken"-Button ruft die Route `app/api/send-plan` auf und verschickt
den Rennplan über [Resend](https://resend.com).

1. Account bei Resend anlegen und unter **API Keys** einen Key erstellen.
2. `.env.example` nach `.env.local` kopieren und ausfüllen:
   - `RESEND_API_KEY` – dein Key.
   - `RESEND_FROM` – Absender. Zum Testen `onboarding@resend.dev`; für echten Versand eine
     in Resend **verifizierte Domain** (z. B. `plan@deine-domain.de`).
   - `RESEND_AUDIENCE_ID` *(optional)* – wenn gesetzt, wird jede E-Mail automatisch in deine
     Resend-Audience aufgenommen → so baust du deine Liste auf.
3. Auf Vercel dieselben Variablen unter **Settings → Environment Variables** eintragen.

Ohne `RESEND_API_KEY` funktioniert das Tool weiter normal; nur der Versand meldet dann, dass
er noch nicht konfiguriert ist. Der Key liegt ausschließlich serverseitig (kein
`NEXT_PUBLIC_`-Präfix) und ist nie im Browser sichtbar.

## Daten-Flywheel (echte Ergebnisse)

Im Analyse-Modus können Nutzer ihr eingetragenes Ergebnis **anonym beitragen** (`POST /api/results`,
gespeichert in Vercel Postgres). `GET /api/benchmarks?fmt=&gender=` liefert daraus Median-Splits je
Division. Sobald genug Daten da sind (ab 10 Ergebnissen je Division), kann der Nutzer seine Splits
gegen den **Community-Median** statt gegen das Modell vergleichen – und es erscheint
„Basierend auf N echten Ergebnissen". So verbessert jeder Beitrag das Tool für alle.

- Auf Vercel unter **Storage → Postgres** eine DB anlegen und mit dem Projekt verbinden
  (Vercel setzt `POSTGRES_URL` automatisch). Die Tabelle wird beim ersten Schreibzugriff angelegt.
- Es werden **keine personenbezogenen Daten** gespeichert – nur Format, Kategorie, Zeiten/Splits.
- Ohne DB läuft alles normal weiter; Beitragen/Community-Vergleich sind dann einfach inaktiv.

## Sprachen (i18n)

- Zweisprachig unter `/de` und `/en` (beide eigenständig indexierbar, mit `hreflang`-Alternates).
- `/` leitet auf `/de` um – Default in `app/i18n.js` (`defaultLocale`) änderbar.
- Umschalter (DE/EN) oben rechts im Tool. Texte liegen zentral in `app/i18n.js`.
- Die Plan-/Bestätigungs-Mails werden anhand der gewählten Sprache versendet.

## DSGVO / Double-Opt-in

- **Rennplan-Mail = transaktional:** geht direkt raus (vom Nutzer angefordert).
- **Newsletter = Double-Opt-in:** Nur wenn die Checkbox angehakt ist, wird eine separate
  Bestätigungsmail mit Link verschickt. Erst nach Klick auf `/confirm` → Bestätigen wird die
  Adresse über `/api/confirm-subscribe` in die Resend-Audience aufgenommen. Es wird **keine**
  Datenbank benötigt – der Bestätigungslink ist ein signierter, nach 7 Tagen ablaufender Token.
- Dafür `OPTIN_SECRET` setzen (lange Zufallskette, z. B. `openssl rand -base64 32`) und
  `NEXT_PUBLIC_SITE_URL` korrekt setzen (für die Links in der Mail).
- **Rechtsseiten:** `/impressum` und `/datenschutz` sind als **Vorlagen** angelegt und im Footer
  verlinkt. Vor dem Livegang ausfüllen und rechtlich prüfen lassen – das ist keine Rechtsberatung.

## Lokal starten

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Produktiv bauen

```bash
npm run build
npm start
```

## Deployen (empfohlen: Vercel)

1. Repo zu GitHub pushen.
2. Auf https://vercel.com das Repo importieren – Framework „Next.js" wird automatisch erkannt.
3. Deploy. Fertig (kostenloses Hobby-Tier reicht für den Start).

Eigene Domain (z. B. ein Subdomain deiner Marke) lässt sich in den Vercel-Projekteinstellungen verbinden.

## Was drin ist

- **Rennplan-Modus:** Zielzeit → Ziel-Splits pro Lauf/Station + kumulative Checkpoints.
- **Analyse-Modus:** eigene Zeiten → Prognose + größte Zeitverluste (Liste + Diagramm).
- **Alle Formate:** Open / Pro / Doubles, Kategorie wählbar.
- **URL-Sharing:** „Teilbaren Link kopieren" kodiert den kompletten Zustand in die URL.
- **SEO-Grundgerüst:** deutsche Metadaten + serverseitig gerenderter, indexierbarer Text
  (Ziel-Keywords: „HYROX Rechner", „HYROX Pace Calculator").

## Nächste sinnvolle Schritte

- E-Mail-Erfassung („Plan per Mail") an einen Anbieter (z. B. Resend/Mailchimp) anbinden.
- Teilbares Ergebnis-Bild (Race-Card) generieren.
- Pace aus 5-/10-km-Zeit ableiten; Altersklassen ergänzen.
- Ergebnisse speichern → eigener Datensatz → präziseres Modell.

## Hinweis

Die Split-Verteilung beruht auf öffentlichen HYROX-Benchmarks (Stand 2026) und ist eine
fundierte Schätzung, kein offizieller Wettkampf-Standard.
