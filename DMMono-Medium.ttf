import { Resend } from "resend";
import * as XLSX from "xlsx";
import { buildPlan, parseTime } from "../../planmodel";
import { makeToken } from "../../lib/optin";

export const runtime = "nodejs";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TX = {
  de: {
    subject: "Dein Hybridstate-Trainingsplan",
    head: "Dein Trainingsplan ist da 💪",
    body: "Im Anhang findest du deinen periodisierten HYROX-Trainingsplan als Excel. Viel Erfolg bei der Vorbereitung!",
    cols: ["Woche", "Phase", "Tag", "Session", "Details"],
    title: "Hybridstate – Trainingsplan",
    summary: (w, pace, days) => `${w} Wochen bis Renntag${pace ? ` · Renntempo ≈ ${pace}` : ""}${days ? ` · Empfohlen: ${days} Tage/Woche` : ""}`,
    file: "Hybridstate-Trainingsplan.xlsx",
    consent: "Du möchtest auch Updates? Bestätige kurz:",
    consentBtn: "Updates bestätigen",
    disclaimer: "Strukturiertes Framework nach gängiger Periodisierung – kein individuelles Coaching und kein ärztlicher Rat.",
  },
  en: {
    subject: "Your Hybridstate training plan",
    head: "Your training plan is here 💪",
    body: "Attached is your periodized HYROX training plan as an Excel file. Good luck with your prep!",
    cols: ["Week", "Phase", "Day", "Session", "Details"],
    title: "Hybridstate – Training plan",
    summary: (w, pace, days) => `${w} weeks to race day${pace ? ` · race pace ≈ ${pace}` : ""}${days ? ` · recommended: ${days} days/week` : ""}`,
    file: "Hybridstate-Training-Plan.xlsx",
    consent: "Want updates too? Confirm here:",
    consentBtn: "Confirm updates",
    disclaimer: "A structured framework based on common periodization – not individual coaching or medical advice.",
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
  const targetSec = parseTime(body?.targetStr || "");

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return Response.json({ ok: false, configured: false }, { status: 200 });

  const tx = TX[lang];
  const plan = buildPlan({ weeks, level: body?.level, locale: lang, targetSec, format: body?.format, gender: body?.gender });

  // Build the workbook
  const aoa = [
    [tx.title],
    [tx.summary(weeks, plan.racePace, plan.daysPerWeek)],
    [],
    tx.cols,
  ];
  plan.weeks.forEach((wk) => {
    wk.days.forEach((d, i) => {
      aoa.push([wk.num, wk.phaseLabel + (wk.deload ? " (Deload)" : ""), i + 1, d.title, d.detail]);
    });
  });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 7 }, { wch: 16 }, { wch: 5 }, { wch: 26 }, { wch: 90 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, lang === "en" ? "Training plan" : "Trainingsplan");
  const buf = Buffer.from(XLSX.write(wb, { type: "base64", bookType: "xlsx" }), "base64");

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
        <div style="font-size:11px;color:#6B7785;margin-top:20px;line-height:1.5;">${tx.disclaimer}</div>
      </div>
    </div>`;

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from, to: email, subject: tx.subject, html,
      attachments: [{ filename: tx.file, content: buf }],
    });
    if (error) return Response.json({ ok: false, configured: true, sent: false }, { status: 200 });
  } catch (e) {
    return Response.json({ ok: false, configured: true, sent: false }, { status: 200 });
  }
  return Response.json({ ok: true });
}
