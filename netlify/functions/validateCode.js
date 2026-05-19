const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { dataRoot } = require("./_lib/data-root");
const { normalizeCode, CODE_LENGTH } = require("./_lib/codes");
const { rateLimitResponse } = require("./_lib/rate-limit");
const { createSessionToken } = require("./_lib/session-token");

/**
 * GET /.netlify/functions/validateCode?code=XXX&userId=YYY
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const limited = await rateLimitResponse(event, "validateCode");
  if (limited) return limited;

  const code = normalizeCode(event.queryStringParameters?.code);
  const userId = String(event.queryStringParameters?.userId ?? "").trim();

  if (!code || code.length !== CODE_LENGTH) {
    return json(400, { error: `الكود يجب أن يكون ${CODE_LENGTH} أحرفاً` }, event);
  }
  if (!userId || userId.length > 128) {
    return json(400, { error: "معرف المستخدم مطلوب" }, event);
  }

  const limitedUser = await rateLimitResponse(event, "validateCode", userId);
  if (limitedUser) return limitedUser;

  try {
    const ref = dataRoot().child(`codes/${code}`);

    const userBetSnap = await dataRoot()
      .child(`user_bets/${userId}`)
      .once("value");
    if (userBetSnap.exists() && userBetSnap.val()?.code === code) {
      return json(
        403,
        {
          valid: false,
          error: "قدّمت ترشيحاتك لهذا الكود مسبقاً",
          alreadySubmitted: true,
        },
        event
      );
    }

    const result = await ref.transaction((current) => {
      if (!current) return;

      const maxUses = Number(current.maxUses) || 0;
      const usedCount = Number(current.usedCount) || 0;
      const usedBy = current.usedBy || {};

      if (usedBy[userId]?.submitted) return;

      if (usedBy[userId]?.validatedAt) {
        return current;
      }

      if (usedCount >= maxUses) return;

      return {
        ...current,
        usedCount: usedCount + 1,
        usedBy: {
          ...usedBy,
          [userId]: {
            validatedAt: new Date().toISOString(),
            submitted: false,
          },
        },
      };
    });

    const snap = await ref.once("value");
    if (!snap.exists()) {
      return json(404, { valid: false, error: "الكود غير موجود" }, event);
    }

    const data = snap.val();
    const usedBy = data.usedBy || {};

    if (usedBy[userId]?.submitted) {
      return json(
        403,
        {
          valid: false,
          error: "قدّمت ترشيحاتك لهذا الكود مسبقاً",
          alreadySubmitted: true,
        },
        event
      );
    }

    if (!usedBy[userId]?.validatedAt) {
      const remaining = Math.max(
        0,
        (Number(data.maxUses) || 0) - (Number(data.usedCount) || 0)
      );
      return json(
        403,
        {
          valid: false,
          error: "تم استنفاد محاولات هذا الكود",
          remaining,
        },
        event
      );
    }

    const remaining =
      (Number(data.maxUses) || 0) - (Number(data.usedCount) || 0);

    const sessionToken = createSessionToken({ userId, code });

    return json(
      200,
      {
        valid: true,
        code,
        remaining: Math.max(0, remaining),
        usedCount: data.usedCount,
        revalidated: !result.committed,
        sessionToken,
      },
      event
    );
  } catch (err) {
    console.error("validateCode:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
