import { Resend } from "resend";
import { makeToken } from "../../lib/optin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { email, subject, planText, shareUrl, newsletter, lang: bodyLang, heading } = body || {};
  const lang = bodyLang === "en" ? "en" : "de";
  const L = lang === "en"
    ? { planHead: "Your HYROX race plan", openBtn: "Open &amp; adjust plan online", disc: "Values are informed estimates based on public HYROX benchmarks - not an official competition standard.", confSubj: "Please confirm your sign-up", confHead: "Please confirm your sign-up", confBody: "You signed up for occasional tips &amp; updates. Please confirm once and you're in. If this wasn't you, just ignore this email.", confBtn: "Confirm sign-up", confValid: "The link is valid for 7 days." }
    : { planHead: "Dein HYROX-Rennplan", openBtn: "Plan online öffnen &amp; anpassen", disc: "Werte sind Richtwerte auf Basis öffentlicher HYROX-Benchmarks - kein offizieller Wettkampf-Standard.", confSubj: "Bitte bestätige deine Anmeldung", confHead: "Bitte bestätige deine Anmeldung", confBody: "Du hast dich für gelegentliche Tipps &amp; Updates angemeldet. Bestätige bitte einmal, dann bist du dabei. Wenn du das nicht warst, ignoriere diese E-Mail einfach.", confBtn: "Anmeldung bestätigen", confValid: "Der Link ist 7 Tage gültig." };

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
  }
  if (!planText || typeof planText !== "string") {
    return Response.json({ error: "Kein Plan zum Senden." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "E-Mail-Versand ist noch nicht konfiguriert (RESEND_API_KEY fehlt)." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || "Hybrid Pacer <onboarding@resend.dev>";

  const safePlan = escapeHtml(planText);
  const safeLink = shareUrl && /^https?:\/\//.test(shareUrl) ? shareUrl : null;

  const html = `
  <div style="background:#0F1419;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#E9EEF3">
    <div style="max-width:560px;margin:0 auto">
      <div style="font-size:24px;font-weight:900;letter-spacing:0.5px">
        HYBRID <span style="color:#FF5A36">PACER</span>
      </div>
      <p style="color:#8593A3;font-size:13px;margin:6px 0 18px">${heading ? String(heading).slice(0, 80) : L.planHead}</p>
      <pre style="background:#161C26;border:1px solid #2A3543;border-radius:8px;padding:16px;
        font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#E9EEF3;
        white-space:pre-wrap;line-height:1.5">${safePlan}</pre>
      ${safeLink ? `<p style="margin:18px 0">
        <a href="${safeLink}" style="background:#FF5A36;color:#0F1419;text-decoration:none;
          font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block">
          ${L.openBtn}</a></p>` : ""}
      <p style="color:#8593A3;font-size:12px;margin-top:24px;line-height:1.6">
        ${L.disc}
      </p>
    </div>
  </div>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: subject || L.planHead,
      html,
    });
    if (error) {
      return Response.json({ error: "Versand fehlgeschlagen." }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Versand fehlgeschlagen." }, { status: 502 });
  }

  // Double opt-in (DSGVO): never add to the marketing list here.
  // If the user ticked the newsletter box, send a separate confirmation email.
  let optin = false;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (newsletter === true && audienceId) {
    const token = makeToken(email);
    if (token) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      const confirmUrl = `${base.replace(/\/$/, "")}/confirm?token=${encodeURIComponent(token)}`;
      const confirmHtml = `
      <div style="background:#0F1419;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#E9EEF3">
        <div style="max-width:520px;margin:0 auto">
          <div style="font-size:22px;font-weight:900">HYBRID <span style="color:#FF5A36">PACER</span></div>
          <h2 style="font-size:18px">${L.confHead}</h2>
          <p style="color:#8593A3;font-size:14px;line-height:1.6">
            ${L.confBody}
          </p>
          <p style="margin:18px 0">
            <a href="${confirmUrl}" style="background:#FF5A36;color:#0F1419;text-decoration:none;
              font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block">${L.confBtn}</a>
          </p>
          <p style="color:#8593A3;font-size:12px">${L.confValid}</p>
        </div>
      </div>`;
      try {
        await resend.emails.send({
          from,
          to: [email],
          subject: L.confSubj,
          html: confirmHtml,
        });
        optin = true;
      } catch {
        /* confirmation mail failed – plan already sent */
      }
    }
  }

  return Response.json({ ok: true, optin });
}
