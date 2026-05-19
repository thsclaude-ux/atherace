const { rtdb } = require("./firebase-admin");
const { getClientIp } = require("./client-ip");
const { json } = require("./http");

const LIMITS = {
  validateCode: { max: 30, windowMs: 15 * 60 * 1000 },
  submitBets: { max: 10, windowMs: 60 * 60 * 1000 },
  checkSubmission: { max: 60, windowMs: 15 * 60 * 1000 },
  getParticipants: { max: 120, windowMs: 15 * 60 * 1000 },
};

function sanitizeKey(raw) {
  return String(raw ?? "unknown")
    .replace(/[.#$/\[\]]/g, "_")
    .slice(0, 120);
}

/**
 * حد معدل الطلبات عبر RTDB (يعمل مع Firebase الحالي دون خدمات إضافية).
 */
async function enforceRateLimit(scope, identifier) {
  const config = LIMITS[scope];
  if (!config) return { allowed: true };

  const key = sanitizeKey(identifier);
  const ref = rtdb().ref("_rate_limits").child(scope).child(key);
  const now = Date.now();

  let allowed = true;
  let retryAfterSec = 60;

  await ref.transaction((current) => {
    if (!current || now - current.windowStart >= config.windowMs) {
      return { count: 1, windowStart: now };
    }
    if (current.count >= config.max) {
      allowed = false;
      retryAfterSec = Math.max(
        1,
        Math.ceil((current.windowStart + config.windowMs - now) / 1000)
      );
      return;
    }
    return { count: current.count + 1, windowStart: current.windowStart };
  });

  return { allowed, retryAfterSec };
}

async function rateLimitByIp(event, scope, extra = "") {
  const ip = getClientIp(event) || "unknown";
  const id = extra ? `${ip}:${extra}` : ip;
  return enforceRateLimit(scope, id);
}

/**
 * @returns {null | object} استجابة 429 جاهزة أو null
 */
async function rateLimitResponse(event, scope, extra = "") {
  const result = await rateLimitByIp(event, scope, extra);
  if (result.allowed) return null;
  return json(
    429,
    { error: "تم تجاوز حد الطلبات، حاول لاحقاً" },
    event,
    { "Retry-After": String(result.retryAfterSec) }
  );
}

module.exports = { enforceRateLimit, rateLimitByIp, rateLimitResponse, LIMITS };
