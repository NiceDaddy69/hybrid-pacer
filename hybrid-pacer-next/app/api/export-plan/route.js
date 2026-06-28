import { Resend } from "resend";
import { parseTime } from "../../planmodel";
import { buildPlanWorkbook } from "../../planexport";
import { makeToken } from "../../lib/optin";

export const runtime = "nodejs";
export const maxDuration = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TX = {
  de: {
    subject: "Dein ausführlicher Hybridstate-Trainingsplan",
    head: "Dein kompletter Trainingsplan ist da 💪",
    body: "Im Anhang findest du deinen ausführlichen HYROX-Trainingsplan als Excel – mit Phasenübersicht, Wochenplan, Wochenstruktur, Stationsprogression und einem Race-Day-Plan mit Split-Zeiten. Viel Erfolg!",
    file: "Hybridstate-Trainingsplan.xlsx",
    consent: "Du möchtest auch Updates? Bestätige kurz:",
    consentBtn: "Updates bestätigen",
  },
  en: {
    subject: "Your detailed Hybridstate training plan",
    head: "Your full training plan is here 💪",
    body: "Attached is your detailed HYROX training plan as an Excel file – with a phase overview, week plan, weekly structure, station progression and a race-day split plan. Good luck!",
    file: "Hybridstate-Training-Plan.xlsx",
    consent: "Want updates too? Confirm here:",
    consentBtn: "Confirm updates",
  },
};

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const email = (body?.email || "").trim().toLowerCase();
  const lang = body?.lang === "en" ? "en" : "de";
  const consent = !!body?.consent;
  if (!EMAIL_RE.test(email)) return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });

  const weeks = Math.max(1, Math.min(24, parseInt(body?.weeks, 10) || 0));
  if (!weeks) return Response.json({ ok: false, error: "no_weeks" }, { status: 400 });
  const targetStr = body?.targetStr || "";
  const targetSec = parseTime(targetStr);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return Response.json({ ok: false, configured: false }, { status: 200 });

  const tx = TX[lang];
  let buf;
  try {
    buf = await buildPlanWorkbook({
      weeks, level: body?.level, locale: lang, targetSec, targetStr,
      format: body?.format, gender: body?.gender, raceDateStr: body?.raceDate || "",
    });
  } catch (e) {
    return Response.json({ ok: false, error: "build_failed" }, { status: 500 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  let consentBlock = "";
  if (consent) {
    const confirmUrl = `${base}/confirm?token=${encodeURIComponent(makeToken(email))}`;
    consentBlock = `<div style="margin-top:22px;padding-top:16px;border-top:1px solid #2A3543;font-size:13px;color:#8593A3;">${tx.consent}<br><a href="${confirmUrl}" style="display:inline-block;margin-top:8px;background:#161C26;border:1px solid #2A3543;color:#E9EEF3;text-decoration:none;border-radius:8px;padding:9px 16px;">${tx.consentBtn}</a></div>`;
  }

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0B0F14;padding:32px 0;">
      <div style="max-width:480px;margin:0 auto;background:#161C26;border:1px solid #2A3543;border-radius:14px;padding:28px;color:#E9EEF3;">
        <div style="font-weight:800;font-size:20px;letter-spacing:0.04em;margin-bottom:16px;">HYBRID<span style="color:#FF5A36;">STATE</span></div>
        <div style="font-size:17px;font-weight:700;margin-bottom:10px;">${tx.head}</div>
        <div style="font-size:14px;line-height:1.65;color:#B7C2CE;">${tx.body}</div>
        ${consentBlock}
      </div>
    </div>`;

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({ from, to: email, subject: tx.subject, html, attachments: [{ filename: tx.file, content: buf }] });
  } catch (e) {
    return Response.json({ ok: false, configured: true, sent: false }, { status: 200 });
  }
  return Response.json({ ok: true });
}
