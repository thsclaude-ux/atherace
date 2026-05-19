const { json, handleOptions, parseBody } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { verifyAdmin, requireWriteAdmin } = require("./_lib/verify-admin");
const { dataRoot } = require("./_lib/data-root");
const { randomCode, CODE_LENGTH } = require("./_lib/codes");

const MAX_USES_LIMIT = 1000;
const MAX_COLLISION_RETRIES = 8;

/**
 * POST /.netlify/functions/generateCode
 * Body: { maxUses: number }
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, event);
  }

  const admin = requireWriteAdmin(await verifyAdmin(event));
  if (!admin.ok) return json(admin.status, { error: admin.error }, event);

  const body = parseBody(event);
  if (body === null) return json(400, { error: "JSON غير صالح" }, event);

  const maxUses = parseInt(body.maxUses, 10);
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > MAX_USES_LIMIT) {
    return json(
      400,
      {
        error: `maxUses يجب أن يكون عدداً بين 1 و ${MAX_USES_LIMIT}`,
      },
      event
    );
  }

  try {
    const codesRef = dataRoot().child("codes");
    let code = null;

    for (let i = 0; i < MAX_COLLISION_RETRIES; i++) {
      const candidate = randomCode(CODE_LENGTH);
      const snap = await codesRef.child(candidate).once("value");
      if (!snap.exists()) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return json(500, { error: "تعذر إنشاء كود فريد، حاول مجدداً" }, event);
    }

    const createdAt = new Date().toISOString();
    const record = {
      maxUses,
      usedCount: 0,
      usedBy: {},
      createdAt,
      createdBy: admin.uid,
    };

    await codesRef.child(code).set(record);

    return json(
      201,
      {
        success: true,
        code,
        maxUses,
        usedCount: 0,
        createdAt,
      },
      event
    );
  } catch (err) {
    console.error("generateCode:", err);
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
