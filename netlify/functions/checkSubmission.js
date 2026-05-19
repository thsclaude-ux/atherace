const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { dataRoot } = require("./_lib/data-root");
const { normalizeCode, CODE_LENGTH } = require("./_lib/codes");
const { rateLimitResponse } = require("./_lib/rate-limit");

/**
 * GET /.netlify/functions/checkSubmission?code=&userId=
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const limited = await rateLimitResponse(event, "checkSubmission");
  if (limited) return limited;

  const code = normalizeCode(event.queryStringParameters?.code);
  const userId = String(event.queryStringParameters?.userId ?? "").trim();

  if (!code || code.length !== CODE_LENGTH) {
    return json(400, { error: `الكود يجب أن يكون ${CODE_LENGTH} أحرفاً` }, event);
  }
  if (!userId) return json(400, { error: "معرف المستخدم مطلوب" }, event);

  try {
    const root = dataRoot();
    const [betSnap, codeSnap] = await Promise.all([
      root.child(`user_bets/${userId}`).once("value"),
      root.child(`codes/${code}`).once("value"),
    ]);

    const alreadySubmitted =
      betSnap.exists() && betSnap.val()?.code === code;

    const usedBy = codeSnap.val()?.usedBy || {};
    const validated = Boolean(usedBy[userId]?.validatedAt);

    return json(
      200,
      {
        alreadySubmitted,
        validated,
        hasBet: betSnap.exists(),
      },
      event
    );
  } catch (err) {
    console.error("checkSubmission:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
