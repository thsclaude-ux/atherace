const { captureException, flushMonitoring } = require("./monitoring");
const { json } = require("./http");

/**
 * يلتقط الأخطاء غير المعالجة ويرسلها إلى Sentry (إن وُجد SENTRY_DSN).
 */
function wrapHandler(handler) {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (err) {
      console.error(`[${event?.path || "function"}]`, err);
      captureException(err, event);
      await flushMonitoring();
      return json(500, { error: "خطأ في الخادم" }, event);
    }
  };
}

module.exports = { wrapHandler };
