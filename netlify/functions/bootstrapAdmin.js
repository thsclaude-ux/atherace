const { json, handleOptions, parseBody } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin, requireWriteAdmin } = require("./_lib/verify-admin");
const { rtdb } = require("./_lib/firebase-admin");

function isProductionContext() {
  return (
    process.env.CONTEXT === "production" ||
    process.env.NETLIFY_CONTEXT === "production"
  );
}

/**
 * POST /.netlify/functions/bootstrapAdmin
 * Body: { targetUid } + رأس X-Bootstrap-Secret أو مسؤول مسجّل
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const body = parseBody(event);
  if (body === null) return json(400, { error: "JSON غير صالح" }, event);

  const { targetUid } = body;
  if (!targetUid || typeof targetUid !== "string") {
    return json(400, { error: "targetUid مطلوب" }, event);
  }

  const bootstrapSecret = process.env.BOOTSTRAP_SECRET?.trim();
  const headerSecret =
    event.headers["x-bootstrap-secret"] || event.headers["X-Bootstrap-Secret"];

  let authorized = false;

  if (bootstrapSecret && headerSecret === bootstrapSecret) {
    authorized = true;
  } else {
    const admin = requireWriteAdmin(await verifyAdmin(event));
    if (admin.ok) {
      authorized = true;
    } else if (isProductionContext() && !bootstrapSecret) {
      return json(
        403,
        {
          error:
            "على الإنتاج: سجّل دخول مسؤول أو عيّن BOOTSTRAP_SECRET في متغيرات Netlify",
        },
        event
      );
    }
  }

  if (!authorized) {
    return json(403, { error: "غير مصرح" }, event);
  }

  try {
    await rtdb().ref(`admins/${targetUid}`).set(true);
    return json(
      200,
      { success: true, message: "تمت إضافة المسؤول", uid: targetUid },
      event
    );
  } catch (err) {
    console.error("bootstrapAdmin:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
