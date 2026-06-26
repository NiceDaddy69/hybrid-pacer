import { insertResult, countResults, dbConfigured, FORMATS, GENDERS, SEG_COUNT } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 36000; // 10h sanity bound (seconds)

function intOk(x) { return Number.isFinite(x) && x > 0 && x < MAX; }

export async function POST(request) {
  if (!dbConfigured()) {
    return Response.json({ error: "Datenbank ist nicht konfiguriert." }, { status: 503 });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Ungültige Anfrage." }, { status: 400 }); }

  const fmt = FORMATS.includes(body?.fmt) ? body.fmt : null;
  const gender = GENDERS.includes(body?.gender) ? body.gender : null;
  const finish = Math.round(Number(body?.finish));
  const rox = Math.round(Number(body?.rox));
  const segs = Array.isArray(body?.segs) ? body.segs.map((x) => Math.round(Number(x))) : null;

  if (!fmt || !gender) return Response.json({ error: "Format/Kategorie ungültig." }, { status: 400 });
  if (!intOk(finish) || !intOk(rox)) return Response.json({ error: "Zeiten ungültig." }, { status: 400 });
  if (!segs || segs.length !== SEG_COUNT || !segs.every(intOk)) {
    return Response.json({ error: "Splits ungültig." }, { status: 400 });
  }

  try {
    await insertResult({ fmt, gender, finish, rox, segs });
    const n = await countResults(fmt, gender);
    return Response.json({ ok: true, n });
  } catch (e) {
    return Response.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }
}
