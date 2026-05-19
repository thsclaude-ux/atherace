const { json, handleOptions } = require("./_lib/http");
const { wrapHandler } = require("./_lib/wrap-handler");
const { auth, rtdb } = require("./_lib/firebase-admin");
const { guardCreateAdminRequest } = require("./_lib/guard-create-admin");
const { createFirstAdmin } = require("./_lib/first-admin");

/**
 * POST أو GET /.netlify/functions/createFirstAdmin?secret=...
 *
 * إنشاء أول مسؤول مرة واحدة فقط (عندما /admins فارغ).
 * محمي بـ CREATE_ADMIN_SECRET (واختيارياً CREATE_ADMIN_ALLOWED_IP).
 *
 * متغيرات البيئة:
 * - FIREBASE_ADMIN_EMAIL (افتراضي: admin@risk7.com)
 * - FIREBASE_ADMIN_PASSWORD (اختياري — إن وُجد لا يُعاد في الاستجابة)
 * - CREATE_ADMIN_SECRET (مطلوب)
 */
exports.handler = wrapHandler(async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed — استخدم POST فقط" }, event);
  }

  const guard = guardCreateAdminRequest(event);
  if (guard) return json(guard.status, { error: guard.error }, event);

  try {
    const result = await createFirstAdmin({ auth: auth(), rtdb: rtdb() });

    if (result.alreadyExists) {
      return json(
        409,
        {
          success: false,
          message: "يوجد مسؤول (مسؤولون) مسبقاً — لا يمكن إنشاء مسؤول أول مرة أخرى",
          adminCount: result.adminCount,
        },
        event
      );
    }

    const response = {
      success: true,
      message: "تم إنشاء المسؤول الأول بنجاح",
      email: result.email,
      uid: result.uid,
      createdAt: result.createdAt,
    };

    if (result.password) {
      response.password = result.password;
      response.warning =
        "احفظ كلمة المرور الآن — لن تُعرض مرة أخرى عبر هذه الدالة";
    } else if (result.usedEnvPassword) {
      response.hint =
        "تم استخدام كلمة المرور من FIREBASE_ADMIN_PASSWORD — راجع متغيرات Netlify";
    }

    return json(201, response, event);
  } catch (err) {
    console.error("createFirstAdmin:", err);
    if (err.code === "auth/email-already-exists") {
      return json(
        409,
        {
          success: false,
          error:
            "البريد مسجّل في Firebase Auth لكنه غير موجود في /admins — أضف UID يدوياً أو احذف المستخدم من Console",
        },
        event
      );
    }
    return json(500, { error: "خطأ في الخادم" }, event);
  }
});
