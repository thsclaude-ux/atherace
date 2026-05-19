const { parseBody } = require("./http");
const { getClientIp } = require("./client-ip");

/**
 * يتحقق من CREATE_ADMIN_SECRET (رأس أو جسم POST فقط — لا query string)
 * و(اختيارياً) CREATE_ADMIN_ALLOWED_IP
 * @returns {null | { status: number, error: string }}
 */
function guardCreateAdminRequest(event) {
  const expected = process.env.CREATE_ADMIN_SECRET;
  if (!expected) {
    return {
      status: 503,
      error: "CREATE_ADMIN_SECRET غير مُعرّف على الخادم",
    };
  }

  if (event.queryStringParameters?.secret) {
    return {
      status: 400,
      error: "لا تمرّر السر في عنوان URL — استخدم الرأس X-Create-Admin-Secret",
    };
  }

  const body =
    event.httpMethod === "POST" && event.body ? parseBody(event) : null;
  const provided =
    event.headers["x-create-admin-secret"] ||
    event.headers["X-Create-Admin-Secret"] ||
    (body && typeof body === "object" ? body.secret : null);

  if (!provided || provided !== expected) {
    return { status: 403, error: "غير مصرح — مفتاح CREATE_ADMIN_SECRET غير صحيح" };
  }

  const allowedIp = process.env.CREATE_ADMIN_ALLOWED_IP;
  if (allowedIp) {
    const ip = getClientIp(event);
    if (!ip || ip !== allowedIp.trim()) {
      return { status: 403, error: "عنوان IP غير مسموح" };
    }
  }

  return null;
}

module.exports = { guardCreateAdminRequest, getClientIp };
