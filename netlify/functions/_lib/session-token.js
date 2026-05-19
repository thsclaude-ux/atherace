const crypto = require("crypto");

const TTL_SEC = 15 * 60;

function getSigningSecret() {
  return (
    process.env.SESSION_SIGNING_SECRET?.trim() ||
    process.env.CREATE_ADMIN_SECRET?.trim() ||
    null
  );
}

function b64urlEncode(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(
    (str + pad).replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
}

function signSegment(obj) {
  return b64urlEncode(JSON.stringify(obj));
}

function createSessionToken({ userId, code }) {
  const secret = getSigningSecret();
  if (!secret) return null;

  const header = signSegment({ alg: "HS256", typ: "JWT" });
  const payload = signSegment({
    sub: userId,
    code,
    exp: Math.floor(Date.now() / 1000) + TTL_SEC,
  });
  const data = `${header}.${payload}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${data}.${sig}`;
}

function verifySessionToken(token) {
  const secret = getSigningSecret();
  if (!secret || !token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const data = `${header}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest();
  let actual;
  try {
    actual = b64urlDecode(sig);
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  let body;
  try {
    body = JSON.parse(b64urlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }

  if (!body.sub || !body.code || !body.exp) return null;
  if (body.exp < Math.floor(Date.now() / 1000)) return null;

  return { userId: body.sub, code: body.code };
}

function extractSessionToken(event, body) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1];
  if (body && typeof body.sessionToken === "string") return body.sessionToken;
  return null;
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  extractSessionToken,
  TTL_SEC,
};
