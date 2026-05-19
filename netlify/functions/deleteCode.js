const { json, handleOptions, parseBody } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin, requireWriteAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");
const { normalizeCode, CODE_LENGTH } = require("./_lib/codes");

/**
 * DELETE /.netlify/functions/deleteCode?code=XXXXXXXX
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "DELETE") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = requireWriteAdmin(await verifyAdmin(event));
  if (!admin.ok) return json(admin.status, { error: admin.error }, event);

  let rawCode = event.queryStringParameters?.code;
  if (!rawCode) {
    const body = parseBody(event);
    if (body?.code) rawCode = body.code;
  }

  const code = normalizeCode(rawCode);
  if (!code || code.length !== CODE_LENGTH) {
    return json(400, { error: `الكود يجب أن يكون ${CODE_LENGTH} أحرفاً` }, event);
  }

  try {
    const ref = dataRoot().child(`codes/${code}`);
    const snap = await ref.once("value");

    if (!snap.exists()) {
      return json(404, { error: "الكود غير موجود" }, event);
    }

    await ref.remove();

    return json(200, { success: true, message: "تم حذف الكود", code }, event);
  } catch (err) {
    console.error("deleteCode:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
