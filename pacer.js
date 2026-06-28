import { Resend } from "resend";
import { makeToken } from "../../lib/optin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TX = {
  de: {
    subject: "Bitte bestätige deine Anmeldung",
    head: "Fast geschafft 👊",
    body: "Du möchtest erfahren, wenn neue Hybridstate-Tools (z. B. Trainingspläne) live gehen. Bestätige einmal kurz – dann bist du dabei. Falls du das nicht warst, ignoriere diese Mail einfach.",
    btn: "Anmeldung bestätigen",
    valid: "Der Link ist 7 Tage gültig.",
  },
  en: {
    subject: "Please confirm your sign-up",
    head: "Almost there 👊",
    body: "You'd like to hear when new Hybridstate tools (e.g. training plans) go live. Confirm once and you're in. If this wasn't you, just ignore this email.",
    btn: "Confirm sign-up",
    valid: "The link is valid for 7 days.",
  },
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = (body?.email || "").trim().toLowerCase();
  const lang = body?.lang === "en" ? "en" : "de";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const token = makeToken(email);

  // Not configured yet (no key / from / opt-in secret) – tell the UI gracefully.
  if (!apiKey || !from || !token) {
    return Response.json({ ok: false, configured: false }, { status: 200 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const confirmUrl = `${base}/confirm?token=${encodeURIComponent(token)}`;
  const tx = TX[lang];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0B0F14;padding:32px 0;">
      <div style="max-width:480px;margin:0 auto;background:#161C26;border:1px solid #2A3543;border-radius:14px;padding:28px;color:#E9EEF3;">
        <div style="font-weight:800;font-size:20px;letter-spacing:0.04em;margin-bottom:16px;">HYBRID<span style="color:#FF5A36;">STATE</span></div>
        <div style="font-size:17px;font-weight:700;margin-bottom:10px;">${tx.head}</div>
        <div style="font-size:14px;line-height:1.65;color:#B7C2CE;margin-bottom:22px;">${tx.body}</div>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF5A36;color:#0F1419;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 22px;font-size:15px;">${tx.btn}</a>
        <div style="font-size:12px;color:#8593A3;margin-top:18px;">${tx.valid}</div>
      </div>
    </div>`;

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({ from, to: email, subject: tx.subject, html });
  } catch {
    return Response.json({ ok: false, configured: true, sent: false }, { status: 200 });
  }

  return Response.json({ ok: true });
}
