const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { getAdmin, rtdb } = require("./_lib/firebase-admin");
const { getEnvironment } = require("./_lib/monitoring");

/**
 * GET /.netlify/functions/health
 * فحص جاهزية Firebase Admin + RTDB (للمراقبة الخارجية).
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const started = Date.now();
  try {
    getAdmin();
    await rtdb().ref(".info/connected").once("value").catch(() => null);
    await rtdb().ref("admins").limitToFirst(1).once("value");

    return json(
      200,
      {
        ok: true,
        firebase: "connected",
        environment: getEnvironment(),
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      event
    );
  } catch (err) {
    console.error("health:", err.message);
    return json(
      503,
      {
        ok: false,
        firebase: "error",
        environment: getEnvironment(),
        error: "service_unavailable",
      },
      event
    );
  }
});
