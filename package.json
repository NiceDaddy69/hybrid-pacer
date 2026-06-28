import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { buildFueling } from "../../fuelingmodel";
import { makeToken } from "../../lib/optin";

export const runtime = "nodejs";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TX = {
  de: {
    subject: "Dein Hybridstate Race-Week-Fueling-Plan",
    head: "Dein Fueling-Plan ist da 🥤",
    body: "Im Anhang findest du deinen Race-Week-Fueling-Plan als PDF – mit Zeiten und Mengen für deine Rennwoche.",
    file: "Hybridstate-Race-Week-Fueling.pdf",
    title: "Race-Week Fueling",
    consent: "Du möchtest auch Updates? Bestätige kurz:",
    consentBtn: "Updates bestätigen",
  },
  en: {
    subject: "Your Hybridstate race-week fueling plan",
    head: "Your fueling plan is here 🥤",
    body: "Attached is your race-week fueling plan as a PDF – with times and amounts for your race week.",
    file: "Hybridstate-Race-Week-Fueling.pdf",
    title: "Race-Week Fueling",
    consent: "Want updates too? Confirm here:",
    consentBtn: "Confirm updates",
  },
};

function san(s) {
  return String(s)
    .replace(/≈/g, "~").replace(/[–—]/g, "-").replace(/·/g, "-").replace(/→/g, "->")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...")
    .replace(/[^\u0000-\u00FF]/g, "");
}

async function buildPdf(plan, tx, locale) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, margin = 50, maxW = W - margin * 2;
  const coral = rgb(1, 0.353, 0.212), ink = rgb(0.1, 0.12, 0.15), gray = rgb(0.45, 0.48, 0.52);

  let page = pdf.addPage([W, H]);
  let y = H - margin;
  const ensure = (sp) => { if (y - sp < margin) { page = pdf.addPage([W, H]); y = H - margin; } };
  const wrap = (text, f, size) => {
    const words = san(text).split(/\s+/); const lines = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const para = (text, f, size, color, indent = 0, gap = 4) => {
    for (const ln of wrap(text, f, size)) {
      ensure(size + gap);
      page.drawText(ln, { x: margin + indent, y: y - size, size, font: f, color });
      y -= size + gap;
    }
  };

  page.drawText(san("HYBRIDSTATE"), { x: margin, y: y - 18, size: 18, font: bold, color: ink }); y -= 24;
  para(tx.title, bold, 14, coral); y -= 4;
  para(`${plan.weightKg} kg${plan.startTime ? ` - Start ${plan.startTime}` : ""}`, font, 11, gray); y -= 10;

  plan.items.forEach((it) => {
    ensure(40);
    y -= 6;
    para(it.when, bold, 9, coral);
    para(it.title, bold, 12, ink);
    it.lines.forEach((l) => para("- " + l, font, 10.5, ink, 6, 3));
  });

  y -= 10;
  para(plan.disclaimer, font, 8.5, gray);

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const email = (body?.email || "").trim().toLowerCase();
  const lang = body?.lang === "en" ? "en" : "de";
  const consent = !!body?.consent;
  if (!EMAIL_RE.test(email)) return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return Response.json({ ok: false, configured: false }, { status: 200 });

  const tx = TX[lang];
  const plan = buildFueling({ weightKg: body?.weight, startTime: body?.startTime || "", caffeine: !!body?.caffeine, locale: lang });
  const buf = await buildPdf(plan, tx, lang);

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
