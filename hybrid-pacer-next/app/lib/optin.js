import crypto from "node:crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Creates a signed, expiring token that proves intent to subscribe.
// Returns null if no secret is configured.
export function makeToken(email) {
  const secret = process.env.OPTIN_SECRET;
  if (!secret) return null;
  const exp = Date.now() + TTL_MS;
  const payload = `${email.toLowerCase()}|${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

// Verifies a token and returns { email } if valid, otherwise null.
export function verifyToken(token) {
  const secret = process.env.OPTIN_SECRET;
  if (!secret || !token) return null;
  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const parts = decoded.split("|");
  if (parts.length !== 3) return null;
  const [email, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!email || !exp || Date.now() > exp) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${email}|${exp}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { email };
}
