import { Resend } from "resend";
import { verifyToken } from "../../lib/optin";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const result = verifyToken(body?.token);
  if (!result) {
    return Response.json({ error: "Bestätigungslink ungültig oder abgelaufen." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return Response.json({ error: "Newsletter ist nicht konfiguriert." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.contacts.create({ email: result.email, audienceId, unsubscribed: false });
  } catch {
    // Likely already a contact – treat as success (idempotent confirm).
  }

  return Response.json({ ok: true });
}
