const BASE_CORS = {
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Create-Admin-Secret, X-Bootstrap-Secret",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

function parseAllowedOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS?.trim() ||
    process.env.ALLOWED_ORIGIN?.trim() ||
    "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRequestOrigin(event) {
  return event?.headers?.origin || event?.headers?.Origin || "";
}

function resolveCorsOrigin(event) {
  const allowed = parseAllowedOrigins();
  const origin = getRequestOrigin(event);

  if (allowed.length === 0) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return origin;
    }
    return null;
  }

  if (allowed.includes(origin)) return origin;
  return null;
}

function corsHeaders(event, extra = {}) {
  const headers = { ...BASE_CORS, ...extra };
  const origin = resolveCorsOrigin(event);
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

function json(statusCode, body, event, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(event, extraHeaders),
    },
    body: JSON.stringify(body),
  };
}

function handleOptions(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(event), body: "" };
  }
  return null;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

/** @deprecated استخدم corsHeaders(event) */
const CORS_HEADERS = BASE_CORS;

module.exports = {
  json,
  handleOptions,
  parseBody,
  corsHeaders,
  CORS_HEADERS,
  resolveCorsOrigin,
};
