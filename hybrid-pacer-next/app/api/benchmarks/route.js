import { getBenchmarks, dbConfigured, FORMATS, GENDERS } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!dbConfigured()) return Response.json({ n: 0 });
  const { searchParams } = new URL(request.url);
  const fmt = searchParams.get("fmt");
  const gender = searchParams.get("gender");
  if (!FORMATS.includes(fmt) || !GENDERS.includes(gender)) {
    return Response.json({ n: 0 });
  }
  try {
    const data = await getBenchmarks(fmt, gender);
    return Response.json(data);
  } catch (e) {
    return Response.json({ n: 0 });
  }
}
